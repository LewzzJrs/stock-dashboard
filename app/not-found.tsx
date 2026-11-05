import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-12">
      <h1 className="text-2xl font-semibold text-ink">There is no page here</h1>
      <p className="mt-2 max-w-xl text-base text-muted">
        This dashboard has four pages: the dashboard itself, Markets, Watchlist and Portfolio.
        This address is none of them.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-sm bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
        >
          Go to the dashboard
        </Link>
        <Link
          href="/markets"
          className="inline-flex min-h-11 items-center rounded-sm border border-control px-4 text-sm font-medium text-ink hover:border-accent hover:text-accent"
        >
          Browse markets
        </Link>
      </div>
    </div>
  );
}
