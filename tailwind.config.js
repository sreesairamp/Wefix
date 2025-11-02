/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6C2BD9",     // Bold Purple
          dark: "#4B1FA8",
          light: "#C7B8FF",
          soft: "#F3EFFF",
          accent: "#9333EA",
        },
      },
      backgroundImage: {
        "hero-bold":
          "linear-gradient(135deg, #6C2BD9 0%, #9333EA 50%, #4B1FA8 100%)",
        "section-soft":
          "linear-gradient(to bottom, #faf7ff, #ffffff)",
        "page-bold":
          "linear-gradient(to bottom, #f3e9ff, #ffffff, #f8f4ff)",
      },
    },
  },
  plugins: [],
};
