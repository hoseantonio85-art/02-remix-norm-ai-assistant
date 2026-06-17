import { useEffect, useRef, useState } from "react";

type Status = "low" | "some" | "enough" | "good";
type FieldState = "known" | "partial" | "unknown" | "na";

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

interface BaseField {
  label: string;
  state: FieldState;
  value?: string;
  source?: string;
  date?: string;
}

interface FieldGroup {
  title: string;
  fields: BaseField[];
}

interface Area {
  id: string;
  title: string;
  percent: number;
  insight: string;
  why: string;
  aiSummary: string;
  sourcesDetailed: { name: string; type: string }[];
  groups: FieldGroup[];
  groupCoverage: { label: string; percent: number }[];
  missing: string[];
}

function f(label: string, state: FieldState, value?: string, source?: string, date?: string): BaseField {
  return { label, state, value, source, date };
}

const AREAS_INITIAL: Area[] = [
  {
    id: "general",
    title: "Общая информация",
    percent: 82,
    insight: "Базовый контекст: кто компания, где работает, в какой отрасли и какой масштаб учитывать при анализе рисков.",
    why: "Базовый контекст компании: кто она, где работает, в какой отрасли находится и какой масштаб деятельности нужно учитывать при анализе.",
    aiSummary: "Я уверенно понимаю профиль компании: знаю юридическое лицо, отрасль, регион присутствия и основные виды деятельности. Этого достаточно для корректного контекста большинства рисков.",
    sourcesDetailed: [
      { name: "Устав компании.pdf", type: "PDF" },
      { name: "Сайт компании", type: "Веб" },
      { name: "Регистрационная выписка.pdf", type: "PDF" },
    ],
    groups: [
      {
        title: "Идентификация компании",
        fields: [
          f("Сокращённое название", "known", "СамИздат", "Сайт компании", "03.02.2026"),
          f("Полное название", "known", "ООО «Сам Издат Инкорпорейтед»", "Устав компании.pdf", "12.01.2026"),
          f("ИНН", "known", "772335154264", "Регистрационная выписка.pdf", "10.01.2026"),
          f("ОГРН", "known", "1177847261602", "Регистрационная выписка.pdf", "10.01.2026"),
          f("Страна регистрации", "known", "Россия", "Регистрационная выписка.pdf", "10.01.2026"),
        ],
      },
      {
        title: "Профиль деятельности",
        fields: [
          f("Отрасль", "known", "Разработка ПО и AI-продуктов", "Сайт компании", "03.02.2026"),
          f("Краткое описание", "known", "AI-рекомендации для e-commerce и корпоративных систем.", "Сайт компании", "03.02.2026"),
        ],
      },
      {
        title: "География и масштаб",
        fields: [
          f("Основной регион", "known", "Россия", "Сайт компании", "03.02.2026"),
          f("Головной офис", "known", "Москва", "Устав компании.pdf", "12.01.2026"),
          f("Численность", "unknown"),
          f("Размер компании", "partial", "Средняя компания", "Оценка Норма", "—"),
        ],
      },
    ],
    groupCoverage: [
      { label: "Регистрационные данные", percent: 100 },
      { label: "Деятельность", percent: 100 },
      { label: "География", percent: 75 },
      { label: "Масштаб", percent: 50 },
    ],
    missing: ["точной численности сотрудников", "полного списка регионов присутствия"],
  },
  {
    id: "structure",
    title: "Структура и управление",
    percent: 46,
    insight: "Помогает понимать, кто принимает решения, кто отвечает за критичные направления и где есть единые точки отказа.",
    why: "Структура и владельцы процессов помогают корректно назначать ответственных за риски и инциденты.",
    aiSummary: "Я знаю генерального директора и понимаю наличие блоков ИТ и операционных рисков. Полной оргструктуры и матрицы ответственности пока нет.",
    sourcesDetailed: [
      { name: "ФИО директора и прочая инфа.pdf", type: "PDF" },
      { name: "Внутренний регламент.docx", type: "DOCX" },
    ],
    groups: [
      {
        title: "Руководство",
        fields: [
          f("Руководитель / исп. орган", "known", "Семён Петрович Колбасников", "ФИО директора и прочая инфа.pdf", "15.01.2026"),
          f("Модель управления", "partial", "Единоличный исполнительный орган", "Внутренний регламент.docx", "20.01.2026"),
        ],
      },
      {
        title: "Подразделения и ответственность",
        fields: [
          f("Основные подразделения", "partial", "Выделены ИТ и операционные риски", "Внутренний регламент.docx", "20.01.2026"),
          f("Ответственные за критичные направления", "unknown"),
          f("Зависимость от ключевых лиц", "unknown"),
        ],
      },
    ],
    groupCoverage: [
      { label: "Руководство", percent: 80 },
      { label: "Подразделения", percent: 40 },
      { label: "Зависимости от лиц", percent: 0 },
    ],
    missing: ["полной оргструктуры", "матрицы ответственности (RACI)", "карты зависимости от ключевых лиц"],
  },
  {
    id: "owners",
    title: "Собственники и связи",
    percent: 28,
    insight: "Раскрывает, кто реально контролирует компанию, есть ли связанные структуры и где могут быть конфликты интересов.",
    why: "Помогает оценивать риски концентрации контроля, скрытых связанных лиц и конфликтов интересов.",
    aiSummary: "О собственниках и связанных лицах данных пока очень мало. Это ограничивает оценку рисков концентрации контроля и конфликтов интересов.",
    sourcesDetailed: [{ name: "Регистрационная выписка.pdf", type: "PDF" }],
    groups: [
      {
        title: "Контроль и владение",
        fields: [
          f("Контролирующий собственник", "partial", "Упоминание единственного бенефициара", "Регистрационная выписка.pdf", "10.01.2026"),
          f("Основные владельцы и доли", "unknown"),
          f("Дочерние и зависимые общества", "unknown"),
        ],
      },
      {
        title: "Связанные стороны",
        fields: [
          f("Ключевые связанные организации", "unknown"),
          f("Существенные сделки со связанными лицами", "unknown"),
        ],
      },
    ],
    groupCoverage: [
      { label: "Контроль и владение", percent: 35 },
      { label: "Связанные стороны", percent: 0 },
    ],
    missing: ["полного списка собственников и долей", "карты связанных компаний", "декларации конфликтов интересов"],
  },
  {
    id: "products",
    title: "Продукты и бизнес-модель",
    percent: 68,
    insight: "Показывает, на чём компания зарабатывает, какие продукты критичны и где сбой сильнее всего ударит по бизнесу.",
    why: "Эта область объясняет, как устроена выручка, какие продукты ключевые и где сбой ударит по бизнесу сильнее всего.",
    aiSummary: "Я понимаю продуктовую линейку и фокус на AI-рекомендациях для ритейла. Знаю про внутреннего ассистента и аналитический модуль для партнёров.",
    sourcesDetailed: [
      { name: "Сайт компании", type: "Веб" },
      { name: "Отчёт внутреннего аудита 2026.pdf", type: "PDF" },
    ],
    groups: [
      {
        title: "Продукты",
        fields: [
          f("Основные продукты", "known", "AI-рекомендации, AI-ассистент, аналитический модуль", "Сайт компании", "03.02.2026"),
          f("Критичный продукт", "known", "AI-рекомендации товаров", "Отчёт внутреннего аудита 2026.pdf", "20.01.2026"),
        ],
      },
      {
        title: "Бизнес-модель",
        fields: [
          f("Клиентские сегменты", "partial", "E-commerce РФ, корпоративные клиенты", "Сайт компании", "03.02.2026"),
          f("Модель получения дохода", "partial", "Лицензии + API", "Сайт компании", "03.02.2026"),
          f("Основные каналы продаж", "known", "Прямые корпоративные сделки", "Отчёт внутреннего аудита 2026.pdf", "20.01.2026"),
        ],
      },
    ],
    groupCoverage: [
      { label: "Продукты", percent: 100 },
      { label: "Бизнес-модель", percent: 60 },
    ],
    missing: ["долей рынка и конкурентного анализа", "unit-экономики по продуктам"],
  },
  {
    id: "ops",
    title: "Операционная деятельность",
    percent: 41,
    insight: "Помогает понять ключевые процессы, поставщиков, клиентов, каналы продаж и точки, где может нарушиться работа.",
    why: "Операционные процессы и зависимости показывают, где чаще всего возникают сбои и какие площадки критичны.",
    aiSummary: "Я частично понимаю операционные процессы: знаю каналы продаж и часть ключевых поставщиков. Карты процессов и SLA пока нет.",
    sourcesDetailed: [
      { name: "Отчёт внутреннего аудита 2026.pdf", type: "PDF" },
      { name: "Внутренний регламент.docx", type: "DOCX" },
    ],
    groups: [
      {
        title: "Процессы и площадки",
        fields: [
          f("Ключевые бизнес-процессы", "unknown"),
          f("Цепочка создания ценности", "unknown"),
          f("Критичные площадки", "partial", "Головной офис в Москве", "Внутренний регламент.docx", "20.01.2026"),
        ],
      },
      {
        title: "Зависимости и особенности",
        fields: [
          f("Основные операционные зависимости", "partial", "Зависимость от одного вендора оборудования", "Отчёт внутреннего аудита 2026.pdf", "20.01.2026"),
          f("Особенности работы", "known", "Непрерывный режим работы AI-сервисов", "Отчёт внутреннего аудита 2026.pdf", "20.01.2026"),
        ],
      },
    ],
    groupCoverage: [
      { label: "Процессы", percent: 20 },
      { label: "Площадки", percent: 50 },
      { label: "Зависимости", percent: 55 },
    ],
    missing: ["карты операционных процессов", "списка ключевых поставщиков", "SLA с клиентами"],
  },
  {
    id: "it",
    title: "ИТ, данные и технологии",
    percent: 54,
    insight: "Технологический фундамент: ИТ-системы, данные, кибербезопасность и зависимость от инфраструктуры.",
    why: "Технологический контур определяет устойчивость и восстановление при сбоях и инцидентах.",
    aiSummary: "Я знаю про зависимость от GPU-инфраструктуры и часть политик ИБ. Карта ИТ-систем, владельцы сервисов и SLA пока не описаны.",
    sourcesDetailed: [
      { name: "Отчёт внутреннего аудита 2026.pdf", type: "PDF" },
      { name: "Политика кибербезопасности для филиалов.docx", type: "DOCX" },
      { name: "Акт проверки ИБ-защищённости филиала №14.pdf", type: "PDF" },
    ],
    groups: [
      {
        title: "ИТ-системы и инфраструктура",
        fields: [
          f("Критичные ИТ-системы", "unknown"),
          f("Модель инфраструктуры", "partial", "GPU-кластеры, своя инфраструктура", "Отчёт внутреннего аудита 2026.pdf", "20.01.2026"),
        ],
      },
      {
        title: "Данные и владельцы",
        fields: [
          f("Типы обрабатываемых данных", "partial", "Клиентские поведенческие данные", "Политика кибербезопасности для филиалов.docx", "10.10.2025"),
          f("Владельцы систем и данных", "unknown"),
        ],
      },
      {
        title: "Устойчивость",
        fields: [
          f("Резервирование и восстановление", "partial", "План восстановления частично описан", "Акт проверки ИБ-защищённости филиала №14.pdf", "12.05.2024"),
        ],
      },
    ],
    groupCoverage: [
      { label: "ИТ-системы", percent: 30 },
      { label: "Данные", percent: 50 },
      { label: "Устойчивость", percent: 60 },
    ],
    missing: ["карты ИТ-систем", "владельцев ключевых сервисов", "плана восстановления после сбоев"],
  },
  {
    id: "finance",
    title: "Финансы и контрагенты",
    percent: 25,
    insight: "Помогает оценивать финансовую устойчивость, долговую нагрузку, концентрацию клиентов и поставщиков.",
    why: "Финансовое состояние и контрагенты определяют кредитные риски и риски концентрации.",
    aiSummary: "Я почти не знаю финансовое состояние компании. Есть только косвенные упоминания выручки, нет официальной отчётности и перечня контрагентов.",
    sourcesDetailed: [{ name: "Отчёт внутреннего аудита 2026.pdf", type: "PDF" }],
    groups: [
      {
        title: "Финансовый масштаб",
        fields: [
          f("Финансовый масштаб", "partial", "Средняя компания (оценка)", "Оценка Норма", "—"),
          f("Выручка", "unknown"),
          f("Прибыль / убыток", "unknown"),
          f("Долговая нагрузка", "unknown"),
        ],
      },
      {
        title: "Контрагенты",
        fields: [
          f("Ключевые клиенты и поставщики", "unknown"),
          f("Концентрация контрагентов", "unknown"),
        ],
      },
    ],
    groupCoverage: [
      { label: "Финансовый масштаб", percent: 35 },
      { label: "Контрагенты", percent: 0 },
    ],
    missing: ["финансовой отчётности за 2024–2025", "перечня ключевых контрагентов", "структуры выручки по продуктам"],
  },
  {
    id: "regulatory",
    title: "Регуляторика и риск-сигналы",
    percent: 57,
    insight: "Внешние сигналы — проверки, инциденты, регуляторные требования и судебные дела, указывающие на риски.",
    why: "Эта область собирает регуляторные сигналы и события, которые могут указывать на будущие риски.",
    aiSummary: "У меня есть данные по внутренним аудитам ИБ и инциденту с DDoS. Внешних аудитов и сертификаций пока нет.",
    sourcesDetailed: [
      { name: "Акт проверки ИБ-защищённости филиала №14.pdf", type: "PDF" },
      { name: "Чек-лист аудита рисков поставщика v.1.2.xlsx", type: "XLSX" },
      { name: "Описание инцидента с DDoS-атакой.pdf", type: "PDF" },
    ],
    groups: [
      {
        title: "Регуляторы и требования",
        fields: [
          f("Основные регуляторы", "partial", "ФСТЭК, Роскомнадзор (предположительно)", "Оценка Норма", "—"),
          f("Лицензии и разрешения", "unknown"),
          f("Ключевые обязательные требования", "partial", "Требования по защите ПДн", "Политика кибербезопасности для филиалов.docx", "10.10.2025"),
        ],
      },
      {
        title: "Аудиты и проверки",
        fields: [
          f("Последние аудиты", "known", "Акт проверки ИБ филиала №14", "Акт проверки ИБ-защищённости филиала №14.pdf", "12.05.2024"),
          f("Существенные замечания", "partial", "Замечания по филиалу №14", "Акт проверки ИБ-защищённости филиала №14.pdf", "12.05.2024"),
        ],
      },
      {
        title: "Инциденты и сигналы",
        fields: [
          f("Известные инциденты", "known", "DDoS-атака 12.05.2024", "Описание инцидента с DDoS-атакой.pdf", "14.05.2024"),
          f("Текущие риск-сигналы", "partial", "Зависимость от единственного вендора", "Отчёт внутреннего аудита 2026.pdf", "20.01.2026"),
        ],
      },
    ],
    groupCoverage: [
      { label: "Регуляторы и требования", percent: 45 },
      { label: "Аудиты и проверки", percent: 70 },
      { label: "Инциденты и сигналы", percent: 60 },
    ],
    missing: ["перечня лицензий и разрешений", "внешнего аудита ИБ", "сертификации ISO/SOC"],
  },
];

const INDEX_PERCENT = 64;

function countFilled(a: Area) {
  const all = a.groups.flatMap((g) => g.fields);
  const total = all.length;
  const filled = all.filter((x) => x.state === "known" || x.state === "partial").length;
  return { total, filled };
}

function statusClass(s: Status) { return `np-kb-status np-kb-status-${s}`; }

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

const IMPROVE_ITEMS = [
  { title: "Карта ИТ-систем", importance: "Высокая", gain: 8, why: "Поможет видеть критичные сервисы и технологические зависимости." },
  { title: "Оргструктура и владельцы процессов", importance: "Высокая", gain: 7, why: "Поможет связывать риски, инциденты и меры с ответственными." },
  { title: "Финансовая отчётность", importance: "Средняя", gain: 6, why: "Нужна для оценки финансовой устойчивости." },
  { title: "Ключевые контрагенты", importance: "Средняя", gain: 5, why: "Поможет выявлять концентрацию поставщиков и клиентов." },
] as const;

function IndexWidget({
  onTransfer, onAdd, toast,
}: { onTransfer: () => void; onAdd: (t: string) => void; toast: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="np-index-widget-wrap">
      <button className="np-index-widget" onClick={() => setOpen(true)}>
        <Ring percent={INDEX_PERCENT} size={64} stroke={6} />
        <div className="np-index-widget-text">
          <div className="np-index-widget-title">Индекс знания</div>
          <div className="np-index-widget-sub">8 областей</div>
          <div className="np-index-widget-meta">3 области требуют внимания</div>
        </div>
      </button>
      {open && (
        <div className="np-drawer-backdrop" onClick={() => setOpen(false)}>
          <div className="np-drawer np-improve-drawer" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="np-drawer-head">
              <div>
                <div className="np-drawer-eyebrow">Индекс знания · {INDEX_PERCENT}%</div>
                <h3 className="np-drawer-title">Как улучшить профиль</h3>
                <p className="np-drawer-summary">Добавление этих знаний сильнее всего повлияет на индекс компании.</p>
              </div>
              <button className="np-icon-btn" onClick={() => setOpen(false)} aria-label="Закрыть">✕</button>
            </div>
            <div className="np-drawer-body">
              <ul className="np-improve-list">
                {IMPROVE_ITEMS.map((it, i) => (
                  <li key={i} className="np-improve-item">
                    <div className="np-improve-main">
                      <div className="np-improve-title">{it.title}</div>
                      <div className="np-improve-meta">
                        <span className={`np-improve-badge ${it.importance === "Высокая" ? "high" : "mid"}`}>{it.importance} важность</span>
                        <span className="np-improve-gain">+{it.gain}%</span>
                      </div>
                      <div className="np-improve-why">{it.why}</div>
                    </div>
                    <button className="np-btn np-btn-primary np-improve-cta" onClick={() => { setOpen(false); onAdd(it.title); }}>Добавить</button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="np-drawer-foot">
              <button className="np-btn" onClick={() => setOpen(false)}>Закрыть</button>
              <button className="np-btn np-btn-primary" onClick={() => { setOpen(false); onTransfer(); }}>Передать знания Норму</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const FIELD_STATE_LABEL: Record<FieldState, string> = {
  known: "Известно",
  partial: "Частично",
  unknown: "Пока не знаю",
  na: "Не применимо",
};

function FactItem({ field, onEdit, onDelete, onAdd }: {
  field: BaseField; onEdit: () => void; onDelete: () => void; onAdd: () => void;
}) {
  const [menu, setMenu] = useState(false);
  if (field.state === "unknown" || field.state === "na") {
    return (
      <li className="np-fact np-fact-empty">
        <div className="np-fact-row">
          <div className="np-fact-text">
            <span className="np-fact-label">{field.label}</span>
            <div className="np-fact-empty-note">{FIELD_STATE_LABEL[field.state]}</div>
          </div>
          {field.state === "unknown" && (
            <button className="np-btn np-btn-ghost np-fact-add-cta" onClick={onAdd}>Добавить знание</button>
          )}
        </div>
      </li>
    );
  }
  return (
    <li className="np-fact">
      <div className="np-fact-row">
        <div className="np-fact-text">
          <span className="np-fact-label">{field.label}:</span> {field.value}
          {field.state === "partial" && <span className="np-pill-partial">частично</span>}
        </div>
        <div className="np-fact-menu-wrap">
          <button className="np-icon-btn" onClick={() => setMenu((m) => !m)} aria-label="Меню">⋯</button>
          {menu && (
            <div className="np-fact-menu" onMouseLeave={() => setMenu(false)}>
              <button onClick={() => { setMenu(false); onEdit(); }}>Изменить</button>
              <button onClick={() => { setMenu(false); onDelete(); }} className="danger">Удалить</button>
            </div>
          )}
        </div>
      </div>
      <div className="np-fact-meta">
        {field.source && <span className="np-source-badge">📄 {field.source}</span>}
        {field.date && field.date !== "—" && <span>· обновлено {field.date}</span>}
      </div>
    </li>
  );
}

function AreaPage({
  area, areas, onSelect, onBack, toast, onOpenChat,
}: {
  area: Area; areas: Area[]; onSelect: (id: string) => void; onBack: () => void;
  toast: (m: string) => void; onOpenChat?: (q: string) => void;
}) {
  const status = statusFromPercent(area.percent);
  const { total, filled } = countFilled(area);
  return (
    <div className="np-area-page">
      <div className="np-kb-pageheader">
        <button className="np-area-back" onClick={onBack}>← Профиль компании</button>
        <h1>{area.title}</h1>
        <div className="np-kb-pageheader-meta">
          <span className={statusClass(status)}>{STATUS_LABEL[status]}</span>
          <span className="np-muted">{area.why}</span>
        </div>
      </div>

      <div className="np-area-layout">
        <aside className="np-area-left">
          <div className="np-area-left-title">Области профиля</div>
          {areas.map((a) => {
            const s = statusFromPercent(a.percent);
            const isActive = a.id === area.id;
            return (
              <button key={a.id} className={`np-area-left-item ${isActive ? "active" : ""}`} onClick={() => onSelect(a.id)}>
                <div className="np-area-left-name">{a.title}</div>
                <span className={statusClass(s)}>{STATUS_LABEL[s]}</span>
              </button>
            );
          })}
        </aside>

        <div className="np-area-center">
          <section className="np-area-summary">
            <div className="np-kb-summary-eyebrow">Как Норм понимает эту область</div>
            <p>{area.aiSummary}</p>
          </section>

          <div className="np-section-groups">
            {area.groups.map((g, gi) => (
              <section key={gi} className="np-area-section">
                <h3>{g.title}</h3>
                <ul className="np-fact-list">
                  {g.fields.map((field, fi) => (
                    <FactItem
                      key={fi}
                      field={field}
                      onEdit={() => toast("Редактирование будет добавлено позже.")}
                      onDelete={() => toast("Удаление будет добавлено позже.")}
                      onAdd={() => onOpenChat
                        ? onOpenChat(`Хочу дополнить знания в разделе ${area.title}: ${field.label}`)
                        : toast("Добавление через чат Норма будет реализовано позже.")}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>

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
          <section className="np-area-side-card np-coverage-card">
            <h4>Покрытие области</h4>
            <div className="np-coverage-top">
              <Ring percent={area.percent} size={64} stroke={6} />
              <div>
                <div className="np-coverage-status">{STATUS_LABEL[status]}</div>
                <div className="np-muted np-coverage-base">Базовые поля: {filled} из {total}</div>
              </div>
            </div>
            <div className="np-coverage-list">
              {area.groupCoverage.map((g, i) => (
                <div key={i} className="np-coverage-row">
                  <span>{g.label}</span><strong>{g.percent}%</strong>
                </div>
              ))}
            </div>
            {area.missing.length > 0 && (
              <div className="np-coverage-missing">
                <div className="np-coverage-missing-title">Не хватает:</div>
                <ul>
                  {area.missing.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}
            <button
              className="np-btn np-btn-primary"
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => onOpenChat
                ? onOpenChat(`Хочу дополнить знания в разделе ${area.title}`)
                : toast("Сценарий дополнения знаний будет реализован через чат Норма.")}
            >
              Дополнить знания
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ProfilePage({
  onBack, onOpenChat,
}: { onBack: () => void; onOpenChat?: (q: string) => void }) {
  const [areas] = useState<Area[]>(AREAS_INITIAL);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const active = activeId ? areas.find((a) => a.id === activeId) ?? null : null;

  const addFromImprove = (title: string) => {
    if (onOpenChat) onOpenChat(`Хочу дополнить профиль компании: ${title}`);
    else setToast("Добавление знаний будет реализовано через чат Норма");
  };
  const transfer = () => {
    if (onOpenChat) onOpenChat("Хочу передать новые знания в профиль компании");
    else setToast("Сценарий добавления знаний будет реализован через чат Норма.");
  };

  if (active) {
    return (
      <>
        <AreaPage
          area={active}
          areas={areas}
          onSelect={setActiveId}
          onBack={() => setActiveId(null)}
          toast={setToast}
          onOpenChat={onOpenChat}
        />
        {toast && <KbToast message={toast} onDone={() => setToast(null)} />}
      </>
    );
  }

  return (
    <>
      <div className="np-kb-pageheader">
        <button className="np-area-back" onClick={onBack}>← База знаний</button>
        <div className="np-kb-pageheader-row">
          <div>
            <h1>Профиль компании</h1>
            <p className="np-muted">Знания, которые Норм использует, чтобы понимать компанию и точнее анализировать риски.</p>
          </div>
          <IndexWidget onTransfer={transfer} onAdd={addFromImprove} toast={setToast} />
        </div>
      </div>

      <section className="np-kb-summary np-kb-summary-solo">
        <div className="np-kb-summary-head">
          <div className="np-kb-summary-eyebrow">Как Норм понимает компанию</div>
          <p>
            Я собираю профиль компании из внутренних документов, открытых источников и знаний,
            которые ты передаёшь в чате. Сейчас лучше всего понимаю общую информацию, продукты
            и регуляторные сигналы. Меньше всего знаю о собственниках, финансах и ключевых контрагентах.
          </p>
        </div>
      </section>

      <section className="np-kb-grid">
        {areas.map((a) => {
          const s = statusFromPercent(a.percent);
          const { total, filled } = countFilled(a);
          return (
            <article
              key={a.id}
              className="np-kb-card np-kb-card-clickable"
              onClick={() => setActiveId(a.id)}
              role="button" tabIndex={0}
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
                <span className="np-muted">{filled} из {total} базовых полей · {a.sourcesDetailed.length} источников</span>
              </div>
            </article>
          );
        })}
      </section>

      {toast && <KbToast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}

function KbRoot({ onPick }: { onPick: (v: "profile" | "docs" | "method") => void }) {
  const cards = [
    { id: "profile", title: "Профиль компании", text: "Аналитический профиль компании: общая информация, структура, продукты, ИТ, финансы и риск-сигналы." },
    { id: "docs", title: "Документы компании", text: "Документы, которые Норм использует как источники знаний." },
    { id: "method", title: "Методология", text: "Политики, методики и регламенты, которыми пользуется Норм." },
  ] as const;
  return (
    <>
      <div className="np-kb-pageheader">
        <h1>База знаний Норма AI</h1>
        <p className="np-muted">Здесь живут знания, которыми Норм пользуется при анализе.</p>
      </div>
      <section className="np-kb-root-grid">
        {cards.map((c) => (
          <article key={c.id} className="np-kb-root-card" onClick={() => onPick(c.id as "profile" | "docs" | "method")}
            role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onPick(c.id as "profile" | "docs" | "method"); }}>
            <h3>{c.title}</h3>
            <p className="np-muted">{c.text}</p>
            <span className="np-kb-root-arrow">→</span>
          </article>
        ))}
      </section>
    </>
  );
}

function PlaceholderPage({ title, text, onBack }: { title: string; text: string; onBack: () => void }) {
  return (
    <div>
      <div className="np-kb-pageheader">
        <button className="np-area-back" onClick={onBack}>← База знаний</button>
        <h1>{title}</h1>
      </div>
      <div className="np-kb-placeholder"><p className="np-muted">{text}</p></div>
    </div>
  );
}

export default function KnowledgeBase({ onOpenChat }: { onOpenChat?: (q: string) => void }) {
  const [view, setView] = useState<"root" | "profile" | "docs" | "method">("root");
  return (
    <div className="np-kb">
      {view === "root" && <KbRoot onPick={setView} />}
      {view === "profile" && <ProfilePage onBack={() => setView("root")} onOpenChat={onOpenChat} />}
      {view === "docs" && <PlaceholderPage title="Документы компании" text="Здесь будут категории документов: индикатор зрелости, стандарты, оргструктура, финансовое состояние, аудиты и проверки, прочее." onBack={() => setView("root")} />}
      {view === "method" && <PlaceholderPage title="Методология" text="Здесь будет описание методологии: политики, методики, регламенты и рекомендации, которыми пользуется Норм." onBack={() => setView("root")} />}
    </div>
  );
}
