import i18n from '@/i18n/config';
import type {
  KnowledgeMetadata,
  KnowledgeNode,
} from '@/types/universalKnowledge';
import { formatDateTime } from './universalValueFormatters';

export function hasOwnValue(node: KnowledgeNode): boolean {
  return (
    (node.displayValue != null && node.displayValue !== '') ||
    (node.value !== null && node.value !== undefined && node.value !== '')
  );
}

function isNodeEmpty(node: KnowledgeNode): boolean {
  if (node.state || hasOwnValue(node)) {
    return false;
  }
  if (node.valueType === 'object' || node.valueType === 'array') {
    return (node.children || []).every(shouldHideNode);
  }
  return true;
}

/** Explicit completeness states are visible; only truly absent untyped data is hidden. */
export function shouldHideNode(node: KnowledgeNode): boolean {
  return isNodeEmpty(node);
}

const CLASSIFICATION_CODE_RE =
  /^(legal_entity|individual|subsidiary|founder|director|manager|supplier|client|company|active(_founder|_director|_manager|_company)?|entity_type|role_.*|kind_.*|type_.*)$/i;

export function getPrimaryNodeBadge(
  node: KnowledgeNode,
): { label: string; tone: string } | null {
  if (node.status) {
    return { label: node.status.label, tone: node.status.tone || 'neutral' };
  }
  const tags = (node.tags || []).filter(
    (tag) => !CLASSIFICATION_CODE_RE.test(tag.code || ''),
  );
  return tags.length > 0
    ? { label: tags[0].label, tone: tags[0].tone || 'neutral' }
    : null;
}

export function metadataRows(
  metadata?: KnowledgeMetadata | null,
): [string, string][] {
  if (!metadata) {
    return [];
  }
  const rows: [string, string][] = [];
  if (metadata.actualAt) {
    rows.push([
      i18n.t('universalValue.actualAt'),
      formatDateTime(metadata.actualAt),
    ]);
  }
  if (metadata.validFrom) {
    rows.push([
      i18n.t('universalValue.validFrom'),
      formatDateTime(metadata.validFrom),
    ]);
  }
  if (metadata.validityTo) {
    rows.push([
      i18n.t('universalValue.validTo'),
      formatDateTime(metadata.validityTo),
    ]);
  }
  if (metadata.origin?.name || metadata.origin?.type) {
    rows.push([
      i18n.t('universalValue.origin'),
      metadata.origin.name || metadata.origin.type || '',
    ]);
  }
  if (metadata.confidence != null) {
    rows.push([
      i18n.t('universalValue.confidence'),
      `${Math.round(metadata.confidence * 100)}%`,
    ]);
  }
  if (metadata.riskRelevanceScore != null) {
    rows.push([
      i18n.t('universalValue.riskRelevance'),
      `${Math.round(metadata.riskRelevanceScore * 100)}%`,
    ]);
  }
  if (metadata.sourceEvidence?.length) {
    rows.push([
      i18n.t('universalValue.evidence'),
      String(metadata.sourceEvidence.length),
    ]);
  }
  if (metadata.access?.classification) {
    rows.push([
      i18n.t('universalValue.access'),
      metadata.access.classification,
    ]);
  }
  return rows.filter(([, value]) => value !== '');
}

export function hasDistinctAtomicMetadata(
  metadata?: KnowledgeMetadata | null,
): boolean {
  if (!metadata) {
    return false;
  }
  const detailedEvidence = metadata.sourceEvidence?.some(
    (evidence) =>
      !!evidence.quote ||
      (!!evidence.locator &&
        Object.values(evidence.locator).some((value) => value != null)),
  );
  return !!(
    metadata.validFrom ||
    metadata.validityTo ||
    metadata.confidence != null ||
    metadata.riskRelevanceScore != null ||
    metadata.access?.classification ||
    detailedEvidence
  );
}
