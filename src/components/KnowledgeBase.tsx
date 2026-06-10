import { useState } from "react";

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
}

const AREAS: Area[] = [
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

function AreaDrawer({ area, onClose }: { area: Area; onClose: () => void }) {
  const status = statusFromPercent(area.percent);
  return (
    <div className="np-drawer-backdrop" onClick={onClose}>
      <aside className="np-drawer" onClick={(e) => e.stopPropagation()}>
        <header className="np-drawer-head">
          <div>
            <div className="np-drawer-eyebrow">Область знания</div>
            <h3 className="np-drawer-title">{area.title}</h3>
          </div>
          <button className="np-icon-btn" onClick={onClose} aria-label="Закрыть">✕</button>
        </header>

        <div className="np-drawer-body">
          <div className="np-drawer-top">
            <Ring percent={area.percent} size={72} stroke={7} />
            <div>
              <span className={statusClass(status)}>{STATUS_LABEL[status]}</span>
              <p className="np-drawer-summary">{area.summary}</p>
            </div>
          </div>

          <section className="np-drawer-section">
            <h4>Ключевые знания</h4>
            <ul className="np-drawer-list">
              {area.knowledge.map((k, i) => <li key={i}>{k}</li>)}
            </ul>
          </section>

          <section className="np-drawer-section">
            <h4>Источники <span className="np-muted">· {area.sources}</span></h4>
            <ul className="np-drawer-list">
              {area.sourceList.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </section>

          <section className="np-drawer-section">
            <h4>Где используется в рисках</h4>
            <ul className="np-drawer-list">
              {area.usedIn.map((u, i) => <li key={i}>{u}</li>)}
            </ul>
          </section>
        </div>

        <footer className="np-drawer-foot">
          <button className="np-btn">Изменить</button>
          <button className="np-btn">Добавить знание</button>
          <button className="np-btn np-btn-danger">Удалить</button>
        </footer>
      </aside>
    </div>
  );
}

function ProfileTab() {
  const [active, setActive] = useState<Area | null>(null);
  return (
    <>
      <section className="np-kb-summary">
        <div className="np-kb-summary-head">
          <div className="np-kb-summary-eyebrow">Как Норм понимает компанию</div>
          <h3>ООО «СамИздат Инкорпорейтед» — разработчик AI-рекомендательных продуктов</h3>
          <p>
            Я уверенно понимаю профиль компании и её основные продукты. Хорошо ориентируюсь в
            аудитах и инфраструктуре, но мало знаю про финансы, контрагентов и полную
            оргструктуру. С этим могу заметно точнее работать с рисками.
          </p>
        </div>
        <div className="np-kb-index">
          <Ring percent={INDEX_PERCENT} size={96} stroke={8} />
          <div>
            <div className="np-kb-index-label">Индекс знания компании</div>
            <div className="np-kb-index-note">Растёт, когда ты добавляешь документы и знания</div>
          </div>
        </div>
      </section>

      <section className="np-kb-grid">
        {AREAS.map((a) => {
          const s = statusFromPercent(a.percent);
          return (
            <article key={a.id} className="np-kb-card">
              <div className="np-kb-card-head">
                <Ring percent={a.percent} size={56} stroke={6} />
                <div className="np-kb-card-title">
                  <h4>{a.title}</h4>
                  <span className={statusClass(s)}>{STATUS_LABEL[s]}</span>
                </div>
              </div>
              <p className="np-kb-card-insight">{a.insight}</p>
              <div className="np-kb-card-foot">
                <span className="np-muted">{a.sources} источников · {a.knowledge.length} знаний</span>
                <button className="np-btn np-btn-open" onClick={() => setActive(a)}>Открыть</button>
              </div>
            </article>
          );
        })}
      </section>

      <div className="np-kb-row2">
        <section className="np-kb-block np-kb-risks">
          <h3>Что важно для рисков</h3>
          <ul className="np-sum-list">
            <li>GPU-инфраструктура — узкое место для AI-продуктов.</li>
            <li>Высокая концентрация знаний на CEO — единая точка отказа в управлении.</li>
            <li>Внутренние аудиты ИБ выявили слабые места в филиалах.</li>
          </ul>
        </section>
        <section className="np-kb-block np-kb-add">
          <h3>Что стоит добавить</h3>
          <ul className="np-sum-list">
            <li>Полная оргструктура и ключевые сотрудники.</li>
            <li>Финансовая отчётность и список контрагентов.</li>
            <li>Карта ИТ-систем и зависимостей.</li>
          </ul>
        </section>
      </div>

      {active && <AreaDrawer area={active} onClose={() => setActive(null)} />}
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

export default function KnowledgeBase() {
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

      {tab === "profile" && <ProfileTab />}
      {tab === "docs" && <PlaceholderTab title="Документы компании" text="Здесь будут категории документов: индикатор зрелости, стандарты, оргструктура, финансовое состояние, аудиты и проверки, прочее." />}
      {tab === "method" && <PlaceholderTab title="Методология" text="Здесь будет описание методологии: политики, методики, регламенты и рекомендации, которыми пользуется Норм." />}
    </div>
  );
}