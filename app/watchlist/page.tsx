import type { Metadata } from "next";
import { WatchlistView } from "@/components/WatchlistView";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "The symbols you follow, kept in your own browser.",
};

export default function WatchlistPage() {
  return <WatchlistView />;
}
