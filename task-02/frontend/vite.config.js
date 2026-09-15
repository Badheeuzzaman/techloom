import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Simple Vite config. VITE_API_URL is read at build/run time from
// an .env file (see .env.example) and used in src/api.js.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
