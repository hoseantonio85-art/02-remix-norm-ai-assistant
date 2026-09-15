import i18n from '@/i18n/config';
import type {
  UniversalArea,
  UniversalKnowledge,
} from '@/types/universalKnowledge';

export interface KnowledgePresentationGroup {
  id: string;
  title: string;
  description?: string;
  knowledge: UniversalKnowledge[];
}

interface GroupDefinition {
  id: string;
  keys: readonly string[];
}

const AREA_GROUPS: Record<string, readonly GroupDefinition[]> = {
  general_information: [
    {
      id: 'registration',
      keys: [
        'shortName',
        'name',
        'inn',
        'ogrn',
        'kpp',
        'legalAddress',
        'foundingDate',
      ],
    },
    {
      id: 'activity',
      keys: ['industry', 'okved', 'additionalOkved'],
    },
    {
      id: 'overview',
      keys: ['description'],
    },
  ],
  structure_management: [
    {
      id: 'leadership',
      keys: ['director', 'directors', 'keyManager', 'keyManagers'],
    },
    {
      id: 'team',
      keys: ['personnelTotal'],
    },
    {
      id: 'governance',
      keys: ['extra', 'extras'],
    },
  ],
  owners_relations: [
    {
      id: 'owners',
      keys: ['founder', 'founders'],
    },
    {
      id: 'subsidiaries',
      keys: ['subsidiary', 'subsidiaries'],
    },
  ],
  products_business_model: [
    {
      id: 'strategy',
      keys: ['goals'],
    },
    {
      id: 'projects',
      keys: ['keyInvestProjects'],
    },
  ],
  operations: [
    {
      id: 'footprint',
      keys: ['geoOfOperations', 'branch', 'branches', 'branchesCountries'],
    },
    {
      id: 'rhythm',
      keys: ['seasonality'],
    },
    {
      id: 'initiatives',
      keys: ['goals', 'keyInvestProjects'],
    },
  ],
  it_data_technology: [
    {
      id: 'technology',
      keys: ['goals', 'keyInvestProjects'],
    },
  ],
  finance: [
    {
      id: 'indicators',
      keys: ['capitals', 'nonbankRevenue', 'operatingIncome'],
    },
    {
      id: 'taxes',
      keys: ['taxRegime', 'taxDebt'],
    },
    {
      id: 'finance_context',
      keys: ['extra', 'extras'],
    },
  ],
  regulation_risk_signals: [
    {
      id: 'regulatory_status',
      keys: [
        'status',
        'license',
        'licensesFinancial',
        'rnpRecord',
        'rnpStatus',
        'regulator',
        'regulators',
      ],
    },
    {
      id: 'proceedings',
      keys: ['enforcementTotal', 'arbitrationTotal'],
    },
    {
      id: 'risk_signals',
      keys: ['naturalTechFactors', 'directorDisqualified', 'extra', 'extras'],
    },
  ],
  counterparties: [
    {
      id: 'receivables',
      keys: ['receivable', 'receivablesTop20'],
    },
  ],
};

function atomicKey(knowledge: UniversalKnowledge): string {
  return knowledge.content.key || knowledge.key.split('.')[1] || knowledge.key;
}

function presentationTitle(groupId: string): string {
  return i18n.t(`knowledgePresentation.${groupId}.title`);
}

function presentationDescription(groupId: string): string | undefined {
  const key = `knowledgePresentation.${groupId}.description`;
  return i18n.exists(key) ? i18n.t(key) : undefined;
}

/**
 * Presentation-only composition. The universal knowledge objects stay atomic and
 * untouched; this function merely decides which facts share a top-level accordion.
 */
export function composeKnowledgePresentation(
  area: UniversalArea,
): KnowledgePresentationGroup[] {
  const definitions = AREA_GROUPS[area.id] || [];
  const grouped = new Map<string, KnowledgePresentationGroup>();

  for (const knowledge of area.knowledge) {
    const key = atomicKey(knowledge);
    const definition = definitions.find((candidate) =>
      candidate.keys.includes(key),
    );
    const groupId = definition?.id || 'additional';
    const current = grouped.get(groupId) || {
      id: `${area.id}.${groupId}`,
      title: presentationTitle(groupId),
      description: presentationDescription(groupId),
      knowledge: [],
    };
    current.knowledge.push(knowledge);
    grouped.set(groupId, current);
  }

  const order = [
    ...definitions.map((definition) => definition.id),
    'additional',
  ];
  return [...grouped.values()].sort(
    (left, right) =>
      order.indexOf(left.id.split('.').at(-1) || '') -
      order.indexOf(right.id.split('.').at(-1) || ''),
  );
}
