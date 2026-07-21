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

function attributeToNode(a: Attribute, item: KnowledgeItem): KnowledgeNode {
  const id = `${item.id}.${a.key}`;
  if (Array.isArray(a.value)) {
    return {
      id,
      key: a.key,
      label: a.label,
      valueType: "array",
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
    children: [],
  };
}

function itemToNode(item: KnowledgeItem): KnowledgeNode {
  const attrs = (item.attributes || []).filter((a) => !isEmpty(a.value));
  const kids = item.children || [];
  const hasValue = !isEmpty(item.value);
  const hasDescription = !!item.description && item.description.trim() !== "";

  // pure primitive: only value, nothing else
  if (
    hasValue &&
    attrs.length === 0 &&
    kids.length === 0 &&
    !hasDescription &&
    (!item.tags || item.tags.length === 0) &&
    !item.status &&
    (!item.links || item.links.length === 0)
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

  if (hasValue) {
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

  // If item has no fields at all — treat as known_empty
  if (children.length === 0) {
    return {
      id: item.id,
      key: item.id,
      label: item.title,
      valueType: "string",
      value: null,
      state: { code: "known_empty" as StateCode, label: "Не выявлено" },
      children: [],
    };
  }

  return {
    id: item.id,
    key: item.id,
    label: item.title,
    valueType: "object",
    children,
  };
}

function normalizeSources(k: Knowledge): KnowledgeSource[] {
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
  return (k.alerts || []).map((a, i) => ({
    id: `${k.id}.alert.${i}`,
    code: a.code,
    severity: a.severity,
    message: a.message,
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
  return {
    id: area.id,
    title: area.title,
    description: area.description ?? null,
    knowledge: (area.knowledge || []).map(normalizeKnowledge),
  };
}

export function normalizeProfile(areas: Area[]): UniversalArea[] {
  return areas.map(normalizeArea);
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