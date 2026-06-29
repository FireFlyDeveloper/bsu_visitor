import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [vue(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    // Comma-separated list. Set in client/.env:  VITE_ALLOWED_HOSTS=foo.ngrok-free.dev,bar.ngrok-free.app
    allowedHosts: (
      process.env.VITE_ALLOWED_HOSTS || "localhost"
    )
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean),
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        // Override in client/.env:  VITE_API_PROXY_TARGET=http://192.168.1.5:8000
        target: process.env.VITE_API_PROXY_TARGET || "http://localhost:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: process.env.VITE_API_PROXY_TARGET || "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
