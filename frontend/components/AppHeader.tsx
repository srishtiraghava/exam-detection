"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/exam")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link className="text-sm font-semibold tracking-tight text-brand" href="/">
          Assessment Center
        </Link>
        <nav className="flex items-center gap-1 text-sm text-slate-600">
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-900" href="/">
            Assessments
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-900" href="/sessions">
            Reviewer Dashboard
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-900" href="/sessions/new">
            New Session
          </Link>
        </nav>
      </div>
    </header>
  );
}
