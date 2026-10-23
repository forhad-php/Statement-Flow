import { ImageResponse } from "next/og";

export const alt = "StatementFlow: PDF Bank Statement to CSV & Excel Converter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#ecfdf5,#ffffff)", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 40, fontWeight: 700, color: "#0f172a" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#059669", display: "flex" }} />
          StatementFlow AI
        </div>
        <div style={{ marginTop: 40, fontSize: 76, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>PDF Bank Statement to CSV &amp; Excel</div>
        <div style={{ marginTop: 28, fontSize: 34, color: "#475569" }}>Free · Private · Automatic balance reconciliation</div>
        <div style={{ marginTop: 40, display: "flex", alignSelf: "flex-start", padding: "14px 28px", borderRadius: 999, background: "#059669", color: "#fff", fontSize: 30, fontWeight: 700 }}>100% Reconciled</div>
      </div>
    ),
    size,
  );
}
