"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { reconcile, toCSV, type StatementType, type Transaction } from "@/lib/statement-parser";
import { readStatement, StatementReadError, type ReadError } from "@/lib/load-pdf";

type EditRow = { id: number; date: string; description: string; debit: string; credit: string; balance: string };

type Phase =
  | { kind: "idle" }
  | { kind: "loading"; message: string }
  | { kind: "password"; wrong: boolean }
  | { kind: "error"; code: ReadError | "not-pdf" | "too-big" }
  | { kind: "done" };

const MAX_MB = 30;
const ERRORS: Record<ReadError | "not-pdf" | "too-big", { title: string; body: string }> = {
  "not-pdf": { title: "That's not a PDF", body: "Please choose a PDF bank or credit card statement (.pdf)." },
  "too-big": { title: "File is too large", body: `Please use a PDF under ${MAX_MB} MB.` },
  scanned: {
    title: "This looks like a scanned PDF",
    body: "This version reads digital PDF statements (the kind you download from online banking). AI scanning for paper/photo statements is coming soon.",
  },
  "no-transactions": {
    title: "No transaction table found",
    body: "We couldn't detect dated rows with amounts in this PDF. Make sure it's an account statement with a transaction list, not a summary or letter.",
  },
  invalid: { title: "Couldn't open this PDF", body: "The file may be damaged. Try downloading the statement again from your bank." },
  password: { title: "", body: "" },
  "wrong-password": { title: "", body: "" },
};

const money = (n: number | null) =>
  n === null || !Number.isFinite(n) ? "—" : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const str = (n: number | null) => (n === null ? "" : n.toFixed(2));
const num = (s: string): number | null => {
  const t = s.replace(/[,\s$€£₹]/g, "").replace(/^\((.*)\)$/, "-$1");
  if (!t) return null;
  const v = Number(t);
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
};

export default function StatementConverter() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [fileName, setFileName] = useState("");
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState<EditRow[]>([]);
  const [opening, setOpening] = useState("");
  const [closing, setClosing] = useState("");
  const [type, setType] = useState<StatementType>("bank");
  const [password, setPassword] = useState("");
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const bytesRef = useRef<Uint8Array | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);

  const run = useCallback(async (bytes: Uint8Array, pwd?: string) => {
    setPhase({ kind: "loading", message: "Opening PDF…" });
    try {
      const res = await readStatement(bytes, pwd, (p, t) => setPhase({ kind: "loading", message: `Reading page ${p} of ${t}…` }));
      setRows(res.transactions.map((t) => ({ id: nextId.current++, date: t.date, description: t.description, debit: str(t.debit), credit: str(t.credit), balance: str(t.balance) })));
      setOpening(str(res.openingBalance));
      setClosing(str(res.closingBalance));
      setType(res.statementType);
      setPages(res.pages);
      setPassword("");
      setPhase({ kind: "done" });
    } catch (e) {
      const code = e instanceof StatementReadError ? e.code : "invalid";
      if (code === "password" || code === "wrong-password") setPhase({ kind: "password", wrong: code === "wrong-password" });
      else setPhase({ kind: "error", code });
    }
  }, []);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) return setPhase({ kind: "error", code: "not-pdf" });
      if (file.size > MAX_MB * 1024 * 1024) return setPhase({ kind: "error", code: "too-big" });
      setFileName(file.name);
      const bytes = new Uint8Array(await file.arrayBuffer());
      bytesRef.current = bytes;
      run(bytes);
    },
    [run],
  );

  const loadSample = async () => {
    setPhase({ kind: "loading", message: "Loading sample statement…" });
    const res = await fetch("/sample-bank-statement.pdf");
    const bytes = new Uint8Array(await res.arrayBuffer());
    bytesRef.current = bytes;
    setFileName("sample-bank-statement.pdf");
    run(bytes);
  };

  const reset = () => {
    setPhase({ kind: "idle" });
    setRows([]);
    bytesRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
  };

  const txns: Transaction[] = useMemo(
    () => rows.map((r) => ({ date: r.date.trim(), description: r.description.trim(), debit: num(r.debit), credit: num(r.credit), balance: num(r.balance) })),
    [rows],
  );
  const rec = useMemo(() => reconcile(txns, num(opening), num(closing), type), [txns, opening, closing, type]);
  const broken = useMemo(() => new Set(rec.brokenRows), [rec]);

  const update = (id: number, key: keyof Omit<EditRow, "id">, value: string) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const removeRow = (id: number) => setRows((rs) => rs.filter((r) => r.id !== id));
  const addRow = () => setRows((rs) => [...rs, { id: nextId.current++, date: "", description: "", debit: "", credit: "", balance: "" }]);

  const baseName = fileName.replace(/\.pdf$/i, "") || "statement";
  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const exportCSV = () => download(new Blob([toCSV(txns)], { type: "text/csv;charset=utf-8" }), `${baseName}.csv`);
  const exportXLSX = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([["Date", "Description", "Debit", "Credit", "Balance"], ...txns.map((t) => [t.date, t.description, t.debit, t.credit, t.balance])]);
    ws["!cols"] = [{ wch: 14 }, { wch: 48 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    const summary = XLSX.utils.aoa_to_sheet([
      ["Opening balance", rec.opening],
      ["Total credits", rec.totalCredits],
      ["Total debits", rec.totalDebits],
      ["Closing balance", rec.closing],
      ["Reconciliation", rec.status === "reconciled" ? "100% Reconciled" : rec.status === "mismatch" ? `Off by ${money(rec.difference)}` : "Not verified"],
      ["Transactions", txns.length],
    ]);
    summary["!cols"] = [{ wch: 18 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.utils.book_append_sheet(wb, summary, "Summary");
    XLSX.writeFile(wb, `${baseName}.xlsx`, { compression: true });
  };
  const copyTable = async () => {
    const tsv = ["Date\tDescription\tDebit\tCredit\tBalance", ...txns.map((t) => [t.date, t.description, str(t.debit), str(t.credit), str(t.balance)].join("\t"))].join("\n");
    await navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (phase.kind === "done") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{fileName}</p>
            <p className="text-sm text-slate-500">
              {pages} page{pages === 1 ? "" : "s"} · {txns.length} transactions · {rec.mode === "card" ? "Credit card statement" : "Bank statement"}
            </p>
          </div>
          <button onClick={reset} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Convert another file
          </button>
        </div>

        <div className="space-y-4 p-5">
          <ReconcileBadge status={rec.status} difference={rec.difference} brokenCount={rec.brokenRows.length} mode={rec.mode} />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryInput label="Opening balance" value={opening} onChange={setOpening} />
            <SummaryStat label="Total credits (+)" value={money(rec.totalCredits)} tone="text-emerald-700" />
            <SummaryStat label="Total debits (−)" value={money(rec.totalDebits)} tone="text-rose-700" />
            <SummaryInput label="Closing balance" value={closing} onChange={setClosing} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-emerald-700">
              <DownloadIcon /> Download CSV
            </button>
            <button onClick={exportXLSX} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-sm hover:bg-slate-800">
              <DownloadIcon /> Download Excel (.xlsx)
            </button>
            <button onClick={copyTable} className="rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
              {copied ? "Copied!" : "Copy table"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="w-28 px-2 py-2.5">Date</th>
                  <th className="px-2 py-2.5">Description</th>
                  <th className="w-28 px-2 py-2.5 text-right">Debit</th>
                  <th className="w-28 px-2 py-2.5 text-right">Credit</th>
                  <th className="w-32 px-2 py-2.5 text-right">Balance</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={`border-t border-slate-100 ${broken.has(i) ? "bg-amber-50" : ""}`} title={broken.has(i) ? "Running balance doesn't match on this row — check the amounts" : undefined}>
                    <td className="px-1 py-1">
                      <Cell value={r.date} onChange={(v) => update(r.id, "date", v)} label={`Date row ${i + 1}`} />
                    </td>
                    <td className="px-1 py-1">
                      <Cell value={r.description} onChange={(v) => update(r.id, "description", v)} label={`Description row ${i + 1}`} />
                    </td>
                    <td className="px-1 py-1">
                      <Cell value={r.debit} onChange={(v) => update(r.id, "debit", v)} right className="text-rose-700" label={`Debit row ${i + 1}`} />
                    </td>
                    <td className="px-1 py-1">
                      <Cell value={r.credit} onChange={(v) => update(r.id, "credit", v)} right className="text-emerald-700" label={`Credit row ${i + 1}`} />
                    </td>
                    <td className="px-1 py-1">
                      <Cell value={r.balance} onChange={(v) => update(r.id, "balance", v)} right className={broken.has(i) ? "font-semibold text-amber-700" : ""} label={`Balance row ${i + 1}`} />
                    </td>
                    <td className="px-1 py-1 text-center">
                      <button onClick={() => removeRow(r.id)} aria-label={`Delete row ${i + 1}`} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addRow} className="text-sm font-medium text-emerald-700 hover:underline">
            + Add row
          </button>
          <p className="text-xs text-slate-500">Every cell is editable. Totals and the reconciliation check update instantly as you edit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/5 sm:p-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50/60"
        }`}
      >
        {phase.kind === "loading" ? (
          <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
            <p className="font-medium text-slate-700">{phase.message}</p>
          </div>
        ) : phase.kind === "password" ? (
          <form
            className="flex w-full max-w-sm flex-col items-center gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (bytesRef.current && password) run(bytesRef.current, password);
            }}
          >
            <LockIcon />
            <p className="font-semibold text-slate-900">This statement is password-protected</p>
            <p className="text-sm text-slate-500">The password is only used in your browser to open the file.</p>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PDF password"
              aria-label="PDF password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
            {phase.wrong && <p className="text-sm text-rose-600">Incorrect password, please try again.</p>}
            <div className="flex gap-2">
              <button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700">
                Unlock &amp; convert
              </button>
              <button type="button" onClick={reset} className="rounded-lg px-4 py-2.5 text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <UploadIcon />
            <p className="mt-3 text-lg font-semibold text-slate-900">Drop your bank statement PDF here</p>
            <p className="mt-1 text-sm text-slate-500">Bank &amp; credit card statements · Multi-page · Password-protected PDFs</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-5 rounded-xl bg-emerald-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
              Choose PDF file
            </button>
            <button onClick={loadSample} className="mt-3 text-sm font-medium text-emerald-700 hover:underline">
              or try a sample statement
            </button>
            {phase.kind === "error" && (
              <div className="mt-5 max-w-md rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm" role="alert">
                <p className="font-semibold text-rose-800">{ERRORS[phase.code].title}</p>
                <p className="mt-0.5 text-rose-700">{ERRORS[phase.code].body}</p>
              </div>
            )}
          </>
        )}
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <ShieldIcon /> 100% private: your PDF is processed in your browser and never uploaded.
      </p>
    </div>
  );
}

function ReconcileBadge({ status, difference, brokenCount, mode }: { status: string; difference: number | null; brokenCount: number; mode: StatementType }) {
  const formula = mode === "card" ? "Previous balance + Charges − Payments = New balance" : "Opening balance + Credits − Debits = Closing balance";
  if (status === "reconciled")
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm text-white">✓</span>
        <div>
          <p className="font-semibold text-emerald-800">100% Reconciled</p>
          <p className="text-sm text-emerald-700">{formula}. Every transaction is accounted for.</p>
        </div>
      </div>
    );
  if (status === "mismatch")
    return (
      <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-600 text-sm font-bold text-white">!</span>
        <div>
          <p className="font-semibold text-rose-800">Not reconciled{difference !== null && difference !== 0 ? `: off by ${money(Math.abs(difference))}` : ""}</p>
          <p className="text-sm text-rose-700">
            {brokenCount > 0 ? `${brokenCount} row${brokenCount === 1 ? "" : "s"} highlighted where the running balance breaks. ` : ""}
            Check those rows or the opening/closing balance and edit them below.
          </p>
        </div>
      </div>
    );
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-400 text-sm font-bold text-white">?</span>
      <div>
        <p className="font-semibold text-slate-800">Reconciliation not verified</p>
        <p className="text-sm text-slate-600">We couldn&apos;t find the opening/closing balance. Type them in below to run the check.</p>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-200 px-3 py-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function SummaryInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-emerald-500">
      <span className="text-xs text-slate-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" placeholder="Enter" className="mt-0.5 w-full bg-transparent text-lg font-semibold text-slate-900 tabular-nums outline-none" />
    </label>
  );
}

function Cell({ value, onChange, right, className = "", label }: { value: string; onChange: (v: string) => void; right?: boolean; className?: string; label: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      inputMode={right ? "decimal" : undefined}
      className={`w-full rounded-md border border-transparent bg-transparent px-1.5 py-1.5 tabular-nums outline-none hover:border-slate-200 focus:border-emerald-500 focus:bg-white ${right ? "text-right" : ""} ${className}`}
    />
  );
}

const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-600" aria-hidden>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M12 18v-6M9 15l3-3 3 3" />
  </svg>
);
const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </svg>
);
const LockIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-600" aria-hidden>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600" aria-hidden>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
  </svg>
);
