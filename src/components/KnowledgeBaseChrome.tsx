import {
  Button,
  CheckboxChips,
  EComponentColors,
  FieldSearch,
  Icon,
  RadioChips,
  Text,
  Title,
} from '@sber-orm/ui-kit';
import { lazy, type RefObject, Suspense, useState } from 'react';
import i18n from '@/i18n/config';
import type { UniversalArea } from '@/types/universalKnowledge';
import { CircularProgress } from './CircularProgress';
import styles from './KnowledgeBaseChrome.module.scss';
import type { KnowledgeFilter } from './KnowledgeProfileView';
import { profileCoverage, toneForPercent } from './knowledgeBaseViewModel';

const LazyKnowledgeInsightDrawer = lazy(() =>
  import('./KnowledgeInsightDrawer').then(({ KnowledgeInsightDrawer }) => ({
    default: KnowledgeInsightDrawer,
  })),
);

export type KnowledgeTab = 'profile' | 'docs' | 'methodology';

const KNOWLEDGE_TABS: { id: KnowledgeTab; title: string }[] = [
  { id: 'profile', title: i18n.t('knowledgeBase.profileTab') },
  { id: 'docs', title: i18n.t('knowledgeBase.documentsTab') },
  { id: 'methodology', title: i18n.t('knowledgeBase.methodologyTab') },
];

function isKnowledgeTab(value: unknown): value is KnowledgeTab {
  return KNOWLEDGE_TABS.some((tab) => tab.id === value);
}

function isKnowledgeFilter(value: unknown): value is KnowledgeFilter {
  return ['all', 'lowKnowledge', 'needsUpdate'].includes(String(value));
}

interface ChromeMetrics {
  areas: UniversalArea[];
  totalKnowledge: number;
  lowCount: number;
  updateCount: number;
}

interface ChromeNavigation {
  tab: KnowledgeTab;
  filter: KnowledgeFilter;
  onTabChange: (tab: KnowledgeTab) => void;
  onFilterChange: (filter: KnowledgeFilter) => void;
}

interface ChromeSearch {
  open: boolean;
  query: string;
  inputRef: RefObject<HTMLInputElement | null>;
  toggleRef: RefObject<HTMLButtonElement>;
  onToggle: () => void;
  onChange: (query: string) => void;
}

function IndexWidget({
  areas,
  totalKnowledge,
  onTrainNorm,
}: {
  areas: UniversalArea[];
  totalKnowledge: number;
  onTrainNorm: () => void;
}) {
  const [open, setOpen] = useState(false);
  const coverage = profileCoverage(areas);
  const tone = toneForPercent(coverage.percent);

  return (
    <>
      <section
        className={styles.indexWidget}
        aria-labelledby='knowledge-profile-banner-title'
      >
        <div className={styles.agentMark} aria-hidden>
          <Icon name='assistantGradient' width={80} height={80} />
        </div>
        <div className={styles.indexPanel}>
          <div className={styles.indexContent}>
            <div className={styles.indexText}>
              <div
                id='knowledge-profile-banner-title'
                className={styles.indexTitle}
              >
                {i18n.t('knowledgeBase.profileBannerTitle', {
                  percent: coverage.percent,
                })}
              </div>
              <div className={styles.indexDescription}>
                {i18n.t('knowledgeBase.profileBannerDescription', {
                  areas: coverage.areasTotal,
                  knowledge: totalKnowledge,
                  status: coverage.status,
                })}
              </div>
            </div>
            <div className={styles.indexActions}>
              <Button
                type='button'
                variant='function'
                link
                size='XS'
                icon='generateGradient'
                onClick={onTrainNorm}
              >
                {i18n.t('knowledgeBase.improveProfile')}
              </Button>
              <Button
                type='button'
                variant='function'
                link
                size='XS'
                iconAfter='nextLarge'
                onClick={() => setOpen(true)}
              >
                {i18n.t('knowledgeBase.companyInsightTitle')}
              </Button>
            </div>
          </div>
          <div className={styles.indexSummary}>
            <CircularProgress
              value={coverage.percent}
              size={88}
              thickness={8}
              variant={
                tone === 'ok'
                  ? 'success'
                  : tone === 'warn'
                    ? 'warning'
                    : 'danger'
              }
            />
          </div>
        </div>
      </section>
      {open && (
        <Suspense fallback={null}>
          <LazyKnowledgeInsightDrawer
            title={i18n.t('knowledgeBase.companyInsightTitle')}
            percent={coverage.percent}
            status={coverage.status}
            insight={undefined}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}

export function KnowledgeBaseChrome({
  metrics,
  navigation,
  search,
  onTrainNorm,
}: {
  metrics: ChromeMetrics;
  navigation: ChromeNavigation;
  search: ChromeSearch;
  onTrainNorm: () => void;
}) {
  const filterItems = [
    {
      id: 'all',
      title: i18n.t('knowledgeBase.all'),
      counter: metrics.areas.length,
      color: EComponentColors.blue,
    },
    {
      id: 'lowKnowledge',
      title: i18n.t('knowledgeBase.lowKnowledge'),
      counter: metrics.lowCount,
      color: EComponentColors.yellow,
    },
    {
      id: 'needsUpdate',
      title: i18n.t('knowledgeBase.updateRequired'),
      counter: metrics.updateCount,
      color: EComponentColors.red,
    },
  ].filter(({ counter }) => counter > 0);

  return (
    <>
      <header className={styles.hero}>
        <div className={styles.intro}>
          <div className={styles.title}>
            <Title size='H800'>{i18n.t('knowledgeBase.serviceTitle')}</Title>
          </div>
          <Text size='md' className={styles.description}>
            {i18n.t('knowledgeBase.serviceDescription')}
          </Text>
        </div>
      </header>

      {navigation.tab === 'profile' && (
        <section className={styles.indexGroup}>
          <IndexWidget
            areas={metrics.areas}
            totalKnowledge={metrics.totalKnowledge}
            onTrainNorm={onTrainNorm}
          />
        </section>
      )}

      <div className={styles.controls}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <RadioChips
              value={navigation.tab}
              items={KNOWLEDGE_TABS}
              kind='primary'
              color='gray'
              onChange={(id) => {
                if (isKnowledgeTab(id)) {
                  navigation.onTabChange(id);
                }
              }}
            />
            {navigation.tab === 'profile' && filterItems.length > 0 && (
              <>
                <span className={styles.toolbarDivider} aria-hidden>
                  /
                </span>
                <CheckboxChips
                  value={[navigation.filter]}
                  items={filterItems}
                  kind='primary'
                  onChange={(values) => {
                    const nextFilter =
                      values.find((id) => id !== navigation.filter) ?? 'all';
                    if (isKnowledgeFilter(nextFilter)) {
                      navigation.onFilterChange(nextFilter);
                    }
                  }}
                />
              </>
            )}
          </div>
          <Button
            ref={search.toggleRef}
            type='button'
            variant='tertiary'
            size='S'
            icon='search'
            iconOnly
            aria-label={
              search.open
                ? i18n.t('knowledgeBase.searchClose')
                : i18n.t('knowledgeBase.searchOpen')
            }
            aria-pressed={search.open}
            onClick={search.onToggle}
          />
        </div>
        {search.open && (
          <div className={styles.searchField}>
            <FieldSearch
              inputRef={search.inputRef}
              search={{ value: search.query }}
              handleChange={search.onChange}
              label=''
              placeholder={i18n.t('knowledgeBase.searchPlaceholder')}
              size='M'
              fullWidth
            />
          </div>
        )}
      </div>
    </>
  );
}
