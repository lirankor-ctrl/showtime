import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// SHOW TIME — Hebrew RTL PWA for tracking cultural events.
export default defineConfig({
  // Expose NEXT_PUBLIC_* (alongside VITE_*) to the client. Only the Supabase
  // URL + anon key use this prefix; the service_role key must never be named
  // with an exposed prefix, so it can never leak into the browser bundle.
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png", "LOGO.jpg"],
      manifest: {
        name: "SHOW TIME — יומן התרבות שלי",
        short_name: "SHOW TIME",
        description: "מעקב, תכנון ותיעוד אירועי תרבות: הצגות, הופעות, סרטים ועוד.",
        lang: "he",
        dir: "rtl",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0b0a12",
        theme_color: "#0b0a12",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,jpg,svg,woff2}"],
        navigateFallback: "index.html",
      },
    }),
  ],
});
