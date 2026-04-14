import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Bali Villa Truth — Stress-tested net yields for 2,000+ Bali villas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0c4a6e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <h1
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "white",
              margin: 0,
              letterSpacing: "-2px",
              display: "flex",
              gap: "16px",
            }}
          >
            Bali Villa{" "}
            <span style={{ color: "#60a5fa" }}>Truth</span>
          </h1>

          <p
            style={{
              fontSize: "28px",
              color: "rgba(255,255,255,0.7)",
              margin: 0,
              maxWidth: "700px",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Independent ROI audits for serious investors.
            We verify the data agents hide.
          </p>

          {/* Stats bar */}
          <div
            style={{
              display: "flex",
              gap: "48px",
              marginTop: "24px",
              padding: "20px 40px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "36px", fontWeight: 700, color: "#60a5fa" }}>2,000+</span>
              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "2px" }}>Listings Audited</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "36px", fontWeight: 700, color: "#34d399" }}>12</span>
              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "2px" }}>Bali Areas</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "36px", fontWeight: 700, color: "#fbbf24" }}>6</span>
              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "2px" }}>Red Flag Types</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            position: "absolute",
            bottom: "24px",
            fontSize: "16px",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          balivillatruth.com
        </p>
      </div>
    ),
    { ...size }
  );
}
