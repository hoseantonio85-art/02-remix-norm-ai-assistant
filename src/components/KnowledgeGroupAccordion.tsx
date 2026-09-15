import { Alert, Badge, EBadgeSize, Icon } from '@sber-orm/ui-kit';
import { useEffect, useId, useRef, useState } from 'react';
import i18n from '@/i18n/config';
import type { KnowledgePresentationGroup } from '@/presentation/knowledgePresentation';
import type { UniversalKnowledge } from '@/types/universalKnowledge';
import styles from './KnowledgeGroupAccordion.module.scss';
import { formatRuDate, pickBadge } from './knowledgeBaseViewModel';
import { combineKnowledgeSources } from './knowledgeSourceSelection';
import { FactCountTag } from './MetaTag';
import { SourceTags } from './SourceTags';
import { UniversalValueRenderer } from './UniversalValueRenderer';

export type SourceDrawerTarget = string | 'list';
export type OpenSources = (
  knowledge: UniversalKnowledge,
  target?: SourceDrawerTarget,
  knowledgeIds?: string[],
) => void;

function badgeVariant(tone: 'warn' | 'low' | 'neutral') {
  if (tone === 'warn') {
    return 'yellow' as const;
  }
  if (tone === 'low') {
    return 'red' as const;
  }
  return 'gray' as const;
}

function alertStatus(severity: string) {
  if (['danger', 'error', 'critical'].includes(severity)) {
    return 'danger' as const;
  }
  if (['warning', 'warn'].includes(severity)) {
    return 'warning' as const;
  }
  if (['success', 'positive'].includes(severity)) {
    return 'success' as const;
  }
  return 'info' as const;
}

function sourceKnowledgeForGroup(
  group: KnowledgePresentationGroup,
): UniversalKnowledge {
  return combineKnowledgeSources(group.knowledge, group.title)!;
}

export function KnowledgeGroupAccordion({
  group,
  defaultOpen,
  onOpenSources,
  onOpenChat,
  flashKnowledgeId,
}: {
  group: KnowledgePresentationGroup;
  defaultOpen?: boolean;
  onOpenSources: OpenSources;
  onOpenChat?: (question: string) => void;
  flashKnowledgeId?: string | null;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const contentId = useId();
  const ref = useRef<HTMLElement | null>(null);
  const focused =
    !!flashKnowledgeId &&
    group.knowledge.some((knowledge) => knowledge.id === flashKnowledgeId);
  const sourceKnowledge = sourceKnowledgeForGroup(group);
  const badgeKnowledge = group.knowledge.find((knowledge) =>
    pickBadge(knowledge),
  );
  const badge = badgeKnowledge ? pickBadge(badgeKnowledge) : null;
  const actualDates = group.knowledge
    .map((knowledge) => knowledge.metadata?.actualAt)
    .filter((value): value is string => !!value);
  const commonActualAt =
    actualDates.length > 0 && new Set(actualDates).size === 1
      ? formatRuDate(actualDates[0])
      : null;

  useEffect(() => {
    if (!focused) {
      return;
    }
    setOpen(true);
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(
        `[data-knowledge-id="${flashKnowledgeId}"]`,
      );
      (target || ref.current)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }, [flashKnowledgeId, focused]);

  return (
    <article
      ref={ref}
      data-presentation-group-id={group.id}
      className={styles.accordion}
    >
      <div className={styles.header}>
        <button
          type='button'
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((current) => !current)}
        >
          <div className={styles.main}>
            <div className={styles.titleLine}>
              <span className={styles.title}>{group.title}</span>
              <FactCountTag count={group.knowledge.length} />
              {badge && (
                <Badge
                  size={EBadgeSize.xxxs}
                  variant={badgeVariant(badge.tone)}
                  thin
                >
                  {badge.label}
                </Badge>
              )}
            </div>
            {group.description && (
              <div className={styles.summary}>{group.description}</div>
            )}
          </div>
          <span
            className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
            aria-hidden
          >
            <Icon name='nextLarge' width={18} height={18} />
          </span>
        </button>
        <div className={styles.meta}>
          <SourceTags
            sources={sourceKnowledge.sources || []}
            evidence={sourceKnowledge.metadata?.sourceEvidence || []}
            actualAt={
              commonActualAt
                ? i18n.t('knowledgeBase.dataAt', { date: commonActualAt })
                : undefined
            }
            onOpen={(target) =>
              onOpenSources(
                sourceKnowledge,
                target,
                group.knowledge.map((knowledge) => knowledge.id),
              )
            }
          />
        </div>
      </div>

      {open && (
        <div id={contentId} className={styles.body}>
          {group.knowledge.map((knowledge) => {
            const factBadge = pickBadge(knowledge);
            const composite = ['object', 'array', 'text'].includes(
              knowledge.content.valueType,
            );
            return (
              <div
                key={knowledge.id}
                data-knowledge-id={knowledge.id}
                className={`${styles.fact} ${composite ? styles.factComposite : ''} ${flashKnowledgeId === knowledge.id ? styles.focusedFact : ''}`}
              >
                <div className={styles.factLabel}>
                  <span>{knowledge.title}</span>
                  {factBadge && (
                    <Badge
                      size={EBadgeSize.xxxs}
                      variant={badgeVariant(factBadge.tone)}
                      thin
                    >
                      {factBadge.label}
                    </Badge>
                  )}
                </div>
                <div className={styles.factValue}>
                  <UniversalValueRenderer
                    node={knowledge.content}
                    parentTitle={knowledge.title}
                  />
                </div>
                {knowledge.alerts && knowledge.alerts.length > 0 && (
                  <div className={styles.factAlerts}>
                    {knowledge.alerts.map((alert) => (
                      <Alert
                        key={alert.id}
                        status={alertStatus(alert.severity)}
                        message={alert.message}
                        actions={
                          alert.action
                            ? [
                                {
                                  title: alert.action.label,
                                  onClick: () => {
                                    if (
                                      alert.action?.type === 'open_chat' &&
                                      onOpenChat
                                    ) {
                                      onOpenChat(alert.action.label);
                                    } else {
                                      onOpenSources(knowledge, 'list');
                                    }
                                  },
                                },
                              ]
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
