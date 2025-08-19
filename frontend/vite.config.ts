import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { exec } from "child_process";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tanstackRouter(),
    {
      name: "run-build-script",
      apply: "build",
      writeBundle() {
        exec("./build-and-copy.sh", (error) => {
          if (error) {
            console.error(`Build error: ${error}`);
            return;
          }
          console.log(`Build and copy complete.`);
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // build: {
  //   // equivalent to Webpack output.path
  //   outDir: path.resolve(__dirname, "./dist"),

  //   rollupOptions: {
  //     output: {
  //       // equivalent to Webpack filename: "admin-react.js"
  //       entryFileNames: "admin-react.js",
  //       // Optional: ensure no hashed chunks if you want deterministic names
  //       manualChunks: undefined,
  //     },
  //   },
  // },
  server: {
    proxy: {
      "/scene": "http://127.0.0.1:8000",
      "/data": "http://127.0.0.1:8000",
    },
  },
});
