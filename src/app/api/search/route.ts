import { embedQuery } from "@/lib/embeddings";
import { createAdminClient } from "@/lib/supabase/server";

type Result = { slug: string; similarity: number };
const cache = new Map<string, Result[]>(); // small per-instance cache: repeated queries cost nothing

/** Taste search: embeds the description and finds the closest coffees with pgvector. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 120) ?? "";
  if (q.length < 3) return Response.json({ error: "Describe the cup in a few words." }, { status: 400 });
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return Response.json({ error: "Taste search isn't configured here." }, { status: 503 });

  const key = q.toLowerCase();
  if (cache.has(key)) return Response.json({ results: cache.get(key) });

  const db = createAdminClient();
  if (!db) return Response.json({ error: "Search is unavailable." }, { status: 503 });
  try {
    const embedding = await embedQuery(q);
    const { data, error } = await db.rpc("shop_match_products", { query_embedding: JSON.stringify(embedding), match_count: 6 });
    if (error) throw new Error(error.message);
    const results = ((data ?? []) as { slug: string; similarity: number }[]).map((r) => ({ slug: r.slug, similarity: r.similarity }));
    if (cache.size > 200) cache.clear();
    cache.set(key, results);
    return Response.json({ results });
  } catch (err) {
    console.error("[search]", err);
    const busy = /quota|rate|429/i.test(String(err));
    return Response.json({ error: busy ? "Taste search is busy. Try again in a minute." : "Search failed. Please try again." }, { status: busy ? 429 : 500 });
  }
}
