import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2Icon } from "lucide-react";
import { fulfillSession } from "@/lib/fulfill";
import { money } from "@/lib/catalog";
import { ClearCart } from "@/components/clear-cart";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

async function Receipt({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  if (!session_id || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(session_id)) {
    return <p className="text-roast">We couldn&apos;t find that order.</p>;
  }
  let order;
  try {
    order = await fulfillSession(session_id, { refreshCache: false });
  } catch (err) {
    // A made-up or mistyped link: Stripe says the session doesn't exist.
    if ((err as { code?: string }).code === "resource_missing") {
      return <p className="text-roast">We couldn&apos;t find that order. Check the link from your confirmation email.</p>;
    }
    console.error("[success]", err);
    return <p className="text-roast">We couldn&apos;t load your receipt right now. If you completed a payment, you&apos;ll get an email confirmation.</p>;
  }
  if (order.status !== "paid") {
    return <p className="text-roast">Your payment hasn&apos;t completed yet. If you were charged, you&apos;ll receive a confirmation shortly.</p>;
  }

  return (
    <>
      <ClearCart />
      <CheckCircle2Icon className="size-12 text-fern" />
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Thank you{order.name ? `, ${order.name.split(" ")[0]}` : ""}!</h1>
      <p className="mt-2 text-roast">
        Your coffee is on the roaster. {order.email && <>A receipt is on its way to <strong className="text-espresso">{order.email}</strong>.</>}
      </p>
      <div className="mt-8 rounded-3xl bg-paper p-6 text-left soft-shadow">
        <p className="text-xs font-semibold tracking-wider text-roast uppercase">Order {order.orderId.slice(0, 8).toUpperCase()}</p>
        <ul className="mt-4 divide-y divide-line">
          {order.items.map((i, n) => (
            <li key={n} className="flex justify-between gap-4 py-3">
              <span>
                <span className="font-medium">
                  {i.name} × {i.quantity}
                </span>
                <span className="block text-sm text-roast">{i.detail}</span>
              </span>
              <span className="tabular-nums">{money(i.amount)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-line pt-4 font-display text-xl font-semibold">
          <span>Total paid</span>
          <span className="tabular-nums">{money(order.total)}</span>
        </div>
      </div>
      <p className="mt-4 text-xs text-roast">Stripe test mode: no real payment was taken and nothing will ship.</p>
      <Link href="/shop" className="mt-8 inline-flex h-12 items-center rounded-full bg-fern px-6 font-medium text-cream hover:bg-fern-soft">
        Keep browsing
      </Link>
    </>
  );
}

export default function SuccessPage({ searchParams }: PageProps<"/order/success">) {
  return (
    <main className="mx-auto max-w-xl px-4 pt-16 text-center sm:px-6">
      <div className="flex flex-col items-center">
        <Suspense fallback={<p className="text-roast">Confirming your order…</p>}>
          <Receipt searchParams={searchParams as Promise<{ session_id?: string }>} />
        </Suspense>
      </div>
    </main>
  );
}
