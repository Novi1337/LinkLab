import { ImageResponse } from "next/og";

export const alt = "LinkLib – Deine kostenlose Link-Bibliothek";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Dynamisch generiertes OG-Image (wird von Next.js automatisch als
// og:image und twitter:image eingebunden).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 55%, #bae6fd 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 64,
              fontWeight: 800,
              boxShadow: "0 20px 40px rgba(2, 132, 199, 0.35)",
            }}
          >
            LL
          </div>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 800, color: "#23466b" }}>
            LinkLib
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 38,
            color: "#23466b",
            opacity: 0.85,
          }}
        >
          Deine diskrete Link-Bibliothek in der Cloud
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 28,
            color: "#0284c7",
            fontWeight: 700,
          }}
        >
          www.getlinklib.com
        </div>
      </div>
    ),
    { ...size }
  );
}
