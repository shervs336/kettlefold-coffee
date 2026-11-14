"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SearchIcon, SparklesIcon, XIcon } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { continentOf, type Product } from "@/lib/catalog";

export type Filters = { roast: string[]; process: string[]; region: string[]; inStock: boolean; sort: string; q: string };

const ROASTS = ["light", "medium", "dark"];
const PROCESSES = ["washed", "natural", "honey", "blend", "decaf"];
const REGIONS = ["Africa", "Americas", "Asia", "Blends"];
const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "name", label: "Name" },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm capitalize transition-colors hover:border-espresso/40 aria-pressed:border-espresso aria-pressed:bg-espresso aria-pressed:text-cream focus-visible:outline-2 focus-visible:outline-fern"
    >
      {children}
    </button>
  );
}

export function ShopBrowser({ products, initial }: { products: Product[]; initial: Filters }) {
  const router = useRouter();
  const pathname = usePathname();
  const [f, setF] = useState<Filters>(initial);
  const [ai, setAi] = useState<{ query: string; results: { slug: string; similarity: number }[] } | null>(null);
  const [aiQuery, setAiQuery] = useState("");
  const [aiState, setAiState] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState("");

  function update(next: Partial<Filters>) {
    const merged = { ...f, ...next };
    setF(merged);
    const params = new URLSearchParams();
    if (merged.roast.length) params.set("roast", merged.roast.join(","));
    if (merged.process.length) params.set("process", merged.process.join(","));
    if (merged.region.length) params.set("region", merged.region.join(","));
    if (merged.inStock) params.set("instock", "1");
    if (merged.sort !== "featured") params.set("sort", merged.sort);
    if (merged.q) params.set("q", merged.q);
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  }
  const toggle = (key: "roast" | "process" | "region", value: string) =>
    update({ [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] });

  const shown = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (!f.roast.length || f.roast.includes(p.roast)) &&
        (!f.process.length || f.process.includes(p.process)) &&
        (!f.region.length || f.region.includes(continentOf(p.origin))) &&
        (!f.inStock || p.stock > 0) &&
        (!q || [p.name, p.origin, p.region, p.process, ...p.notes].join(" ").toLowerCase().includes(q)),
    );
    const sorted = [...list];
    if (f.sort === "price-asc") sorted.sort((a, b) => a.price_cents - b.price_cents);
    else if (f.sort === "price-desc") sorted.sort((a, b) => b.price_cents - a.price_cents);
    else if (f.sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.stock > 0) - Number(a.stock > 0));
    return sorted;
  }, [products, f]);

  async function askAi(e: React.FormEvent) {
    e.preventDefault();
    const query = aiQuery.trim();
    if (query.length < 3) return;
    setAiState("loading");
    setAiError("");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as { results?: { slug: string; similarity: number }[]; error?: string };
      if (!res.ok || !data.results) throw new Error(data.error ?? "Search is unavailable right now.");
      setAi({ query, results: data.results });
      setAiState("idle");
    } catch (err) {
      setAiError((err as Error).message);
      setAiState("error");
    }
  }

  const activeCount = f.roast.length + f.process.length + f.region.length + Number(f.inStock) + Number(!!f.q);
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  return (
    <div>
      {/* AI search */}
      <form onSubmit={askAi} className="rounded-3xl bg-fern p-5 text-cream soft-shadow sm:p-6">
        <label htmlFor="ai-search" className="flex items-center gap-2 text-sm font-medium">
          <SparklesIcon className="size-4 text-crema" /> Describe your ideal cup
        </label>
        <div className="mt-3 flex gap-2">
          <input
            id="ai-search"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            maxLength={120}
            placeholder="e.g. something cozy and chocolatey for winter mornings"
            className="min-w-0 flex-1 rounded-full bg-cream/10 px-4 py-2.5 text-sm text-cream outline-none placeholder:text-cream/55 focus:bg-cream/15 focus:ring-2 focus:ring-crema/60"
          />
          <button disabled={aiState === "loading"} className="rounded-full bg-crema px-5 text-sm font-semibold text-espresso transition-opacity hover:opacity-90 disabled:opacity-60">
            {aiState === "loading" ? "Finding…" : "Find"}
          </button>
        </div>
        {aiState === "error" && <p className="mt-2 text-sm text-crema">{aiError}</p>}
      </form>

      {ai && (
        <section aria-labelledby="ai-results" className="mt-8">
          <div className="flex items-baseline gap-3">
            <h2 id="ai-results" className="font-display text-2xl font-semibold">
              Best matches for &ldquo;{ai.query}&rdquo;
            </h2>
            <button type="button" onClick={() => setAi(null)} className="ml-auto inline-flex items-center gap-1 text-sm text-roast hover:text-espresso">
              <XIcon className="size-4" /> Clear
            </button>
          </div>
          <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ai.results.slice(0, 3).flatMap((r) => {
              const p = bySlug.get(r.slug);
              return p ? [<li key={r.slug}><ProductCard product={p} match={r.similarity} /></li>] : [];
            })}
          </ul>
        </section>
      )}

      {/* Filters */}
      <div className="mt-10 flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside aria-label="Filters" className="space-y-5 lg:sticky lg:top-24 lg:w-60 lg:shrink-0">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-roast" />
            <input
              value={f.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Search by name or note"
              aria-label="Search coffee"
              className="w-full rounded-full border border-line bg-paper py-2 pr-3 pl-10 text-sm outline-none focus:border-espresso/40 focus:ring-2 focus:ring-fern/20"
            />
          </div>
          {[
            { title: "Roast", key: "roast" as const, values: ROASTS },
            { title: "Process", key: "process" as const, values: PROCESSES },
            { title: "Origin", key: "region" as const, values: REGIONS },
          ].map((g) => (
            <fieldset key={g.key}>
              <legend className="mb-2 text-xs font-semibold tracking-wider text-roast uppercase">{g.title}</legend>
              <div className="flex flex-wrap gap-1.5">
                {g.values.map((v) => (
                  <Chip key={v} active={f[g.key].includes(v)} onClick={() => toggle(g.key, v)}>
                    {v}
                  </Chip>
                ))}
              </div>
            </fieldset>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.inStock} onChange={(e) => update({ inStock: e.target.checked })} className="size-4 accent-[#1f4d3a]" />
            In stock only
          </label>
          {activeCount > 0 && (
            <button type="button" onClick={() => update({ roast: [], process: [], region: [], inStock: false, q: "" })} className="text-sm text-roast underline-offset-2 hover:underline">
              Clear all filters
            </button>
          )}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-roast" aria-live="polite">
              {shown.length} {shown.length === 1 ? "coffee" : "coffees"}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-roast">Sort</span>
              <select value={f.sort} onChange={(e) => update({ sort: e.target.value })} className="rounded-full border border-line bg-paper px-3 py-1.5">
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {shown.length ? (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-3xl border border-dashed border-line p-12 text-center">
              <p className="font-display text-xl">No coffees match those filters.</p>
              <button type="button" onClick={() => update({ roast: [], process: [], region: [], inStock: false, q: "" })} className="mt-3 text-sm text-fern underline-offset-2 hover:underline">
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
