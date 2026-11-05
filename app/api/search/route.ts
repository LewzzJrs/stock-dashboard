import { NextResponse } from "next/server";
import { searchSymbols } from "@/lib/massive";

export async function GET(request: Request) {
  const query = (new URL(request.url).searchParams.get("q") ?? "").trim();

  if (query.length < 1) {
    return NextResponse.json({
      ok: false,
      kind: "empty",
      detail: "Type a ticker or a company name first.",
    });
  }

  return NextResponse.json(await searchSymbols(query));
}
