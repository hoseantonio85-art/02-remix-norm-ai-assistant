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
}

const AREAS_INITIAL: Area[] = [
  {
    id: "general",
    title: "Общая информация",
    percent: 82,
    insight: "Понимаю профиль, отрасль и основные направления бизнеса.",
    summary:
      "ООО «СамИздат Инкорпорейтед» — производитель AI-рекомендательных продуктов для e-commerce и внутренних корпоративных систем.",
    sources: 6,
    knowledge: [
      "Юридическое лицо и ИНН подтверждены уставом.",
      "Основная отрасль — разработка ПО и AI-сервисы.",
      "Регион присутствия — РФ, головной офис в Москве.",
    ],
    sourceList: ["Устав компании.pdf", "Сайт компании", "Регистрационная выписка.pdf"],
    usedIn: ["Профиль компании в риск-карте", "Контекст для AI-рекомендаций"],
    why: "Основные регистрационные и отраслевые данные подтверждены документами и публичными источниками.",
    aiSummary:
      "Я уверенно понимаю, что это российская технологическая компания, разрабатывающая AI-продукты. Знаю юридическое лицо, отрасль, регион и общий профиль. Этого достаточно, чтобы корректно строить профиль компании и контекст для большинства рисков.",
    facts: [
      { text: "Юридическое лицо: ООО «СамИздат Инкорпорейтед», ИНН подтверждён.", source: "Устав компании.pdf", date: "12.01.2026" },
      { text: "Основная отрасль — разработка ПО и AI-сервисы.", source: "Сайт компании", date: "03.02.2026" },
      { text: "Головной офис — Москва, присутствие в РФ.", source: "Регистрационная выписка.pdf", date: "10.01.2026" },
      { text: "Год основания — 2018.", source: "Сайт компании", date: "03.02.2026" },
    ],
    risks: ["Репутационные риски бренда", "Регуляторные риски в РФ"],
    gaps: ["Стратегия развития на 3 года", "Публичные планы по выходу на новые рынки"],
    sourcesDetailed: [
      { name: "Устав компании.pdf", type: "PDF" },
      { name: "Сайт компании", type: "Веб-источник" },
      { name: "Регистрационная выписка.pdf", type: "PDF" },
    ],
  },
  {
    id: "products",
    title: "Продукты и рынок",
    percent: 68,
    insight: "Знаю основные продукты, рынок описан фрагментарно.",
    summary: "Линейка из 3 продуктов, ключевой — AI-рекомендации для ритейла.",
    sources: 5,
    knowledge: [
      "AI-рекомендации товаров — основной продукт.",
      "Внутренний AI-ассистент для сотрудников.",
      "Аналитический модуль для партнёров.",
    ],
    sourceList: ["Сайт компании", "Отчёт внутреннего аудита 2026.pdf"],
    usedIn: ["Бизнес-критичность продуктов", "Оценка рыночных рисков"],
    why: "Продукты описаны на сайте и в отчёте аудита, но нет детальной информации о доле рынка и конкурентах.",
    aiSummary:
      "Я понимаю продуктовую линейку и основной фокус на AI-рекомендациях для ритейла. Знаю про внутреннего ассистента и аналитический модуль для партнёров. Меньше данных по сегментам клиентов, доле рынка и прямым конкурентам.",
    facts: [
      { text: "AI-рекомендации товаров — ключевой продукт компании.", source: "Сайт компании", date: "03.02.2026" },
      { text: "Внутренний AI-ассистент используется сотрудниками.", source: "Отчёт внутреннего аудита 2026.pdf", date: "20.01.2026" },
      { text: "Аналитический модуль поставляется партнёрам по API.", source: "Сайт компании", date: "03.02.2026" },
      { text: "Основной рынок сбыта — e-commerce в РФ.", source: "Отчёт внутреннего аудита 2026.pdf", date: "20.01.2026" },
    ],
    risks: ["Концентрация выручки на одном продукте", "Рыночные риски в e-commerce"],
    gaps: ["Доли рынка и конкурентный анализ", "Карта клиентских сегментов"],
    sourcesDetailed: [
      { name: "Сайт компании", type: "Веб-источник" },
      { name: "Отчёт внутреннего аудита 2026.pdf", type: "PDF" },
    ],
  },
  {
    id: "it",
    title: "ИТ и кибербезопасность",
    percent: 44,
    insight: "Есть общее представление, не хватает карты ИТ-систем.",
    summary: "Известна часть инфраструктуры и ключевые зависимости от GPU.",
    sources: 4,
    knowledge: [
      "GPU-ресурсы загружены до 90% в пиковые периоды.",
      "Закупка новых мощностей запущена в Q1 2026.",
      "За ИТ отвечает выделенный блок.",
    ],
    sourceList: ["Политика кибербезопасности для филиалов.docx", "Акт проверки ИБ №14.pdf"],
    usedIn: ["Технические риски", "Риски доступности сервисов"],
    why: "Есть отдельные документы по ИБ и инфраструктуре, но нет карты ИТ-систем, SLA и владельцев сервисов.",
    aiSummary:
      "Я знаю, что компания зависит от GPU-инфраструктуры для AI-рекомендаций. В пиковые периоды ресурсы загружены до 90%, поэтому задержка закупки новых мощностей может влиять на стабильность продукта. При этом карта ИТ-систем, владельцы сервисов и SLA пока не описаны.",
    facts: [
      { text: "GPU-ресурсы загружены до 90% в пиковые периоды.", source: "Отчёт внутреннего аудита 2026.pdf", date: "20.01.2026" },
      { text: "Закупка новых мощностей инициирована в Q1 2026.", source: "Отчёт внутреннего аудита 2026.pdf", date: "20.01.2026" },
      { text: "За направление отвечает блок ИТ и кибербезопасности.", source: "ФИО директора и прочая инфа.pdf", date: "15.01.2026" },
      { text: "Политика кибербезопасности описана для филиалов.", source: "Политика кибербезопасности для филиалов.docx", date: "10.10.2025" },
      { text: "Есть акт проверки ИБ-защищённости филиала №14 от 05.2024.", source: "Акт проверки ИБ-защищённости филиала №14.pdf", date: "12.05.2024" },
    ],
    risks: [
      "Риск недоступности AI-рекомендаций",
      "Риск срыва сроков запуска продукта",
      "Риск зависимости от внешних поставщиков оборудования",
      "Риск слабой ИБ-защищённости филиалов",
    ],
    gaps: [
      "Карта ИТ-систем",
      "Владельцы ключевых сервисов",
      "SLA по критичным системам",
      "Список поставщиков оборудования",
      "План восстановления после сбоев",
    ],
    sourcesDetailed: [
      { name: "Отчёт внутреннего аудита 2026.pdf", type: "PDF" },
      { name: "Политика кибербезопасности для филиалов.docx", type: "DOCX" },
      { name: "Акт проверки ИБ-защищённости филиала №14.pdf", type: "PDF" },
    ],
  },
  {
    id: "structure",
    title: "Структура и управление",
    percent: 38,
    insight: "Знаю CEO и часть руководителей, оргструктура неполная.",
    summary: "Генеральный директор — Семён Петрович Колбасников. Полная оргструктура отсутствует.",
    sources: 2,
    knowledge: [
      "CEO: Семён Петрович Колбасников.",
      "Выделены блоки ИТ и операционных рисков.",
    ],
    sourceList: ["ФИО директора и прочая инфа.pdf"],
    usedIn: ["Назначение владельцев рисков", "Эскалация инцидентов"],
    why: "Известен CEO и пара блоков, но нет полной оргструктуры, владельцев направлений и матрицы ответственности.",
    aiSummary:
      "Я знаю генерального директора и понимаю, что выделены блоки ИТ и операционных рисков. При этом полная оргструктура, владельцы ключевых направлений и матрица ответственности не описаны — это мешает корректно назначать владельцев рисков.",
    facts: [
      { text: "Генеральный директор — Семён Петрович Колбасников.", source: "ФИО директора и прочая инфа.pdf", date: "15.01.2026" },
      { text: "Выделен блок ИТ и кибербезопасности.", source: "ФИО директора и прочая инфа.pdf", date: "15.01.2026" },
      { text: "Выделен блок операционных рисков.", source: "ФИО директора и прочая инфа.pdf", date: "15.01.2026" },
    ],
    risks: ["Единая точка отказа в управлении", "Размытая ответственность за инциденты"],
    gaps: ["Полная оргструктура", "Владельцы ключевых направлений", "Матрица RACI"],
    sourcesDetailed: [
      { name: "ФИО директора и прочая инфа.pdf", type: "PDF" },
    ],
  },
  {
    id: "finance",
    title: "Финансы и контрагенты",
    percent: 25,
    insight: "Данных мало — нет финансовых отчётов и списка контрагентов.",
    summary: "Финансовые показатели и пул контрагентов почти не покрыты документами.",
    sources: 1,
    knowledge: [
      "Есть только косвенные упоминания выручки в отчёте аудита.",
    ],
    sourceList: ["Отчёт внутреннего аудита 2026.pdf"],
    usedIn: ["Кредитные риски", "Риски концентрации поставщиков"],
    why: "Финансовая отчётность и список контрагентов не загружены — есть только косвенные упоминания.",
    aiSummary:
      "Я почти не знаю финансовое состояние компании. В отчёте аудита есть только косвенные упоминания выручки, нет официальной отчётности, нет перечня контрагентов и поставщиков. Это сильно ограничивает работу с финансовыми и кредитными рисками.",
    facts: [
      { text: "Косвенное упоминание выручки в отчёте внутреннего аудита.", source: "Отчёт внутреннего аудита 2026.pdf", date: "20.01.2026" },
    ],
    risks: ["Кредитные риски", "Концентрация поставщиков", "Зависимость от ключевых клиентов"],
    gaps: [
      "Финансовая отчётность за 2024–2025",
      "Список ключевых контрагентов",
      "Структура выручки по продуктам",
      "Дебиторская и кредиторская задолженность",
    ],
    sourcesDetailed: [
      { name: "Отчёт внутреннего аудита 2026.pdf", type: "PDF" },
    ],
  },
  {
    id: "audits",
    title: "Аудиты и проверки",
    percent: 57,
    insight: "Покрыты внутренние проверки, внешних аудитов почти нет.",
    summary: "Известны последние внутренние аудиты по ИБ и операционным рискам.",
    sources: 5,
    knowledge: [
      "Акт проверки ИБ-защищённости филиала №14 (05.2024).",
      "Чек-лист аудита рисков поставщика v.1.2.",
      "Описание инцидента с DDoS-атакой 12.05.2024.",
    ],
    sourceList: [
      "Акт проверки ИБ-защищённости филиала №14.pdf",
      "Чек-лист аудита рисков поставщика v.1.2.xlsx",
      "Описание инцидента с DDoS-атакой.pdf",
    ],
    usedIn: ["Операционные риски", "Риски поставщиков"],
    why: "Внутренние аудиты загружены, внешних независимых проверок и сертификаций не хватает.",
    aiSummary:
      "У меня есть данные по внутренним аудитам ИБ и операционных рисков, а также описание инцидента с DDoS-атакой. Внешних независимых аудитов и сертификаций (например, ISO/SOC) пока нет — это ограничивает оценку зрелости процессов.",
    facts: [
      { text: "Акт проверки ИБ-защищённости филиала №14 от 05.2024.", source: "Акт проверки ИБ-защищённости филиала №14.pdf", date: "12.05.2024" },
      { text: "Чек-лист аудита рисков поставщика версии 1.2.", source: "Чек-лист аудита рисков поставщика v.1.2.xlsx", date: "08.11.2025" },
      { text: "Инцидент DDoS-атаки 12.05.2024 задокументирован.", source: "Описание инцидента с DDoS-атакой.pdf", date: "14.05.2024" },
    ],
    risks: ["Операционные риски", "Риски поставщиков", "Риски доступности сервисов"],
    gaps: ["Внешний аудит ИБ", "Сертификация ISO/SOC", "План регулярных проверок"],
    sourcesDetailed: [
      { name: "Акт проверки ИБ-защищённости филиала №14.pdf", type: "PDF" },
      { name: "Чек-лист аудита рисков поставщика v.1.2.xlsx", type: "XLSX" },
      { name: "Описание инцидента с DDoS-атакой.pdf", type: "PDF" },
    ],
  },
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
              <h3>Ключевые знания</h3>
              <span className="np-muted">{area.facts.length}</span>
            </div>
            <ul className="np-fact-list">
              {area.facts.map((f, i) => (
                <li key={i} className="np-fact">
                  <div className="np-fact-row">
                    <div className="np-fact-text">{f.text}</div>
                    <button className="np-icon-btn" onClick={() => toast("Действия со знанием будут добавлены позже")} aria-label="Меню">⋯</button>
                  </div>
                  <div className="np-fact-meta">
                    <span className="np-source-badge" onClick={() => toast("Переход к источнику будет добавлен позже")}>📄 {f.source}</span>
                    <span>· обновлено {f.date}</span>
                  </div>
                </li>
              ))}
            </ul>
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
              <strong>{area.risks.length}</strong>
            </div>
            <div className="np-area-side-meta">↑ +1 за месяц</div>
          </section>

          <section className="np-area-side-card">
            <h4>Влияние на анализ</h4>
            <div className="np-area-side-row"><span>Оценка рисков</span><strong>10</strong></div>
            <div className="np-area-side-row"><span>AI рекомендации</span><strong>65</strong></div>
          </section>

          <section className="np-area-side-card np-area-improve">
            <h4>Улучшить знания</h4>
            <ul className="np-area-improve-list">
              {area.gaps.slice(0, 4).map((g, i) => (
                <li key={i} onClick={() => toast("Можно добавить через чат Норма")}>{g}</li>
              ))}
            </ul>
            <button className="np-btn" style={{ marginTop: 10 }} onClick={onAddFact}>+ Добавить знание</button>
          </section>
        </aside>
      </div>

      <button
        className="np-area-fab"
        onClick={() => onOpenChat && onOpenChat(`Хочу дополнить знания в разделе ${area.title}`)}
      >
        ✨ Дополнить знания
      </button>
    </div>
  );
}

const IMPROVE_ITEMS: { title: string; why: string; gain: number; importance: "Высокая" | "Средняя" }[] = [
  { title: "Карта ИТ-систем", why: "Важно для оценки технических и операционных рисков.", gain: 8, importance: "Высокая" },
  { title: "Оргструктура и владельцы процессов", why: "Поможет связывать риски, инциденты и меры с ответственными.", gain: 7, importance: "Высокая" },
  { title: "Финансовая отчётность", why: "Нужна для оценки кредитных и финансовых рисков.", gain: 6, importance: "Средняя" },
  { title: "Список ключевых контрагентов", why: "Поможет выявлять зависимости и концентрацию поставщиков.", gain: 5, importance: "Средняя" },
  { title: "Описание AI-продукта", why: "Поможет точнее связывать продуктовые и ИТ-риски.", gain: 4, importance: "Средняя" },
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
                <button className="np-btn np-btn-primary np-improve-cta" onClick={() => toast("Сценарий добавления знаний будет реализован через чат")}>Добавить знания</button>
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
            <h3>ООО «СамИздат Инкорпорейтед» — разработчик AI-рекомендательных продуктов</h3>
            <p>
              Я уверенно понимаю профиль компании и её основные продукты. Хорошо ориентируюсь в
              аудитах и инфраструктуре, но мало знаю про финансы, контрагентов и полную
              оргструктуру. С этим могу заметно точнее работать с рисками.
            </p>
          </div>
        </section>
        <button className="np-index-widget" onClick={() => setImproveOpen(true)} aria-label="Открыть улучшение профиля">
          <Ring percent={INDEX_PERCENT} size={88} stroke={8} />
          <div className="np-index-widget-text">
            <div className="np-index-widget-title">Индекс знания</div>
            <div className="np-index-widget-sub">Показывает, насколько хорошо Норм понимает компанию</div>
            <div className="np-index-widget-meta">+12% за месяц · 3 области можно улучшить</div>
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

      <section className="np-kb-block np-kb-add">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Как улучшить профиль</h3>
          <button className="np-fact-link" onClick={() => setImproveOpen(true)}>Смотреть все →</button>
        </div>
        <ul className="np-sum-list">
          {IMPROVE_ITEMS.slice(0, 3).map((it, i) => (
            <li key={i}><strong>{it.title}</strong> — {it.why} <span className="np-muted">(+{it.gain}%)</span></li>
          ))}
        </ul>
      </section>

      {improveOpen && (
        <ImproveDrawer
          onClose={() => setImproveOpen(false)}
          onTransfer={() => {
            setImproveOpen(false);
            if (onOpenChat) onOpenChat("Хочу передать новые знания в профиль компании");
            else setToast("Откройте чат ассистента");
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