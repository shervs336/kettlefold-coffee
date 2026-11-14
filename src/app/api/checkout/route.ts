import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { FREE_SHIPPING_CENTS, GRINDS, PRODUCT_COLUMNS, SHIPPING_CENTS, SIZES, bagsFor, unitPrice, type Product } from "@/lib/catalog";

const Body = z.object({
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        size: z.enum(["250g", "1kg"]),
        grind: z.enum(["whole", "espresso", "filter", "press"]),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(20),
});

const fail = (status: number, error: string) => Response.json({ error }, { status });

/**
 * Creates a Stripe Checkout session. Prices and stock come from the database,
 * never from the browser: a tampered cart can't change what anyone pays.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Your cart looks invalid. Please refresh and try again.");
  const { lines } = parsed.data;

  const db = createAdminClient();
  if (!db || !process.env.STRIPE_SECRET_KEY) return fail(503, "Checkout isn't configured on this deployment.");

  const ids = [...new Set(lines.map((l) => l.productId))];
  const { data, error } = await db.from("shop_products").select(PRODUCT_COLUMNS).in("id", ids).eq("active", true);
  if (error) return fail(500, "Couldn't load products. Please try again.");
  const products = new Map((data as Product[]).map((p) => [p.id, p]));

  // Stock check across all lines for the same coffee (a 1 kg bag uses four 250 g bags).
  const needed = new Map<string, number>();
  for (const l of lines) {
    if (!products.has(l.productId)) return fail(409, "One of the coffees in your cart is no longer available.");
    needed.set(l.productId, (needed.get(l.productId) ?? 0) + bagsFor(l.size, l.quantity));
  }
  for (const [id, bags] of needed) {
    const p = products.get(id)!;
    if (bags > p.stock) {
      return fail(409, p.stock > 0 ? `Only ${p.stock} bags of ${p.name} are left. Please lower the quantity.` : `${p.name} just sold out.`);
    }
  }

  const items = lines.map((l) => {
    const p = products.get(l.productId)!;
    return { p, l, unit: unitPrice(p, l.size) };
  });
  const subtotal = items.reduce((s, i) => s + i.unit * i.l.quantity, 0);
  // Where Stripe sends the buyer back: this site, never a client-supplied header.
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: items.map(({ p, l, unit }) => ({
        quantity: l.quantity,
        price_data: {
          currency: "usd",
          unit_amount: unit,
          product_data: {
            name: p.name,
            description: `${SIZES.find((s) => s.id === l.size)!.label} · ${GRINDS.find((g) => g.id === l.grind)!.label}`,
            metadata: { product_id: p.id, size: l.size, grind: l.grind },
          },
        },
      })),
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "AU", "PH", "DE", "FR", "NL", "SG", "JP"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: subtotal >= FREE_SHIPPING_CENTS ? "Free shipping (2–4 business days)" : "Standard shipping (2–4 business days)",
            fixed_amount: { amount: subtotal >= FREE_SHIPPING_CENTS ? 0 : SHIPPING_CENTS, currency: "usd" },
          },
        },
      ],
      success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop?checkout=cancelled`,
      metadata: { source: "kettlefold-portfolio" },
    });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[checkout]", err);
    return fail(502, "Couldn't start checkout. Please try again.");
  }
}
