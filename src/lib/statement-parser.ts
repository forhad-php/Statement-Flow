export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
  page: number;
}

export interface Transaction {
  date: string;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

export type StatementType = "bank" | "card";

export interface ParseResult {
  transactions: Transaction[];
  openingBalance: number | null;
  closingBalance: number | null;
  statementType: StatementType;
}

export interface Reconciliation {
  status: "reconciled" | "mismatch" | "unverifiable";
  mode: StatementType;
  opening: number | null;
  closing: number | null;
  totalDebits: number;
  totalCredits: number;
  expectedClosing: number | null;
  difference: number | null;
  brokenRows: number[];
}

type Role = "debit" | "credit" | "amount" | "balance";

interface Word {
  text: string;
  x: number;
  xr: number;
  y: number;
  h: number;
  page: number;
}

interface Line {
  words: Word[];
  y: number;
  h: number;
  page: number;
  text: string;
}

interface Amount {
  cents: number;
  neg: boolean;
  marker: "cr" | "dr" | null;
  x: number;
  xr: number;
}

interface Row {
  line: Line;
  date: string | null;
  descWords: Word[];
  amounts: Amount[];
}

interface Column {
  x: number;
  xr: number;
  center: number;
  count: number;
  role?: Role;
}

interface CentsTxn {
  date: string;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

const AMOUNT_RE =
  /^([-−–+]?\(?[-−–]?)(?:[A-Z]{3})?[$€£₹¥৳₦₱]?([-−–]?)(\d{1,3}(?:[,.'\u00a0\u202f]\d{3})+|\d+)([.,]\d{2})(\)?[-−–]?)(CR|DR|Cr|Dr|cr|dr|OD)?$/;
const MARKER_RE = /^(CR|DR|Cr|Dr|cr|dr|OD)$/;
const CURRENCY_RE = /^(?:[A-Z]{3}|[$€£₹¥৳₦₱])$/;

const MON = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const YEAR = "(?:(?:19|20)\\d{2}|\\d{2})(?![\\d])";
const DATE_PATTERNS = [
  /^\d{4}[/.-]\d{1,2}[/.-]\d{1,2}(?=\s|$)/,
  /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}(?=\s|$)/,
  new RegExp(`^\\d{1,2}(?:st|nd|rd|th)?[\\s/.-]?${MON}(?:[\\s/.,-]+${YEAR})?(?=\\s|$)`, "i"),
  new RegExp(`^${MON}[\\s/.-]?\\d{1,2}(?:st|nd|rd|th)?(?:,?[\\s/.-]+(?:19|20)\\d{2})?(?=\\s|$|,)`, "i"),
  /^\d{1,2}[/-]\d{1,2}(?=\s|$)/,
];

const OPEN_PATTERNS = [
  /(?:opening|beginning|previous|starting|start|old|prior)\s+balance/i,
  /balance\s+(?:brought\s+forward|b\/f|forward)/i,
  /brought\s+forward/i,
];
const CLOSE_PATTERNS = [
  /(?:closing|ending|new|end|final)\s+balance/i,
  /balance\s+(?:carried\s+forward|c\/f)/i,
  /carried\s+forward/i,
];
const SKIP_RE = /^(?:sub-?)?totals?\b|\btotal\s+(?:debits?|credits?|deposits?|withdrawals?|payments?|charges?|fees?|paid|money)\b/i;
const CARD_RE = /credit\s+card|minimum\s+payment|payment\s+due\s+date|credit\s+limit|card\s*member|statement\s+balance/i;

const HEADER_ROLES: [RegExp, Role][] = [
  [/^(debits?|withdrawals?|withdrawn|withdrawal|payments?|charges?|out|dr|spent|outgoings?)$/i, "debit"],
  [/^(credits?|deposits?|in|cr|receipts?|lodgements?|received|incoming)$/i, "credit"],
  [/^balances?$/i, "balance"],
  [/^amounts?$/i, "amount"],
];

export function parseAmount(text: string): Omit<Amount, "x" | "xr"> | null {
  const m = AMOUNT_RE.exec(text.trim());
  if (!m) return null;
  const [, pre, mid, num, dec, post, suf] = m;
  const cents = parseInt((num + dec).replace(/\D/g, ""), 10);
  if (!Number.isFinite(cents)) return null;
  const s = (suf || "").toUpperCase();
  const neg = /[-−–(]/.test(pre) || /[-−–]/.test(mid) || /[-−–)]/.test(post) || s === "DR" || s === "OD";
  const marker = s === "CR" ? "cr" : s === "DR" || s === "OD" ? "dr" : null;
  return { cents, neg, marker };
}

function buildLines(items: PdfTextItem[]): Line[] {
  const pages = new Map<number, Word[]>();
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const cw = it.w > 0 ? it.w / it.str.length : (it.h || 8) * 0.5;
    const re = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(it.str))) {
      const x = it.x + m.index * cw;
      const list = pages.get(it.page) ?? [];
      list.push({ text: m[0], x, xr: x + m[0].length * cw, y: it.y, h: it.h || 8, page: it.page });
      pages.set(it.page, list);
    }
  }
  const lines: Line[] = [];
  for (const page of [...pages.keys()].sort((a, b) => a - b)) {
    const words = pages.get(page)!.sort((a, b) => b.y - a.y || a.x - b.x);
    let cur: Line | null = null;
    for (const w of words) {
      if (cur && Math.abs(w.y - cur.y) <= Math.max(2, Math.min(w.h, cur.h) * 0.5)) {
        cur.words.push(w);
      } else {
        cur = { words: [w], y: w.y, h: w.h, page, text: "" };
        lines.push(cur);
      }
    }
  }
  for (const l of lines) {
    l.words.sort((a, b) => a.x - b.x);
    l.words = mergeSplitAmounts(l.words);
    l.text = l.words.map((w) => w.text).join(" ");
  }
  return lines;
}

function mergeSplitAmounts(words: Word[]): Word[] {
  const out: Word[] = [];
  for (const w of words) {
    const prev = out[out.length - 1];
    const close = prev && w.x - prev.xr < w.h * 0.6;
    if (prev && close && CURRENCY_RE.test(prev.text) && /^[-−–(]?\d/.test(w.text)) {
      out[out.length - 1] = { ...w, text: prev.text + w.text, x: prev.x };
    } else if (prev && close && /^[-−–(]?\d{1,3}$/.test(prev.text) && /^\d{3}(?:[.,\u00a0\u202f']\d{3})*[.,]\d{2}\)?[-−–]?$/.test(w.text) && parseAmount(prev.text + w.text)) {
      out[out.length - 1] = { ...w, text: prev.text + w.text, x: prev.x };
    } else if (prev && close && /^[-−–]$/.test(prev.text) && parseAmount(w.text)) {
      out[out.length - 1] = { ...w, text: "-" + w.text, x: prev.x };
    } else {
      out.push(w);
    }
  }
  return out;
}

function matchDate(words: Word[]): { date: string; used: number } | null {
  const head = words.slice(0, 4).map((w) => w.text);
  const text = head.join(" ");
  for (const re of DATE_PATTERNS) {
    const m = re.exec(text);
    if (!m) continue;
    const matched = m[0].replace(/[\s,]+$/, "");
    let len = 0;
    for (let i = 0; i < head.length; i++) {
      len += head[i].length + (i ? 1 : 0);
      if (len >= matched.length) {
        if (len - matched.length > 1) return null;
        return { date: matched, used: i + 1 };
      }
    }
  }
  return null;
}

function analyzeLine(line: Line): Row {
  const words = line.words;
  const amounts: Amount[] = [];
  let end = words.length;
  while (end > 0 && amounts.length < 5) {
    const w = words[end - 1];
    if (MARKER_RE.test(w.text) && end > 1) {
      const p = parseAmount(words[end - 2].text + w.text);
      if (p && !parseAmount(words[end - 2].text)?.marker) {
        amounts.unshift({ ...p, x: words[end - 2].x, xr: words[end - 2].xr });
        end -= 2;
        continue;
      }
    }
    const p = parseAmount(w.text);
    if (!p) break;
    amounts.unshift({ ...p, x: w.x, xr: w.xr });
    end--;
  }
  let start = 0;
  let date: string | null = null;
  const d = matchDate(words.slice(0, end));
  if (d) {
    date = d.date;
    start = d.used;
    const second = matchDate(words.slice(start, end));
    if (second) start += second.used;
  }
  return { line, date, descWords: words.slice(start, end), amounts };
}

function descText(words: Word[]): string {
  return words.map((w) => w.text).join(" ").replace(/\s+/g, " ").trim();
}

function findBalanceAfter(lines: Line[], idx: number, patterns: RegExp[], consumed: Set<number>): number | null {
  const line = lines[idx];
  for (const re of patterns) {
    const m = re.exec(line.text);
    if (!m) continue;
    let pos = 0;
    let startWord = -1;
    let endWord = -1;
    for (let i = 0; i < line.words.length; i++) {
      const wEnd = pos + line.words[i].text.length;
      if (startWord < 0 && wEnd > m.index) startWord = i;
      if (wEnd >= m.index + m[0].length) {
        endWord = i;
        break;
      }
      pos = wEnd + 1;
    }
    if (endWord < 0) continue;
    for (let i = endWord + 1; i < line.words.length; i++) {
      const t = line.words[i].text;
      if (OPEN_PATTERNS.concat(CLOSE_PATTERNS).some((r) => r.test(line.words.slice(i, i + 3).map((w) => w.text).join(" ")))) break;
      const next = line.words[i + 1]?.text;
      const p = (next && MARKER_RE.test(next) ? parseAmount(t + next) : null) ?? parseAmount(t);
      if (p) return (p.neg ? -p.cents : p.cents) / 100;
    }
    const nextLine = lines[idx + 1];
    if (nextLine && nextLine.page === line.page && line.y - nextLine.y < line.h * 3.5 && !matchDate(nextLine.words)) {
      const kx = (line.words[startWord].x + line.words[endWord].xr) / 2;
      let best: { v: number; d: number } | null = null;
      for (const w of nextLine.words) {
        const p = parseAmount(w.text);
        if (!p) continue;
        const dist = Math.abs((w.x + w.xr) / 2 - kx);
        if (dist < 90 && (!best || dist < best.d)) best = { v: (p.neg ? -p.cents : p.cents) / 100, d: dist };
      }
      if (best) {
        consumed.add(idx + 1);
        return best.v;
      }
    }
  }
  return null;
}

function clusterColumns(amounts: Amount[]): Column[] {
  const sorted = [...amounts].sort((a, b) => a.xr - b.xr);
  const cols: { items: Amount[] }[] = [];
  for (const a of sorted) {
    const last = cols[cols.length - 1];
    if (last && a.xr - last.items[last.items.length - 1].xr <= 18) last.items.push(a);
    else cols.push({ items: [a] });
  }
  return cols.map((c) => {
    const x = Math.min(...c.items.map((i) => i.x));
    const xr = Math.max(...c.items.map((i) => i.xr));
    const center = c.items.reduce((s, i) => s + i.xr, 0) / c.items.length;
    return { x, xr, center, count: c.items.length };
  });
}

function columnFor(a: Amount, cols: Column[]): number {
  let best = -1;
  let bestD = Infinity;
  cols.forEach((c, i) => {
    const d = Math.abs(a.xr - c.center);
    const overlaps = a.xr >= c.x - 6 && a.x <= c.xr + 6;
    if ((overlaps || d < 25) && d < bestD) {
      best = i;
      bestD = d;
    }
  });
  return best;
}

function headerRoles(lines: Line[], cols: Column[]): (Role | undefined)[] {
  let best: { x: number; xr: number; role: Role }[] | null = null;
  let bestScore = 1;
  for (const line of lines) {
    if (line.words.length > 25) continue;
    const cells: { x: number; xr: number; role?: Role }[] = [];
    for (const w of line.words) {
      const t = w.text.replace(/[^a-z]/gi, "");
      const role = HEADER_ROLES.find(([re]) => re.test(t))?.[1];
      const last = cells[cells.length - 1];
      if (last && w.x - last.xr < w.h * 0.9) {
        last.xr = w.xr;
        last.role = last.role ?? role;
      } else cells.push({ x: w.x, xr: w.xr, role });
    }
    const roled = cells.filter((c): c is { x: number; xr: number; role: Role } => !!c.role);
    const score = new Set(roled.map((x) => x.role)).size;
    if (score > bestScore && /date|description|details|particulars|narration|transaction/i.test(line.text)) {
      bestScore = score;
      best = roled;
    }
  }
  if (!best) return cols.map(() => undefined);
  return cols.map((c) => {
    let role: Role | undefined;
    let bestD = 70;
    for (const { role: r, ...w } of best!) {
      const d = c.center >= w.x - 8 && c.center <= w.xr + 8 ? 0 : Math.min(Math.abs(c.center - w.x), Math.abs(c.center - w.xr), Math.abs(c.x - w.x));
      if (d < bestD) {
        bestD = d;
        role = r;
      }
    }
    return role;
  });
}

function buildTxns(rows: { row: Row; date: string; desc: string; cols: number[] }[], roles: Role[], type: StatementType, opening: number | null): CentsTxn[] {
  const out: CentsTxn[] = [];
  let prevBal = opening === null ? null : Math.round(opening * 100);
  for (const { row, date, desc, cols } of rows) {
    const t: CentsTxn = { date, description: desc, debit: null, credit: null, balance: null };
    let amount: Amount | null = null;
    row.amounts.forEach((a, i) => {
      const role = roles[cols[i]];
      if (role === "balance") t.balance = a.neg ? -a.cents : a.cents;
      else if (role === "debit") t.debit = (t.debit ?? 0) + a.cents;
      else if (role === "credit") t.credit = (t.credit ?? 0) + a.cents;
      else if (role === "amount") amount = a;
    });
    if (amount) {
      const a: Amount = amount;
      let isDebit: boolean;
      if (a.marker) isDebit = a.marker === "dr";
      else if (prevBal !== null && t.balance !== null && t.balance - prevBal === a.cents) isDebit = false;
      else if (prevBal !== null && t.balance !== null && t.balance - prevBal === -a.cents) isDebit = true;
      else isDebit = type === "card" ? !a.neg : a.neg;
      if (isDebit) t.debit = a.cents;
      else t.credit = a.cents;
    }
    if (t.balance !== null) prevBal = t.balance;
    else if (prevBal !== null) prevBal += (t.credit ?? 0) - (t.debit ?? 0);
    out.push(t);
  }
  return out;
}

function brokenCount(txns: CentsTxn[], openingCents: number | null): number {
  let running = openingCents;
  let broken = 0;
  for (const t of txns) {
    if (running !== null) running += (t.credit ?? 0) - (t.debit ?? 0);
    if (t.balance !== null) {
      if (running !== null && running !== t.balance) broken++;
      running = t.balance;
    }
  }
  return broken;
}

export function parseStatement(items: PdfTextItem[]): ParseResult {
  const lines = buildLines(items);
  const fullText = lines.map((l) => l.text).join("\n");
  const type: StatementType = CARD_RE.test(fullText) ? "card" : "bank";

  let opening: number | null = null;
  let closing: number | null = null;
  const rows = lines.map(analyzeLine);
  const consumed = new Set<number>();
  const isBalanceRow = rows.map((r, i) => {
    const desc = descText(r.descWords);
    const text = desc || r.line.text;
    let hit = false;
    if (OPEN_PATTERNS.some((re) => re.test(text))) {
      const v = findBalanceAfter(lines, i, OPEN_PATTERNS, consumed);
      if (v !== null && opening === null) opening = v;
      hit = true;
    }
    if (CLOSE_PATTERNS.some((re) => re.test(text))) {
      const v = findBalanceAfter(lines, i, CLOSE_PATTERNS, consumed);
      if (v !== null) closing = v;
      hit = true;
    }
    return hit || SKIP_RE.test(desc);
  });
  consumed.forEach((i) => (isBalanceRow[i] = true));

  const dated = rows.filter((r, i) => r.date && r.amounts.length && !isBalanceRow[i]);
  if (!dated.length) return { transactions: [], openingBalance: opening, closingBalance: closing, statementType: type };

  let cols = clusterColumns(dated.flatMap((r) => r.amounts));
  const minCount = dated.length >= 5 ? Math.max(2, Math.ceil(dated.length * 0.08)) : 1;
  cols = cols.filter((c) => c.count >= minCount);
  if (cols.length > 3) cols = [...cols].sort((a, b) => b.count - a.count).slice(0, 3).sort((a, b) => a.center - b.center);

  const accepted: { row: Row; date: string; desc: string; cols: number[]; descX: number }[] = [];
  const pagesWithTable = new Set<number>();
  const headerPages = new Set<number>();
  lines.forEach((l) => {
    if (/date/i.test(l.text) && /balance|amount|debit|credit|withdrawal|deposit|paid/i.test(l.text) && l.words.length < 25) headerPages.add(l.page);
  });

  let lastDate: string | null = null;
  let pending: { date: string; desc: string; line: Line } | null = null;
  let lastAccepted: (typeof accepted)[number] | null = null;
  let lastLine: Line | null = null;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (isBalanceRow[i]) {
      lastAccepted = null;
      pending = null;
      continue;
    }
    const aligned: number[] = [];
    const descWords = [...r.descWords];
    const amounts: Amount[] = [];
    for (const a of r.amounts) {
      const c = columnFor(a, cols);
      if (c < 0 || aligned.includes(c)) {
        if (!amounts.length) descWords.push({ text: (a.neg ? "-" : "") + (a.cents / 100).toFixed(2), x: a.x, xr: a.xr, y: r.line.y, h: r.line.h, page: r.line.page });
        continue;
      }
      aligned.push(c);
      amounts.push(a);
    }
    const desc = descText(descWords);
    const row: Row = { ...r, amounts };
    const tableHere = pagesWithTable.has(r.line.page) || headerPages.has(r.line.page);

    if (r.date && amounts.length) {
      accepted.push({ row, date: r.date, desc, cols: aligned, descX: descWords[0]?.x ?? r.line.words[0].x });
      lastAccepted = accepted[accepted.length - 1];
      lastDate = r.date;
      pending = null;
      pagesWithTable.add(r.line.page);
    } else if (!r.date && amounts.length && tableHere && (pending || lastDate) && /\p{L}/u.test(desc) && !SKIP_RE.test(desc)) {
      const date: string = pending ? pending.date : lastDate!;
      const fullDesc = pending ? `${pending.desc} ${desc}`.trim() : desc;
      accepted.push({ row, date, desc: fullDesc, cols: aligned, descX: descWords[0]?.x ?? r.line.words[0].x });
      lastAccepted = accepted[accepted.length - 1];
      lastDate = date;
      pending = null;
    } else if (r.date && !amounts.length && tableHere) {
      pending = { date: r.date, desc, line: r.line };
      lastAccepted = null;
    } else if (!amounts.length && !r.date) {
      const anchor = pending?.line ?? lastLine;
      const minAmountX = cols.length ? Math.min(...cols.map((c) => c.x)) : Infinity;
      const near = anchor && anchor.page === r.line.page && anchor.y - r.line.y > 0 && anchor.y - r.line.y < r.line.h * 2.4;
      const first = r.line.words[0];
      if (near && pending && first.x < minAmountX) {
        pending.desc = `${pending.desc} ${desc}`.trim();
        pending.line = r.line;
      } else if (near && lastAccepted && first.x >= lastAccepted.descX - 15 && first.x < minAmountX && desc.length < 120) {
        lastAccepted.desc = `${lastAccepted.desc} ${desc}`.trim();
      } else {
        lastAccepted = null;
        pending = null;
      }
    } else {
      lastAccepted = null;
      pending = null;
    }
    lastLine = r.line;
  }

  const hdr = headerRoles(lines, cols);
  const n = cols.length;
  let candidates: Role[][];
  if (n === 1) candidates = [["amount"]];
  else if (n === 2) {
    const both = accepted.filter((a) => a.cols.length === 2).length;
    candidates = both / (accepted.length || 1) >= 0.5 ? [["amount", "balance"]] : [["debit", "credit"], ["credit", "debit"], ["amount", "balance"]];
  } else candidates = [["debit", "credit", "balance"], ["credit", "debit", "balance"]];
  if (hdr.every(Boolean) && new Set(hdr).size === hdr.length && !candidates.some((c) => c.join() === hdr.join())) candidates.unshift(hdr as Role[]);
  const agree = (c: Role[]) => c.filter((r, i) => hdr[i] === r).length;
  candidates.sort((a, b) => agree(b) - agree(a));

  const openingCents = opening === null ? null : Math.round((opening as number) * 100);
  const closingCents = closing === null ? null : Math.round((closing as number) * 100);
  let best: CentsTxn[] | null = null;
  let bestScore = Infinity;
  for (const roles of candidates) {
    const txns = buildTxns(accepted, roles, type, opening);
    let score = brokenCount(txns, openingCents) * 10;
    if (openingCents !== null && closingCents !== null && !roles.includes("balance")) {
      const c = txns.reduce((s, t) => s + (t.credit ?? 0), 0);
      const d = txns.reduce((s, t) => s + (t.debit ?? 0), 0);
      const ok = type === "bank" ? openingCents + c - d === closingCents : openingCents + d - c === closingCents;
      if (!ok) score += 5;
    }
    if (score < bestScore) {
      bestScore = score;
      best = txns;
    }
  }

  const txns = best ?? [];
  if (opening === null && txns.length && txns[0].balance !== null) {
    const f = txns[0];
    opening = (f.balance! - (f.credit ?? 0) + (f.debit ?? 0)) / 100;
  }
  if (closing === null) {
    const last = [...txns].reverse().find((t) => t.balance !== null);
    if (last && last === txns[txns.length - 1]) closing = last.balance! / 100;
  }

  const toNum = (v: number | null) => (v === null ? null : v / 100);
  return {
    transactions: txns.map((t) => ({ date: t.date, description: t.description, debit: toNum(t.debit), credit: toNum(t.credit), balance: toNum(t.balance) })),
    openingBalance: opening,
    closingBalance: closing,
    statementType: type,
  };
}

const cents = (v: number | null | undefined) => (v === null || v === undefined || !Number.isFinite(v) ? 0 : Math.round(v * 100));

export function reconcile(txns: Transaction[], opening: number | null, closing: number | null, type: StatementType): Reconciliation {
  const totalDebits = txns.reduce((s, t) => s + cents(t.debit), 0);
  const totalCredits = txns.reduce((s, t) => s + cents(t.credit), 0);
  const run = (mode: StatementType) => {
    const sign = mode === "bank" ? 1 : -1;
    const broken: number[] = [];
    let running = opening === null ? null : cents(opening);
    txns.forEach((t, i) => {
      if (running !== null) running += sign * (cents(t.credit) - cents(t.debit));
      if (t.balance !== null && t.balance !== undefined && Number.isFinite(t.balance)) {
        if (running !== null && running !== cents(t.balance)) broken.push(i);
        running = cents(t.balance);
      }
    });
    const expected = opening === null ? null : cents(opening) + sign * (totalCredits - totalDebits);
    const diff = expected === null || closing === null ? null : cents(closing) - expected;
    return { broken, expected, diff };
  };
  const primary = run(type);
  const alt = run(type === "bank" ? "card" : "bank");
  const useAlt = primary.diff !== 0 && alt.diff === 0 && alt.broken.length <= primary.broken.length;
  const chosen = useAlt ? alt : primary;
  const mode: StatementType = useAlt ? (type === "bank" ? "card" : "bank") : type;
  const status = chosen.diff === null ? "unverifiable" : chosen.diff === 0 && chosen.broken.length === 0 ? "reconciled" : "mismatch";
  return {
    status,
    mode,
    opening,
    closing,
    totalDebits: totalDebits / 100,
    totalCredits: totalCredits / 100,
    expectedClosing: chosen.expected === null ? null : chosen.expected / 100,
    difference: chosen.diff === null ? null : chosen.diff / 100,
    brokenRows: chosen.broken,
  };
}

const fmt = (v: number | null) => (v === null || v === undefined || !Number.isFinite(v) ? "" : v.toFixed(2));

export function toCSV(txns: Transaction[]): string {
  const esc = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const safe = (s: string) => (/^[=+@\t\r]/.test(s) ? `'${s}` : s);
  const rows = [["Date", "Description", "Debit", "Credit", "Balance"]];
  for (const t of txns) rows.push([safe(t.date), safe(t.description), fmt(t.debit), fmt(t.credit), fmt(t.balance)]);
  return "\ufeff" + rows.map((r) => r.map(esc).join(",")).join("\r\n") + "\r\n";
}
