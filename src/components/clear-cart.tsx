"use client";

import { useEffect } from "react";
import { cart } from "@/lib/cart";
import { refreshProducts } from "@/app/actions";

/** Empties the cart once the order is confirmed, and refreshes stock levels. */
export function ClearCart() {
  useEffect(() => {
    cart.clear();
    void refreshProducts();
  }, []);
  return null;
}
