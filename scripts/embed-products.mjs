// Computes search embeddings for products that don't have one yet (or all with --all).
//   node --env-file=.env.local scripts/embed-products.mjs [--all]
import { createClient } from "@supabase/supabase-js";
import { embedMany } from "ai";
import { google } from "@ai-sdk/google";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const all = process.argv.includes("--all");

let query = db.from("shop_products").select("id, name, roast, process, origin, region, notes, description");
if (!all) query = query.is("embedding", null);
const { data: products, error } = await query;
if (error) throw error;
if (!products.length) {
  console.log("All products already have embeddings.");
  process.exit(0);
}

const text = (p) => {
  const where = p.origin === "Blend" ? `a blend of ${p.region}` : `${p.region}, ${p.origin}`;
  return `${p.name}: a ${p.roast} roast, ${p.process} coffee from ${where}. Tastes of ${p.notes.join(", ")}. ${p.description}`;
};

const { embeddings } = await embedMany({
  model: google.embedding("gemini-embedding-001"),
  values: products.map(text),
  providerOptions: { google: { outputDimensionality: 768, taskType: "RETRIEVAL_DOCUMENT" } },
});

for (let i = 0; i < products.length; i++) {
  const { error: e } = await db.from("shop_products").update({ embedding: JSON.stringify(embeddings[i]) }).eq("id", products[i].id);
  if (e) throw e;
}
console.log(`Embedded ${products.length} products (${embeddings[0].length} dimensions).`);
