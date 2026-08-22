import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppHeader } from "@/components/AppHeader";
import { ToastProvider } from "@/components/ui/toast";

import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Assessment Center",
  description: "Software engineering assessment with live proctoring",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-canvas text-slate-900 antialiased`}>
        <ToastProvider>
          <AppHeader />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
