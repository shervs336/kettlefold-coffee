import Link from "next/link";
import { CoffeeBag } from "@/components/coffee-bag";
import { PALETTES, ROAST_LEVEL, money, type Product } from "@/lib/catalog";

export function RoastMeter({ roast }: { roast: Product["roast"] }) {
  const level = ROAST_LEVEL[roast];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-roast" aria-label={`${roast} roast`}>
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 w-3 rounded-full ${i <= level ? "bg-espresso" : "bg-espresso/15"}`} />
        ))}
      </span>
      <span className="capitalize">{roast}</span>
    </span>
  );
}

export function ProductCard({ product, match }: { product: Product; match?: number }) {
  const soldOut = product.stock <= 0;
  const low = !soldOut && product.stock <= 5;
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex h-full flex-col rounded-3xl bg-paper p-3 soft-shadow transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fern"
    >
      <div className="relative grid place-items-center overflow-hidden rounded-2xl py-6" style={{ background: PALETTES[product.palette].label }}>
        <CoffeeBag product={product} className={`h-56 w-auto transition-transform duration-500 group-hover:scale-[1.04] group-hover:-rotate-1 ${soldOut ? "opacity-60 grayscale-[0.4]" : ""}`} />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {product.featured && !soldOut && <span className="rounded-full bg-espresso px-2.5 py-1 text-[11px] font-medium text-cream">Staff pick</span>}
          {low && <span className="rounded-full bg-[#b3261e] px-2.5 py-1 text-[11px] font-medium text-white">Only {product.stock} left</span>}
          {soldOut && <span className="rounded-full bg-espresso/80 px-2.5 py-1 text-[11px] font-medium text-cream">Sold out</span>}
        </div>
        {match != null && (
          <span className="absolute top-3 right-3 rounded-full bg-fern px-2.5 py-1 text-[11px] font-medium text-cream">{Math.round(match * 100)}% match</span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-2 pt-4 pb-2">
        <div className="flex items-baseline gap-2">
          <h3 className="font-display text-xl font-semibold">{product.name}</h3>
          <span className="ml-auto text-sm font-medium whitespace-nowrap tabular-nums">from {money(product.price_cents)}</span>
        </div>
        <p className="mt-0.5 text-sm text-roast">
          {product.origin === "Blend" ? product.region : `${product.origin} · ${product.region}`}
        </p>
        <p className="mt-2 text-sm text-espresso/80 capitalize">{product.notes.join(" · ")}</p>
        <div className="mt-auto pt-3">
          <RoastMeter roast={product.roast} />
        </div>
      </div>
    </Link>
  );
}
