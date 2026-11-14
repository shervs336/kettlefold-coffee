import "server-only";
import { money } from "./catalog";

type Summary = {
  orderId: string;
  email: string | null;
  name: string | null;
  total: number;
  items: { name: string; detail: string; quantity: number; amount: number }[];
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Order confirmation through Resend (free tier). Returns true if sent. */
export async function sendReceipt(order: Summary, shipping: number) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !order.email) return false;
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #e6dccb">${esc(i.name)} × ${i.quantity}<br><span style="color:#6b5547;font-size:13px">${esc(i.detail)}</span></td>
        <td style="padding:10px 0;border-bottom:1px solid #e6dccb;text-align:right">${money(i.amount)}</td>
      </tr>`,
    )
    .join("");
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;background:#fbf8f2;color:#2b1d14">
  <p style="letter-spacing:3px;font-size:11px;color:#1f4d3a;margin:0 0 12px">KETTLEFOLD COFFEE</p>
  <h1 style="font-family:Georgia,serif;font-weight:600;font-size:28px;margin:0 0 8px">Thanks${order.name ? `, ${esc(order.name.split(" ")[0])}` : ""}! Your coffee is on the roaster.</h1>
  <p style="color:#6b5547;line-height:1.6">We roast to order, so your beans will be roasted within one business day and shipped right after.</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0">${rows}
    <tr><td style="padding:10px 0;color:#6b5547">Shipping</td><td style="padding:10px 0;text-align:right">${shipping ? money(shipping) : "Free"}</td></tr>
    <tr><td style="padding:10px 0;font-weight:bold">Total</td><td style="padding:10px 0;text-align:right;font-weight:bold">${money(order.total)}</td></tr>
  </table>
  <p style="color:#6b5547;font-size:12px">Order ${order.orderId.slice(0, 8).toUpperCase()} · This is a portfolio demo in Stripe test mode: no real payment was taken and nothing will ship.</p>
</div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "Kettlefold Coffee <onboarding@resend.dev>",
        to: order.email,
        subject: `Your Kettlefold order ${order.orderId.slice(0, 8).toUpperCase()}`,
        html,
      }),
    });
    if (!res.ok) console.error("[email]", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[email]", err);
    return false;
  }
}
