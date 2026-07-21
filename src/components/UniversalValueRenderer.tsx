import { useState } from "react";
import type { KnowledgeNode, KnowledgeFormat } from "../types/universalKnowledge";

const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const d = parseInt(m[3], 10);
  const mo = parseInt(m[2], 10) - 1;
  if (mo < 0 || mo > 11) return iso;
  return `${d} ${MONTHS_RU[mo]} ${m[1]}`;
}

function formatPrimitive(node: KnowledgeNode): string {
  if (node.displayValue) return node.displayValue;
  const v = node.value;
  if (v === null || v === undefined || v === "") return "";
  const f: KnowledgeFormat | undefined = node.format || undefined;
  if (typeof v === "boolean") return v ? "Да" : "Нет";
  if (node.valueType === "date" || node.valueType === "datetime" || f?.kind === "date") {
    return formatDate(String(v));
  }
  if (f?.kind === "money" && typeof v === "number") {
    try {
      return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: f.currency || "RUB",
        maximumFractionDigits: f.decimals ?? 0,
        minimumFractionDigits: 0,
      }).format(v);
    } catch {
      return String(v);
    }
  }
  if (f?.kind === "percentage") {
    return `${v}${f.suffix ?? "%"}`;
  }
  if (f?.kind === "number" && typeof v === "number") {
    const s = new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: f.decimals ?? 0,
    }).format(v);
    return f.unit ? `${s} ${f.unit}` : s;
  }
  if (f?.kind === "identifier") return String(v);
  let s = String(v);
  if (f?.prefix) s = f.prefix + s;
  if (f?.suffix) s = s + f.suffix;
  return s;
}

function isNodeEmpty(node: KnowledgeNode): boolean {
  const code = node.state?.code;
  if (code === "known_empty") return false;
  if (code === "unknown" || code === "not_applicable") return true;
  const v = node.value;
  if (node.valueType === "object" || node.valueType === "array") {
    const kids = (node.children || []).filter((c) => !shouldHideNode(c));
    return kids.length === 0;
  }
  if (v === null || v === undefined) return true;
  if (typeof v === "string" && v.trim() === "") return true;
  return false;
}

export function shouldHideNode(node: KnowledgeNode): boolean {
  const code = node.state?.code;
  if (code === "known_empty") return false;
  if (code === "unknown" || code === "not_applicable") return true;
  return isNodeEmpty(node);
}

/** Public type alias for parent contexts */
export type RendererCtx = {
  /** title of the enclosing card; if a node's label matches, skip dup label */
  parentTitle?: string | null;
};

export function UniversalValueRenderer({
  node,
  depth = 0,
  parentTitle = null,
}: {
  node: KnowledgeNode;
  depth?: number;
  parentTitle?: string | null;
}) {
  if (shouldHideNode(node)) return null;
  if (node.state?.code === "known_empty" && (node.valueType === "object" || node.valueType === "array")) {
    return <div className="np-uv-empty">Не выявлено</div>;
  }
  if (node.valueType === "object") {
    return <ObjectRenderer node={node} depth={depth} parentTitle={parentTitle} />;
  }
  if (node.valueType === "array") {
    return <ArrayRenderer node={node} depth={depth} />;
  }
  if (node.valueType === "text") {
    return <TextRenderer node={node} />;
  }
  // primitive — value only (label handled by parent)
  const text = formatPrimitive(node);
  return <span className="np-uv-value">{text || "—"}</span>;
}

function NodeStatusRow({ node }: { node: KnowledgeNode }) {
  const hasStatus = !!node.status;
  const hasTags = !!(node.tags && node.tags.length > 0);
  if (!hasStatus && !hasTags) return null;
  return (
    <div className="np-uv-status-row">
      {node.status && (
        <span className={`np-uv-status np-uv-status--${node.status.tone || "neutral"}`}>
          {node.status.label}
        </span>
      )}
      {(node.tags || []).map((t) => (
        <span key={t.code} className={`np-uv-chip np-uv-chip--${t.tone || "neutral"}`}>
          {t.label}
        </span>
      ))}
    </div>
  );
}

function NodeLinks({ node }: { node: KnowledgeNode }) {
  if (!node.links || node.links.length === 0) return null;
  return (
    <div className="np-uv-links">
      {node.links.map((l, i) => (
        <a key={i} className="np-uv-link" href={l.url} target="_blank" rel="noreferrer">
          {l.label}
        </a>
      ))}
    </div>
  );
}

function TextRenderer({ node }: { node: KnowledgeNode }) {
  const [expanded, setExpanded] = useState(false);
  const v = node.displayValue || (node.value == null ? "" : String(node.value));
  if (!v) return null;
  const long = v.length > 320;
  return (
    <div className="np-uv-text">
      <p className={`np-uv-text-body ${long && !expanded ? "is-clamped" : ""}`}>{v}</p>
      {long && (
        <button
          type="button"
          className="np-uv-link"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Свернуть" : "Показать полностью"}
        </button>
      )}
    </div>
  );
}

function ObjectRenderer({
  node, depth, parentTitle,
}: { node: KnowledgeNode; depth: number; parentTitle: string | null }) {
  const kids = (node.children || []).filter((c) => !shouldHideNode(c));
  const hasMeta = !!node.status || !!(node.tags && node.tags.length) || !!(node.links && node.links.length);
  if (kids.length === 0 && !hasMeta) return null;

  const indentClass = depth >= 2 ? "np-uv-indent" : "";

  return (
    <div className={`np-uv-object ${indentClass}`}>
      <NodeStatusRow node={node} />
      {kids.map((c) => {
        const isComposite = c.valueType === "object" || c.valueType === "array";
        const isLongText = c.valueType === "text";
        const labelText =
          c.label && c.label !== parentTitle && c.label !== node.label ? c.label : null;

        if (isComposite) {
          return (
            <div key={c.id} className="np-uv-group">
              {labelText && <div className="np-uv-group-title">{labelText}</div>}
              <UniversalValueRenderer node={c} depth={depth + 1} parentTitle={labelText} />
            </div>
          );
        }
        if (isLongText) {
          return (
            <div key={c.id} className="np-uv-block">
              {labelText && <div className="np-uv-block-label">{labelText}</div>}
              <UniversalValueRenderer node={c} depth={depth + 1} />
            </div>
          );
        }
        return (
          <div key={c.id} className="np-uv-row">
            <div className="np-uv-row-key">{labelText ?? ""}</div>
            <div className="np-uv-row-val">
              <UniversalValueRenderer node={c} depth={depth + 1} />
            </div>
          </div>
        );
      })}
      <NodeLinks node={node} />
    </div>
  );
}

const ARRAY_LIMIT = 3;

function ArrayRenderer({ node, depth }: { node: KnowledgeNode; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const kids = (node.children || []).filter((c) => !shouldHideNode(c));
  if (kids.length === 0) return null;

  const visible = expanded ? kids : kids.slice(0, ARRAY_LIMIT);
  const rest = kids.length - ARRAY_LIMIT;

  const allPrimitive = kids.every(
    (c) => c.valueType !== "object" && c.valueType !== "array" && c.valueType !== "text",
  );

  return (
    <div className="np-uv-array">
      {allPrimitive ? (
        <ul className="np-uv-list">
          {visible.map((c) => (
            <li key={c.id} className="np-uv-list-item">
              {formatPrimitive(c) || "—"}
            </li>
          ))}
        </ul>
      ) : (
        <div className="np-uv-items">
          {visible.map((c, i) => {
            const itemTitle = c.label || `Элемент ${i + 1}`;
            return (
              <div key={c.id} className="np-uv-item">
                <div className="np-uv-item-title-row">
                  <div className="np-uv-item-title">{itemTitle}</div>
                  {c.status && (
                    <span className={`np-uv-status np-uv-status--${c.status.tone || "neutral"}`}>
                      {c.status.label}
                    </span>
                  )}
                </div>
                <UniversalValueRenderer node={c} depth={depth + 1} parentTitle={itemTitle} />
              </div>
            );
          })}
        </div>
      )}
      {rest > 0 && (
        <button
          type="button"
          className="np-uv-link"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Свернуть" : `Показать ещё ${rest}`}
        </button>
      )}
    </div>
  );
}