import type { UniversalKnowledge } from '@/types/universalKnowledge';

// Drawer scope is UI state, never part of the canonical facts.
export function combineKnowledgeSources(
  knowledge: UniversalKnowledge[],
  title: string,
): UniversalKnowledge | null {
  const first = knowledge[0];
  if (!first) {
    return null;
  }
  return {
    ...first,
    title,
    sources: [
      ...new Map(
        knowledge
          .flatMap((item) => item.sources || [])
          .map((source) => [source.id, source] as const),
      ).values(),
    ],
    metadata: {
      ...(first.metadata || {}),
      sourceEvidence: knowledge.flatMap(
        (item) => item.metadata?.sourceEvidence || [],
      ),
    },
  };
}

export function resolveSourceSelection(
  knowledge: UniversalKnowledge[],
  ids: string[],
  title: string,
) {
  return combineKnowledgeSources(
    knowledge.filter((item) => ids.includes(item.id)),
    title,
  );
}

export function withoutSource(knowledge: UniversalKnowledge, sourceId: string) {
  return {
    sources: (knowledge.sources || []).filter(
      (source) => source.id !== sourceId,
    ),
    evidence: (knowledge.metadata?.sourceEvidence || []).filter(
      (item) => item.sourceId !== sourceId,
    ),
  };
}
