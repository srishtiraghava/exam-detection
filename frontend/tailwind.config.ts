import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F5F7FA",
        surface: "#FFFFFF",
        foreground: "#0B1F3A",
        ink: "#0B1F3A",
        muted: "#5e5e5e",
        line: "rgba(11, 31, 58, 0.2)",
        accent: "#132F4C",
        primaryNavy: "#0B1F3A",
        secondaryNavy: "#132F4C",
        danger: "#d32f2f",
        success: "#2e7d32",
      }
    }
  },
  plugins: []
};
export default config;