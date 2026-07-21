import { useEffect, useMemo, useRef, useState } from "react";
import profileData from "../data/company_profile_full.json";
import coverageData from "../data/profile_coverage.json";
import { UniversalValueRenderer } from "./UniversalValueRenderer";
import { SourceTags } from "./SourceTags";
import { KnowledgeSourcesDrawer } from "./KnowledgeSourcesDrawer";
import { normalizeProfile } from "../adapters/profileKnowledgeAdapter";
import type { UniversalArea } from "../adapters/profileKnowledgeAdapter";
import type {
  UniversalKnowledge,
  KnowledgeSource,
  KnowledgeSourceReference,
} from "../types/universalKnowledge";
import type { CompanyProfile } from "../types/profile";
import { CoverageRing } from "./CoverageRing";
import { AreaCoverageCard } from "./AreaCoverageCard";
import { KnowledgeCountTag, SourceCountTag } from "./MetaTag";
import { KnowledgeInsightDrawer } from "./KnowledgeInsightDrawer";
import { insightForArea, profileInsight } from "../data/profile_insights";
import type { ImportantSignal, AreaInsight, ProfileInsight } from "../data/profile_insights";

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

/* ---------- important-signals helper ---------- */

type SignalTone = "conflict" | "warning" | "stale";

function signalSummary(
  insight: AreaInsight | ProfileInsight | undefined,
): { tone: SignalTone; count: number; label: string } | null {
  const list: ImportantSignal[] = insight?.importantSignals ?? [];
  if (!list.length) return null;
  const order: SignalTone[] = ["conflict", "warning", "stale"];
  let tone: SignalTone = "stale";
  for (const t of order) {
    if (list.some((s) => s.type === t)) { tone = t; break; }
  }
  const n = list.length;
  const mod10 = n % 10;
  const mod100 = n % 100;
  let word = "сигналов";
  if (mod10 === 1 && mod100 !== 11) word = "сигнал";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = "сигнала";
  return { tone, count: n, label: `${n} ${word}` };
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

/** Decide whether to show a status badge on a closed accordion, and which one.
 *  Priority: conflicting > update_required > partial. Others render no badge. */
function pickBadge(k: UniversalKnowledge): { label: string; tone: "warn" | "low" | "neutral" } | null {
  if (k.state.code === "conflicting") return { label: "Есть расхождения", tone: "warn" };
  if (k.metadata?.freshness?.code === "update_required") return { label: "Нужно обновить", tone: "warn" };
  if (k.state.code === "partial") return { label: "Известно частично", tone: "neutral" };
  return null;
}

function countNeedsUpdate(area: UniversalArea): number {
  return area.knowledge.filter((k) => k.metadata?.freshness?.code === "update_required").length;
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
  const badge = pickBadge(k);
  const badgeClass =
    badge?.tone === "warn" ? "np-tag np-tag-warning"
    : badge?.tone === "low" ? "np-tag np-tag-danger"
    : "np-tag";

  const actualDate = k.metadata?.actualAt ? formatRuDate(k.metadata.actualAt) : "";
  const actualAt = actualDate
    ? (freshness?.code === "current" ? `Актуально на ${actualDate}` : `Данные на ${actualDate}`)
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
            {badge && <span className={badgeClass}>{badge.label}</span>}
            {k.state.code === "known_empty" && (
              <span className="np-uv-empty-tag">Не выявлено</span>
            )}
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
                  <span>{a.message}</span>
                  {a.action && (
                    <button
                      type="button"
                      className="np-uv-alert-action"
                      onClick={() => onOpenSources(k)}
                    >
                      {a.action.label}
                    </button>
                  )}
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
  const signal = signalSummary(insightForArea(area.id));
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
          <div className="np-area-card-state-row">
            {status && (
              <span className={`np-area-card-status np-kb-card-status--${tone}`}>
                {status}
              </span>
            )}
            {signal && (
              <span className={`np-area-card-signals np-area-signal--${signal.tone}`}>
                <span className="np-area-card-signal-dot" />
                {signal.label}
              </span>
            )}
          </div>
        </div>
        <CoverageRing percent={percent} size={46} />
      </div>
      {area.description && <p className="np-kb-card-insight">{area.description}</p>}
      <div className="np-kb-card-tags">
        <KnowledgeCountTag count={area.knowledge.length} />
        <SourceCountTag count={srcCount} />
      </div>
    </article>
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRec = (r: CoverageRecommendation) => {
    if (onOpenChat) onOpenChat(r.chatPrompt);
  };

  const visibleKnowledge = area.knowledge.filter(
    (k) => k.state.code !== "unknown" && k.state.code !== "not_applicable",
  );
  const needsUpd = countNeedsUpdate(area);

  return (
    <div className="np-area-screen">
      <aside className="np-profile-rail">
        <div className="np-profile-rail-title">Области профиля</div>
        <div className="np-profile-rail-list">
          {areas.map((a) => {
            const isActive = a.id === area.id;
            const p = coverageForArea(a.id)?.percent ?? 0;
            const tn = toneForPercent(p);
            return (
              <button
                key={a.id}
                className={`np-profile-rail-item ${isActive ? "active" : ""}`}
                onClick={() => onSelect(a.id)}
              >
                <div className="np-profile-rail-row">
                  <div className="np-profile-rail-name">{a.title}</div>
                  <span className="np-muted">{p}%</span>
                </div>
                <div className={`np-progress np-progress--sm np-progress--${tn}`}>
                  <div className="np-progress-fill" style={{ width: `${p}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="np-area-stage">
        <div className="np-area-container">
        <header className="np-area-workhead">
          <button
            type="button"
            className="np-area-back-btn"
            onClick={onBack}
            aria-label="Вернуться в профиль компании"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="np-area-workhead-text">
            <h1 className="np-area-workhead-title">{area.title}</h1>
            {area.description && <p className="np-area-workhead-sub">{area.description}</p>}
          </div>
        </header>

        <div className="np-area-content">
          <div className="np-area-knowledge">
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
            <AreaCoverageCard
              percent={percent}
              status={cov?.status ?? ""}
              knowledgeCount={area.knowledge.length}
              needsUpdateCount={needsUpd}
              signal={signalSummary(insightForArea(area.id))}
              onOpen={() => setDrawerOpen(true)}
            />
            <ImproveBlock cov={cov} onRec={handleRec} />
          </aside>
        </div>
        </div>
      </div>

      {drawerOpen && (
        <KnowledgeInsightDrawer
          title={`Как Норм понимает «${area.title}»`}
          percent={percent}
          status={cov?.status ?? ""}
          insight={insightForArea(area.id)}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}

/* ---------- horizontal index widget ---------- */

function IndexWidgetHorizontal({
  totalKnowledge,
}: {
  totalKnowledge: number;
}) {
  const [open, setOpen] = useState(false);
  const p = COVERAGE.profile;
  const tone = toneForPercent(p.percent);
  const signal = signalSummary(profileInsight());
  return (
    <>
      <button type="button" className="np-index-horizontal" onClick={() => setOpen(true)}>
        <div className="np-idxh-value">{p.percent}%</div>
        <div className="np-idxh-text">
          <div className="np-idxh-title">Индекс знания</div>
          <div className="np-idxh-sub">
            {p.status} · {p.areasTotal} областей · {totalKnowledge} знаний
            {signal && (
              <>
                {" · "}
                <span className={`np-area-signal-inline np-area-signal--${signal.tone}`}>
                  {signal.label}
                </span>
              </>
            )}
          </div>
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
          insight={profileInsight()}
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
  areas, totalKnowledge, onOpenChat, onOpenSources, activeId, setActiveId,
  filter, setFilter, searchQuery,
}: {
  areas: UniversalArea[];
  totalKnowledge: number;
  onOpenChat?: (q: string) => void;
  onOpenSources: (k: UniversalKnowledge) => void;
  setToast: (s: string | null) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  filter: "all" | "lowKnowledge" | "needsUpdate";
  setFilter: (f: "all" | "lowKnowledge" | "needsUpdate") => void;
  searchQuery: string;
}) {
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

  const q = searchQuery.trim().toLowerCase();
  const filtered = areas.filter((a) => {
    const c = coverageForArea(a.id);
    if (filter === "lowKnowledge" && !c?.needsKnowledge) return false;
    if (filter === "needsUpdate" && !c?.needsUpdate) return false;
    if (!q) return true;
    const hay: string[] = [a.title, a.description || "", c?.status || ""];
    for (const k of a.knowledge) {
      hay.push(k.title);
      for (const s of k.sources || []) hay.push(s.name || s.documentName || s.id);
    }
    return hay.some((s) => s.toLowerCase().includes(q));
  });

  return (
    <section className="np-kb-profile-content">
      <IndexWidgetHorizontal totalKnowledge={totalKnowledge} />
      <div className="np-kb-area-grid np-kb-grid">
        {filtered.map((a) => (
          <AreaCard key={a.id} area={a} onOpen={() => setActiveId(a.id)} />
        ))}
        {filtered.length === 0 && (
          <div className="np-kb-empty">
            {q ? "Ничего не найдено. Попробуйте изменить запрос." : "В этой группе пока нет областей"}
          </div>
        )}
      </div>
    </section>
  );
}

export default function KnowledgeBase({
  onOpenChat,
  onAreaViewChange,
  rootRequest,
}: {
  onOpenChat?: (q: string) => void;
  onAreaViewChange?: (isOpen: boolean) => void;
  rootRequest?: number;
}) {
  const [tab, setTab] = useState<"profile" | "docs" | "methodology">("profile");
  const [toast, setToast] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [sourcesFor, setSourcesFor] = useState<UniversalKnowledge | null>(null);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "lowKnowledge" | "needsUpdate">("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  useEffect(() => {
    onAreaViewChange?.(activeAreaId !== null && tab === "profile");
  }, [activeAreaId, tab, onAreaViewChange]);

  useEffect(() => {
    return () => {
      onAreaViewChange?.(false);
    };
  }, [onAreaViewChange]);

  useEffect(() => {
    if (rootRequest === undefined) return;
    setActiveAreaId(null);
    setTab("profile");
  }, [rootRequest]);

  useEffect(() => {
    if (activeAreaId && typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [activeAreaId]);

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

  const hideChrome = tab === "profile" && activeAreaId !== null;
  const lowCount = areas.filter((a) => coverageForArea(a.id)?.needsKnowledge).length;
  const updCount = areas.filter((a) => coverageForArea(a.id)?.needsUpdate).length;

  const toggleSearch = () => {
    setSearchOpen((v) => {
      const next = !v;
      if (!next) setSearchQuery("");
      return next;
    });
  };

  return (
    <div className={`np-kb ${hideChrome ? "np-kb--area-open" : "np-page-container"}`}>
      {!hideChrome && (
      <>
        <div className="np-kb-intro">
          <h1 className="np-kb-intro-title">База знаний</h1>
          <p className="np-kb-intro-desc">
            Здесь Норм собирает цифровой профиль компании, чтобы точнее находить риски,
            понимать их причины и моделировать возможные последствия.
          </p>
        </div>
        <div className="np-kb-controls">
          <div className="np-kb-toolbar">
            <div className="np-kb-toolbar-left">
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
              {tab === "profile" && (
                <>
                  <span className="np-kb-toolbar-divider" aria-hidden>/</span>
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
                </>
              )}
            </div>
            <button
              type="button"
              className={`np-kb-search-toggle ${searchOpen ? "active" : ""}`}
              aria-label={searchOpen ? "Закрыть поиск" : "Открыть поиск"}
              aria-pressed={searchOpen}
              onClick={toggleSearch}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>
          </div>
          {searchOpen && (
            <div className="np-kb-search-field">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по знаниям и областям"
              />
            </div>
          )}
        </div>
      </>
      )}

      {tab === "profile" && (
        <ProfileTab
          areas={areas}
          totalKnowledge={totalKnowledge}
          onOpenChat={onOpenChat}
          onOpenSources={openSources}
          setToast={setToast}
          activeId={activeAreaId}
          setActiveId={setActiveAreaId}
          filter={filter}
          setFilter={setFilter}
          searchQuery={hideChrome ? "" : (searchOpen ? searchQuery : "")}
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