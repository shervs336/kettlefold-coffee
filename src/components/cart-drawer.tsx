"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LockIcon, MinusIcon, PlusIcon, ShoppingBagIcon, XIcon } from "lucide-react";
import { cart, useCart, type CartLine } from "@/lib/cart";
import { FREE_SHIPPING_CENTS, GRINDS, SIZES, bagsFor, money, unitPrice, type Product } from "@/lib/catalog";
import { CoffeeBag } from "@/components/coffee-bag";

const OPEN_EVENT = "kettlefold:open-cart";
export const openCart = () => window.dispatchEvent(new Event(OPEN_EVENT));

export function CartButton({ products }: { products: Product[] }) {
  const lines = useCart();
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
        className="relative grid size-10 place-items-center rounded-full hover:bg-espresso/5 focus-visible:outline-2 focus-visible:outline-fern"
      >
        <ShoppingBagIcon className="size-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-fern px-1 text-[11px] font-semibold text-cream tabular-nums">
            {count}
          </span>
        )}
      </button>
      {open && <CartDrawer products={products} lines={lines} onClose={() => setOpen(false)} />}
    </>
  );
}

function CartDrawer({ products, lines, onClose }: { products: Product[]; lines: CartLine[]; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const rows = lines.flatMap((l) => {
    const p = byId.get(l.productId);
    return p ? [{ line: l, product: p, unit: unitPrice(p, l.size) }] : [];
  });
  const subtotal = rows.reduce((s, r) => s + r.unit * r.line.quantity, 0);
  const toFree = Math.max(0, FREE_SHIPPING_CENTS - subtotal);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout is unavailable right now.");
      window.location.href = data.url;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-labelledby="cart-title"
      className="fade m-0 ml-auto h-dvh max-h-dvh w-full max-w-md bg-transparent p-0"
    >
      <div className="drawer flex h-full flex-col bg-paper shadow-2xl">
        <div className="flex items-center border-b border-line px-5 py-4">
          <h2 id="cart-title" className="font-display text-2xl font-semibold">
            Your cart
          </h2>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Close cart" className="ml-auto rounded-full p-2 hover:bg-espresso/5">
            <XIcon className="size-5" />
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div>
              <p className="font-display text-xl">Your cart is empty.</p>
              <p className="mt-2 text-sm text-roast">Fresh roasts are waiting.</p>
              <Link href="/shop" onClick={() => ref.current?.close()} className="mt-6 inline-flex rounded-full bg-fern px-5 py-2.5 text-sm font-medium text-cream hover:bg-fern-soft">
                Browse coffee
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-5 py-3 text-sm">
              {toFree > 0 ? (
                <p>
                  You&apos;re <strong>{money(toFree)}</strong> away from free shipping.
                </p>
              ) : (
                <p className="font-medium text-fern">You&apos;ve unlocked free shipping.</p>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-fern transition-all" style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_CENTS) * 100)}%` }} />
              </div>
            </div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {rows.map(({ line, product, unit }) => {
                const over = bagsFor(line.size, line.quantity) > product.stock;
                return (
                  <li key={`${line.productId}-${line.size}-${line.grind}`} className="flex gap-4 py-4">
                    <CoffeeBag product={product} className="h-24 w-[72px] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <Link href={`/shop/${product.slug}`} onClick={() => ref.current?.close()} className="font-display text-lg leading-tight font-semibold hover:underline">
                          {product.name}
                        </Link>
                        <span className="ml-auto text-sm font-medium tabular-nums">{money(unit * line.quantity)}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-roast">
                        {SIZES.find((s) => s.id === line.size)?.label} · {GRINDS.find((g) => g.id === line.grind)?.label}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="inline-flex items-center rounded-full border border-line">
                          <button type="button" aria-label={`One fewer ${product.name}`} onClick={() => cart.setQuantity(line, line.quantity - 1)} className="grid size-8 place-items-center rounded-full hover:bg-espresso/5">
                            <MinusIcon className="size-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">
                            {line.quantity}
                          </span>
                          <button type="button" aria-label={`One more ${product.name}`} onClick={() => cart.setQuantity(line, line.quantity + 1)} className="grid size-8 place-items-center rounded-full hover:bg-espresso/5">
                            <PlusIcon className="size-3.5" />
                          </button>
                        </div>
                        <button type="button" onClick={() => cart.remove(line)} className="text-xs text-roast underline-offset-2 hover:underline">
                          Remove
                        </button>
                      </div>
                      {over && <p className="mt-1.5 text-xs text-[#b3261e]">Only {product.stock} bags in stock. Reduce the quantity to check out.</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-line px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-roast">Subtotal</span>
                <span className="font-display text-2xl font-semibold tabular-nums">{money(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-roast">Shipping calculated at checkout. Free over {money(FREE_SHIPPING_CENTS)}.</p>
              <button
                type="button"
                onClick={checkout}
                disabled={busy}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-fern font-medium text-cream transition-colors hover:bg-fern-soft disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fern"
              >
                <LockIcon className="size-4" /> {busy ? "Opening secure checkout…" : "Checkout"}
              </button>
              <p className="mt-2 text-center text-[11px] text-roast">Test mode: use card 4242 4242 4242 4242, any future date, any CVC.</p>
              {error && (
                <p role="alert" className="mt-2 text-center text-sm text-[#b3261e]">
                  {error}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
