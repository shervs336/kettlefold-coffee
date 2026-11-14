import "server-only";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { stripe } from "./stripe";
import { createAdminClient } from "./supabase/server";
import { sendReceipt } from "./email";

export type Fulfilled =
  | { status: "unpaid" }
  | {
      status: "paid";
      orderId: string;
      email: string | null;
      name: string | null;
      total: number;
      items: { name: string; detail: string; quantity: number; amount: number }[];
    };

/**
 * Records a paid Checkout session as an order (exactly once) and takes the stock.
 * Called from both the success page and the Stripe webhook; whichever runs
 * first records it, the other is a no-op.
 */
export async function fulfillSession(sessionId: string, opts: { refreshCache?: boolean } = {}): Promise<Fulfilled> {
  const { refreshCache = true } = opts;
  const session = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["line_items.data.price.product"] });
  if (session.payment_status !== "paid") return { status: "unpaid" };

  const lineItems = session.line_items?.data ?? [];
  const items = lineItems.map((li) => {
    const product = li.price?.product as Stripe.Product | undefined;
    return {
      product_id: product?.metadata.product_id ?? "",
      product_name: product?.name ?? li.description ?? "Coffee",
      size: product?.metadata.size ?? "250g",
      grind: product?.metadata.grind ?? "whole",
      quantity: li.quantity ?? 1,
      unit_amount: li.price?.unit_amount ?? 0,
      detail: product?.description ?? "",
    };
  });

  const email = session.customer_details?.email ?? null;
  const name = session.collected_information?.shipping_details?.name ?? session.customer_details?.name ?? null;

  const db = createAdminClient();
  if (!db) throw new Error("Database not configured");
  const { data, error } = await db.rpc("shop_record_order", {
    p_session_id: session.id,
    p_email: email,
    p_name: name,
    p_amount: session.amount_total ?? 0,
    p_currency: session.currency ?? "usd",
    p_shipping: session.collected_information?.shipping_details ?? null,
    p_items: items.map((i) => ({
      product_id: i.product_id,
      product_name: i.product_name,
      size: i.size,
      grind: i.grind,
      quantity: i.quantity,
      unit_amount: i.unit_amount,
    })),
  });
  if (error) throw new Error(`Couldn't record order: ${error.message}`);
  const row = (data as { order_id: string; created: boolean }[])[0];

  const summary = {
    status: "paid" as const,
    orderId: row.order_id,
    email,
    name,
    total: session.amount_total ?? 0,
    items: items.map((i) => ({ name: i.product_name, detail: i.detail, quantity: i.quantity, amount: i.unit_amount * i.quantity })),
  };

  if (row.created) {
    // Stock changed. (Not allowed during a page render; the success page refreshes via a server action instead.)
    if (refreshCache) revalidateTag("products", { expire: 0 });
    if (email) {
      const sent = await sendReceipt(summary, session.shipping_cost?.amount_total ?? 0);
      if (sent) await db.from("shop_orders").update({ email_sent: true }).eq("id", row.order_id);
    }
  }
  return summary;
}
