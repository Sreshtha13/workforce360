import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { QueryProvider } from "@/components/providers/query-provider";
import { cn } from "@/lib/utils";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Workforce 360 ERP",
  description:
    "Workforce 360 ERP — modular operations platform (Phase 0 foundation)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(sourceSans.variable, sourceSerif.variable, "font-sans")}
    >
      <body className="min-h-screen antialiased">
        <QueryProvider>
          <AppShell title="System health">{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
