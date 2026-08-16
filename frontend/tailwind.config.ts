import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#DDD0C8",
        surface: "#DDD0C8",
        foreground: "#323232",
        ink: "#323232",
        muted: "#5e5e5e",
        line: "rgba(50, 50, 50, 0.2)",
        accent: "#323232",
        danger: "#323232",
        success: "#323232",
        slate: {
          50: "#f4efe9",
          100: "#e9e1d9",
          200: "#ddd0c8",
          300: "#c9b7a8",
          400: "#a69488",
          500: "#81776e",
          600: "#615e5b",
          700: "#4e4d4b",
          800: "#3e3e3e",
          900: "#323232",
          950: "#2a2a2a"
        },
        sky: {
          50: "#f4efe9",
          100: "#e8dfd7",
          200: "#ddd0c8",
          300: "#c8b7a7",
          400: "#9a8a7e",
          500: "#5a5a59",
          600: "#4b4b4b",
          700: "#3e3e3e",
          800: "#323232",
          900: "#2a2a2a"
        },
        emerald: {
          50: "#f4efe9",
          100: "#e8dfd7",
          200: "#ddd0c8",
          300: "#c8b7a7",
          400: "#9a8a7e",
          500: "#5a5a59",
          600: "#4b4b4b",
          700: "#3e3e3e",
          800: "#323232",
          900: "#2a2a2a"
        },
        amber: {
          50: "#f4efe9",
          100: "#e8dfd7",
          200: "#ddd0c8",
          300: "#c8b7a7",
          400: "#9a8a7e",
          500: "#5a5a59",
          600: "#4b4b4b",
          700: "#3e3e3e",
          800: "#323232",
          900: "#2a2a2a"
        },
        red: {
          50: "#f4efe9",
          100: "#e8dfd7",
          200: "#ddd0c8",
          300: "#c8b7a7",
          400: "#9a8a7e",
          500: "#5a5a59",
          600: "#4b4b4b",
          700: "#3e3e3e",
          800: "#323232",
          900: "#2a2a2a"
        }
      }
    }
  },
  plugins: []
};

export default config;
