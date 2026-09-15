import { Badge, Button, EBadgeSize, Title } from '@sber-orm/ui-kit';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import i18n from '@/i18n/config';
import { composeKnowledgePresentation } from '@/presentation/knowledgePresentation';
import type { UniversalArea } from '@/types/universalKnowledge';
import { AreaCoverageCard } from './AreaCoverageCard';
import { CoverageRing } from './CoverageRing';
import {
  KnowledgeGroupAccordion,
  type OpenSources,
} from './KnowledgeGroupAccordion';
import styles from './KnowledgeProfileView.module.scss';
import {
  type AreaCoverage,
  type CoverageRecommendation,
  coverageForArea,
  toneForPercent,
} from './knowledgeBaseViewModel';
import { KnowledgeCountTag, SourceCountTag } from './MetaTag';

const LazyKnowledgeInsightDrawer = lazy(() =>
  import('./KnowledgeInsightDrawer').then(({ KnowledgeInsightDrawer }) => ({
    default: KnowledgeInsightDrawer,
  })),
);

export type KnowledgeFilter = 'all' | 'lowKnowledge' | 'needsUpdate';

function uniqueSourceCount(area: UniversalArea): number {
  const sourceIds = new Set<string>();
  for (const knowledge of area.knowledge) {
    for (const source of knowledge.sources || []) {
      sourceIds.add(source.id);
    }
  }
  return sourceIds.size;
}

function AreaCard({
  area,
  onOpen,
}: {
  area: UniversalArea;
  onOpen: () => void;
}) {
  const coverage = coverageForArea(area);
  const tone = toneForPercent(coverage.percent);
  const sourceCount = uniqueSourceCount(area);

  return (
    <button type='button' className={styles.areaCard} onClick={onOpen}>
      <div className={styles.cardTop}>
        <div className={styles.cardTitle}>
          <span className={styles.cardHeading}>{area.title}</span>
          <div className={styles.cardStateRow}>
            <span className={styles.cardStatus} data-tone={tone}>
              {coverage.status}
            </span>
          </div>
        </div>
        <CoverageRing percent={coverage.percent} size={46} />
      </div>
      {area.description && (
        <p className={styles.cardInsight}>{area.description}</p>
      )}
      <div className={styles.cardTags}>
        <KnowledgeCountTag count={area.knowledge.length} />
        <SourceCountTag count={sourceCount} />
      </div>
    </button>
  );
}

function ImproveBlock({
  coverage,
  onRecommendation,
}: {
  coverage: AreaCoverage | undefined;
  onRecommendation: (recommendation: CoverageRecommendation) => void;
}) {
  return (
    <div className={`${styles.sideCard} ${styles.improve}`}>
      <Title size='H500'>{i18n.t('knowledgeBase.recommendationsTitle')}</Title>
      <ul className={styles.improveList}>
        {(coverage?.recommendations ?? []).map((recommendation) => (
          <li key={recommendation.id}>
            <Button
              type='button'
              variant='function'
              link
              size='XS'
              className={styles.improveAction}
              onClick={() => onRecommendation(recommendation)}
            >
              <span className={styles.improveTitle}>
                {recommendation.title}
              </span>
              <span className={styles.improveWhy}>
                {recommendation.description}
              </span>
              <span className={styles.improveChevron} aria-hidden>
                ›
              </span>
            </Button>
          </li>
        ))}
        {(!coverage || coverage.recommendations.length === 0) && (
          <li className={styles.muted}>
            {i18n.t('knowledgeBase.noRecommendations')}
          </li>
        )}
      </ul>
    </div>
  );
}

function AreaView({
  area,
  areas,
  onSelect,
  onBack,
  onOpenChat,
  onOpenSources,
  flashKnowledgeId,
}: {
  area: UniversalArea;
  areas: UniversalArea[];
  onSelect: (id: string) => void;
  onBack: () => void;
  onOpenChat?: (question: string) => void;
  onOpenSources: OpenSources;
  flashKnowledgeId?: string | null;
}) {
  const coverage = coverageForArea(area);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    stageRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [area.id]);
  const presentationGroups = useMemo(
    () => composeKnowledgePresentation(area),
    [area],
  );

  const handleRecommendation = (recommendation: CoverageRecommendation) => {
    onOpenChat?.(recommendation.chatPrompt);
  };

  return (
    <div className={styles.areaScreen}>
      <aside
        className={styles.profileRail}
        aria-labelledby='profile-areas-title'
      >
        <h2 className={styles.railTitle} id='profile-areas-title'>
          {i18n.t('knowledgeBase.profileAreas')}
        </h2>
        <nav className={styles.railList} aria-labelledby='profile-areas-title'>
          {areas.map((profileArea) => {
            const isActive = profileArea.id === area.id;
            const percent = coverageForArea(profileArea).percent;
            const tone = toneForPercent(percent);
            return (
              <button
                type='button'
                key={profileArea.id}
                className={`${styles.railItem} ${isActive ? styles.railItemActive : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelect(profileArea.id)}
              >
                <div className={styles.railRow}>
                  <div className={styles.railName}>{profileArea.title}</div>
                  <Badge
                    size={EBadgeSize.xxxs}
                    variant={
                      tone === 'ok'
                        ? 'green'
                        : tone === 'warn'
                          ? 'yellow'
                          : 'red'
                    }
                    thin
                    className={styles.railPercent}
                  >
                    {percent}%
                  </Badge>
                </div>
                {profileArea.description && (
                  <p className={styles.railDescription}>
                    {profileArea.description}
                  </p>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      <div ref={stageRef} className={styles.areaStage}>
        <div className={styles.areaContainer}>
          <header className={styles.workHeader}>
            <Button
              type='button'
              variant='ellipse'
              size='S'
              icon='previousLarge'
              iconOnly
              onClick={onBack}
              aria-label={i18n.t('knowledgeBase.backToProfile')}
            />
            <div className={styles.workHeaderText}>
              <Title size='H800'>{area.title}</Title>
              {area.description && (
                <p className={styles.workHeaderDescription}>
                  {area.description}
                </p>
              )}
            </div>
          </header>

          <div className={styles.areaContent}>
            <div className={styles.areaKnowledge}>
              <div className={styles.knowledgeStack}>
                {presentationGroups.map((group, index) => (
                  <KnowledgeGroupAccordion
                    key={group.id}
                    group={group}
                    defaultOpen={index === 0}
                    onOpenSources={onOpenSources}
                    onOpenChat={onOpenChat}
                    flashKnowledgeId={flashKnowledgeId}
                  />
                ))}
                {presentationGroups.length === 0 && (
                  <div className={styles.empty}>
                    {i18n.t('knowledgeBase.emptyArea')}
                  </div>
                )}
              </div>
            </div>

            <aside className={styles.areaRight}>
              <AreaCoverageCard
                percent={coverage.percent}
                status={coverage.status}
                knowledgeCount={area.knowledge.length}
                signal={null}
                onOpen={() => setDrawerOpen(true)}
              />
              <ImproveBlock
                coverage={coverage}
                onRecommendation={handleRecommendation}
              />
            </aside>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <Suspense fallback={null}>
          <LazyKnowledgeInsightDrawer
            title={i18n.t('knowledgeBase.areaInsightTitle', {
              area: area.title,
            })}
            percent={coverage.percent}
            status={coverage.status}
            insight={undefined}
            onClose={() => setDrawerOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

export function KnowledgeProfileView({
  areas,
  onOpenChat,
  onOpenSources,
  activeId,
  setActiveId,
  filter,
  searchQuery,
  flashKnowledgeId,
}: {
  areas: UniversalArea[];
  onOpenChat?: (question: string) => void;
  onOpenSources: OpenSources;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  filter: KnowledgeFilter;
  searchQuery: string;
  flashKnowledgeId?: string | null;
}) {
  const activeArea = activeId
    ? (areas.find((area) => area.id === activeId) ?? null)
    : null;

  if (activeArea) {
    return (
      <AreaView
        area={activeArea}
        areas={areas}
        onSelect={setActiveId}
        onBack={() => setActiveId(null)}
        onOpenChat={onOpenChat}
        onOpenSources={onOpenSources}
        flashKnowledgeId={flashKnowledgeId}
      />
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const filteredAreas = areas.filter((area) => {
    const coverage = coverageForArea(area);
    if (filter === 'lowKnowledge' && !coverage.needsKnowledge) {
      return false;
    }
    if (filter === 'needsUpdate' && !coverage.needsUpdate) {
      return false;
    }
    if (!query) {
      return true;
    }
    const searchableValues = [
      area.title,
      area.description || '',
      coverage.status,
      ...area.knowledge.flatMap((knowledge) => [
        knowledge.title,
        ...(knowledge.sources || []).map(
          (source) => source.name || source.documentName || source.id,
        ),
      ]),
    ];
    return searchableValues.some((value) =>
      value.toLowerCase().includes(query),
    );
  });

  return (
    <section className={styles.profileContent}>
      <div className={styles.areaGrid}>
        {filteredAreas.map((area) => (
          <AreaCard
            key={area.id}
            area={area}
            onOpen={() => setActiveId(area.id)}
          />
        ))}
        {filteredAreas.length === 0 && (
          <div className={styles.empty}>
            {query
              ? i18n.t('knowledgeBase.nothingFound')
              : i18n.t('knowledgeBase.emptyGroup')}
          </div>
        )}
      </div>
    </section>
  );
}
