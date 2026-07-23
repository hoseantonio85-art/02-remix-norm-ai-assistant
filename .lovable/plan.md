## Что делаем

Из риска (и из карточек «Источники вывода» внутри Обоснования анализа) можно перейти не просто в профиль компании, а сразу в конкретную карточку знания внутри нужной области базы знаний. Работает для всех рисков.

## Поведение

- В драйвере/модалке риска у каждой карточки-источника («Активные жители мегаполисов 25–40 лет», «Система AI-рекомендаций товаров», и т. п.) заголовок и/или явная ссылка «Открыть в базе знаний →» ведут в конкретное знание.
- Кнопка «Перейти в профиль компании» ведёт в область целиком (без подсветки конкретного пункта).
- Клик по ссылке: закрывает стек модалок риска → открывает вкладку «Профиль» в базе знаний → раскрывает нужную область → скроллит к нужной карточке знания и мягко подсвечивает её (пульс-рамка ~1.6с).
- Если целевого knowledgeId нет — фолбэк на область. Если и её нет — открывается корень базы знаний (как сейчас).

## Модель данных

- В типе источника риска (тот, что рендерится в `RiskRationaleModal` / `RiskKnowledgeModal`) добавляем опциональные поля:
  - `targetAreaId?: string`
  - `targetKnowledgeId?: string`
- Заводим единый реестр `RISK_KNOWLEDGE_LINKS` в `src/components/NormPrototype.tsx` (или соседний data-файл) — маппинг `sourceCardKey → { areaId, knowledgeId }`. Заполняем для всех рисков, что есть в прототипе (QNR-0214 клиенты/GPU, поставщики-банкроты, ИТ, и т. д.).
- `knowledgeId` — это `UniversalKnowledge.id` из `universal_knowledge_demo.json` / адаптированного профиля.

## Интеграция KnowledgeBase

`src/components/KnowledgeBase.tsx`:
- Добавить проп `focus?: { areaId: string; knowledgeId?: string; nonce: number }`.
- При изменении `focus.nonce`:
  1. `setTab("profile")`, `setActiveAreaId(focus.areaId)`.
  2. После рендера области — `scrollIntoView({ block: "center" })` к элементу `[data-knowledge-id="…"]` и добавить класс `is-flash` на ~1.6с.
- Добавить `data-knowledge-id={k.id}` и стиль `.np-kb-knowledge-card.is-flash` (мягкая рамка/тень, keyframes 1.6с) в `src/styles/norm-prototype.css`.
- `rootRequest` остаётся для обычного «в корень».

## Интеграция NormPrototype

`src/components/NormPrototype.tsx`:
- В состоянии главного каркаса завести `knowledgeFocus: { areaId, knowledgeId?, nonce } | null` рядом с `knowledgeBaseRootRequest`.
- Передавать в `<KnowledgeBase focus={knowledgeFocus} … />`.
- Прокинуть колбэк `onOpenKnowledge(areaId, knowledgeId?)` в стек риск-модалок (`RiskDetailModal` → `RiskRationaleModal` → `RiskKnowledgeModal`). Колбэк:
  1. Закрывает открытые риск-модалки (сбрасывает соответствующее состояние).
  2. Переключает активный раздел на «База знаний».
  3. Ставит `knowledgeFocus = { areaId, knowledgeId, nonce: Date.now() }`.
- В `RiskKnowledgeModal` каждая карточка-источник получает кликабельный заголовок + ссылку «Открыть в базе знаний →». В `RiskRationaleModal` — та же ссылка в футере карточки-источника рядом с `sourceLabel`.
- Кнопка «Перейти в профиль компании» → `onOpenKnowledge(source.areaId)` (без knowledgeId).

## Технические детали

- Никаких новых URL-роутов — прототип SPA, деталь ловится через `nonce` в `useEffect`.
- Скролл к карточке — двухшаговый `requestAnimationFrame`, чтобы дождаться раскрытия области.
- Мапп-таблица `RISK_KNOWLEDGE_LINKS` покрывает все существующие source-карточки; при добавлении новых — предупреждение в консоли (dev-only) и фолбэк на область.
- Анимация `is-flash`: `@keyframes np-kb-flash { 0% box-shadow: 0 0 0 0 rgba(…,.35); 100% box-shadow: 0 0 0 8px rgba(…,0); }`, 1.6с, `ease-out`, один прогон, затем класс снимается по `setTimeout`.

## Что НЕ трогаем

- Верстку самой базы знаний, драйверов источников, порядок главной, тексты сюжетов.
- Логику Обоснования анализа и других драйверов, кроме добавления ссылки/кликабельного заголовка.
