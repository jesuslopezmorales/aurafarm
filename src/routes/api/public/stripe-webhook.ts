import { createFileRoute } from "@tanstack/react-router";
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

async function setPass(customerId: string, active: boolean, multiplier: number): Promise<void> {
  const rpcSecret = process.env["STRIPE_RPC_SECRET"];
  if (!rpcSecret) throw new Error("Missing STRIPE_RPC_SECRET");

  const { data, error } = await getRpcClient().rpc("apply_stripe_pass", {
    p_secret: rpcSecret,
    p_customer_id: customerId,
    p_active: active,
    p_multiplier: multiplier,
  });

  if (error) {
    throw new Error(`apply_stripe_pass failed: ${error.message}`);
  }

  const updatedRows = typeof data === "number" ? data : 0;
  if (updatedRows === 0) {
    console.error("[stripe-webhook] no profile matched stripe_customer_id", customerId);
  }
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!secret) return new Response("Missing webhook secret", { status: 500 });

        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });

        const body = await request.text();
        const { getStripe, stripeCryptoProvider, PLAN_MULTIPLIERS } = await import("@/lib/stripe.server");
        const stripe = getStripe();

        let event;
        try {
          event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            secret,
            undefined,
            stripeCryptoProvider,
          );
        } catch {
          return new Response("Invalid signature", { status: 400 });
        }

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object;
              const customerId =
                typeof session.customer === "string" ? session.customer : session.customer?.id;
              const subscriptionId =
                typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
              if (customerId && subscriptionId) {
                const sub = await stripe.subscriptions.retrieve(subscriptionId);
                const priceId = sub.items.data[0]?.price.id;
                const multiplier = priceId ? (PLAN_MULTIPLIERS[priceId] ?? 1) : 1;
                await setPass(customerId, true, multiplier);
              }
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              const sub = event.data.object;
              const customerId =
                typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
              const active =
                event.type !== "customer.subscription.deleted" &&
                (sub.status === "active" || sub.status === "trialing");
              const priceId = sub.items.data[0]?.price.id;
              const multiplier = priceId ? (PLAN_MULTIPLIERS[priceId] ?? 1) : 1;
              if (customerId) await setPass(customerId, active, multiplier);
              break;
            }
            default:
              break;
          }
        } catch (error) {
          console.error("[stripe-webhook] handler error", error);
          return new Response("Handler error", { status: 500 });
        }

        return Response.json({ received: true });
      },
    },
  },
});