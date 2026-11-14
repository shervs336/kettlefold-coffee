import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Stripe client in test mode. Refuses live keys so this demo can never take real money. */
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured.");
  if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_")) {
    throw new Error("This demo only runs with Stripe TEST keys.");
  }
  client ??= new Stripe(key);
  return client;
}
