import Link from "next/link";
import { ArrowRightIcon, FlameIcon, PackageIcon, SparklesIcon } from "lucide-react";
import { getProducts } from "@/lib/products";
import { CoffeeBag } from "@/components/coffee-bag";
import { ProductCard } from "@/components/product-card";

export default async function Home() {
  const products = await getProducts();
  const featured = products.filter((p) => p.featured).slice(0, 3);
  const hero = ["kintamani-night", "yirga-sun", "morning-fold"].flatMap((s) => products.filter((p) => p.slug === s));

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-fern uppercase">Small-batch coffee roasters</p>
          <h1 className="mt-4 font-display text-[3.4rem] leading-[0.95] font-semibold tracking-tight text-balance sm:text-7xl">
            Coffee, folded <em className="font-normal text-fern">with care.</em>
          </h1>
          <p className="mt-6 max-w-md text-lg text-roast">
            Single origins and house blends, roasted to order every weekday and shipped within 48 hours.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="inline-flex h-12 items-center gap-2 rounded-full bg-fern px-6 font-medium text-cream hover:bg-fern-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fern">
              Shop the roasts <ArrowRightIcon className="size-4" />
            </Link>
            <Link href="/shop?roast=light" className="inline-flex h-12 items-center rounded-full border-2 border-espresso/15 px-6 font-medium hover:border-espresso/40">
              Bright & fruity
            </Link>
          </div>
          <p className="mt-6 text-sm text-roast">Free shipping over $40 · Whole bean or ground to order</p>
        </div>
        <div className="relative mx-auto h-[420px] w-full max-w-md" aria-hidden>
          <div className="absolute inset-x-6 bottom-6 h-24 rounded-[50%] bg-crema/25 blur-2xl" />
          {hero[1] && <CoffeeBag product={hero[1]} className="float-a absolute top-6 left-0 h-[300px] w-auto drop-shadow-xl" />}
          {hero[2] && <CoffeeBag product={hero[2]} className="float-b absolute top-0 right-0 h-[310px] w-auto drop-shadow-xl" />}
          {hero[0] && <CoffeeBag product={hero[0]} className="absolute bottom-0 left-1/2 h-[340px] w-auto -translate-x-1/2 drop-shadow-2xl" />}
        </div>
      </section>

      {/* This season */}
      {featured.length > 0 && (
        <section aria-labelledby="season" className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-fern uppercase">This season</p>
              <h2 id="season" className="mt-2 font-display text-4xl font-semibold tracking-tight">
                Staff picks
              </h2>
            </div>
            <Link href="/shop" className="hidden items-center gap-1 text-sm font-medium text-fern hover:underline sm:inline-flex">
              See all {products.length} coffees <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {featured.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: SparklesIcon, t: "Pick by taste", d: "Filter by roast and origin, or just describe the cup you're after." },
            { icon: FlameIcon, t: "We roast to order", d: "Small batches every weekday, so your bag is never sitting on a shelf." },
            { icon: PackageIcon, t: "Fresh at your door", d: "Shipped within 48 hours, free over $40, with a brew guide on every bag." },
          ].map(({ icon: Icon, t, d }, i) => (
            <li key={t} className="rounded-3xl bg-paper p-6 soft-shadow">
              <span className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-fern/10 text-fern">
                  <Icon className="size-5" />
                </span>
                <span className="font-display text-sm text-roast">0{i + 1}</span>
              </span>
              <p className="mt-4 font-display text-xl font-semibold">{t}</p>
              <p className="mt-1 text-roast">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* AI search teaser */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-6 rounded-[2rem] bg-espresso p-8 text-cream sm:p-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="flex items-center gap-2 text-sm text-crema">
              <SparklesIcon className="size-4" /> Not sure what to pick?
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Describe your ideal cup. We&apos;ll find the bag.</h2>
            <p className="mt-3 text-cream/70">&ldquo;Something cozy and chocolatey for winter&rdquo; or &ldquo;bright and fruity for iced coffee&rdquo;: our search understands flavor, not just keywords.</p>
          </div>
          <Link href="/shop#ai-search" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-crema px-6 font-semibold text-espresso hover:opacity-90 lg:justify-self-end">
            Try taste search <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
