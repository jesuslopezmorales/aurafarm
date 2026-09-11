import Stripe from "stripe";

export const AURA_PASS_PRICE_ID = "price_1UDMkCCce8fDVXouqcJEhGYn";
export const AURA_MASTER_PRICE_ID = "price_1UEQe7Cce8fDVXouLngpzqBo";

export const PLAN_MULTIPLIERS: Record<string, number> = {
  [AURA_PASS_PRICE_ID]: 2,
  [AURA_MASTER_PRICE_ID]: 3,
};

export function getStripe(): Stripe {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(key, {
    // Use fetch-based HTTP client: the app runs on an edge runtime.
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export const stripeCryptoProvider = Stripe.createSubtleCryptoProvider();
