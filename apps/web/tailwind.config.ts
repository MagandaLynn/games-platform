import type { Config } from "tailwindcss";

module.exports = require("./tailwind.config.ts").default;
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bgApp: "var(--bg-app)",
        bgPanel: "var(--bg-panel)",
        bgSoft: "var(--bg-soft)",
        text: "var(--text)",
        textMuted: "var(--text-muted)",
      },
    },
  },
};


export default config;
