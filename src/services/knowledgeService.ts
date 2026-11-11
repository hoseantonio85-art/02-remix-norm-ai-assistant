import { normalizeKnowledgeInput } from '@/adapters/knowledgeInputAdapter';
import { ANALYST_KNOWLEDGE_DATASETS } from '@/data/analystKnowledgeSources';
import type { UniversalArea } from '@/types/universalKnowledge';

export interface KnowledgeDataset {
  id: string;
  label: string;
  fileName: string;
  areas: UniversalArea[];
}

export interface KnowledgeService {
  loadCompanyKnowledge(): Promise<KnowledgeDataset>;
}

export function getLocalKnowledgeDataset(): KnowledgeDataset {
  const source = ANALYST_KNOWLEDGE_DATASETS[0];
  if (!source) {
    throw new Error('Knowledge dataset is not configured');
  }

  return {
    id: source.id,
    label: source.label,
    fileName: source.fileName,
    areas: normalizeKnowledgeInput(source.input, {
      sourceFileName: source.fileName,
      sourceDataset: source.id,
    }),
  };
}

export const localKnowledgeService: KnowledgeService = {
  async loadCompanyKnowledge() {
    return getLocalKnowledgeDataset();
  },
};
