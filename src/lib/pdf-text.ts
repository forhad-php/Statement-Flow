import type { PdfTextItem } from "./statement-parser";

interface RawTextItem {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
}

export interface PdfDocLike {
  numPages: number;
  getPage(n: number): Promise<{
    getTextContent(): Promise<{ items: unknown[] }>;
    cleanup?(): unknown;
  }>;
}

export async function extractTextItems(doc: PdfDocLike, onProgress?: (page: number, total: number) => void): Promise<PdfTextItem[]> {
  const out: PdfTextItem[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    for (const raw of content.items as RawTextItem[]) {
      if (!raw.str || !raw.transform) continue;
      const [a, b, , d, e, f] = raw.transform;
      out.push({
        str: raw.str,
        x: e,
        y: f,
        w: raw.width ?? 0,
        h: raw.height || Math.hypot(a, b) || Math.abs(d) || 8,
        page: p,
      });
    }
    page.cleanup?.();
    onProgress?.(p, doc.numPages);
  }
  return out;
}

export function looksScanned(items: PdfTextItem[], pages: number): boolean {
  const chars = items.reduce((s, i) => s + i.str.trim().length, 0);
  return chars < Math.max(40, pages * 25);
}
