import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  base: '/norm-ai-assistant/',
  
  tanstackStart: {
    server: { entry: "server" },
  },
  
  nitro: {
    preset: 'static',
    // Отключаем prerendering полностью
    prerender: {
      routes: [],
      crawlLinks: false,
    },
  },
});
