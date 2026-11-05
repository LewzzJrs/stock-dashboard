import type { Failure } from "@/lib/massive";

const ADVICE: Record<Failure["kind"], string> = {
  "no-key":
    "Put a free Massive key in .env.local as MASSIVE_API_KEY, then restart the server.",
  "rate-limit":
    "Wait a minute. The free plan allows 5 calls a minute, and this page needs a few of them.",
  plan: "The free plan is end-of-day, so the running session is not available until it closes.",
  empty: "Try another symbol or a different range.",
  failed: "Refresh the page. If it keeps failing, check your connection.",
};

export function StateNotice({ failure, what }: { failure: Failure; what: string }) {
  return (
    <div role="status" className="rounded-sm border border-control bg-surface px-4 py-3 text-sm">
      <p className="font-medium text-ink">
        {failure.kind === "empty" ? "Nothing to show for " : "Could not load "}
        {what}
      </p>
      <p className="mt-1 text-muted">{failure.detail}</p>
      <p className="mt-1 text-muted">{ADVICE[failure.kind]}</p>
    </div>
  );
}

export function Loading({ what }: { what: string }) {
  return (
    <p role="status" className="text-sm text-muted">
      Loading {what}
      <span aria-hidden="true">…</span>
    </p>
  );
}

export function EmptyPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-dashed border-control px-4 py-6 text-sm">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1 text-muted">{children}</p>
    </div>
  );
}
