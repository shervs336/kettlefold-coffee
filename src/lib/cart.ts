"use client";

import { useSyncExternalStore } from "react";
import type { GrindId, SizeId } from "./catalog";

export type CartLine = { productId: string; slug: string; size: SizeId; grind: GrindId; quantity: number };

const KEY = "kettlefold-cart";
const listeners = new Set<() => void>();
let cache: CartLine[] | null = null;
const EMPTY: CartLine[] = [];

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // storage blocked: the cart still works for this tab
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage); // keep other tabs in sync
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const same = (a: CartLine, b: Pick<CartLine, "productId" | "size" | "grind">) =>
  a.productId === b.productId && a.size === b.size && a.grind === b.grind;

export const cart = {
  add(line: CartLine) {
    const lines = read();
    const existing = lines.find((l) => same(l, line));
    write(
      existing
        ? lines.map((l) => (same(l, line) ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) } : l))
        : [...lines, line].slice(0, 20),
    );
  },
  setQuantity(line: CartLine, quantity: number) {
    write(quantity <= 0 ? read().filter((l) => !same(l, line)) : read().map((l) => (same(l, line) ? { ...l, quantity: Math.min(20, quantity) } : l)));
  },
  remove(line: CartLine) {
    write(read().filter((l) => !same(l, line)));
  },
  clear() {
    write([]);
  },
};

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
