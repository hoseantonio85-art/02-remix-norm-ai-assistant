import { Button, LinearProgress } from '@sber-orm/ui-kit';
import { useTranslation } from 'react-i18next';
import styles from './AreaCoverageCard.module.scss';

export function AreaCoverageCard({
  percent,
  status,
  knowledgeCount,
  signal,
  onOpen,
}: {
  percent: number;
  status: string;
  knowledgeCount: number;
  signal?: { tone: 'conflict' | 'warning' | 'stale'; label: string } | null;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const tone = percent >= 70 ? 'ok' : percent >= 40 ? 'warn' : 'low';
  return (
    <section className={styles.card}>
      <div className={styles.heading}>
        <span className={styles.title} data-tone={tone}>
          {status}
        </span>
        <strong className={styles.percent}>{percent}%</strong>
      </div>
      <div className={styles.meta}>
        <span>
          {t('knowledgeBase.knowledgeCount', { count: knowledgeCount })}
        </span>
        {signal && (
          <>
            <span className={styles.divider} aria-hidden>
              ·
            </span>
            <span className={styles.signals} data-tone={signal.tone}>
              {signal.label}
            </span>
          </>
        )}
      </div>
      <div className={styles.bar}>
        <LinearProgress
          value={percent}
          variant={
            tone === 'ok' ? 'success' : tone === 'warn' ? 'warning' : 'danger'
          }
        />
      </div>
      <Button
        type='button'
        variant='function'
        link
        size='XS'
        iconAfter='nextLarge'
        className={styles.foot}
        onClick={onOpen}
      >
        {t('knowledgeBase.howAreaWorks')}
      </Button>
    </section>
  );
}
