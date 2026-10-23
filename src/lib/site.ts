export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "StatementFlow";
export const BRAND = "StatementFlow AI";
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@statementflow.app";
export const LAST_UPDATED = "2026-10-23";

export const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I convert a PDF bank statement to CSV?",
    a: "Drop your PDF statement into the converter above (or click Choose PDF file). StatementFlow reads every page, detects the Date, Description, Debit, Credit and Balance columns, and shows you an editable preview. Click Download CSV or Download Excel and you're done, usually in under 10 seconds.",
  },
  {
    q: "Is this bank statement converter really free?",
    a: "Yes. The converter is free with no sign-up, no page limit and no watermark. You can convert as many statements as you need.",
  },
  {
    q: "Is my bank statement uploaded to a server?",
    a: "No. The PDF is opened and converted entirely inside your web browser on your own device. Your statement, account numbers and transactions are never uploaded, stored or seen by us.",
  },
  {
    q: "Which banks and statement formats are supported?",
    a: "StatementFlow doesn't rely on bank-specific templates. It analyses the layout of each page, so it works with digital statements from thousands of banks and credit card issuers, including US, UK, European, Indian and Australian formats, MM/DD and DD/MM dates, and 1,234.56 or 1.234,56 number styles.",
  },
  {
    q: "What does \"100% Reconciled\" mean?",
    a: "After extraction we check the math: Opening balance + Total credits − Total debits must equal the Closing balance, and each row's running balance must match. If everything adds up to the cent, you see a green 100% Reconciled badge, so you know no transaction was missed or misread.",
  },
  {
    q: "Can it convert password-protected PDF statements?",
    a: "Yes. If your bank protects the PDF with a password, you'll be asked for it. The password is only used locally in your browser to open the file.",
  },
  {
    q: "Does it work with scanned or photographed statements?",
    a: "This version works with digital PDFs, the ones you download from online banking. AI-powered scanning for paper statements and photos is coming soon.",
  },
  {
    q: "Can I import the CSV into QuickBooks, Xero or Excel?",
    a: "Yes. The CSV uses a clean Date, Description, Debit, Credit, Balance layout that imports directly into Excel, Google Sheets, QuickBooks Online, Xero, Wave, FreshBooks and most accounting software. The Excel (.xlsx) export also includes a Summary sheet with totals.",
  },
  {
    q: "Can I convert a credit card statement to CSV or Excel?",
    a: "Yes. Credit card statements are detected automatically. Charges go to the Debit column and payments or refunds go to the Credit column, and the balance check uses Previous balance + Charges − Payments = New balance.",
  },
  {
    q: "Is there a mobile app?",
    a: "Yes. The StatementFlow Android app is coming to Google Play. It converts PDF statements to CSV and Excel right on your phone.",
  },
];
