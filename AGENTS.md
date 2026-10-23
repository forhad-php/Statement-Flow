<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: StatementFlow AI web tool (PDF bank statement → CSV/Excel)

- Goal: rank fast on Google for `pdf bank statement to csv` / `bank statement converter ai`. Few features, all must work 100%. v1 is free, no AI, no backend.
- All conversion runs client-side: pdf.js (legacy build) → `src/lib/pdf-text.ts` → `src/lib/statement-parser.ts` (pure TS, no runtime imports) → reconcile → CSV / XLSX (SheetJS from cdn.sheetjs.com).
- Every parser change needs a fixture/test: `npm run fixtures` regenerates PDFs in `tests/fixtures` (+ `public/sample-bank-statement.pdf`), `npm test` runs them.
- pdf.js worker + cmaps are copied to `public/pdfjs` by `predev`/`prebuild` (gitignored).
- Domain is not decided yet: set `NEXT_PUBLIC_SITE_URL` (canonical, sitemap, robots, JSON-LD) and `NEXT_PUBLIC_CONTACT_EMAIL` before deploying.
- Verify: `npm test`, `npx tsc --noEmit`, `npx eslint src tests scripts`, `npm run build` (all routes must stay ○ Static).
