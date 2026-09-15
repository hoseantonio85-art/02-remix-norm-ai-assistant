import { Badge, Chips, EBadgeSize } from '@sber-orm/ui-kit';
import i18n from '@/i18n/config';
import type {
  KnowledgeSource,
  KnowledgeSourceReference,
} from '@/types/universalKnowledge';
import styles from './SourceTags.module.scss';

function primaryLabel(s: KnowledgeSource): string {
  return s.documentName || s.fileName || s.name;
}

export function pickPrimarySource(
  sources: KnowledgeSource[],
  evidence?: KnowledgeSourceReference[] | null,
): KnowledgeSource | null {
  if (!sources || sources.length === 0) {
    return null;
  }
  const ev = (evidence || []).find((e) => !!e.sourceId);
  if (ev) {
    const found = sources.find((s) => s.id === ev.sourceId);
    if (found) {
      return found;
    }
  }
  return sources[0];
}

export function SourceTags({
  sources,
  evidence,
  actualAt,
  onOpen,
}: {
  sources: KnowledgeSource[];
  evidence?: KnowledgeSourceReference[] | null;
  actualAt?: string | null;
  onOpen: (target: string | 'list') => void;
}) {
  const primary = pickPrimarySource(sources, evidence);
  const rest = primary ? sources.length - 1 : 0;

  return (
    <div className={styles.root}>
      {primary ? (
        <>
          <Chips
            item={{ id: primary.id, title: primaryLabel(primary) }}
            size='XS'
            variant='outline'
            nowrap
            onChange={(id) => onOpen(id)}
          />
          {rest > 0 && (
            <Chips
              item={{ id: 'more', title: `+${rest}` }}
              size='XS'
              variant='outline'
              onChange={() => onOpen('list')}
            />
          )}
        </>
      ) : (
        <Badge size={EBadgeSize.xxxs} variant='gray' thin>
          {i18n.t('knowledgeBase.sourceUnknown')}
        </Badge>
      )}
      {actualAt && <span className={styles.actualAt}>{actualAt}</span>}
    </div>
  );
}
