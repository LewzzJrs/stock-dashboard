import { NextResponse } from "next/server";
import { getSeries } from "@/lib/massive";
import { normalizeSymbol } from "@/lib/format";
import { resolveRange } from "@/lib/universe";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const symbol = normalizeSymbol(params.get("symbol") ?? "");
  const range = resolveRange(params.get("range"));

  if (!symbol) {
    return NextResponse.json({
      ok: false,
      kind: "empty",
      detail: "No symbol was given.",
    });
  }

  return NextResponse.json(
    await getSeries(symbol, range.multiplier, range.timespan, range.days),
  );
}
