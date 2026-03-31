/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A8A",      // Deep Blue
        secondary: "#2563EB",    // Royal Blue
        accent: "#0EA5E9",       // Sky Blue
        success: "#16A34A",
        danger: "#DC2626",
        background: "#F8FAFC",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0, 0, 0, 0.08)",
      },
  },
  plugins: [],
}
};