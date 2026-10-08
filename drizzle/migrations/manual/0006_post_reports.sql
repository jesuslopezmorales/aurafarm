-- 0006_post_reports.sql
-- Reportes de contenido: tabla con RLS, RPC report_post con umbral de ocultación y
-- get_feed que excluye posts ocultos y los ya reportados por el usuario actual.

-- 1. Marca de ocultación en los posts (el post no se borra, queda para revisión manual).
alter table public.aura_posts
  add column if not exists hidden_at timestamptz;

-- 2. Tabla de reportes: un reporte por usuario y post.
create table if not exists public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.aura_posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('spam', 'ofensivo', 'falso', 'otro')),
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

create index if not exists post_reports_post_id_idx on public.post_reports (post_id);

alter table public.post_reports enable row level security;

-- Cada usuario solo ve sus propios reportes. Sin políticas de INSERT/UPDATE/DELETE:
-- la escritura solo es posible a través de report_post (SECURITY DEFINER).
drop policy if exists "Users can see their own reports" on public.post_reports;
create policy "Users can see their own reports"
  on public.post_reports for select
  using (auth.uid() = reporter_id);

-- 3. Reportar un post. Al llegar al umbral se oculta y, si había sumado Aura positiva,
--    se le resta al autor. Devuelve el número de reportes y si el post quedó oculto.
create or replace function public.report_post(
  p_post_id uuid,
  p_reason text
)
returns table (report_count integer, hidden boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_threshold constant integer := 3;
  v_author uuid;
  v_points integer;
  v_hidden_at timestamptz;
  v_rows integer;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_reason is null or p_reason not in ('spam', 'ofensivo', 'falso', 'otro') then
    raise exception 'invalid_reason';
  end if;

  select ap.user_id, ap.points, ap.hidden_at
    into v_author, v_points, v_hidden_at
  from aura_posts ap
  where ap.id = p_post_id
  for update;

  if not found then
    raise exception 'post_not_found';
  end if;

  if v_author = v_uid then
    raise exception 'own_post';
  end if;

  insert into post_reports (post_id, reporter_id, reason)
  values (p_post_id, v_uid, p_reason)
  on conflict (post_id, reporter_id) do nothing;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'already_reported';
  end if;

  select count(*)::integer
    into v_count
  from post_reports pr
  where pr.post_id = p_post_id;

  if v_hidden_at is null and v_count >= v_threshold then
    update aura_posts
       set hidden_at = now()
     where id = p_post_id;

    if v_points > 0 then
      update profiles
         set aura = greatest(0, aura - v_points)
       where id = v_author;
    end if;

    v_hidden_at := now();
  end if;

  return query select v_count, v_hidden_at is not null;
end;
$$;

-- 4. get_feed: misma firma que en 0005, excluyendo posts ocultos y los reportados
--    por el usuario actual.
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
    and p.hidden_at is null
    and not exists (
      select 1
      from post_reports r
      where r.post_id = p.id
        and r.reporter_id = auth.uid()
    )
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

-- 5. Permisos: solo usuarios autenticados.
revoke all on function public.report_post(uuid, text) from public, anon;
revoke all on function public.get_feed(integer) from public, anon;

grant execute on function public.report_post(uuid, text) to authenticated;
grant execute on function public.get_feed(integer) to authenticated;