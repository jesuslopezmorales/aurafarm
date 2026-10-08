-- 0010_unique_handles.sql
-- Handles únicos en profiles: normalización, generación automática y unicidad garantizada.

-- 1. Normaliza y garantiza unicidad en cada alta o cambio de handle.
create or replace function public.ensure_unique_handle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_candidate text;
begin
  v_base := lower(coalesce(new.handle, ''));
  v_base := regexp_replace(v_base, '^@+', '');
  v_base := regexp_replace(v_base, '[^a-z0-9_]', '', 'g');
  v_base := left(v_base, 24);

  if v_base = '' or v_base = 'aura' then
    v_base := 'aura' || left(replace(new.id::text, '-', ''), 8);
  end if;

  v_candidate := v_base;

  while exists (
    select 1
    from profiles p
    where lower(p.handle) = v_candidate
      and p.id <> new.id
  ) loop
    v_candidate := left(v_base, 19) || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 4);
  end loop;

  new.handle := v_candidate;
  return new;
end;
$$;

drop trigger if exists profiles_ensure_unique_handle on public.profiles;
create trigger profiles_ensure_unique_handle
  before insert or update of handle on public.profiles
  for each row
  execute function public.ensure_unique_handle();

-- 2. Reasigna handles repetidos o genéricos existentes. En cada grupo de repetidos se
--    conserva el del perfil más antiguo, salvo que sea 'aura'. Al poner handle = null,
--    el trigger genera el valor definitivo.
with ranked as (
  select
    id,
    lower(handle) as h,
    row_number() over (partition by lower(handle) order by created_at, id) as rn
  from public.profiles
)
update public.profiles p
   set handle = null
  from ranked r
 where r.id = p.id
   and (r.h = 'aura' or r.h is null or r.h = '' or r.rn > 1);

-- 3. Unicidad garantizada por la base de datos (sin distinguir mayúsculas).
create unique index if not exists profiles_handle_lower_unique
  on public.profiles (lower(handle));