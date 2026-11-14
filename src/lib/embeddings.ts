import "server-only";
import { embed, embedMany } from "ai";
import { google } from "@ai-sdk/google";
import type { Product } from "./catalog";

const model = google.embedding("gemini-embedding-001");
const DIMS = 768; // matches the vector(768) column

/** The text that describes a coffee for semantic search. */
export function productText(p: Pick<Product, "name" | "roast" | "process" | "origin" | "region" | "notes" | "description">) {
  const where = p.origin === "Blend" ? `a blend of ${p.region}` : `${p.region}, ${p.origin}`;
  return `${p.name}: a ${p.roast} roast, ${p.process} coffee from ${where}. Tastes of ${p.notes.join(", ")}. ${p.description}`;
}

export async function embedQuery(query: string) {
  const { embedding } = await embed({
    model,
    value: query,
    providerOptions: { google: { outputDimensionality: DIMS, taskType: "RETRIEVAL_QUERY" } },
  });
  return embedding;
}

export async function embedProducts(texts: string[]) {
  const { embeddings } = await embedMany({
    model,
    values: texts,
    providerOptions: { google: { outputDimensionality: DIMS, taskType: "RETRIEVAL_DOCUMENT" } },
  });
  return embeddings;
}
