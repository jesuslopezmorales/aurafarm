import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { getStripe } = await import("./stripe.server");
    const stripe = getStripe();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    const customerId = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      throw new Error("NO_STRIPE_CUSTOMER");
    }

    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const origin =
      request?.headers.get("origin") ??
      (request?.url ? new URL(request.url).origin : "http://localhost:8080");

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/aura-pass`,
    });

    return { url: session.url };
  });
  