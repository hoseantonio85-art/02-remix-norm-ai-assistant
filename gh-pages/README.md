# Норм — сборка для GitHub Pages

Эта папка — **полностью автономный** Vite + React + TypeScript + React Router v6 проект.
Превью внутри Lovable работает на TanStack Start, поэтому корень репозитория его не трогает;
вся "чистая" сборка для GitHub Pages живёт здесь.

## Что внутри

```
gh-pages/
├── .github/workflows/deploy.yml   # CI: build + deploy на Pages
├── index.html
├── package.json                   # react, react-dom, react-router-dom, vite
├── tsconfig.json
├── vite.config.ts                 # base: '/norm-ai-assistant/'
└── src/
    ├── main.tsx
    ├── App.tsx                    # BrowserRouter с basename
    ├── index.css
    ├── components/NormPrototype.tsx
    └── styles/norm-prototype.css
```

## Деплой

1. Создайте на GitHub пустой репозиторий `norm-ai-assistant`.
2. Скопируйте **содержимое папки `gh-pages/`** (не саму папку) в корень нового репозитория.
3. Локально:
   ```
   npm install
   npm run dev      # http://localhost:5173
   npm run build    # сборка в dist/
   npm run preview
   ```
4. `git push` в ветку `main`.
5. GitHub → **Settings → Pages → Source: GitHub Actions**.
6. Сайт: `https://<user>.github.io/norm-ai-assistant/`.

## Другое имя репозитория

Поменяйте `base` в `vite.config.ts` и `basename` в `src/App.tsx`
на `/<имя-репозитория>/`.
