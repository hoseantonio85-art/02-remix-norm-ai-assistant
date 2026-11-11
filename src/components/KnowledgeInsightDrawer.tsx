import { Drawer } from '@sber-orm/components';
import { Title } from '@sber-orm/ui-kit';
import { useTranslation } from 'react-i18next';
import type { AreaInsight, ProfileInsight } from '@/data/profile_insights';
import { CoverageRing } from './CoverageRing';
import styles from './KnowledgeInsightDrawer.module.scss';
import { useAccessibleDrawer } from './useAccessibleDrawer';

export function KnowledgeInsightDrawer({
  title,
  percent,
  status,
  insight,
  onClose,
}: {
  title: string;
  percent: number;
  status: string;
  insight: AreaInsight | ProfileInsight | undefined;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const fallback = t('insightDrawer.fallback');
  const drawerRef = useAccessibleDrawer(title, onClose);

  return (
    <Drawer
      ref={drawerRef}
      open
      notMountIfClosed
      fullHeight
      headerRevert
      width={550}
      minWidth={360}
      title={<Title size='H700'>{title}</Title>}
      onClose={onClose}
    >
      <div className={styles.body}>
        <div className={styles.overview}>
          <div className={styles.eyebrow}>{t('knowledgeBase.indexTitle')}</div>
          <div className={styles.metrics}>
            <CoverageRing percent={percent} size={56} />
            <div className={styles.metricsStatus}>{status}</div>
          </div>
          <p className={styles.summary}>{insight?.summary || fallback}</p>
        </div>
        {insight?.importantSignals && insight.importantSignals.length > 0 && (
          <section className={styles.section}>
            <Title size='H500'>{t('insightDrawer.importantSignals')}</Title>
            <ul className={styles.signals}>
              {insight.importantSignals.slice(0, 3).map((s) => (
                <li key={s.id} className={styles.signal} data-tone={s.type}>
                  <div className={styles.signalTitle}>{s.title}</div>
                  <div className={styles.signalText}>{s.text}</div>
                  {s.riskEffect && (
                    <div className={styles.signalEffect}>
                      {t('insightDrawer.mayAffect', { effect: s.riskEffect })}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
        {insight?.observations && insight.observations.length > 0 && (
          <section className={styles.section}>
            <Title size='H500'>{t('insightDrawer.observations')}</Title>
            <ul className={styles.list}>
              {insight.observations.slice(0, 5).map((o, i) => (
                <li key={i}>{o.text}</li>
              ))}
            </ul>
          </section>
        )}
        {insight?.conclusions && insight.conclusions.length > 0 && (
          <section className={styles.section}>
            <Title size='H500'>{t('insightDrawer.conclusions')}</Title>
            <ul className={styles.list}>
              {insight.conclusions.slice(0, 5).map((c, i) => (
                <li key={i}>{c.text}</li>
              ))}
            </ul>
          </section>
        )}
        {insight?.riskImpacts && insight.riskImpacts.length > 0 && (
          <section className={styles.section}>
            <Title size='H500'>{t('insightDrawer.riskImpact')}</Title>
            <ul className={styles.risks}>
              {insight.riskImpacts.slice(0, 6).map((r, i) => (
                <li key={i}>
                  <div className={styles.riskArea}>{r.area}</div>
                  <div className={styles.riskExplanation}>{r.explanation}</div>
                </li>
              ))}
            </ul>
          </section>
        )}
        {insight?.blindSpots && insight.blindSpots.length > 0 && (
          <section className={styles.section}>
            <Title size='H500'>{t('insightDrawer.blindSpots')}</Title>
            <ul className={styles.list}>
              {insight.blindSpots.slice(0, 5).map((b, i) => (
                <li key={i}>{b.text}</li>
              ))}
            </ul>
          </section>
        )}
        {!insight && (
          <section className={styles.section}>
            <p className={styles.muted}>{fallback}</p>
          </section>
        )}
      </div>
    </Drawer>
  );
}
