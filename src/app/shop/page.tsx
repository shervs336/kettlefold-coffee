import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts } from "@/lib/products";
import { ShopBrowser, type Filters } from "@/components/shop-browser";

export const metadata: Metadata = { title: "Shop coffee" };

const list = (v?: string | string[]) => (typeof v === "string" && v ? v.split(",").slice(0, 6) : []);

async function Browser({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [sp, products] = await Promise.all([searchParams, getProducts()]);
  const initial: Filters = {
    roast: list(sp.roast),
    process: list(sp.process),
    region: list(sp.region),
    inStock: sp.instock === "1",
    sort: typeof sp.sort === "string" ? sp.sort : "featured",
    q: typeof sp.q === "string" ? sp.q.slice(0, 60) : "",
  };
  return <ShopBrowser products={products} initial={initial} />;
}

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.2em] text-fern uppercase">The roastery</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">All coffee</h1>
      <p className="mt-3 max-w-xl text-roast">Every bag is roasted to order in small batches and ships within 48 hours.</p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-roast">Loading the shelf…</p>}>
          <Browser searchParams={searchParams as Promise<Record<string, string | string[] | undefined>>} />
        </Suspense>
      </div>
    </main>
  );
}
