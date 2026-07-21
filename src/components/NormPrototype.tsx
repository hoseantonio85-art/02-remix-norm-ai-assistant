import { useEffect, useRef, useState } from "react";
import "../styles/norm-prototype.css";
import KnowledgeBase from "./KnowledgeBase";

type Role = "user" | "assistant" | "status" | "file" | "summary" | "actions";

interface SourceData {
  fileName: string;
  fileSize?: string;
  quote: string;
  files?: string[];
  note?: string;
}

interface Msg {
  id: number;
  role: Role;
  text?: string;
  rich?: React.ReactNode;
  source?: SourceData;
  actions?: { label: string; onClick?: () => void }[];
  fileName?: string;
  fileMeta?: string;
  onUpload?: () => void;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let _id = 1;
const nid = () => _id++;

function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="ngrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path d="M16 2 L29 16 L16 30 L3 16 Z" fill="url(#ngrad)" />
      <path d="M16 9 L23 16 L16 23 L9 16 Z" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const s = size;
  const stroke = "currentColor";
  const sw = 1.7;
  switch (name) {
    case "home":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/></svg>);
    case "bolt":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M13 2 L4 14h7l-1 8 9-12h-7z"/></svg>);
    case "shield":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>);
    case "target":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>);
    case "chart":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-7"/></svg>);
    case "eye":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>);
    case "gauge":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M3 12a9 9 0 1 1 18 0"/><path d="M12 12l4-3"/></svg>);
    case "book":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 16a4 4 0 0 1 4-4h12"/></svg>);
    case "menu":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M4 7h16M4 12h16M4 17h16"/></svg>);
    case "send":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>);
    case "clip":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M21 12l-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5L10.5 18.5a2 2 0 0 1-3-3L15 8"/></svg>);
    case "close":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M6 6l12 12M18 6L6 18"/></svg>);
    case "thumb-up":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M7 10v11H4V10zM7 10l4-7a2 2 0 0 1 2 2v4h6a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 1H7"/></svg>);
    case "thumb-down":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M17 14V3h3v11zM17 14l-4 7a2 2 0 0 1-2-2v-4H5a2 2 0 0 1-2-2l2-8a2 2 0 0 1 2-1h10"/></svg>);
    case "link":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>);
    case "file":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>);
    case "upload":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/></svg>);
    case "sparkles":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/></svg>);
    case "arrow":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M7 17L17 7M9 7h8v8"/></svg>);
    case "headset":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v5H5a1 1 0 0 1-1-1zM20 14h-3v5h2a1 1 0 0 0 1-1z"/></svg>);
    case "building":
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01M10 21v-4h4v4"/></svg>);
    default:
      return null;
  }
}

const NAV = [
  { id: "home", label: "Главная", icon: "home" },
  { id: "events", label: "События", icon: "bolt" },
  { id: "risks", label: "Риски", icon: "shield" },
  { id: "measures", label: "Меры", icon: "target" },
  { id: "analytics", label: "Аналитика", icon: "chart" },
  { id: "ai", label: "AI мониторинг", icon: "eye" },
  { id: "limit", label: "Лимитная кампания", icon: "gauge" },
  { id: "kb", label: "База знаний", icon: "book" },
];

interface FocusSource {
  type: string;
  title: string;
  date?: string;
  excerpt: string;
  relation: string;
}
interface FocusPoint {
  id: string;
  type: string;
  area: string;
  state: string;
  tone: "attention" | "warning" | "positive";
  title: string;
  short: string;
  missing: string;
  cta: string;
  impact: string;
  impactTone: "strong" | "positive";
  confidence: "низкая" | "средняя" | "высокая";
  intro: string;
  noticed: string;
  whyMatters: string;
  needMore: string;
  canDo: string;
  related: string[];
  sources: FocusSource[];
  primaryAction: string;
  secondaryActions: string[];
  chatQuestion: string;
}

const FOCUS_POINTS: FocusPoint[] = [
  {
    id: "fp-delivery",
    type: "Внешний сигнал",
    area: "Клиенты и продукты",
    state: "Стоит проверить",
    tone: "attention",
    title: "Бесплатная доставка конкурента может увеличить отток",
    short: "Конкурент изменил условия в 12 городах присутствия компании. Стоимость доставки уже входит в число частых причин отказа от заказа.",
    missing: "Не хватает данных об активных клиентах в этих городах.",
    cta: "Оценить влияние",
    impact: "сильное",
    impactTone: "strong",
    confidence: "средняя",
    intro: "Я заметил изменение, которое может затронуть клиентскую активность в нескольких регионах. Пока это не подтверждённая потеря, а сценарий, который стоит проверить.",
    noticed: "Конкурент запустил бесплатную доставку в 12 городах, где также работает компания.",
    whyMatters: "По данным обращений клиентов, стоимость доставки входит в число частых причин отказа от заказа. Поэтому новое предложение конкурента может увеличить отток в затронутых городах.",
    needMore: "Я не знаю, сколько активных клиентов компании находится в этих городах и какую долю выручки они формируют.",
    canDo: "Если добавить количество активных клиентов и среднюю выручку на клиента, я смогу оценить масштаб возможного оттока, пересчитать потенциальные потери и проверить, нужно ли переоценить связанный риск.",
    related: [
      "риск «Снижение клиентской активности»",
      "продукт «Экспресс-доставка»",
      "12 городов присутствия",
    ],
    sources: [
      { type: "Внешняя новость", title: "Конкурент запускает бесплатную доставку в 12 городах", date: "12 июля 2026", excerpt: "Крупный игрок объявил о бесплатной доставке во всех городах-миллионниках без ограничения по сумме заказа.", relation: "Основной внешний триггер: именно это изменение может повлиять на решения клиентов о заказе." },
      { type: "Профиль компании", title: "География присутствия компании", date: "актуально на 1 июля 2026", excerpt: "Компания представлена в 34 городах России, в 12 из них — прямое пересечение с зоной действия акции.", relation: "Позволяет определить регионы, где новое предложение конкурента будет заметно клиентам." },
      { type: "Аналитика", title: "Причины отказа от заказа, июнь 2026", date: "июнь 2026", excerpt: "Стоимость доставки — вторая по частоте причина отмены заказа после длительной доставки.", relation: "Показывает, что цена доставки уже сейчас чувствительна для клиентов." },
      { type: "Реестр рисков", title: "Снижение клиентской активности", excerpt: "Риск среднего уровня, оценивается ежеквартально.", relation: "Возможные последствия сценария оцениваются в рамках этого риска." },
    ],
    primaryAction: "Передать данные",
    secondaryActions: ["Открыть риск", "Обсудить с Нормом"],
    chatQuestion: "Помоги оценить, как бесплатная доставка конкурента может повлиять на отток клиентов",
  },
  {
    id: "fp-supply",
    type: "Связь событий",
    area: "Партнёры и поставки",
    state: "Требует внимания",
    tone: "warning",
    title: "Задержки поставок начинают влиять на наличие товаров",
    short: "За месяц три поставщика несколько раз нарушили сроки, а доля отсутствующих товаров выросла на 18%.",
    missing: "Не подтверждено, что для этих поставщиков предусмотрена быстрая замена.",
    cta: "Проверить зависимость",
    impact: "сильное",
    impactTone: "strong",
    confidence: "высокая",
    intro: "Несколько внутренних событий складываются в общую тенденцию. По отдельности они могли выглядеть некритично, но вместе уже могут влиять на непрерывность продаж.",
    noticed: "За последний месяц три поставщика несколько раз нарушили сроки поставки. За тот же период доля отсутствующих товаров выросла на 18%.",
    whyMatters: "Повторяющиеся задержки совпадают по времени с ухудшением доступности товаров. Это может привести к снижению продаж и росту недовольства клиентов.",
    needMore: "Я не нашёл подтверждения, что для этих поставщиков существуют резервные варианты и что переключение можно выполнить достаточно быстро.",
    canDo: "Если уточнить долю поставок каждого контрагента и срок перехода на резерв, я смогу оценить возможные потери и влияние на непрерывность бизнеса.",
    related: [
      "риск «Нарушение непрерывности поставок»",
      "три инцидента с задержкой",
      "поставщики «Альфа Фуд», «Север Трейд» и «Фреш Лайн»",
      "показатель доступности товаров",
    ],
    sources: [
      { type: "Инциденты", title: "Инциденты поставок за июнь 2026", date: "июнь 2026", excerpt: "Зафиксировано 7 задержек, из них 5 — по трём ключевым поставщикам.", relation: "Показывает повторяемость и концентрацию задержек у одних и тех же контрагентов." },
      { type: "Аналитика", title: "Доступность ассортимента по неделям", date: "июнь–июль 2026", excerpt: "Доля отсутствующих SKU выросла с 6% до 24% за 4 недели.", relation: "Демонстрирует связь задержек с ухудшением наличия товаров." },
      { type: "Профиль компании", title: "Договоры с ключевыми поставщиками", excerpt: "В контрактах указаны SLA по срокам, но нет явного плана замены.", relation: "Помогает понять, есть ли у компании формальный резерв." },
      { type: "Реестр рисков", title: "Нарушение непрерывности поставок", excerpt: "Риск оценивается как средний, но может быть переоценён при подтверждении зависимости.", relation: "Именно этот риск может измениться по итогам проверки." },
    ],
    primaryAction: "Проверить резервных поставщиков",
    secondaryActions: ["Открыть риск", "Посмотреть инциденты", "Обсудить с Нормом"],
    chatQuestion: "Помоги проверить зависимость от поставщиков с повторяющимися задержками",
  },
  {
    id: "fp-it",
    type: "Положительное изменение",
    area: "ИТ и непрерывность",
    state: "Есть улучшение",
    tone: "positive",
    title: "После новой меры число критичных сбоев снизилось",
    short: "После настройки дополнительного мониторинга число критичных ошибок снизилось на 37%, а повторных инцидентов не было 21 день.",
    missing: "Для уверенного вывода нужен более длинный период наблюдения.",
    cta: "Посмотреть результат",
    impact: "положительное",
    impactTone: "positive",
    confidence: "средняя",
    intro: "Есть первые признаки, что новая мера работает. Пока рано считать эффект окончательно подтверждённым, но изменение выглядит положительным.",
    noticed: "После подключения дополнительного мониторинга число критичных ошибок снизилось на 37%. Повторных массовых сбоев не было 21 день.",
    whyMatters: "Ранее повторяющиеся сбои влияли на онлайн-расчёты и увеличивали потенциальные потери. Если улучшение сохранится, связанный риск можно будет переоценить.",
    needMore: "Период наблюдения пока слишком короткий. Для уверенного вывода нужно сравнить показатели минимум за 30 дней и проверить работу системы во время пиковой нагрузки.",
    canDo: "После завершения периода наблюдения я смогу оценить эффективность меры и предложить новую оценку остаточного риска.",
    related: [
      "мера «Дополнительный мониторинг онлайн-расчётов»",
      "риск «Массовые сбои в системе онлайн-расчётов»",
      "история связанных инцидентов",
    ],
    sources: [
      { type: "Отчёт", title: "Отчёт мониторинга ИТ-систем", date: "июль 2026", excerpt: "Снижение количества критичных ошибок на 37% за последние 3 недели.", relation: "Основные числовые данные для оценки эффекта меры." },
      { type: "Мера", title: "Дополнительный мониторинг онлайн-расчётов", excerpt: "Мера внедрена 30 июня 2026, включает автоматические алерты и еженедельный обзор.", relation: "Именно эта мера могла привести к наблюдаемому улучшению." },
      { type: "Инциденты", title: "Журнал инцидентов за июнь–июль 2026", date: "июнь–июль 2026", excerpt: "После 30 июня массовых сбоев не зарегистрировано.", relation: "Подтверждает отсутствие повторных инцидентов в период наблюдения." },
    ],
    primaryAction: "Открыть меру",
    secondaryActions: ["Посмотреть инциденты", "Обсудить с Нормом"],
    chatQuestion: "Покажи, как новая мера повлияла на количество ИТ-сбоев",
  },
];

function Donut({ percent, color }: { percent: number; color: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c * (1 - percent / 100);
  return (
    <svg width="68" height="68" viewBox="0 0 68 68">
      <circle cx="34" cy="34" r={r} stroke="#eef0f3" strokeWidth="7" fill="none" />
      <circle cx="34" cy="34" r={r} stroke={color} strokeWidth="7" fill="none"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        transform="rotate(-90 34 34)" />
      <text x="34" y="38" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1f2937">{percent}%</text>
    </svg>
  );
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return <div className="np-toast">{message}</div>;
}

function SourcePopover({ source, onClose }: { source: SourceData; onClose: () => void }) {
  return (
    <div className="np-popover" role="dialog">
      <div className="np-pop-head">
        <span className="np-pop-title">Источник</span>
        <button className="np-icon-btn" onClick={onClose} aria-label="Закрыть"><Icon name="close" size={16} /></button>
      </div>
      {source.files && source.files.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {source.files.map((f) => (
            <div key={f} className="np-file-card" style={{ marginBottom: 0 }}>
              <div className="np-file-ic"><Icon name="file" size={18} /></div>
              <div><div className="np-file-name">{f}</div></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="np-file-card">
          <div className="np-file-ic"><Icon name="file" size={18} /></div>
          <div>
            <div className="np-file-name">{source.fileName}</div>
            {source.fileSize && <div className="np-file-meta">{source.fileSize}</div>}
          </div>
        </div>
      )}
      <p className="np-quote">«{source.quote}»</p>
      <button className="np-btn np-btn-ghost" disabled>Перейти к источнику</button>
      <p className="np-pop-note">{source.note ?? "Переход дальше в этом MVP не реализован"}</p>
    </div>
  );
}

function FeedbackActions({ source }: { source?: SourceData }) {
  const [open, setOpen] = useState(false);
  const [reaction, setReaction] = useState<null | "up" | "down">(null);
  return (
    <div className="np-feedback">
      <button className={`np-fb-btn ${reaction === "up" ? "active" : ""}`} onClick={() => setReaction("up")} aria-label="Полезно">
        <Icon name="thumb-up" size={15} />
      </button>
      <button className={`np-fb-btn ${reaction === "down" ? "active" : ""}`} onClick={() => setReaction("down")} aria-label="Не полезно">
        <Icon name="thumb-down" size={15} />
      </button>
      {source && (
        <div className="np-source-wrap">
          <button className="np-fb-btn np-fb-link" onClick={() => setOpen((v) => !v)}>
            <Icon name="link" size={14} /> Источник
          </button>
          {open && <SourcePopover source={source} onClose={() => setOpen(false)} />}
        </div>
      )}
    </div>
  );
}

function ThinkingPill({ label }: { label: string }) {
  return (
    <div className="np-status">
      <span className="np-status-dot"><LogoMark size={14} /></span>
      <span>{label}</span>
      <span className="np-status-dots"><i/><i/><i/></span>
    </div>
  );
}

function FileChip({ name, meta }: { name: string; meta: string }) {
  return (
    <div className="np-user-file">
      <div className="np-file-ic np-pdf">PDF</div>
      <div>
        <div className="np-file-name">{name}</div>
        <div className="np-file-meta">{meta}</div>
      </div>
    </div>
  );
}

function CompanySummaryCard() {
  return (
    <div className="np-summary">
      <div className="np-sum-row">
        <div className="np-sum-label">Компания</div>
        <div className="np-sum-value"><strong>ООО «Сам Издат Инкорпорейтед»</strong></div>
      </div>
      <div className="np-sum-row">
        <div className="np-sum-label">Род деятельности</div>
        <div className="np-sum-value">Производство и развитие AI-рекомендательных продуктов для e-commerce и внутренних корпоративных систем.</div>
      </div>
      <div className="np-sum-row">
        <div className="np-sum-label">Что известно</div>
        <div className="np-sum-value">
          <ul className="np-sum-list">
            <li>компания использует AI-систему рекомендаций товаров;</li>
            <li>есть признаки роста нагрузки на вычислительные мощности;</li>
            <li>в документах встречается дефицит GPU;</li>
            <li>генеральный директор — Семён Петрович Колбасников;</li>
            <li>часть знаний подтверждена загруженными документами, часть требует уточнения.</li>
          </ul>
        </div>
      </div>
      <div className="np-sum-row">
        <div className="np-sum-label">Размер и структура</div>
        <div className="np-sum-value np-muted">Точных данных о численности и структуре пока мало. Я могу уточнить это, если ты добавишь документы о сотрудниках, подразделениях или оргструктуре.</div>
      </div>
    </div>
  );
}

const SCENARIOS = {
  director: "Кто генеральный директор компании СамИздат Инкорпорейтед?",
  gpu: "Кто отвечает за закупку GPU?",
  company: "Что ты знаешь о моей компании?",
  products: "Какие продукты есть у компании?",
};

function AssistantModal({ initialQuery, onClose, onToast }: { initialQuery: string | null; onClose: () => void; onToast: (m: string) => void; }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<null | (() => void)>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const push = (m: Omit<Msg, "id">) => {
    setMessages((prev) => [...prev, { id: nid(), ...m }]);
  };
  const replaceStatus = (text: string) => {
    setMessages((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === "status") { copy[i] = { ...copy[i], text }; return copy; }
      }
      copy.push({ id: nid(), role: "status", text });
      return copy;
    });
  };
  const removeStatus = () => {
    setMessages((prev) => prev.filter((m) => m.role !== "status"));
  };

  async function runDirector() {
    setBusy(true);
    push({ role: "status", text: "Немного подумаю" });
    await wait(700);
    replaceStatus("Ищу в знаниях о компании");
    await wait(800);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>Это был неожиданный вопрос, и у меня нет на него ответа.</p>
          <p>Если ты готов поделиться со мной этим знанием, я запомню его и применю в нужный момент.</p>
        </>
      ),
    });
    push({
      role: "actions",
      actions: [{ label: "📎 Прикрепить документ", onClick: () => simulateDirectorUpload() }],
    });
    setPendingUpload(() => simulateDirectorUpload);
    setBusy(false);
  }

  async function simulateDirectorUpload() {
    setPendingUpload(null);
    setMessages((prev) => prev.filter((m) => m.role !== "actions"));
    push({ role: "file", fileName: "ФИО директора и прочая инфа.pdf", fileMeta: "10 МБ" });
    await wait(500);
    setBusy(true);
    push({ role: "status", text: "Разбираю документ" });
    await wait(900);
    replaceStatus("Ищу нужную информацию");
    await wait(900);
    replaceStatus("Сохраняю новое знание");
    await wait(900);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>Отлично!</p>
          <p><strong>ООО «Сам Издат Инкорпорейтед»</strong></p>
          <p>Генеральный директор:<br/><strong>Семён Петрович Колбасников</strong></p>
          <p>ИНН 772335154264<br/>Занимает пост с 1986 года.</p>
          <p className="np-muted">Теперь я буду хранить эту информацию для твоей пользы.</p>
          <p>Хочешь узнать больше информации о сотрудниках этой компании? Твой документ содержал эту информацию.</p>
        </>
      ),
      source: {
        fileName: "ФИО директора и прочая инфа.pdf",
        fileSize: "10 МБ",
        quote: "Генеральный директор ООО «Сам Издат Инкорпорейтед» — Семён Петрович Колбасников, ИНН 772335154264, занимает пост с 1986 года.",
      },
    });
    push({
      role: "actions",
      actions: [
        { label: "Информация о сотрудниках", onClick: () => continueDialog("Информация о сотрудниках") },
        { label: "Передать новые знания", onClick: () => continueDialog("Передать новые знания") },
      ],
    });
    setBusy(false);
  }

  async function runGpu() {
    setBusy(true);
    push({ role: "status", text: "Немного подумаю" });
    await wait(700);
    replaceStatus("Проверяю знания о компании");
    await wait(800);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>Пока не нашёл этого в знаниях компании.</p>
          <p>Если у тебя есть документ, где это описано, загрузи его сюда — я разберу и запомню полезную информацию.</p>
        </>
      ),
    });
    push({
      role: "actions",
      actions: [{ label: "Загрузить документ", onClick: () => simulateUpload() }],
    });
    setBusy(false);
  }

  async function simulateUpload() {
    setMessages((prev) => prev.filter((m) => m.role !== "actions"));
    push({ role: "file", fileName: "Отчёт внутреннего аудита 2026.pdf", fileMeta: "PDF · 10 МБ" });
    await wait(500);
    setBusy(true);
    push({ role: "status", text: "Разбираю документ" });
    await wait(800);
    replaceStatus("Ищу ответ в тексте");
    await wait(800);
    replaceStatus("Обновляю знания компании");
    await wait(800);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>Нашёл в документе.</p>
          <p>За закупку GPU отвечает направление <strong>ИТ и кибербезопасности</strong>.</p>
          <p>В документе указано, что текущие ресурсы GPU исчерпаны на уровне до 90% в пиковые периоды нагрузки, а процесс закупки новых мощностей был инициирован в первом квартале 2026 года.</p>
          <p className="np-muted">Я сохранил это как новое знание о компании.</p>
        </>
      ),
      source: {
        fileName: "Отчёт внутреннего аудита 2026.pdf",
        fileSize: "10 МБ",
        quote: "текущие ресурсы GPU исчерпаны на уровне до 90% в пиковые периоды нагрузки…",
      },
    });
    push({
      role: "actions",
      actions: [
        { label: "Что ещё известно про ИТ?", onClick: () => continueDialog("Что ещё известно про ИТ?") },
        { label: "Показать связанные риски", onClick: () => continueDialog("Какие риски связаны с продуктом?") },
        { label: "Передать новые знания", onClick: () => continueDialog("Передать новые знания") },
      ],
    });
    setBusy(false);
  }

  async function runCompany() {
    setBusy(true);
    push({ role: "status", text: "Проверяю профиль компании" });
    await wait(700);
    replaceStatus("Собираю короткое саммари");
    await wait(800);
    replaceStatus("Отделяю подтверждённые знания от неполных");
    await wait(800);
    removeStatus();
    push({
      role: "summary",
      rich: (
        <>
          <p>Вот что я сейчас знаю о компании.</p>
          <CompanySummaryCard />
        </>
      ),
      source: {
        fileName: "Сводные знания о компании",
        fileSize: "3 источника",
        quote: "Профиль собран из ФИО директора и прочая инфа.pdf, Отчёт внутреннего аудита 2026.pdf и анонса на сайте компании.",
        files: [
          "ФИО директора и прочая инфа.pdf",
          "Отчёт внутреннего аудита 2026.pdf",
          "Анонс на сайте компании",
        ],
        note: "Это агрегированный ответ. В MVP переход к отдельным источникам не реализован.",
      },
    });
    push({
      role: "actions",
      actions: [
        { label: "Информация о сотрудниках", onClick: () => continueDialog("Информация о сотрудниках") },
        { label: "Передать новые знания", onClick: () => continueDialog("Передать новые знания") },
        { label: "Что ещё неизвестно?", onClick: () => continueDialog("Что ещё неизвестно?") },
      ],
    });
    setBusy(false);
  }

  async function runProducts() {
    setBusy(true);
    push({ role: "status", text: "Проверяю знания о компании" });
    await wait(700);
    replaceStatus("Ищу подтверждённые сведения");
    await wait(800);
    replaceStatus("Собираю короткий ответ");
    await wait(700);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>По текущим знаниям компания развивает AI-продукты для e-commerce и внутренних корпоративных систем.</p>
          <p><strong>Главный известный продукт:</strong><br/>Система AI-рекомендаций товаров</p>
          <p><strong>Что известно:</strong></p>
          <ul className="np-sum-list">
            <li>продукт помогает подбирать релевантные товары для пользователей;</li>
            <li>используется на сайте компании;</li>
            <li>связан с ростом нагрузки на вычислительные мощности;</li>
            <li>для стабильной работы важны GPU-ресурсы.</li>
          </ul>
          <p className="np-muted">Часть информации подтверждена открытым анонсом на сайте компании и внутренними документами. Более подробного описания продуктовой линейки пока мало.</p>
        </>
      ),
      source: {
        fileName: "Сведения о продуктах",
        fileSize: "2 источника",
        quote: "Система AI-рекомендаций товаров используется как один из ключевых AI-продуктов компании.",
        files: ["Анонс на сайте компании", "Отчёт внутреннего аудита 2026.pdf"],
        note: "Это агрегированный ответ. В MVP переход к отдельным источникам не реализован.",
      },
    });
    push({
      role: "actions",
      actions: [
        { label: "Расскажи подробнее про AI-рекомендации", onClick: () => continueDialog("Расскажи подробнее про AI-рекомендации") },
        { label: "Какие риски связаны с продуктом?", onClick: () => continueDialog("Какие риски связаны с продуктом?") },
        { label: "Что ещё неизвестно?", onClick: () => continueDialog("Что ещё неизвестно?") },
      ],
    });
    setBusy(false);
  }

  async function runEmployees() {
    setBusy(true);
    push({ role: "status", text: "Проверяю документы" });
    await wait(700);
    replaceStatus("Ищу сведения о сотрудниках");
    await wait(800);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>В загруженных знаниях есть отдельные сведения о сотрудниках, но полного профиля команды пока нет.</p>
          <p><strong>Что уже встречается:</strong></p>
          <ul className="np-sum-list">
            <li>генеральный директор: Семён Петрович Колбасников;</li>
            <li>упоминается направление ИТ и кибербезопасности;</li>
            <li>есть признаки, что за GPU и инфраструктуру отвечает технический блок.</li>
          </ul>
          <p className="np-muted">Полной оргструктуры, численности и списка подразделений пока не хватает.</p>
        </>
      ),
      source: {
        fileName: "Сведения о сотрудниках",
        fileSize: "2 источника",
        quote: "Генеральный директор — Семён Петрович Колбасников. Упоминается направление ИТ и кибербезопасности.",
        files: ["ФИО директора и прочая инфа.pdf", "Отчёт внутреннего аудита 2026.pdf"],
        note: "Это агрегированный ответ. В MVP переход к отдельным источникам не реализован.",
      },
    });
    push({
      role: "actions",
      actions: [
        { label: "Передать новые знания", onClick: () => continueDialog("Передать новые знания") },
        { label: "Что нужно добавить в профиль?", onClick: () => continueDialog("Что нужно добавить в профиль?") },
      ],
    });
    setBusy(false);
  }

  async function runTransfer() {
    setBusy(true);
    push({ role: "status", text: "Готовлю место для нового знания" });
    await wait(800);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>Хорошо. Ты можешь передать знание текстом или прикрепить документ.</p>
          <p><strong>Лучше всего подойдут:</strong></p>
          <ul className="np-sum-list">
            <li>описание подразделений;</li>
            <li>список ключевых сотрудников;</li>
            <li>продуктовая линейка;</li>
            <li>внутренние регламенты;</li>
            <li>документы по инфраструктуре и ИТ.</li>
          </ul>
          <p>Я разберу информацию и добавлю её в профиль компании.</p>
        </>
      ),
    });
    push({
      role: "actions",
      actions: [
        { label: "📎 Прикрепить документ", onClick: () => simulateTransferUpload() },
        { label: "Ввести знание текстом", onClick: () => onToast("Ввод текстом будет доступен позже") },
      ],
    });
    setPendingUpload(() => simulateTransferUpload);
    setBusy(false);
  }

  async function simulateTransferUpload() {
    setPendingUpload(null);
    setMessages((prev) => prev.filter((m) => m.role !== "actions"));
    push({ role: "file", fileName: "Оргструктура компании.pdf", fileMeta: "PDF · 4 МБ" });
    await wait(500);
    setBusy(true);
    push({ role: "status", text: "Разбираю документ" });
    await wait(900);
    replaceStatus("Обновляю профиль компании");
    await wait(900);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>Я добавил новое знание в профиль компании.</p>
          <p className="np-muted">Теперь в профиле есть черновая информация об организационной структуре. В MVP я не открываю отдельный экран профиля, но могу использовать это знание в следующих ответах.</p>
        </>
      ),
      source: {
        fileName: "Оргструктура компании.pdf",
        fileSize: "PDF · 4 МБ",
        quote: "Документ описывает черновую организационную структуру компании.",
      },
    });
    push({
      role: "actions",
      actions: [
        { label: "Информация о сотрудниках", onClick: () => continueDialog("Информация о сотрудниках") },
        { label: "Что ещё неизвестно?", onClick: () => continueDialog("Что ещё неизвестно?") },
      ],
    });
    setBusy(false);
  }

  async function runRecommendDetail() {
    setBusy(true);
    push({ role: "status", text: "Собираю информацию о продукте" });
    await wait(800);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>AI-рекомендации товаров — это продукт, который помогает подбирать пользователю более релевантные товары на основе контекста и поведения.</p>
          <p><strong>Почему это важно для риск-профиля:</strong></p>
          <ul className="np-sum-list">
            <li>продукт зависит от качества данных;</li>
            <li>растёт нагрузка на вычислительные мощности;</li>
            <li>сбои в рекомендациях могут влиять на продажи и клиентский опыт;</li>
            <li>дефицит GPU может стать операционным риском.</li>
          </ul>
        </>
      ),
      source: {
        fileName: "AI-рекомендации",
        fileSize: "2 источника",
        quote: "Продукт зависит от качества данных и вычислительных мощностей; дефицит GPU — потенциальный операционный риск.",
        files: ["Анонс на сайте компании", "Отчёт внутреннего аудита 2026.pdf"],
        note: "Это агрегированный ответ. В MVP переход к отдельным источникам не реализован.",
      },
    });
    push({
      role: "actions",
      actions: [
        { label: "Какие риски связаны с продуктом?", onClick: () => continueDialog("Какие риски связаны с продуктом?") },
        { label: "Что известно про GPU?", onClick: () => continueDialog("Что известно про GPU?") },
      ],
    });
    setBusy(false);
  }

  async function runRisks() {
    setBusy(true);
    push({ role: "status", text: "Оцениваю зоны риска" });
    await wait(800);
    replaceStatus("Сопоставляю с документами");
    await wait(700);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>Предварительно вижу несколько зон риска:</p>
          <p><strong>1. Технический риск.</strong> Рост нагрузки и дефицит GPU могут повлиять на стабильность продукта.</p>
          <p><strong>2. Риск качества данных.</strong> Если данные неполные или устаревшие, рекомендации могут стать менее точными.</p>
          <p><strong>3. Операционный риск.</strong> Если продукт критичен для продаж, сбой может повлиять на бизнес-показатели.</p>
          <p className="np-muted">Это не финальная оценка риска, а предварительный вывод по имеющимся знаниям.</p>
        </>
      ),
      source: {
        fileName: "Зоны риска продукта",
        fileSize: "2 источника",
        quote: "Дефицит GPU и качество данных — ключевые операционные риски, связанные с продуктом AI-рекомендаций.",
        files: ["Отчёт внутреннего аудита 2026.pdf", "Анонс на сайте компании"],
        note: "Это агрегированный ответ. В MVP переход к отдельным источникам не реализован.",
      },
    });
    push({
      role: "actions",
      actions: [
        { label: "Показать связанные знания", onClick: () => continueDialog("Что известно про GPU?") },
        { label: "Передать новые знания", onClick: () => continueDialog("Передать новые знания") },
      ],
    });
    setBusy(false);
  }

  async function runUnknowns() {
    setBusy(true);
    push({ role: "status", text: "Сверяюсь с профилем компании" });
    await wait(800);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>В профиле компании пока не хватает нескольких важных блоков:</p>
          <ul className="np-sum-list">
            <li>численность сотрудников;</li>
            <li>структура подразделений;</li>
            <li>владельцы ключевых процессов;</li>
            <li>полный список продуктов;</li>
            <li>финансовые показатели;</li>
            <li>карта ИТ-систем;</li>
            <li>владельцы рисков и мер.</li>
          </ul>
          <p className="np-muted">Если добавить эти знания, я смогу точнее отвечать на вопросы и лучше связывать события, риски и документы.</p>
        </>
      ),
    });
    push({
      role: "actions",
      actions: [
        { label: "Передать новые знания", onClick: () => continueDialog("Передать новые знания") },
        { label: "Что добавить сначала?", onClick: () => continueDialog("Что добавить сначала?") },
      ],
    });
    setBusy(false);
  }

  async function runFirstToAdd() {
    setBusy(true);
    push({ role: "status", text: "Подбираю приоритеты" });
    await wait(700);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>Я бы начал с трёх блоков — они дают самый сильный эффект для риск-профиля:</p>
          <ul className="np-sum-list">
            <li><strong>Оргструктура и ключевые сотрудники</strong> — чтобы связывать риски с владельцами.</li>
            <li><strong>Продуктовая линейка</strong> — чтобы понимать бизнес-критичность.</li>
            <li><strong>Карта ИТ-систем</strong> — чтобы оценивать технические риски.</li>
          </ul>
          <p>С этим я смогу заметно точнее отвечать на следующие вопросы.</p>
        </>
      ),
    });
    push({
      role: "actions",
      actions: [
        { label: "Передать новые знания", onClick: () => continueDialog("Передать новые знания") },
      ],
    });
    setBusy(false);
  }

  async function runGpuKnown() {
    setBusy(true);
    push({ role: "status", text: "Ищу сведения про GPU" });
    await wait(800);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>По имеющимся знаниям GPU-ресурсы критичны для продукта AI-рекомендаций.</p>
          <ul className="np-sum-list">
            <li>в пиковые периоды загрузка достигает до 90%;</li>
            <li>за закупку отвечает направление ИТ и кибербезопасности;</li>
            <li>процесс закупки новых мощностей инициирован в первом квартале 2026 года.</li>
          </ul>
        </>
      ),
      source: {
        fileName: "Отчёт внутреннего аудита 2026.pdf",
        fileSize: "10 МБ",
        quote: "Текущие ресурсы GPU исчерпаны на уровне до 90% в пиковые периоды нагрузки.",
      },
    });
    push({
      role: "actions",
      actions: [
        { label: "Какие риски связаны с продуктом?", onClick: () => continueDialog("Какие риски связаны с продуктом?") },
        { label: "Передать новые знания", onClick: () => continueDialog("Передать новые знания") },
      ],
    });
    setBusy(false);
  }

  function continueDialog(label: string) {
    push({ role: "user", text: label });
    routeLabel(label);
  }

  function routeLabel(label: string) {
    const l = label.toLowerCase();
    if (l.includes("сотрудник")) return runEmployees();
    if (l.includes("передать новые знания")) return runTransfer();
    if (l.includes("подробнее про ai") || l.includes("про ai-рекоменд")) return runRecommendDetail();
    if (l.includes("риски связаны") || l.includes("связанные риски")) return runRisks();
    if (l.includes("что ещё неизвестно") || l.includes("нужно добавить в профиль")) return runUnknowns();
    if (l.includes("добавить сначала")) return runFirstToAdd();
    if (l.includes("про gpu") || l.includes("известно про ит")) return runGpuKnown();
    onToast("Этот переход будет добавлен позже");
  }

  function dispatch(text: string) {
    const t = text.trim();
    push({ role: "user", text: t });
    const n = t.toLowerCase().replace(/[?!.,]/g, "").trim();
    if (n.includes("ген") && n.includes("директор") && n.includes("самиздат")) runDirector();
    else if (n.includes("gpu") || (n.includes("закупк") && n.includes("gpu"))) runGpu();
    else if (n.includes("что ты знаешь") || (n.includes("знаешь") && n.includes("компани"))) runCompany();
    else if (n.includes("продукт") || (n.includes("чем") && n.includes("занимается"))) runProducts();
    else {
      setBusy(true);
      push({ role: "status", text: "Немного подумаю" });
      wait(700).then(() => {
        removeStatus();
        push({
          role: "assistant",
          text: "Для MVP я умею показывать три сценария: быстрый ответ из знаний, ответ после загрузки файла и краткий профиль компании.",
        });
        setBusy(false);
      });
    }
  }

  useEffect(() => {
    if (!initialQuery) return;
    const t = setTimeout(() => dispatch(initialQuery), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const v = input;
    setInput("");
    dispatch(v);
  }

  return (
    <div className="np-modal-backdrop" onClick={onClose}>
      <div className="np-modal" onClick={(e) => e.stopPropagation()}>
        <header className="np-modal-head">
          <div className="np-modal-title">
            <LogoMark size={32} />
            <h2>Норм на связи</h2>
          </div>
          <button className="np-icon-btn np-modal-close" onClick={onClose} aria-label="Закрыть"><Icon name="close" size={20} /></button>
        </header>

        <div className="np-messages" ref={scrollRef}>
          {messages.map((m) => {
            if (m.role === "user") {
              return <div key={m.id} className="np-row np-row-right"><div className="np-bubble np-user">{m.text}</div></div>;
            }
            if (m.role === "status") {
              return <div key={m.id} className="np-row np-row-left"><ThinkingPill label={m.text || ""} /></div>;
            }
            if (m.role === "file") {
              return <div key={m.id} className="np-row np-row-right"><FileChip name={m.fileName || ""} meta={m.fileMeta || ""} /></div>;
            }
            if (m.role === "actions") {
              return (
                <div key={m.id} className="np-row np-row-left">
                  <div className="np-actions">
                    {m.actions?.map((a, i) => (
                      <button key={i} className="np-chip" onClick={a.onClick}>{a.label}</button>
                    ))}
                  </div>
                </div>
              );
            }
            // assistant / summary
            return (
              <div key={m.id} className="np-row np-row-left">
                <div className="np-assistant-block">
                  <div className="np-bubble np-assistant">
                    {m.rich ?? <p>{m.text}</p>}
                  </div>
                  <FeedbackActions source={m.source} />
                </div>
              </div>
            );
          })}
        </div>

        <form className="np-input-wrap" onSubmit={onSubmit}>
          <button
            type="button"
            className="np-icon-btn"
            aria-label="Прикрепить"
            onClick={() => { if (pendingUpload) pendingUpload(); else onToast("Прикрепи документ — Норм его разберёт"); }}
          >
            <Icon name="clip" size={18} />
          </button>
          <input
            className="np-input"
            placeholder="Я твой ИИ помощник"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button type="submit" className="np-send" aria-label="Отправить" disabled={busy || !input.trim()}>
            <Icon name="send" size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

function FocusPointModal({
  point,
  activeSourceIdx,
  onOpenSource,
  onCloseSource,
  onClose,
  onToast,
  onDiscuss,
}: {
  point: FocusPoint;
  activeSourceIdx: number | null;
  onOpenSource: (i: number) => void;
  onCloseSource: () => void;
  onClose: () => void;
  onToast: (m: string) => void;
  onDiscuss: (q: string) => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (activeSourceIdx !== null) {
        e.stopPropagation();
        onCloseSource();
      } else {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [activeSourceIdx, onClose, onCloseSource]);

  const handleAction = (label: string) => {
    if (label === "Обсудить с Нормом") {
      onDiscuss(point.chatQuestion);
      return;
    }
    onToast(`«${label}» — этот раздел прототипа пока не реализован`);
  };

  const source = activeSourceIdx !== null ? point.sources[activeSourceIdx] : null;

  return (
    <div
      className="np-focus-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={point.title}
    >
      <div className="np-focus-modal" onClick={(e) => e.stopPropagation()}>
        <header className="np-focus-modal-head">
          <div className="np-focus-modal-meta">
            <span className={`np-focus-type np-focus-type--${point.tone}`}>{point.type}</span>
            <span className="np-focus-area">{point.area}</span>
            <span className={`np-focus-state np-focus-state--${point.tone}`}>
              <span className="np-focus-dot" aria-hidden />
              {point.state}
            </span>
          </div>
          <h2 className="np-focus-modal-title">{point.title}</h2>
          <p className="np-focus-modal-intro">{point.intro}</p>
          <div className="np-focus-modal-badges">
            <div className={`np-focus-badge np-focus-badge--${point.impactTone}`}>
              <span className="np-focus-badge-label">Возможное влияние</span>
              <span className="np-focus-badge-value">{point.impact}</span>
            </div>
            <div className="np-focus-badge">
              <span className="np-focus-badge-label">Уверенность Норма</span>
              <span className="np-focus-badge-value">{point.confidence}</span>
            </div>
          </div>
          <button className="np-icon-btn np-focus-close" onClick={onClose} aria-label="Закрыть">
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="np-focus-modal-body">
          <div className="np-focus-col np-focus-col--main">
            <section className="np-focus-block">
              <h4>Что я заметил</h4>
              <p>{point.noticed}</p>
            </section>
            <section className="np-focus-block">
              <h4>Почему это может повлиять на компанию</h4>
              <p>{point.whyMatters}</p>
            </section>
            <section className="np-focus-block">
              <h4>Чего пока не хватает</h4>
              <p>{point.needMore}</p>
            </section>
            <section className="np-focus-block">
              <h4>Что я смогу сделать</h4>
              <p>{point.canDo}</p>
            </section>
            <section className="np-focus-block">
              <h4>Связанные объекты</h4>
              <ul className="np-focus-related">
                {point.related.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="np-focus-col np-focus-col--side">
            <div className="np-focus-side-block">
              <div className="np-focus-side-label">Возможное влияние</div>
              <div className={`np-focus-side-value np-focus-side-value--${point.impactTone}`}>
                {point.impact}
              </div>
            </div>
            <div className="np-focus-side-block">
              <div className="np-focus-side-label">Уверенность в выводе</div>
              <div className="np-focus-side-value">{point.confidence}</div>
            </div>

            <div className="np-focus-side-block">
              <div className="np-focus-side-label">Источники</div>
              <ul className="np-focus-sources">
                {point.sources.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className="np-focus-source-btn"
                      onClick={() => onOpenSource(i)}
                    >
                      <span className="np-focus-source-type">{s.type}</span>
                      <span className="np-focus-source-title">{s.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="np-focus-actions">
              <button
                className="np-btn np-btn-primary np-focus-primary"
                onClick={() => handleAction(point.primaryAction)}
              >
                {point.primaryAction}
              </button>
              {point.secondaryActions.map((a) => (
                <button
                  key={a}
                  className="np-btn np-btn-ghost np-focus-secondary"
                  onClick={() => handleAction(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </aside>
        </div>

        {source && (
          <div
            className="np-focus-src-backdrop"
            onClick={onCloseSource}
          >
            <aside
              className="np-focus-src-drawer"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={source.title}
            >
              <div className="np-focus-src-head">
                <div>
                  <div className="np-focus-src-type">{source.type}</div>
                  <h3 className="np-focus-src-title">{source.title}</h3>
                  {source.date && <div className="np-focus-src-date">Актуально: {source.date}</div>}
                </div>
                <button
                  className="np-icon-btn"
                  onClick={onCloseSource}
                  aria-label="Закрыть источник"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
              <div className="np-focus-src-body">
                <section className="np-focus-block">
                  <h4>Содержание</h4>
                  <p>{source.excerpt}</p>
                </section>
                <section className="np-focus-block">
                  <h4>Как источник связан с выводом</h4>
                  <p>{source.relation}</p>
                </section>
                <button
                  className="np-btn np-btn-primary"
                  onClick={() =>
                    onToast("Открытие источника в этом прототипе пока не реализовано")
                  }
                >
                  Открыть источник
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NormPrototype() {
  const [modalQuery, setModalQuery] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const [focusSourceIdx, setFocusSourceIdx] = useState<number | null>(null);
  const [activeNav, setActiveNav] = useState<string>("home");
  const [profileAreaOpen, setProfileAreaOpen] = useState(false);
  const [knowledgeBaseRootRequest, setKnowledgeBaseRootRequest] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("norm-sidebar-collapsed") === "1";
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("norm-sidebar-collapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeNav, profileAreaOpen]);

  const handleNavigation = (navId: string) => {
    setActiveNav(navId);
    if (navId !== "kb") {
      setProfileAreaOpen(false);
    } else {
      setProfileAreaOpen(false);
      setKnowledgeBaseRootRequest((v) => v + 1);
    }
  };

  const openWith = (q: string | null) => { setModalQuery(q); setModalOpen(true); };
  const close = () => { setModalOpen(false); setModalQuery(null); };

  return (
    <div className={`np-app ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="np-sidebar">
        <div className="np-brand">
          <LogoMark size={26} />
          <span className="np-brand-text">НОРМ</span>
        </div>

        <div className="np-org">
          <div className="np-org-ic"><Icon name="building" size={18} /></div>
          <div className="np-org-text">
            <div className="np-org-label">Организация</div>
            <div className="np-org-value">Не выбрана</div>
          </div>
          <button className="np-icon-btn np-org-menu" aria-label="Меню"><Icon name="menu" size={16} /></button>
        </div>

        <nav className="np-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`np-nav-item ${activeNav === n.id ? "active" : ""}`}
              onClick={() => handleNavigation(n.id)}
              title={n.label}
              aria-label={n.label}
            >
              <Icon name={n.icon} size={18} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="np-side-bottom">
          <div className="np-user">
            <div className="np-avatar">МЕ</div>
            <div>
              <div className="np-user-name">Михайлова Екатерина</div>
              <div className="np-user-role">Риск-менеджер (ЦА)</div>
            </div>
          </div>
          <button className="np-side-link" title="Служба поддержки" aria-label="Служба поддержки">
            <Icon name="headset" size={16} /><span>Служба поддержки</span>
          </button>
          <button
            className="np-side-link np-side-collapse"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? "Развернуть меню" : "Свернуть меню"}
            title={sidebarCollapsed ? "Развернуть меню" : "Свернуть меню"}
          >
            <Icon name="menu" size={16} /><span>Свернуть</span>
          </button>
        </div>
      </aside>

      <main className={`np-main ${profileAreaOpen ? "np-main--profile-area" : ""}`}>
        {activeNav === "kb" ? (
          <KnowledgeBase
            onOpenChat={(q) => openWith(q)}
            onAreaViewChange={setProfileAreaOpen}
            rootRequest={knowledgeBaseRootRequest}
          />
        ) : (
        <div className="np-page-container">
        <h1 className="np-hello">
          — Привет, Кирилл! Меня зовут <span className="np-grad">Норм.</span><br/>
          Я твой <span className="np-grad">виртуальный помощник.</span>
        </h1>

        <div className="np-search" onClick={() => openWith(null)}>
          <Icon name="clip" size={18} />
          <span className="np-search-placeholder">Я твой ИИ помощник</span>
        </div>

        <div className="np-quick">
          <button className="np-quick-btn" onClick={() => openWith(null)}>
            <span>Зарегистрировать событие</span>
            <Icon name="arrow" size={16} />
          </button>
          <button className="np-quick-btn" onClick={() => openWith(SCENARIOS.company)}>
            <span>Что ты знаешь о моей компании</span>
            <Icon name="sparkles" size={16} />
          </button>
          <button className="np-quick-btn" onClick={() => openWith(null)}>
            <span>Запросить аналитику</span>
            <Icon name="arrow" size={16} />
          </button>
        </div>

        <section className="np-section">
          <div className="np-sec-head">
            <h2>На что стоит обратить внимание</h2>
            <button
              className="np-link"
              onClick={() => setToast("Полный список фокусных точек появится позже")}
            >
              Смотреть все →
            </button>
          </div>
          <div className="np-focus-wrap">
            {FOCUS_POINTS.map((fp) => (
              <button
                key={fp.id}
                type="button"
                className={`np-focus-card np-focus-card--${fp.tone}`}
                onClick={() => setFocusIdx(FOCUS_POINTS.indexOf(fp))}
              >
                <div className="np-focus-card-top">
                  <span className={`np-focus-type np-focus-type--${fp.tone}`}>{fp.type}</span>
                  <span className="np-focus-area">{fp.area}</span>
                </div>
                <div className={`np-focus-state np-focus-state--${fp.tone}`}>
                  <span className="np-focus-dot" aria-hidden />
                  {fp.state}
                </div>
                <h3 className="np-focus-title">{fp.title}</h3>
                <p className="np-focus-short">{fp.short}</p>
                <div className="np-focus-missing">
                  <span className="np-focus-missing-label">Чего не хватает</span>
                  {fp.missing}
                </div>
                <div className="np-focus-cta">
                  {fp.cta} <Icon name="arrow" size={14} />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="np-section">
          <div className="np-sec-head">
            <h2>Утилизация лимита 🔥</h2>
          </div>
          <div className="np-loss-wrap">
            {[
              { label: "Прямые потери", p: 50, color: "#f5a623" },
              { label: "Косвенные потери", p: 85, color: "#ef6f6c" },
              { label: "Кредитные потери", p: 49, color: "#22c55e" },
            ].map((c) => (
              <div key={c.label} className="np-loss-card">
                <div>
                  <div className="np-loss-label">{c.label}</div>
                  <div className="np-loss-amount"><strong>142 500 ₽</strong> <span className="np-muted">из 1 000 000</span></div>
                  <div className="np-loss-meta">16 320 ₽ за май</div>
                </div>
                <Donut percent={c.p} color={c.color} />
              </div>
            ))}
          </div>
        </section>
        </div>
        )}
      </main>

      {modalOpen && (
        <AssistantModal
          initialQuery={modalQuery}
          onClose={close}
          onToast={(m) => setToast(m)}
        />
      )}
      {focusIdx !== null && (
        <FocusPointModal
          point={FOCUS_POINTS[focusIdx]}
          activeSourceIdx={focusSourceIdx}
          onOpenSource={(i) => setFocusSourceIdx(i)}
          onCloseSource={() => setFocusSourceIdx(null)}
          onClose={() => { setFocusSourceIdx(null); setFocusIdx(null); }}
          onToast={(m) => setToast(m)}
          onDiscuss={(q) => {
            setFocusSourceIdx(null);
            setFocusIdx(null);
            openWith(q);
          }}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
