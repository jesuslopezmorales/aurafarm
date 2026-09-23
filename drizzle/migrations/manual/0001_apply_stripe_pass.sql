-- Función RPC usada por el webhook de Stripe (src/routes/api/public/stripe-webhook.ts)
-- para actualizar profiles.pass_active / multiplier sin necesitar la service role key
-- (no accesible en Vercel). Protegida con un secreto compartido (STRIPE_RPC_SECRET
-- en Vercel Production) comparado dentro de la función.
--
-- IMPORTANTE: sustituir REEMPLAZA_CON_EL_SECRETO por el valor real de
-- STRIPE_RPC_SECRET antes de ejecutar este SQL en un entorno nuevo. El valor
-- real NO debe commitearse.

CREATE OR REPLACE FUNCTION public.apply_stripe_pass(
  p_secret text,
  p_customer_id text,
  p_active boolean,
  p_multiplier numeric
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rows integer;
BEGIN
  IF p_secret IS DISTINCT FROM 'REEMPLAZA_CON_EL_SECRETO' THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '28000';
  END IF;

  UPDATE public.profiles
  SET pass_active = p_active,
      multiplier = CASE WHEN p_active THEN p_multiplier ELSE 1 END
  WHERE stripe_customer_id = p_customer_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$function$;

REVOKE ALL ON FUNCTION public.apply_stripe_pass(text, text, boolean, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_stripe_pass(text, text, boolean, numeric) TO anon, service_role;