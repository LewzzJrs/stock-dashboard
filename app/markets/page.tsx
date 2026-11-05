import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketsView } from "@/components/MarketsView";
import { Loading } from "@/components/StateNotice";

export const metadata: Metadata = {
  title: "Markets",
  description: "Closing prices for a fixed list of widely held US stocks and index funds.",
};

export default function MarketsPage() {
  return (
    <Suspense fallback={<Loading what="the market list" />}>
      <MarketsView />
    </Suspense>
  );
}
