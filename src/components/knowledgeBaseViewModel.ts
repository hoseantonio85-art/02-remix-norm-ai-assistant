import i18n from '@/i18n/config';
import type {
  UniversalArea,
  UniversalKnowledge,
} from '@/types/universalKnowledge';

export interface CoverageRecommendation {
  id: string;
  title: string;
  description: string;
  chatPrompt: string;
}

export interface AreaCoverage {
  percent: number;
  status: string;
  needsKnowledge: boolean;
  needsUpdate: boolean;
  understanding: string;
  canUse: string;
  limitations: string;
  recommendations: CoverageRecommendation[];
}

export function coverageForArea(area: UniversalArea): AreaCoverage {
  const total = area.knowledge.length;
  const known = area.knowledge.filter(
    (item) => item.state.code !== 'unknown',
  ).length;
  const percent = total === 0 ? 0 : Math.round((known / total) * 100);
  return {
    percent,
    status:
      percent === 100
        ? i18n.t('knowledgeBase.loaded')
        : percent >= 50
          ? i18n.t('knowledgeBase.hasGaps')
          : i18n.t('knowledgeBase.lowData'),
    needsKnowledge: known < total || total === 0,
    needsUpdate: area.knowledge.some(
      (item) => item.metadata?.freshness?.code === 'update_required',
    ),
    understanding: i18n.t('knowledgeBase.calculatedFromFacts'),
    canUse: '',
    limitations: '',
    recommendations: [],
  };
}

export function profileCoverage(areas: UniversalArea[]) {
  const knowledge = areas.flatMap((area) => area.knowledge);
  const known = knowledge.filter(
    (item) => item.state.code !== 'unknown',
  ).length;
  const percent =
    knowledge.length === 0 ? 0 : Math.round((known / knowledge.length) * 100);
  return {
    percent,
    status:
      percent === 100
        ? i18n.t('knowledgeBase.loaded')
        : percent >= 50
          ? i18n.t('knowledgeBase.hasGaps')
          : i18n.t('knowledgeBase.lowData'),
    areasTotal: areas.length,
  };
}

export function toneForPercent(percent: number): 'ok' | 'warn' | 'low' {
  return percent >= 70 ? 'ok' : percent >= 40 ? 'warn' : 'low';
}

export function formatRuDate(iso: string | undefined | null): string {
  if (!iso) {
    return '';
  }
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!parts) {
    return String(iso);
  }
  const date = new Date(
    Number.parseInt(parts[1], 10),
    Number.parseInt(parts[2], 10) - 1,
    Number.parseInt(parts[3], 10),
  );
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .formatToParts(date)
    .filter((part) => ['day', 'month', 'year'].includes(part.type))
    .map((part) => part.value)
    .join(' ');
}

export function pickBadge(
  knowledge: UniversalKnowledge,
): { label: string; tone: 'warn' | 'low' | 'neutral' } | null {
  if (knowledge.state.code === 'conflicting') {
    return { label: i18n.t('knowledgeBase.conflicting'), tone: 'warn' };
  }
  if (knowledge.metadata?.freshness?.code === 'update_required') {
    return { label: i18n.t('knowledgeBase.updateRequired'), tone: 'warn' };
  }
  if (knowledge.state.code === 'partial') {
    return { label: i18n.t('knowledgeBase.partiallyKnown'), tone: 'neutral' };
  }
  if (knowledge.state.code === 'unknown') {
    return { label: i18n.t('knowledgeBase.noData'), tone: 'low' };
  }
  if (knowledge.state.code === 'not_applicable') {
    return { label: i18n.t('knowledgeBase.notApplicable'), tone: 'neutral' };
  }
  return null;
}
