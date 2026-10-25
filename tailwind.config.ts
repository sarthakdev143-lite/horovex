import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "#050507",
          void: "#050507",
          depth: "#08080C",
          surface: "#0D0D14",
          card: "rgba(14, 14, 22, 0.70)",
          panel: "rgba(10, 10, 15, 0.82)",
          border: "rgba(255, 255, 255, 0.07)",
          "border-subtle": "rgba(255, 255, 255, 0.04)",
          "border-hover": "rgba(255, 255, 255, 0.14)",
          specular: "rgba(255, 255, 255, 0.22)",
        },
        gold: {
          DEFAULT: "#D4AF37",
          mentor: "#D4AF37",
          glow: "#F3E5AB",
          bright: "#FDF6D8",
          dark: "#8C7320",
          muted: "rgba(212, 175, 55, 0.18)",
          border: "rgba(212, 175, 55, 0.32)",
        },
        spectral: {
          cyan: "#00F0FF",
          emerald: "#10B981",
          violet: "#8B5CF6",
          crimson: "#F43F5E",
          amber: "#F59E0B",
          indigo: "#6366F1",
        },
      },
      fontFamily: {
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
        sans: ["var(--font-instrument-sans)", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        "gold-sm": "0 0 10px rgba(212, 175, 55, 0.25)",
        "gold-md": "0 0 20px rgba(212, 175, 55, 0.35)",
        "gold-lg": "0 0 35px rgba(212, 175, 55, 0.45)",
        "cyan-sm": "0 0 10px rgba(0, 240, 255, 0.25)",
        "cyan-md": "0 0 20px rgba(0, 240, 255, 0.35)",
        "emerald-sm": "0 0 10px rgba(16, 185, 129, 0.25)",
        "crimson-sm": "0 0 10px rgba(244, 63, 94, 0.25)",
        "violet-sm": "0 0 10px rgba(139, 92, 246, 0.25)",
        "glass-depth": "0 8px 32px 0 rgba(0, 0, 0, 0.65)",
        "glass-elevated": "0 16px 48px -8px rgba(0, 0, 0, 0.8)",
      },
      backdropBlur: {
        xs: "2px",
        "2xl": "24px",
        "3xl": "40px",
      },
      animation: {
        "chronometer-slow": "spin 120s linear infinite",
        "chronometer-tick": "spin 60s steps(60, end) infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-shimmer": "shimmer 3s ease-in-out infinite",
        "fade-in": "fadeIn 0.35s ease-out forwards",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "0.8", filter: "brightness(1.0)" },
          "50%": { opacity: "1.0", filter: "brightness(1.25)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
