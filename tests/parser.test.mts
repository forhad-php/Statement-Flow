import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { parseStatement, reconcile, parseAmount, toCSV } from "../src/lib/statement-parser.ts";
import { extractTextItems } from "../src/lib/pdf-text.ts";

const dir = join(import.meta.dirname, "fixtures");
const expected = JSON.parse(readFileSync(join(dir, "expected.json"), "utf8"));

async function parseFile(name: string) {
  const data = new Uint8Array(readFileSync(join(dir, `${name}.pdf`)));
  const task = getDocument({ data, verbosity: 0 });
  const items = await extractTextItems(await task.promise);
  await task.destroy();
  return parseStatement(items);
}

for (const name of Object.keys(expected)) {
  test(`parses and reconciles ${name}`, async () => {
    const exp = expected[name];
    const res = await parseFile(name);
    assert.equal(res.transactions.length, exp.count, JSON.stringify(res.transactions, null, 1));
    assert.equal(res.openingBalance, exp.opening);
    assert.equal(res.closingBalance, exp.closing);
    if (exp.type) assert.equal(res.statementType, exp.type);
    const rec = reconcile(res.transactions, res.openingBalance, res.closingBalance, res.statementType);
    assert.equal(rec.status, "reconciled", JSON.stringify({ rec, txns: res.transactions }, null, 1));
    if (exp.first) for (const k of Object.keys(exp.first)) assert.equal((res.transactions[0] as unknown as Record<string, unknown>)[k], exp.first[k], k);
    if (exp.lastDate) assert.equal(res.transactions.at(-1)!.date, exp.lastDate);
  });
}

test("parseAmount handles common formats", () => {
  assert.deepEqual(parseAmount("1,234.56"), { cents: 123456, neg: false, marker: null });
  assert.deepEqual(parseAmount("(45.00)"), { cents: 4500, neg: true, marker: null });
  assert.deepEqual(parseAmount("1.234,56"), { cents: 123456, neg: false, marker: null });
  assert.deepEqual(parseAmount("-$12.30"), { cents: 1230, neg: true, marker: null });
  assert.deepEqual(parseAmount("500.00CR"), { cents: 50000, neg: false, marker: "cr" });
  assert.deepEqual(parseAmount("75.10-"), { cents: 7510, neg: true, marker: null });
  assert.equal(parseAmount("2026"), null);
  assert.equal(parseAmount("12.5%"), null);
});

test("reconcile flags broken running balance and mismatch", () => {
  const txns = [
    { date: "1", description: "a", debit: 10, credit: null, balance: 90 },
    { date: "2", description: "b", debit: null, credit: 5, balance: 99 },
  ];
  const r = reconcile(txns, 100, 99, "bank");
  assert.equal(r.status, "mismatch");
  assert.deepEqual(r.brokenRows, [1]);
  assert.equal(reconcile(txns, null, null, "bank").status, "unverifiable");
});

test("CSV escapes and guards formulas", () => {
  const csv = toCSV([{ date: "01/02", description: '=HYPERLINK("x"), test', debit: 1.5, credit: null, balance: -3 }]);
  assert.ok(csv.includes(`"'=HYPERLINK(""x""), test",1.50,,-3.00`));
});
