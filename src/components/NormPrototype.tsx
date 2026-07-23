import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/norm-prototype.css";
import KnowledgeBase from "./KnowledgeBase";
import RiskObjectsChart, { RiskLossCards } from "./RiskObjectsChart";
import { SourceDrawer, focusSourceToUni } from "./SourceDrawer";

const LOSS_METRICS = {
  actual: { value: null as number | null, limitUsage: null as number | null, limitValue: null as number | null },
  forecast: { value: null as number | null, delta: null as number | null },
};

const EVENT_WIDGETS = [
  {
    id: "in-progress",
    tone: "violet" as const,
    title: "У тебя в работе",
    text: "Не завершена работа над несколькими событиями.",
    cta: "103 события",
  },
  {
    id: "new-tasks",
    tone: "yellow" as const,
    title: "Появились новые задачи",
    text: "Эти события требуют утверждения риск-менеджером.",
    cta: "103 события",
  },
];

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

type RiskFilter = "all" | "new" | "high" | "reassessed";

interface FocusSource {
  id?: string;
  type: string;
  title: string;
  date?: string;
  excerpt: string;
  relation: string;
  document?: {
    fileName: string;
    mimeType?: string;
    fileSize?: string;
    updatedAt?: string;
    downloadUrl?: string;
  };
  quote?: string;
  locator?: {
    page?: number;
    section?: string;
    sheet?: string;
    range?: string;
  };
  provider?: string;
  domain?: string;
  url?: string;
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
  situation: string;
  cause: string;
  businessImpact: string;
  recommendations: FocusRecommendation[];
  checkpoint: FocusCheckpoint;
  clarification: string;
  clarificationValue: string;
  clarificationChatQuestion: string;
  related: string[];
  relatedRisk: {
    id: string;
    title: string;
    level: string;
    levelTone: "high" | "medium" | "low";
    status: string;
  };
  relatedOther: string[];
  sources: FocusSource[];
  primaryAction: string;
  secondaryActions: string[];
  chatQuestion: string;
  signalDate: string;
}

interface FocusRecommendation {
  stage: string;
  action: string;
  expectedEffect: string;
}

interface FocusCheckpoint {
  condition: string;
  response: string;
}

const FOCUS_POINTS: FocusPoint[] = [
  {
    id: "fp-delivery",
    type: "Внешний сигнал",
    area: "Клиенты и продукты",
    state: "Стоит проверить",
    tone: "attention",
    title: "Бесплатная доставка конкурента может увеличить отток",
    short: "Конкурент изменил условия в 12 городах, а стоимость доставки уже входит в число частых причин отказа.",
    missing: "Не хватает данных об активных клиентах в этих городах.",
    cta: "Оценить влияние",
    impact: "сильное",
    impactTone: "strong",
    confidence: "средняя",
    situation: "Конкурент запустил бесплатную доставку в 12 городах присутствия компании. Стоимость доставки уже является одной из частых причин отказа от заказа, поэтому это обоснованный ранний сигнал возможного оттока. Фактическое снижение клиентской активности пока не подтверждено.",
    cause: "Предложение конкурента устраняет барьер, который уже влияет на решения клиентов компании. Наиболее уязвимы клиенты с небольшим средним чеком и высокой чувствительностью к стоимости доставки. Чем выше их доля в пересекающихся городах, тем заметнее может быть эффект.",
    businessImpact: "В первую очередь могут снизиться конверсия в заказ и число повторных покупок в затронутых городах. Если реагировать только после появления общего оттока, будет сложнее определить его причину, а часть клиентов уже успеет перейти к конкуренту.",
    recommendations: [
      {
        stage: "Сейчас",
        action: "Включить отдельный мониторинг конверсии, повторных заказов, отмен и обращений о стоимости доставки в 12 затронутых городах.",
        expectedEffect: "Компания раньше заметит локальное ухудшение и сможет отделить влияние предложения конкурента от общих изменений клиентской активности.",
      },
      {
        stage: "Следующий шаг",
        action: "Определить количество активных клиентов, выручку и средний чек по городам, затем выбрать 3–5 наиболее значимых городов для контролируемого теста.",
        expectedEffect: "Компания сосредоточит ресурсы на наиболее уязвимых регионах и не будет распространять затратную меру сразу на всю сеть.",
      },
      {
        stage: "Тест",
        action: "Проверить в выбранных городах бесплатную доставку от определённой суммы или персональное предложение клиентам с повышенным риском ухода.",
        expectedEffect: "Тест покажет, способно ли изменение условий удержать клиентов и компенсирует ли дополнительная выручка стоимость доставки.",
      },
    ],
    checkpoint: {
      condition: "В затронутых городах растёт число отказов из-за стоимости доставки либо снижаются конверсия и повторные покупки относительно сопоставимых городов.",
      response: "Расширить успешную механику удержания на другие уязвимые города и переоценить риск снижения клиентской активности.",
    },
    clarification: "Количество активных клиентов, выручка и средний чек в 12 затронутых городах.",
    clarificationValue: "Данные нужны для оценки возможных потерь и выбора городов для теста. Запустить мониторинг можно уже сейчас, не дожидаясь полного расчёта.",
    clarificationChatQuestion: "Хочу уточнить данные об активных клиентах, выручке и среднем чеке в 12 городах, где конкурент запустил бесплатную доставку",
    related: [
      "риск «Снижение клиентской активности»",
      "продукт «Экспресс-доставка»",
      "12 городов присутствия",
    ],
    relatedRisk: {
      id: "QNR-0187",
      title: "Снижение клиентской активности",
      level: "Средний",
      levelTone: "medium",
      status: "Действующий",
    },
    relatedOther: [
      "Продукт · Экспресс-доставка",
      "География · 12 городов присутствия",
    ],
    sources: [
      { type: "Внешняя новость", title: "Конкурент запускает бесплатную доставку в 12 городах", date: "12 июля 2026", excerpt: "Крупный игрок объявил о бесплатной доставке во всех городах-миллионниках без ограничения по сумме заказа.", relation: "Основной внешний триггер: именно это изменение может повлиять на решения клиентов о заказе.", provider: "Ведомости", domain: "vedomosti.ru", url: "https://www.vedomosti.ru/business/news/2026/07/12/free-delivery" },
      { type: "Профиль компании", title: "География присутствия компании", date: "актуально на 1 июля 2026", excerpt: "Компания представлена в 34 городах России, в 12 из них — прямое пересечение с зоной действия акции.", relation: "Позволяет определить регионы, где новое предложение конкурента будет заметно клиентам." },
      { type: "Аналитика", title: "Причины отказа от заказа, июнь 2026", date: "июнь 2026", excerpt: "Стоимость доставки — вторая по частоте причина отмены заказа после длительной доставки.", relation: "Показывает, что цена доставки уже сейчас чувствительна для клиентов." },
      { type: "Реестр рисков", title: "Снижение клиентской активности", excerpt: "Риск среднего уровня, оценивается ежеквартально.", relation: "Возможные последствия сценария оцениваются в рамках этого риска." },
    ],
    primaryAction: "Передать данные",
    secondaryActions: ["Обсудить с Нормом"],
    chatQuestion: "Помоги оценить, как бесплатная доставка конкурента может повлиять на отток клиентов",
    signalDate: "12 июля 2026",
  },
  {
    id: "fp-supply",
    type: "Связь событий",
    area: "Партнёры и поставки",
    state: "Требует внимания",
    tone: "warning",
    title: "Задержки поставок начинают влиять на наличие товаров",
    short: "Три поставщика повторно нарушили сроки, а доля отсутствующих товаров за месяц выросла на 18%.",
    missing: "Не подтверждено, что для этих поставщиков предусмотрена быстрая замена.",
    cta: "Проверить зависимость",
    impact: "сильное",
    impactTone: "strong",
    confidence: "высокая",
    situation: "Пять из семи задержек за последний месяц пришлись на трёх поставщиков. За тот же период доля отсутствующих товаров выросла с 6% до 24%. Это уже не отдельные инциденты, а устойчивая проблема, влияющая на доступность ассортимента.",
    cause: "Задержки концентрируются у одних и тех же контрагентов, а подтверждённого плана быстрого переключения на резервных поставщиков нет. Поэтому отклонения накапливаются и превращаются в дефицит товаров.",
    businessImpact: "Ситуация уже может снижать продажи и ухудшать клиентский опыт. Наибольшая угроза возникает, если эти поставщики обеспечивают критичный или высокомаржинальный ассортимент без быстрой замены. При дальнейшем ухудшении проблема может привести к нарушению непрерывности продаж.",
    recommendations: [
      {
        stage: "Сейчас",
        action: "Определить критичные товары и объём продаж, зависящие от трёх проблемных поставщиков, и приоритетно распределить доступные остатки.",
        expectedEffect: "Компания сократит ближайшие потери продаж и сохранит доступность наиболее значимого ассортимента.",
      },
      {
        stage: "В течение 3 дней",
        action: "Подтвердить резервных поставщиков, сроки переключения и возможное удорожание закупки. Если резерва нет — начать ускоренный подбор.",
        expectedEffect: "Появится готовый сценарий замены, который уменьшит длительность дефицита при следующей задержке.",
      },
      {
        stage: "Параллельно",
        action: "Запросить у поставщиков планы восстановления поставок и применить предусмотренные договорами требования по SLA.",
        expectedEffect: "Это повысит вероятность быстрого восстановления поставок и позволит компенсировать часть последствий нарушения сроков.",
      },
      {
        stage: "Управленческое решение",
        action: "Разрешить временное увеличение закупочной или логистической стоимости для критичного ассортимента, если оно ниже ожидаемой потери продаж.",
        expectedEffect: "Компания сможет сохранить выручку и клиентскую доступность товаров даже при более дорогом резервном сценарии.",
      },
    ],
    checkpoint: {
      condition: "Для критичных товаров отсутствует подтверждённый резерв либо срок переключения превышает период, на который хватит текущих остатков.",
      response: "Эскалировать ситуацию владельцу риска, утвердить альтернативную закупку и актуализировать оценку риска непрерывности поставок.",
    },
    clarification: "Доля поставок каждого контрагента, перечень критичных товаров, текущие остатки и фактический срок перехода на резерв.",
    clarificationValue: "Данные позволят оценить масштаб возможной потери продаж и определить допустимый бюджет альтернативной закупки. Поиск резерва не должен откладываться до завершения расчёта.",
    clarificationChatQuestion: "Хочу уточнить долю поставок контрагентов, критичные товары, текущие остатки и сроки перехода на резервных поставщиков",
    related: [
      "риск «Нарушение непрерывности поставок»",
      "три инцидента с задержкой",
      "поставщики «Альфа Фуд», «Север Трейд» и «Фреш Лайн»",
      "показатель доступности товаров",
    ],
    relatedRisk: {
      id: "QNR-0214",
      title: "Нарушение непрерывности поставок",
      level: "Высокий",
      levelTone: "high",
      status: "Действующий",
    },
    relatedOther: [
      "Поставщики · «Альфа Фуд», «Север Трейд», «Фреш Лайн»",
      "Инциденты · 3 задержки за месяц",
      "Показатель · Доступность товаров",
    ],
    sources: [
      { type: "Инциденты", title: "Инциденты поставок за июнь 2026", date: "июнь 2026", excerpt: "Зафиксировано 7 задержек, из них 5 — по трём ключевым поставщикам.", relation: "Показывает повторяемость и концентрацию задержек у одних и тех же контрагентов." },
      { type: "Аналитика", title: "Доступность ассортимента по неделям", date: "июнь–июль 2026", excerpt: "Доля отсутствующих SKU выросла с 6% до 24% за 4 недели.", relation: "Демонстрирует связь задержек с ухудшением наличия товаров." },
      { type: "Профиль компании", title: "Договоры с ключевыми поставщиками", excerpt: "В контрактах указаны SLA по срокам, но нет явного плана замены.", relation: "Помогает понять, есть ли у компании формальный резерв." },
      { type: "Реестр рисков", title: "Нарушение непрерывности поставок", excerpt: "Риск высокого уровня. Текущая динамика подтверждает необходимость оперативно проверить зависимость от поставщиков и возможный масштаб потерь.", relation: "Именно этот риск может измениться по итогам проверки." },
    ],
    primaryAction: "Проверить резервных поставщиков",
    secondaryActions: ["Обсудить с Нормом"],
    chatQuestion: "Помоги проверить зависимость от поставщиков с повторяющимися задержками",
    signalDate: "18 июля 2026",
  },
  {
    id: "fp-it",
    type: "Положительное изменение",
    area: "ИТ и непрерывность",
    state: "Есть улучшение",
    tone: "positive",
    title: "После новой меры число критичных сбоев снизилось",
    short: "После подключения дополнительного мониторинга число критичных ошибок снизилось на 37%.",
    missing: "Для уверенного вывода нужен более длинный период наблюдения.",
    cta: "Посмотреть результат",
    impact: "положительное",
    impactTone: "positive",
    confidence: "средняя",
    situation: "После подключения дополнительного мониторинга число критичных ошибок снизилось на 37%, а массовые сбои не повторялись 21 день. Это хороший ранний результат, но период наблюдения пока недостаточен для окончательного подтверждения эффективности меры.",
    cause: "Новая система позволяет раньше обнаруживать отклонения и реагировать до того, как они перерастут в массовый сбой. При этом часть улучшения может быть связана с изменением нагрузки, релизами или особенностями регистрации инцидентов.",
    businessImpact: "Если эффект подтвердится, компания сможет снизить вероятность остановки онлайн-расчётов и ожидаемые потери от сбоев. Преждевременное снижение оценки риска, напротив, может создать ложное ощущение защищённости.",
    recommendations: [
      {
        stage: "Сейчас",
        action: "Сохранить дополнительный мониторинг и текущий уровень контроля, не ослабляя остальные защитные механизмы.",
        expectedEffect: "Достигнутое улучшение сохранится, пока компания накапливает достаточные данные для окончательного решения.",
      },
      {
        stage: "Проверка эффекта",
        action: "Сравнить минимум 30 дней до и после внедрения при сопоставимой нагрузке и отдельно проверить работу системы в пиковый период.",
        expectedEffect: "Компания сможет отделить реальный эффект меры от временного снижения нагрузки и других изменений в ИТ-системе.",
      },
      {
        stage: "После подтверждения",
        action: "Пересчитать остаточный риск и оценить возможность переноса аналогичного мониторинга на другие критичные ИТ-системы.",
        expectedEffect: "Подтверждённая мера снизит ожидаемые потери по текущему риску и даст компании готовый способ усилить защиту других систем.",
      },
    ],
    checkpoint: {
      condition: "Завершены 30 дней наблюдения, снижение критичных ошибок сохраняется при сопоставимой и пиковой нагрузке, массовые сбои не повторяются.",
      response: "Признать меру эффективной, актуализировать остаточный риск и подготовить предложение по её масштабированию. Если результат не подтвердится — сохранить текущую оценку риска и проверить другие причины улучшения.",
    },
    clarification: "Сопоставимость нагрузки, изменения в релизах и неизменность правил регистрации критичных ошибок.",
    clarificationValue: "Эти данные нужны, чтобы доказать причинную связь между новой мерой и снижением числа сбоев, а не принять временное совпадение за устойчивый результат.",
    clarificationChatQuestion: "Хочу уточнить нагрузку, изменения в релизах и правила регистрации критичных ошибок, чтобы проверить эффективность новой меры",
    related: [
      "мера «Дополнительный мониторинг онлайн-расчётов»",
      "риск «Массовые сбои в системе онлайн-расчётов»",
      "история связанных инцидентов",
    ],
    relatedRisk: {
      id: "QNR-0331",
      title: "Массовые сбои в системе онлайн-расчётов",
      level: "Высокий",
      levelTone: "high",
      status: "Под контролем",
    },
    relatedOther: [
      "Мера · Дополнительный мониторинг онлайн-расчётов",
      "Инциденты · история связанных сбоев",
    ],
    sources: [
      { type: "Отчёт", title: "Отчёт мониторинга ИТ-систем", date: "июль 2026", excerpt: "Снижение количества критичных ошибок на 37% за последние 3 недели.", relation: "Основные числовые данные для оценки эффекта меры." },
      { type: "Мера", title: "Дополнительный мониторинг онлайн-расчётов", excerpt: "Мера внедрена 30 июня 2026, включает автоматические алерты и еженедельный обзор.", relation: "Именно эта мера могла привести к наблюдаемому улучшению." },
      { type: "Инциденты", title: "Журнал инцидентов за июнь–июль 2026", date: "июнь–июль 2026", excerpt: "После 30 июня массовых сбоев не зарегистрировано.", relation: "Подтверждает отсутствие повторных инцидентов в период наблюдения." },
    ],
    primaryAction: "Открыть меру",
    secondaryActions: ["Обсудить с Нормом"],
    chatQuestion: "Покажи, как новая мера повлияла на количество ИТ-сбоев",
    signalDate: "21 июля 2026",
  },
];

// assign stable ids to focus sources and build a lookup index
FOCUS_POINTS.forEach((fp) => {
  fp.sources.forEach((s, i) => {
    if (!s.id) s.id = `${fp.id}-s${i}`;
  });
});
const SOURCES_INDEX: Record<string, FocusSource> = {};
FOCUS_POINTS.forEach((fp) => fp.sources.forEach((s) => { SOURCES_INDEX[s.id!] = s; }));

// extra state-of-knowledge sources used only in the gap section of the summary
const GAP_SOURCES: Record<string, FocusSource> = {
  "gap-sales": {
    id: "gap-sales",
    type: "Состояние знаний",
    title: "Продажи и маржинальность критичных товаров",
    excerpt:
      "Актуальные данные о продажах и марже по SKU, попавшим в дефицит, пока не загружены. Норм не может рассчитать фактический объём упущенной выручки и потерянной маржи из-за задержек поставок.",
    relation:
      "Отсутствие этого источника не позволяет перевести операционный сигнал (доля отсутствующих товаров) в денежную оценку последствий.",
  },
  "gap-suppliers": {
    id: "gap-suppliers",
    type: "Состояние знаний",
    title: "Готовность резервных поставщиков",
    excerpt:
      "Формальный статус резервных поставщиков по трём проблемным контрагентам не подтверждён: нет данных о согласованных объёмах, сроках переключения и коммерческих условиях.",
    relation:
      "Без подтверждённой готовности резерва нельзя оценить, насколько быстро компания сможет закрыть дефицит при следующей задержке.",
  },
  "gap-customers": {
    id: "gap-customers",
    type: "Состояние знаний",
    title: "Клиентская активность в 12 городах",
    excerpt:
      "Оперативных данных о конверсии, повторных заказах и активности клиентов в 12 городах, где конкурент запустил бесплатную доставку, пока недостаточно.",
    relation:
      "Без этих данных возможный отток остаётся ранним сигналом, а не подтверждённым эффектом.",
  },
};
Object.assign(SOURCES_INDEX, GAP_SOURCES);

// Extra sources used by risk-level Norm verdicts that don't come from a
// focus point. Registered into the same SOURCES_INDEX so the universal
// SourceDrawer can resolve them.
const RISK_VERDICT_SOURCES: Record<string, FocusSource> = {
  "risk-gpu-product-announce": {
    id: "risk-gpu-product-announce",
    type: "Профиль компании",
    title: "Анонс запуска системы AI-рекомендаций товаров",
    date: "актуально на 24 сентября 2025",
    excerpt:
      "Компания анонсировала запуск системы AI-рекомендаций товаров на публичном сайте.",
    relation:
      "Подтверждает, что запуск AI-продукта запланирован и завязан на достаточные GPU-мощности.",
  },
  "risk-gpu-shortage-report": {
    id: "risk-gpu-shortage-report",
    type: "Отчёт",
    title: "Отчёт по загрузке GPU-инфраструктуры на 2026",
    date: "январь 2026",
    excerpt:
      "На начало 2026 года фиксируется дефицит вычислительных мощностей GPU для инференса моделей.",
    relation:
      "Показывает, что доступных мощностей может не хватить для запуска нового AI-продукта.",
  },
  "risk-gpu-key-clients": {
    id: "risk-gpu-key-clients",
    type: "Профиль компании",
    title: "Ключевые клиенты AI-продукта",
    excerpt:
      "Ядро аудитории AI-рекомендаций — активные жители мегаполисов и офисные сотрудники, чувствительные к качеству персонализации.",
    relation:
      "Позволяет оценить, кого затронут сбои или задержки запуска продукта.",
  },
};
Object.assign(SOURCES_INDEX, RISK_VERDICT_SOURCES);

// Decorate a subset of sources with document / quote / locator so the unified
// source card can show honest document cards or system-object cards.
const SOURCE_DECORATIONS: Record<string, Partial<FocusSource>> = {
  "fp-supply-s0": {
    document: {
      fileName: "Инциденты поставок за июнь 2026.xlsx",
      mimeType: "XLSX",
      fileSize: "84 КБ",
      updatedAt: "1 июля 2026",
    },
    quote: "Пять из семи зарегистрированных задержек связаны с поставщиками «Альфа Фуд», «Север Трейд» и «Фреш Лайн».",
    locator: { sheet: "Инциденты", range: "18–24" },
  },
  "fp-supply-s1": {
    document: {
      fileName: "Доступность ассортимента, неделя 22–29.xlsx",
      mimeType: "XLSX",
      fileSize: "62 КБ",
      updatedAt: "20 июля 2026",
    },
    quote: "Доля отсутствующих товаров выросла с 6% до 24% за четыре недели.",
    locator: { sheet: "Weekly", range: "3–7" },
  },
  "fp-it-s0": {
    document: {
      fileName: "Отчёт ИТ-мониторинга, июль 2026.pdf",
      mimeType: "PDF",
      fileSize: "1,2 МБ",
      updatedAt: "21 июля 2026",
    },
    quote: "Количество критичных ошибок за три недели снизилось на 37% относительно предыдущего периода.",
    locator: { section: "Раздел 2. Динамика инцидентов" },
  },
  "fp-it-s2": {
    document: {
      fileName: "Журнал инцидентов, июнь–июль 2026.csv",
      mimeType: "CSV",
      fileSize: "210 КБ",
      updatedAt: "21 июля 2026",
    },
    quote: "После 30 июня 2026 массовых сбоев не зарегистрировано.",
    locator: { section: "Фильтр: severity=critical" },
  },
  "fp-delivery-s0": {
    quote: "«С 12 июля 2026 бесплатная доставка распространяется на все города-миллионники без ограничения по сумме заказа».",
    locator: { section: "Пресс-релиз конкурента, 12 июля 2026" },
  },
  "fp-delivery-s2": {
    document: {
      fileName: "Причины отказа от заказа, июнь 2026.xlsx",
      mimeType: "XLSX",
      fileSize: "48 КБ",
      updatedAt: "1 июля 2026",
    },
    quote: "Стоимость доставки — вторая по частоте причина отмены заказа (17,4%).",
    locator: { sheet: "Причины", range: "5–9" },
  },
};
Object.entries(SOURCE_DECORATIONS).forEach(([id, dec]) => {
  const s = SOURCES_INDEX[id];
  if (s) Object.assign(s, dec);
});

// Recipients directory used by the ShareDrawer. Static demo data.
interface Recipient {
  id: string;
  name: string;
  role: string;
  dept: string;
  initials: string;
}
const RECIPIENTS: Recipient[] = [
  { id: "r1", name: "Алексей Смирнов", role: "Владелец процесса поставок", dept: "Закупки", initials: "АС" },
  { id: "r2", name: "Ирина Ковалёва", role: "Ответственный за риск QNR-0214", dept: "Управление рисками", initials: "ИК" },
  { id: "r3", name: "Дмитрий Орлов", role: "Категорийный менеджер по поставщикам", dept: "Закупки", initials: "ДО" },
  { id: "r4", name: "Ольга Никитина", role: "Руководитель клиентской аналитики", dept: "Маркетинг и клиенты", initials: "ОН" },
  { id: "r5", name: "Павел Крылов", role: "Владелец продукта «Экспресс-доставка»", dept: "Продукт", initials: "ПК" },
  { id: "r6", name: "Мария Титова", role: "Владелец ИТ-сервиса онлайн-расчётов", dept: "ИТ", initials: "МТ" },
  { id: "r7", name: "Сергей Львов", role: "Ответственный за меру дополнительного мониторинга", dept: "ИТ", initials: "СЛ" },
  { id: "r8", name: "Наталья Гусева", role: "Владелец риска QNR-0331", dept: "Управление рисками", initials: "НГ" },
];

function pickSuggested(kind: "summary" | "fp-delivery" | "fp-supply" | "fp-it"): { id: string; reason: string }[] {
  switch (kind) {
    case "fp-supply":
      return [
        { id: "r1", reason: "Владелец процесса поставок" },
        { id: "r2", reason: "Ответственный за риск QNR-0214" },
        { id: "r3", reason: "Отвечает за работу с поставщиками" },
      ];
    case "fp-delivery":
      return [
        { id: "r5", reason: "Владелец продукта «Экспресс-доставка»" },
        { id: "r4", reason: "Отвечает за клиентскую аналитику" },
      ];
    case "fp-it":
      return [
        { id: "r6", reason: "Владелец ИТ-сервиса" },
        { id: "r7", reason: "Ответственный за меру мониторинга" },
        { id: "r8", reason: "Владелец риска QNR-0331" },
      ];
    case "summary":
    default:
      return [
        { id: "r1", reason: "Владелец процесса поставок" },
        { id: "r2", reason: "Ответственный за риск QNR-0214" },
        { id: "r4", reason: "Отвечает за клиентскую аналитику" },
        { id: "r6", reason: "Владелец ИТ-сервиса онлайн-расчётов" },
      ];
  }
}

interface SummarySourceRef {
  sourceId: string;
  label: string;
  supportedClaim: string;
}
interface SummarySection {
  id: "decision" | "check" | "watch" | "gaps";
  title: string;
  tone: "orange" | "blue" | "green" | "neutral";
  headline: string;
  text: string;
  shortText?: string;
  actionLabel?: string;
  actionText?: string;
  sources: SummarySourceRef[];
  focusPointId?: string;
  focusPointLabel?: string;
  showClarifyButton?: boolean;
}
interface CompanySummary {
  updatedAt: string;
  leadTitle: string;
  leadHeadline: string;
  leadText: string;
  requiredDecision: string;
  secondaryStatuses: {
    tone: "blue" | "green";
    label: string;
    text: string;
  }[];
  sections: SummarySection[];
  discussQuestion: string;
  clarificationQuestion: string;
  meta: {
    period: string;
    incidents: { value: number; label: string };
    externalSignals: { value: number; label: string };
    improvingMeasures: { value: number; label: string };
    highRisks: { value: number; label: string };
    risksWithoutMeasures: { value: number; label: string };
    sourcesUsed: number;
    knowledgeGaps: number;
    updatedAtShort: string;
  };
}

const COMPANY_SUMMARY: CompanySummary = {
  updatedAt: "Актуально на 22 июля 2026, 09:30",
  discussQuestion:
    "Хочу обсудить текущую ситуацию в компании и понять, на что обратить внимание в первую очередь",
  clarificationQuestion:
    "Помоги уточнить данные о продажах критичных товаров, готовности резервных поставщиков и клиентской активности в 12 затронутых городах",
  leadTitle: "Главное за 30 сек",
  leadHeadline: "Ситуация требует внимания",
  leadText:
    "За последние 30 дней основное ухудшение связано с поставками: доля отсутствующих товаров выросла с 6% до 24%. В компании 18 высоких рисков, 6 из них без эффективных мер. Есть новый сигнал возможного оттока клиентов, а по ИТ-сбоям появилась положительная динамика. Возможные финансовые последствия пока не рассчитаны.",
  requiredDecision: "подтвердить резервный сценарий поставок.",
  secondaryStatuses: [
    { tone: "blue", label: "Проверить", text: "есть сигнал возможного оттока клиентов" },
    { tone: "green", label: "Наблюдать", text: "по ИТ-сбоям появилась положительная динамика" },
  ],
  sections: [
    {
      id: "decision",
      title: "Решить сейчас",
      tone: "orange",
      headline: "Нужен резервный сценарий поставок",
      text: "Пять из семи задержек за последний месяц пришлись на трёх поставщиков. За тот же период доля отсутствующих товаров выросла с 6% до 24%. Возможный объём потерь продаж пока не рассчитан.",
      shortText:
        "Задержки поставок влияют на наличие товаров. Рост отсутствующих позиций: с 6% до 24%.",
      actionLabel: "Что нужно сделать",
      actionText:
        "подтвердить резервных поставщиков и сроки переключения по трём проблемным контрагентам.",
      sources: [
        {
          sourceId: "fp-supply-s0",
          label: "Инциденты поставок",
          supportedClaim:
            "За последний месяц пять из семи задержек пришлись на трёх поставщиков.",
        },
        {
          sourceId: "fp-supply-s1",
          label: "Аналитика ассортимента",
          supportedClaim:
            "За тот же период доля отсутствующих товаров выросла с 6% до 24%.",
        },
        {
          sourceId: "fp-supply-s2",
          label: "Профиль · Поставщики",
          supportedClaim:
            "Три поставщика, на которых пришлись повторные задержки, входят в список ключевых контрагентов компании.",
        },
        {
          sourceId: "fp-supply-s3",
          label: "Риск QNR-0214",
          supportedClaim:
            "Риск задержек поставок оценён как высокий во всех связанных материалах.",
        },
      ],
      focusPointId: "fp-supply",
      focusPointLabel: "Нужен резервный сценарий поставок",
    },
    {
      id: "check",
      title: "Проверить",
      tone: "blue",
      headline: "Возможный отток клиентов в 12 городах",
      text: "Конкурент запустил бесплатную доставку в 12 городах присутствия компании. Стоимость доставки уже входит в число частых причин отказа от заказа. Поэтому есть сигнал возможного оттока, но снижение конверсии и повторных заказов пока не подтверждено.",
      shortText: "Возможный отток клиентов в 12 городах.",
      actionLabel: "Что проверить",
      actionText:
        "клиентскую активность и конверсию в затронутых городах.",
      sources: [
        {
          sourceId: "fp-delivery-s0",
          label: "Внешняя новость",
          supportedClaim:
            "Конкурент запустил бесплатную доставку в 12 городах присутствия компании.",
        },
        {
          sourceId: "fp-delivery-s2",
          label: "Аналитика отказов",
          supportedClaim:
            "Стоимость доставки уже входит в число частых причин отказа от заказа.",
        },
        {
          sourceId: "fp-delivery-s1",
          label: "Профиль · География",
          supportedClaim:
            "12 городов, где конкурент запустил акцию, — это города присутствия компании.",
        },
      ],
      focusPointId: "fp-delivery",
      focusPointLabel: "Возможный отток клиентов в 12 городах",
    },
    {
      id: "watch",
      title: "Наблюдать",
      tone: "green",
      headline: "Результат ИТ-меры выглядит положительно",
      text: "После подключения дополнительного мониторинга число критичных ошибок снизилось на 37%, а массовые сбои не повторялись 21 день. Это хороший ранний результат, но период наблюдения пока слишком короткий, чтобы подтвердить эффективность меры и снизить оценку риска.",
      shortText:
        "Критичные ИТ-ошибки снизились на 37%, массовых сбоев не было 21 день.",
      actionLabel: "Решение сейчас не требуется",
      actionText:
        "продолжить наблюдение и проверить результат при сопоставимой и пиковой нагрузке.",
      sources: [
        {
          sourceId: "fp-it-s0",
          label: "Отчёт ИТ-мониторинга",
          supportedClaim:
            "После подключения дополнительного мониторинга число критичных ошибок снизилось на 37%.",
        },
        {
          sourceId: "fp-it-s1",
          label: "Мера · Дополнительный мониторинг",
          supportedClaim:
            "Дополнительный мониторинг подключён как мера снижения ИТ-риска.",
        },
        {
          sourceId: "fp-it-s2",
          label: "Журнал ИТ-инцидентов",
          supportedClaim:
            "Массовые сбои не повторялись 21 день по данным журнала инцидентов.",
        },
      ],
      focusPointId: "fp-it",
      focusPointLabel: "Результат ИТ-меры выглядит положительно",
    },
    {
      id: "gaps",
      title: "Не хватает данных",
      tone: "neutral",
      headline: "Финансовые последствия пока нельзя оценить точно",
      text: "Норму не хватает данных о продажах критичных товаров, готовности резервных поставщиков и клиентской активности в 12 затронутых городах.",
      sources: [
        {
          sourceId: "gap-sales",
          label: "Продажи и маржинальность критичных товаров",
          supportedClaim:
            "Данных о продажах и марже критичных товаров пока недостаточно для оценки потерь.",
        },
        {
          sourceId: "gap-suppliers",
          label: "Готовность резервных поставщиков",
          supportedClaim:
            "Готовность резервных поставщиков по трём проблемным контрагентам пока не подтверждена.",
        },
        {
          sourceId: "gap-customers",
          label: "Клиентская активность в 12 городах",
          supportedClaim:
            "Оперативных данных о клиентской активности в 12 затронутых городах пока недостаточно.",
        },
      ],
      showClarifyButton: true,
    },
  ],
  meta: {
    period: "30 дней",
    incidents: { value: 7, label: "инцидентов поставок" },
    externalSignals: { value: 1, label: "новый внешний сигнал" },
    improvingMeasures: { value: 1, label: "мера показывает улучшение" },
    highRisks: { value: 18, label: "высоких рисков" },
    risksWithoutMeasures: { value: 6, label: "без эффективных мер" },
    sourcesUsed: 10,
    knowledgeGaps: 3,
    updatedAtShort: "22 июля 2026, 09:30",
  },
};

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
    if (l.includes("задержки поставок")) return runSummarySupplies();
    if (l.includes("риск оттока")) return runSummaryChurn();
    if (l.includes("ит-мер") || l.includes("ит меры") || l.includes("результат ит")) return runSummaryIt();
    onToast("Этот переход будет добавлен позже");
  }

  async function runSituationDiscussion() {
    setBusy(true);
    push({ role: "status", text: "Собираю картину по трём направлениям" });
    await wait(800);
    replaceStatus("Сверяю приоритеты");
    await wait(700);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>Сейчас больше всего внимания требуют поставки: повторные задержки уже влияют на наличие товаров. Параллельно стоит проверить возможный отток клиентов и продолжить наблюдение за новой ИТ-мерой.</p>
          <p>С чего начнём?</p>
        </>
      ),
    });
    push({
      role: "actions",
      actions: [
        { label: "Разобрать задержки поставок", onClick: () => continueDialog("Разобрать задержки поставок") },
        { label: "Проверить риск оттока", onClick: () => continueDialog("Проверить риск оттока") },
        { label: "Оценить результат ИТ-меры", onClick: () => continueDialog("Оценить результат ИТ-меры") },
      ],
    });
    setBusy(false);
  }

  async function runSummaryClarify() {
    setBusy(true);
    push({ role: "status", text: "Формулирую запрос" });
    await wait(700);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <p>Чтобы дополнить картину, мне нужны три группы данных: продажи и маржинальность критичных товаров, резервные поставщики и сроки переключения, а также клиентская активность в затронутых городах. Ты можешь написать информацию здесь или прикрепить документ.</p>
      ),
    });
    setBusy(false);
  }

  async function runSummarySupplies() {
    setBusy(true);
    push({ role: "status", text: "Смотрю ситуацию с поставками" });
    await wait(700);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>Три поставщика — «Альфа Фуд», «Север Трейд» и «Фреш Лайн» — повторно нарушили сроки. За месяц доля отсутствующих товаров выросла с 6% до 24%.</p>
          <p>В первую очередь стоит определить критичные товары, зависящие от этих контрагентов, и подтвердить готовность резервных поставщиков.</p>
        </>
      ),
    });
    setBusy(false);
  }

  async function runSummaryChurn() {
    setBusy(true);
    push({ role: "status", text: "Проверяю сигнал по оттоку" });
    await wait(700);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>Конкурент запустил бесплатную доставку в 12 городах присутствия. Стоимость доставки уже входит в число частых причин отказа от заказа, поэтому это обоснованный ранний сигнал.</p>
          <p>Пока фактическое снижение конверсии и повторных заказов не подтверждено — нужен локальный мониторинг по этим городам.</p>
        </>
      ),
    });
    setBusy(false);
  }

  async function runSummaryIt() {
    setBusy(true);
    push({ role: "status", text: "Смотрю на динамику ИТ-сбоев" });
    await wait(700);
    removeStatus();
    push({
      role: "assistant",
      rich: (
        <>
          <p>После подключения дополнительного мониторинга число критичных ошибок снизилось на 37%, а массовые сбои не повторялись 21 день.</p>
          <p>Результат обнадёживает, но период наблюдения пока короткий. Прежде чем снижать оценку риска, стоит подтвердить эффект при сопоставимой и пиковой нагрузке.</p>
        </>
      ),
    });
    setBusy(false);
  }

  function dispatch(text: string) {
    const t = text.trim();
    push({ role: "user", text: t });
    const n = t.toLowerCase().replace(/[?!.,]/g, "").trim();
    if (n.includes("текущую ситуацию в компании")) runSituationDiscussion();
    else if (n.includes("продажах критичных товаров")) runSummaryClarify();
    else if (n.includes("ген") && n.includes("директор") && n.includes("самиздат")) runDirector();
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

type ShareKind = "summary" | "fp-delivery" | "fp-supply" | "fp-it";
interface SharePreview {
  status: string;
  statusTone: "orange" | "blue" | "green" | "neutral";
  headline: string;
  action?: string;
  actualAt: string;
  detailLabel?: string;
  onOpenDetail?: () => void;
}
function ShareDrawer({
  kind,
  title,
  preview,
  onClose,
  onSent,
}: {
  kind: ShareKind;
  title: string;
  preview: SharePreview;
  onClose: () => void;
  onSent: (n: number) => void;
}) {
  const suggested = pickSuggested(kind);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [comment, setComment] = useState("");
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  const q = query.trim().toLowerCase();
  const filtered = q
    ? RECIPIENTS.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.role.toLowerCase().includes(q) ||
          r.dept.toLowerCase().includes(q),
      )
    : [];
  const selectedList = RECIPIENTS.filter((r) => selected.has(r.id));
  return (
    <div className="np-share-backdrop" onClick={onClose}>
      <aside
        className="np-share-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="np-share-head">
          <div>
            <div className="np-share-eyebrow">Пересылка</div>
            <h3 className="np-share-title">{title}</h3>
          </div>
          <button className="np-icon-btn" onClick={onClose} aria-label="Закрыть">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="np-share-body">
          <section className="np-share-preview">
            <div className={`np-share-preview-status np-share-preview-status--${preview.statusTone}`}>
              {preview.status}
            </div>
            <div className="np-share-preview-headline">{preview.headline}</div>
            {preview.action && (
              <div className="np-share-preview-action">{preview.action}</div>
            )}
            <div className="np-share-preview-meta">Актуально: {preview.actualAt}</div>
            {preview.detailLabel && preview.onOpenDetail && (
              <button
                type="button"
                className="np-share-preview-link"
                onClick={preview.onOpenDetail}
              >
                {preview.detailLabel} →
              </button>
            )}
          </section>

          <section className="np-share-section">
            <div className="np-share-section-title">Норм предлагает</div>
            <ul className="np-share-list">
              {suggested.map((s) => {
                const r = RECIPIENTS.find((x) => x.id === s.id)!;
                const on = selected.has(r.id);
                return (
                  <li key={r.id} className="np-share-item">
                    <div className="np-share-item-avatar">{r.initials}</div>
                    <div className="np-share-item-main">
                      <div className="np-share-item-name">{r.name}</div>
                      <div className="np-share-item-role">{s.reason}</div>
                    </div>
                    <button
                      type="button"
                      className={`np-share-add ${on ? "is-on" : ""}`}
                      onClick={() => toggle(r.id)}
                    >
                      {on ? "Добавлен" : "Добавить"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="np-share-section">
            <div className="np-share-section-title">Найти участника</div>
            <input
              className="np-share-input"
              placeholder="Имя, роль или подразделение"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {q && (
              <ul className="np-share-list">
                {filtered.length === 0 && (
                  <li className="np-share-empty">Никого не нашлось</li>
                )}
                {filtered.map((r) => {
                  const on = selected.has(r.id);
                  return (
                    <li key={r.id} className="np-share-item">
                      <div className="np-share-item-avatar">{r.initials}</div>
                      <div className="np-share-item-main">
                        <div className="np-share-item-name">{r.name}</div>
                        <div className="np-share-item-role">{r.role} · {r.dept}</div>
                      </div>
                      <button
                        type="button"
                        className={`np-share-add ${on ? "is-on" : ""}`}
                        onClick={() => toggle(r.id)}
                      >
                        {on ? "Добавлен" : "Добавить"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {selectedList.length > 0 && (
            <section className="np-share-section">
              <div className="np-share-section-title">Кому отправить · {selectedList.length}</div>
              <div className="np-share-chips">
                {selectedList.map((r) => (
                  <span key={r.id} className="np-share-chip">
                    {r.name}
                    <button
                      type="button"
                      className="np-share-chip-x"
                      onClick={() => toggle(r.id)}
                      aria-label="Убрать"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="np-share-section">
            <div className="np-share-section-title">Комментарий (необязательно)</div>
            <textarea
              className="np-share-textarea"
              rows={3}
              placeholder="Например: обратите внимание на пункт про резерв"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </section>
        </div>

        <div className="np-share-footer">
          <button
            type="button"
            className="np-share-secondary"
            onClick={() => onSent(-1)}
          >
            Скопировать ссылку
          </button>
          <button
            type="button"
            className="np-btn np-btn-primary np-share-send"
            disabled={selectedList.length === 0}
            onClick={() => onSent(selectedList.length)}
          >
            Отправить {selectedList.length > 0 ? `· ${selectedList.length}` : ""}
          </button>
        </div>
      </aside>
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
  overSummary,
}: {
  point: FocusPoint;
  activeSourceIdx: number | "list" | null;
  onOpenSource: (i: number | "list") => void;
  onCloseSource: () => void;
  onClose: () => void;
  onToast: (m: string) => void;
  onDiscuss: (q: string) => void;
  overSummary?: boolean;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (shareOpen) {
        e.stopPropagation();
        setShareOpen(false);
        return;
      }
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
  }, [activeSourceIdx, onClose, onCloseSource, shareOpen]);

  const handleAction = (label: string) => {
    if (label === "Обсудить с Нормом") {
      onDiscuss(point.chatQuestion);
      return;
    }
    onToast(`«${label}» — этот раздел прототипа пока не реализован`);
  };

  const drawerOpen = activeSourceIdx !== null;
  const selectedIdx = typeof activeSourceIdx === "number" ? activeSourceIdx : null;
  const source = selectedIdx !== null ? point.sources[selectedIdx] : null;
  const previewSources = point.sources.slice(0, 2);
  const remainingSources = Math.max(0, point.sources.length - 2);

  const uniSources = useMemo(
    () => point.sources.map((s) => focusSourceToUni(s)),
    [point.sources],
  );
  const sdActiveId: string | "list" | null = !drawerOpen
    ? null
    : selectedIdx !== null
      ? uniSources[selectedIdx]?.id ?? "list"
      : "list";

  return (
    <div
      className={`np-focus-backdrop${overSummary ? " np-focus-backdrop--over-summary" : ""}`}
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
          </div>
          <h2 className="np-focus-modal-title">{point.title}</h2>
          <button className="np-icon-btn np-focus-close" onClick={onClose} aria-label="Закрыть">
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="np-focus-modal-body">
          <div className="np-focus-col np-focus-col--main">
            <section className="np-focus-island">
              <h4 className="np-focus-island-title">Что происходит</h4>
              <p className="np-focus-island-text">{point.situation}</p>
            </section>
            <section className="np-focus-island">
              <h4 className="np-focus-island-title">Почему это происходит</h4>
              <p className="np-focus-island-text">{point.cause}</p>
            </section>
            <section className="np-focus-island">
              <h4 className="np-focus-island-title">Что это значит для бизнеса</h4>
              <p className="np-focus-island-text">{point.businessImpact}</p>
            </section>
            <section className="np-focus-island">
              <h4 className="np-focus-island-title">Что рекомендую</h4>
              <ol className="np-focus-recommendations">
                {point.recommendations.map((r, i) => (
                  <li key={i} className="np-focus-recommendation">
                    <span className="np-focus-recommendation-stage">{r.stage}</span>
                    <p className="np-focus-recommendation-action">{r.action}</p>
                    <div className="np-focus-recommendation-effect">
                      <div className="np-focus-recommendation-effect-label">
                        <span aria-hidden className="np-focus-recommendation-effect-icon">↗</span>
                        Ожидаемый эффект
                      </div>
                      <p>{r.expectedEffect}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="np-focus-checkpoint">
                <div className="np-focus-checkpoint-label">Контрольная точка</div>
                <p className="np-focus-island-text">{point.checkpoint.condition}</p>
                <div className="np-focus-checkpoint-label">Если условие выполнено</div>
                <p className="np-focus-island-text">{point.checkpoint.response}</p>
              </div>
            </section>
            <section className="np-focus-island">
              <h4 className="np-focus-island-title">Что ещё нужно уточнить для Норма</h4>
              <p className="np-focus-island-text">{point.clarification}</p>
              <div className="np-focus-clarification-value">
                <div className="np-focus-checkpoint-label">Зачем это нужно</div>
                <p className="np-focus-island-text">{point.clarificationValue}</p>
              </div>
              <button
                type="button"
                className="np-btn np-btn-primary np-focus-clarify-btn"
                onClick={() => onDiscuss(point.clarificationChatQuestion)}
              >
                Уточнить знания
              </button>
            </section>
            <section className="np-focus-island">
              <h4 className="np-focus-island-title">Связанные объекты</h4>
              <button
                type="button"
                className="np-focus-risk-link"
                onClick={() =>
                  onToast(`Переход к риску ${point.relatedRisk.id} появится позже`)
                }
              >
                <div className="np-focus-risk-main">
                  <div className="np-focus-risk-head">
                    <span className="np-focus-risk-kind">Риск</span>
                    <span className="np-focus-risk-id">{point.relatedRisk.id}</span>
                  </div>
                  <div className="np-focus-risk-title">{point.relatedRisk.title}</div>
                  <div className="np-focus-risk-meta">
                    <span
                      className={`np-focus-risk-level np-focus-risk-level--${point.relatedRisk.levelTone}`}
                    >
                      {point.relatedRisk.level}
                    </span>
                    <span className="np-focus-risk-status">{point.relatedRisk.status}</span>
                  </div>
                </div>
                <span className="np-focus-risk-chev" aria-hidden>→</span>
              </button>
              {point.relatedOther.length > 0 && (
                <ul className="np-focus-related-list">
                  {point.relatedOther.map((r, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="np-focus-related-item"
                        onClick={() =>
                          onToast("Переход к связанному объекту появится позже")
                        }
                      >
                        <span>{r}</span>
                        <span className="np-focus-related-chev" aria-hidden>→</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="np-focus-col np-focus-col--side">
            <div className="np-focus-island np-focus-side-metrics">
              <div className="np-focus-side-row">
                <span className="np-focus-side-row-label">Возможное влияние</span>
                <span
                  className={`np-focus-side-row-value np-focus-side-value--${point.impactTone}`}
                >
                  {point.impact}
                </span>
              </div>
              <div className="np-focus-side-row">
                <span className="np-focus-side-row-label">Уверенность Норма</span>
                <span className="np-focus-side-row-value">{point.confidence}</span>
              </div>
              <div className="np-focus-side-row">
                <span className="np-focus-side-row-label">Дата сигнала</span>
                <span className="np-focus-side-row-value np-focus-side-row-value--plain">{point.signalDate}</span>
              </div>
            </div>

            <div className="np-focus-island np-focus-side-block">
              <div className="np-focus-side-label">
                Источники · {point.sources.length}
              </div>
              <ul className="np-focus-src-links">
                {previewSources.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className="np-focus-src-link"
                      onClick={() => onOpenSource(i)}
                    >
                      <div className="np-focus-src-link-main">
                        <span className="np-focus-src-link-type">{s.type}</span>
                        <span className="np-focus-src-link-title">{s.title}</span>
                        {s.date && (
                          <span className="np-focus-src-link-date">{s.date}</span>
                        )}
                      </div>
                      <span className="np-focus-src-link-chev" aria-hidden>→</span>
                    </button>
                  </li>
                ))}
              </ul>
              {remainingSources > 0 && (
                <button
                  type="button"
                  className="np-focus-src-more"
                  onClick={() => onOpenSource("list")}
                >
                  Показать ещё {remainingSources}
                </button>
              )}
            </div>

            <div className="np-focus-actions">
              <button
                className="np-focus-discuss"
                onClick={() => handleAction("Обсудить с Нормом")}
              >
                Обсудить с Нормом
              </button>
              <button
                type="button"
                className="np-focus-share-secondary"
                onClick={() => setShareOpen(true)}
              >
                <span aria-hidden className="np-focus-share-icon">↗</span>
                Поделиться
              </button>
            </div>
          </aside>
        </div>

        <SourceDrawer
          sources={uniSources}
          activeId={sdActiveId}
          mode="conclusion"
          listTitle="На чём основан вывод"
          placement="modal"
          onOpen={(id) => {
            if (id === "list") {
              onOpenSource("list");
            } else {
              const idx = uniSources.findIndex((u) => u.id === id);
              if (idx >= 0) onOpenSource(idx);
            }
          }}
          onClose={onCloseSource}
          onExternal={(s) => {
            if (s.url) window.open(s.url, "_blank", "noopener,noreferrer");
            else if (s.file?.downloadUrl) window.open(s.file.downloadUrl, "_blank", "noopener,noreferrer");
            else onToast("Открытие источника в этом прототипе пока не реализовано");
          }}
        />
        {shareOpen && (
          <ShareDrawer
            kind={point.id === "fp-delivery" ? "fp-delivery" : point.id === "fp-supply" ? "fp-supply" : "fp-it"}
            title="Отправить фокусную точку"
            preview={{
              status: point.type,
              statusTone: point.tone as "orange" | "blue" | "green" | "neutral",
              headline: point.title,
              action: point.recommendations[0]?.action,
              actualAt: point.signalDate,
            }}
            onClose={() => setShareOpen(false)}
            onSent={(n) => {
              setShareOpen(false);
              if (n < 0) onToast("Ссылка скопирована");
              else onToast(`Фокусная точка отправлена · ${n}`);
            }}
          />
        )}
      </div>
    </div>
  );
}

function CompanySummaryModal({
  summary,
  activeSourceId,
  onOpenSource,
  onCloseSource,
  onOpenFocus,
  onOpenRisks,
  onClose,
  onDiscuss,
  onClarify,
  onToast,
  focusOnTop,
}: {
  summary: CompanySummary;
  activeSourceId: string | null;
  onOpenSource: (id: string) => void;
  onCloseSource: () => void;
  onOpenFocus: (fpId: string) => void;
  onOpenRisks: (opts: { filter?: RiskFilter; riskId?: string }) => void;
  onClose: () => void;
  onDiscuss: () => void;
  onClarify: () => void;
  onToast: (m: string) => void;
  focusOnTop: boolean;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (focusOnTop) return; // focus modal handles its own escape
      if (shareOpen) {
        e.stopPropagation();
        setShareOpen(false);
        return;
      }
      if (activeSourceId) {
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
  }, [activeSourceId, onClose, onCloseSource, focusOnTop, shareOpen]);

  const source = activeSourceId ? SOURCES_INDEX[activeSourceId] : null;
  const supportedClaim = useMemo(() => {
    if (!activeSourceId) return null;
    for (const sec of summary.sections) {
      const found = sec.sources.find((s) => s.sourceId === activeSourceId);
      if (found) return found.supportedClaim;
    }
    return null;
  }, [activeSourceId, summary.sections]);
  const sourceRelation = source?.relation || null;

  const renderSourceLine = (sec: SummarySection) => {
    if (!sec.sources.length) return null;
    const preview = sec.sources.slice(0, 2);
    const more = Math.max(0, sec.sources.length - 2);
    return (
      <div className="np-summary-source-line">
        <span className="np-summary-source-line-label">Основания:</span>
        {preview.map((s, i) => (
          <span key={`${sec.id}-src-${i}`} className="np-summary-source-line-item">
            <button
              type="button"
              className="np-summary-source-linkbtn"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSource(s.sourceId);
              }}
            >
              {s.label}
            </button>
            {i < preview.length - 1 && <span className="np-summary-source-sep"> · </span>}
          </span>
        ))}
        {more > 0 && (
          <>
            <span className="np-summary-source-sep"> · </span>
            <button
              type="button"
              className="np-summary-source-linkbtn np-summary-source-linkbtn--more"
              onClick={(e) => {
                e.stopPropagation();
                if (sec.sources[2]) onOpenSource(sec.sources[2].sourceId);
              }}
            >
              + ещё {more}
            </button>
          </>
        )}
      </div>
    );
  };

  const focusSections = summary.sections.filter(
    (s) => s.id !== "gaps" && s.focusPointId,
  );

  return (
    <div
      className="np-company-summary-backdrop"
      onClick={() => {
        if (activeSourceId) onCloseSource();
        else onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Ситуация в компании"
    >
      <div className="np-company-summary" onClick={(e) => e.stopPropagation()}>
        <header className="np-company-summary-head">
          <div className="np-company-summary-head-main">
            <LogoMark size={32} />
            <div>
              <h1 className="np-company-summary-title">Ситуация в компании</h1>
              <div className="np-company-summary-updated">{summary.updatedAt}</div>
            </div>
          </div>
          <div className="np-company-summary-head-actions">
            <button
              type="button"
              className="np-share-trigger"
              onClick={() => setShareOpen(true)}
            >
              Поделиться
            </button>
          <button
            className="np-icon-btn np-company-summary-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <Icon name="close" size={18} />
          </button>
          </div>
        </header>

        <div className="np-company-summary-body">
          <div className="np-summary-single">
            <section className="np-summary-group">
              <h2 className="np-summary-h2">Главное за 30 секунд</h2>
              <div className="np-summary-island np-summary-lead-island">
                <h3 className="np-summary-detail-headline">{summary.leadHeadline}</h3>
                <p className="np-summary-detail-text">{summary.leadText}</p>
              </div>
            </section>

            <section className="np-summary-group">
              <h2 className="np-summary-h2">Риск-профиль</h2>
              <div className="np-summary-island np-summary-risk-island">
                <button
                  type="button"
                  className="np-summary-risk-chip np-summary-risk-chip--action"
                  onClick={() => onOpenRisks({ filter: "high" })}
                >
                  <span className="np-summary-risk-num">{summary.meta.highRisks.value}</span>
                  <span className="np-summary-risk-label">{summary.meta.highRisks.label}</span>
                  <span className="np-summary-risk-arrow" aria-hidden>→</span>
                </button>
                <button
                  type="button"
                  className="np-summary-risk-chip np-summary-risk-chip--action"
                  onClick={() => onOpenRisks({ filter: "reassessed" })}
                >
                  <span className="np-summary-risk-num">{summary.meta.risksWithoutMeasures.value}</span>
                  <span className="np-summary-risk-label">{summary.meta.risksWithoutMeasures.label}</span>
                  <span className="np-summary-risk-arrow" aria-hidden>→</span>
                </button>
                <div className="np-summary-risk-chip np-summary-risk-chip--muted">
                  <span className="np-summary-risk-label">Потери пока не рассчитаны</span>
                </div>
              </div>
            </section>

            <section className="np-summary-group">
              <h2 className="np-summary-h2">Что сделать сейчас</h2>
              <div className="np-summary-island np-summary-actions-island">
                <ol className="np-summary-actions-list">
                  <li>
                    В течение трёх дней подтвердить резервных поставщиков и сроки
                    переключения.
                  </li>
                  <li>
                    Получить данные о продажах, маржинальности и клиентской активности,
                    чтобы рассчитать возможные потери.
                  </li>
                </ol>
                <button
                  type="button"
                  className="np-focus-discuss np-summary-actions-discuss"
                  onClick={onDiscuss}
                >
                  Обсудить с Нормом
                </button>
              </div>
            </section>

            <section className="np-summary-group">
              <h2 className="np-summary-h2">Фокусные точки</h2>
              <div className="np-summary-focus-stack">
                {focusSections.map((sec) => {
                  const fp = FOCUS_POINTS.find((p) => p.id === sec.focusPointId);
                  const relRisk = fp?.relatedRisk;
                  return (
                    <div
                      key={sec.id}
                      className={`np-summary-island np-summary-focus-island np-summary-focus-island--${sec.tone}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenFocus(sec.focusPointId!)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onOpenFocus(sec.focusPointId!);
                        }
                      }}
                    >
                      <div className="np-summary-focus-head">
                        <span className={`np-summary-tag np-summary-tag--${sec.tone}`}>
                          {sec.title}
                        </span>
                        <span className="np-summary-focus-arrow" aria-hidden>→</span>
                      </div>
                      <p className="np-summary-detail-text">{sec.shortText || sec.text}</p>
                      {renderSourceLine(sec)}
                      {relRisk && (
                        <button
                          type="button"
                          className="np-summary-risk-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenRisks({ riskId: relRisk.id });
                          }}
                        >
                          {relRisk.id} · {relRisk.title}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        {source && (() => {
          const uni = focusSourceToUni(source, { supportedClaim });
          if (sourceRelation) uni.relationToConclusion = sourceRelation;
          return (
            <SourceDrawer
              sources={[uni]}
              activeId={uni.id}
              mode="conclusion"
              placement="modal"
              onOpen={() => {}}
              onClose={onCloseSource}
              onExternal={(s) => {
                if (s.url) window.open(s.url, "_blank", "noopener,noreferrer");
                else if (s.file?.downloadUrl) window.open(s.file.downloadUrl, "_blank", "noopener,noreferrer");
                else onToast("Открытие источника в этом прототипе пока не реализовано");
              }}
            />
          );
        })()}
        {shareOpen && (
          <ShareDrawer
            kind="summary"
            title="Отправить сводку"
            preview={{
              status: "Требуется решение",
              statusTone: "orange",
              headline: summary.leadHeadline,
              action: summary.requiredDecision,
              actualAt: summary.updatedAt.replace(/^Актуально на\s*/, ""),
            }}
            onClose={() => setShareOpen(false)}
            onSent={(n) => {
              setShareOpen(false);
              if (n < 0) onToast("Ссылка скопирована");
              else onToast(`Сводка отправлена · ${n}`);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============ Risks list modal ============

interface RiskRow {
  id: string;
  title: string;
  area: string;
  level: "high" | "medium" | "low";
  levelLabel: string;
  status: string;
  hasEffectiveMeasures: boolean;
  owner?: string;
  isNew?: boolean;
  reassessed?: boolean;
}

const RISKS_REGISTRY: RiskRow[] = [
  { id: "QNR-0214", title: "Нарушение непрерывности поставок", area: "Поставки и логистика", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: false, owner: "Ирина Ковалёва" },
  { id: "QNR-0187", title: "Снижение клиентской активности", area: "Клиенты и продукты", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: false, isNew: true },
  { id: "QNR-0331", title: "Массовые сбои в системе онлайн-расчётов", area: "ИТ и инфраструктура", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: true, owner: "Наталья Гусева", reassessed: true },
  { id: "QNR-0102", title: "Утечка персональных данных клиентов", area: "ИТ и безопасность", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: true },
  { id: "QNR-0119", title: "Дефицит GPU для инференса моделей", area: "ИТ и инфраструктура", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: false, isNew: true },
  { id: "QNR-0203", title: "Рост валютных издержек по закупкам", area: "Финансы", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: true },
  { id: "QNR-0221", title: "Зависимость от одного логистического оператора", area: "Поставки и логистика", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: false },
  { id: "QNR-0244", title: "Отставание от новых требований регулятора", area: "Комплаенс", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: true },
  { id: "QNR-0256", title: "Уход ключевых сотрудников продуктовой команды", area: "Персонал", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: true },
  { id: "QNR-0268", title: "Снижение маржинальности категории электроники", area: "Финансы", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: true },
  { id: "QNR-0277", title: "Ошибки в рекомендациях AI-модели", area: "Клиенты и продукты", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: false, isNew: true },
  { id: "QNR-0289", title: "Простой основного склада более 24 часов", area: "Поставки и логистика", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: true },
  { id: "QNR-0298", title: "Компрометация учётных записей администраторов", area: "ИТ и безопасность", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: true },
  { id: "QNR-0305", title: "Задержка выпуска годовой отчётности", area: "Финансы", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: true, reassessed: true },
  { id: "QNR-0312", title: "Рост числа возвратов после смены поставщика", area: "Клиенты и продукты", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: true },
  { id: "QNR-0324", title: "Недоступность платёжного шлюза в пиковые часы", area: "ИТ и инфраструктура", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: true },
  { id: "QNR-0341", title: "Срыв сроков внедрения новой WMS", area: "Проекты", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: false, isNew: true },
  { id: "QNR-0356", title: "Штрафы за нарушение сроков доставки маркетплейса", area: "Комплаенс", level: "high", levelLabel: "Высокий", status: "Действующий", hasEffectiveMeasures: true },
];

// (RiskFilter is declared near the top of the file)

// ============ Risks page & Risk detail modal ============

interface RiskDetail {
  id: string;
  title: string;
  category: string;
  status: string; // "Активен"
  levelKey: "high" | "medium" | "low";
  levelLabel: string; // Высокий
  probability: number; // 1..5
  impact: number; // 1..5
  strategy: string; // Снижение
  potentialLossFormatted?: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  sourceSystem: string;
  objectLabel: string;
  objectMeta: string;
  hasNewRiskAlert?: boolean;
  newRiskBrief?: string;
  verdict?: NormVerdict;
  utilization: {
    kind: "direct" | "indirect" | "credit";
    label: string;
    used: number;
    limit: number;
    usedFormatted: string;
    limitFormatted: string;
    forecast: string;
  }[];
  kri: {
    name: string;
    hint: string;
    value: string;
    delta: string;
    zone: string;
    comment: string;
  };
  description?: string;
  factors?: string[];
  consequences?: string[];
  recommendations?: string[];
  measures: {
    id: string;
    title: string;
    date: string;
    dateKind: "plan" | "fact";
    status: "new" | "done";
    statusLabel: string;
  }[];
  currentEffectiveness: number; // percent
  ownerPath: string;
}

type VerdictStatus = "decision" | "check" | "improvement" | "new";

interface NormVerdict {
  status: VerdictStatus;
  statusLabel: string;
  title: string;
  text: string;
  nextAction: string;
  sourceIds: string[];
}

const DEFAULT_RISK_DETAIL: Omit<RiskDetail, "id" | "title" | "category" | "levelKey" | "levelLabel"> = {
  status: "Активен",
  probability: 3,
  impact: 4,
  strategy: "Снижение",
  potentialLossFormatted: "10 млн ₽",
  createdAt: "01 февраля 2024",
  updatedAt: "01 февраля 2024",
  author: "NORM AI",
  sourceSystem: "АС Сенат",
  objectLabel: "Проект",
  objectMeta: "Петрушкины истории и многое …",
  hasNewRiskAlert: false,
  utilization: [
    {
      kind: "direct",
      label: "Прямые потери",
      used: 1340500,
      limit: 12000000,
      usedFormatted: "1 340 500 ₽",
      limitFormatted: "12 000 000 ₽",
      forecast: "10 млн ₽",
    },
    {
      kind: "indirect",
      label: "Косвенные потери",
      used: 6500000,
      limit: 8000000,
      usedFormatted: "6 500 000 ₽",
      limitFormatted: "8 000 000 ₽",
      forecast: "10 млн ₽",
    },
    {
      kind: "credit",
      label: "Кредитные потери",
      used: 1250000,
      limit: 2000000,
      usedFormatted: "1 250 000 ₽",
      limitFormatted: "2 000 000 ₽",
      forecast: "1,85 млн ₽",
    },
  ],
  kri: {
    name: "Потери к выручке",
    hint: "Отношение потерь к общей выручке",
    value: "0,06%",
    delta: "↗ 10% за январь",
    zone: "Жёлтая зона",
    comment: "Выручка падает при стабильных потерях",
  },
  measures: [
    { id: "MSR-171185", title: "Проведение тестирования на проникновение внешним подрядчиком", date: "Плановая дата: 05.03.2024", dateKind: "plan", status: "new", statusLabel: "Новая" },
    { id: "MSR-171185", title: "Обновление политики парольной защиты", date: "Фактическая дата: 15.01.2024", dateKind: "fact", status: "done", statusLabel: "Реализована" },
    { id: "MSR-171185", title: "Сегментация сети и разграничение доступа к базам данных", date: "Фактическая дата: 28.01.2024", dateKind: "fact", status: "done", statusLabel: "Реализована" },
    { id: "MSR-171185", title: "Внедрение двухфакторной аутентификации для всех сотрудников", date: "Фактическая дата: 10.02.2024", dateKind: "fact", status: "done", statusLabel: "Реализована" },
    { id: "MSR-171185", title: "Шифрование данных в состоянии покоя", date: "Фактическая дата: 20.02.2024", dateKind: "fact", status: "done", statusLabel: "Реализована" },
  ],
  currentEffectiveness: 48,
  ownerPath:
    "ДубльКИС / Департамент исследований и разработок / Управление информационных технологий / Отдел технического сопровождения",
};

const RISK_DETAIL_OVERRIDES: Record<string, Partial<RiskDetail>> = {
  "QNR-0214": {
    verdict: {
      status: "decision",
      statusLabel: "Требует решения",
      title: "Задержки поставщиков уже влияют на наличие товаров",
      text:
        "Пять из семи задержек за последний месяц связаны с тремя поставщиками. За тот же период доля отсутствующих товаров выросла с 6% до 24%. Связь подтверждается данными, но возможные финансовые потери пока не рассчитаны.",
      nextAction:
        "В течение трёх дней подтвердить резервных поставщиков и сроки переключения.",
      sourceIds: ["fp-supply-s0", "fp-supply-s1", "fp-supply-s2"],
    },
  },
  "QNR-0187": {
    verdict: {
      status: "check",
      statusLabel: "Требует проверки",
      title:
        "Есть ранний сигнал возможного оттока, но снижение активности пока не подтверждено",
      text:
        "Конкурент запустил бесплатную доставку в 12 городах присутствия компании, а стоимость доставки уже входит в число частых причин отказа. Данных о фактическом изменении активности клиентов в этих городах пока нет.",
      nextAction:
        "Начать отдельный мониторинг конверсии, повторных заказов и отмен в 12 затронутых городах.",
      sourceIds: ["fp-delivery-s0", "fp-delivery-s1", "fp-delivery-s2"],
    },
  },
  "QNR-0331": {
    verdict: {
      status: "improvement",
      statusLabel: "Есть улучшение",
      title:
        "Дополнительный мониторинг, вероятно, снижает частоту критичных сбоев",
      text:
        "После внедрения меры число критичных ошибок снизилось на 37%, а массовые сбои не повторялись 21 день. Это положительный ранний результат, но трёх недель пока недостаточно для снижения оценки риска.",
      nextAction:
        "Сохранить текущие меры и повторно оценить результат после 30 дней наблюдения при сопоставимой нагрузке.",
      sourceIds: ["fp-it-s0", "fp-it-s1", "fp-it-s2"],
    },
  },
  "QNR-0119": {
    verdict: {
      status: "new",
      statusLabel: "Новый риск",
      title: "Запуск AI-продукта под угрозой из-за дефицита GPU",
      text:
        "Компания готовит запуск системы AI-рекомендаций товаров, при этом уже зафиксирован дефицит GPU-мощностей. Это может привести к сбоям, задержке запуска или снижению качества работы продукта.",
      nextAction:
        "Согласовать план обеспечения GPU-мощностей до плановой даты запуска продукта.",
      sourceIds: [
        "risk-gpu-product-announce",
        "risk-gpu-shortage-report",
        "risk-gpu-key-clients",
      ],
    },
  },
};

function buildRiskDetail(row: RiskRow): RiskDetail {
  const base: RiskDetail = {
    ...DEFAULT_RISK_DETAIL,
    id: row.id,
    title: row.title,
    category: row.area,
    levelKey: row.level,
    levelLabel: row.levelLabel,
  };
  const ov = RISK_DETAIL_OVERRIDES[row.id];
  return ov ? { ...base, ...ov } : base;
}

// ---------- Rationale (Обоснование анализа) ----------

interface RationaleSource {
  id: string;
  area: string;
  areaTone: "green" | "blue" | "amber" | "violet";
  title: string;
  points: string[];
  sourceLabel: string;
  detailKind: "planned_product" | "key_clients" | "gpu_shortage";
}

const RATIONALE_SOURCES: RationaleSource[] = [
  {
    id: "key_clients",
    area: "Продукты и рынок",
    areaTone: "green",
    title: "Ключевые клиенты",
    points: [
      "Активные жители мегаполисов 25-40 лет",
      "Офисные сотрудники (доставка в рабочее время)",
    ],
    sourceLabel: "Источник: Маркетинг исследование 2025.pdf",
    detailKind: "key_clients",
  },
  {
    id: "planned_product",
    area: "Продукты и рынок",
    areaTone: "green",
    title: "Планируемый продукт",
    points: ["Система ai-рекомендаций товаров"],
    sourceLabel: "Источник: Анонс на сайте компании",
    detailKind: "planned_product",
  },
  {
    id: "gpu_shortage",
    area: "ИТ и кибербезопасность",
    areaTone: "blue",
    title: "Дефицит GPU",
    points: [
      "На начало 2026 года фиксируется дефицит вычислительных мощностей GPU",
    ],
    sourceLabel: "Источник: Отчёт ИТ-инфраструктуры 2026.pdf",
    detailKind: "gpu_shortage",
  },
];

function RationaleModal({
  brief,
  onClose,
  onOpenSource,
  onGoToProfile,
  dimmed,
}: {
  brief: string;
  onClose: () => void;
  onOpenSource: (id: string) => void;
  onGoToProfile: () => void;
  dimmed: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !dimmed) { e.stopPropagation(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, dimmed]);

  return (
    <div
      className={`np-risk-rationale-backdrop ${dimmed ? "is-dimmed" : ""}`}
      onClick={(e) => { e.stopPropagation(); if (!dimmed) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Обоснование анализа"
    >
      <div className="np-risk-rationale" onClick={(e) => e.stopPropagation()}>
        <button className="np-icon-btn np-risk-rationale-close" onClick={onClose} aria-label="Закрыть">
          <Icon name="close" size={18} />
        </button>
        <div className="np-risk-rationale-body">
          <h2 className="np-risk-rationale-title">Обоснование анализа</h2>
          <p className="np-risk-rationale-brief">
            Компания готовит запуск нового AI-продукта —{" "}
            <mark className="np-mark-violet">Система ai-рекомендаций товаров</mark>,
            при этом уже зафиксирован <mark className="np-mark-violet">дефицит GPU-мощностей</mark>.
            Это может привести к сбоям, задержке запуска или снижению качества работы продукта.
            {brief ? "" : ""}
          </p>
          <h3 className="np-risk-rationale-h3">Источники вывода</h3>
          <div className="np-risk-rationale-list">
            {RATIONALE_SOURCES.map((s) => (
              <button
                key={s.id}
                type="button"
                className="np-risk-rationale-card"
                onClick={() => onOpenSource(s.id)}
              >
                <span className={`np-risk-area-chip np-risk-area-chip--${s.areaTone}`}>{s.area}</span>
                <div className="np-risk-rationale-card-title">{s.title}</div>
                <ul className="np-risk-rationale-points">
                  {s.points.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
                <div className="np-risk-rationale-card-src">{s.sourceLabel}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="np-risk-rationale-foot">
          <button className="np-risk-rationale-cta" onClick={onGoToProfile}>Перейти в профиль компании</button>
        </div>
      </div>
    </div>
  );
}

function KnowledgeItemModal({
  source,
  onClose,
  onGoToProfile,
}: {
  source: RationaleSource;
  onClose: () => void;
  onGoToProfile: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isKeyClients = source.detailKind === "key_clients";
  const isPlanned = source.detailKind === "planned_product";

  return (
    <div
      className="np-risk-rationale-backdrop"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={source.title}
    >
      <div className="np-risk-knowledge" onClick={(e) => e.stopPropagation()}>
        <button className="np-icon-btn np-risk-rationale-close" onClick={onClose} aria-label="Закрыть">
          <Icon name="close" size={18} />
        </button>
        <div className="np-risk-rationale-body">
          <span className={`np-risk-area-chip np-risk-area-chip--${source.areaTone}`}>{source.area}</span>
          <h2 className="np-risk-knowledge-title">{source.title}</h2>

          {isKeyClients && (
            <>
              <div className="np-risk-knowledge-card">
                <div className="np-risk-knowledge-card-head">
                  <h3>Активные жители мегаполисов 25-40 лет</h3>
                  <div className="np-risk-knowledge-card-actions">
                    <button className="np-icon-btn" aria-label="Редактировать">✎</button>
                    <button className="np-icon-btn np-danger" aria-label="Удалить">🗑</button>
                  </div>
                </div>
                <p className="np-risk-knowledge-quote">
                  «Ядро аудитории — жители мегаполисов 25–40 лет, доход выше среднего, частота заказа 2,8 раза/нед.; 68% — женщины; средний чек 1 240 ₽.»
                </p>
                <div className="np-risk-knowledge-file">
                  <span className="np-risk-knowledge-file-ic">📄</span>
                  <span className="np-risk-knowledge-file-name">Маркетинг исследование 2025.pdf</span>
                  <button className="np-icon-btn" aria-label="Скачать">⬇</button>
                </div>
                <div className="np-risk-knowledge-updated">Дата обновления: 24.09.2025</div>
              </div>
              <div className="np-risk-knowledge-card">
                <div className="np-risk-knowledge-card-head">
                  <h3>Офисные сотрудники (доставка в рабочее время)</h3>
                  <div className="np-risk-knowledge-card-actions">
                    <button className="np-icon-btn" aria-label="Редактировать">✎</button>
                    <button className="np-icon-btn np-danger" aria-label="Удалить">🗑</button>
                  </div>
                </div>
                <p className="np-risk-knowledge-quote">
                  «До 25% заказов в крупных городах в будние дни приходится на офисных работников.»
                </p>
                <div className="np-risk-knowledge-file">
                  <span className="np-risk-knowledge-file-ic">📄</span>
                  <span className="np-risk-knowledge-file-name">Маркетинг исследование 2025.pdf</span>
                  <button className="np-icon-btn" aria-label="Скачать">⬇</button>
                </div>
                <div className="np-risk-knowledge-updated">Дата обновления: 24.09.2025</div>
              </div>
            </>
          )}

          {isPlanned && (
            <div className="np-risk-knowledge-card">
              <div className="np-risk-knowledge-card-head">
                <h3>Система AI-рекомендаций товаров</h3>
                <div className="np-risk-knowledge-card-actions">
                  <button className="np-icon-btn" aria-label="Редактировать">✎</button>
                  <button className="np-icon-btn np-danger" aria-label="Удалить">🗑</button>
                </div>
              </div>
              <a className="np-risk-knowledge-link" href="#" onClick={(e) => e.preventDefault()}>
                🔗 Анонс на сайте компании
              </a>
              <div className="np-risk-knowledge-updated">Дата обновления: 24.09.2025</div>
            </div>
          )}

          {!isKeyClients && !isPlanned && (
            <div className="np-risk-knowledge-card">
              <div className="np-risk-knowledge-card-head">
                <h3>{source.title}</h3>
              </div>
              <ul className="np-risk-rationale-points">
                {source.points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
              <div className="np-risk-knowledge-updated">{source.sourceLabel}</div>
            </div>
          )}
        </div>
        <div className="np-risk-rationale-foot">
          <button className="np-risk-rationale-cta" onClick={onGoToProfile}>Перейти в профиль компании</button>
        </div>
      </div>
    </div>
  );
}

function KriDrawer({ kri, onClose }: { kri: RiskDetail["kri"]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="np-sd-backdrop np-sd-backdrop--modal"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="np-sd-drawer np-kri-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="np-sd-head">
          <div className="np-sd-head-main">
            <div className="np-sd-type">Ключевой индикатор риска</div>
            <h2 className="np-sd-title">{kri.name}</h2>
          </div>
          <button className="np-sd-close" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="np-sd-body">
          <div className="np-kri-alert">
            <span className="np-kri-alert-ic">⚠</span>
            <div>
              <div className="np-kri-alert-title">Индикатор в жёлтой зоне</div>
              <div className="np-kri-alert-text">{kri.comment}</div>
            </div>
          </div>
          <div className="np-kri-metrics">
            <div className="np-kri-metric">
              <div className="np-kri-metric-label">Текущее значение</div>
              <div className="np-kri-metric-value">{kri.value}</div>
            </div>
            <div className="np-kri-metric">
              <div className="np-kri-metric-label">Динамика</div>
              <div className="np-kri-metric-value np-kri-up">{kri.delta}</div>
            </div>
            <div className="np-kri-metric">
              <div className="np-kri-metric-label">Зона</div>
              <div className="np-kri-metric-value"><span className="np-kri-zone np-kri-zone--yellow">{kri.zone}</span></div>
            </div>
          </div>
          <div className="np-kri-chart">
            <svg viewBox="0 0 300 120" preserveAspectRatio="none" width="100%" height="140">
              <defs>
                <linearGradient id="kriGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f5b64f" stopOpacity="0.35"/>
                  <stop offset="100%" stopColor="#f5b64f" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0,90 L30,80 L60,85 L90,70 L120,72 L150,60 L180,55 L210,58 L240,45 L270,50 L300,40 L300,120 L0,120 Z" fill="url(#kriGrad)"/>
              <path d="M0,90 L30,80 L60,85 L90,70 L120,72 L150,60 L180,55 L210,58 L240,45 L270,50 L300,40" fill="none" stroke="#f5a623" strokeWidth="2"/>
            </svg>
            <div className="np-kri-chart-caption">Динамика за последние 12 месяцев</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskDetailModal({
  risk,
  onClose,
  onNavigateToProfile,
  onToast,
}: {
  risk: RiskDetail;
  onClose: () => void;
  onNavigateToProfile: () => void;
  onToast: (m: string) => void;
}) {
  const [tab, setTab] = useState<"eval" | "util" | "kri" | "factors" | "consequences" | "measures">("eval");
  const [rationaleOpen, setRationaleOpen] = useState(false);
  const [knowledgeSourceId, setKnowledgeSourceId] = useState<string | null>(null);
  const [kriOpen, setKriOpen] = useState(false);
  const [verdictSourceId, setVerdictSourceId] = useState<string | "list" | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (knowledgeSourceId || rationaleOpen || kriOpen || verdictSourceId !== null) return; // child handles
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, knowledgeSourceId, rationaleOpen, kriOpen, verdictSourceId]);

  const activeSource = knowledgeSourceId
    ? RATIONALE_SOURCES.find((s) => s.id === knowledgeSourceId) ?? null
    : null;

  const verdictUniSources = (risk.verdict?.sourceIds ?? [])
    .map((id) => SOURCES_INDEX[id])
    .filter((s): s is FocusSource => !!s)
    .map((s) => focusSourceToUni(s, { supportedClaim: risk.verdict?.title ?? null }));

  return (
    <div
      className="np-risk-modal-backdrop"
      onClick={(e) => {
        if (knowledgeSourceId || rationaleOpen || kriOpen || verdictSourceId !== null) return;
        e.stopPropagation();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={risk.title}
    >
      <div className="np-modal np-risk-modal" onClick={(e) => e.stopPropagation()}>
        <button className="np-icon-btn np-risk-modal-close" onClick={onClose} aria-label="Закрыть">
          <Icon name="close" size={18} />
        </button>
        <div className="np-risk-modal-scroll">
          <div className="np-risk-modal-grid">
            <div className="np-risk-modal-main">
              <div className="np-risk-topchips">
                <span className="np-risk-topchip">◆ Риск</span>
                <span className="np-risk-topchip np-risk-topchip--active">◆ {risk.status}</span>
              </div>
              <h1 className="np-risk-modal-title">{risk.title}</h1>
              <div className="np-risk-modal-subtitle">{risk.category}</div>

              <div className="np-risk-tabs">
                {[
                  ["eval", "Оценка риска"],
                  ["util", "Утилизация"],
                  ["kri", "КИР"],
                  ["factors", "Риск-факторы"],
                  ["consequences", "Последствия"],
                  ["measures", "Меры"],
                ].map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    className={`np-risk-tab ${tab === k ? "active" : ""}`}
                    onClick={() => setTab(k as typeof tab)}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {risk.verdict && (
                <NormVerdictBlock
                  verdict={risk.verdict}
                  onOpenSource={(id) => setVerdictSourceId(id)}
                />
              )}

              <section className="np-risk-block">
                <div className="np-risk-block-head">
                  <h3>Уровень риска</h3>
                  <span className={`np-risk-level-chip np-risk-level-chip--${risk.levelKey}`}>▼ {risk.levelLabel}</span>
                  <span className="np-risk-block-right">
                    Потенциальные потери <span className="np-muted">🙈</span>
                  </span>
                </div>
                <div className="np-risk-lvl-row">
                  <div className="np-risk-lvl-cell">
                    <div className="np-risk-lvl-label">Вероятность</div>
                    <ProbDots value={risk.probability} tone="amber" />
                  </div>
                  <div className="np-risk-lvl-cell">
                    <div className="np-risk-lvl-label">Влияние на …</div>
                    <ProbDots value={risk.impact} tone="red" />
                  </div>
                  <div className="np-risk-lvl-cell">
                    <div className="np-risk-lvl-label">Стратегия реагирования</div>
                    <span className="np-risk-strategy-pill">{risk.strategy}</span>
                  </div>
                </div>
              </section>

              <section className="np-risk-block">
                <div className="np-risk-block-head">
                  <h3>Утилизация лимита</h3>
                  <button className="np-icon-btn" aria-label="Развернуть">⤢</button>
                </div>
                <div className="np-risk-util-row">
                  {risk.utilization.map((u) => {
                    const pct = Math.round((u.used / u.limit) * 100);
                    return (
                      <div key={u.kind} className={`np-risk-util-card np-risk-util-card--${u.kind}`}>
                        <div className="np-risk-util-head">
                          <span className="np-risk-util-label">{u.label}</span>
                          <span className="np-risk-util-pct">{pct}%</span>
                        </div>
                        <div className="np-risk-util-amount">
                          <strong>{u.usedFormatted}</strong>
                          <span className="np-muted">{u.limitFormatted}</span>
                        </div>
                        <div className="np-risk-util-bar">
                          <span className={`np-risk-util-bar-fill np-risk-util-bar-fill--${u.kind}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <div className="np-risk-util-foot">
                          <span className={`np-risk-util-forecast np-risk-util-forecast--${u.kind}`}>Прогноз · {u.forecast}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="np-risk-block">
                <div className="np-risk-block-head"><h3>Ключевой индикатор риска</h3></div>
                <button type="button" className="np-risk-kri-card" onClick={() => setKriOpen(true)}>
                  <div className="np-risk-kri-top">
                    <span className="np-risk-kri-ic">₽</span>
                    <div className="np-risk-kri-main">
                      <div className="np-risk-kri-name">
                        {risk.kri.name} <span className="np-muted">ⓘ</span>
                      </div>
                      <div className="np-risk-kri-delta">{risk.kri.delta}</div>
                    </div>
                    <div className="np-risk-kri-right">
                      <span className="np-risk-kri-value">{risk.kri.value}</span>
                      <span className="np-kri-zone np-kri-zone--yellow">{risk.kri.zone}</span>
                    </div>
                  </div>
                  <div className="np-risk-kri-comment">{risk.kri.comment}</div>
                </button>
              </section>

              {risk.description && (
                <section className="np-risk-block">
                  <h3 className="np-risk-h3">Описание риска</h3>
                  <p className="np-risk-p">{risk.description}</p>
                </section>
              )}

              {risk.factors && risk.factors.length > 0 && (
                <section className="np-risk-block">
                  <h3 className="np-risk-h3">Риск-факторы</h3>
                  <div className="np-risk-sub">Это причины, которые могут привести к реализации риска.</div>
                  <ul className="np-risk-item-list">
                    {risk.factors.map((f, i) => (
                      <li key={i} className="np-risk-item np-risk-item--factor">
                        <span className="np-risk-item-ic">ⓘ</span>{f}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {risk.consequences && risk.consequences.length > 0 && (
                <section className="np-risk-block">
                  <h3 className="np-risk-h3">Возможные последствия</h3>
                  <ul className="np-risk-item-list">
                    {risk.consequences.map((c, i) => (
                      <li key={i} className="np-risk-item np-risk-item--consequence">
                        <span className="np-risk-item-ic">◆</span>{c}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {risk.recommendations && risk.recommendations.length > 0 && (
                <section className="np-risk-block">
                  <h3 className="np-risk-h3">Рекомендации</h3>
                  <ul className="np-risk-rec-list">
                    {risk.recommendations.map((r, i) => (
                      <li key={i} className="np-risk-rec">
                        <span className="np-risk-rec-ic">✨</span>
                        <span className="np-risk-rec-text">{r}</span>
                        <button className="np-icon-btn" aria-label="Архив">🗑</button>
                        <button className="np-risk-rec-btn" onClick={() => onToast("Мера снижения будет добавлена позже")}>Снизить риск</button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="np-risk-block">
                <h3 className="np-risk-h3">Меры</h3>
                <div className="np-risk-eff-row">
                  <div className="np-risk-eff">
                    <div className="np-risk-eff-label">Текущая эффективность мер <span className="np-muted">ⓘ</span></div>
                    <span className="np-risk-eff-badge">{risk.currentEffectiveness}%</span>
                  </div>
                  <div className="np-risk-eff">
                    <div className="np-risk-eff-label">Годовая эффективность мер <span className="np-muted">ⓘ</span></div>
                    <span className="np-risk-eff-muted">Пока нет данных</span>
                  </div>
                </div>
                <ul className="np-risk-measures">
                  {risk.measures.map((m, i) => (
                    <li key={i} className="np-risk-measure">
                      <span className="np-risk-measure-ic">🛡</span>
                      <div className="np-risk-measure-main">
                        <div className="np-risk-measure-title">{m.title}</div>
                        <div className="np-risk-measure-meta">{m.id} · {m.date}</div>
                      </div>
                      <span className={`np-risk-measure-status np-risk-measure-status--${m.status}`}>{m.statusLabel}</span>
                      <button className="np-icon-btn" aria-label="Архив">🗑</button>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="np-risk-block">
                <h3 className="np-risk-h3">Подразделение владельца риска</h3>
                <div className="np-risk-owner">
                  <span className="np-risk-owner-ic">👥</span>
                  <span className="np-risk-owner-text">{risk.ownerPath}</span>
                </div>
              </section>
            </div>

            <aside className="np-risk-side">
              <div className="np-risk-side-card">
                <div className="np-risk-side-title">Информация</div>
                <dl className="np-risk-side-list">
                  <div><dt>Риск</dt><dd>{risk.id}</dd></div>
                  <div><dt>Создан</dt><dd>{risk.createdAt}</dd></div>
                  <div><dt>Обновлён</dt><dd>{risk.updatedAt}</dd></div>
                  <div><dt>Автор</dt><dd><span className="np-risk-author">◉ {risk.author}</span></dd></div>
                  <div><dt>Источник</dt><dd><span className="np-risk-author">◆ {risk.sourceSystem}</span></dd></div>
                </dl>
                <div className="np-risk-side-obj">
                  <div className="np-risk-side-obj-label">Объект оценки</div>
                  <div className="np-risk-side-obj-name">◉ {risk.objectLabel}</div>
                  <div className="np-risk-side-obj-meta">{risk.objectMeta}</div>
                </div>
              </div>
              <button className="np-risk-side-btn">История изменений <span>›</span></button>
              <button className="np-risk-side-btn">Добавить меру <span>+</span></button>
              <button className="np-risk-side-btn np-risk-side-btn--primary">
                <span>✎</span> Редактировать
              </button>
            </aside>
          </div>
        </div>
        <footer className="np-risk-modal-foot">
          <button className="np-risk-foot-btn np-risk-foot-btn--danger">Удалить</button>
          <button className="np-risk-foot-btn">В архив</button>
        </footer>

        {rationaleOpen && (
          <RationaleModal
            brief={risk.newRiskBrief ?? ""}
            dimmed={!!activeSource}
            onClose={() => setRationaleOpen(false)}
            onOpenSource={(id) => setKnowledgeSourceId(id)}
            onGoToProfile={() => { setKnowledgeSourceId(null); setRationaleOpen(false); onClose(); onNavigateToProfile(); }}
          />
        )}
        {activeSource && (
          <KnowledgeItemModal
            source={activeSource}
            onClose={() => setKnowledgeSourceId(null)}
            onGoToProfile={() => { setKnowledgeSourceId(null); setRationaleOpen(false); onClose(); onNavigateToProfile(); }}
          />
        )}
        {kriOpen && <KriDrawer kri={risk.kri} onClose={() => setKriOpen(false)} />}
        {risk.verdict && verdictSourceId !== null && (
          <SourceDrawer
            sources={verdictUniSources}
            activeId={verdictSourceId}
            mode="conclusion"
            listTitle="Основания вывода Норма"
            placement="modal"
            onOpen={(id) => setVerdictSourceId(id)}
            onClose={() => setVerdictSourceId(null)}
          />
        )}
      </div>
    </div>
  );
}

function NormVerdictBlock({
  verdict,
  onOpenSource,
}: {
  verdict: NormVerdict;
  onOpenSource: (id: string | "list") => void;
}) {
  const sources = verdict.sourceIds
    .map((id) => ({ id, s: SOURCES_INDEX[id] }))
    .filter((x) => !!x.s);
  const visible = sources.slice(0, 2);
  const extra = sources.length - visible.length;
  return (
    <div className={`np-risk-alert np-verdict np-verdict--${verdict.status}`}>
      <div className="np-risk-alert-ic">◆</div>
      <div className="np-risk-alert-body">
        <span className={`np-verdict-status np-verdict-status--${verdict.status}`}>
          {verdict.statusLabel}
        </span>
        <div className="np-risk-alert-title np-verdict-title">{verdict.title}</div>
        <div className="np-risk-alert-text np-verdict-text">{verdict.text}</div>
        <div className="np-verdict-action">
          <span className="np-verdict-action-label">Ближайшее действие</span>
          <span className="np-verdict-action-text">{verdict.nextAction}</span>
        </div>
        {sources.length > 0 && (
          <div className="np-verdict-sources">
            <span className="np-verdict-sources-label">Основания:</span>{" "}
            {visible.map((x, i) => (
              <span key={x.id}>
                <button
                  type="button"
                  className="np-verdict-source-link"
                  onClick={() => onOpenSource(x.id)}
                >
                  {x.s.title}
                </button>
                {i < visible.length - 1 && <span className="np-verdict-sep"> · </span>}
              </span>
            ))}
            {extra > 0 && (
              <>
                <span className="np-verdict-sep"> · </span>
                <button
                  type="button"
                  className="np-verdict-source-link"
                  onClick={() => onOpenSource("list")}
                >
                  + ещё {extra}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProbDots({ value, tone }: { value: number; tone: "amber" | "red" }) {
  return (
    <span className={`np-risk-dots np-risk-dots--${tone}`}>
      {[1,2,3,4,5].map((i) => (
        <span key={i} className={`np-risk-dot ${i <= value ? "on" : ""}`} />
      ))}
    </span>
  );
}

// ---------- Risks page ----------

function RisksPage({
  initialFilter,
  onOpenRisk,
}: {
  initialFilter?: RiskFilter;
  onOpenRisk: (row: RiskRow) => void;
}) {
  const [tab, setTab] = useState<"active" | "analysis" | "archive">("active");
  const [filter, setFilter] = useState<RiskFilter>(initialFilter ?? "all");
  useEffect(() => { if (initialFilter) setFilter(initialFilter); }, [initialFilter]);

  const list = RISKS_REGISTRY.filter((r) => {
    if (filter === "new") return !!r.isNew;
    if (filter === "high") return r.level === "high";
    if (filter === "reassessed") return !!r.reassessed;
    return true;
  });

  return (
    <div className="np-risks-page">
      <header className="np-risks-page-head">
        <h1 className="np-risks-page-title">
          <span className="np-risks-page-dash">—</span> Все риски <span className="np-risks-page-count">{RISKS_REGISTRY.length.toString().padStart(4, "0")}</span> <span className="np-muted">ⓘ</span>
        </h1>
        <button className="np-risks-page-cta">✨ Выявить новые риски</button>
      </header>

      <div className="np-risks-page-toolbar">
        <div className="np-risks-tabs">
          {[
            ["active", "Активные риски"],
            ["analysis", "Анализ рисков"],
            ["archive", "Архив"],
          ].map(([k, l]) => (
            <button
              key={k}
              className={`np-risks-tab ${tab === k ? "active" : ""}`}
              onClick={() => setTab(k as typeof tab)}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="np-risks-tools">
          <button className="np-icon-btn np-risks-tool" aria-label="Поиск">🔍</button>
          <button className="np-risks-tool np-risks-tool--wide">≡ Фильтр</button>
        </div>
      </div>

      <div className="np-risks-stats">
        <button
          type="button"
          className={`np-risks-stat np-risks-stat--new ${filter === "new" ? "is-active" : ""}`}
          onClick={() => setFilter("new")}
        >
          <div className="np-risks-stat-head">
            <div className="np-risks-stat-title">Новые риски</div>
            <span className="np-risks-stat-badge np-risks-stat-badge--blue">{RISKS_REGISTRY.filter(r => r.isNew).length}</span>
          </div>
          <div className="np-risks-stat-text">Норм обнаружил новые риски, можешь ознакомиться с ними.</div>
        </button>
        <button
          type="button"
          className={`np-risks-stat np-risks-stat--high ${filter === "high" ? "is-active" : ""}`}
          onClick={() => setFilter("high")}
        >
          <div className="np-risks-stat-head">
            <div className="np-risks-stat-title">Высокий уровень риска</div>
            <span className="np-risks-stat-badge np-risks-stat-badge--red">{RISKS_REGISTRY.filter(r => r.level === "high").length}</span>
          </div>
          <div className="np-risks-stat-text">Обрати внимание на рекомендации от Норма и прими решения по рискам.</div>
        </button>
        <button
          type="button"
          className={`np-risks-stat np-risks-stat--rev ${filter === "reassessed" ? "is-active" : ""}`}
          onClick={() => setFilter("reassessed")}
        >
          <div className="np-risks-stat-head">
            <div className="np-risks-stat-title">Переоценено</div>
            <span className="np-risks-stat-badge np-risks-stat-badge--amber">{RISKS_REGISTRY.filter(r => r.reassessed).length}</span>
          </div>
          <div className="np-risks-stat-text">Норм скорректировал оценку риска на основе новых данных.</div>
        </button>
      </div>

      <ul className="np-risks-cards">
        {list.map((r) => (
          <li key={r.id}>
            <button type="button" className="np-risks-card" onClick={() => onOpenRisk(r)}>
              <div className="np-risks-card-top">
                <span className={`np-risks-card-level np-risks-card-level--${r.level}`}>▲ {r.levelLabel}</span>
                {r.isNew && <span className="np-risks-card-new">Новый</span>}
                <span className="np-risks-card-id">{r.id}</span>
              </div>
              <div className="np-risks-card-title">{r.title}</div>
              <div className="np-risks-card-metrics">
                <div>
                  <div className="np-risks-card-metric-label">Потенциальные потери</div>
                  <div className="np-risks-card-metric-value">1 502 620 ₽</div>
                </div>
                <div>
                  <div className="np-risks-card-metric-label">Фактические потери</div>
                  <div className="np-risks-card-metric-value">1 502 620 ₽</div>
                </div>
                <div>
                  <div className="np-risks-card-metric-label">Стратегия реагирования</div>
                  <span className="np-risks-card-strategy">Снизить</span>
                </div>
              </div>
              <div className="np-risks-card-foot">
                <div className="np-risks-card-tags">
                  <span className="np-risks-card-tag">▸ Описание</span>
                  <span className="np-risks-card-tag np-risks-card-tag--rec">✦ Рекомендации: 2</span>
                  <span className="np-risks-card-tag">Меры: 2</span>
                </div>
                <div className="np-risks-card-owner">👥 {r.owner ?? 'ООО "Тестовая компания"'} / … / Отдел технического сопровождения</div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="np-risks-page-fab">
        <button className="np-risks-fab-btn">Зарегистрировать риск</button>
      </div>
    </div>
  );
}

export default function NormPrototype() {
  const [modalQuery, setModalQuery] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const [focusSourceIdx, setFocusSourceIdx] = useState<number | "list" | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summarySourceId, setSummarySourceId] = useState<string | null>(null);
  const [risksPageFilter, setRisksPageFilter] = useState<RiskFilter | undefined>(undefined);
  const [openRiskRow, setOpenRiskRow] = useState<RiskRow | null>(null);
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
    if (navId !== "risks") setRisksPageFilter(undefined);
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
        ) : activeNav === "risks" ? (
          <RisksPage
            initialFilter={risksPageFilter}
            onOpenRisk={(row) => setOpenRiskRow(row)}
          />
        ) : (
        <div className="np-page-container">
        <h1 className="np-hello">
          <span className="np-hello-line">Привет, Сергей!</span>
          <button
            type="button"
            className="np-hello-summary"
            onClick={() => setSummaryOpen(true)}
          >
            <span className="np-hello-summary-lead">Ситуация в компании </span>
            <span className="np-hello-summary-status">требует внимания</span>
            <span className="np-hello-summary-arrow" aria-hidden>→</span>
          </button>
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

        <section className="np-section">
          <div className="np-sec-head">
            <h2>Объекты управления рисками</h2>
          </div>
          <RiskObjectsChart rightSlot={<RiskLossCards metrics={LOSS_METRICS} />} />
        </section>

        <section className="np-section">
          <div className="np-sec-head">
            <h2>На что стоит обратить внимание ⚡️</h2>
            <button
              className="np-link"
              onClick={() => setToast("Полный список фокусных точек появится позже")}
            >
              Смотреть все →
            </button>
          </div>
          <div className="np-focus-outer">
          <div className="np-focus-wrap">
            {FOCUS_POINTS.map((fp) => (
              <button
                key={fp.id}
                type="button"
                className="np-focus-card"
                onClick={() => setFocusIdx(FOCUS_POINTS.indexOf(fp))}
              >
                <div className="np-focus-card-top">
                  <span className={`np-focus-type np-focus-type--${fp.tone}`}>{fp.type}</span>
                  <span className="np-focus-area">{fp.area}</span>
                </div>
                <h3 className="np-focus-title">{fp.title}</h3>
                <p className="np-focus-short">{fp.short}</p>
                <div className="np-focus-cta">
                  {fp.cta} <Icon name="arrow" size={14} />
                </div>
              </button>
            ))}
          </div>
          </div>
        </section>

        <section className="np-section">
          <div className="np-sec-head">
            <h2>Работа с событиями ⚡</h2>
          </div>
          <div className="np-events-wrap">
            {EVENT_WIDGETS.map((w) => (
              <div key={w.id} className={`np-event-widget np-event-widget--${w.tone}`}>
                <h3 className="np-event-widget-title">{w.title}</h3>
                <p className="np-event-widget-text">{w.text}</p>
                <button
                  type="button"
                  className="np-event-widget-btn"
                  onClick={() => setToast("Полный раздел событий появится позже")}
                >
                  <span className={`np-event-widget-dot np-event-widget-dot--${w.tone}`} />
                  {w.cta} <Icon name="arrow" size={14} />
                </button>
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
          overSummary={summaryOpen}
          onToast={(m) => setToast(m)}
          onDiscuss={(q) => {
            setFocusSourceIdx(null);
            setFocusIdx(null);
            setSummaryOpen(false);
            openWith(q);
          }}
        />
      )}
      {summaryOpen && (
        <CompanySummaryModal
          summary={COMPANY_SUMMARY}
          activeSourceId={summarySourceId}
          onOpenSource={(id) => setSummarySourceId(id)}
          onCloseSource={() => setSummarySourceId(null)}
          onOpenFocus={(fpId) => {
            const idx = FOCUS_POINTS.findIndex((p) => p.id === fpId);
            if (idx >= 0) {
              setSummarySourceId(null);
              setFocusIdx(idx);
            }
          }}
          onClose={() => { setSummarySourceId(null); setSummaryOpen(false); }}
          onOpenRisks={(opts) => {
            const row = opts.riskId ? RISKS_REGISTRY.find((r) => r.id === opts.riskId) : null;
            if (row) {
              setSummarySourceId(null);
              setSummaryOpen(false);
              setOpenRiskRow(row);
            } else {
              setSummarySourceId(null);
              setSummaryOpen(false);
              setRisksPageFilter(opts.filter ?? "high");
              handleNavigation("risks");
            }
          }}
          onDiscuss={() => {
            setSummarySourceId(null);
            setSummaryOpen(false);
            openWith(COMPANY_SUMMARY.discussQuestion);
          }}
          onClarify={() => {
            setSummarySourceId(null);
            setSummaryOpen(false);
            openWith(COMPANY_SUMMARY.clarificationQuestion);
          }}
          onToast={(m) => setToast(m)}
          focusOnTop={focusIdx !== null}
        />
      )}
      {openRiskRow && (
        <RiskDetailModal
          risk={buildRiskDetail(openRiskRow)}
          onClose={() => setOpenRiskRow(null)}
          onNavigateToProfile={() => { setOpenRiskRow(null); handleNavigation("kb"); }}
          onToast={(m) => setToast(m)}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
