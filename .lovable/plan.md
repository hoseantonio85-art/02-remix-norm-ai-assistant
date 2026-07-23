План Фазы 1 с учётом всех десяти уточнений (7 предыдущих + 3 новых). Правки — в `src/components/NormPrototype.tsx`. Визуал главной, саммари, диаграммы и содержимое `RiskDetailModal` не меняются.

## 1. Единый источник риска
- В `FocusPoint` заменить объект `relatedRisk` на `riskId: string`.
- Ввести `getRiskById(riskId): RiskRow | null` (читает `RISKS_REGISTRY`).
- Все читатели `point.relatedRisk` (FocusPointModal, саммари, переходы) — через `getRiskById`.
- Проверить: `QNR-0187` показывает один и тот же уровень везде.

## 2. Канонический `SOURCES_INDEX` (уточнение №2 из этого сообщения)
- `SOURCES_INDEX: Record<string, FocusSource>` — самостоятельный реестр всех источников (фокусы, gap-источники, verdict-источники, fp-gpu). Больше не собирается из `point.sources`.
- **Сохранить все существующие ID без переименования.** Существующие `SOURCE_DECORATIONS` (document, quote, locator, provider, domain, url, date, excerpt, relation и пр.) переносятся в `SOURCES_INDEX` как есть — без потери полей.
- Для `fp-gpu`: **переиспользовать существующие `risk-gpu-*` ID**, если они уже есть в проекте. Новые `fp-gpu-*` заводить только для новых источников, которых нет.
- В `FocusPoint`: `sources: FocusSource[]` → `sourceIds: string[]`.
- Все читатели → `point.sourceIds.map(id => SOURCES_INDEX[id]).filter(Boolean)`.
- Поле `point.sources` удалить из типа и объектов.

## 3. Четыре канонические фокусные точки (уточнение №1 из этого сообщения)
- Канонический `FOCUS_POINTS` в будущем порядке: `["fp-supply", "fp-gpu", "fp-delivery", "fp-it"]`, где `fp-supply → QNR-0214`, `fp-gpu → QNR-0119`, `fp-delivery → QNR-0187`, `fp-it → QNR-0331`. `fp-gpu` получает полноценный контент и `sourceIds` (с переиспользованием `risk-gpu-*`).
- **Главная в Фазе 1 остаётся визуально неизменной.** Порядок карточек — ровно текущий: `HOME_FOCUS_IDS = ["fp-delivery", "fp-supply", "fp-it"]`. Главная маппит по этому массиву в порядке следования (не по порядку `FOCUS_POINTS`), без дублирования объектов.
- Комментарий: `// TEMP: удалить в Фазе 3, карусель получит все четыре точки в порядке FOCUS_POINTS`.

## 4. Разделение переходов саммари
Вместо `onOpenRisks({filter?, riskId?})`:
- `onOpenRisk(riskId)` — конкретный риск поверх текущего слоя;
- `onOpenRiskList(filter)` — переход к списку с фильтром.

## 5. Фильтр `withoutMeasures`
- `RiskFilter`: `"all" | "new" | "high" | "reassessed" | "withoutMeasures"`.
- В `RisksPage`: `risk.hasEffectiveMeasures === false`.
- Чип «6 без эффективных мер» → `onOpenRiskList("withoutMeasures")` (сейчас баг: даёт `reassessed`).

## 6. Стековые слои, z-index и Escape (уточнение №3 из этого сообщения + №2 предыдущего)
- Верхнее состояние: `openRiskCtx: { riskId: string; origin: "summary" | "focus" | "risks" } | null`.
- Открытие риска не закрывает нижний слой.
- **z-index через отдельные modifier-классы на подложке И на модалке** (класс только на `.np-modal` недостаточен из-за stacking context):
  - Текущие уровни: summary backdrop=1000, focus-over-summary=1100.
  - Для `origin === "summary"` или `"focus"`: подложка риска получает класс `.np-risk-modal-backdrop--stacked` с `z-index: 1200`; внутренняя `.np-modal` — `.np-modal--stacked` с `z-index: 1201`.
  - Для `origin === "risks"`: подложка и модалка риска используют текущие классы без модификаторов.
- **Escape:**
  - `CompanySummaryModal` и `FocusPointModal` получают проп `riskOnTop: boolean`; их локальные Escape при `true` — early-return.
  - `RiskDetailModal` Escape: `stopPropagation` + закрывает только риск.
  - Один Escape = один слой.
- Клик по подложке риска закрывает только риск.

## 7. Переход из `FocusPointModal`
- Контракт: добавить `onOpenRisk(riskId)` и `riskOnTop: boolean`.
- Заменить toast «Переход к риску … появится позже» на `onOpenRisk(point.riskId)`.
- Данные связанного блока — через `getRiskById`. Если риск не найден — не открывать пустую модалку, показать диагностическую строку в блоке.

## 8. ShareDrawer и `pickSuggested` для `fp-gpu`
- Явно расширить контракт ShareDrawer и `pickSuggested` кейсом `fp-gpu`.
- Убрать поведение «неизвестный `point.id` → сценарий fp-it». Заменить `switch` по `point.id`; неизвестные `point.id` — явный пустой/нейтральный сценарий, НЕ fp-it.
- Для `fp-gpu`, если получатели пока не определены, — отдельный нейтральный сценарий (пустой список получателей + осмысленная подсказка).

## 9. Отложено на Фазу 2 (фиксирую)
- `SummaryFocusItem`: убрать отдельную ссылку на риск, вся строка открывает `FocusPointModal`. Прямые ссылки на `QNR-0214` и `QNR-0119` остаются в «Решениях сегодня».
- Саммари: `activeSummarySource: string | "list" | null`; «+ ещё N» → `SourceDrawer` с `summary.sourceIds` и `activeId="list"`.

## 10. Что НЕ меняю в Фазе 1
- Главная: сетка, порядок карточек (`fp-delivery`, `fp-supply`, `fp-it`), число карточек (три).
- Визуал саммари, диаграмма, Профиль компании.
- Содержимое `RiskDetailModal` и его внутренние drawer'ы.
- `SourceDrawer.tsx`.

## 11. Проверка Фазы 1 (остановка)
1. Главная визуально не изменилась: ровно карточки `fp-delivery`, `fp-supply`, `fp-it` в этом порядке; `fp-gpu` на главной не показывается.
2. В `FOCUS_POINTS` присутствуют все четыре точки, включая `fp-gpu` с сохранёнными/переиспользованными `risk-gpu-*` ID.
3. Клик «Связанный риск» в `FocusPointModal` открывает `RiskDetailModal` поверх фокуса (без toast).
4. Закрытие риска возвращает ту же фокусную точку (без сброса `focusIdx`).
5. Клик по риску из саммари открывает риск поверх саммари; закрытие возвращает саммари.
6. «18 высоких рисков» → список с фильтром `high`. «6 без эффективных мер» → фильтр `withoutMeasures`.
7. `QNR-0119`, `QNR-0214`, `QNR-0187`, `QNR-0331` открываются через один `RiskDetailModal`; уровень/название — из `RISKS_REGISTRY`.
8. Один Escape = один слой (сначала риск, потом фокус/саммари).
9. DevTools: у stacked-риска подложка имеет `.np-risk-modal-backdrop--stacked` (z-index 1200) и модалка `.np-modal--stacked` (1201); визуально стек виден корректно поверх фокуса-над-саммари.
10. Клик по подложке риска закрывает только риск.
11. `point.sources` в коде отсутствует; теги источников фокусов и `SOURCES_INDEX` содержат все прежние поля (document, quote, locator, provider, domain, url, date, excerpt, relation) — точечная сверка на `fp-supply`, `fp-delivery`, `fp-it` и общих `risk-gpu-*`.
12. ShareDrawer для `fp-gpu` открывается по явному сценарию; неизвестный `point.id` НЕ уходит в fp-it.
13. TypeScript-сборка проходит.

Останавливаюсь после Фазы 1 и показываю результат проверки перед Фазой 2.