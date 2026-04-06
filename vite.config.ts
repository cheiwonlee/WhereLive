import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // 공공데이터 API CORS 우회용 프록시
    proxy: {
      "/api/molit": {
        target: "https://apis.data.go.kr",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/molit/, ""),
      },
    },
  },
});
