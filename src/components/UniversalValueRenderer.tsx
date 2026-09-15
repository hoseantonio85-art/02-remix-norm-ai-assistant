import { Alert, Badge, Button, EBadgeSize } from '@sber-orm/ui-kit';
import { useState } from 'react';
import i18n from '@/i18n/config';
import type {
  KnowledgeMetadata,
  KnowledgeNode,
} from '@/types/universalKnowledge';
import styles from './UniversalValueRenderer.module.scss';
import { formatNodeValue } from './universalValueFormatters';
import {
  getPrimaryNodeBadge,
  hasDistinctAtomicMetadata,
  hasOwnValue,
  metadataRows,
  shouldHideNode,
} from './universalValueModel';

export { formatNodeValue } from './universalValueFormatters';
export { getPrimaryNodeBadge, shouldHideNode } from './universalValueModel';

export type RendererCtx = {
  parentTitle?: string | null;
};

export function UniversalValueRenderer({
  node,
  depth = 0,
  parentTitle = null,
  suppressOwnMeta = false,
}: {
  node: KnowledgeNode;
  depth?: number;
  parentTitle?: string | null;
  suppressOwnMeta?: boolean;
}) {
  if (shouldHideNode(node)) {
    return null;
  }
  if (isStateOnly(node)) {
    return <StateNotice node={node} />;
  }
  if (node.valueType === 'object') {
    return (
      <ObjectRenderer
        node={node}
        depth={depth}
        parentTitle={parentTitle}
        suppressOwnMeta={suppressOwnMeta}
      />
    );
  }
  if (node.valueType === 'array') {
    return <ArrayRenderer node={node} depth={depth} />;
  }
  if (node.valueType === 'text') {
    return <TextRenderer node={node} />;
  }
  return <PrimitiveRenderer node={node} />;
}

function isStateOnly(node: KnowledgeNode): boolean {
  const code = node.state?.code;
  if (!code || !['known_empty', 'unknown', 'not_applicable'].includes(code)) {
    return false;
  }
  const visibleChildren = (node.children || []).filter(
    (child) => !shouldHideNode(child),
  );
  return !hasOwnValue(node) && visibleChildren.length === 0;
}

function StateNotice({ node }: { node: KnowledgeNode }) {
  const code = node.state?.code || 'unknown';
  const fallback =
    code === 'known_empty'
      ? i18n.t('universalValue.stateKnownEmpty')
      : code === 'not_applicable'
        ? i18n.t('universalValue.stateNotApplicable')
        : i18n.t('universalValue.stateUnknown');
  const message = node.state?.reason
    ? `${node.state?.label || fallback}. ${node.state.reason}`
    : node.state?.label || fallback;
  const status =
    code === 'known_empty'
      ? ('success' as const)
      : code === 'unknown'
        ? ('warning' as const)
        : ('info' as const);
  return <Alert status={status} message={message} />;
}

function PrimitiveRenderer({ node }: { node: KnowledgeNode }) {
  const text = formatNodeValue(node) || '—';
  const value = node.value == null ? '' : String(node.value);
  const safeUrl = node.valueType === 'url' && /^https?:\/\//i.test(value);
  return (
    <span className={styles.primitive}>
      {safeUrl ? (
        <a
          className={styles.link}
          href={value}
          target='_blank'
          rel='noreferrer'
        >
          {text}
        </a>
      ) : (
        <span className={styles.value}>{text}</span>
      )}
      <NodeMetadata metadata={node.metadata} />
    </span>
  );
}

function NodeBadge({ node }: { node: KnowledgeNode }) {
  const badge = getPrimaryNodeBadge(node);
  if (!badge) {
    return null;
  }
  return (
    <div className={styles.statusRow}>
      <Badge size={EBadgeSize.xxxs} variant={badgeVariant(badge.tone)} thin>
        {badge.label}
      </Badge>
    </div>
  );
}

function badgeVariant(tone: string) {
  if (['positive', 'ok'].includes(tone)) {
    return 'green' as const;
  }
  if (['warning', 'warn'].includes(tone)) {
    return 'yellow' as const;
  }
  if (['negative', 'danger', 'low'].includes(tone)) {
    return 'red' as const;
  }
  return 'gray' as const;
}

function NodeLinks({ node }: { node: KnowledgeNode }) {
  if (!node.links || node.links.length === 0) {
    return null;
  }
  return (
    <div className={styles.links}>
      {node.links.map((link) => (
        <a
          key={`${link.url}:${link.label}`}
          className={styles.link}
          href={link.url}
          target='_blank'
          rel='noreferrer'
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

function NodeMetadata({ metadata }: { metadata?: KnowledgeMetadata | null }) {
  if (!hasDistinctAtomicMetadata(metadata)) {
    return null;
  }
  const rows = metadataRows(metadata);
  if (rows.length === 0) {
    return null;
  }
  return (
    <details className={styles.meta}>
      <summary
        aria-label={i18n.t('universalValue.dataInfo')}
        title={i18n.t('universalValue.dataInfo')}
      >
        <span aria-hidden>i</span>
      </summary>
      <div className={styles.metaPanel}>
        {rows.map(([label, value]) => (
          <div key={label} className={styles.metaRow}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </details>
  );
}

function TextRenderer({ node }: { node: KnowledgeNode }) {
  const [expanded, setExpanded] = useState(false);
  const value = formatNodeValue(node);
  if (!value) {
    return <StateNotice node={node} />;
  }
  const long = value.length > 320;
  return (
    <div className={styles.text}>
      <p
        className={`${styles.textBody} ${long && !expanded ? styles.clamped : ''}`}
      >
        {value}
      </p>
      {long && (
        <Button
          type='button'
          variant='function'
          link
          size='XS'
          className={styles.functionalLink}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded
            ? i18n.t('universalValue.collapse')
            : i18n.t('universalValue.showFull')}
        </Button>
      )}
      <NodeMetadata metadata={node.metadata} />
    </div>
  );
}

function CompositeOwnValue({ node }: { node: KnowledgeNode }) {
  if (!hasOwnValue(node)) {
    return null;
  }
  return (
    <div className={styles.ownValue}>
      <PrimitiveRenderer
        node={{
          ...node,
          valueType:
            node.valueType === 'array' || node.valueType === 'object'
              ? 'string'
              : node.valueType,
          metadata: null,
        }}
      />
    </div>
  );
}

function ObjectRenderer({
  node,
  depth,
  parentTitle,
  suppressOwnMeta,
}: {
  node: KnowledgeNode;
  depth: number;
  parentTitle: string | null;
  suppressOwnMeta?: boolean;
}) {
  const children = (node.children || []).filter(
    (child) => !shouldHideNode(child),
  );
  const badge = suppressOwnMeta ? null : getPrimaryNodeBadge(node);
  const hasMeta =
    !!badge || !!node.links?.length || metadataRows(node.metadata).length > 0;
  if (children.length === 0 && !hasMeta && !hasOwnValue(node)) {
    return null;
  }
  const indentClass = depth >= 2 ? styles.indent : '';

  return (
    <div className={`${styles.object} ${indentClass}`}>
      {!suppressOwnMeta && <NodeBadge node={node} />}
      <CompositeOwnValue node={node} />
      {children.map((child) => {
        const composite =
          child.valueType === 'object' || child.valueType === 'array';
        const longText = child.valueType === 'text';
        const label =
          child.label &&
          child.label !== parentTitle &&
          child.label !== node.label
            ? child.label
            : null;
        if (composite) {
          return (
            <div key={child.id} className={styles.group}>
              {label && <div className={styles.groupTitle}>{label}</div>}
              <UniversalValueRenderer
                node={child}
                depth={depth + 1}
                parentTitle={label}
              />
            </div>
          );
        }
        if (longText) {
          return (
            <div key={child.id} className={styles.block}>
              {label && <div className={styles.blockLabel}>{label}</div>}
              <UniversalValueRenderer node={child} depth={depth + 1} />
            </div>
          );
        }
        return (
          <div key={child.id} className={styles.row}>
            <div className={styles.rowKey}>{label ?? ''}</div>
            <div className={styles.rowValue}>
              <UniversalValueRenderer node={child} depth={depth + 1} />
            </div>
          </div>
        );
      })}
      {!suppressOwnMeta && <NodeMetadata metadata={node.metadata} />}
      <NodeLinks node={node} />
    </div>
  );
}

const ARRAY_LIMIT = 3;

function CollectionStatus({
  node,
  visibleCount,
}: {
  node: KnowledgeNode;
  visibleCount: number;
}) {
  const info = node.collection;
  if (!info) {
    return null;
  }
  const loaded = info.loadedCount ?? (node.children || []).length;
  const total = info.totalCount ?? loaded;
  if (!info.truncated && total === loaded) {
    return null;
  }
  return (
    <div className={styles.collectionStatus}>
      {i18n.t('universalValue.collectionLoaded', { loaded, total })}
      {visibleCount < loaded && (
        <span>
          {' · '}
          {i18n.t('universalValue.collectionVisible', {
            count: visibleCount,
          })}
        </span>
      )}
      {info.truncated && (
        <span> · {i18n.t('universalValue.collectionPartial')}</span>
      )}
      {info.nextCursor && (
        <span> · {i18n.t('universalValue.collectionContinues')}</span>
      )}
    </div>
  );
}

function ArrayRenderer({
  node,
  depth,
}: {
  node: KnowledgeNode;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const children = (node.children || []).filter(
    (child) => !shouldHideNode(child),
  );
  if (children.length === 0 && !hasOwnValue(node)) {
    return <StateNotice node={node} />;
  }
  const visible = expanded ? children : children.slice(0, ARRAY_LIMIT);
  const rest = children.length - ARRAY_LIMIT;
  const allPrimitive = children.every(
    (child) => !['object', 'array', 'text'].includes(child.valueType),
  );

  return (
    <div className={styles.array}>
      <CompositeOwnValue node={node} />
      {children.length === 0 ? null : allPrimitive ? (
        <ul className={styles.list}>
          {visible.map((child) => (
            <li key={child.id} className={styles.listItem}>
              {child.key !== 'item' && (
                <div className={styles.listHeading}>
                  <span className={styles.listLabel}>
                    {child.label || child.key}
                  </span>
                  {child.label && child.label !== child.key && (
                    <span className={styles.listKey}>{child.key}</span>
                  )}
                </div>
              )}
              <UniversalValueRenderer node={child} depth={depth + 1} />
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.items}>
          {visible.map((child) => {
            const itemTitle = child.label || i18n.t('universalValue.item');
            const badge = getPrimaryNodeBadge(child);
            return (
              <div key={child.id} className={styles.item}>
                <div className={styles.itemTitleRow}>
                  <div className={styles.itemTitle}>{itemTitle}</div>
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
                <UniversalValueRenderer
                  node={child}
                  depth={depth + 1}
                  parentTitle={itemTitle}
                  suppressOwnMeta
                />
              </div>
            );
          })}
        </div>
      )}
      <CollectionStatus node={node} visibleCount={visible.length} />
      {rest > 0 && (
        <Button
          type='button'
          variant='function'
          link
          size='XS'
          className={styles.functionalLink}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded
            ? i18n.t('universalValue.collapse')
            : i18n.t('universalValue.showMore', { count: rest })}
        </Button>
      )}
      <NodeMetadata metadata={node.metadata} />
    </div>
  );
}
