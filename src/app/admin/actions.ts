"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { createAdminClient, currentAdmin } from "@/lib/supabase/server";
import { embedProducts, productText } from "@/lib/embeddings";

type Result = { ok: true; message?: string } | { ok: false; error: string };

/** Every admin action re-checks the signed-in user against ADMIN_EMAILS. */
async function requireAdmin() {
  const who = await currentAdmin();
  if (!who?.isAdmin) throw new Error("Not authorized.");
  const db = createAdminClient();
  if (!db) throw new Error("Database not configured.");
  return db;
}

const Patch = z.object({
  id: z.string().uuid(),
  price_cents: z.number().int().min(100).max(100000).optional(),
  stock: z.number().int().min(0).max(100000).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export async function updateProduct(input: z.infer<typeof Patch>): Promise<Result> {
  try {
    const db = await requireAdmin();
    const { id, ...patch } = Patch.parse(input);
    const { error } = await db.from("shop_products").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    updateTag("products");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const NewProduct = z.object({
  name: z.string().trim().min(2).max(60),
  origin: z.string().trim().min(2).max(40),
  region: z.string().trim().max(60),
  process: z.enum(["washed", "natural", "honey", "decaf", "blend"]),
  roast: z.enum(["light", "medium", "dark"]),
  notes: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1200),
  price: z.coerce.number().min(1).max(1000),
  stock: z.coerce.number().int().min(0).max(100000),
  palette: z.enum(["forest", "clay", "sky", "plum", "sand", "night", "rose", "sage"]),
  pattern: z.enum(["hills", "sun", "waves", "leaf", "grid", "dots"]),
});

export async function createProduct(_prev: Result | null, form: FormData): Promise<Result> {
  try {
    const db = await requireAdmin();
    const parsed = NewProduct.safeParse(Object.fromEntries(form));
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
    const v = parsed.data;
    const notes = v.notes.split(",").map((n) => n.trim().toLowerCase()).filter(Boolean).slice(0, 4);
    const slug = v.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    const row = {
      slug,
      name: v.name,
      origin: v.origin,
      region: v.region,
      process: v.process,
      roast: v.roast,
      notes,
      description: v.description,
      price_cents: Math.round(v.price * 100),
      stock: v.stock,
      palette: v.palette,
      pattern: v.pattern,
    };
    let embedding: number[] | null = null;
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        [embedding] = await embedProducts([productText(row)]);
      } catch (e) {
        console.error("[admin] embedding failed", e); // product still saves; run scripts/embed-products.mjs later
      }
    }
    const { error } = await db.from("shop_products").insert({ ...row, embedding: embedding ? JSON.stringify(embedding) : null });
    if (error) return { ok: false, error: /duplicate|unique/i.test(error.message) ? "A coffee with that name already exists." : error.message };
    updateTag("products");
    return { ok: true, message: `${v.name} is live in the shop.` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
