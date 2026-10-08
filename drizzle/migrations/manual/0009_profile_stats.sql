-- 0009_profile_stats.sql
-- Estadísticas reales del Perfil: Aura neta de la semana actual y número de pruebas.
-- week_aura = puntos de pruebas propias (ya multiplicados en create_post) +
--             puntos de hábitos/deslices registrados × multiplicador actual,
--             desde el lunes de la semana de p_today.
-- proofs_count = pruebas propias no ocultas por reportes.

create or replace function public.get_my_stats(p_today date)
returns table (week_aura integer, proofs_count integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_week_start date := date_trunc('week', p_today)::date;
  v_multiplier numeric;
  v_posts_week integer;
  v_habits_week integer;
  v_proofs integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select coalesce(pr.multiplier, 1)
    into v_multiplier
  from profiles pr
  where pr.id = v_uid;

  select coalesce(sum(ap.points), 0)::integer
    into v_posts_week
  from aura_posts ap
  where ap.user_id = v_uid
    and ap.hidden_at is null
    and (ap.created_at at time zone 'Europe/Madrid')::date between v_week_start and p_today;

  select coalesce(sum(round(h.points * coalesce(v_multiplier, 1))), 0)::integer
    into v_habits_week
  from habit_logs hl
  join habits h on h.id = hl.habit_id
  where hl.user_id = v_uid
    and hl.logged_on between v_week_start and p_today;

  select count(*)::integer
    into v_proofs
  from aura_posts ap
  where ap.user_id = v_uid
    and ap.hidden_at is null;

  return query select v_posts_week + v_habits_week, v_proofs;
end;
$$;

revoke all on function public.get_my_stats(date) from public, anon;
grant execute on function public.get_my_stats(date) to authenticated;