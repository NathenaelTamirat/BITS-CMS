/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#7CB342",
          "green-dark": "#558B2F",
          "green-light": "#C8E6A0",
          "green-blob": "#DCEDC8",
          charcoal: "#1F2937",
          muted: "#6B7280",
          bg: "#FAFAFA",
        },
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        pill: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};
