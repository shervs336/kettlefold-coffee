export type Roast = "light" | "medium" | "dark";
export type Process = "washed" | "natural" | "honey" | "decaf" | "blend";
export type PaletteId = "forest" | "clay" | "sky" | "plum" | "sand" | "night" | "rose" | "sage";
export type PatternId = "hills" | "sun" | "waves" | "leaf" | "grid" | "dots";

export type Product = {
  id: string;
  slug: string;
  name: string;
  origin: string;
  region: string;
  process: Process;
  roast: Roast;
  notes: string[];
  description: string;
  price_cents: number;
  stock: number;
  palette: PaletteId;
  pattern: PatternId;
  featured: boolean;
  active: boolean;
};

export const PRODUCT_COLUMNS =
  "id, slug, name, origin, region, process, roast, notes, description, price_cents, stock, palette, pattern, featured, active";

/** Bag colors: bag body, label paper, label ink, accent. */
export const PALETTES: Record<PaletteId, { bag: string; label: string; ink: string; accent: string }> = {
  forest: { bag: "#1f4d3a", label: "#f3ead8", ink: "#1b2a22", accent: "#d9a441" },
  clay: { bag: "#b5532d", label: "#f6ecdc", ink: "#2b1a12", accent: "#e9b44c" },
  sky: { bag: "#2f5d8a", label: "#eef2f0", ink: "#14263a", accent: "#f2b24c" },
  plum: { bag: "#5b2a4a", label: "#f4e9e6", ink: "#2a1222", accent: "#e98a6a" },
  sand: { bag: "#c39a5e", label: "#fbf6ec", ink: "#3a2a18", accent: "#8a3b1e" },
  night: { bag: "#1c2230", label: "#efe6d6", ink: "#141821", accent: "#c9893a" },
  rose: { bag: "#9b3b45", label: "#f7ebe4", ink: "#2c1416", accent: "#f0b25a" },
  sage: { bag: "#6f805e", label: "#f3f1e6", ink: "#1f261a", accent: "#d97b4f" },
};

export const SIZES = [
  { id: "250g", label: "250 g", multiplier: 1, bags: 1 },
  { id: "1kg", label: "1 kg", multiplier: 3.5, bags: 4 },
] as const;
export type SizeId = (typeof SIZES)[number]["id"];

export const GRINDS = [
  { id: "whole", label: "Whole bean" },
  { id: "espresso", label: "Espresso" },
  { id: "filter", label: "Filter" },
  { id: "press", label: "French press" },
] as const;
export type GrindId = (typeof GRINDS)[number]["id"];

export const ROAST_LEVEL: Record<Roast, number> = { light: 1, medium: 2, dark: 3 };

export const FREE_SHIPPING_CENTS = 4000;
export const SHIPPING_CENTS = 600;

export function unitPrice(product: Pick<Product, "price_cents">, size: SizeId) {
  const s = SIZES.find((x) => x.id === size) ?? SIZES[0];
  return Math.round((product.price_cents * s.multiplier) / 10) * 10;
}

/** How many 250 g bags of stock a line uses. */
export const bagsFor = (size: SizeId, quantity: number) => (SIZES.find((s) => s.id === size)?.bags ?? 1) * quantity;

export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export const continentOf = (origin: string) =>
  ({ Ethiopia: "Africa", Kenya: "Africa", Rwanda: "Africa", Colombia: "Americas", "Costa Rica": "Americas", Mexico: "Americas", Indonesia: "Asia" } as Record<string, string>)[origin] ?? "Blends";
