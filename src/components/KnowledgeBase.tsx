import { useEffect, useMemo, useState } from "react";
import profileData from "../data/company_profile_full.json";
import universalDemo from "../data/universal_knowledge_demo.json";
import coverageData from "../data/profile_coverage.json";
import { UniversalValueRenderer } from "./UniversalValueRenderer";
import type { UniversalKnowledgeDemo } from "../types/universalKnowledge";
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
const UNIVERSAL_DEMO = universalDemo as unknown as UniversalKnowledgeDemo;

/* ---------- coverage data types ---------- */

interface CoverageRecommendation {
  id: string;
  title: string;
  description: string;
  chatPrompt: string;
}
interface AreaCoverage {
  percent: number;
  status: string;
  needsKnowledge: boolean;
  needsUpdate: boolean;
  understanding: string;
  canUse: string;
  limitations: string;
  recommendations: CoverageRecommendation[];
}
interface ProfileCoverage {
  profile: {
    percent: number;
    status: string;
    areasTotal: number;
    knowledgeTotal: number;
    lowKnowledgeAreas: number;
    outdatedAreas: number;
    understanding: string;
    canUse: string[];
    limitations: string[];
  };
  areas: Record<string, AreaCoverage>;
}
const COVERAGE = coverageData as unknown as ProfileCoverage;

function coverageForArea(id: string): AreaCoverage | undefined {
  return COVERAGE.areas[id];
}
function toneForPercent(p: number): "ok" | "warn" | "low" {
  return p >= 70 ? "ok" : p >= 40 ? "warn" : "low";
}

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
  // Render as a vertical list (no HTML tables per design system)
  const pageSize = k.presentation.page_size || 10;
  const [open, setOpen] = useState(false);
  const visible = open ? k.items : k.items.slice(0, pageSize);
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

/* ---------- unified accordion shell ---------- */

function KnowledgeAccordion({
  title, tag, tagTone, summary, meta, defaultOpen = false, children,
}: {
  title: string;
  tag?: string;
  tagTone?: "ok" | "warn" | "low" | "neutral";
  summary?: string | null;
  meta?: string | null;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const tagClass =
    tagTone === "ok" ? "np-tag np-tag-ok"
    : tagTone === "warn" ? "np-tag np-tag-warning"
    : tagTone === "low" ? "np-tag np-tag-danger"
    : "np-tag";
  return (
    <article className={`np-k-acc ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="np-k-acc-head"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="np-k-acc-main">
          <div className="np-k-acc-titleline">
            <span className="np-k-acc-title">{title}</span>
            {tag && <span className={tagClass}>{tag}</span>}
          </div>
          {summary && <div className="np-k-acc-summary">{summary}</div>}
          {meta && <div className="np-k-acc-meta">{meta}</div>}
        </div>
        <span className={`np-k-acc-chevron ${open ? "is-open" : ""}`} aria-hidden>›</span>
      </button>
      {open && <div className="np-k-acc-body">{children}</div>}
    </article>
  );
}

function tagToneForFreshness(code: string): "ok" | "warn" | "low" | "neutral" {
  if (code === "current") return "ok";
  if (code === "outdated" || code === "update_required") return "warn";
  if (code === "missing") return "low";
  return "neutral";
}

function LegacyKnowledgeAccordion({
  k, defaultOpen, onAlert,
}: { k: Knowledge; defaultOpen?: boolean; onAlert: (a: KnowledgeAlert, k: Knowledge) => void }) {
  const sourceLine =
    k.sources.length > 0
      ? `${k.sources[0].name}${k.sources.length > 1 ? ` · ещё ${k.sources.length - 1}` : ""} · Актуально на ${formatRuDate(k.actual_at)}`
      : `Актуально на ${formatRuDate(k.actual_at)}`;
  return (
    <KnowledgeAccordion
      title={k.title}
      tag={k.freshness.label}
      tagTone={tagToneForFreshness(k.freshness.code)}
      summary={k.summary}
      meta={sourceLine}
      defaultOpen={defaultOpen}
    >
      <div className="np-k-body">{renderVariant(k)}</div>
      <AlertBlock alerts={k.alerts} onAction={(a) => onAlert(a, k)} />
      <KnowledgeFooter k={k} />
    </KnowledgeAccordion>
  );
}

function UniversalKnowledgeAccordion({
  k, defaultOpen,
}: {
  k: (typeof UNIVERSAL_DEMO.knowledge)[number];
  defaultOpen?: boolean;
}) {
  const freshness = k.metadata?.freshness;
  const tagLabel = freshness?.label || k.state.label;
  const tagTone = tagToneForFreshness(freshness?.code || "");
  const actualAt = k.metadata?.actualAt ? formatRuDate(k.metadata.actualAt) : "";
  const firstSource = k.sources && k.sources[0];
  const metaParts: string[] = [];
  if (firstSource) {
    metaParts.push(firstSource.name + (k.sources && k.sources.length > 1 ? ` · ещё ${k.sources.length - 1}` : ""));
  }
  if (actualAt) metaParts.push(`Актуально на ${actualAt}`);
  return (
    <KnowledgeAccordion
      title={k.title}
      tag={tagLabel}
      tagTone={tagTone}
      summary={k.description ?? null}
      meta={metaParts.join(" · ") || null}
      defaultOpen={defaultOpen}
    >
      <div className="np-k-body">
        <UniversalValueRenderer node={k.content} parentTitle={k.title} />
      </div>
      {k.alerts && k.alerts.length > 0 && (
        <div className="np-uv-alerts">
          {k.alerts.map((a) => (
            <div key={a.id} className={`np-uv-alert np-uv-alert--${a.severity}`}>{a.message}</div>
          ))}
        </div>
      )}
      {(k.sources && k.sources.length > 0) || k.metadata?.actualAt ? (
        <footer className="np-uv-footer">
          {k.sources && k.sources.length > 0 && (
            <div className="np-uv-foot-row">
              <span className="np-uv-foot-label">Источники:</span>
              <span className="np-uv-foot-val">
                {k.sources.map((s) => (s.dataset ? `${s.name} · ${s.dataset}` : s.name)).join(", ")}
              </span>
            </div>
          )}
          {k.metadata?.actualAt && (
            <div className="np-uv-foot-row">
              <span className="np-uv-foot-label">Актуально на:</span>
              <span className="np-uv-foot-val">{formatRuDate(k.metadata.actualAt)}</span>
            </div>
          )}
        </footer>
      ) : null}
    </KnowledgeAccordion>
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

function AreaCard({ area, onOpen }: { area: Area; onOpen: () => void }) {
  const sources = uniqueSources(area);
  const cov = coverageForArea(area.id);
  const percent = cov?.percent ?? 0;
  const status = cov?.status ?? "";
  const tone = toneForPercent(percent);
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
          {status && <div className="np-kb-card-status">{status}</div>}
        </div>
        <div className="np-kb-card-percent">{percent}%</div>
      </div>
      {area.description && <p className="np-kb-card-insight">{area.description}</p>}
      <div className="np-kb-card-foot">
        <span className="np-muted">
          {area.knowledge.length} знаний · {sources.length} {sources.length === 1 ? "источник" : "источников"}
        </span>
      </div>
      <div className={`np-progress np-progress--sm np-progress--${tone}`}>
        <div className="np-progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </article>
  );
}

function AreaView({
  area, areas, onSelect, onBack, onAlert, onOpenChat, setToast,
}: {
  area: Area; areas: Area[]; onSelect: (id: string) => void; onBack: () => void;
  onAlert: (a: KnowledgeAlert, k: Knowledge) => void;
  onOpenChat?: (q: string) => void;
  setToast: (s: string | null) => void;
}) {
  const cov = coverageForArea(area.id);
  const percent = cov?.percent ?? 0;
  const tone = toneForPercent(percent);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRec = (r: CoverageRecommendation) => {
    if (onOpenChat) onOpenChat(r.chatPrompt);
    else setToast(`${r.title}: ${r.description}`);
  };

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
            const p = coverageForArea(a.id)?.percent ?? 0;
            const tn = toneForPercent(p);
            return (
              <button
                key={a.id}
                className={`np-area-left-item ${isActive ? "active" : ""}`}
                onClick={() => onSelect(a.id)}
              >
                <div className="np-area-left-row">
                  <div className="np-area-left-name">{a.title}</div>
                  <span className="np-muted">{p}%</span>
                </div>
                <div className={`np-progress np-progress--sm np-progress--${tn}`}>
                  <div className="np-progress-fill" style={{ width: `${p}%` }} />
                </div>
              </button>
            );
          })}
        </aside>

        <div className="np-area-center">
          <button
            type="button"
            className="np-index-horizontal np-index-horizontal--local"
            onClick={() => setDrawerOpen(true)}
          >
            <div className="np-idxh-value">{percent}%</div>
            <div className="np-idxh-text">
              <div className="np-idxh-title">Знание области</div>
              <div className="np-idxh-sub">
                {cov?.status ?? ""} · {area.knowledge.length} карточек знаний
              </div>
            </div>
            <div className="np-idxh-bar-wrap">
              <div className={`np-progress np-progress--sm np-progress--${tone}`}>
                <div className="np-progress-fill" style={{ width: `${percent}%` }} />
              </div>
            </div>
            <span className="np-idxh-chev" aria-hidden>›</span>
          </button>

          <div className="np-k-stack">
            {area.id === UNIVERSAL_DEMO.areaId
              ? UNIVERSAL_DEMO.knowledge.map((uk, i) => (
                  <UniversalKnowledgeAccordion key={uk.id} k={uk} defaultOpen={i === 0} />
                ))
              : area.knowledge.map((k) => (
                  <LegacyKnowledgeAccordion key={k.id} k={k} onAlert={onAlert} />
                ))}
          </div>
        </div>

        <aside className="np-area-right">
          <div className="np-area-side-card np-area-improve">
            <h4>Что стоит добавить</h4>
            <ul className="np-area-improve-list">
              {(cov?.recommendations ?? []).map((r) => (
                <li key={r.id} onClick={() => handleRec(r)} role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRec(r); }}>
                  <div className="np-improve-title">{r.title}</div>
                  <div className="np-improve-why">{r.description}</div>
                  <span className="np-improve-chev" aria-hidden>›</span>
                </li>
              ))}
              {(!cov || cov.recommendations.length === 0) && (
                <li className="np-muted" style={{ cursor: "default" }}>Пока нет предложений</li>
              )}
            </ul>
          </div>
        </aside>
      </div>

      {drawerOpen && cov && (
        <KnowledgeInsightDrawer
          title={`Как Норм понимает «${area.title}»`}
          percent={percent}
          status={cov.status}
          understanding={cov.understanding}
          canUse={[cov.canUse]}
          limitations={[cov.limitations]}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}

/* ---------- shared insight drawer ---------- */

function KnowledgeInsightDrawer({
  title, percent, status, understanding, canUse, limitations, actionLabel, onAction, onClose,
}: {
  title: string;
  percent: number;
  status: string;
  understanding: string;
  canUse: string[];
  limitations: string[];
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}) {
  const tone = toneForPercent(percent);
  return (
    <div className="np-drawer-backdrop" onClick={onClose}>
      <div className="np-drawer" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="np-drawer-head">
          <div>
            <div className="np-drawer-eyebrow">Индекс знания</div>
            <h3 className="np-drawer-title">{title}</h3>
            <div className="np-progress-row np-progress-row--wide">
              <span className="np-progress-label">{percent}%</span>
              <div className={`np-progress np-progress--${tone}`}>
                <div className="np-progress-fill" style={{ width: `${percent}%` }} />
              </div>
              <span className="np-progress-meta">{status}</span>
            </div>
            <p className="np-drawer-summary">{understanding}</p>
          </div>
          <button className="np-icon-btn" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="np-drawer-body">
          <section className="np-drawer-section">
            <h4>Что Норм уже может учитывать</h4>
            <ul className="np-drawer-list">
              {canUse.filter(Boolean).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </section>
          <section className="np-drawer-section">
            <h4>Где понимание ограничено</h4>
            <ul className="np-drawer-list">
              {limitations.filter(Boolean).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </section>
        </div>
        {(actionLabel && onAction) && (
          <div className="np-drawer-foot">
            <button className="np-btn" onClick={onClose}>Закрыть</button>
            <button className="np-btn np-btn-primary" onClick={() => { onAction(); onClose(); }}>
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- horizontal index widget ---------- */

function IndexWidgetHorizontal({
  onOpenChat, setToast,
}: { onOpenChat?: (q: string) => void; setToast: (s: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const p = COVERAGE.profile;
  const tone = toneForPercent(p.percent);
  return (
    <>
      <button
        type="button"
        className="np-index-horizontal"
        onClick={() => setOpen(true)}
      >
        <div className="np-idxh-value">{p.percent}%</div>
        <div className="np-idxh-text">
          <div className="np-idxh-title">Индекс знания</div>
          <div className="np-idxh-sub">{p.status} · {p.areasTotal} областей · {p.knowledgeTotal} знаний</div>
        </div>
        <div className="np-idxh-bar-wrap">
          <div className={`np-progress np-progress--sm np-progress--${tone}`}>
            <div className="np-progress-fill" style={{ width: `${p.percent}%` }} />
          </div>
        </div>
        <span className="np-idxh-chev" aria-hidden>›</span>
      </button>
      {open && (
        <KnowledgeInsightDrawer
          title="Как Норм понимает компанию"
          percent={p.percent}
          status={p.status}
          understanding={p.understanding}
          canUse={p.canUse}
          limitations={p.limitations}
          actionLabel="Дополнить профиль"
          onAction={() => {
            const prompt = "Хочу дополнить профиль компании. Покажи, каких знаний сейчас не хватает больше всего и почему они важны.";
            if (onOpenChat) onOpenChat(prompt);
            else setToast("Открой чат с Нормом, чтобы дополнить профиль.");
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
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
  const [filter, setFilter] = useState<"all" | "lowKnowledge" | "needsUpdate">("all");
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
        onOpenChat={onOpenChat}
        setToast={setToast}
      />
    );
  }

  const lowCount = AREAS.filter((a) => coverageForArea(a.id)?.needsKnowledge).length;
  const updCount = AREAS.filter((a) => coverageForArea(a.id)?.needsUpdate).length;
  const filtered = AREAS.filter((a) => {
    const c = coverageForArea(a.id);
    if (filter === "lowKnowledge") return !!c?.needsKnowledge;
    if (filter === "needsUpdate") return !!c?.needsUpdate;
    return true;
  });

  return (
    <>
      <IndexWidgetHorizontal onOpenChat={onOpenChat} setToast={setToast} />

      <div className="np-kb-filters">
        <div className="np-kb-filters-title">Области профиля</div>
        <div className="np-kb-filters-row">
          <button
            className={`np-kb-filter ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >Все · {AREAS.length}</button>
          <button
            className={`np-kb-filter ${filter === "lowKnowledge" ? "active" : ""}`}
            onClick={() => setFilter("lowKnowledge")}
          >Мало знаний · {lowCount}</button>
          <button
            className={`np-kb-filter ${filter === "needsUpdate" ? "active" : ""}`}
            onClick={() => setFilter("needsUpdate")}
          >Нужно обновить · {updCount}</button>
        </div>
      </div>

      <section className="np-kb-grid">
        {filtered.map((a) => (
          <AreaCard key={a.id} area={a} onOpen={() => setActiveId(a.id)} />
        ))}
        {filtered.length === 0 && (
          <div className="np-kb-empty">В этой группе пока нет областей</div>
        )}
      </section>
    </>
  );
}

export default function KnowledgeBase({ onOpenChat }: { onOpenChat?: (q: string) => void }) {
  const [tab, setTab] = useState<"profile" | "docs" | "methodology">("profile");
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="np-kb">
      <div className="np-kb-pageheader">
        <h1>База знаний Норма AI</h1>
        <div className="np-kb-tabs" role="tablist">
          <button className={`np-kb-tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>
            Профиль компании
          </button>
          <button className={`np-kb-tab ${tab === "docs" ? "active" : ""}`} onClick={() => setTab("docs")}>
            Документы компании
          </button>
          <button className={`np-kb-tab ${tab === "methodology" ? "active" : ""}`} onClick={() => setTab("methodology")}>
            Методология
          </button>
        </div>
      </div>

      {tab === "profile" && <ProfileTab onOpenChat={onOpenChat} setToast={setToast} />}
      {tab === "docs" && (
        <div className="np-kb-placeholder">
          <p className="np-muted">Здесь будут документы компании: индикатор зрелости, стандарты, оргструктура, финансовое состояние, аудиты и проверки, прочее.</p>
        </div>
      )}
      {tab === "methodology" && (
        <div className="np-kb-placeholder">
          <p className="np-muted">Здесь будет методология: как Норм понимает компанию, как формируются области профиля, как оценивается покрытие и актуальность.</p>
        </div>
      )}
      {toast && <KbToast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}