import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "K-Food Safe — Eat Korea Without Worry",
  description:
    "Dietary-restriction-friendly Korean food guide for travelers: halal, vegan, vegetarian, gluten-free, and allergy-safe dining in Busan and beyond.",
};

const NAV = [
  { href: "/dishes", label: "Dish Guide" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/scan", label: "Scan Menu" },
  { href: "/cards", label: "Allergy Cards" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <header className="no-print sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              🥘 K-Food <span className="text-emerald-600">Safe</span>
            </Link>
            <nav className="flex gap-1 text-sm font-medium">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-full px-3 py-1.5 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="no-print border-t border-stone-200 py-6 text-center text-xs text-stone-400">
          Data: Korea Tourism Organization TourAPI · Busan Metropolitan City OpenAPI ·
          Ingredient info is a general guide — always confirm with restaurant staff.
        </footer>
      </body>
    </html>
  );
}
