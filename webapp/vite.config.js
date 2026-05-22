import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      // LTA DataMall doesn't set CORS headers for browser calls,
      // so we proxy through the Vite dev server.
      "/lta": {
        target: "https://datamall2.mytransport.sg",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/lta/, "/ltaodataservice"),
      },
      // Teammate backend (FastAPI + PostGIS) — no CORS middleware,
      // so the dev server proxies for us.
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
