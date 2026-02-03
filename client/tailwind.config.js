/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "ledger-bg": "#09090b",
        "ledger-border": "#27272a",
        "ledger-text": "#fafafa",
        "ledger-accent": "#a1a1aa",
      },
    },
  },
  plugins: [],
};
