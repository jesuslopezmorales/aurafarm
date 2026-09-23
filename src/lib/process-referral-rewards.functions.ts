import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // Las claves nuevas de Supabase son cadenas opacas, no JWT bearer.
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function getRpcClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY");
  }

  return createClient(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

type PendingCoupon = { referral_id: string; stripe_customer_id: string | null };

/**
 * Procesa las recompensas de referidos pendientes de aplicar como cupón de Stripe
 * (referidores que ya son suscriptores de pago cuando su amigo referido completa su
 * primera acción). Se llama en "fire and forget" desde el cliente tras cada toggle_habit
 * exitoso; procesa todas las filas pendientes en ese momento, no solo las del usuario
 * que la disparó. Ver drizzle/migrations/manual/0004_referral_stripe_coupons.sql.
 */
export const processReferralRewards = createServerFn({ method: "POST" }).handler(async () => {
  const rpcSecret = process.env["STRIPE_RPC_SECRET"];
  if (!rpcSecret) {
    console.error("[process-referral-rewards] Missing STRIPE_RPC_SECRET");
    return { processed: 0 };
  }

  const client = getRpcClient();

  const { data, error } = await client.rpc("get_pending_stripe_coupons", { p_secret: rpcSecret });
  if (error) {
    console.error("[process-referral-rewards] get_pending_stripe_coupons", error.message);
    return { processed: 0 };
  }

  const pending = (data ?? []) as PendingCoupon[];
  if (pending.length === 0) {
    return { processed: 0 };
  }

  const { getStripe } = await import("./stripe.server");
  const stripe = getStripe();

  let processed = 0;

  for (const row of pending) {
    if (!row.stripe_customer_id) continue;
    try {
      const subs = await stripe.subscriptions.list({
        customer: row.stripe_customer_id,
        status: "active",
        limit: 1,
      });
      const subscription = subs.data[0];
      if (!subscription) continue;

      const coupon = await stripe.coupons.create({
        duration: "once",
        percent_off: 100,
        max_redemptions: 1,
        name: "AuraFarm — recompensa por referido",
      });

      await stripe.subscriptions.update(subscription.id, {
        discounts: [{ coupon: coupon.id }],
      });

      const { error: markError } = await client.rpc("mark_referral_stripe_rewarded", {
        p_secret: rpcSecret,
        p_referral_id: row.referral_id,
      });
      if (markError) {
        console.error("[process-referral-rewards] mark_referral_stripe_rewarded", markError.message);
        continue;
      }

      processed += 1;
    } catch (err) {
      console.error("[process-referral-rewards] stripe error for referral", row.referral_id, err);
    }
  }

  return { processed };
});