import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Project Pages serve from /<repo>/, so the build needs that base path.
  // The dev server still runs at root.
  base: command === "build" ? "/jom-ai-hack/" : "/",
  plugins: [react()],
  server: {
    // Bind 0.0.0.0 so the dev server is reachable from a phone via the
    // Cloudflare quick tunnel (and over LAN), not just localhost.
    host: true,
    // Vite blocks requests whose Host header it doesn't recognize. The
    // tunnel forwards a *.trycloudflare.com host, so allow that suffix.
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      // LTA DataMall doesn't set CORS headers for browser calls,
      // so we proxy through the Vite dev server.
      "/lta": {
        target: "https://datamall2.mytransport.sg",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/lta/, "/ltaodataservice"),
      },
    },
  },
}));
