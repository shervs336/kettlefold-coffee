import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import { getProduct, getProducts } from "@/lib/products";
import { similarSlugs } from "@/lib/similar";
import { ProductGallery } from "@/components/product-gallery";
import { BuyBox } from "@/components/buy-box";
import { ProductCard, RoastMeter } from "@/components/product-card";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "morning-fold" }];
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return p ? { title: p.name, description: `${p.description} Tasting notes: ${p.notes.join(", ")}.` } : { title: "Coffee not found" };
}

async function Similar({ productId }: { productId: string }) {
  const [slugs, products] = await Promise.all([similarSlugs(productId), getProducts()]);
  const items = slugs.flatMap((s) => products.filter((p) => p.slug === s));
  if (!items.length) return null;
  return (
    <section aria-labelledby="similar" className="mt-24">
      <h2 id="similar" className="font-display text-3xl font-semibold tracking-tight">
        If you like this, try…
      </h2>
      <p className="mt-1 text-sm text-roast">Matched by flavor and character, not just by category.</p>
      <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {items.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

async function Product({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-roast">
        <Link href="/shop" className="hover:text-espresso">
          Shop
        </Link>
        <ChevronRightIcon className="size-3.5" />
        <span className="text-espresso">{product.name}</span>
      </nav>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <ProductGallery product={product} />
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-fern uppercase">
            {product.origin === "Blend" ? "House blend" : `${product.origin} · ${product.region}`}
          </p>
          <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <RoastMeter roast={product.roast} />
            <span className="text-xs text-roast capitalize">{product.process} process</span>
          </div>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tasting notes">
            {product.notes.map((n) => (
              <li key={n} className="rounded-full bg-paper px-3 py-1 text-sm capitalize ring-1 ring-line">
                {n}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-lg leading-relaxed text-espresso/85">{product.description}</p>
          <BuyBox product={product} />
          <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-line pt-6 text-sm">
            <div>
              <dt className="text-roast">Origin</dt>
              <dd className="font-medium">{product.origin === "Blend" ? product.region : `${product.region}, ${product.origin}`}</dd>
            </div>
            <div>
              <dt className="text-roast">Process</dt>
              <dd className="font-medium capitalize">{product.process}</dd>
            </div>
            <div>
              <dt className="text-roast">Roasted</dt>
              <dd className="font-medium">To order, every weekday</dd>
            </div>
            <div>
              <dt className="text-roast">Shipping</dt>
              <dd className="font-medium">Free over $40</dd>
            </div>
          </dl>
        </div>
      </div>
      <Suspense fallback={null}>
        <Similar productId={product.id} />
      </Suspense>
    </>
  );
}

export default function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <Suspense fallback={<p className="text-sm text-roast">Loading…</p>}>
        <Product params={params as Promise<{ slug: string }>} />
      </Suspense>
    </main>
  );
}
