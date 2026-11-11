import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const microfrontend = mode === "mfe";

  return {
    plugins: [react()],
    resolve: { alias: { "@": resolve("src") } },
    base: microfrontend ? "/" : "/02-remix-norm-ai-assistant/",
    build: microfrontend
      ? {
          outDir: "dist-mfe",
          cssCodeSplit: false,
          rollupOptions: {
            input: resolve("src/knowledge-base-mf-app.tsx"),
            external: [
              "react",
              "react-dom",
              "react-dom/client",
              "react-router-dom",
              "single-spa",
              "single-spa-react",
              "@sber-orm/ui-kit",
              "@sber-orm/components",
            ],
            output: {
              format: "system",
              entryFileNames: "knowledge-base-mf-app.js",
              assetFileNames: "knowledge-base-mf-app.[ext]",
            },
          },
        }
      : undefined,
  };
});
