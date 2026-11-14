import Link from "next/link";
import { Wordmark } from "@/components/site-header";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-sm text-roast">Small-batch coffee, roasted to order and shipped within 48 hours.</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Shop</p>
          <ul className="mt-3 space-y-2 text-roast">
            <li><Link href="/shop" className="hover:text-espresso">All coffee</Link></li>
            <li><Link href="/shop?roast=dark" className="hover:text-espresso">Dark roasts</Link></li>
            <li><Link href="/shop?process=blend" className="hover:text-espresso">Blends</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">About this site</p>
          <p className="mt-3 text-roast">
            Kettlefold is a fictional roaster made for a portfolio project. Checkout runs in Stripe <strong>test mode</strong>: no real
            payments, no real coffee.
          </p>
        </div>
      </div>
      <p className="border-t border-line py-5 text-center text-xs text-roast">
        © 2026 Kettlefold Coffee (fictional) · <Link href="/admin" className="underline-offset-2 hover:underline">Admin</Link>
      </p>
    </footer>
  );
}
