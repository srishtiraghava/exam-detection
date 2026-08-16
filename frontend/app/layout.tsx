import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Exam Proctoring",
  description: "AI powered exam monitoring dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100 antialiased">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(221,208,200,0.9),rgba(50,50,50,1)_42%)]">
          <header className="sticky top-0 z-30 border-b border-slate-700/80 bg-slate-900/85 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <a className="text-lg font-semibold tracking-normal text-white transition-colors hover:text-slate-200" href="/">
                Exam Proctoring
              </a>
              <nav className="flex items-center gap-2 text-sm text-slate-200">
                <a className="rounded-md px-3 py-2 transition-colors hover:bg-slate-700 hover:text-white" href="/sessions">
                  Sessions
                </a>
                <a className="rounded-md px-3 py-2 transition-colors hover:bg-slate-700 hover:text-white" href="/sessions/new">
                  New Session
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
