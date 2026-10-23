import type { Metadata } from "next";
import { CONTACT_EMAIL, LAST_UPDATED } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "StatementFlow converts bank statements in your browser. Your PDF and financial data are never uploaded or stored.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:mt-1 [&_p]:mt-3 [&_p]:text-slate-600 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-slate-600">
      <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="text-sm">Last updated: {LAST_UPDATED}</p>
      <p>
        StatementFlow (&quot;we&quot;, &quot;us&quot;) provides a free tool that converts PDF bank and credit card statements into CSV and Excel files. This policy
        explains what happens to your data.
      </p>
      <h2>Your statements never leave your device</h2>
      <p>
        When you choose a PDF, it is opened and processed entirely inside your web browser (or inside our mobile app on your phone). The file, its contents,
        any PDF password you enter and the converted transactions are <strong>not uploaded</strong> to our servers or any third party, and we cannot see them.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>We do not require an account and do not collect your name, email or financial data.</li>
        <li>Our hosting provider may keep standard server logs (such as IP address, browser type and pages requested) for security and reliability.</li>
        <li>If you email us, we receive your email address and message so we can reply.</li>
      </ul>
      <h2>Cookies</h2>
      <p>The converter does not use cookies to track you. If we add privacy-friendly analytics or advertising in the future, this policy will be updated first.</p>
      <h2>Children</h2>
      <p>The service is not directed to children under 13 and we do not knowingly collect their information.</p>
      <h2>Changes</h2>
      <p>We may update this policy from time to time. The date above shows the latest version.</p>
      <h2>Contact</h2>
      <p>
        Questions? Email <a className="text-emerald-700 underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </article>
  );
}
