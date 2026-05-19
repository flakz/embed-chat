import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync } from "fs";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-index-html",
      closeBundle() {
        copyFileSync(
          resolve(__dirname, "index.html"),
          resolve(__dirname, "dist", "index.html"),
        );
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: "src/widget.tsx",
      formats: ["iife"],
      name: "MarnoChatWidget",
      fileName: () => "marno-chat-widget.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: "marno-chat-widget.js",
      },
    },
    cssCodeSplit: false,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
