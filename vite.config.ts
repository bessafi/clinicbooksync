import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    },
  },
  define: {
    "import.meta.env.VITE_BACKEND_URL": JSON.stringify("https://production.up.railway.app/api/v1"),
  },
});
