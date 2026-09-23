-- Devuelve la lista de referidos del usuario actual (nombre del amigo, estado, fecha de
-- recompensa) sin exponer el resto de su perfil, saltándose RLS de forma controlada
-- (SECURITY DEFINER) solo para este dato concreto.
CREATE OR REPLACE FUNCTION public.get_my_referrals()
RETURNS TABLE(referred_display_name text, status text, rewarded_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  return query
    select p.display_name, r.status, r.rewarded_at
    from referrals r
    join profiles p on p.id = r.referred_id
    where r.referrer_id = v_user_id
    order by r.created_at asc;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.get_my_referrals() TO authenticated;