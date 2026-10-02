import { ImageResponse } from "next/og";
import { getEmployers } from "@/content/work";
import { currentPosition } from "@/home/model";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const alt = `The personal website of ${SITE_NAME}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The homepage's share card, from the same content as the page, cached and revalidated with it. */
export default async function OpenGraphImage(): Promise<ImageResponse> {
  const position = currentPosition(await getEmployers());
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background:
          "radial-gradient(circle at 85% 15%, #16301a 0%, #0a0d0b 55%)",
        color: "#e8ede6",
        border: "2px solid #1e8c00",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 26,
          letterSpacing: 4,
          color: "#5fd23a",
        }}
      >
        {new URL(SITE_URL).host.toUpperCase()}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: -2 }}>
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 40, color: "#a9b4a6", marginTop: 12 }}>
          {`${position.title} · ${position.employer}`}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          height: 6,
          width: 160,
          background: "#1e8c00",
        }}
      />
    </div>,
    size,
  );
}
