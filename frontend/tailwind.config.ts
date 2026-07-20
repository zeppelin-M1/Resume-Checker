import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0E17",
          900: "#0F1522",
          800: "#161D2E",
          700: "#1F2A40",
          600: "#2C3B56",
        },
        paper: "#F6F7F9",
        signal: {
          teal: "#14B8A6",
          amber: "#F5A623",
          rose: "#F0546B",
        },
        slate: {
          450: "#7C8AA5",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(10,14,23,0.04), 0 8px 24px rgba(10,14,23,0.06)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(10,14,23,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(10,14,23,0.035) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
export default config;
