/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                // --- ĐỔI MÀU CHÍNH THÀNH MÀU CAM (ORANGE) ---
                primary: {
                    50: "#fff7ed",
                    100: "#ffedd5",
                    200: "#fed7aa",
                    300: "#fdba74",
                    400: "#fb923c",
                    500: "#f97316", // Màu gốc (Orange-500)
                    600: "#ea580c", // Màu hover (Orange-600)
                    700: "#c2410c",
                    800: "#9a3412",
                    900: "#7c2d12",
                    950: "#431407",
                },
                // Màu phụ có thể để Xanh hoặc Xám tùy ý
                secondary: {
                    50: "#f8fafc",
                    // ... (giữ nguyên hoặc xóa nếu không dùng)
                    900: "#0f172a",
                },
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
            },
        },
    },
    plugins: [],
};
