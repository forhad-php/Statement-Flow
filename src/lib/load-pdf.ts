import { extractTextItems, looksScanned } from "./pdf-text";
import { parseStatement, type ParseResult } from "./statement-parser";

export type ReadError = "password" | "wrong-password" | "scanned" | "no-transactions" | "invalid";

export class StatementReadError extends Error {
  code: ReadError;
  constructor(code: ReadError) {
    super(code);
    this.code = code;
  }
}

export async function readStatement(
  bytes: Uint8Array,
  password: string | undefined,
  onProgress?: (page: number, total: number) => void,
): Promise<ParseResult & { pages: number }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({ data: bytes.slice(), password, cMapUrl: "/pdfjs/cmaps/", cMapPacked: true, verbosity: 0 });
  try {
    const doc = await task.promise;
    const items = await extractTextItems(doc, onProgress);
    if (looksScanned(items, doc.numPages)) throw new StatementReadError("scanned");
    const result = parseStatement(items);
    if (!result.transactions.length) throw new StatementReadError("no-transactions");
    return { ...result, pages: doc.numPages };
  } catch (e) {
    if (e instanceof StatementReadError) throw e;
    const err = e as { name?: string; code?: number };
    if (err?.name === "PasswordException") throw new StatementReadError(err.code === 2 ? "wrong-password" : "password");
    throw new StatementReadError("invalid");
  } finally {
    void task.destroy();
  }
}
