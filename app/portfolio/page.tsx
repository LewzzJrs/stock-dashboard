import type { Metadata } from "next";
import { PortfolioView } from "@/components/PortfolioView";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "A practice account with play money, priced at live market quotes.",
};

export default function PortfolioPage() {
  return <PortfolioView />;
}
