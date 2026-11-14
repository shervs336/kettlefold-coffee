"use client";

import { useState } from "react";
import { CheckIcon, MinusIcon, PlusIcon } from "lucide-react";
import { cart, useCart } from "@/lib/cart";
import { GRINDS, SIZES, bagsFor, money, unitPrice, type GrindId, type Product, type SizeId } from "@/lib/catalog";
import { openCart } from "@/components/cart-drawer";

export function BuyBox({ product }: { product: Product }) {
  const [size, setSize] = useState<SizeId>("250g");
  const [grind, setGrind] = useState<GrindId>("whole");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const lines = useCart();

  const inCart = lines.filter((l) => l.productId === product.id).reduce((n, l) => n + bagsFor(l.size, l.quantity), 0);
  const available = product.stock - inCart;
  const fits = bagsFor(size, qty) <= available;
  const soldOut = product.stock <= 0;
  const price = unitPrice(product, size);

  function add() {
    if (!fits) return;
    cart.add({ productId: product.id, slug: product.slug, size, grind, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
    openCart();
  }

  return (
    <div className="mt-8 space-y-6">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold tracking-wider text-roast uppercase">Size</legend>
        <div className="grid grid-cols-2 gap-2">
          {SIZES.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-line bg-paper px-4 py-3 has-checked:border-espresso has-focus-visible:outline-2 has-focus-visible:outline-fern"
            >
              <span>
                <span className="block font-medium">{s.label}</span>
                {s.id === "1kg" && <span className="text-xs text-fern">Save 12%</span>}
              </span>
              <span className="tabular-nums">{money(unitPrice(product, s.id))}</span>
              <input type="radio" name="size" value={s.id} checked={size === s.id} onChange={() => setSize(s.id)} className="sr-only" />
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold tracking-wider text-roast uppercase">Grind</span>
        <select value={grind} onChange={(e) => setGrind(e.target.value as GrindId)} className="w-full rounded-2xl border-2 border-line bg-paper px-4 py-3">
          {GRINDS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-3">
        <div className="inline-flex items-center rounded-full border-2 border-line bg-paper">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-12 place-items-center rounded-full hover:bg-espresso/5">
            <MinusIcon className="size-4" />
          </button>
          <span className="w-8 text-center tabular-nums" aria-live="polite" aria-label={`Quantity ${qty}`}>
            {qty}
          </span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(10, q + 1))} className="grid size-12 place-items-center rounded-full hover:bg-espresso/5">
            <PlusIcon className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={soldOut || !fits}
          className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-fern font-medium text-cream transition-colors hover:bg-fern-soft disabled:cursor-not-allowed disabled:bg-espresso/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fern"
        >
          {soldOut ? (
            "Sold out"
          ) : added ? (
            <>
              <CheckIcon className="size-4" /> Added
            </>
          ) : (
            <>Add to cart · {money(price * qty)}</>
          )}
        </button>
      </div>
      <p className="text-sm text-roast" aria-live="polite">
        {soldOut
          ? "Back soon. This lot sold out."
          : !fits
            ? `Only ${Math.max(0, available)} bags left${inCart ? " (some are already in your cart)" : ""}.`
            : product.stock <= 5
              ? `Only ${product.stock} bags left in this roast.`
              : "In stock. Roasted to order, ships within 48 hours."}
      </p>
    </div>
  );
}
