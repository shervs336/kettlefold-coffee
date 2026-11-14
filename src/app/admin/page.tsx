import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, currentAdmin } from "@/lib/supabase/server";
import { PRODUCT_COLUMNS, money, type Product } from "@/lib/catalog";
import { ProductTable } from "@/components/admin/product-table";
import { NewProductForm } from "@/components/admin/new-product-form";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

type Order = {
  id: string;
  email: string | null;
  customer_name: string | null;
  amount_total: number;
  created_at: string;
  email_sent: boolean;
  shop_order_items: { product_name: string; size: string; quantity: number }[];
};

async function Dashboard() {
  const who = await currentAdmin();
  if (!who?.email) redirect("/login?next=/admin");
  if (!who.isAdmin) {
    return (
      <div className="rounded-3xl bg-paper p-8 soft-shadow">
        <p className="font-display text-2xl font-semibold">This account isn&apos;t an admin.</p>
        <p className="mt-2 text-roast">
          Signed in as {who.email}. Admin access is limited to the emails listed in <code>ADMIN_EMAILS</code>.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button className="rounded-full border-2 border-line px-5 py-2 text-sm font-medium">Sign out</button>
        </form>
      </div>
    );
  }

  const db = createAdminClient()!;
  const [{ data: products }, { data: orders }] = await Promise.all([
    db.from("shop_products").select(PRODUCT_COLUMNS).order("name"),
    db
      .from("shop_orders")
      .select("id, email, customer_name, amount_total, created_at, email_sent, shop_order_items(product_name, size, quantity)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const list = (orders ?? []) as Order[];
  const revenue = list.reduce((s, o) => s + o.amount_total, 0);

  return (
    <div className="space-y-12">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Products", String(products?.length ?? 0)],
          ["Recent orders", String(list.length)],
          ["Recent revenue (test)", money(revenue)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-3xl bg-paper p-5 soft-shadow">
            <p className="text-sm text-roast">{k}</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby="products-h">
        <h2 id="products-h" className="font-display text-2xl font-semibold">
          Products
        </h2>
        <p className="mt-1 text-sm text-roast">Edit price and stock inline. Changes go live in the shop immediately.</p>
        <div className="mt-4">
          <ProductTable products={(products ?? []) as Product[]} />
        </div>
      </section>

      <section aria-labelledby="new-h">
        <h2 id="new-h" className="font-display text-2xl font-semibold">
          Add a coffee
        </h2>
        <p className="mt-1 text-sm text-roast">The bag artwork is generated from the palette and pattern you pick.</p>
        <div className="mt-4">
          <NewProductForm />
        </div>
      </section>

      <section aria-labelledby="orders-h">
        <h2 id="orders-h" className="font-display text-2xl font-semibold">
          Recent orders
        </h2>
        {list.length === 0 ? (
          <p className="mt-3 text-sm text-roast">No orders yet. Place a test order with card 4242 4242 4242 4242.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-3xl bg-paper soft-shadow">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-roast">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Items</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3 align-top">
                      <span className="font-mono text-xs">{o.id.slice(0, 8).toUpperCase()}</span>
                      <span className="block text-xs text-roast">{new Date(o.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</span>
                    </td>
                    <td className="px-5 py-3 align-top">
                      {o.customer_name ?? "—"}
                      <span className="block text-xs text-roast">
                        {o.email} {o.email_sent ? "· receipt sent" : ""}
                      </span>
                    </td>
                    <td className="px-5 py-3 align-top">
                      {o.shop_order_items.map((i, n) => (
                        <span key={n} className="block">
                          {i.quantity} × {i.product_name} ({i.size})
                        </span>
                      ))}
                    </td>
                    <td className="px-5 py-3 text-right align-top font-medium tabular-nums">{money(o.amount_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Roastery admin</h1>
        <Link href="/shop" className="ml-auto text-sm text-fern hover:underline">
          View shop
        </Link>
      </div>
      <div className="mt-8">
        <Suspense fallback={<p className="text-roast">Loading…</p>}>
          <Dashboard />
        </Suspense>
      </div>
    </main>
  );
}
