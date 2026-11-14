"use client";

import { useState } from "react";
import { MailCheckIcon } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState(linkError ? "That sign-in link expired or was already used. Request a new one." : "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await createBrowserSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setState("error");
      setMessage(/rate|limit/i.test(error.message) ? "Too many sign-in emails right now. Try again in a few minutes." : error.message);
    } else setState("sent");
  }

  if (state === "sent") {
    return (
      <div role="status" className="mt-8 rounded-3xl bg-paper p-6 soft-shadow">
        <MailCheckIcon className="size-5 text-fern" />
        <p className="mt-3 font-medium">Check your inbox</p>
        <p className="mt-1 text-sm text-roast">
          We sent a sign-in link to <span className="text-espresso">{email}</span>.
        </p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="mt-8 space-y-3">
      <label htmlFor="email" className="text-sm font-medium">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="block w-full rounded-2xl border-2 border-line bg-paper px-4 py-3 outline-none focus:border-fern"
      />
      <button disabled={state === "sending"} className="h-12 w-full rounded-full bg-fern font-medium text-cream hover:bg-fern-soft disabled:opacity-60">
        {state === "sending" ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p aria-live="polite" className="min-h-5 text-sm text-[#b3261e]">
        {message}
      </p>
    </form>
  );
}
