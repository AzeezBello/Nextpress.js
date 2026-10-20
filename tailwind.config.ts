import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15201C",
        muted: "#64716A",
        canvas: "#F6F7F4",
        line: "#E3E8E2",
        brand: "#176B4D",
        "brand-soft": "#E4F2EA"
      },
      boxShadow: {
        soft: "0 12px 40px rgba(21, 32, 28, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
