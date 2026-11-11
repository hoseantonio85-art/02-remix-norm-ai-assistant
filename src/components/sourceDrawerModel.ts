import i18n from '@/i18n/config';

export type SourceType =
  | 'document'
  | 'news'
  | 'law'
  | 'website'
  | 'internal_system'
  | 'state_of_knowledge';

const SOURCE_TYPE_BY_CODE: Readonly<Record<string, SourceType>> = {
  document: 'document',
  file: 'document',
  company_document: 'document',
  government_source: 'document',
  news: 'news',
  law: 'law',
  regulation: 'law',
  website: 'website',
  web_page: 'website',
  registry: 'website',
  internal_system: 'internal_system',
  internal_record: 'internal_system',
  state_of_knowledge: 'state_of_knowledge',
  knowledge_gap: 'state_of_knowledge',
};

function sourceTypeLabel(type: SourceType): string {
  const keyByType: Record<SourceType, string> = {
    document: 'sourceDrawer.document',
    news: 'sourceDrawer.news',
    law: 'sourceDrawer.law',
    website: 'sourceDrawer.website',
    internal_system: 'sourceDrawer.internalRecord',
    state_of_knowledge: 'sourceDrawer.knowledgeGap',
  };
  return i18n.t(keyByType[type]);
}

export interface UniSource {
  id: string;
  type: SourceType;
  typeLabel: string;
  title: string;
  provider?: string | null;
  domain?: string | null;
  publishedAt?: string | null;
  validAt?: string | null;
  quote?: string | null;
  relationToConclusion?: string | null;
  supportedClaim?: string | null;
  location?: {
    page?: number | null;
    section?: string | null;
    article?: string | null;
    paragraph?: string | null;
    sheet?: string | null;
    range?: string | null;
    timestamp?: string | null;
    recordId?: string | null;
  } | null;
  file?: {
    name: string;
    format?: string | null;
    size?: string | null;
    downloadUrl?: string | null;
  } | null;
  url?: string | null;
  targetAreaId?: string | null;
  targetKnowledgeId?: string | null;
}

export interface FocusSourceLike {
  id?: string;
  type: string;
  title: string;
  date?: string;
  excerpt: string;
  relation: string;
  document?: {
    fileName: string;
    mimeType?: string;
    fileSize?: string;
    updatedAt?: string;
    downloadUrl?: string;
  };
  quote?: string;
  locator?: {
    page?: number;
    section?: string;
    sheet?: string;
    range?: string;
  };
  provider?: string;
  domain?: string;
  url?: string;
  targetAreaId?: string | null;
  targetKnowledgeId?: string | null;
}

function classifyFocusType(source: FocusSourceLike): {
  type: SourceType;
  typeLabel: string;
} {
  const code = (source.type || '').trim().toLowerCase();
  const type =
    SOURCE_TYPE_BY_CODE[code] ||
    (source.document ? 'document' : source.url ? 'website' : 'internal_system');
  return { type, typeLabel: sourceTypeLabel(type) };
}

export function focusSourceToUni(
  source: FocusSourceLike,
  options?: { supportedClaim?: string | null },
): UniSource {
  const { type, typeLabel } = classifyFocusType(source);
  const url = source.url || null;
  let domain = source.domain || null;
  if (!domain && url) {
    try {
      domain = new URL(url).hostname;
    } catch {
      domain = null;
    }
  }
  return {
    id: source.id || source.title,
    type,
    typeLabel,
    title: source.title,
    provider:
      source.provider ||
      (source.document ? i18n.t('sourceDrawer.internalSystem') : null),
    domain,
    validAt: source.date || source.document?.updatedAt || null,
    publishedAt: type === 'news' ? source.date || null : null,
    quote: source.quote || source.excerpt || null,
    relationToConclusion: source.relation || null,
    supportedClaim: options?.supportedClaim ?? null,
    location: source.locator
      ? {
          page: source.locator.page ?? null,
          section: source.locator.section ?? null,
          sheet: source.locator.sheet ?? null,
          range: source.locator.range ?? null,
        }
      : null,
    file: source.document
      ? {
          name: source.document.fileName,
          format: source.document.mimeType || null,
          size: source.document.fileSize || null,
          downloadUrl: source.document.downloadUrl || null,
        }
      : null,
    url,
    targetAreaId: source.targetAreaId ?? null,
    targetKnowledgeId: source.targetKnowledgeId ?? null,
  };
}

export function knowledgeSourceToUni(
  source: {
    id: string;
    type: string;
    name: string;
    dataset?: string | null;
    documentName?: string | null;
    fileName?: string | null;
    mimeType?: string | null;
    downloadUrl?: string | null;
    url?: string | null;
    actualAt?: string | null;
  },
  evidence?: {
    quote?: string | null;
    locator?: {
      page?: number | null;
      section?: string | null;
      field?: string | null;
      dataset?: string | null;
      recordId?: string | null;
      sheet?: string | null;
      range?: string | null;
    };
  },
): UniSource {
  const rawType = (source.type || '').toLowerCase();
  const type =
    SOURCE_TYPE_BY_CODE[rawType] ||
    (source.fileName || source.documentName
      ? 'document'
      : source.url
        ? 'website'
        : 'internal_system');
  const typeLabel = sourceTypeLabel(type);

  return {
    id: source.id,
    type,
    typeLabel,
    title: source.documentName || source.fileName || source.name,
    provider: source.dataset || null,
    domain: source.url
      ? new URL(source.url, 'https://x').hostname.replace(/^x$/, '')
      : null,
    validAt: source.actualAt || null,
    quote: evidence?.quote || null,
    location: evidence?.locator
      ? {
          page: evidence.locator.page ?? null,
          section: evidence.locator.section ?? null,
          sheet: evidence.locator.sheet ?? null,
          range: evidence.locator.range ?? null,
          recordId: evidence.locator.recordId ?? null,
        }
      : null,
    file:
      type === 'document' && source.fileName
        ? {
            name: source.fileName,
            format: source.mimeType || null,
            downloadUrl: source.downloadUrl || null,
          }
        : null,
    url: source.url || null,
  };
}
