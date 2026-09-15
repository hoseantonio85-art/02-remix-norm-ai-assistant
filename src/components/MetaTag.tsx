import { Badge, EBadgeSize } from '@sber-orm/ui-kit';
import type { ReactNode } from 'react';
import i18n from '@/i18n/config';
import styles from './MetaTag.module.scss';

export function MetaTag({ children }: { children: ReactNode }) {
  return (
    <Badge size={EBadgeSize.xxxs} variant='gray' thin className={styles.root}>
      {children}
    </Badge>
  );
}

export function KnowledgeCountTag({ count }: { count: number }) {
  return <MetaTag>{i18n.t('knowledgeBase.knowledgeCount', { count })}</MetaTag>;
}

export function FactCountTag({ count }: { count: number }) {
  return <MetaTag>{i18n.t('knowledgeBase.factCount', { count })}</MetaTag>;
}

export function SourceCountTag({ count }: { count: number }) {
  return <MetaTag>{i18n.t('knowledgeBase.sourceCount', { count })}</MetaTag>;
}
