import type { Metadata } from "next";
import { CONTACT_EMAIL, LAST_UPDATED } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for the free StatementFlow PDF bank statement to CSV and Excel converter.",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_p]:mt-3 [&_p]:text-slate-600">
      <h1 className="text-3xl font-bold text-slate-900">Terms of Use</h1>
      <p className="text-sm">Last updated: {LAST_UPDATED}</p>
      <h2>The service</h2>
      <p>
        StatementFlow is a free tool that extracts transactions from PDF statements and exports them as CSV or Excel files. Processing happens on your device.
      </p>
      <h2>Your responsibility</h2>
      <p>
        Automated extraction can make mistakes on unusual layouts. Always review the converted data, and use the reconciliation check, before relying on it
        for accounting, tax or legal purposes. Only convert statements you are authorised to access.
      </p>
      <h2>No warranty</h2>
      <p>
        The service is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law, StatementFlow is not liable for any loss
        arising from use of the service or the converted data.
      </p>
      <h2>Trademarks</h2>
      <p>
        StatementFlow is not affiliated with, endorsed by or sponsored by any bank, card issuer or accounting software provider. Product names are mentioned only
        to describe compatibility.
      </p>
      <h2>Contact</h2>
      <p>
        Email <a className="text-emerald-700 underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </article>
  );
}
