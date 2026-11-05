import { NextResponse } from "next/server";
import { getIcon } from "@/lib/massive";
import { normalizeSymbol } from "@/lib/format";

/**
 * Massive's brand icons sit behind URLs that need the API key, so the image is
 * fetched on the server and handed on from here. The browser never sees a key,
 * and a symbol Massive has no icon for answers 404 so the card can fall back.
 */
export async function GET(request: Request) {
  const symbol = normalizeSymbol(new URL(request.url).searchParams.get("symbol") ?? "");
  if (!symbol) return new NextResponse(null, { status: 400 });

  const icon = await getIcon(symbol);
  if (!icon.ok) {
    // The browser logs whatever comes back, so the status should say which it
    // was: no icon exists, or the five-a-minute ceiling was reached.
    const status = icon.kind === "empty" ? 404 : icon.kind === "rate-limit" ? 429 : 502;
    return new NextResponse(null, { status });
  }

  return new NextResponse(icon.data.body, {
    headers: {
      "content-type": icon.data.type,
      "cache-control": "public, max-age=604800, immutable",
    },
  });
}
