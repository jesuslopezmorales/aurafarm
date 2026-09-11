import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PlanId = "plus" | "master";

export const createCheckoutSession = createServerFn({ method: "POST" })
  .validator((data: unknown): { planId: PlanId } => {
    const planId = (data as { planId?: unknown } | undefined)?.planId;
    if (planId !== "plus" && planId !== "master") {
      throw new Error("Invalid planId");
    }
    return { planId };
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { planId } = data;
    const { supabase, userId, claims } = context;
    const { getStripe, AURA_PASS_PRICE_ID, AURA_MASTER_PRICE_ID } = await import("./stripe.server");
    const stripe = getStripe();

    const priceId = planId === "master" ? AURA_MASTER_PRICE_ID : AURA_PASS_PRICE_ID;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, stripe_customer_id, display_name")
      .eq("id", userId)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      const email = typeof claims.email === "string" ? claims.email : undefined;
      const customer = await stripe.customers.create({
        ...(email ? { email } : {}),
        ...(profile?.display_name ? { name: profile.display_name } : {}),
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const origin =
      request?.headers.get("origin") ??
      (request?.url ? new URL(request.url).origin : "http://localhost:8080");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      subscription_data: { metadata: { supabase_user_id: userId } },
      success_url: `${origin}/aura-pass?checkout=success`,
      cancel_url: `${origin}/aura-pass?checkout=cancel`,
    });

    return { url: session.url };
  });
