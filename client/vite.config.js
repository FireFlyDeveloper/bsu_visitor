import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Vite does NOT auto-populate process.env in the config file.
  // loadEnv() reads .env / .env.local / .env.{mode} from the project root.
  const env = loadEnv(mode, __dirname, "VITE_");

  const proxyTarget = process.env.VITE_API_PROXY_TARGET || env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000";
  const port = Number(process.env.VITE_PORT || env.VITE_PORT || 5173);
  const allowedHosts = (env.VITE_ALLOWED_HOSTS || "localhost")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);

  return {
    plugins: [vue(), tailwindcss()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    server: {
      // Comma-separated list. Set in client/.env:  VITE_ALLOWED_HOSTS=foo.ngrok-free.dev,bar.ngrok-free.app
      allowedHosts,
      host: "0.0.0.0",
      port,
      proxy: {
        "/api": {
          // Override in client/.env:  VITE_API_PROXY_TARGET=http://192.168.1.5:8765
          target: proxyTarget,
          changeOrigin: true,
        },
        "/uploads": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
