import { stripe } from "@/lib/stripe";
import { fulfillSession } from "@/lib/fulfill";

/** Stripe webhook: records orders even if the customer closes the tab before the success page loads. */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret) return new Response("Webhook not configured", { status: 500 });
  if (!signature) return new Response("Missing Stripe signature", { status: 400 });

  const body = await req.text(); // raw body is required for signature verification
  let event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    try {
      await fulfillSession(event.data.object.id);
    } catch (err) {
      console.error("[webhook]", err);
      return new Response("Fulfillment failed", { status: 500 }); // Stripe retries
    }
  }
  return Response.json({ received: true });
}
