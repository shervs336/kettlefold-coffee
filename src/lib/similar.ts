import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createAdminClient } from "./supabase/server";

/** Products whose descriptions are closest in meaning (pgvector cosine distance). */
export async function similarSlugs(productId: string, count = 3): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const db = createAdminClient();
  if (!db) return [];
  const { data: row } = await db.from("shop_products").select("embedding").eq("id", productId).maybeSingle();
  if (!row?.embedding) return [];
  const { data } = await db.rpc("shop_match_products", { query_embedding: row.embedding, match_count: count + 1 });
  return ((data ?? []) as { id: string; slug: string }[]).filter((r) => r.id !== productId).slice(0, count).map((r) => r.slug);
}
