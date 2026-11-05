import { NextResponse } from "next/server";
import { getQuotes } from "@/lib/massive";
import { normalizeSymbol } from "@/lib/format";
import { UNIVERSE_NAMES } from "@/lib/universe";

const MAX_SYMBOLS = 200;

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("symbols") ?? "";
  const symbols = [
    ...new Set(raw.split(",").map(normalizeSymbol).filter(Boolean)),
  ].slice(0, MAX_SYMBOLS);

  return NextResponse.json(await getQuotes(symbols, UNIVERSE_NAMES));
}
