import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    allowedHosts: true,
    // Enable HTTPS for LAN access (getUserMedia requires secure context)
    // Generate certs: npx mkcert create-ca && npx mkcert create-cert
    https: fs.existsSync('./cert.pem') && fs.existsSync('./cert-key.pem')
      ? {
        cert: fs.readFileSync('./cert.pem'),
        key: fs.readFileSync('./cert-key.pem'),
      }
      : undefined,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
