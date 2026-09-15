import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import i18n from '@/i18n/config';
import type {
  KnowledgeSource,
  KnowledgeSourceReference,
  UniversalArea,
  UniversalKnowledge,
} from '@/types/universalKnowledge';
import styles from './KnowledgeBase.module.scss';
import { KnowledgeBaseChrome, type KnowledgeTab } from './KnowledgeBaseChrome';
import {
  type OpenSources,
  type SourceDrawerTarget,
} from './KnowledgeGroupAccordion';
import {
  type KnowledgeFilter,
  KnowledgeProfileView,
} from './KnowledgeProfileView';
import { coverageForArea } from './knowledgeBaseViewModel';
import {
  resolveSourceSelection,
  withoutSource,
} from './knowledgeSourceSelection';
import { knowledgeSourceToUni } from './sourceDrawerModel';

const LazySourceDrawer = lazy(() =>
  import('./SourceDrawer').then(({ SourceDrawer }) => ({
    default: SourceDrawer,
  })),
);

/* ---------- source-override state ----------
 * Local edits/deletes performed via the sources drawer are held
 * per-knowledge and layered over the normalized data. */

interface SourceOverride {
  sources: KnowledgeSource[];
  evidence: KnowledgeSourceReference[];
}
type Overrides = Record<string, SourceOverride>;

function applyOverrides(
  k: UniversalKnowledge,
  ov?: SourceOverride,
): UniversalKnowledge {
  if (!ov) {
    return k;
  }
  return {
    ...k,
    sources: ov.sources,
    metadata: { ...(k.metadata || {}), sourceEvidence: ov.evidence },
  };
}

/* ---------- toast ---------- */

function KbToast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className={styles.toast}>{message}</div>;
}

/* ---------- main page ---------- */

export default function KnowledgeBase({
  dataset,
  onOpenChat,
  onAreaViewChange,
  rootRequest,
  focus,
}: {
  dataset: {
    label: string;
    fileName: string;
    areas: UniversalArea[];
  };
  onOpenChat?: (q: string) => void;
  onAreaViewChange?: (isOpen: boolean) => void;
  rootRequest?: number;
  focus?: { areaId: string; knowledgeId?: string | null; nonce: number } | null;
}) {
  const [tab, setTab] = useState<KnowledgeTab>('profile');
  const [toast, setToast] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [sourcesFor, setSourcesFor] = useState<{
    knowledgeIds: string[];
    title: string;
    target: SourceDrawerTarget;
  } | null>(null);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [filter, setFilter] = useState<KnowledgeFilter>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSearchOpen(false);
        setSearchQuery('');
        requestAnimationFrame(() => searchToggleRef.current?.focus());
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [searchOpen]);

  useEffect(() => {
    onAreaViewChange?.(activeAreaId !== null && tab === 'profile');
  }, [activeAreaId, tab, onAreaViewChange]);

  useEffect(() => {
    return () => {
      onAreaViewChange?.(false);
    };
  }, [onAreaViewChange]);

  useEffect(() => {
    if (rootRequest === undefined) {
      return;
    }
    setActiveAreaId(null);
    setTab('profile');
  }, [rootRequest]);

  const [flashKnowledgeId, setFlashKnowledgeId] = useState<string | null>(null);
  useEffect(() => {
    if (!focus) {
      return;
    }
    setTab('profile');
    setActiveAreaId(focus.areaId);
    if (focus.knowledgeId) {
      setFlashKnowledgeId(focus.knowledgeId);
      const t = setTimeout(() => setFlashKnowledgeId(null), 2400);
      return () => clearTimeout(t);
    }
  }, [focus?.nonce]);

  useEffect(() => {
    if (activeAreaId && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [activeAreaId]);

  const baseAreas = dataset.areas;
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

  const openSources: OpenSources = (
    knowledge,
    target = 'list',
    knowledgeIds = [knowledge.id],
  ) => {
    setSourcesFor({ knowledgeIds, title: knowledge.title, target });
  };

  // Whenever overrides change, refresh the open drawer's knowledge snapshot.
  const drawerKnowledge = useMemo(() => {
    if (!sourcesFor) {
      return null;
    }
    return resolveSourceSelection(
      areas.flatMap((area) => area.knowledge),
      sourcesFor.knowledgeIds,
      sourcesFor.title,
    );
  }, [sourcesFor, areas]);

  const deleteSource = (sourceId: string) => {
    if (!sourcesFor) {
      return;
    }
    setOverrides((prev) => {
      const next = { ...prev };
      for (const knowledge of baseAreas.flatMap((area) => area.knowledge)) {
        if (sourcesFor.knowledgeIds.includes(knowledge.id)) {
          next[knowledge.id] = withoutSource(
            applyOverrides(knowledge, prev[knowledge.id]),
            sourceId,
          );
        }
      }
      return next;
    });
  };

  const hideChrome = tab === 'profile' && activeAreaId !== null;
  const lowCount = areas.filter(
    (a) => coverageForArea(a).needsKnowledge,
  ).length;
  const updCount = areas.filter((a) => coverageForArea(a).needsUpdate).length;

  const toggleSearch = () => {
    setSearchOpen((v) => {
      const next = !v;
      if (!next) {
        setSearchQuery('');
      }
      return next;
    });
  };

  return (
    <div
      data-knowledge-area-open={hideChrome}
      className={`${styles.root} ${
        hideChrome ? styles.areaOpen : styles.pageContainer
      }`}
    >
      {!hideChrome && (
        <>
          <KnowledgeBaseChrome
            metrics={{
              areas,
              totalKnowledge,
              lowCount,
              updateCount: updCount,
            }}
            navigation={{
              tab,
              filter,
              onTabChange: setTab,
              onFilterChange: setFilter,
            }}
            search={{
              open: searchOpen,
              query: searchQuery,
              inputRef: searchInputRef,
              toggleRef: searchToggleRef,
              onToggle: toggleSearch,
              onChange: setSearchQuery,
            }}
            onTrainNorm={() => {
              if (onOpenChat) {
                onOpenChat(i18n.t('knowledgeBase.profileTrainPrompt'));
              } else {
                setTab('docs');
              }
            }}
          />
        </>
      )}

      {tab === 'profile' && (
        <KnowledgeProfileView
          areas={areas}
          onOpenChat={onOpenChat}
          onOpenSources={openSources}
          activeId={activeAreaId}
          setActiveId={setActiveAreaId}
          filter={filter}
          searchQuery={hideChrome ? '' : searchOpen ? searchQuery : ''}
          flashKnowledgeId={flashKnowledgeId}
        />
      )}
      {tab === 'docs' && (
        <div className={styles.placeholder}>
          {i18n.t('knowledgeBase.documentsPlaceholder')}
        </div>
      )}
      {tab === 'methodology' && (
        <div className={styles.placeholder}>
          {i18n.t('knowledgeBase.methodologyPlaceholder')}
        </div>
      )}

      {drawerKnowledge && (
        <KbSourcesDrawer
          key={`${drawerKnowledge.id}:${sourcesFor?.target ?? 'list'}`}
          knowledge={drawerKnowledge}
          initialTarget={sourcesFor?.target ?? 'list'}
          onClose={() => setSourcesFor(null)}
          onDeleteSource={deleteSource}
          onToast={(m) => setToast(m)}
        />
      )}

      {toast && <KbToast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

function KbSourcesDrawer({
  knowledge,
  initialTarget,
  onClose,
  onDeleteSource,
  onToast,
}: {
  knowledge: UniversalKnowledge;
  initialTarget: SourceDrawerTarget;
  onClose: () => void;
  onDeleteSource: (id: string) => void;
  onToast: (m: string) => void;
}) {
  const sources = knowledge.sources || [];
  const evidence = knowledge.metadata?.sourceEvidence || [];
  const uniSources = useMemo(
    () =>
      sources.map((s) =>
        knowledgeSourceToUni(
          s,
          evidence.find((e) => e.sourceId === s.id),
        ),
      ),
    [sources, evidence],
  );
  const initial: string | 'list' | null =
    initialTarget === 'list'
      ? 'list'
      : uniSources.some((source) => source.id === initialTarget)
        ? initialTarget
        : uniSources.length === 1
          ? uniSources[0].id
          : 'list';
  const [activeId, setActiveId] = useState<string | 'list' | null>(initial);

  return (
    <Suspense fallback={null}>
      <LazySourceDrawer
        sources={uniSources}
        activeId={activeId}
        mode='knowledge'
        listTitle={i18n.t('knowledgeBase.sourcesTitle')}
        placement='viewport'
        onOpen={(id) => setActiveId(id)}
        onClose={onClose}
        editable
        onDelete={(s) => {
          onDeleteSource(s.id);
          onToast(i18n.t('knowledgeBase.sourceRemoved'));
          setActiveId('list');
        }}
        onExternal={(s) => {
          if (s.url) {
            window.open(s.url, '_blank', 'noopener,noreferrer');
          } else if (s.file?.downloadUrl) {
            window.open(s.file.downloadUrl, '_blank', 'noopener,noreferrer');
          } else {
            onToast(i18n.t('knowledgeBase.sourceOpenUnavailable'));
          }
        }}
      />
    </Suspense>
  );
}
