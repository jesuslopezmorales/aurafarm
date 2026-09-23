-- Paso D del sistema de referidos: RPCs protegidas por el mismo secreto compartido que
-- apply_stripe_pass (STRIPE_RPC_SECRET), para que el servidor pueda leer y marcar las
-- recompensas de referido pendientes de aplicar como cupón de Stripe, sin exponer
-- stripe_customer_id ni la tabla referrals a clientes anónimos.
--
-- IMPORTANTE: sustituir REEMPLAZA_CON_EL_SECRETO por el valor real de STRIPE_RPC_SECRET
-- (el mismo que ya usa apply_stripe_pass) antes de ejecutar este SQL. No commitear el
-- valor real.

CREATE OR REPLACE FUNCTION public.get_pending_stripe_coupons(p_secret text)
RETURNS TABLE(referral_id uuid, stripe_customer_id text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_secret IS DISTINCT FROM 'REEMPLAZA_CON_EL_SECRETO' THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '28000';
  END IF;

  RETURN QUERY
    SELECT r.id, p.stripe_customer_id
    FROM referrals r
    JOIN profiles p ON p.id = r.referrer_id
    WHERE r.status = 'completed' AND r.reward_type = 'stripe_coupon_pending';
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_pending_stripe_coupons(text) TO anon, service_role;

CREATE OR REPLACE FUNCTION public.mark_referral_stripe_rewarded(p_secret text, p_referral_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_secret IS DISTINCT FROM 'REEMPLAZA_CON_EL_SECRETO' THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '28000';
  END IF;

  UPDATE referrals
  SET status = 'rewarded', reward_type = 'stripe_coupon_applied', rewarded_at = now()
  WHERE id = p_referral_id;
END;
$function$;