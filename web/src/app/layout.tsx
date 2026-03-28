import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/layout/SkipLink";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Impact Intelligence",
    template: "%s · Impact Intelligence",
  },
  description:
    "Understand how global and regional events may affect you in India—with sources and clear confidence.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <SmoothScroll>
          <ThemeProvider>
            <SkipLink />
            <SiteHeader />
            <main
              id="main-content"
              className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-10 sm:px-6"
              tabIndex={-1}
            >
              {children}
            </main>
          </ThemeProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
