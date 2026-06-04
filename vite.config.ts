import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Путь для GitHub Pages (обязательно со слешем в конце!)
  base: '/norm-ai-assistant/',
  
  tanstackStart: {
    server: { entry: "server" },
  },
  
  // Переопределяем пресет Nitro со стандартного 'cloudflare' на 'static'
  // чтобы собирать статический сайт для GitHub Pages
  nitro: {
    preset: 'static',
  },
});
