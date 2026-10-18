import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  server: { host: "0.0.0.0" },
  build: { chunkSizeWarningLimit: 1600 },
});
