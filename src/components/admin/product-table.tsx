"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateProduct } from "@/app/admin/actions";
import { CoffeeBag } from "@/components/coffee-bag";
import type { Product } from "@/lib/catalog";

function Row({ product }: { product: Product }) {
  const [price, setPrice] = useState((product.price_cents / 100).toFixed(2));
  const [stock, setStock] = useState(String(product.stock));
  const [active, setActive] = useState(product.active);
  const [featured, setFeatured] = useState(product.featured);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = (patch: Parameters<typeof updateProduct>[0]) =>
    start(async () => {
      const res = await updateProduct(patch);
      setMsg(res.ok ? "Saved" : res.error);
      setTimeout(() => setMsg(null), 2000);
    });

  return (
    <tr className={active ? "" : "opacity-60"}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <CoffeeBag product={product} className="h-14 w-auto shrink-0" />
          <span>
            <Link href={`/shop/${product.slug}`} className="font-medium hover:underline">
              {product.name}
            </Link>
            <span className="block text-xs text-roast capitalize">
              {product.origin} · {product.roast}
            </span>
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <label className="flex items-center gap-1">
          <span className="text-roast">$</span>
          <input
            value={price}
            inputMode="decimal"
            onChange={(e) => setPrice(e.target.value)}
            onBlur={() => {
              const cents = Math.round(Number(price) * 100);
              if (Number.isFinite(cents) && cents !== product.price_cents) save({ id: product.id, price_cents: cents });
            }}
            aria-label={`Price of ${product.name} (250 g)`}
            className="w-20 rounded-lg border border-line bg-cream px-2 py-1 tabular-nums"
          />
        </label>
      </td>
      <td className="px-4 py-3">
        <input
          value={stock}
          inputMode="numeric"
          onChange={(e) => setStock(e.target.value)}
          onBlur={() => {
            const n = Number.parseInt(stock, 10);
            if (Number.isFinite(n) && n !== product.stock) save({ id: product.id, stock: n });
          }}
          aria-label={`Stock of ${product.name}`}
          className={`w-16 rounded-lg border border-line bg-cream px-2 py-1 tabular-nums ${Number(stock) === 0 ? "text-[#b3261e]" : ""}`}
        />
      </td>
      <td className="px-4 py-3">
        <input type="checkbox" checked={featured} aria-label={`Feature ${product.name}`} onChange={(e) => { setFeatured(e.target.checked); save({ id: product.id, featured: e.target.checked }); }} className="size-4 accent-[#1f4d3a]" />
      </td>
      <td className="px-4 py-3">
        <input type="checkbox" checked={active} aria-label={`Show ${product.name} in the shop`} onChange={(e) => { setActive(e.target.checked); save({ id: product.id, active: e.target.checked }); }} className="size-4 accent-[#1f4d3a]" />
      </td>
      <td className="px-4 py-3 text-xs text-roast" aria-live="polite">
        {pending ? "Saving…" : msg}
      </td>
    </tr>
  );
}

export function ProductTable({ products }: { products: Product[] }) {
  return (
    <div className="overflow-x-auto rounded-3xl bg-paper soft-shadow">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-roast">
          <tr>
            <th className="px-4 py-3 font-medium">Coffee</th>
            <th className="px-4 py-3 font-medium">Price (250 g)</th>
            <th className="px-4 py-3 font-medium">Stock (bags)</th>
            <th className="px-4 py-3 font-medium">Featured</th>
            <th className="px-4 py-3 font-medium">In shop</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {products.map((p) => (
            <Row key={p.id} product={p} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
