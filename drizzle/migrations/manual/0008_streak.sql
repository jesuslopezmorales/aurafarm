-- 0008_streak.sql
-- Racha = días consecutivos con al menos un hábito (kind = 'habit') registrado.
-- Se mantiene si el último día con hábito es hoy o ayer; si es anterior, vale 0.

-- 1. Cálculo de la racha a partir de habit_logs. Uso interno.
create or replace function public.compute_streak(p_user_id uuid, p_today date)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select distinct hl.logged_on as d
    from habit_logs hl
    join habits h on h.id = hl.habit_id
    where hl.user_id = p_user_id
      and h.kind = 'habit'
      and hl.logged_on <= p_today
  ),
  anchor as (
    select case
      when exists (select 1 from days where d = p_today) then p_today
      when exists (select 1 from days where d = p_today - 1) then p_today - 1
    end as a
  ),
  ordered as (
    select days.d, row_number() over (order by days.d desc) as rn
    from days, anchor
    where anchor.a is not null
      and days.d <= anchor.a
  )
  select coalesce(
    (select count(*) from ordered o, anchor where o.d = anchor.a - (o.rn - 1)::integer),
    0
  )::integer;
$$;

revoke all on function public.compute_streak(uuid, date) from public, anon, authenticated;

-- 2. toggle_habit: igual que en 0002 (incluido el disparo del referido), más el
--    recálculo de la racha. Cambia el tipo de retorno, por eso se elimina antes.
drop function if exists public.toggle_habit(uuid, boolean, date);

create function public.toggle_habit(p_habit_id uuid, p_done boolean, p_logged_on date)
returns table(new_aura integer, new_streak integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_points int;
  v_multiplier numeric;
  v_delta int;
  v_new_aura int;
  v_new_streak int;
  v_had_logs_before boolean;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select points into v_points from habits where id = p_habit_id and user_id = v_user_id;
  if not found then
    raise exception 'habit not found or not owned by user';
  end if;

  select multiplier into v_multiplier from profiles where id = v_user_id;

  v_delta := round(v_points * coalesce(v_multiplier, 1)) * case when p_done then 1 else -1 end;

  if p_done then
    select exists(select 1 from habit_logs where user_id = v_user_id) into v_had_logs_before;

    insert into habit_logs (habit_id, user_id, logged_on)
    values (p_habit_id, v_user_id, p_logged_on)
    on conflict (habit_id, logged_on) do nothing;

    if not v_had_logs_before then
      perform complete_referral_if_pending(v_user_id);
    end if;
  else
    delete from habit_logs
    where habit_id = p_habit_id and user_id = v_user_id and logged_on = p_logged_on;
  end if;

  update profiles
  set aura = greatest(0, aura + v_delta),
      streak = compute_streak(v_user_id, p_logged_on)
  where id = v_user_id
  returning aura, streak into v_new_aura, v_new_streak;

  return query select v_new_aura, v_new_streak;
end;
$function$;

revoke all on function public.toggle_habit(uuid, boolean, date) from public, anon;
grant execute on function public.toggle_habit(uuid, boolean, date) to authenticated;

-- 3. Recalcula y devuelve la racha del usuario actual (se llama al cargar el perfil).
create or replace function public.refresh_my_streak(p_today date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_streak integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  update profiles
     set streak = compute_streak(v_uid, p_today)
   where id = v_uid
  returning streak into v_streak;

  return coalesce(v_streak, 0);
end;
$$;

revoke all on function public.refresh_my_streak(date) from public, anon;
grant execute on function public.refresh_my_streak(date) to authenticated;

-- 4. Recalcula la racha de todos los perfiles existentes (fecha de Madrid).
update public.profiles
   set streak = public.compute_streak(id, (now() at time zone 'Europe/Madrid')::date);