-- Sistema de referidos: código único por usuario, tabla de seguimiento, y recompensa
-- automática al completar. Ver aurafarm_session.md (23.09.26) para el diseño completo.

ALTER TABLE public.profiles
  ADD COLUMN referral_code text UNIQUE,
  ADD COLUMN referred_by_code text,
  ADD COLUMN pass_expires_at timestamptz;

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id),
  referred_id uuid NOT NULL REFERENCES public.profiles(id) UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_type text CHECK (reward_type IN ('free_pass_30d', 'stripe_coupon_pending', 'stripe_coupon_applied')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  rewarded_at timestamptz
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see referrals where they are the referrer"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Devuelve el código de referido del usuario actual, generándolo si no existe.
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing text;
  v_code text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT referral_code INTO v_existing FROM profiles WHERE id = v_user_id;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  LOOP
    v_code := upper(substr(md5(random()::text || v_user_id::text || clock_timestamp()::text), 1, 7));
    BEGIN
      UPDATE profiles SET referral_code = v_code WHERE id = v_user_id;
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      -- código duplicado (muy improbable): reintenta con uno nuevo
    END;
  END LOOP;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_or_create_referral_code() TO authenticated;

-- Aplica un código de referido al usuario actual. Se llama una sola vez, justo tras crear
-- su perfil (registro). Idempotente: si ya tiene un código aplicado, no hace nada.
CREATE OR REPLACE FUNCTION public.apply_referral_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_referrer_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT id INTO v_referrer_id FROM profiles WHERE referral_code = upper(p_code);

  IF v_referrer_id IS NULL OR v_referrer_id = v_user_id THEN
    RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND referred_by_code IS NOT NULL) THEN
    RETURN false;
  END IF;

  UPDATE profiles SET referred_by_code = upper(p_code) WHERE id = v_user_id;

  INSERT INTO referrals (referrer_id, referred_id, status)
  VALUES (v_referrer_id, v_user_id, 'pending')
  ON CONFLICT (referred_id) DO NOTHING;

  RETURN true;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.apply_referral_code(text) TO authenticated;

-- Marca como completado el referido pendiente del usuario indicado (si existe) y aplica
-- la recompensa al referidor: pass gratis de 30 días si es usuario gratuito, o deja
-- marcado 'stripe_coupon_pending' si ya es suscriptor de pago real (lo procesa el Paso D
-- vía Stripe API, ya que Postgres no puede llamar a Stripe directamente). Límite de 1
-- recompensa por referidor.
CREATE OR REPLACE FUNCTION public.complete_referral_if_pending(p_referred_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_referral referrals%ROWTYPE;
  v_referrer_paid boolean;
  v_already_rewarded_count int;
BEGIN
  SELECT * INTO v_referral FROM referrals
  WHERE referred_id = p_referred_id AND status = 'pending'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT count(*) INTO v_already_rewarded_count
  FROM referrals
  WHERE referrer_id = v_referral.referrer_id AND status = 'rewarded';

  IF v_already_rewarded_count >= 1 THEN
    UPDATE referrals SET status = 'completed', completed_at = now() WHERE id = v_referral.id;
    RETURN;
  END IF;

  SELECT (pass_active AND pass_expires_at IS NULL AND stripe_customer_id IS NOT NULL)
    INTO v_referrer_paid
  FROM profiles WHERE id = v_referral.referrer_id;

  IF v_referrer_paid THEN
    UPDATE referrals
    SET status = 'completed', completed_at = now(),
        reward_type = 'stripe_coupon_pending'
    WHERE id = v_referral.id;
  ELSE
    UPDATE profiles
    SET pass_active = true,
        multiplier = 2,
        pass_expires_at = now() + interval '30 days'
    WHERE id = v_referral.referrer_id;

    UPDATE referrals
    SET status = 'rewarded', completed_at = now(), rewarded_at = now(),
        reward_type = 'free_pass_30d'
    WHERE id = v_referral.id;
  END IF;
END;
$function$;

-- toggle_habit dispara la finalización del referido en la primera acción real del
-- usuario referido (su primer habit_log, marcar o desmarcar un hábito por primera vez).
CREATE OR REPLACE FUNCTION public.toggle_habit(p_habit_id uuid, p_done boolean, p_logged_on date)
RETURNS TABLE(new_aura integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_points int;
  v_multiplier numeric;
  v_delta int;
  v_new_aura int;
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
  set aura = greatest(0, aura + v_delta)
  where id = v_user_id
  returning aura into v_new_aura;

  return query select v_new_aura;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.toggle_habit(uuid, boolean, date) TO authenticated;