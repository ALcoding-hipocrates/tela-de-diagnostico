import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        clinical: {
          DEFAULT: "var(--color-clinical)",
          700: "var(--color-clinical-700)",
          glow: "var(--color-emerald-glow)",
        },
        ink: {
          900: "var(--color-ink-900)",
          600: "var(--color-ink-600)",
          400: "var(--color-ink-400)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          raised: "var(--color-surface-raised)",
        },
        background: "var(--color-background)",
        danger: "var(--color-danger)",
        warning: "var(--color-warning)",
        peach: {
          DEFAULT: "var(--color-peach)",
          border: "var(--color-peach-border)",
          text: "var(--color-peach-text)",
        },
      },
      fontSize: {
        body: ["15px", { lineHeight: "1.5" }],
        label: ["12px", { lineHeight: "1.4", letterSpacing: "0.01em" }],
        metric: ["20px", { lineHeight: "1.2" }],
      },
      letterSpacing: {
        ultra: "0.15em",
        tightest: "-0.04em",
      },
    },
  },
  plugins: [],
} satisfies Config;
