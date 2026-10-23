import type { Metadata } from "next";
import StatementConverter from "@/components/StatementConverter";
import { BRAND, FAQS, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "PDF Bank Statement to CSV & Excel Converter (Free)",
    description: "Convert PDF bank & credit card statements to CSV or Excel in seconds, with automatic balance reconciliation. 100% private, no upload.",
  },
};

const STEPS = [
  { t: "Upload your PDF statement", d: "Drag and drop a bank or credit card statement PDF downloaded from online banking. Multi-page and password-protected files work too." },
  { t: "Review & reconcile", d: "Transactions appear in a clean, editable table. The reconciliation check confirms Opening + Credits − Debits = Closing to the cent." },
  { t: "Download CSV or Excel", d: "Export a ready-to-import CSV or a formatted Excel (.xlsx) file for QuickBooks, Xero, Google Sheets or your own spreadsheet." },
];

const FEATURES = [
  { t: "100% private, no upload", d: "Your statement is converted inside your browser. Nothing is sent to a server, so sensitive account data never leaves your device." },
  { t: "Automatic reconciliation", d: "A green 100% Reconciled badge proves every transaction was captured. Rows where the running balance breaks are highlighted for you." },
  { t: "Smart column detection", d: "Finds Date, Description, Debit, Credit and Balance columns on any layout: separate debit/credit columns, signed amounts, CR/DR markers or brackets." },
  { t: "CSV & Excel export", d: "One click to a clean CSV (UTF-8, Excel-friendly) or an .xlsx workbook with a Transactions sheet and a Summary sheet." },
  { t: "Works with thousands of banks", d: "No bank templates needed. US, UK, EU, Indian and Australian statements, any date style, 1,234.56 or 1.234,56 amounts." },
  { t: "Free, no sign-up", d: "No account, no email, no page limits and no watermark. Open the page, convert your statement, done." },
];

const SAMPLE = [
  ["01/02", "Direct deposit ACME CORP PAYROLL", "", "3,125.40", "5,575.40"],
  ["01/03", "Card purchase WHOLE FOODS #1023", "87.45", "", "5,487.95"],
  ["01/05", "Online transfer to savings", "500.00", "", "4,987.95"],
  ["01/06", "Zelle payment from J SMITH", "", "120.00", "5,107.95"],
];

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${SITE_URL}/#org`, name: BRAND, url: SITE_URL, logo: `${SITE_URL}/icon.svg` },
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: BRAND, url: SITE_URL, publisher: { "@id": `${SITE_URL}/#org` } },
      {
        "@type": "WebApplication",
        name: "StatementFlow: PDF Bank Statement to CSV Converter",
        url: SITE_URL,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript",
        description: "Free AI bank statement converter that turns PDF bank and credit card statements into CSV and Excel files with automatic balance reconciliation.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: ["PDF bank statement to CSV", "PDF bank statement to Excel (XLSX)", "Automatic balance reconciliation", "Password-protected PDF support", "In-browser processing, no upload"],
        publisher: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section id="converter" className="relative overflow-hidden bg-gradient-to-b from-emerald-50/80 via-white to-white">
        <div className="mx-auto max-w-5xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
              Free · No sign-up · Files never leave your device
            </p>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              PDF Bank Statement to <span className="text-emerald-600">CSV</span> &amp; Excel Converter
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Convert any bank or credit card statement PDF into a clean <strong>Date · Description · Debit · Credit · Balance</strong> spreadsheet in seconds, with
              an automatic reconciliation check so you know every transaction adds up.
            </p>
          </div>
          <div className="mt-10">
            <StatementConverter />
          </div>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <li>✓ Works with thousands of banks</li>
            <li>✓ Multi-page statements</li>
            <li>✓ Password-protected PDFs</li>
            <li>✓ CSV &amp; XLSX export</li>
          </ul>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">How to convert a bank statement PDF to CSV</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.t} className="rounded-2xl border border-slate-200 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">{i + 1}</span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.t}</h3>
              <p className="mt-2 text-slate-600">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Clean, import-ready output</h2>
            <p className="mt-4 text-slate-600">
              Copy-pasting from a PDF scrambles dates and amounts. StatementFlow rebuilds the transaction table properly: one row per transaction, multi-line
              descriptions merged, debits and credits in their own columns and the running balance kept intact.
            </p>
            <p className="mt-3 text-slate-600">
              The CSV opens perfectly in Excel and Google Sheets and imports into QuickBooks Online, Xero, Wave and other bookkeeping tools.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[520px] text-sm">
              <caption className="sr-only">Example of a converted bank statement</caption>
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="px-3 py-2.5 text-right">Debit</th>
                  <th className="px-3 py-2.5 text-right">Credit</th>
                  <th className="px-3 py-2.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {SAMPLE.map((r) => (
                  <tr key={r[1]} className="border-t border-slate-100">
                    <td className="px-3 py-2">{r[0]}</td>
                    <td className="px-3 py-2">{r[1]}</td>
                    <td className="px-3 py-2 text-right text-rose-700">{r[2]}</td>
                    <td className="px-3 py-2 text-right text-emerald-700">{r[3]}</td>
                    <td className="px-3 py-2 text-right">{r[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-sm font-semibold text-emerald-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">✓</span> 100% Reconciled
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">A bank statement converter built for bookkeepers</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          Everything you need to get statement data into your books, and nothing you don&apos;t.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900">{f.t}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Bank statement converter with AI-grade accuracy checks</h2>
            <p className="mt-4 text-slate-300">
              Most PDF to Excel tools just dump text. StatementFlow understands statement structure: it finds the transaction table on every page, carries dates
              across rows, recognises opening and closing balances and then proves the result with math. If the numbers don&apos;t add up, you&apos;ll know
              exactly which row to check.
            </p>
            <p className="mt-3 text-slate-300">
              <strong className="text-white">Coming soon:</strong> AI scanning for paper statements and phone photos, automatic expense categories and more export
              formats.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Who uses StatementFlow?</h3>
            <ul className="mt-4 space-y-3 text-slate-300">
              <li>
                <strong className="text-white">Bookkeepers &amp; accountants:</strong> catch up clients&apos; books from months of PDF statements.
              </li>
              <li>
                <strong className="text-white">Small business owners:</strong> get bank transactions into a spreadsheet for expenses and cash flow.
              </li>
              <li>
                <strong className="text-white">Tax season:</strong> pull a full year of transactions for deductions and records.
              </li>
              <li>
                <strong className="text-white">Loan &amp; mortgage applications:</strong> summarise income and spending in minutes.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Frequently asked questions</h2>
        <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                <h3>{f.q}</h3>
                <span className="text-xl text-emerald-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-12 text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight">Convert your bank statement now</h2>
          <p className="mx-auto mt-3 max-w-xl text-emerald-50">Free, private and done in seconds. No account needed.</p>
          <a href="#converter" className="mt-6 inline-block rounded-xl bg-white px-7 py-3.5 font-semibold text-emerald-700 shadow-lg hover:bg-emerald-50">
            Convert PDF to CSV
          </a>
          <p className="mt-4 text-sm text-emerald-100">Android app coming soon on Google Play.</p>
        </div>
      </section>
    </>
  );
}
