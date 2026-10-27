import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HOROVEX — Precision Chronometric Decision Engine",
  description:
    "Ultra-luxury 3D AI Multiverse Probability Simulator and Strategic Decision Engine. Simulate the 5 most probable futures, expand horizontally to 20+ possibilities, and illuminate the Golden Path.",
  keywords: [
    "AI Multiverse",
    "Decision Engine",
    "Scenario Planning",
    "Probabilistic Forecasting",
    "Bayesian Trees",
    "Horology",
    "Strategic Intelligence",
  ],
  authors: [{ name: "HOROVEX Chronometry & Decision Labs" }],
  openGraph: {
    title: "HOROVEX — Precision Chronometric Decision Engine",
    description:
      "Step into the 3D Multiverse Observatory. Model high-stakes crossroads across diverging probability trajectories.",
    type: "website",
    siteName: "HOROVEX",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${instrumentSerif.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} bg-[#050507] text-[#E2E8F0] font-sans antialiased selection:bg-[#D4AF37]/20 selection:text-[#F3E5AB] min-h-screen overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
