import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import profileData from "../data/company_profile_full.json";
import coverageData from "../data/profile_coverage.json";
import { UniversalValueRenderer } from "./UniversalValueRenderer";
import { SourceTags, pickPrimarySource } from "./SourceTags";
import { KnowledgeSourcesDrawer } from "./KnowledgeSourcesDrawer";
import { normalizeProfile } from "../adapters/profileKnowledgeAdapter";
import type { UniversalArea } from "../adapters/profileKnowledgeAdapter";
import type {
  UniversalKnowledge,
  KnowledgeSource,
  KnowledgeSourceReference,
} from "../types/universalKnowledge";
import type { CompanyProfile } from "../types/profile";

const DATA = profileData as unknown as CompanyProfile;
const AREAS_RAW = DATA.profile.areas;

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
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return String(iso);
  const mo = parseInt(m[2], 10) - 1;
  if (mo < 0 || mo > 11) return iso;
  return `${parseInt(m[3], 10)} ${MONTHS_RU[mo]} ${m[1]}`;
}

function tagToneForFreshness(code: string | null | undefined): "ok" | "warn" | "low" | "neutral" {
  if (code === "current") return "ok";
  if (code === "outdated" || code === "update_required") return "warn";
  if (code === "missing" || code === "expired") return "low";
  return "neutral";
}

/* ---------- source-override state ----------
 * Local edits/deletes performed via the sources drawer are held
 * per-knowledge and layered over the normalized data. */

interface SourceOverride {
  sources: KnowledgeSource[];
  evidence: KnowledgeSourceReference[];
}
type Overrides = Record<string, SourceOverride>;

function applyOverrides(k: UniversalKnowledge, ov?: SourceOverride): UniversalKnowledge {
  if (!ov) return k;
  return {
    ...k,
    sources: ov.sources,
    metadata: { ...(k.metadata || {}), sourceEvidence: ov.evidence },
  };
}

/* ---------- unified accordion ---------- */

function KnowledgeAccordion({
  k, defaultOpen, onOpenSources,
}: {
  k: UniversalKnowledge;
  defaultOpen?: boolean;
  onOpenSources: (k: UniversalKnowledge) => void;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const freshness = k.metadata?.freshness;
  const tag = freshness?.label || k.state.label;
  const tone = tagToneForFreshness(freshness?.code);
  const tagClass =
    tone === "ok" ? "np-tag np-tag-ok"
    : tone === "warn" ? "np-tag np-tag-warning"
    : tone === "low" ? "np-tag np-tag-danger"
    : "np-tag";

  const actualAt = k.metadata?.actualAt
    ? `Актуально на ${formatRuDate(k.metadata.actualAt)}`
    : null;

  const openSources = () => onOpenSources(k);

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
            <span className="np-k-acc-title">{k.title}</span>
            {tag && <span className={tagClass}>{tag}</span>}
          </div>
          {k.description && <div className="np-k-acc-summary">{k.description}</div>}
          <div className="np-k-acc-meta">
            <SourceTags
              sources={k.sources || []}
              evidence={k.metadata?.sourceEvidence || []}
              actualAt={actualAt || undefined}
              onOpen={openSources}
            />
          </div>
        </div>
        <span className={`np-k-acc-chevron ${open ? "is-open" : ""}`} aria-hidden>›</span>
      </button>
      {open && (
        <div className="np-k-acc-body">
          <div className="np-k-body">
            <UniversalValueRenderer node={k.content} parentTitle={k.title} />
          </div>
          {k.alerts && k.alerts.length > 0 && (
            <div className="np-uv-alerts">
              {k.alerts.map((a) => (
                <div key={a.id} className={`np-uv-alert np-uv-alert--${a.severity}`}>
                  {a.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ---------- area card / view ---------- */

function uniqueSourceCount(area: UniversalArea): number {
  const set = new Set<string>();
  for (const k of area.knowledge) for (const s of k.sources || []) set.add(s.id);
  return set.size;
}

function AreaCard({ area, onOpen }: { area: UniversalArea; onOpen: () => void }) {
  const cov = coverageForArea(area.id);
  const percent = cov?.percent ?? 0;
  const status = cov?.status ?? "";
  const tone = toneForPercent(percent);
  const srcCount = uniqueSourceCount(area);
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
          {area.knowledge.length} знаний · {srcCount} {srcCount === 1 ? "источник" : "источников"}
        </span>
      </div>
      <div className={`np-progress np-progress--sm np-progress--${tone}`}>
        <div className="np-progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </article>
  );
}

function LocalIndexBlock({
  area, percent, tone, cov, onOpen,
}: {
  area: UniversalArea; percent: number; tone: string;
  cov: AreaCoverage | undefined; onOpen: () => void;
}) {
  return (
    <button type="button" className="np-index-horizontal np-index-horizontal--local" onClick={onOpen}>
      <div className="np-idxh-value">{percent}%</div>
      <div className="np-idxh-text">
        <div className="np-idxh-title">Знание области</div>
        <div className="np-idxh-sub">
          {cov?.status ?? ""} · {area.knowledge.length} {area.knowledge.length === 1 ? "знание" : "знаний"}
        </div>
      </div>
      <div className="np-idxh-bar-wrap">
        <div className={`np-progress np-progress--sm np-progress--${tone}`}>
          <div className="np-progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <span className="np-idxh-chev" aria-hidden>›</span>
    </button>
  );
}

function ImproveBlock({
  cov, onRec,
}: { cov: AreaCoverage | undefined; onRec: (r: CoverageRecommendation) => void }) {
  return (
    <div className="np-area-side-card np-area-improve">
      <h4>Что стоит добавить</h4>
      <ul className="np-area-improve-list">
        {(cov?.recommendations ?? []).map((r) => (
          <li key={r.id} onClick={() => onRec(r)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") onRec(r); }}>
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
  );
}

function AreaView({
  area, areas, onSelect, onBack, onOpenChat, onOpenSources,
}: {
  area: UniversalArea;
  areas: UniversalArea[];
  onSelect: (id: string) => void;
  onBack: () => void;
  onOpenChat?: (q: string) => void;
  onOpenSources: (k: UniversalKnowledge) => void;
}) {
  const cov = coverageForArea(area.id);
  const percent = cov?.percent ?? 0;
  const tone = toneForPercent(percent);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRec = (r: CoverageRecommendation) => {
    if (onOpenChat) onOpenChat(r.chatPrompt);
  };

  const visibleKnowledge = area.knowledge.filter(
    (k) => k.state.code !== "unknown" && k.state.code !== "not_applicable",
  );

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
          <div className="np-k-stack">
            {visibleKnowledge.map((k, i) => (
              <KnowledgeAccordion
                key={k.id}
                k={k}
                defaultOpen={i === 0}
                onOpenSources={onOpenSources}
              />
            ))}
            {visibleKnowledge.length === 0 && (
              <div className="np-kb-empty">В этой области пока нет знаний.</div>
            )}
          </div>
        </div>

        <aside className="np-area-right">
          <LocalIndexBlock area={area} percent={percent} tone={tone} cov={cov} onOpen={() => setDrawerOpen(true)} />
          <ImproveBlock cov={cov} onRec={handleRec} />
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

/* ---------- shared insight drawer (unchanged shape) ---------- */

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
  totalKnowledge, onOpenChat, setToast,
}: {
  totalKnowledge: number;
  onOpenChat?: (q: string) => void;
  setToast: (s: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const p = COVERAGE.profile;
  const tone = toneForPercent(p.percent);
  return (
    <>
      <button type="button" className="np-index-horizontal" onClick={() => setOpen(true)}>
        <div className="np-idxh-value">{p.percent}%</div>
        <div className="np-idxh-text">
          <div className="np-idxh-title">Индекс знания</div>
          <div className="np-idxh-sub">{p.status} · {p.areasTotal} областей · {totalKnowledge} знаний</div>
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
  areas, totalKnowledge, onOpenChat, onOpenSources, setToast,
}: {
  areas: UniversalArea[];
  totalKnowledge: number;
  onOpenChat?: (q: string) => void;
  onOpenSources: (k: UniversalKnowledge) => void;
  setToast: (s: string | null) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "lowKnowledge" | "needsUpdate">("all");
  const active = activeId ? areas.find((a) => a.id === activeId) ?? null : null;

  if (active) {
    return (
      <AreaView
        area={active}
        areas={areas}
        onSelect={setActiveId}
        onBack={() => setActiveId(null)}
        onOpenChat={onOpenChat}
        onOpenSources={onOpenSources}
      />
    );
  }

  const lowCount = areas.filter((a) => coverageForArea(a.id)?.needsKnowledge).length;
  const updCount = areas.filter((a) => coverageForArea(a.id)?.needsUpdate).length;
  const filtered = areas.filter((a) => {
    const c = coverageForArea(a.id);
    if (filter === "lowKnowledge") return !!c?.needsKnowledge;
    if (filter === "needsUpdate") return !!c?.needsUpdate;
    return true;
  });

  return (
    <>
      <IndexWidgetHorizontal
        totalKnowledge={totalKnowledge}
        onOpenChat={onOpenChat}
        setToast={setToast}
      />

      <div className="np-kb-filters">
        <div className="np-kb-filters-title">Области профиля</div>
        <div className="np-kb-filters-row">
          <button className={`np-kb-filter ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
            Все · {areas.length}
          </button>
          <button className={`np-kb-filter ${filter === "lowKnowledge" ? "active" : ""}`} onClick={() => setFilter("lowKnowledge")}>
            Мало знаний · {lowCount}
          </button>
          <button className={`np-kb-filter ${filter === "needsUpdate" ? "active" : ""}`} onClick={() => setFilter("needsUpdate")}>
            Нужно обновить · {updCount}
          </button>
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
  const [overrides, setOverrides] = useState<Overrides>({});
  const [sourcesFor, setSourcesFor] = useState<UniversalKnowledge | null>(null);

  // Normalize the full profile once; apply overrides on read.
  const baseAreas = useMemo(() => normalizeProfile(AREAS_RAW), []);
  const areas: UniversalArea[] = useMemo(
    () =>
      baseAreas.map((a) => ({
        ...a,
        knowledge: a.knowledge.map((k) => applyOverrides(k, overrides[k.id])),
      })),
    [baseAreas, overrides],
  );

  const totalKnowledge = useMemo(
    () => areas.reduce((n, a) => n + a.knowledge.length, 0),
    [areas],
  );

  const openSources = (k: UniversalKnowledge) => setSourcesFor(k);

  // Whenever overrides change, refresh the open drawer's knowledge snapshot.
  const drawerKnowledge = useMemo(() => {
    if (!sourcesFor) return null;
    for (const a of areas) {
      const found = a.knowledge.find((x) => x.id === sourcesFor.id);
      if (found) return found;
    }
    return sourcesFor;
  }, [sourcesFor, areas]);

  const updateSource = (
    kId: string,
    next: KnowledgeSource,
    ev: KnowledgeSourceReference | undefined,
  ) => {
    setOverrides((prev) => {
      const current = prev[kId] || currentOverrideFrom(baseAreas, kId);
      const sources = current.sources.map((s) => (s.id === next.id ? next : s));
      const evidence = ev
        ? [
            ...current.evidence.filter((e) => e.sourceId !== next.id),
            ev,
          ]
        : current.evidence;
      return { ...prev, [kId]: { sources, evidence } };
    });
  };

  const deleteSource = (kId: string, sourceId: string) => {
    setOverrides((prev) => {
      const current = prev[kId] || currentOverrideFrom(baseAreas, kId);
      const sources = current.sources.filter((s) => s.id !== sourceId);
      const evidence = current.evidence.filter((e) => e.sourceId !== sourceId);
      return { ...prev, [kId]: { sources, evidence } };
    });
  };

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

      {tab === "profile" && (
        <ProfileTab
          areas={areas}
          totalKnowledge={totalKnowledge}
          onOpenChat={onOpenChat}
          onOpenSources={openSources}
          setToast={setToast}
        />
      )}
      {tab === "docs" && (
        <div className="np-kb-placeholder">
          Раздел «Документы компании» будет здесь.
        </div>
      )}
      {tab === "methodology" && (
        <div className="np-kb-placeholder">
          Раздел «Методология» будет здесь.
        </div>
      )}

      {drawerKnowledge && (
        <KnowledgeSourcesDrawer
          knowledgeTitle={drawerKnowledge.title}
          sources={drawerKnowledge.sources || []}
          evidence={drawerKnowledge.metadata?.sourceEvidence || []}
          onClose={() => setSourcesFor(null)}
          onUpdateSource={(s, ev) => updateSource(drawerKnowledge.id, s, ev)}
          onDeleteSource={(id) => deleteSource(drawerKnowledge.id, id)}
        />
      )}

      {toast && <KbToast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

function currentOverrideFrom(
  baseAreas: UniversalArea[],
  kId: string,
): SourceOverride {
  for (const a of baseAreas) {
    const found = a.knowledge.find((x) => x.id === kId);
    if (found) {
      return {
        sources: [...(found.sources || [])],
        evidence: [...(found.metadata?.sourceEvidence || [])],
      };
    }
  }
  return { sources: [], evidence: [] };
}