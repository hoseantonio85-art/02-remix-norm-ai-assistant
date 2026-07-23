import { useEffect, useRef, useState } from "react";

// ----- Universal source model -----

export type SourceType =
  | "document"
  | "news"
  | "law"
  | "website"
  | "internal_system"
  | "state_of_knowledge";

export interface UniSource {
  id: string;
  type: SourceType;
  typeLabel: string;
  title: string;
  provider?: string | null;
  domain?: string | null;
  publishedAt?: string | null;
  validAt?: string | null;
  quote?: string | null;
  relationToConclusion?: string | null;
  supportedClaim?: string | null;
  location?: {
    page?: number | null;
    section?: string | null;
    article?: string | null;
    paragraph?: string | null;
    sheet?: string | null;
    range?: string | null;
    timestamp?: string | null;
    recordId?: string | null;
  } | null;
  file?: {
    name: string;
    format?: string | null;
    size?: string | null;
    downloadUrl?: string | null;
  } | null;
  url?: string | null;
}

function isExternalType(s: UniSource): boolean {
  return s.type === "news" || s.type === "law" || s.type === "website";
}

function externalHref(s: UniSource): string | null {
  if (s.url) return s.url;
  if (s.file?.downloadUrl) return s.file.downloadUrl;
  return null;
}

function ctaLabelFor(type: SourceType): string {
  switch (type) {
    case "document": return "Открыть документ";
    case "news": return "Открыть новость";
    case "law": return "Открыть текст закона";
    case "website": return "Открыть страницу";
    case "internal_system": return "Открыть в системе";
    default: return "";
  }
}

function hasRealAction(s: UniSource): boolean {
  if (s.type === "state_of_knowledge") return false;
  return !!(s.url || s.file?.downloadUrl);
}

function OpenSourceButton({ s, onExternal }: { s: UniSource; onExternal: (s: UniSource) => void }) {
  if (!hasRealAction(s)) return null;
  const label = ctaLabelFor(s.type);
  if (!label) return null;
  const external = isExternalType(s) || s.type === "document";
  const href = externalHref(s);
  if (href && external) {
    return (
      <a
        className="np-sd-open-btn"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {label}
        <span className="np-sd-open-btn-ico" aria-hidden> ↗</span>
      </a>
    );
  }
  return (
    <button
      type="button"
      className="np-sd-open-btn"
      onClick={(e) => { e.stopPropagation(); onExternal(s); }}
    >
      {label}
    </button>
  );
}

function locationLine(loc: UniSource["location"]): string | null {
  if (!loc) return null;
  const parts: string[] = [];
  if (loc.page != null) parts.push(`страница ${loc.page}`);
  if (loc.section) parts.push(loc.section);
  if (loc.article) parts.push(loc.article);
  if (loc.paragraph) parts.push(loc.paragraph);
  if (loc.sheet) parts.push(`лист «${loc.sheet}»`);
  if (loc.range) parts.push(`строки ${loc.range}`);
  if (loc.timestamp) parts.push(loc.timestamp);
  if (loc.recordId) parts.push(`запись ${loc.recordId}`);
  return parts.length ? parts.join(", ") : null;
}

function headerMeta(s: UniSource): string {
  const bits: string[] = [];
  if (s.provider) bits.push(s.provider);
  if (s.domain) bits.push(s.domain);
  if (s.publishedAt) bits.push(s.publishedAt);
  else if (s.validAt) bits.push(`актуально на ${s.validAt}`);
  return bits.join(" · ");
}

// ----- Detail view -----

function SourceDetail({
  s,
  mode,
  onExternal,
}: {
  s: UniSource;
  mode: "conclusion" | "knowledge";
  onExternal: (s: UniSource) => void;
}) {
  const loc = locationLine(s.location);
  const isGap = s.type === "state_of_knowledge";
  const showFileCard = !!s.file && !isGap;
  // If file name equals title, don't repeat it in the file card
  const fileNameDuplicatesTitle = !!s.file && s.file.name.trim() === s.title.trim();
  return (
    <div className="np-sd-detail">
      {showFileCard && (
        <div className="np-sd-file">
          <span className="np-sd-file-icon" aria-hidden>📄</span>
          <div className="np-sd-file-body">
            {!fileNameDuplicatesTitle && (
              <div className="np-sd-file-name">{s.file!.name}</div>
            )}
            <div className="np-sd-file-meta">
              {[s.file!.format, s.file!.size, s.validAt].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>
      )}

      <div className="np-sd-actions">
        <OpenSourceButton s={s} onExternal={onExternal} />
        {s.file?.downloadUrl && !isGap && (
          <a
            className="np-sd-linkbtn"
            href={s.file.downloadUrl}
            download
            onClick={(e) => e.stopPropagation()}
          >
            Скачать
          </a>
        )}
      </div>

      <div className="np-sd-block">
        <div className="np-sd-label">
          {isGap ? "Каких данных не хватает" : "Использованный фрагмент"}
        </div>
        {s.quote ? (
          <div className={`np-sd-quote${isGap ? " np-sd-quote--gap" : ""}`}>
            {isGap ? s.quote : `«${s.quote}»`}
          </div>
        ) : (
          <div className="np-sd-quote np-sd-quote--muted">
            Точный фрагмент источника пока не добавлен
          </div>
        )}
      </div>

      {loc && (
        <div className="np-sd-block">
          <div className="np-sd-label">Место в источнике</div>
          <div className="np-sd-locator">{loc}</div>
        </div>
      )}

      {mode === "conclusion" && s.supportedClaim && (
        <div className="np-sd-block">
          <div className="np-sd-label">Подтверждает в выводе</div>
          <div className="np-sd-quote np-sd-quote--claim">«{s.supportedClaim}»</div>
        </div>
      )}

      {mode === "conclusion" && s.relationToConclusion && (
        <div className="np-sd-block">
          <div className="np-sd-label">Как это связано с выводом</div>
          <div className="np-sd-relation">{s.relationToConclusion}</div>
        </div>
      )}
    </div>
  );
}

function OverflowMenu({
  s,
  onEdit,
  onDelete,
}: {
  s: UniSource;
  onEdit?: (s: UniSource) => void;
  onDelete?: (s: UniSource) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  if (!onEdit && !onDelete) return null;
  return (
    <div className="np-sd-menu" ref={ref}>
      <button
        type="button"
        className="np-icon-btn np-sd-menu-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Действия с источником"
      >
        ⋯
      </button>
      {open && (
        <div className="np-sd-menu-pop" role="menu">
          {onEdit && (
            <button
              type="button"
              className="np-sd-menu-item"
              onClick={() => {
                setOpen(false);
                onEdit(s);
              }}
            >
              Редактировать
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="np-sd-menu-item np-sd-menu-item--danger"
              onClick={() => {
                setOpen(false);
                onDelete(s);
              }}
            >
              Удалить
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ----- Universal drawer -----

export interface SourceDrawerProps {
  sources: UniSource[];
  activeId: string | "list" | null;
  mode: "conclusion" | "knowledge";
  listTitle?: string;
  onOpen: (id: string | "list") => void;
  onClose: () => void;
  onExternal?: (s: UniSource) => void;
  editable?: boolean;
  onEdit?: (s: UniSource) => void;
  onDelete?: (s: UniSource) => void;
  placement: "viewport" | "modal";
}

export function SourceDrawer({
  sources,
  activeId,
  mode,
  listTitle,
  onOpen,
  onClose,
  onExternal,
  editable,
  onEdit,
  onDelete,
  placement,
}: SourceDrawerProps) {
  useEffect(() => {
    if (activeId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, onClose]);

  if (activeId === null) return null;

  const single = sources.length === 1;
  const showList = activeId === "list" || (activeId !== "list" && !sources.find((s) => s.id === activeId));
  const selected =
    activeId !== "list" ? sources.find((s) => s.id === activeId) ?? null : null;

  const defaultExternal = (s: UniSource) => {
    if (s.url) {
      window.open(s.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (s.file?.downloadUrl) {
      window.open(s.file.downloadUrl, "_blank", "noopener,noreferrer");
    }
  };
  const handleExternal = onExternal ?? defaultExternal;

  const heading =
    mode === "knowledge" ? "Источники знания" : listTitle ?? "На чём основан вывод";

  return (
    <div
      className={`np-sd-backdrop np-sd-backdrop--${placement}`}
      onClick={onClose}
    >
      <aside
        className="np-sd-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={selected ? selected.title : heading}
      >
        <div className="np-sd-head">
          <div className="np-sd-head-main">
            {selected && !single && (
              <button
                type="button"
                className="np-sd-back"
                onClick={() => onOpen("list")}
              >
                ← К списку
              </button>
            )}
            <div className="np-sd-type">
              {selected ? selected.typeLabel : heading}
            </div>
            <h3 className="np-sd-title">
              {selected ? selected.title : `${heading} · ${sources.length}`}
            </h3>
            {selected && (
              <div className="np-sd-submeta">{headerMeta(selected)}</div>
            )}
          </div>
          <div className="np-sd-head-actions">
            {selected && editable && (
              <OverflowMenu s={selected} onEdit={onEdit} onDelete={onDelete} />
            )}
            <button className="np-icon-btn np-sd-close" onClick={onClose} aria-label="Закрыть">
              ✕
            </button>
          </div>
        </div>
        <div className="np-sd-body">
          {selected ? (
            <SourceDetail
              s={selected}
              mode={mode}
              onExternal={handleExternal}
            />
          ) : showList ? (
            <ul className="np-sd-list">
              {sources.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="np-sd-list-item"
                    onClick={() => onOpen(s.id)}
                  >
                    <div className="np-sd-list-main">
                      <span className="np-sd-list-type">{s.typeLabel}</span>
                      <span className="np-sd-list-title">{s.title}</span>
                      {headerMeta(s) && (
                        <span className="np-sd-list-meta">{headerMeta(s)}</span>
                      )}
                    </div>
                    <span className="np-sd-list-chev" aria-hidden>→</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

// ----- Adapters -----

export interface FocusSourceLike {
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

function classifyFocusType(s: FocusSourceLike): { type: SourceType; typeLabel: string } {
  const t = (s.type || "").toLowerCase();
  if (t.includes("состояние знан") || t.includes("пробел")) {
    return { type: "state_of_knowledge", typeLabel: "Пробел в знаниях" };
  }
  if (t.includes("новост")) return { type: "news", typeLabel: "Новость" };
  if (t.includes("закон") || t.includes("норматив")) return { type: "law", typeLabel: "Нормативный акт" };
  if (t.includes("сайт") || t.includes("страниц")) return { type: "website", typeLabel: "Страница сайта" };
  if (s.document) return { type: "document", typeLabel: "Документ" };
  return { type: "internal_system", typeLabel: s.type || "Внутренняя запись" };
}

export function focusSourceToUni(
  s: FocusSourceLike,
  opts?: { supportedClaim?: string | null },
): UniSource {
  const { type, typeLabel } = classifyFocusType(s);
  const url = s.url || null;
  let domain = s.domain || null;
  if (!domain && url) {
    try { domain = new URL(url).hostname; } catch { /* noop */ }
  }
  return {
    id: s.id || s.title,
    type,
    typeLabel,
    title: s.title,
    provider: s.provider || (s.document ? "Внутренняя система" : null),
    domain,
    validAt: s.date || s.document?.updatedAt || null,
    publishedAt: type === "news" ? s.date || null : null,
    quote: s.quote || s.excerpt || null,
    relationToConclusion: s.relation || null,
    supportedClaim: opts?.supportedClaim ?? null,
    location: s.locator
      ? {
          page: s.locator.page ?? null,
          section: s.locator.section ?? null,
          sheet: s.locator.sheet ?? null,
          range: s.locator.range ?? null,
        }
      : null,
    file: s.document
      ? {
          name: s.document.fileName,
          format: s.document.mimeType || null,
          size: s.document.fileSize || null,
          downloadUrl: s.document.downloadUrl || null,
        }
      : null,
    url,
  };
}

// KnowledgeSource + optional evidence → UniSource
export function knowledgeSourceToUni(
  s: {
    id: string;
    type: string;
    name: string;
    dataset?: string | null;
    documentName?: string | null;
    fileName?: string | null;
    mimeType?: string | null;
    downloadUrl?: string | null;
    url?: string | null;
    actualAt?: string | null;
  },
  ev?: {
    quote?: string | null;
    locator?: {
      page?: number | null;
      section?: string | null;
      field?: string | null;
      dataset?: string | null;
      recordId?: string | null;
      sheet?: string | null;
      range?: string | null;
    };
  },
): UniSource {
  const raw = (s.type || "").toLowerCase();
  let type: SourceType;
  let typeLabel: string;
  if (raw === "news" || raw.includes("новост")) {
    type = "news"; typeLabel = "Новость";
  } else if (raw === "law" || raw.includes("закон") || raw.includes("норматив")) {
    type = "law"; typeLabel = "Нормативный акт";
  } else if (raw === "website" || raw.includes("сайт") || raw.includes("страниц")) {
    type = "website"; typeLabel = "Страница сайта";
  } else if (raw === "document" || s.fileName || s.documentName) {
    type = "document"; typeLabel = "Документ";
  } else if (s.url) {
    type = "website"; typeLabel = "Страница сайта";
  } else {
    type = "internal_system"; typeLabel = s.type || "Внутренняя запись";
  }
  const isDoc = type === "document";
  return {
    id: s.id,
    type,
    typeLabel,
    title: s.documentName || s.fileName || s.name,
    provider: s.dataset || null,
    domain: s.url ? new URL(s.url, "https://x").hostname.replace(/^x$/, "") : null,
    validAt: s.actualAt || null,
    quote: ev?.quote || null,
    location: ev?.locator
      ? {
          page: ev.locator.page ?? null,
          section: ev.locator.section ?? null,
          sheet: ev.locator.sheet ?? null,
          range: ev.locator.range ?? null,
          recordId: ev.locator.recordId ?? null,
        }
      : null,
    file: isDoc && s.fileName
      ? {
          name: s.fileName,
          format: s.mimeType || null,
          downloadUrl: s.downloadUrl || null,
        }
      : null,
    url: s.url || null,
  };
}