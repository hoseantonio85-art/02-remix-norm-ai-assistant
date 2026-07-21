import type {
  Area,
  Attribute,
  Knowledge,
  KnowledgeItem,
  Source,
} from "../types/profile";
import type {
  KnowledgeNode,
  KnowledgeSource,
  KnowledgeSourceReference,
  UniversalKnowledge,
  UniversalKnowledgeAlert,
  UniversalKnowledgeTag,
  KnowledgeValueType,
} from "../types/universalKnowledge";

type StateCode =
  | "known" | "partial" | "known_empty" | "unknown"
  | "not_applicable" | "conflicting";
function coerceState(s: { code: string; label: string } | undefined) {
  if (!s) return { code: "unknown" as StateCode, label: "Пока неизвестно" };
  return { code: (s.code as StateCode) || ("unknown" as StateCode), label: s.label };
}

export interface UniversalArea {
  id: string;
  title: string;
  description?: string | null;
  knowledge: UniversalKnowledge[];
}

/* ---------- audit counters (dev only) ---------- */
interface AuditCounters {
  areas: number; knowledge: number;
  items: number; attributes: number; children: number;
  sources: number; alerts: number; links: number;
  statuses: number; tags: number;
  itemsConverted: number; attributesConverted: number; childrenConverted: number;
  statusesConverted: number; tagsConverted: number; linksConverted: number;
  sourcesConverted: number; alertsConverted: number;
  valueDedupSkipped: number;
  unsupported: string[];
}
let AUDIT: AuditCounters | null = null;
function initAudit(): AuditCounters {
  return {
    areas: 0, knowledge: 0, items: 0, attributes: 0, children: 0,
    sources: 0, alerts: 0, links: 0, statuses: 0, tags: 0,
    itemsConverted: 0, attributesConverted: 0, childrenConverted: 0,
    statusesConverted: 0, tagsConverted: 0, linksConverted: 0,
    sourcesConverted: 0, alertsConverted: 0,
    valueDedupSkipped: 0, unsupported: [],
  };
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string" && v.trim() === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function primitiveTypeFor(value: unknown, hint?: string): KnowledgeValueType {
  if (Array.isArray(value)) return "array";
  if (hint === "date") return "date";
  if (hint === "number") return "number";
  if (hint === "year") return "number";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  const s = String(value ?? "");
  return s.length > 240 ? "text" : "string";
}

function coerceNumber(v: unknown): number | string | null {
  if (typeof v === "number") return v;
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/\s+/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : String(v);
}

/** Normalize a scalar for equality comparison between item.value and an attribute value. */
function normalizeForCompare(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map(normalizeForCompare).join("|");
  if (typeof v === "number") return String(v);
  const s = String(v).trim().replace(/\s+/g, " ");
  // number-like: strip trailing % and commas -> canonical numeric form
  const asNum = Number(s.replace(",", ".").replace(/%$/, ""));
  if (Number.isFinite(asNum) && /^-?\d+(?:[.,]\d+)?%?$/.test(s)) return String(asNum);
  return s.toLowerCase();
}

function attributeToNode(a: Attribute, item: KnowledgeItem): KnowledgeNode {
  const id = `${item.id}.${a.key}`;
  if (AUDIT) AUDIT.attributesConverted += 1;
  if (Array.isArray(a.value)) {
    return {
      id,
      key: a.key,
      label: a.label,
      valueType: "array",
      format: a.format ?? null,
      children: (a.value as string[]).map((v, i) => ({
        id: `${id}.${i}`,
        key: String(i),
        label: null,
        valueType: "string",
        value: String(v),
      })),
    };
  }
  const t = primitiveTypeFor(a.value, a.value_type);
  let value: string | number | boolean | null = null;
  if (a.value != null) {
    if (t === "number") {
      const n = coerceNumber(a.value);
      value = typeof n === "number" ? n : (n as string);
    } else if (t === "boolean") {
      value = Boolean(a.value);
    } else {
      value = String(a.value);
    }
  }
  return {
    id,
    key: a.key,
    label: a.label,
    valueType: t,
    value,
    format: a.format ?? null,
    children: [],
  };
}

function itemToNode(item: KnowledgeItem): KnowledgeNode {
  if (AUDIT) AUDIT.itemsConverted += 1;
  const attrs = (item.attributes || []).filter((a) => !isEmpty(a.value));
  const kids = item.children || [];
  const hasValue = !isEmpty(item.value);
  const hasDescription = !!item.description && item.description.trim() !== "";

  // status / tags / links preserved on the node
  const status = item.status
    ? { code: item.status.code, label: item.status.label, tone: item.status.tone ?? null }
    : null;
  const tags = (item.tags || []).map((t) => ({ code: t.code, label: t.label, tone: t.tone ?? null }));
  const links = (item.links || []).map((l) => ({ label: l.label, url: l.url }));
  if (AUDIT) {
    if (status) AUDIT.statusesConverted += 1;
    AUDIT.tagsConverted += tags.length;
    AUDIT.linksConverted += links.length;
    AUDIT.childrenConverted += kids.length;
  }

  // pure primitive: only value, nothing else
  if (
    hasValue &&
    attrs.length === 0 &&
    kids.length === 0 &&
    !hasDescription &&
    tags.length === 0 &&
    !status &&
    links.length === 0
  ) {
    const v = item.value as string | number;
    return {
      id: item.id,
      key: item.id,
      label: item.title,
      valueType: primitiveTypeFor(v),
      value: typeof v === "number" ? v : String(v),
      children: [],
    };
  }

  const children: KnowledgeNode[] = [];

  // dedup: skip __value if it matches any attribute value
  const valueMatchesAttr =
    hasValue &&
    attrs.some((a) => normalizeForCompare(a.value) === normalizeForCompare(item.value));
  if (hasValue && valueMatchesAttr && AUDIT) AUDIT.valueDedupSkipped += 1;

  if (hasValue && !valueMatchesAttr) {
    const v = item.value as string | number;
    children.push({
      id: `${item.id}.__value`,
      key: "value",
      label: null,
      valueType: primitiveTypeFor(v),
      value: typeof v === "number" ? v : String(v),
      children: [],
    });
  }
  if (hasDescription) {
    children.push({
      id: `${item.id}.__description`,
      key: "description",
      label: attrs.length === 0 && kids.length === 0 ? null : "Описание",
      valueType: "text",
      value: item.description as string,
      children: [],
    });
  }
  for (const a of attrs) children.push(attributeToNode(a, item));
  for (const c of kids) children.push(itemToNode(c));

  return {
    id: item.id,
    key: item.id,
    label: item.title,
    valueType: "object",
    children,
    status,
    tags,
    links,
  };
}

function normalizeSources(k: Knowledge): KnowledgeSource[] {
  if (AUDIT) AUDIT.sourcesConverted += (k.sources || []).length;
  return (k.sources || []).map((s: Source) => ({
    id: s.id,
    type: s.type,
    name: s.name,
    dataset: s.dataset ?? null,
    documentName: (s as Source).document_name ?? null,
    fileName: (s as Source).document_name ?? null,
    official: s.official,
    actualAt: k.actual_at ?? null,
  }));
}

function normalizeAlerts(k: Knowledge): UniversalKnowledgeAlert[] {
  const list = k.alerts || [];
  if (AUDIT) AUDIT.alertsConverted += list.length;
  return list.map((a, i) => ({
    id: `${k.id}.alert.${i}`,
    code: a.code,
    severity: a.severity,
    message: a.message,
    targetItemId: a.target_item_id ?? null,
    action: a.action
      ? {
          type: a.action.type,
          label: a.action.label,
          targetItemId: a.action.target_item_id ?? null,
        }
      : null,
  }));
}

function collectTags(k: Knowledge): UniversalKnowledgeTag[] {
  const seen = new Set<string>();
  const out: UniversalKnowledgeTag[] = [];
  for (const it of k.items || []) {
    for (const t of it.tags || []) {
      if (seen.has(t.code)) continue;
      seen.add(t.code);
      out.push({ code: t.code, label: t.label, tone: t.tone });
    }
  }
  return out;
}

function collectSourceEvidence(k: Knowledge): KnowledgeSourceReference[] {
  return (k.sources || []).map((s) => ({ sourceId: s.id }));
}

export function normalizeKnowledge(k: Knowledge): UniversalKnowledge {
  if (AUDIT) AUDIT.knowledge += 1;
  const items = k.items || [];
  let content: KnowledgeNode;
  if (items.length === 0) {
    content = {
      id: `${k.id}.content`,
      key: "content",
      label: k.title,
      valueType: "object",
      children: [],
      state: k.state.code === "known_empty"
        ? { code: "known_empty" as StateCode, label: "Не выявлено" }
        : coerceState(k.state),
    };
  } else if (items.length === 1) {
    content = itemToNode(items[0]);
    // Strip label duplication: root content label = knowledge title
    content = { ...content, label: k.title };
  } else {
    content = {
      id: `${k.id}.content`,
      key: "items",
      label: k.title,
      valueType: "array",
      children: items.map((it) => itemToNode(it)),
    };
  }

  return {
    id: k.id,
    areaId: k.area_id,
    key: k.id,
    title: k.title,
    description: k.summary ?? null,
    state: coerceState(k.state),
    content,
    metadata: {
      actualAt: k.actual_at ?? null,
      freshness: {
        code: k.freshness?.code ?? null,
        label: k.freshness?.label ?? null,
        reason: k.freshness?.reason ?? null,
      },
      origin: undefined,
      sourceEvidence: collectSourceEvidence(k),
    },
    sources: normalizeSources(k),
    tags: collectTags(k),
    alerts: normalizeAlerts(k),
  };
}

export function normalizeArea(area: Area): UniversalArea {
  if (AUDIT) AUDIT.areas += 1;
  return {
    id: area.id,
    title: area.title,
    description: area.description ?? null,
    knowledge: (area.knowledge || []).map(normalizeKnowledge),
  };
}

function countRawTotals(areas: Area[], a: AuditCounters) {
  const walk = (item: KnowledgeItem) => {
    a.attributes += (item.attributes || []).length;
    a.links += (item.links || []).length;
    if (item.status) a.statuses += 1;
    a.tags += (item.tags || []).length;
    for (const c of item.children || []) {
      a.children += 1;
      walk(c);
    }
  };
  for (const ar of areas) {
    for (const k of ar.knowledge || []) {
      a.sources += (k.sources || []).length;
      a.alerts += (k.alerts || []).length;
      for (const it of k.items || []) {
        a.items += 1;
        walk(it);
      }
    }
  }
}

export function normalizeProfile(areas: Area[]): UniversalArea[] {
  const isDev =
    typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV === true;
  if (isDev) {
    AUDIT = initAudit();
    countRawTotals(areas, AUDIT);
  }
  const out = areas.map(normalizeArea);
  if (isDev && AUDIT) {
    const a = AUDIT;
    // eslint-disable-next-line no-console
    console.group("Profile normalization audit");
    // eslint-disable-next-line no-console
    console.log({
      areasBefore: areas.length,
      areasAfter: out.length,
      knowledgeBefore: areas.reduce((n, x) => n + (x.knowledge?.length || 0), 0),
      knowledgeAfter: a.knowledge,
      itemsConverted: a.itemsConverted,
      attributesConverted: a.attributesConverted,
      childrenConverted: a.childrenConverted,
      statusesConverted: `${a.statusesConverted}/${a.statuses}`,
      tagsConverted: `${a.tagsConverted}/${a.tags}`,
      linksConverted: `${a.linksConverted}/${a.links}`,
      sourcesConverted: `${a.sourcesConverted}/${a.sources}`,
      alertsConverted: `${a.alertsConverted}/${a.alerts}`,
      valueDedupSkipped: a.valueDedupSkipped,
      unsupportedFields: a.unsupported,
    });
    // eslint-disable-next-line no-console
    console.groupEnd();
    AUDIT = null;
  }
  return out;
}

/** Primary source per spec: source referenced by the first filled evidence,
 *  else the first source in the array. */
export function pickPrimarySource(k: UniversalKnowledge): KnowledgeSource | null {
  const sources = k.sources || [];
  if (sources.length === 0) return null;
  const ev = (k.metadata?.sourceEvidence || []).find((e) => !!e.sourceId);
  if (ev) {
    const found = sources.find((s) => s.id === ev.sourceId);
    if (found) return found;
  }
  return sources[0];
}