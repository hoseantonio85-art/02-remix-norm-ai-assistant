import { useState } from "react";
import type {
  KnowledgeFormat,
  KnowledgeMetadata,
  KnowledgeNode,
} from "../types/universalKnowledge";

const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

interface DateParts {
  year: string;
  month: string;
  day: string;
  hour?: string;
  minute?: string;
  second?: string;
}

function parseDateParts(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(value);
  if (!match) return null;
  return {
    year: match[1], month: match[2], day: match[3],
    hour: match[4], minute: match[5], second: match[6],
  };
}

function applyDatePattern(parts: DateParts, pattern: string): string {
  const monthIndex = Number(parts.month) - 1;
  const replacements: Record<string, string> = {
    YYYY: parts.year,
    MMMM: MONTHS_RU[monthIndex] || parts.month,
    MM: parts.month,
    DD: parts.day,
    HH: parts.hour || "00",
    mm: parts.minute || "00",
    ss: parts.second || "00",
  };
  return Object.entries(replacements).reduce(
    (result, [token, replacement]) => result.replaceAll(token, replacement),
    pattern,
  );
}

function formatDate(value: string, format?: KnowledgeFormat): string {
  const parts = parseDateParts(value);
  if (!parts) return value;
  if (format?.datePattern) return applyDatePattern(parts, format.datePattern);
  const monthIndex = Number(parts.month) - 1;
  return `${Number(parts.day)} ${MONTHS_RU[monthIndex] || parts.month} ${parts.year}`;
}

function formatDateTime(value: string, format?: KnowledgeFormat): string {
  const parts = parseDateParts(value);
  if (!parts) return value;
  if (format?.datePattern) return applyDatePattern(parts, format.datePattern);
  const date = formatDate(value);
  const time = parts.hour && parts.minute
    ? `${parts.hour}:${parts.minute}${parts.second ? `:${parts.second}` : ""}`
    : "";
  const timezone = format?.timezone ? ` (${format.timezone})` : "";
  return time ? `${date}, ${time}${timezone}` : date;
}

export function formatNodeValue(node: KnowledgeNode): string {
  if (node.displayValue) return node.displayValue;
  const value = node.value;
  if (value === null || value === undefined || value === "") return "";
  const format = node.format || undefined;
  if (node.valueType === "enum") {
    return node.enumLabels?.[String(value)] || String(value);
  }
  if (typeof value === "boolean") {
    return value
      ? format?.trueLabel || "Да"
      : format?.falseLabel || "Нет";
  }
  if (node.valueType === "datetime" || format?.kind === "datetime") {
    return formatDateTime(String(value), format);
  }
  if (node.valueType === "date" || format?.kind === "date") {
    return formatDate(String(value), format);
  }
  if (format?.kind === "money" && typeof value === "number") {
    try {
      return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: format.currency || "RUB",
        maximumFractionDigits: format.decimals ?? 0,
        minimumFractionDigits: format.decimals ?? 0,
      }).format(value);
    } catch {
      return String(value);
    }
  }
  if (format?.kind === "percentage") {
    return `${value}${format.suffix ?? "%"}`;
  }
  if (format?.kind === "number" && typeof value === "number") {
    const formatted = new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: format.decimals ?? 0,
      minimumFractionDigits: format.decimals ?? 0,
    }).format(value);
    return format.unit ? `${formatted} ${format.unit}` : formatted;
  }
  let result = String(value);
  if (format?.prefix) result = format.prefix + result;
  if (format?.suffix) result += format.suffix;
  return result;
}

function hasOwnValue(node: KnowledgeNode): boolean {
  return node.displayValue != null && node.displayValue !== "" ||
    node.value !== null && node.value !== undefined && node.value !== "";
}

function isNodeEmpty(node: KnowledgeNode): boolean {
  if (node.state) return false;
  if (hasOwnValue(node)) return false;
  if (node.valueType === "object" || node.valueType === "array") {
    return (node.children || []).every(shouldHideNode);
  }
  return true;
}

/** Explicit completeness states are visible; only truly absent untyped data is hidden. */
export function shouldHideNode(node: KnowledgeNode): boolean {
  return isNodeEmpty(node);
}

const CLASSIFICATION_LABEL_RE =
  /^(юридическое лицо|физическое лицо|дочерняя компания|учредитель|руководитель|поставщик|клиент|компания|действующая?|действующий( учредитель| руководитель)?)$/i;

const CLASSIFICATION_CODE_RE =
  /^(legal_entity|individual|subsidiary|founder|director|manager|supplier|client|company|active(_founder|_director|_manager|_company)?|entity_type|role_.*|kind_.*|type_.*)$/i;

function isClassificationTag(tag: { code: string; label: string }): boolean {
  return CLASSIFICATION_CODE_RE.test(tag.code || "") ||
    CLASSIFICATION_LABEL_RE.test((tag.label || "").trim());
}

export function getPrimaryNodeBadge(
  node: KnowledgeNode,
): { label: string; tone: string } | null {
  if (node.status) {
    return { label: node.status.label, tone: node.status.tone || "neutral" };
  }
  const tags = (node.tags || []).filter((tag) => !isClassificationTag(tag));
  if (tags.length > 0) return { label: tags[0].label, tone: tags[0].tone || "neutral" };
  return null;
}

export type RendererCtx = {
  parentTitle?: string | null;
};

export function UniversalValueRenderer({
  node,
  depth = 0,
  parentTitle = null,
  suppressOwnMeta = false,
}: {
  node: KnowledgeNode;
  depth?: number;
  parentTitle?: string | null;
  suppressOwnMeta?: boolean;
}) {
  if (shouldHideNode(node)) return null;
  if (isStateOnly(node)) return <StateNotice node={node} />;
  if (node.valueType === "object") {
    return <ObjectRenderer node={node} depth={depth} parentTitle={parentTitle} suppressOwnMeta={suppressOwnMeta} />;
  }
  if (node.valueType === "array") {
    return <ArrayRenderer node={node} depth={depth} />;
  }
  if (node.valueType === "text") {
    return <TextRenderer node={node} />;
  }
  return <PrimitiveRenderer node={node} />;
}

function isStateOnly(node: KnowledgeNode): boolean {
  const code = node.state?.code;
  if (!code || !["known_empty", "unknown", "not_applicable"].includes(code)) return false;
  const visibleChildren = (node.children || []).filter((child) => !shouldHideNode(child));
  return !hasOwnValue(node) && visibleChildren.length === 0;
}

function StateNotice({ node }: { node: KnowledgeNode }) {
  const code = node.state?.code || "unknown";
  const fallback = code === "known_empty" ? "Не выявлено"
    : code === "not_applicable" ? "Неприменимо"
    : "Пока неизвестно";
  return (
    <div className={`np-uv-state np-uv-state--${code}`}>
      <span>{node.state?.label || fallback}</span>
      {node.state?.reason && <span className="np-uv-state-reason">{node.state.reason}</span>}
    </div>
  );
}

function PrimitiveRenderer({ node }: { node: KnowledgeNode }) {
  const text = formatNodeValue(node) || "—";
  const value = node.value == null ? "" : String(node.value);
  const safeUrl = node.valueType === "url" && /^https?:\/\//i.test(value);
  return (
    <span className="np-uv-primitive">
      {safeUrl ? (
        <a className="np-uv-link" href={value} target="_blank" rel="noreferrer">{text}</a>
      ) : (
        <span className="np-uv-value">{text}</span>
      )}
      <NodeMetadata metadata={node.metadata} />
    </span>
  );
}

function NodeBadge({ node }: { node: KnowledgeNode }) {
  const badge = getPrimaryNodeBadge(node);
  if (!badge) return null;
  return (
    <div className="np-uv-status-row">
      <span className={`np-uv-status np-uv-status--${badge.tone}`}>{badge.label}</span>
    </div>
  );
}

function NodeLinks({ node }: { node: KnowledgeNode }) {
  if (!node.links || node.links.length === 0) return null;
  return (
    <div className="np-uv-links">
      {node.links.map((link) => (
        <a key={`${link.url}:${link.label}`} className="np-uv-link" href={link.url} target="_blank" rel="noreferrer">
          {link.label}
        </a>
      ))}
    </div>
  );
}

function metadataRows(metadata?: KnowledgeMetadata | null): Array<[string, string]> {
  if (!metadata) return [];
  const rows: Array<[string, string]> = [];
  if (metadata.actualAt) rows.push(["Актуально на", formatDateTime(metadata.actualAt)]);
  if (metadata.validFrom) rows.push(["Действует с", formatDateTime(metadata.validFrom)]);
  if (metadata.validityTo) rows.push(["Действует до", formatDateTime(metadata.validityTo)]);
  if (metadata.origin?.name || metadata.origin?.type) {
    rows.push(["Происхождение", metadata.origin.name || metadata.origin.type || ""]);
  }
  if (metadata.confidence != null) rows.push(["Уверенность", `${Math.round(metadata.confidence * 100)}%`]);
  if (metadata.riskRelevanceScore != null) {
    rows.push(["Значимость для риска", `${Math.round(metadata.riskRelevanceScore * 100)}%`]);
  }
  if (metadata.sourceEvidence?.length) {
    rows.push(["Подтверждения", String(metadata.sourceEvidence.length)]);
  }
  if (metadata.access?.classification) rows.push(["Доступ", metadata.access.classification]);
  return rows.filter(([, value]) => value !== "");
}

function hasDistinctAtomicMetadata(metadata?: KnowledgeMetadata | null): boolean {
  if (!metadata) return false;
  const detailedEvidence = metadata.sourceEvidence?.some((evidence) =>
    !!evidence.quote || (!!evidence.locator && Object.values(evidence.locator).some((value) => value != null)),
  );
  return !!(
    metadata.validFrom ||
    metadata.validityTo ||
    metadata.confidence != null ||
    metadata.riskRelevanceScore != null ||
    metadata.access?.classification ||
    detailedEvidence
  );
}

function NodeMetadata({ metadata }: { metadata?: KnowledgeMetadata | null }) {
  if (!hasDistinctAtomicMetadata(metadata)) return null;
  const rows = metadataRows(metadata);
  if (rows.length === 0) return null;
  return (
    <details className="np-uv-meta">
      <summary aria-label="О данных" title="О данных"><span aria-hidden>i</span></summary>
      <div className="np-uv-meta-panel">
        {rows.map(([label, value]) => (
          <div key={label} className="np-uv-meta-row">
            <span>{label}</span><strong>{value}</strong>
          </div>
        ))}
      </div>
    </details>
  );
}

function TextRenderer({ node }: { node: KnowledgeNode }) {
  const [expanded, setExpanded] = useState(false);
  const value = formatNodeValue(node);
  if (!value) return <StateNotice node={node} />;
  const long = value.length > 320;
  return (
    <div className="np-uv-text">
      <p className={`np-uv-text-body ${long && !expanded ? "is-clamped" : ""}`}>{value}</p>
      {long && (
        <button type="button" className="np-uv-link" onClick={() => setExpanded((current) => !current)}>
          {expanded ? "Свернуть" : "Показать полностью"}
        </button>
      )}
      <NodeMetadata metadata={node.metadata} />
    </div>
  );
}

function CompositeOwnValue({ node }: { node: KnowledgeNode }) {
  if (!hasOwnValue(node)) return null;
  return (
    <div className="np-uv-own-value">
      <PrimitiveRenderer node={{
        ...node,
        valueType: node.valueType === "array" || node.valueType === "object" ? "string" : node.valueType,
        metadata: null,
      }} />
    </div>
  );
}

function ObjectRenderer({
  node, depth, parentTitle, suppressOwnMeta,
}: { node: KnowledgeNode; depth: number; parentTitle: string | null; suppressOwnMeta?: boolean }) {
  const children = (node.children || []).filter((child) => !shouldHideNode(child));
  const badge = suppressOwnMeta ? null : getPrimaryNodeBadge(node);
  const hasMeta = !!badge || !!node.links?.length || metadataRows(node.metadata).length > 0;
  if (children.length === 0 && !hasMeta && !hasOwnValue(node)) return null;
  const indentClass = depth >= 2 ? "np-uv-indent" : "";

  return (
    <div className={`np-uv-object ${indentClass}`}>
      {!suppressOwnMeta && <NodeBadge node={node} />}
      <CompositeOwnValue node={node} />
      {children.map((child) => {
        const composite = child.valueType === "object" || child.valueType === "array";
        const longText = child.valueType === "text";
        const label = child.label && child.label !== parentTitle && child.label !== node.label
          ? child.label
          : null;
        if (composite) {
          return (
            <div key={child.id} className="np-uv-group">
              {label && <div className="np-uv-group-title">{label}</div>}
              <UniversalValueRenderer node={child} depth={depth + 1} parentTitle={label} />
            </div>
          );
        }
        if (longText) {
          return (
            <div key={child.id} className="np-uv-block">
              {label && <div className="np-uv-block-label">{label}</div>}
              <UniversalValueRenderer node={child} depth={depth + 1} />
            </div>
          );
        }
        return (
          <div key={child.id} className="np-uv-row">
            <div className="np-uv-row-key">{label ?? ""}</div>
            <div className="np-uv-row-val">
              <UniversalValueRenderer node={child} depth={depth + 1} />
            </div>
          </div>
        );
      })}
      {!suppressOwnMeta && <NodeMetadata metadata={node.metadata} />}
      <NodeLinks node={node} />
    </div>
  );
}

const ARRAY_LIMIT = 3;

function CollectionStatus({ node, visibleCount }: { node: KnowledgeNode; visibleCount: number }) {
  const info = node.collection;
  if (!info) return null;
  const loaded = info.loadedCount ?? (node.children || []).length;
  const total = info.totalCount ?? loaded;
  if (!info.truncated && total === loaded) return null;
  return (
    <div className="np-uv-collection-status">
      Загружено {loaded} из {total}
      {visibleCount < loaded && <span> · сейчас показано {visibleCount}</span>}
      {info.truncated && <span> · коллекция загружена частично</span>}
      {info.nextCursor && <span> · доступно продолжение</span>}
    </div>
  );
}

function ArrayRenderer({ node, depth }: { node: KnowledgeNode; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const children = (node.children || []).filter((child) => !shouldHideNode(child));
  if (children.length === 0) return <StateNotice node={node} />;
  const visible = expanded ? children : children.slice(0, ARRAY_LIMIT);
  const rest = children.length - ARRAY_LIMIT;
  const allPrimitive = children.every(
    (child) => !["object", "array", "text"].includes(child.valueType),
  );

  return (
    <div className="np-uv-array">
      <CompositeOwnValue node={node} />
      {allPrimitive ? (
        <ul className="np-uv-list">
          {visible.map((child) => (
            <li key={child.id} className="np-uv-list-item">
              {child.key !== "item" && (
                <div className="np-uv-list-heading">
                  <span className="np-uv-list-label">{child.label || child.key}</span>
                  {child.label && child.label !== child.key && (
                    <span className="np-uv-list-key">{child.key}</span>
                  )}
                </div>
              )}
              <UniversalValueRenderer node={child} depth={depth + 1} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="np-uv-items">
          {visible.map((child) => {
            const itemTitle = child.label || "Элемент";
            const badge = getPrimaryNodeBadge(child);
            return (
              <div key={child.id} className="np-uv-item">
                <div className="np-uv-item-title-row">
                  <div className="np-uv-item-title">{itemTitle}</div>
                  {badge && (
                    <span className={`np-uv-status np-uv-status--${badge.tone}`}>{badge.label}</span>
                  )}
                </div>
                <UniversalValueRenderer node={child} depth={depth + 1} parentTitle={itemTitle} suppressOwnMeta />
              </div>
            );
          })}
        </div>
      )}
      <CollectionStatus node={node} visibleCount={visible.length} />
      {rest > 0 && (
        <button type="button" className="np-uv-link" onClick={() => setExpanded((current) => !current)}>
          {expanded ? "Свернуть" : `Показать ещё ${rest}`}
        </button>
      )}
      <NodeMetadata metadata={node.metadata} />
    </div>
  );
}
