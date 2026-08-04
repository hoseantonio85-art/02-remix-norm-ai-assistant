import type {
  KnowledgeFormat,
  KnowledgeMetadata,
  KnowledgeNode,
  KnowledgeSource,
  KnowledgeState,
  KnowledgeStateCode,
  KnowledgeValueType,
  UniversalArea,
  UniversalKnowledge,
} from "../types/universalKnowledge";

export const ANALYST_AREAS = [
  { id: "general_information", title: "Общая информация", description: "Регистрационные сведения, профиль и масштаб компании." },
  { id: "structure_management", title: "Структура и управление", description: "Руководители, ключевые менеджеры и персонал." },
  { id: "owners_relations", title: "Собственники и связи", description: "Учредители, головные и дочерние компании." },
  { id: "products_business_model", title: "Продукты и бизнес-модель", description: "Продукты, бизнес-модель, цели и проекты." },
  { id: "operations", title: "Операционная деятельность", description: "География, сезонность, филиалы и операционные проекты." },
  { id: "it_data_technology", title: "ИТ, данные и технологии", description: "Технологические цели, платформы и автоматизация." },
  { id: "finance", title: "Финансы", description: "Финансовые показатели, налоги и финансовые цели." },
  { id: "regulation_risk_signals", title: "Регуляторика и риск-сигналы", description: "Лицензии, реестры, регуляторы и внешние факторы." },
  { id: "counterparties", title: "Контрагенты", description: "Дебиторы, кредиторы и иные контрагенты." },
] as const;

export type AnalystAreaId = (typeof ANALYST_AREAS)[number]["id"];

export interface AnalystFieldDefinition {
  title?: string;
  valueType?: KnowledgeValueType;
  objectType?: string;
  source?: "AG" | "ES" | "UI" | "SYSTEM" | string;
  editable?: boolean;
  format?: KnowledgeFormat | null;
  enumLabels?: Record<string, string>;
}

export type AnalystFieldCatalog = Record<string, Record<string, AnalystFieldDefinition>>;

export interface AnalystAdapterOptions {
  catalog?: AnalystFieldCatalog;
  /**
   * Empty arrays are unknown by default. A producer must explicitly opt a path
   * into known_empty or not_applicable when it has field-level evidence.
   */
  emptyCollectionStates?: Record<string, KnowledgeStateCode | KnowledgeState>;
  actualAt?: string | null;
}

const LABELS: Record<string, string> = {
  shortName: "Краткое наименование",
  name: "Наименование",
  inn: "ИНН",
  ogrn: "ОГРН",
  kpp: "КПП",
  legalAddress: "Юридический адрес",
  foundingDate: "Дата регистрации",
  industry: "Отрасль",
  okved: "Основной ОКВЭД",
  additionalOkved: "Дополнительные ОКВЭД",
  capitals: "Уставный капитал",
  taxRegime: "Налоговый режим",
  description: "Описание",
  geoOfOperations: "География деятельности",
  naturalTechFactors: "Природные и техногенные факторы",
  seasonality: "Сезонность",
  goals: "Стратегические цели",
  keyInvestProjects: "Инвестиционные проекты",
  keyManager: "Ключевые менеджеры",
  keyManagers: "Ключевые менеджеры",
  personnelTotal: "Численность сотрудников",
  founder: "Учредители",
  founders: "Учредители",
  director: "Руководители",
  directors: "Руководители",
  directorDisqualified: "Дисквалифицированные лица",
  subsidiary: "Дочерние компании",
  subsidiaries: "Дочерние компании",
  branch: "Филиалы",
  branches: "Филиалы",
  branchesCountries: "Страны присутствия филиалов",
  nonbankRevenue: "Выручка небанковского бизнеса",
  operatingIncome: "Операционный доход",
  taxDebt: "Налоговая задолженность",
  receivable: "Основные дебиторы",
  receivablesTop20: "Основные дебиторы",
  license: "Лицензии",
  licensesFinancial: "Финансовые лицензии",
  rnpRecord: "Реестр недобросовестных поставщиков",
  rnpStatus: "Реестр недобросовестных поставщиков",
  regulator: "Регуляторы",
  regulators: "Регуляторы",
  enforcementTotal: "Исполнительные производства",
  arbitrationTotal: "Арбитражные дела",
  extras: "Дополнительные сведения",
  extra: "Дополнительные сведения",
  role: "Должность",
  position: "Должность",
  responsibilities: "Зона ответственности",
  level: "Уровень",
  status: "Статус",
  amount: "Сумма",
  count: "Количество",
  totalCount: "Общее количество",
  totalSum: "Общая сумма",
  effectiveDate: "Дата актуальности записи",
  expiryDate: "Действует до",
  inclusionDate: "Дата включения",
  exclusionDate: "Дата исключения",
};

const SOURCE_NAMES: Record<string, string> = {
  AG: "Аналитический агент",
  ES: "Корпоративное хранилище",
  UI: "Пользовательский ввод",
  SYSTEM: "Системный источник",
  QWEN: "Результат профилирования Qwen",
};

export function humanizeKey(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-zа-я0-9])([A-ZА-Я])/g, "$1 $2")
    .trim();
  return spaced ? spaced[0].toUpperCase() + spaced.slice(1) : key;
}

export function catalogDefinition(
  catalog: AnalystFieldCatalog | undefined,
  objectType: string,
  key: string,
): AnalystFieldDefinition {
  return catalog?.[objectType]?.[key] || {};
}

export function sourceFor(code = "AG", actualAt?: string | null): KnowledgeSource {
  return {
    id: `analyst-${code.toLowerCase()}`,
    type: "analyst_source",
    name: SOURCE_NAMES[code] || code,
    dataset: code,
    actualAt: actualAt ?? null,
  };
}

export function stateLabel(code: KnowledgeStateCode): string {
  const labels: Record<KnowledgeStateCode, string> = {
    known: "Известно",
    partial: "Известно частично",
    known_empty: "Не выявлено",
    unknown: "Пока неизвестно",
    not_applicable: "Неприменимо",
    conflicting: "Есть расхождения",
  };
  return labels[code];
}

export function resolveEmptyState(
  path: string,
  options: AnalystAdapterOptions,
): KnowledgeState {
  const explicit = options.emptyCollectionStates?.[path];
  if (typeof explicit === "string") {
    return { code: explicit, label: stateLabel(explicit) };
  }
  if (explicit) return explicit;
  return {
    code: "unknown",
    label: stateLabel("unknown"),
    reason: "Источник не передал состояние пустой коллекции",
  };
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

function stableObjectKey(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    for (const key of ["id", "inn", "ogrn", "rnpId", "registrationNumber", "number", "name", "counterparty", "key"]) {
      const candidate = unwrapScalar(record[key]);
      if (candidate !== null && candidate !== "") return String(candidate);
    }
  }
  return JSON.stringify(canonicalize(value));
}

function safePart(value: string): string {
  const clean = value.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-|-$/g, "");
  return clean.slice(0, 48) || stableHash(value);
}

export function stableChildId(parentId: string, value: unknown): string {
  const businessKey = stableObjectKey(value);
  return `${parentId}.${safePart(businessKey)}-${stableHash(businessKey)}`;
}

export function isValueEnvelope(value: unknown): value is { value: unknown; metadata?: Record<string, unknown> } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.prototype.hasOwnProperty.call(record, "value") &&
    (Object.prototype.hasOwnProperty.call(record, "metadata") || Object.keys(record).length <= 2);
}

export function unwrapScalar(value: unknown): string | number | boolean | null {
  if (isValueEnvelope(value)) return unwrapScalar(value.value);
  if (value === null || value === undefined) return null;
  if (["string", "number", "boolean"].includes(typeof value)) {
    return value as string | number | boolean;
  }
  return null;
}

function metadataFromEnvelope(
  raw: Record<string, unknown> | undefined,
  sourceCode: string,
  options: AnalystAdapterOptions,
): KnowledgeMetadata {
  const sourceEvidence = raw?.sourceEvidence;
  const evidence = Array.isArray(sourceEvidence)
    ? sourceEvidence
        .map((entry) => {
          if (typeof entry === "string") return { sourceId: `analyst-${sourceCode.toLowerCase()}`, quote: entry };
          if (entry && typeof entry === "object") {
            const x = entry as Record<string, unknown>;
            return { sourceId: String(x.sourceId || `analyst-${sourceCode.toLowerCase()}`), quote: x.quote == null ? null : String(x.quote) };
          }
          return null;
        })
        .filter((entry): entry is { sourceId: string; quote: string | null } => entry !== null)
    : [];
  return {
    actualAt: options.actualAt ?? null,
    validityTo: raw?.validityTo == null ? null : String(raw.validityTo),
    confidence: typeof raw?.confidence === "number" ? raw.confidence : null,
    riskRelevanceScore: typeof raw?.riskRelevanceScore === "number" ? raw.riskRelevanceScore : null,
    origin: { type: sourceCode, name: SOURCE_NAMES[sourceCode] || sourceCode },
    sourceEvidence: evidence,
    raw: raw ? { ...raw } : null,
  };
}

function statusFromEnvelope(raw: Record<string, unknown> | undefined): KnowledgeNode["status"] {
  const status = raw?.status;
  if (!status) return null;
  if (typeof status === "string") return { code: status, label: status, tone: null };
  if (typeof status === "object" && !Array.isArray(status)) {
    const record = status as Record<string, unknown>;
    const code = record.code == null ? String(record.label || "status") : String(record.code);
    const label = record.label == null ? code : String(record.label);
    return { code, label, tone: record.tone == null ? null : String(record.tone) };
  }
  return null;
}

function inferredType(value: unknown, definition: AnalystFieldDefinition): KnowledgeValueType {
  if (definition.valueType) return definition.valueType;
  if (Array.isArray(value)) return "array";
  if (value && typeof value === "object") return "object";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  const text = String(value ?? "");
  if (/^https?:\/\//i.test(text)) return "url";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) return "datetime";
  if (/^\d{4}-\d{2}-\d{2}(?:$|\s)/.test(text)) return "date";
  return text.length > 240 ? "text" : "string";
}

function normalizeExtraItem(
  value: Record<string, unknown>,
  id: string,
  options: AnalystAdapterOptions,
): KnowledgeNode | null {
  const key = unwrapScalar(value.fields && typeof value.fields === "object"
    ? (value.fields as Record<string, unknown>).key
    : value.key);
  const rawValue = value.fields && typeof value.fields === "object"
    ? (value.fields as Record<string, unknown>).value
    : value.value;
  const description = unwrapScalar(value.fields && typeof value.fields === "object"
    ? (value.fields as Record<string, unknown>).description
    : value.description);
  if (key === null || rawValue === undefined) return null;
  return nodeFromValue(rawValue, {
    id: `${id}.${safePart(String(key))}`,
    key: String(key),
    label: description == null ? humanizeKey(String(key)) : String(description),
    path: `${id}.${String(key)}`,
    objectType: "extra",
    sourceCode: "UI",
    options,
    semanticRole: "item",
  });
}

export interface NodeBuildContext {
  id: string;
  key: string;
  label: string;
  path: string;
  objectType: string;
  sourceCode: string;
  options: AnalystAdapterOptions;
  definition?: AnalystFieldDefinition;
  semanticRole?: KnowledgeNode["semanticRole"];
}

export function nodeFromValue(rawValue: unknown, context: NodeBuildContext): KnowledgeNode {
  const definition = context.definition ||
    catalogDefinition(context.options.catalog, context.objectType, context.key);
  const sourceCode = definition.source || context.sourceCode;
  const envelope = isValueEnvelope(rawValue) ? rawValue : null;
  const value = envelope ? envelope.value : rawValue;
  const metadata = metadataFromEnvelope(envelope?.metadata, sourceCode, context.options);
  const common = {
    id: context.id,
    key: context.key,
    label: definition.title || context.label,
    semanticRole: context.semanticRole,
    format: definition.format ?? null,
    enumLabels: definition.enumLabels,
    metadata,
    status: statusFromEnvelope(envelope?.metadata),
  } satisfies Partial<KnowledgeNode>;

  if (Array.isArray(value)) {
    const children = value
      .map((entry) => {
        const itemId = stableChildId(context.id, entry);
        if (context.key === "extra" || context.key === "extras") {
          const plain = isValueEnvelope(entry) ? entry.value : entry;
          if (plain && typeof plain === "object" && !Array.isArray(plain)) {
            return normalizeExtraItem(plain as Record<string, unknown>, context.id, context.options);
          }
        }
        return nodeFromValue(entry, {
          ...context,
          id: itemId,
          key: "item",
          label: itemLabel(entry),
          path: `${context.path}[]`,
          objectType: definition.objectType || context.key,
          semanticRole: "item",
          definition: undefined,
        });
      })
      .filter((entry): entry is KnowledgeNode => entry !== null);
    const state = children.length === 0
      ? resolveEmptyState(context.path, context.options)
      : { code: "known" as const, label: stateLabel("known") };
    return {
      ...common,
      valueType: "array",
      value: null,
      children,
      state,
      collection: {
        totalCount: children.length,
        loadedCount: children.length,
        truncated: false,
        nextCursor: null,
      },
    };
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const fields = record.fields && typeof record.fields === "object"
      ? record.fields as Record<string, unknown>
      : null;
    const childSource = fields || record;
    const children = Object.entries(childSource)
      .filter(([key]) => !["id", "version", "metadata", "nested", "dependents", "fields"].includes(key))
      .map(([key, child]) => nodeFromValue(child, {
        ...context,
        id: `${context.id}.${safePart(key)}`,
        key,
        label: humanizeKey(key),
        path: `${context.path}.${key}`,
        objectType: definition.objectType || context.objectType,
        semanticRole: "attribute",
        definition: undefined,
      }));

    for (const [groupName, groups] of Object.entries({
      nested: record.nested,
      dependents: record.dependents,
    })) {
      if (!groups || typeof groups !== "object" || Array.isArray(groups)) continue;
      for (const [key, child] of Object.entries(groups as Record<string, unknown>)) {
        children.push(nodeFromValue(child, {
          ...context,
          id: `${context.id}.${safePart(key)}`,
          key,
          label: humanizeKey(key),
          path: `${context.path}.${groupName}.${key}`,
          objectType: key,
          semanticRole: "group",
          definition: undefined,
        }));
      }
    }

    return {
      ...common,
      valueType: "object",
      value: null,
      children,
      state: children.length
        ? { code: "known", label: stateLabel("known") }
        : { code: "unknown", label: stateLabel("unknown"), reason: "Объект не содержит значений" },
    };
  }

  const valueType = inferredType(value, definition);
  return {
    ...common,
    valueType,
    value: value as string | number | boolean | null,
    children: [],
    state: value === null || value === ""
      ? { code: "unknown", label: stateLabel("unknown") }
      : { code: "known", label: stateLabel("known") },
  };
}

function itemLabel(value: unknown): string {
  const plain = isValueEnvelope(value) ? value.value : value;
  if (plain && typeof plain === "object" && !Array.isArray(plain)) {
    const record = plain as Record<string, unknown>;
    const fields = record.fields && typeof record.fields === "object"
      ? record.fields as Record<string, unknown>
      : record;
    for (const key of ["name", "counterparty", "number", "registrationNumber", "type", "key", "title"]) {
      const candidate = unwrapScalar(fields[key]);
      if (candidate !== null && candidate !== "") return String(candidate);
    }
  }
  const scalar = unwrapScalar(plain);
  return scalar === null ? "Элемент" : String(scalar).slice(0, 96);
}

export function knowledgeFromNode(
  areaId: AnalystAreaId,
  key: string,
  title: string,
  node: KnowledgeNode,
  sourceCode: string,
  actualAt?: string | null,
): UniversalKnowledge {
  const state = node.state || { code: "known", label: stateLabel("known") };
  return {
    schemaVersion: "2.0",
    id: `analyst.${areaId}.${key}`,
    areaId,
    key,
    title,
    epistemicKind: "fact",
    state,
    content: node,
    metadata: {
      actualAt: actualAt ?? null,
      origin: { type: sourceCode, name: SOURCE_NAMES[sourceCode] || sourceCode },
      sourceEvidence: [{ sourceId: `analyst-${sourceCode.toLowerCase()}` }],
    },
    sources: [sourceFor(sourceCode, actualAt)],
    tags: [],
    alerts: [],
    relations: [],
  };
}

export function areasFromKnowledge(knowledge: UniversalKnowledge[]): UniversalArea[] {
  return ANALYST_AREAS.map((area) => ({
    ...area,
    knowledge: knowledge.filter((item) => item.areaId === area.id),
  }));
}

export function areaFor(section: string, key: string): AnalystAreaId {
  if (["receivable", "receivablesTop20"].includes(key)) return "counterparties";
  if (section === "financialProfile") return "finance";
  if (section === "regulatoryProfile") return "regulation_risk_signals";
  if (["naturalTechFactors", "directorDisqualified"].includes(key)) return "regulation_risk_signals";
  if (["founder", "founders", "subsidiary", "subsidiaries"].includes(key)) return "owners_relations";
  if (["branch", "branches", "branchesCountries", "geoOfOperations", "seasonality"].includes(key)) return "operations";
  if (["director", "directors", "keyManager", "keyManagers", "personnelTotal"].includes(key)) return "structure_management";
  if (["capitals", "taxRegime", "nonbankRevenue", "operatingIncome", "taxDebt"].includes(key)) return "finance";
  if (["goals", "keyInvestProjects"].includes(key)) return "products_business_model";
  return "general_information";
}

export function strategicArea(value: unknown, fallback: AnalystAreaId): AnalystAreaId {
  const text = String(unwrapScalar(value) ?? "").toLowerCase();
  if (/выруч|прибыл|ebitda|маржин|финанс|денеж|капитал/.test(text)) return "finance";
  if (/\bit\b|\bai\b|ии|технолог|платформ|автоматизац|робот|software|данн/.test(text)) return "it_data_technology";
  if (/географ|город|логист|достав|даркстор|склад|esg|устойчив|транспорт|дрон|хаб/.test(text)) return "operations";
  return fallback;
}

export function splitStrategicArray(
  value: unknown,
  fallback: AnalystAreaId,
): Map<AnalystAreaId, unknown[]> {
  const raw = isValueEnvelope(value) ? value.value : value;
  const result = new Map<AnalystAreaId, unknown[]>();
  if (!Array.isArray(raw)) return result;
  for (const entry of raw) {
    const area = strategicArea(entry, fallback);
    const list = result.get(area) || [];
    list.push(entry);
    result.set(area, list);
  }
  return result;
}
