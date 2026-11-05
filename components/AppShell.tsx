import { MobileNav, Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main id="main" className="min-w-0 flex-1 px-4 pt-5 pb-28 sm:px-6 lg:pb-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-5">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
