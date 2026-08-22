import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F6F3",
        surface: "#FFFFFF",
        ink: "#0F172A",
        muted: "#64748B",
        line: "#E2E8F0",
        brand: "#0B1F3A",
        primaryNavy: "#0B1F3A",
        secondaryNavy: "#132F4C",
        danger: "#D32F2F",
        success: "#2E7D32",
        warning: "#ED6C02",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.04)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
