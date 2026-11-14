import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { PRODUCT_COLUMNS, type Product } from "./catalog";
import { createPublicClient } from "./supabase/server";

/** All active products. Cached and tagged so admin edits and purchases can refresh it. */
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db.from("shop_products").select(PRODUCT_COLUMNS).eq("active", true).order("name");
  if (error) {
    console.error("[products]", error.message);
    return [];
  }
  return data as Product[];
}

export async function getProduct(slug: string) {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}
