import { Button, Icon } from '@sber-orm/ui-kit';
import type { ReactNode } from 'react';
import i18n from '@/i18n/config';
import styles from './SourceDetail.module.scss';
import type { SourceType, UniSource } from './sourceDrawerModel';

function isExternalType(source: UniSource): boolean {
  return ['news', 'law', 'website'].includes(source.type);
}

function ctaLabelFor(type: SourceType): string {
  const labels: Partial<Record<SourceType, string>> = {
    document: i18n.t('sourceDrawer.openDocument'),
    news: i18n.t('sourceDrawer.openNews'),
    law: i18n.t('sourceDrawer.openLaw'),
    website: i18n.t('sourceDrawer.openPage'),
    internal_system: i18n.t('sourceDrawer.openSystem'),
  };
  return labels[type] ?? '';
}

function OpenSourceButton({
  source,
  onExternal,
}: {
  source: UniSource;
  onExternal: (source: UniSource) => void;
}) {
  const label = ctaLabelFor(source.type);
  const href = source.url ?? source.file?.downloadUrl;
  if (source.type === 'state_of_knowledge' || !href || !label) {
    return null;
  }

  if (isExternalType(source) || source.type === 'document') {
    return (
      <a
        className={styles.openLink}
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        onClick={(event) => event.stopPropagation()}
      >
        {label}
        <span className={styles.openLinkIcon} aria-hidden>
          ↗
        </span>
      </a>
    );
  }

  return (
    <Button
      type='button'
      variant='function'
      size='S'
      onClick={(event) => {
        event.stopPropagation();
        onExternal(source);
      }}
    >
      {label}
    </Button>
  );
}

function locationLine(location: UniSource['location']): string | null {
  if (!location) {
    return null;
  }
  const parts: string[] = [];
  if (location.page != null) {
    parts.push(i18n.t('sourceDrawer.page', { value: location.page }));
  }
  if (location.section) {
    parts.push(location.section);
  }
  if (location.article) {
    parts.push(location.article);
  }
  if (location.paragraph) {
    parts.push(location.paragraph);
  }
  if (location.sheet) {
    parts.push(i18n.t('sourceDrawer.sheet', { value: location.sheet }));
  }
  if (location.range) {
    parts.push(i18n.t('sourceDrawer.rows', { value: location.range }));
  }
  if (location.timestamp) {
    parts.push(location.timestamp);
  }
  if (location.recordId) {
    parts.push(i18n.t('sourceDrawer.record', { value: location.recordId }));
  }
  return parts.length ? parts.join(', ') : null;
}

export function sourceHeaderMeta(source: UniSource): string {
  const bits: string[] = [];
  if (source.provider) {
    bits.push(source.provider);
  }
  if (source.domain) {
    bits.push(source.domain);
  }
  if (source.publishedAt) {
    bits.push(source.publishedAt);
  } else if (source.validAt) {
    bits.push(i18n.t('sourceDrawer.validAt', { value: source.validAt }));
  }
  return bits.join(' · ');
}

function SourceBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.block}>
      <div className={styles.label}>{label}</div>
      {children}
    </section>
  );
}

interface SourceDetailProps {
  source: UniSource;
  mode: 'conclusion' | 'knowledge';
  onExternal: (source: UniSource) => void;
  onOpenKnowledge?: (areaId: string, knowledgeId?: string | null) => void;
}

export function SourceDetail({
  source,
  mode,
  onExternal,
  onOpenKnowledge,
}: SourceDetailProps) {
  const location = locationLine(source.location);
  const isGap = source.type === 'state_of_knowledge';
  const targetAreaId = source.targetAreaId;
  const duplicateFileName = source.file?.name.trim() === source.title.trim();

  return (
    <div className={styles.detail}>
      {source.file && !isGap && (
        <div className={styles.file}>
          <Icon name='file' width={22} height={22} aria-hidden />
          <div className={styles.fileBody}>
            {!duplicateFileName && (
              <div className={styles.fileName}>{source.file.name}</div>
            )}
            <div className={styles.fileMeta}>
              {[source.file.format, source.file.size, source.validAt]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <OpenSourceButton source={source} onExternal={onExternal} />
        {source.file?.downloadUrl && !isGap && (
          <a
            className={styles.actionLink}
            href={source.file.downloadUrl}
            download
            onClick={(event) => event.stopPropagation()}
          >
            {i18n.t('sourceDrawer.download')}
          </a>
        )}
        {onOpenKnowledge && targetAreaId && (
          <Button
            type='button'
            variant='function'
            size='S'
            onClick={(event) => {
              event.stopPropagation();
              onOpenKnowledge(targetAreaId, source.targetKnowledgeId ?? null);
            }}
          >
            {i18n.t('sourceDrawer.openKnowledge')}
          </Button>
        )}
      </div>

      <SourceBlock
        label={
          isGap
            ? i18n.t('sourceDrawer.missingData')
            : i18n.t('sourceDrawer.usedFragment')
        }
      >
        {source.quote ? (
          <div className={`${styles.quote} ${isGap ? styles.quoteGap : ''}`}>
            {isGap ? source.quote : `«${source.quote}»`}
          </div>
        ) : (
          <div className={`${styles.quote} ${styles.quoteMuted}`}>
            {i18n.t('sourceDrawer.fragmentMissing')}
          </div>
        )}
      </SourceBlock>

      {location && (
        <SourceBlock label={i18n.t('sourceDrawer.location')}>
          <div className={styles.locator}>{location}</div>
        </SourceBlock>
      )}
      {mode === 'conclusion' && source.supportedClaim && (
        <SourceBlock label={i18n.t('sourceDrawer.supportedClaim')}>
          <div className={`${styles.quote} ${styles.quoteClaim}`}>
            «{source.supportedClaim}»
          </div>
        </SourceBlock>
      )}
      {mode === 'conclusion' && source.relationToConclusion && (
        <SourceBlock label={i18n.t('sourceDrawer.relation')}>
          <div className={styles.relation}>{source.relationToConclusion}</div>
        </SourceBlock>
      )}
    </div>
  );
}
