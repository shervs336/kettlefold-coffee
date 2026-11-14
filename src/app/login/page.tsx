import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

async function Form({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return <LoginForm next={next?.startsWith("/") && !next.startsWith("//") ? next : "/admin"} linkError={error === "link"} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto max-w-sm px-4 pt-16">
      <p className="text-xs font-semibold tracking-[0.2em] text-fern uppercase">Roastery admin</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-roast">For shop staff. We&apos;ll email you a sign-in link.</p>
      <Suspense>
        <Form searchParams={searchParams as Promise<{ next?: string; error?: string }>} />
      </Suspense>
    </main>
  );
}
