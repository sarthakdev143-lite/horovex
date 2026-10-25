import type { Metadata, Viewport } from "next";
import { Newsreader, Instrument_Sans } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal"],
  variable: "--font-newsreader",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HOROVEX · Decision Engine Across Branching Futures",
  description:
    "Map high-stakes decisions across branching probability paths, shift sensitivity levers in real time, and isolate the recommended trajectory.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#F1F0EC",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${newsreader.variable} ${instrumentSans.variable} bg-[#F1F0EC] text-[#141413] font-sans antialiased min-h-[100dvh] overflow-x-hidden tabular-nums`}
      >
        {children}
      </body>
    </html>
  );
}
