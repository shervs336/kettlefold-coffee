"use server";

import { updateTag } from "next/cache";

/** Refreshes cached product data (stock) after an order is confirmed. */
export async function refreshProducts() {
  updateTag("products");
}
