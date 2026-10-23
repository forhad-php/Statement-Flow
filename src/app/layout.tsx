import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { BRAND, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PDF Bank Statement to CSV & Excel Converter (Free) | StatementFlow",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Convert any PDF bank statement to CSV or Excel in seconds. Free AI bank statement converter with automatic balance reconciliation. No upload, 100% private.",
  applicationName: BRAND,
  openGraph: { type: "website", siteName: BRAND, locale: "en_US" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#059669", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-slate-800">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
          <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main">
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
              <Logo />
              <span>
                StatementFlow <span className="text-emerald-600">AI</span>
              </span>
            </Link>
            <div className="flex items-center gap-1 text-sm font-medium text-slate-600 sm:gap-4">
              <Link href="/#how-it-works" className="hidden px-2 py-1 hover:text-slate-900 sm:block">
                How it works
              </Link>
              <Link href="/#features" className="hidden px-2 py-1 hover:text-slate-900 sm:block">
                Features
              </Link>
              <Link href="/#faq" className="hidden px-2 py-1 hover:text-slate-900 sm:block">
                FAQ
              </Link>
              <Link href="/#converter" className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
                Convert PDF
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3 sm:px-6">
            <div>
              <p className="flex items-center gap-2 font-bold text-slate-900">
                <Logo /> StatementFlow AI
              </p>
              <p className="mt-2 text-slate-500">Free PDF bank statement to CSV &amp; Excel converter with automatic reconciliation.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Tool</p>
              <ul className="mt-2 space-y-1.5 text-slate-600">
                <li>
                  <Link href="/#converter" className="hover:text-slate-900">
                    PDF bank statement to CSV
                  </Link>
                </li>
                <li>
                  <Link href="/#converter" className="hover:text-slate-900">
                    Bank statement PDF to Excel
                  </Link>
                </li>
                <li>
                  <Link href="/#faq" className="hover:text-slate-900">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Legal</p>
              <ul className="mt-2 space-y-1.5 text-slate-600">
                <li>
                  <Link href="/privacy" className="hover:text-slate-900">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-slate-900">
                    Terms of Use
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <p className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
            © 2026 StatementFlow. Not affiliated with any bank. All trademarks belong to their owners.
          </p>
        </footer>
      </body>
    </html>
  );
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#059669" />
      <path d="M9 10h14M9 16h9M9 22h6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M19 21l2.5 2.5L26 19" stroke="#a7f3d0" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
