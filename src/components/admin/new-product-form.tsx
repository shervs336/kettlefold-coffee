"use client";

import { useActionState, useState } from "react";
import { createProduct } from "@/app/admin/actions";
import { CoffeeBag } from "@/components/coffee-bag";
import { PALETTES, type PaletteId, type PatternId, type Product } from "@/lib/catalog";

const field = "w-full rounded-xl border border-line bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fern/30";

export function NewProductForm() {
  const [state, action, pending] = useActionState(createProduct, null);
  const [preview, setPreview] = useState({ name: "New Roast", origin: "Guatemala", process: "washed", roast: "medium", palette: "forest" as PaletteId, pattern: "hills" as PatternId });

  const previewProduct = {
    id: "preview",
    slug: "preview",
    region: "",
    notes: [],
    description: "",
    price_cents: 0,
    stock: 0,
    featured: false,
    active: true,
    ...preview,
    name: preview.name || "New Roast",
  } as unknown as Product;

  return (
    <form
      action={action}
      onChange={(e) => {
        const f = new FormData(e.currentTarget);
        setPreview({
          name: String(f.get("name") ?? ""),
          origin: String(f.get("origin") ?? ""),
          process: String(f.get("process")),
          roast: String(f.get("roast")),
          palette: f.get("palette") as PaletteId,
          pattern: f.get("pattern") as PatternId,
        });
      }}
      className="grid gap-6 rounded-3xl bg-paper p-6 soft-shadow md:grid-cols-[1fr_220px]"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Name
          <input name="name" required maxLength={60} placeholder="Antigua Ember" className={`${field} mt-1`} />
        </label>
        <label className="text-sm">
          Origin (country, or &ldquo;Blend&rdquo;)
          <input name="origin" required maxLength={40} defaultValue="Guatemala" className={`${field} mt-1`} />
        </label>
        <label className="text-sm">
          Region
          <input name="region" maxLength={60} placeholder="Antigua" className={`${field} mt-1`} />
        </label>
        <label className="text-sm">
          Tasting notes (comma-separated)
          <input name="notes" required maxLength={120} placeholder="cocoa, orange peel, brown sugar" className={`${field} mt-1`} />
        </label>
        <label className="text-sm">
          Process
          <select name="process" defaultValue="washed" className={`${field} mt-1`}>
            {["washed", "natural", "honey", "decaf", "blend"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Roast
          <select name="roast" defaultValue="medium" className={`${field} mt-1`}>
            {["light", "medium", "dark"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Price for 250 g (USD)
          <input name="price" type="number" min="1" step="0.5" required defaultValue="19" className={`${field} mt-1`} />
        </label>
        <label className="text-sm">
          Stock (250 g bags)
          <input name="stock" type="number" min="0" required defaultValue="30" className={`${field} mt-1`} />
        </label>
        <label className="text-sm sm:col-span-2">
          Description
          <textarea name="description" required minLength={10} maxLength={1200} rows={3} className={`${field} mt-1`} placeholder="What makes this coffee special, and how to enjoy it." />
        </label>
        <fieldset className="text-sm sm:col-span-2">
          <legend>Bag color</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(PALETTES) as PaletteId[]).map((p) => (
              <label key={p} className="cursor-pointer">
                <input type="radio" name="palette" value={p} defaultChecked={p === "forest"} className="peer sr-only" />
                <span className="block size-9 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-espresso peer-focus-visible:ring-2 peer-focus-visible:ring-fern" style={{ background: PALETTES[p].bag }} title={p} />
              </label>
            ))}
          </div>
        </fieldset>
        <label className="text-sm">
          Label pattern
          <select name="pattern" defaultValue="hills" className={`${field} mt-1`}>
            {["hills", "sun", "waves", "leaf", "grid", "dots"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-3 sm:col-span-2">
          <button disabled={pending} className="h-11 rounded-full bg-fern px-6 text-sm font-medium text-cream hover:bg-fern-soft disabled:opacity-60">
            {pending ? "Adding…" : "Add to shop"}
          </button>
          <p aria-live="polite" className={`text-sm ${state && !state.ok ? "text-[#b3261e]" : "text-fern"}`}>
            {state ? (state.ok ? state.message : state.error) : ""}
          </p>
        </div>
      </div>
      <div className="grid place-items-center rounded-2xl p-4" style={{ background: PALETTES[preview.palette].label }} aria-label="Bag preview">
        <CoffeeBag product={previewProduct} className="h-64 w-auto" />
      </div>
    </form>
  );
}
