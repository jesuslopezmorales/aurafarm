import { createFileRoute } from "@tanstack/react-router";

async function setPass(customerId: string, active: boolean) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("profiles")
    .update({ pass_active: active, multiplier: active ? 2 : 1 })
    .eq("stripe_customer_id", customerId);
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
        const { getStripe, stripeCryptoProvider } = await import("@/lib/stripe.server");
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
              if (customerId) await setPass(customerId, true);
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
              if (customerId) await setPass(customerId, active);
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
