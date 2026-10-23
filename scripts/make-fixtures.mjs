import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = join(root, "tests", "fixtures");
mkdirSync(fixtures, { recursive: true });

const us = (c) => {
  const s = (Math.abs(c) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return s;
};
const eu = (c) => {
  const [i, d] = (Math.abs(c) / 100).toFixed(2).split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + d;
};

async function render(file, { title, meta, columns, rows, rowsPerPage = 18, pre = [], post = [], lineGap = 16 }) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const text = (page, s, x, y, { align = "left", size = 9, b = false } = {}) => {
    const f = b ? bold : font;
    const w = f.widthOfTextAtSize(s, size);
    page.drawText(s, { x: align === "right" ? x - w : x, y, size, font: f, color: rgb(0.1, 0.1, 0.12) });
  };
  for (let p = 0; p < pages; p++) {
    const page = doc.addPage([612, 792]);
    let y = 750;
    text(page, title, 40, y, { size: 14, b: true });
    y -= 18;
    for (const m of meta) {
      text(page, m, 40, y);
      y -= 13;
    }
    if (p === 0) {
      y -= 6;
      for (const line of pre) {
        line.forEach(([s, x, align]) => text(page, s, x, y, { align }));
        y -= 14;
      }
    }
    y -= 10;
    columns.forEach((c) => text(page, c.label, c.x, y, { align: c.align, b: true }));
    y -= 6;
    page.drawLine({ start: { x: 40, y }, end: { x: 572, y }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });
    y -= 14;
    for (const r of rows.slice(p * rowsPerPage, (p + 1) * rowsPerPage)) {
      columns.forEach((c, i) => r[i] && text(page, r[i], c.x, y, { align: c.align }));
      y -= r.extra ? 11 : lineGap;
      if (r.extra) {
        text(page, r.extra, columns[r.extraCol ?? 1].x, y, { size: 8 });
        y -= lineGap;
      }
    }
    if (p === pages - 1) {
      y -= 8;
      for (const line of post) {
        line.forEach(([s, x, align]) => text(page, s, x, y, { align }));
        y -= 14;
      }
    }
    text(page, `Page ${p + 1} of ${pages}`, 300, 30);
  }
  const bytes = await doc.save();
  writeFileSync(file, bytes);
  return bytes;
}

const expected = {};

// 1. US checking: MM/DD, Withdrawals | Deposits | Balance, multi-line descriptions, 2 pages
{
  const open = 245000;
  const data = [
    ["01/02", "Direct deposit ACME CORP PAYROLL", 312540, "PPD ID 9912345"],
    ["01/03", "Card purchase WHOLE FOODS #1023", -8745],
    ["01/03", "Card purchase SHELL OIL 5741", -4210],
    ["01/05", "Online transfer to savings", -50000, "Ref 448812 Conf# A7Y2"],
    ["01/06", "Zelle payment from J SMITH", 12000],
    ["01/07", "Electric utility autopay", -13488],
    ["01/08", "Card purchase AMAZON MKTPLACE", -2399, "Seattle WA"],
    ["01/09", "ATM withdrawal 1234 MAIN ST", -20000],
    ["01/10", "Mobile check deposit", 45000],
    ["01/12", "Software subscription ADOBE", -5499],
    ["01/13", "Card purchase STARBUCKS 2231", -675],
    ["01/14", "Insurance premium GEICO", -16200],
    ["01/15", "Direct deposit ACME CORP PAYROLL", 312540, "PPD ID 9912345"],
    ["01/16", "Rent payment ONLINE BILLPAY", -185000],
    ["01/17", "Card purchase TARGET 0091", -6732],
    ["01/18", "Interest payment", 112],
    ["01/19", "Card refund AMAZON MKTPLACE", 2399],
    ["01/20", "Phone bill VERIZON WIRELESS", -8999],
    ["01/21", "Card purchase UBER TRIP", -1850, "help.uber.com CA"],
    ["01/22", "Restaurant OLIVE GARDEN 1182", -6420],
    ["01/23", "Wire transfer fee", -2500],
    ["01/24", "Incoming wire CLIENT LLC", 250000],
    ["01/26", "Card purchase COSTCO WHSE", -21543],
    ["01/27", "Internet COMCAST", -7999],
    ["01/28", "Card purchase HOME DEPOT", -11250],
    ["01/29", "Venmo cashout", 8500],
    ["01/30", "Monthly service fee", -1200],
    ["01/31", "Card purchase NETFLIX.COM", -1549],
  ];
  let bal = open;
  const rows = data.map(([d, desc, amt, extra]) => {
    bal += amt;
    const r = [d, desc, amt < 0 ? us(amt) : "", amt > 0 ? us(amt) : "", us(bal)];
    if (extra) r.extra = extra;
    return r;
  });
  const opts = {
    title: "StatementFlow Sample Bank",
    meta: ["Checking Account Statement  -  Account ****4821", "Statement period: 01/01/2026 to 01/31/2026"],
    pre: [
      [["Beginning balance on 01/01/2026", 40], ["$" + us(open), 300, "right"]],
      [["Ending balance on 01/31/2026", 40], ["$" + us(bal), 300, "right"]],
    ],
    columns: [
      { label: "Date", x: 40 },
      { label: "Description", x: 90 },
      { label: "Withdrawals", x: 400, align: "right" },
      { label: "Deposits", x: 480, align: "right" },
      { label: "Balance", x: 570, align: "right" },
    ],
    rows,
    rowsPerPage: 16,
  };
  await render(join(fixtures, "us-checking.pdf"), opts);
  const sample = await render(join(root, "public", "sample-bank-statement.pdf"), opts);
  void sample;
  expected["us-checking"] = { count: data.length, opening: open / 100, closing: bal / 100, first: { date: "01/02", description: "Direct deposit ACME CORP PAYROLL PPD ID 9912345", credit: 3125.4 } };
}

// 2. Signed single Amount column + Balance, "Jan 05, 2026" dates
{
  const open = 100000;
  const data = [
    ["Jan 02, 2026", "Coffee shop", -450],
    ["Jan 03, 2026", "Salary deposit", 250000],
    ["Jan 05, 2026", "Grocery store", -8920],
    ["Jan 09, 2026", "Gym membership", -3999],
    ["Jan 12, 2026", "Transfer from savings", 30000],
    ["Jan 15, 2026", "Card payment", -120000],
    ["Jan 20, 2026", "Pharmacy", -1575],
  ];
  let bal = open;
  const rows = data.map(([d, desc, amt]) => {
    bal += amt;
    return [d, desc, (amt < 0 ? "-" : "") + us(amt), us(bal)];
  });
  await render(join(fixtures, "signed-amount.pdf"), {
    title: "Everyday Account",
    meta: ["Period: January 2026"],
    pre: [[["Opening balance", 40], [us(open), 250, "right"]]],
    columns: [
      { label: "Date", x: 40 },
      { label: "Description", x: 130 },
      { label: "Amount", x: 470, align: "right" },
      { label: "Balance", x: 570, align: "right" },
    ],
    rows,
    post: [[["Closing balance", 40], [us(bal), 250, "right"]]],
  });
  expected["signed-amount"] = { count: data.length, opening: open / 100, closing: bal / 100 };
}

// 3. UK: date once per day, balance only on last row of day, brought/carried forward
{
  const open = 123456;
  const days = [
    ["05 Jan 26", [["CARD PAYMENT TESCO STORES", -2345], ["CARD PAYMENT COSTA", -390]]],
    ["06 Jan 26", [["BANK GIRO CREDIT EMPLOYER LTD", 210000]]],
    ["08 Jan 26", [["DIRECT DEBIT COUNCIL TAX", -14200], ["STANDING ORDER RENT", -95000], ["FASTER PAYMENT RECEIVED", 5000]]],
    ["12 Jan 26", [["CASH MACHINE HIGH ST", -6000]]],
  ];
  let bal = open;
  const rows = [["05 Jan 26", "BALANCE BROUGHT FORWARD", "", "", us(open)]];
  let count = 0;
  for (const [d, txns] of days) {
    txns.forEach(([desc, amt], i) => {
      bal += amt;
      count++;
      rows.push([i === 0 ? d : "", desc, amt < 0 ? us(amt) : "", amt > 0 ? us(amt) : "", i === txns.length - 1 ? us(bal) : ""]);
    });
  }
  rows.push(["12 Jan 26", "BALANCE CARRIED FORWARD", "", "", us(bal)]);
  await render(join(fixtures, "uk.pdf"), {
    title: "High Street Bank plc",
    meta: ["Your current account statement", "Sort code 00-00-00  Account 12345678"],
    columns: [
      { label: "Date", x: 40 },
      { label: "Payment details", x: 110 },
      { label: "Paid out", x: 400, align: "right" },
      { label: "Paid in", x: 480, align: "right" },
      { label: "Balance", x: 570, align: "right" },
    ],
    rows,
  });
  expected["uk"] = { count, opening: open / 100, closing: bal / 100, lastDate: "12 Jan 26" };
}

// 4. European: dd.mm.yyyy, 1.234,56, Debit | Credit only, summary balances
{
  const open = 320000;
  const data = [
    ["02.01.2026", "Miete Januar", -110000],
    ["04.01.2026", "Gehalt", 285050],
    ["07.01.2026", "Supermarkt REWE", -6743],
    ["15.01.2026", "Stromversorger", -9500],
    ["20.01.2026", "Erstattung", 1299],
  ];
  let bal = open;
  const rows = data.map(([d, desc, amt]) => {
    bal += amt;
    return [d, desc, amt < 0 ? eu(amt) : "", amt > 0 ? eu(amt) : ""];
  });
  await render(join(fixtures, "eu.pdf"), {
    title: "Musterbank AG",
    meta: ["Kontoauszug 01/2026"],
    pre: [[["Opening balance", 40], [eu(open) + " EUR", 300, "right"]]],
    columns: [
      { label: "Date", x: 40 },
      { label: "Description", x: 120 },
      { label: "Debit", x: 470, align: "right" },
      { label: "Credit", x: 570, align: "right" },
    ],
    rows,
    post: [[["Closing balance", 40], [eu(bal) + " EUR", 300, "right"]]],
  });
  expected["eu"] = { count: data.length, opening: open / 100, closing: bal / 100 };
}

// 5. Credit card: two dates, positive charges, negative payments
{
  const prev = 120000;
  const data = [
    ["01/03", "01/04", "AMAZON.COM", 4599],
    ["01/05", "01/05", "PAYMENT THANK YOU", -50000],
    ["01/08", "01/09", "DELTA AIR LINES", 38900],
    ["01/11", "01/12", "HILTON HOTELS", 21450],
    ["01/14", "01/15", "RETURN AMAZON.COM", -4599],
    ["01/20", "01/21", "SPOTIFY", 1199],
  ];
  let bal = prev;
  const rows = data.map(([d1, d2, desc, amt]) => {
    bal += amt;
    return [d1, d2, desc, (amt < 0 ? "-" : "") + us(amt)];
  });
  await render(join(fixtures, "card.pdf"), {
    title: "Rewards Credit Card Statement",
    meta: ["Payment due date: 02/25/2026", "Minimum payment due: $35.00"],
    pre: [[["Previous balance", 40], ["$" + us(prev), 300, "right"]], [["New balance", 40], ["$" + us(bal), 300, "right"]]],
    columns: [
      { label: "Trans Date", x: 40 },
      { label: "Post Date", x: 100 },
      { label: "Description", x: 160 },
      { label: "Amount", x: 570, align: "right" },
    ],
    rows,
  });
  expected["card"] = { count: data.length, opening: prev / 100, closing: bal / 100, type: "card" };
}

// 6. India: dd/mm/yy, ref numbers, value date, summary box at end
{
  const open = 1000000;
  const data = [
    ["01/01/26", "UPI-SWIGGY-PAYMENT", "0000412345678", "01/01/26", -45000],
    ["03/01/26", "NEFT CR-ACME PVT LTD SALARY", "N003260012345", "03/01/26", 7500000],
    ["05/01/26", "ATM WDL-MG ROAD", "0000000005512", "05/01/26", -1000000],
    ["10/01/26", "ACH D-LIC PREMIUM", "0000088812345", "10/01/26", -250000],
  ];
  let bal = open;
  let dr = 0;
  let cr = 0;
  const rows = data.map(([d, desc, ref, vd, amt]) => {
    bal += amt;
    if (amt < 0) dr -= amt;
    else cr += amt;
    return [d, desc, ref, vd, amt < 0 ? us(amt) : "", amt > 0 ? us(amt) : "", us(bal)];
  });
  await render(join(fixtures, "india.pdf"), {
    title: "Sample Bank Ltd",
    meta: ["Statement of account", "From 01/01/26 To 31/01/26"],
    columns: [
      { label: "Date", x: 40 },
      { label: "Narration", x: 90 },
      { label: "Chq./Ref.No.", x: 230 },
      { label: "Value Dt", x: 300 },
      { label: "Withdrawal Amt.", x: 420, align: "right" },
      { label: "Deposit Amt.", x: 495, align: "right" },
      { label: "Closing Balance", x: 570, align: "right" },
    ],
    rows,
    post: [
      [["STATEMENT SUMMARY", 40]],
      [["Opening Balance", 110, "right"], ["Debits", 250, "right"], ["Credits", 380, "right"], ["Closing Balance", 520, "right"]],
      [[us(open), 110, "right"], [us(dr), 250, "right"], [us(cr), 380, "right"], [us(bal), 520, "right"]],
    ],
  });
  expected["india"] = { count: data.length, opening: open / 100, closing: bal / 100 };
}

// 7. Monospace: whole row is ONE text string, unsigned Amount + Balance (sign must come from balance math)
{
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Courier);
  const page = doc.addPage([612, 792]);
  const open = 50000;
  const data = [
    ["2026-02-01", "POS PURCHASE CORNER MART", -1234],
    ["2026-02-02", "PAYROLL CREDIT", 180000],
    ["2026-02-04", "CHECK 1043", -25000],
    ["2026-02-07", "LOAN PAYMENT", -32000],
    ["2026-02-10", "CASH DEPOSIT BRANCH", 10000],
  ];
  let y = 740;
  const line = (s) => {
    page.drawText(s, { x: 36, y, size: 9, font });
    y -= 14;
  };
  line("MONTHLY STATEMENT");
  line(`Opening balance ${us(open).padStart(12)}`);
  y -= 10;
  line(`${"Date".padEnd(12)}${"Description".padEnd(34)}${"Amount".padStart(14)}${"Balance".padStart(14)}`);
  let bal = open;
  for (const [d, desc, amt] of data) {
    bal += amt;
    line(`${d.padEnd(12)}${desc.padEnd(34)}${us(amt).padStart(14)}${us(bal).padStart(14)}`);
  }
  y -= 10;
  line(`Closing balance ${us(bal).padStart(12)}`);
  writeFileSync(join(fixtures, "mono.pdf"), await doc.save());
  expected["mono"] = { count: data.length, opening: open / 100, closing: bal / 100, first: { date: "2026-02-01", description: "POS PURCHASE CORNER MART", debit: 12.34, credit: null, balance: 487.66 } };
}

writeFileSync(join(fixtures, "expected.json"), JSON.stringify(expected, null, 2));
console.log("fixtures written:", Object.keys(expected).join(", "));
