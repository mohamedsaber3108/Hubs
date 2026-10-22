import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// Backend origin for the dev proxy. The SPA calls relative /api/v1 (see
// src/lib/api.ts), and in production Nginx proxies /api -> the API. In local
// dev there was no proxy, so every API call 404'd against the Vite server.
// This proxy fixes dev parity; override the target with VITE_DEV_API_TARGET.
const DEV_API_TARGET = process.env.VITE_DEV_API_TARGET || "http://localhost:3000";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": { target: DEV_API_TARGET, changeOrigin: true },
      "/socket.io": { target: DEV_API_TARGET, ws: true, changeOrigin: true },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
