-- 0007_pass_expiration.sql
-- Expiración automática del pass gratis de 30 días del sistema de referidos.
-- Requiere la extensión pg_cron (create extension if not exists pg_cron;).

-- 1. apply_stripe_pass limpia pass_expires_at, para que un pass pagado nunca se
--    expire por fecha (caso: usuario con pass gratis de referido que se suscribe).
--    Se parchea la definición desplegada en lugar de reescribirla, para no exponer
--    el secreto STRIPE_RPC_SECRET que contiene. Idempotente.
do $$
declare
  v_def text;
  v_new text;
begin
  v_def := pg_get_functiondef('public.apply_stripe_pass(text, text, boolean, numeric)'::regprocedure);

  if position('pass_expires_at' in v_def) > 0 then
    raise notice 'apply_stripe_pass ya limpia pass_expires_at, sin cambios';
    return;
  end if;

  v_new := regexp_replace(
    v_def,
    'multiplier\s*=\s*CASE\s+WHEN\s+p_active\s+THEN\s+p_multiplier\s+ELSE\s+1\s+END',
    '\&,
      pass_expires_at = NULL',
    'i'
  );

  if v_new = v_def then
    raise exception 'apply_stripe_pass: no se encontró la línea de multiplier esperada, parche no aplicado';
  end if;

  execute v_new;
end;
$$;

-- 2. Expira los pases gratis vencidos. Devuelve el número de perfiles afectados.
create or replace function public.expire_free_passes()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  update profiles
     set pass_active = false,
         multiplier = 1,
         pass_expires_at = null
   where pass_expires_at is not null
     and pass_expires_at <= now();

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function public.expire_free_passes() from public, anon, authenticated;

-- 3. Job horario (minuto 7). Se elimina antes si ya existía para que sea idempotente.
select cron.unschedule(jobid)
from cron.job
where jobname = 'expire-free-passes';

select cron.schedule(
  'expire-free-passes',
  '7 * * * *',
  $cron$select public.expire_free_passes();$cron$
);