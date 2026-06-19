import { useEffect, useMemo, useState } from "react";
import profileData from "../data/company_profile_full.json";
import type {
  Area,
  Attribute,
  CompanyProfile,
  Knowledge,
  KnowledgeAlert,
  KnowledgeItem,
  Source,
  Tag,
} from "../types/profile";

const DATA = profileData as unknown as CompanyProfile;
const AREAS: Area[] = DATA.profile.areas;

/* ---------- helpers ---------- */

const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function formatRuDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  // ISO date or datetime
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const y = m[1];
  const mo = parseInt(m[2], 10) - 1;
  const d = parseInt(m[3], 10);
  if (mo < 0 || mo > 11) return iso;
  return `${d} ${MONTHS_RU[mo]} ${y}`;
}

function formatAttrValue(attr: Attribute): string {
  const v = attr.value;
  if (v === undefined || v === null || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (attr.value_type === "date") return formatRuDate(String(v));
  return String(v);
}

function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string" && v.trim() === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function freshnessToneClass(code: string): string {
  switch (code) {
    case "current": return "np-fresh np-fresh-current";
    case "outdated":
    case "update_required": return "np-fresh np-fresh-outdated";
    case "missing": return "np-fresh np-fresh-missing";
    default: return "np-fresh";
  }
}

function tagToneClass(tone?: string): string {
  return `np-tag np-tag-${tone || "neutral"}`;
}

function alertSeverityClass(sev: string): string {
  return `np-alert np-alert-${sev || "info"}`;
}

/* ---------- shared sub-renderers ---------- */

function Tags({ tags }: { tags: Tag[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="np-tags">
      {tags.map((t) => (
        <span key={t.code} className={tagToneClass(t.tone)}>{t.label}</span>
      ))}
    </div>
  );
}

function AttributesList({
  attributes, dense = false,
}: { attributes: Attribute[]; dense?: boolean }) {
  const visible = attributes.filter((a) => !isEmptyValue(a.value));
  if (visible.length === 0) return null;
  return (
    <dl className={`np-attrs ${dense ? "np-attrs-dense" : ""}`}>
      {visible.map((a) => {
        const v = a.value;
        return (
          <div key={a.key} className="np-attr-row">
            <dt>{a.label}</dt>
            <dd>
              {Array.isArray(v) ? (
                <ul className="np-attr-list">
                  {(v as string[]).map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              ) : (
                formatAttrValue(a)
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function ItemLinks({ links }: { links?: { label: string; url: string }[] }) {
  if (!links || links.length === 0) return null;
  return (
    <div className="np-item-links">
      {links.map((l, i) => (
        <a key={i} href={l.url} target="_blank" rel="noreferrer noopener">{l.label}</a>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status?: KnowledgeItem["status"] }) {
  if (!status) return null;
  return <span className={tagToneClass(status.tone)}>{status.label}</span>;
}

function AlertBlock({
  alerts, onAction,
}: { alerts: KnowledgeAlert[]; onAction: (a: KnowledgeAlert) => void }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="np-alerts">
      {alerts.map((a, i) => (
        <div key={i} className={alertSeverityClass(a.severity)}>
          <span className="np-alert-icon" aria-hidden>!</span>
          <div className="np-alert-body">
            <div className="np-alert-msg">{a.message}</div>
            {a.action && (
              <button className="np-btn np-btn-ghost np-alert-action" onClick={() => onAction(a)}>
                {a.action.label}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceBadge({ s }: { s: Source }) {
  return (
    <span className="np-source-badge" title={s.dataset || s.document_name || ""}>
      <span className="np-source-dot" aria-hidden>●</span>
      {s.name}
      {s.dataset ? <span className="np-source-extra"> · {s.dataset}</span> : null}
      {!s.dataset && s.document_name ? <span className="np-source-extra"> · {s.document_name}</span> : null}
    </span>
  );
}

function KnowledgeFooter({ k }: { k: Knowledge }) {
  return (
    <footer className="np-k-foot">
      <div className="np-k-foot-sources">
        <span className="np-k-foot-label">Источники:</span>
        {k.sources.map((s) => <SourceBadge key={s.id} s={s} />)}
      </div>
      <div className="np-k-foot-date">
        Актуально на <strong>{formatRuDate(k.actual_at)}</strong>
      </div>
    </footer>
  );
}

/* ---------- item body (recursive) ---------- */

function ItemBody({ item, dense = false }: { item: KnowledgeItem; dense?: boolean }) {
  return (
    <div className="np-item-body">
      {item.description && <p className="np-item-desc">{item.description}</p>}
      <AttributesList attributes={item.attributes} dense={dense} />
      <Tags tags={item.tags} />
      <ItemLinks links={item.links} />
      {item.children && item.children.length > 0 && (
        <div className="np-item-children">
          {item.children.map((c) => (
            <div key={c.id} className="np-item-child">
              <div className="np-item-child-head">
                <strong>{c.title}</strong>
                {!isEmptyValue(c.value) && <span className="np-item-child-value">{String(c.value)}</span>}
                <StatusPill status={c.status} />
              </div>
              <ItemBody item={c} dense />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- variants ---------- */

function VariantDetails({ k }: { k: Knowledge }) {
  return (
    <div className="np-v-details">
      {k.items.map((it) => (
        <div key={it.id} className="np-v-details-item">
          {k.items.length > 1 && (
            <div className="np-item-title">{it.title}</div>
          )}
          <ItemBody item={it} />
        </div>
      ))}
    </div>
  );
}

function VariantCollection({ k, initial = 5 }: { k: Knowledge; initial?: number }) {
  const [open, setOpen] = useState(false);
  const all = k.items;
  const visible = open ? all : all.slice(0, initial);
  return (
    <div className="np-v-collection">
      <div className="np-v-collection-list">
        {visible.map((it) => (
          <article key={it.id} className="np-collection-card">
            <header className="np-collection-card-head">
              <div>
                <div className="np-item-title">{it.title}</div>
                {!isEmptyValue(it.value) && <div className="np-item-value">{String(it.value)}</div>}
              </div>
              <StatusPill status={it.status} />
            </header>
            <ItemBody item={it} dense />
          </article>
        ))}
      </div>
      {all.length > initial && (
        <button className="np-btn np-btn-ghost np-show-more" onClick={() => setOpen((o) => !o)}>
          {open ? "Свернуть" : `Показать все (${all.length})`}
        </button>
      )}
    </div>
  );
}

function VariantTable({ k }: { k: Knowledge }) {
  // Build columns from union of attribute keys; show value column if any item has value
  const pageSize = k.presentation.page_size || 10;
  const [open, setOpen] = useState(false);
  const keyOrder: string[] = [];
  const labels: Record<string, string> = {};
  for (const it of k.items) {
    for (const a of it.attributes) {
      if (!(a.key in labels)) {
        labels[a.key] = a.label;
        keyOrder.push(a.key);
      }
    }
  }
  const visible = open ? k.items : k.items.slice(0, pageSize);
  return (
    <div className="np-v-table">
      <div className="np-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Название</th>
              {keyOrder.map((kk) => <th key={kk}>{labels[kk]}</th>)}
            </tr>
          </thead>
          <tbody>
            {visible.map((it) => {
              const map = new Map(it.attributes.map((a) => [a.key, a]));
              return (
                <tr key={it.id}>
                  <td>{it.title}</td>
                  {keyOrder.map((kk) => {
                    const a = map.get(kk);
                    return <td key={kk}>{a ? formatAttrValue(a) : "—"}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {k.items.length > pageSize && (
        <button className="np-btn np-btn-ghost np-show-more" onClick={() => setOpen((o) => !o)}>
          {open ? "Свернуть" : `Показать все (${k.items.length})`}
        </button>
      )}
    </div>
  );
}

function VariantNarrative({ k }: { k: Knowledge }) {
  return (
    <div className="np-v-narrative">
      {k.items.map((it) => (
        <div key={it.id} className="np-narrative-item">
          {it.description && <p className="np-narrative-text">{it.description}</p>}
          <AttributesList attributes={it.attributes} />
          <Tags tags={it.tags} />
        </div>
      ))}
    </div>
  );
}

function VariantMetric({ k }: { k: Knowledge }) {
  return (
    <div className="np-v-metrics">
      {k.items.map((it) => (
        <div key={it.id} className="np-metric-card">
          <div className="np-metric-label">{it.title}</div>
          {!isEmptyValue(it.value) && <div className="np-metric-value">{String(it.value)}</div>}
          <AttributesList attributes={it.attributes} dense />
          {it.description && <p className="np-item-desc">{it.description}</p>}
          <Tags tags={it.tags} />
        </div>
      ))}
    </div>
  );
}

function VariantStatistics({ k }: { k: Knowledge }) {
  return (
    <div className="np-v-stats">
      {k.items.map((it) => (
        <section key={it.id} className="np-stats-block">
          <h4>{it.title}</h4>
          <ItemBody item={it} />
        </section>
      ))}
    </div>
  );
}

function VariantMapList({ k }: { k: Knowledge }) {
  return (
    <div className="np-v-maplist">
      {k.items.map((it) => (
        <section key={it.id} className="np-maplist-block">
          <header className="np-maplist-head">
            <strong>{it.title}</strong>
            {!isEmptyValue(it.value) && <span className="np-muted">{String(it.value)}</span>}
          </header>
          <ItemBody item={it} dense />
        </section>
      ))}
    </div>
  );
}

function VariantTimeline({ k }: { k: Knowledge }) {
  return (
    <ol className="np-v-timeline">
      {k.items.map((it) => (
        <li key={it.id} className="np-timeline-item">
          <div className="np-timeline-head">
            <strong>{it.title}</strong>
            {!isEmptyValue(it.value) && <span className="np-timeline-value">{String(it.value)}</span>}
          </div>
          {it.description && <p className="np-item-desc">{it.description}</p>}
        </li>
      ))}
    </ol>
  );
}

function VariantPeriods({ k }: { k: Knowledge }) {
  return (
    <div className="np-v-periods">
      {k.items.map((it) => (
        <section key={it.id} className="np-period-block">
          <header className="np-period-head">
            <h4>{it.title}</h4>
            <Tags tags={it.tags} />
          </header>
          <ItemBody item={it} />
        </section>
      ))}
    </div>
  );
}

function VariantRiskList({ k }: { k: Knowledge }) {
  return (
    <ul className="np-v-risks">
      {k.items.map((it) => (
        <li key={it.id} className="np-risk-item">
          <div className="np-risk-head">
            <strong>{it.title}</strong>
            <StatusPill status={it.status} />
          </div>
          {it.description && <p className="np-item-desc">{it.description}</p>}
          <Tags tags={it.tags} />
        </li>
      ))}
    </ul>
  );
}

function renderVariant(k: Knowledge) {
  switch (k.presentation.variant) {
    case "details": return <VariantDetails k={k} />;
    case "collection": return <VariantCollection k={k} />;
    case "table": return <VariantTable k={k} />;
    case "narrative": return <VariantNarrative k={k} />;
    case "metric":
    case "metrics": return <VariantMetric k={k} />;
    case "statistics": return <VariantStatistics k={k} />;
    case "map_list": return <VariantMapList k={k} />;
    case "timeline": return <VariantTimeline k={k} />;
    case "periods": return <VariantPeriods k={k} />;
    case "risk_list": return <VariantRiskList k={k} />;
    default: return <VariantDetails k={k} />;
  }
}

/* ---------- knowledge card ---------- */

function KnowledgeCard({
  k, onAlert,
}: { k: Knowledge; onAlert: (a: KnowledgeAlert, k: Knowledge) => void }) {
  return (
    <article className="np-k-card" id={`k-${k.id}`}>
      <header className="np-k-head">
        <div className="np-k-title-wrap">
          {k.category && k.category !== k.title && (
            <div className="np-k-eyebrow">{k.category}</div>
          )}
          <h3 className="np-k-title">{k.title}</h3>
        </div>
        <div className="np-k-status">
          <span className={freshnessToneClass(k.freshness.code)} title={k.freshness.reason || ""}>
            {k.freshness.label}
          </span>
        </div>
      </header>
      {k.summary && <p className="np-k-summary">{k.summary}</p>}
      <div className="np-k-body">
        {renderVariant(k)}
      </div>
      <AlertBlock alerts={k.alerts} onAction={(a) => onAlert(a, k)} />
      <KnowledgeFooter k={k} />
    </article>
  );
}

/* ---------- area card / view ---------- */

function uniqueSources(area: Area): Source[] {
  const map = new Map<string, Source>();
  for (const k of area.knowledge) for (const s of k.sources) map.set(s.id, s);
  return Array.from(map.values());
}

function countAlerts(area: Area): number {
  return area.knowledge.reduce((n, k) => n + (k.alerts?.length || 0), 0);
}

function countOutdated(area: Area): number {
  return area.knowledge.filter((k) => k.freshness.code !== "current").length;
}

function AreaCard({ area, onOpen }: { area: Area; onOpen: () => void }) {
  const sources = uniqueSources(area);
  const alerts = countAlerts(area);
  const outdated = countOutdated(area);
  return (
    <article
      className="np-kb-card np-kb-card-clickable"
      role="button" tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
    >
      <div className="np-kb-card-top">
        <div className="np-kb-card-title">
          <h4>{area.title}</h4>
          {alerts > 0 && <span className="np-tag np-tag-warning">{alerts} предупр.</span>}
        </div>
      </div>
      {area.description && <p className="np-kb-card-insight">{area.description}</p>}
      <div className="np-kb-card-foot">
        <span className="np-muted">
          {area.knowledge.length} карточек знаний · {sources.length} источников
          {outdated > 0 ? ` · ${outdated} требуют обновления` : ""}
        </span>
      </div>
    </article>
  );
}

function AreaView({
  area, areas, onSelect, onBack, onAlert,
}: {
  area: Area; areas: Area[]; onSelect: (id: string) => void; onBack: () => void;
  onAlert: (a: KnowledgeAlert, k: Knowledge) => void;
}) {
  return (
    <div className="np-area-page">
      <div className="np-kb-pageheader">
        <button className="np-area-back" onClick={onBack}>← Профиль компании</button>
        <h1>{area.title}</h1>
        {area.description && <p className="np-muted">{area.description}</p>}
      </div>

      <div className="np-area-layout">
        <aside className="np-area-left">
          <div className="np-area-left-title">Области профиля</div>
          {areas.map((a) => {
            const isActive = a.id === area.id;
            return (
              <button
                key={a.id}
                className={`np-area-left-item ${isActive ? "active" : ""}`}
                onClick={() => onSelect(a.id)}
              >
                <div className="np-area-left-name">{a.title}</div>
                <span className="np-muted">{a.knowledge.length}</span>
              </button>
            );
          })}
        </aside>

        <div className="np-area-center np-area-center-wide">
          <div className="np-k-stack">
            {area.knowledge.map((k) => (
              <KnowledgeCard key={k.id} k={k} onAlert={onAlert} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- index widget (drawer) ---------- */

function IndexWidget({ onAlert }: { onAlert: (msg: string) => void }) {
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    let total = 0, current = 0, alerts = 0;
    const outdated: { area: string; title: string; reason?: string }[] = [];
    const alertList: { area: string; title: string; message: string }[] = [];
    for (const a of AREAS) {
      for (const k of a.knowledge) {
        total++;
        if (k.freshness.code === "current") current++;
        else outdated.push({ area: a.title, title: k.title, reason: k.freshness.reason });
        for (const al of k.alerts) {
          alerts++;
          alertList.push({ area: a.title, title: k.title, message: al.message });
        }
      }
    }
    const percent = total === 0 ? 0 : Math.round((current / total) * 100);
    return { total, current, alerts, outdated, alertList, percent };
  }, []);

  return (
    <div className="np-index-widget-wrap">
      <button className="np-index-widget" onClick={() => setOpen(true)}>
        <div className="np-index-widget-text">
          <div className="np-index-widget-title">Индекс знания</div>
          <div className="np-index-widget-sub">{AREAS.length} областей · {stats.total} карточек</div>
          <div className="np-index-widget-meta">
            {stats.alerts > 0 ? `${stats.alerts} предупреждений` : `${stats.outdated.length} требуют обновления`}
          </div>
        </div>
      </button>
      {open && (
        <div className="np-drawer-backdrop" onClick={() => setOpen(false)}>
          <div className="np-drawer np-improve-drawer" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="np-drawer-head">
              <div>
                <div className="np-drawer-eyebrow">Индекс знания</div>
                <h3 className="np-drawer-title">Состояние профиля</h3>
                <p className="np-drawer-summary">
                  {stats.current} из {stats.total} карточек актуальны.
                  {stats.alerts > 0 && ` ${stats.alerts} предупреждений требуют внимания.`}
                </p>
              </div>
              <button className="np-icon-btn" onClick={() => setOpen(false)} aria-label="Закрыть">✕</button>
            </div>
            <div className="np-drawer-body">
              {stats.alertList.length > 0 && (
                <section className="np-drawer-section">
                  <h4>Предупреждения</h4>
                  <ul className="np-improve-list">
                    {stats.alertList.map((a, i) => (
                      <li key={i} className="np-improve-item">
                        <div className="np-improve-main">
                          <div className="np-improve-title">{a.title}</div>
                          <div className="np-improve-meta">
                            <span className="np-muted">{a.area}</span>
                          </div>
                          <div className="np-improve-why">{a.message}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section className="np-drawer-section">
                <h4>Требуют обновления</h4>
                <ul className="np-improve-list">
                  {stats.outdated.slice(0, 12).map((o, i) => (
                    <li key={i} className="np-improve-item">
                      <div className="np-improve-main">
                        <div className="np-improve-title">{o.title}</div>
                        <div className="np-improve-meta">
                          <span className="np-muted">{o.area}</span>
                        </div>
                        {o.reason && <div className="np-improve-why">{o.reason}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <div className="np-drawer-foot">
              <button className="np-btn" onClick={() => setOpen(false)}>Закрыть</button>
              <button
                className="np-btn np-btn-primary"
                onClick={() => { setOpen(false); onAlert("Сценарий дополнения знаний будет реализован через чат Норма."); }}
              >
                Передать знания Норму
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- toast ---------- */

function KbToast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, [onDone]);
  return <div className="np-toast">{message}</div>;
}

/* ---------- main page ---------- */

function ProfileTab({
  onOpenChat, setToast,
}: { onOpenChat?: (q: string) => void; setToast: (s: string | null) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = activeId ? AREAS.find((a) => a.id === activeId) ?? null : null;

  const handleAlert = (a: KnowledgeAlert, k: Knowledge) => {
    if (onOpenChat) onOpenChat(`Профиль компании, «${k.title}»: ${a.action?.label || a.message}`);
    else setToast(a.action?.label ? `${a.action.label}: сценарий будет реализован через чат Норма.` : a.message);
  };

  if (active) {
    return (
      <AreaView
        area={active}
        areas={AREAS}
        onSelect={setActiveId}
        onBack={() => setActiveId(null)}
        onAlert={handleAlert}
      />
    );
  }

  return (
    <>
      <section className="np-kb-summary np-kb-summary-solo">
        <div className="np-kb-summary-head">
          <div className="np-kb-summary-eyebrow">Как Норм понимает компанию</div>
          <p>
            Профиль {DATA.profile.company.short_name} собран из открытых источников, регистрационных
            сведений и загруженных документов компании. Кликни по области, чтобы увидеть конкретные
            знания и их источники.
          </p>
        </div>
      </section>

      <section className="np-kb-grid">
        {AREAS.map((a) => (
          <AreaCard key={a.id} area={a} onOpen={() => setActiveId(a.id)} />
        ))}
      </section>
    </>
  );
}

export default function KnowledgeBase({ onOpenChat }: { onOpenChat?: (q: string) => void }) {
  const [tab, setTab] = useState<"profile" | "docs">("profile");
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="np-kb">
      <div className="np-kb-pageheader">
        <div className="np-kb-pageheader-row">
          <div>
            <h1>Профиль компании</h1>
            <p className="np-muted">
              {DATA.profile.company.short_name} · ИНН {DATA.profile.company.inn} · ОГРН {DATA.profile.company.ogrn}
            </p>
          </div>
          <IndexWidget onAlert={(m) => setToast(m)} />
        </div>
        <div className="np-kb-tabs" role="tablist">
          <button className={`np-kb-tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>
            Знания о компании
          </button>
          <button className={`np-kb-tab ${tab === "docs" ? "active" : ""}`} onClick={() => setTab("docs")}>
            Документы
          </button>
        </div>
      </div>

      {tab === "profile" && <ProfileTab onOpenChat={onOpenChat} setToast={setToast} />}
      {tab === "docs" && (
        <div className="np-kb-placeholder">
          <p className="np-muted">Здесь будут документы компании: индикатор зрелости, стандарты, оргструктура, финансовое состояние, аудиты и проверки, прочее.</p>
        </div>
      )}
      {toast && <KbToast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}