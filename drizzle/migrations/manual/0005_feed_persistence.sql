-- 0003_feed_persistence.sql
-- Feed persistido: publicación con Aura aplicada en servidor, votos y lectura agregada.

-- 1. Publicar prueba: puntos derivados de la categoría, multiplicador del perfil,
--    límite diario para cuentas sin pass y suma atómica de Aura.
create or replace function public.create_post(
  p_action text,
  p_detail text,
  p_category text
)
returns table (post_id uuid, applied_points integer, new_aura integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_action text := btrim(coalesce(p_action, ''));
  v_detail text := btrim(coalesce(p_detail, ''));
  v_base integer;
  v_multiplier integer;
  v_pass boolean;
  v_today_count integer;
  v_points integer;
  v_post_id uuid;
  v_new_aura integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if char_length(v_action) = 0 or char_length(v_action) > 140 then
    raise exception 'invalid_action';
  end if;

  if char_length(v_detail) > 280 then
    raise exception 'invalid_detail';
  end if;

  if p_category is null or p_category not in ('Disciplina', 'Coraje', 'Karma', 'Desliz') then
    raise exception 'invalid_category';
  end if;

  v_base := case when p_category = 'Desliz' then -120 else 120 end;

  select pr.multiplier, pr.pass_active
    into v_multiplier, v_pass
  from profiles pr
  where pr.id = v_uid
  for update;

  if not found then
    raise exception 'profile_not_found';
  end if;

  if not coalesce(v_pass, false) then
    select count(*)
      into v_today_count
    from aura_posts ap
    where ap.user_id = v_uid
      and ap.created_at >= (date_trunc('day', now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid');

    if v_today_count >= 3 then
      raise exception 'daily_limit_reached';
    end if;
  end if;

  v_points := v_base * greatest(coalesce(v_multiplier, 1), 1);

  insert into aura_posts (user_id, action, detail, points, category)
  values (v_uid, v_action, v_detail, v_points, p_category)
  returning id into v_post_id;

  update profiles
     set aura = greatest(0, aura + v_points)
   where id = v_uid
  returning aura into v_new_aura;

  return query select v_post_id, v_points, v_new_aura;
end;
$$;

-- 2. Votar / cambiar voto / quitar voto (p_vote = null). Devuelve contadores actualizados.
create or replace function public.set_post_vote(
  p_post_id uuid,
  p_vote text
)
returns table (votes_real integer, votes_cap integer, my_vote text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_author uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_vote is not null and p_vote not in ('real', 'cap') then
    raise exception 'invalid_vote';
  end if;

  select ap.user_id
    into v_author
  from aura_posts ap
  where ap.id = p_post_id;

  if not found then
    raise exception 'post_not_found';
  end if;

  if v_author = v_uid then
    raise exception 'own_post';
  end if;

  if p_vote is null then
    delete from post_votes pv
    where pv.post_id = p_post_id
      and pv.user_id = v_uid;
  else
    insert into post_votes (post_id, user_id, vote)
    values (p_post_id, v_uid, p_vote)
    on conflict (post_id, user_id)
    do update set vote = excluded.vote, created_at = now();
  end if;

  return query
  select
    (select count(*) from post_votes pv where pv.post_id = p_post_id and pv.vote = 'real')::integer,
    (select count(*) from post_votes pv where pv.post_id = p_post_id and pv.vote = 'cap')::integer,
    (select pv.vote from post_votes pv where pv.post_id = p_post_id and pv.user_id = v_uid);
end;
$$;

-- 3. Lectura del feed con autor, contadores agregados y voto propio.
create or replace function public.get_feed(p_limit integer default 50)
returns table (
  id uuid,
  user_id uuid,
  author_name text,
  author_handle text,
  author_aura integer,
  action text,
  detail text,
  points integer,
  category text,
  created_at timestamptz,
  votes_real integer,
  votes_cap integer,
  my_vote text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.user_id,
    coalesce(pr.display_name, 'Aura Farmer'),
    coalesce(pr.handle, 'aura'),
    coalesce(pr.aura, 0),
    p.action,
    p.detail,
    p.points,
    p.category,
    p.created_at,
    (select count(*) from post_votes v where v.post_id = p.id and v.vote = 'real')::integer,
    (select count(*) from post_votes v where v.post_id = p.id and v.vote = 'cap')::integer,
    (select v.vote from post_votes v where v.post_id = p.id and v.user_id = auth.uid())
  from aura_posts p
  left join profiles pr on pr.id = p.user_id
  where auth.uid() is not null
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

-- 4. Permisos: solo usuarios autenticados.
revoke all on function public.create_post(text, text, text) from public, anon;
revoke all on function public.set_post_vote(uuid, text) from public, anon;
revoke all on function public.get_feed(integer) from public, anon;

grant execute on function public.create_post(text, text, text) to authenticated;
grant execute on function public.set_post_vote(uuid, text) to authenticated;
grant execute on function public.get_feed(integer) to authenticated;