import Link from "next/link";
import { CartButton } from "@/components/cart-drawer";
import { getProducts } from "@/lib/products";

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
        <path d="M5 8h14l-1.2 11.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8Z" fill="#1f4d3a" />
        <path d="M4 5.5h16L19 8H5Z" fill="#d9a441" />
        <path d="M9 12.5c2-1.5 4 1.5 6 0" stroke="#f6f0e6" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
      <span className="font-display text-[1.45rem] font-semibold tracking-tight">Kettlefold</span>
    </span>
  );
}

export async function SiteHeader() {
  const products = await getProducts();
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Kettlefold home" className="rounded-md focus-visible:outline-2 focus-visible:outline-fern">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="ml-auto flex items-center gap-1 text-sm sm:ml-0">
          <Link href="/shop" className="rounded-full px-3 py-1.5 text-roast hover:bg-espresso/5 hover:text-espresso">
            Shop
          </Link>
          <Link href="/shop?roast=light" className="hidden rounded-full px-3 py-1.5 text-roast hover:bg-espresso/5 hover:text-espresso sm:inline">
            Light roasts
          </Link>
          <Link href="/shop?process=decaf" className="hidden rounded-full px-3 py-1.5 text-roast hover:bg-espresso/5 hover:text-espresso sm:inline">
            Decaf
          </Link>
        </nav>
        <div className="sm:ml-auto">
          <CartButton products={products} />
        </div>
      </div>
    </header>
  );
}
