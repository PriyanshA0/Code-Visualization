import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "ak-bg": "#f2f7f4",
        "ak-bg-alt": "#e4eee8",
        "ak-surface": "#ffffff",
        "ak-surface-strong": "#eaf3ed",
        "ak-text": "#1a2b22",
        "ak-accent": "#1e8a4e",
        "ak-accent-soft": "#a3d4b5",
        "ak-muted": "#4d6b58",
        "ak-border": "#cce0d6",
        "white-1": "#ffffff",
        "grey-1": "#4d6b58",
        "grey-2": "#cce0d6",
        "blue-1": "#1e8a4e",
        "blue-2": "#eaf3ed",
        "blue-3": "#f2f7f4",
        "red-1": "#c0392b",
      },
      fontSize: {
        "heading1-bold": ["50px", { lineHeight: "100%", fontWeight: "700" }],
        "heading2-bold": ["30px", { lineHeight: "100%", fontWeight: "700" }],
        "heading3-bold": ["24px", { lineHeight: "100%", fontWeight: "700" }],
        "heading4-bold": ["20px", { lineHeight: "100%", fontWeight: "700" }],
        "body-bold": ["18px", { lineHeight: "100%", fontWeight: "700" }],
        "body-semibold": ["18px", { lineHeight: "100%", fontWeight: "600" }],
        "body-medium": ["18px", { lineHeight: "100%", fontWeight: "500" }],
        "base-bold": ["16px", { lineHeight: "100%", fontWeight: "600" }],
        "base-semibold": ["16px", { lineHeight: "100%", fontWeight: "600" }],
        "base-medium": ["16px", { lineHeight: "100%", fontWeight: "500" }],
      },
    },
  },
  plugins: [],
};

export default config;
