/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sage: {
          50: "#f0f5f0",
          100: "#dce8dc",
          200: "#b8d1b8",
          300: "#94ba94",
          400: "#709970",
          500: "#6b8f71",
          600: "#557a5b",
          700: "#4a6b50",
          800: "#3d5a42",
          900: "#2d4431",
        },
        lavender: {
          50: "#f5f0fa",
          100: "#ede8f5",
          200: "#d9cee9",
          300: "#c0afd9",
          400: "#9b8ec4",
          500: "#7b6daa",
          600: "#635590",
        },
        warm: {
          50: "#fdf8f3",
          100: "#f9f0e5",
          200: "#e8ddd0",
          300: "#d4c4ab",
          400: "#bfab88",
          500: "#a99270",
          600: "#8a7558",
          700: "#6b5a44",
          800: "#3d3029",
          900: "#231c17",
        },
        coral: {
          300: "#f0a08a",
          400: "#e07a5f",
          500: "#d05e40",
          600: "#b34a30",
        },
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "sans-serif"],
        heading: ["Playfair Display", "Georgia", "serif"],
        dancing: ["Dancing Script", "cursive"],
      },
      animation: {
        "float-slow": "floatSlow 6s ease-in-out infinite",
        breathe: "breathe 4s ease-in-out infinite",
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "gradient-x": "gradientX 6s ease infinite",
        blob: "blob 7s infinite",
      },
      keyframes: {
        floatSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.05)", opacity: "0.8" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        gradientX: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        blob: {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0, 0) scale(1)" },
        },
      },
      backgroundSize: {
        "200%": "200% 200%",
      },
    },
  },
  plugins: [],
};
