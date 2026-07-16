/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // ألوان هوية متجر "بريق" — عدّليها هنا لتغيير لوحة الألوان في كل الموقع دفعة واحدة
      colors: {
        ivory: "#FBF8F3",
        blush: "#F3DCE1",
        "blush-light": "#F8ECEF",
        gold: "#B78B4C",
        "gold-dark": "#9C6B3E",
        "gold-soft": "#EADFC8",
        charcoal: "#2B2420",
        "charcoal-soft": "#6B5F52",
        footer: "#2B2420",
      },
      // خطوط الهوية: Amiri للعناوين (طابع راقٍ)، Tajawal للنصوص (وضوح القراءة)
      fontFamily: {
        display: ["Amiri", "serif"],
        body: ["Tajawal", "sans-serif"],
      },
    },
  },
  plugins: [],
};
