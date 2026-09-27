import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const projectDirectory = import.meta.dirname;

export default defineConfig({
  build: {
    license: { fileName: "THIRD_PARTY_NOTICES.md" },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(projectDirectory, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
