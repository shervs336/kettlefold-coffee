import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["SOFT", "opsz"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://kettlefold-coffee.vercel.app"),
  title: { default: "Kettlefold Coffee: small-batch roasts, folded with care", template: "%s · Kettlefold Coffee" },
  description: "Specialty coffee roasted to order in small batches. Single origins, house blends and a decaf worth drinking.",
  openGraph: { title: "Kettlefold Coffee", description: "Small-batch coffee, roasted to order.", type: "website" },
};

export const viewport: Viewport = { themeColor: "#f6f0e6" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
