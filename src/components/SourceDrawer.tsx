import { Drawer } from '@sber-orm/components';
import { Button, Title } from '@sber-orm/ui-kit';
import i18n from '@/i18n/config';
import { SourceDetail, sourceHeaderMeta } from './SourceDetail';
import styles from './SourceDrawer.module.scss';
import type { UniSource } from './sourceDrawerModel';
import { useAccessibleDrawer } from './useAccessibleDrawer';

export type {
  FocusSourceLike,
  SourceType,
  UniSource,
} from './sourceDrawerModel';
export { focusSourceToUni, knowledgeSourceToUni } from './sourceDrawerModel';

export interface SourceDrawerProps {
  sources: UniSource[];
  activeId: string | 'list' | null;
  mode: 'conclusion' | 'knowledge';
  listTitle?: string;
  onOpen: (id: string | 'list') => void;
  onClose: () => void;
  onExternal?: (source: UniSource) => void;
  editable?: boolean;
  onEdit?: (source: UniSource) => void;
  onDelete?: (source: UniSource) => void;
  placement: 'viewport' | 'modal';
  onOpenKnowledge?: (areaId: string, knowledgeId?: string | null) => void;
}

export function SourceDrawer({
  sources,
  activeId,
  mode,
  listTitle,
  onOpen,
  onClose,
  onExternal,
  editable,
  onEdit,
  onDelete,
  placement,
  onOpenKnowledge,
}: SourceDrawerProps) {
  const heading =
    mode === 'knowledge'
      ? i18n.t('sourceDrawer.knowledgeSources')
      : (listTitle ?? i18n.t('sourceDrawer.conclusionSources'));
  const selected =
    activeId !== null && activeId !== 'list'
      ? (sources.find((source) => source.id === activeId) ?? null)
      : null;
  const dialogTitle = selected
    ? selected.title
    : `${heading} · ${sources.length}`;
  const drawerRef = useAccessibleDrawer(dialogTitle, onClose);

  if (activeId === null) {
    return null;
  }

  const showList =
    activeId === 'list' ||
    (activeId !== 'list' && !sources.some((source) => source.id === activeId));
  const handleExternal =
    onExternal ??
    ((source: UniSource) => {
      const href = source.url ?? source.file?.downloadUrl;
      if (href) {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    });

  return (
    <Drawer
      ref={drawerRef}
      open
      notMountIfClosed
      fullHeight
      headerRevert
      position={placement === 'modal' ? 'absolute' : 'fixed'}
      inModal={placement === 'modal'}
      width={480}
      minWidth={360}
      onClose={onClose}
      footerClasses={styles.footer}
      footer={
        selected && editable && (onEdit || onDelete) ? (
          <div className={styles.footerActions}>
            {onEdit && (
              <Button
                type='button'
                variant='secondary'
                size='S'
                onClick={() => onEdit(selected)}
              >
                {i18n.t('sourceDrawer.edit')}
              </Button>
            )}
            {onDelete && (
              <Button
                type='button'
                variant='danger'
                size='S'
                onClick={() => onDelete(selected)}
              >
                {i18n.t('sourceDrawer.delete')}
              </Button>
            )}
          </div>
        ) : undefined
      }
      title={
        <div className={styles.heading}>
          <Title size='H700'>{dialogTitle}</Title>
        </div>
      }
    >
      <div className={styles.body}>
        {selected && sources.length > 1 && (
          <Button
            type='button'
            variant='ghost'
            size='XS'
            icon='previousLarge'
            className={styles.back}
            onClick={() => onOpen('list')}
          >
            {i18n.t('sourceDrawer.backToList')}
          </Button>
        )}
        {selected && (
          <div className={styles.context}>
            <div className={styles.type}>{selected.typeLabel}</div>
            {sourceHeaderMeta(selected) && (
              <div className={styles.submeta}>{sourceHeaderMeta(selected)}</div>
            )}
          </div>
        )}
        {selected ? (
          <SourceDetail
            source={selected}
            mode={mode}
            onExternal={handleExternal}
            onOpenKnowledge={onOpenKnowledge}
          />
        ) : showList ? (
          <SourceList sources={sources} onOpen={onOpen} />
        ) : null}
      </div>
    </Drawer>
  );
}

function SourceList({
  sources,
  onOpen,
}: {
  sources: UniSource[];
  onOpen: (id: string | 'list') => void;
}) {
  return (
    <ul className={styles.list}>
      {sources.map((source) => {
        const meta = sourceHeaderMeta(source);
        return (
          <li key={source.id}>
            <button
              type='button'
              className={styles.listItem}
              onClick={() => onOpen(source.id)}
            >
              <span className={styles.listMain}>
                <span className={styles.listType}>{source.typeLabel}</span>
                <span className={styles.listTitle}>{source.title}</span>
                {meta && <span className={styles.listMeta}>{meta}</span>}
              </span>
              <span className={styles.listChevron} aria-hidden>
                →
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
