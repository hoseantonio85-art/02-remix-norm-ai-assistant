import { useEffect, useState } from "react";

type Status = "low" | "some" | "enough" | "good";

const STATUS_LABEL: Record<Status, string> = {
  low: "почти не знаю",
  some: "знаю немного",
  enough: "знаю достаточно",
  good: "знаю хорошо",
};

function statusFromPercent(p: number): Status {
  if (p < 30) return "low";
  if (p < 50) return "some";
  if (p < 70) return "enough";
  return "good";
}

interface Area {
  id: string;
  title: string;
  percent: number;
  summary: string;
  insight: string;
  sources: number;
  knowledge: string[];
  sourceList: string[];
  usedIn: string[];
  why: string;
  aiSummary: string;
  facts: { text: string; source: string; date: string }[];
  risks: string[];
  gaps: string[];
  sourcesDetailed: { name: string; type: string }[];
  sections?: { title: string; items: { label: string; value: string }[] }[];
  riskCount?: number;
  riskDelta?: string;
  influence?: { label: string; value: number }[];
}

const mk = (
  id: string,
  title: string,
  percent: number,
  insight: string,
  sources: number,
  knowledge: number,
  why: string,
  aiSummary: string,
  facts: { text: string; source: string; date: string }[],
  risks: string[],
  gaps: string[],
  sourcesDetailed: { name: string; type: string }[],
  extras: Partial<Area> = {},
): Area => ({
  id,
  title,
  percent,
  insight,
  summary: insight,
  sources,
  knowledge: [],
  sourceList: sourcesDetailed.map((s) => s.name),
  usedIn: [],
  why,
  aiSummary,
  facts: facts.length ? facts : Array.from({ length: knowledge }).map((_, i) => ({
    text: `Знание ${i + 1}`,
    source: sourcesDetailed[0]?.name ?? "Источник",
    date: "—",
  })),
  risks,
  gaps,
  sourcesDetailed,
  ...extras,
});

const AREAS_INITIAL: Area[] = [
  mk(
    "general",
    "Общая информация",
    82,
    "Помогает понять, кто компания, где работает, в какой отрасли находится и какой контекст учитывать при анализе рисков.",
    6,
    8,
    "Эта область помогает понять базовый контекст компании: кто она, где работает, в какой отрасли находится и какие регуляторные рамки могут быть важны.",
    "Я уверенно понимаю профиль компании: знаю юридическое лицо, отрасль, регион присутствия и основные виды деятельности. Этого достаточно, чтобы строить корректный контекст для большинства рисков.",
    [],
    ["Репутационные риски бренда", "Регуляторные риски в РФ", "Отраслевые риски AI-индустрии"],
    [
      "Добавь данные о хранении клиентских данных",
      "Добавь описание архитектуры AI-продукта",
      "Укажи владельцев каналов продаж",
    ],
    [
      { name: "Устав компании.pdf", type: "PDF" },
      { name: "Сайт компании", type: "Веб-источник" },
      { name: "Регистрационная выписка.pdf", type: "PDF" },
    ],
    {
      riskCount: 3,
      riskDelta: "+1 за месяц",
      influence: [{ label: "Оценка рисков", value: 10 }, { label: "AI-рекомендации", value: 65 }],
      sections: [
        {
          title: "Регистрационные данные",
          items: [
            { label: "Сокращённое название", value: "СамИздат" },
            { label: "Полное название", value: "ООО «Сам Издат Инкорпорейтед»" },
            { label: "ИНН", value: "772335154264" },
            { label: "ОГРН", value: "1177847261602" },
            { label: "Дата основания", value: "02.08.2017" },
          ],
        },
        {
          title: "Юридический адрес",
          items: [{ label: "Адрес", value: "21087, Москва, ул. Барклая, д. 6, стр. 3, помещ. 8/28" }],
        },
        {
          title: "Профиль деятельности",
          items: [
            { label: "Основная отрасль", value: "Разработка AI-продуктов" },
            { label: "Основной вид деятельности", value: "AI-рекомендации для e-commerce и корпоративных систем" },
          ],
        },
        {
          title: "Ключевые ОКВЭД",
          items: [
            { label: "62.01", value: "Разработка компьютерного программного обеспечения" },
            { label: "63.11", value: "Деятельность по обработке данных" },
            { label: "73.20", value: "Исследование конъюнктуры рынка" },
          ],
        },
      ],
    },
  ),
  mk(
    "structure",
    "Структура и управление",
    46,
    "Помогает определить владельцев рисков, зоны ответственности, узкие места управления и зависимость от ключевых руководителей.",
    3,
    5,
    "Эта область показывает, кто принимает решения, кто отвечает за направления и где могут быть узкие места управления.",
    "Я знаю генерального директора и понимаю, что выделены блоки ИТ и операционных рисков. Полной оргструктуры и матрицы ответственности пока нет — это мешает корректно назначать владельцев рисков.",
    [
      { text: "Генеральный директор — Семён Петрович Колбасников.", source: "ФИО директора и прочая инфа.pdf", date: "15.01.2026" },
      { text: "Выделен блок ИТ и кибербезопасности.", source: "ФИО директора и прочая инфа.pdf", date: "15.01.2026" },
      { text: "Выделен блок операционных рисков.", source: "ФИО директора и прочая инфа.pdf", date: "15.01.2026" },
    ],
    ["Единая точка отказа в управлении", "Размытая ответственность за инциденты"],
    ["Полная оргструктура", "Владельцы ключевых направлений", "Матрица RACI"],
    [
      { name: "ФИО директора и прочая инфа.pdf", type: "PDF" },
      { name: "Внутренний регламент.docx", type: "DOCX" },
      { name: "Сайт компании", type: "Веб-источник" },
    ],
  ),
  mk(
    "owners",
    "Собственники и связи",
    28,
    "Помогает видеть связанных лиц, группы влияния, зависимые компании, конфликты интересов и концентрацию контроля.",
    1,
    2,
    "Эта область раскрывает, кто реально контролирует компанию, какие есть связанные структуры и где могут быть конфликты интересов.",
    "О собственниках и связанных лицах у меня пока очень мало данных. Это ограничивает оценку рисков концентрации контроля и конфликтов интересов.",
    [
      { text: "Единственный известный бенефициар — упоминание в выписке.", source: "Регистрационная выписка.pdf", date: "10.01.2026" },
      { text: "Связанные компании не описаны.", source: "—", date: "—" },
    ],
    ["Концентрация контроля", "Скрытые связанные стороны"],
    ["Список собственников и долей", "Карта связанных компаний", "Декларация конфликтов интересов"],
    [{ name: "Регистрационная выписка.pdf", type: "PDF" }],
  ),
  mk(
    "products",
    "Продукты и бизнес-модель",
    68,
    "Показывает, на чём компания зарабатывает, какие продукты критичны и где сбой может сильнее всего повлиять на бизнес.",
    5,
    7,
    "Эта область объясняет, как устроена выручка, какие продукты ключевые и где сбой ударит по бизнесу сильнее всего.",
    "Я понимаю продуктовую линейку и основной фокус на AI-рекомендациях для ритейла. Знаю про внутреннего ассистента и аналитический модуль для партнёров.",
    [
      { text: "AI-рекомендации товаров — ключевой продукт.", source: "Сайт компании", date: "03.02.2026" },
      { text: "Внутренний AI-ассистент используется сотрудниками.", source: "Отчёт внутреннего аудита 2026.pdf", date: "20.01.2026" },
      { text: "Аналитический модуль поставляется партнёрам по API.", source: "Сайт компании", date: "03.02.2026" },
      { text: "Основной рынок сбыта — e-commerce в РФ.", source: "Отчёт внутреннего аудита 2026.pdf", date: "20.01.2026" },
    ],
    ["Концентрация выручки на одном продукте", "Рыночные риски в e-commerce"],
    ["Доли рынка и конкурентный анализ", "Карта клиентских сегментов", "Описание unit-экономики"],
    [
      { name: "Сайт компании", type: "Веб-источник" },
      { name: "Отчёт внутреннего аудита 2026.pdf", type: "PDF" },
    ],
  ),
  mk(
    "ops",
    "Операционная деятельность",
    41,
    "Помогает понять ключевые процессы, поставщиков, клиентов, каналы продаж и точки, где может нарушиться работа компании.",
    3,
    4,
    "Эта область описывает повседневные процессы, точки взаимодействия с клиентами и поставщиками, где чаще всего возникают сбои.",
    "Я частично понимаю операционные процессы: знаю про каналы продаж и часть ключевых поставщиков. Полной карты процессов и SLA пока нет.",
    [
      { text: "Основные каналы продаж — прямые корпоративные сделки.", source: "Отчёт внутреннего аудита 2026.pdf", date: "20.01.2026" },
      { text: "Часть поставок оборудования зависит от одного вендора.", source: "Отчёт внутреннего аудита 2026.pdf", date: "20.01.2026" },
      { text: "Поддержка клиентов осуществляется собственной командой.", source: "Сайт компании", date: "03.02.2026" },
    ],
    ["Сбой в канале продаж", "Зависимость от ключевого вендора"],
    ["Карта операционных процессов", "Список ключевых поставщиков", "SLA с клиентами"],
    [
      { name: "Отчёт внутреннего аудита 2026.pdf", type: "PDF" },
      { name: "Сайт компании", type: "Веб-источник" },
      { name: "Внутренний регламент.docx", type: "DOCX" },
    ],
  ),
  mk(
    "it",
    "ИТ, данные и технологии",
    54,
    "Показывает технологические зависимости, ИТ-системы, данные, кибербезопасность и инфраструктуру, от которых зависит устойчивость компании.",
    4,
    6,
    "Эта область описывает технологический фундамент: ИТ-системы, данные, кибербезопасность и зависимость от инфраструктуры.",
    "Я знаю про зависимость от GPU-инфраструктуры и часть политик ИБ. При этом карта ИТ-систем, владельцы сервисов и SLA пока не описаны.",
    [
      { text: "GPU-ресурсы загружены до 90% в пиковые периоды.", source: "Отчёт внутреннего аудита 2026.pdf", date: "20.01.2026" },
      { text: "Закупка новых мощностей инициирована в Q1 2026.", source: "Отчёт внутреннего аудита 2026.pdf", date: "20.01.2026" },
      { text: "Политика кибербезопасности описана для филиалов.", source: "Политика кибербезопасности для филиалов.docx", date: "10.10.2025" },
      { text: "Есть акт проверки ИБ-защищённости филиала №14.", source: "Акт проверки ИБ-защищённости филиала №14.pdf", date: "12.05.2024" },
    ],
    ["Недоступность AI-рекомендаций", "Срыв сроков запуска продукта", "Слабая ИБ-защищённость филиалов"],
    ["Карта ИТ-систем", "Владельцы ключевых сервисов", "SLA по критичным системам", "План восстановления после сбоев"],
    [
      { name: "Отчёт внутреннего аудита 2026.pdf", type: "PDF" },
      { name: "Политика кибербезопасности для филиалов.docx", type: "DOCX" },
      { name: "Акт проверки ИБ-защищённости филиала №14.pdf", type: "PDF" },
      { name: "Сайт компании", type: "Веб-источник" },
    ],
  ),
  mk(
    "finance",
    "Финансы и контрагенты",
    25,
    "Помогает оценивать финансовую устойчивость, долговую нагрузку, зависимость от крупных клиентов, поставщиков и контрагентов.",
    1,
    2,
    "Эта область помогает понять, насколько компания финансово устойчива и где у неё критичные зависимости от контрагентов.",
    "Я почти не знаю финансовое состояние компании. Есть только косвенные упоминания выручки, нет официальной отчётности и перечня контрагентов.",
    [
      { text: "Косвенное упоминание выручки в отчёте внутреннего аудита.", source: "Отчёт внутреннего аудита 2026.pdf", date: "20.01.2026" },
      { text: "Перечень ключевых контрагентов не загружен.", source: "—", date: "—" },
    ],
    ["Кредитные риски", "Концентрация поставщиков", "Зависимость от ключевых клиентов"],
    ["Финансовая отчётность за 2024–2025", "Список ключевых контрагентов", "Структура выручки по продуктам"],
    [{ name: "Отчёт внутреннего аудита 2026.pdf", type: "PDF" }],
  ),
  mk(
    "regulatory",
    "Регуляторика и риск-сигналы",
    57,
    "Собирает проверки, нарушения, инциденты, судебные и регуляторные сигналы, которые могут указывать на будущие риски.",
    5,
    6,
    "Эта область собирает внешние сигналы — проверки, инциденты, регуляторные требования и судебные дела, которые могут указывать на будущие риски.",
    "У меня есть данные по внутренним аудитам ИБ и описание инцидента с DDoS-атакой. Внешних независимых аудитов и сертификаций пока нет.",
    [
      { text: "Акт проверки ИБ-защищённости филиала №14 от 05.2024.", source: "Акт проверки ИБ-защищённости филиала №14.pdf", date: "12.05.2024" },
      { text: "Чек-лист аудита рисков поставщика версии 1.2.", source: "Чек-лист аудита рисков поставщика v.1.2.xlsx", date: "08.11.2025" },
      { text: "Инцидент DDoS-атаки 12.05.2024 задокументирован.", source: "Описание инцидента с DDoS-атакой.pdf", date: "14.05.2024" },
    ],
    ["Операционные риски", "Риски поставщиков", "Риски доступности сервисов"],
    ["Внешний аудит ИБ", "Сертификация ISO/SOC", "План регулярных проверок"],
    [
      { name: "Акт проверки ИБ-защищённости филиала №14.pdf", type: "PDF" },
      { name: "Чек-лист аудита рисков поставщика v.1.2.xlsx", type: "XLSX" },
      { name: "Описание инцидента с DDoS-атакой.pdf", type: "PDF" },
      { name: "Внутренний регламент.docx", type: "DOCX" },
      { name: "Сайт компании", type: "Веб-источник" },
    ],
  ),
];

const INDEX_PERCENT = 64;

function statusClass(s: Status) {
  return `np-kb-status np-kb-status-${s}`;
}

function Ring({ percent, size = 56, stroke = 6 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - percent / 100);
  const color = percent >= 70 ? "#22c55e" : percent >= 50 ? "#22c4a3" : percent >= 30 ? "#f5a623" : "#ef6f6c";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#eef0f3" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize={size * 0.24} fontWeight={700} fill="#1f2937">{percent}%</text>
    </svg>
  );
}

function KbToast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, [onDone]);
  return <div className="np-toast">{message}</div>;
}

function AreaPage({
  area,
  areas,
  onSelect,
  onBack,
  onAddFact,
  toast,
  onOpenChat,
}: {
  area: Area;
  areas: Area[];
  onSelect: (id: string) => void;
  onBack: () => void;
  onAddFact: () => void;
  toast: (m: string) => void;
  onOpenChat?: (q: string) => void;
}) {
  const status = statusFromPercent(area.percent);
  return (
    <div className="np-area-page">
      <button className="np-area-back" onClick={onBack}>← Профиль компании</button>

      <div className="np-area-layout">
        <aside className="np-area-left">
          <div className="np-area-left-title">Области знаний</div>
          {areas.map((a) => {
            const s = statusFromPercent(a.percent);
            const isActive = a.id === area.id;
            return (
              <button
                key={a.id}
                className={`np-area-left-item ${isActive ? "active" : ""}`}
                onClick={() => onSelect(a.id)}
              >
                <div className="np-area-left-name">{a.title}</div>
                <span className={statusClass(s)}>{STATUS_LABEL[s]}</span>
              </button>
            );
          })}
        </aside>

        <div className="np-area-center">
          <header className="np-area-header">
            <div className="np-area-header-main">
              <h2 className="np-area-title">{area.title}</h2>
              <div className="np-area-meta">
                <span className={statusClass(status)}>{STATUS_LABEL[status]}</span>
                <span className="np-area-percent">{area.percent}%</span>
              </div>
              <p className="np-area-why">{area.why}</p>
            </div>
            <Ring percent={area.percent} size={88} stroke={8} />
          </header>

          <section className="np-area-summary">
            <div className="np-kb-summary-eyebrow">Как Норм понимает эту область</div>
            <p>{area.aiSummary}</p>
          </section>

          <section className="np-area-section">
            <div className="np-area-section-head">
              <h3>{area.sections ? "Разделы знания" : "Ключевые знания"}</h3>
              <span className="np-muted">{area.sections ? area.sections.length : area.facts.length}</span>
            </div>
            {area.sections ? (
              <div className="np-section-groups">
                {area.sections.map((g, gi) => (
                  <div key={gi} className="np-section-group">
                    <div className="np-section-group-title">{g.title}</div>
                    <ul className="np-fact-list">
                      {g.items.map((it, ii) => (
                        <li key={ii} className="np-fact">
                          <div className="np-fact-row">
                            <div className="np-fact-text">
                              <span className="np-fact-label">{it.label}:</span> {it.value}
                            </div>
                            <button className="np-icon-btn" onClick={() => toast("Редактирование будет добавлено позже.")} aria-label="Меню">⋯</button>
                          </div>
                          <div className="np-fact-meta">
                            <span className="np-source-badge">📄 1 источник</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
            <ul className="np-fact-list">
              {area.facts.map((f, i) => (
                <li key={i} className="np-fact">
                  <div className="np-fact-row">
                    <div className="np-fact-text">{f.text}</div>
                    <button className="np-icon-btn" onClick={() => toast("Редактирование будет добавлено позже.")} aria-label="Меню">⋯</button>
                  </div>
                  <div className="np-fact-meta">
                    <span className="np-source-badge" onClick={() => toast("Переход к источнику будет добавлен позже")}>📄 1 источник</span>
                    {f.date !== "—" && <span>· обновлено {f.date}</span>}
                  </div>
                </li>
              ))}
            </ul>
            )}
          </section>

          <section className="np-area-section">
            <h3>Источники <span className="np-muted">· {area.sourcesDetailed.length}</span></h3>
            <ul className="np-source-list">
              {area.sourcesDetailed.map((s, i) => (
                <li key={i} className="np-source-item" onClick={() => toast("Переход к источнику будет добавлен позже")}>
                  <span className="np-source-type">{s.type}</span>
                  <span className="np-source-name">{s.name}</span>
                  <span className="np-source-go">→</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="np-area-right">
          <section className="np-area-side-card">
            <h4>Связь с рисками</h4>
            <div className="np-area-side-row">
              <span>Рисков</span>
              <strong>{area.riskCount ?? area.risks.length}</strong>
            </div>
            <div className="np-area-side-meta">↑ {area.riskDelta ?? "+1 за месяц"}</div>
          </section>

          <section className="np-area-side-card">
            <h4>Влияние на анализ</h4>
            {(area.influence ?? [{ label: "Оценка рисков", value: 10 }, { label: "AI-рекомендации", value: 65 }]).map((it, i) => (
              <div key={i} className="np-area-side-row"><span>{it.label}</span><strong>{it.value}</strong></div>
            ))}
          </section>

          <section className="np-area-side-card np-area-improve">
            <h4>Улучшить знания</h4>
            <ul className="np-area-improve-list">
              {area.gaps.slice(0, 4).map((g, i) => (
                <li key={i} onClick={() => toast("Можно добавить через чат Норма.")}>{g}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <button
        className="np-area-fab"
        onClick={() => {
          if (onOpenChat) onOpenChat(`Хочу дополнить знания в разделе ${area.title}`);
          else toast("Сценарий дополнения знаний будет реализован через чат Норма.");
        }}
      >
        ✨ Дополнить знания
      </button>
    </div>
  );
}

const IMPROVE_ITEMS: { title: string; why: string; gain: number; importance: "Высокая" | "Средняя" }[] = [
  { title: "Оргструктура и владельцы процессов", why: "Поможет связывать риски, инциденты и меры с ответственными.", gain: 7, importance: "Высокая" },
  { title: "Финансовая отчётность", why: "Нужна для оценки финансовой устойчивости и кредитных рисков.", gain: 6, importance: "Высокая" },
  { title: "Карта ИТ-систем", why: "Поможет видеть технологические зависимости и критичные сервисы.", gain: 8, importance: "Высокая" },
  { title: "Список ключевых контрагентов", why: "Помогает выявлять концентрацию поставщиков и внешние зависимости.", gain: 5, importance: "Средняя" },
  { title: "Описание бизнес-модели", why: "Поможет понять критичные продукты, каналы продаж и зависимость от выручки.", gain: 4, importance: "Средняя" },
];

function ImproveDrawer({ onClose, onTransfer, toast }: { onClose: () => void; onTransfer: () => void; toast: (m: string) => void }) {
  return (
    <div className="np-drawer-backdrop" onClick={onClose}>
      <aside className="np-drawer np-improve-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="np-drawer-head">
          <div>
            <div className="np-drawer-eyebrow">Индекс знания · 64%</div>
            <h3 className="np-drawer-title">Как улучшить профиль</h3>
          </div>
          <button className="np-icon-btn" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="np-drawer-body">
          <ul className="np-improve-list">
            {IMPROVE_ITEMS.map((it, i) => (
              <li key={i} className="np-improve-item">
                <div className="np-improve-rank">{i + 1}</div>
                <div className="np-improve-main">
                  <div className="np-improve-title">{it.title}</div>
                  <div className="np-improve-why">{it.why}</div>
                  <div className="np-improve-meta">
                    <span className={`np-improve-badge ${it.importance === "Высокая" ? "high" : "mid"}`}>Важность: {it.importance}</span>
                    <span className="np-improve-gain">+{it.gain}% к индексу</span>
                  </div>
                </div>
                <button className="np-btn np-btn-primary np-improve-cta" onClick={() => toast("Добавление знаний будет реализовано через чат Норма.")}>Добавить знания</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="np-drawer-foot">
          <button className="np-btn np-btn-primary" style={{ flex: 1 }} onClick={onTransfer}>Передать новые знания Норму</button>
        </div>
      </aside>
    </div>
  );
}

function ProfileTab({ onOpenChat }: { onOpenChat?: (q: string) => void }) {
  const [areas, setAreas] = useState<Area[]>(AREAS_INITIAL);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [improveOpen, setImproveOpen] = useState(false);
  const active = activeId ? areas.find((a) => a.id === activeId) ?? null : null;

  const handleAddFact = (id: string) => {
    setAreas((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              percent: Math.min(100, a.percent + 3),
              facts: [
                ...a.facts,
                {
                  text: "Карта ИТ-систем ожидается от ИТ-дирекции.",
                  source: "Запрос знания от Норма",
                  date: "сегодня",
                },
              ],
            }
          : a,
      ),
    );
    setToast("Добавлено знание: карта ИТ-систем ожидается от ИТ-дирекции");
  };

  if (active) {
    return (
      <>
        <AreaPage
          area={active}
          areas={areas}
          onSelect={setActiveId}
          onBack={() => setActiveId(null)}
          onAddFact={() => handleAddFact(active.id)}
          toast={setToast}
          onOpenChat={onOpenChat}
        />
        {toast && <KbToast message={toast} onDone={() => setToast(null)} />}
      </>
    );
  }

  return (
    <>
      <div className="np-kb-top">
        <section className="np-kb-summary np-kb-summary-solo">
          <div className="np-kb-summary-head">
            <div className="np-kb-summary-eyebrow">Как Норм понимает компанию</div>
            <h3>Аналитический профиль компании для оценки рисков</h3>
            <p>
              Я собираю аналитический профиль компании из внутренних документов, открытых
              источников и знаний, которые ты передаёшь в чате. Такой профиль помогает не просто
              хранить факты, а понимать, где у компании могут возникать операционные,
              технологические, финансовые и регуляторные риски.
            </p>
            <p className="np-kb-summary-extra">
              Сейчас лучше всего покрыты общая информация, продукты и регуляторные сигналы.
              Слабее всего — собственники, финансы и контрагенты.
            </p>
          </div>
        </section>
        <button className="np-index-widget" onClick={() => setImproveOpen(true)} aria-label="Открыть улучшение профиля">
          <Ring percent={INDEX_PERCENT} size={88} stroke={8} />
          <div className="np-index-widget-text">
            <div className="np-index-widget-title">Индекс знания</div>
            <div className="np-index-widget-sub">Показывает, насколько полно Норм понимает компанию для анализа рисков.</div>
            <div className="np-index-widget-meta">3 области можно улучшить</div>
          </div>
        </button>
      </div>

      <section className="np-kb-grid">
        {areas.map((a) => {
          const s = statusFromPercent(a.percent);
          return (
            <article
              key={a.id}
              className="np-kb-card np-kb-card-clickable"
              onClick={() => setActiveId(a.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") setActiveId(a.id); }}
            >
              <div className="np-kb-card-top">
                <div className="np-kb-card-title">
                  <h4>{a.title}</h4>
                  <span className={statusClass(s)}>{STATUS_LABEL[s]}</span>
                </div>
                <Ring percent={a.percent} size={56} stroke={6} />
              </div>
              <p className="np-kb-card-insight">{a.insight}</p>
              <div className="np-kb-card-foot">
                <span className="np-muted">{a.sourcesDetailed.length} источников · {a.facts.length} знаний</span>
              </div>
            </article>
          );
        })}
      </section>

      {improveOpen && (
        <ImproveDrawer
          onClose={() => setImproveOpen(false)}
          onTransfer={() => {
            setImproveOpen(false);
            if (onOpenChat) onOpenChat("Хочу передать новые знания в профиль компании");
            else setToast("Сценарий добавления знаний будет реализован через чат Норма.");
          }}
          toast={setToast}
        />
      )}
      {toast && <KbToast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}

function PlaceholderTab({ title, text }: { title: string; text: string }) {
  return (
    <div className="np-kb-placeholder">
      <h3>{title}</h3>
      <p className="np-muted">{text}</p>
    </div>
  );
}

export default function KnowledgeBase({ onOpenChat }: { onOpenChat?: (q: string) => void }) {
  const [tab, setTab] = useState<"profile" | "docs" | "method">("profile");
  return (
    <div className="np-kb">
      <header className="np-kb-head">
        <h1>База знаний Норма AI</h1>
        <div className="np-kb-tabs">
          <button className={`np-kb-tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>Профиль компании</button>
          <button className={`np-kb-tab ${tab === "docs" ? "active" : ""}`} onClick={() => setTab("docs")}>Документы компании</button>
          <button className={`np-kb-tab ${tab === "method" ? "active" : ""}`} onClick={() => setTab("method")}>Методология</button>
        </div>
      </header>

      {tab === "profile" && <ProfileTab onOpenChat={onOpenChat} />}
      {tab === "docs" && <PlaceholderTab title="Документы компании" text="Здесь будут категории документов: индикатор зрелости, стандарты, оргструктура, финансовое состояние, аудиты и проверки, прочее." />}
      {tab === "method" && <PlaceholderTab title="Методология" text="Здесь будет описание методологии: политики, методики, регламенты и рекомендации, которыми пользуется Норм." />}
    </div>
  );
}