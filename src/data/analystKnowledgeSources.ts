import profileResult from './profile_result_qwen.json';

export type AnalystDatasetId = 'zvuk';

export interface AnalystKnowledgeDataset {
  id: AnalystDatasetId;
  label: string;
  fileName: string;
  input: unknown;
}

function profileResultCompanyName(input: unknown): string {
  const root = input as { profile?: { generalInfo?: { shortName?: unknown } } };
  const value = root.profile?.generalInfo?.shortName;
  return typeof value === 'string' && value.trim()
    ? value
    : 'Компания из Profile Result';
}

/**
 * The only company-fact inputs used by the Knowledge Base.
 * Labels are read from the files themselves so a refreshed analyst export
 * cannot silently keep the previous company's name in the interface.
 */
export const ANALYST_KNOWLEDGE_DATASETS: readonly AnalystKnowledgeDataset[] = [
  {
    id: 'zvuk',
    label: profileResultCompanyName(profileResult),
    fileName: 'profile_result_qwen.json',
    input: profileResult,
  },
];
