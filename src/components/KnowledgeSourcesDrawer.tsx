import { useState } from "react";
import type {
  KnowledgeSource,
  KnowledgeSourceReference,
} from "../types/universalKnowledge";

const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
function formatRuDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const mo = parseInt(m[2], 10) - 1;
  if (mo < 0 || mo > 11) return iso;
  return `${parseInt(m[3], 10)} ${MONTHS_RU[mo]} ${m[1]}`;
}

export interface SourceEdit {
  name: string;
  quote: string;
  actualAt: string;
  section: string;
  page: string;
}

function SourceCard({
  source,
  evidence,
  onSave,
  onDelete,
}: {
  source: KnowledgeSource;
  evidence?: KnowledgeSourceReference;
  onSave: (s: KnowledgeSource, ev: KnowledgeSourceReference | undefined) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [form, setForm] = useState<SourceEdit>({
    name: source.name,
    quote: evidence?.quote || "",
    actualAt: source.actualAt || "",
    section: evidence?.locator?.section || "",
    page: evidence?.locator?.page ? String(evidence.locator.page) : "",
  });

  const header = source.dataset
    ? `${source.name} · ${source.dataset}`
    : source.type
      ? `${source.name}`
      : source.name;

  return (
    <div className="np-src-card">
      <div className="np-src-card-head">
        <div className="np-src-card-title">{header}</div>
        {!editing && !confirmDel && (
          <div className="np-src-card-actions">
            <button className="np-src-linkbtn" onClick={() => setEditing(true)}>
              редактировать
            </button>
            <button
              className="np-src-linkbtn np-src-linkbtn--danger"
              onClick={() => setConfirmDel(true)}
            >
              удалить
            </button>
          </div>
        )}
      </div>

      {confirmDel && (
        <div className="np-src-confirm">
          <div>Удалить связь этого источника со знанием?</div>
          <div className="np-src-confirm-actions">
            <button className="np-btn" onClick={() => setConfirmDel(false)}>Отмена</button>
            <button
              className="np-btn np-btn-primary np-btn--danger"
              onClick={() => { setConfirmDel(false); onDelete(); }}
            >
              Удалить
            </button>
          </div>
        </div>
      )}

      {editing ? (
        <div className="np-src-form">
          <label>Название
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>Цитата
            <textarea
              rows={2}
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
            />
          </label>
          <div className="np-src-form-row">
            <label>Актуально на
              <input
                placeholder="YYYY-MM-DD"
                value={form.actualAt}
                onChange={(e) => setForm({ ...form, actualAt: e.target.value })}
              />
            </label>
            <label>Страница
              <input
                value={form.page}
                onChange={(e) => setForm({ ...form, page: e.target.value })}
              />
            </label>
          </div>
          <label>Раздел
            <input
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
            />
          </label>
          <div className="np-src-form-actions">
            <button className="np-btn" onClick={() => setEditing(false)}>Отмена</button>
            <button
              className="np-btn np-btn-primary"
              onClick={() => {
                const nextSrc: KnowledgeSource = {
                  ...source,
                  name: form.name.trim() || source.name,
                  actualAt: form.actualAt.trim() || null,
                };
                const pageNum = form.page.trim() ? Number(form.page.trim()) : null;
                const nextEv: KnowledgeSourceReference | undefined =
                  form.quote.trim() || form.section.trim() || pageNum
                    ? {
                        sourceId: source.id,
                        quote: form.quote.trim() || null,
                        locator: {
                          section: form.section.trim() || null,
                          page: Number.isFinite(pageNum as number) ? (pageNum as number) : null,
                        },
                      }
                    : evidence;
                onSave(nextSrc, nextEv);
                setEditing(false);
              }}
            >
              Сохранить
            </button>
          </div>
        </div>
      ) : (
        <div className="np-src-card-body">
          {evidence?.quote && (
            <div className="np-src-block">
              <div className="np-src-block-label">Цитата</div>
              <div className="np-src-quote">«{evidence.quote}»</div>
            </div>
          )}
          {source.fileName && (
            <div className="np-src-block">
              <div className="np-src-block-label">Файл</div>
              <div className="np-src-file">
                <span className="np-src-file-icon" aria-hidden>📄</span>
                <span className="np-src-file-name">{source.fileName}</span>
                {source.downloadUrl && (
                  <a className="np-src-linkbtn" href={source.downloadUrl} download>
                    скачать
                  </a>
                )}
              </div>
            </div>
          )}
          {source.url && (
            <a className="np-src-openlink" href={source.url} target="_blank" rel="noreferrer">
              Открыть источник ↗
            </a>
          )}
          {(evidence?.locator?.page || evidence?.locator?.section) && (
            <div className="np-src-block">
              <div className="np-src-block-label">Место в источнике</div>
              <div className="np-src-locator">
                {[
                  evidence.locator?.page ? `Страница ${evidence.locator.page}` : null,
                  evidence.locator?.section || null,
                ].filter(Boolean).join(" · ")}
              </div>
            </div>
          )}
          {source.actualAt && (
            <div className="np-src-block">
              <div className="np-src-block-label">Актуально на</div>
              <div>{formatRuDate(source.actualAt)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function KnowledgeSourcesDrawer({
  knowledgeTitle,
  sources,
  evidence,
  onClose,
  onUpdateSource,
  onDeleteSource,
}: {
  knowledgeTitle: string;
  sources: KnowledgeSource[];
  evidence: KnowledgeSourceReference[];
  onClose: () => void;
  onUpdateSource: (s: KnowledgeSource, ev: KnowledgeSourceReference | undefined) => void;
  onDeleteSource: (sourceId: string) => void;
}) {
  return (
    <div className="np-drawer-backdrop" onClick={onClose}>
      <div
        className="np-drawer np-drawer--sources"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      >
        <div className="np-drawer-head">
          <div>
            <div className="np-drawer-eyebrow">Источники знания</div>
            <h3 className="np-drawer-title">{knowledgeTitle}</h3>
          </div>
          <button className="np-icon-btn" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="np-drawer-body">
          {sources.length === 0 && (
            <div className="np-muted">У этого знания пока нет источников.</div>
          )}
          {sources.map((s) => (
            <SourceCard
              key={s.id}
              source={s}
              evidence={evidence.find((e) => e.sourceId === s.id)}
              onSave={onUpdateSource}
              onDelete={() => onDeleteSource(s.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}