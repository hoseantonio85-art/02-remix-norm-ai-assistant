import { describe, expect, it } from 'vitest';
import type { UniversalKnowledge } from '@/types/universalKnowledge';
import { resolveSourceSelection, withoutSource } from './knowledgeSourceSelection';

function fact(id: string, sourceIds: string[]): UniversalKnowledge {
  return {
    id, areaId: 'area', key: id, title: id, schemaVersion: '2.0',
    epistemicKind: 'fact', state: { code: 'known', label: 'Known' },
    content: { id, key: id, valueType: 'string', value: 'Fact value' },
    sources: sourceIds.map((sourceId) => ({ id: sourceId, name: sourceId, type: 'document' })),
    metadata: { sourceEvidence: sourceIds.map((sourceId) => ({ sourceId, quote: id })) },
  };
}

describe('live source selection', () => {
  it('does not restore the snapshot after the last source is removed', () => {
    const original = fact('a', ['s1']);
    const removed = withoutSource(original, 's1');
    const updated = { ...original, sources: removed.sources, metadata: { sourceEvidence: removed.evidence } };
    expect(resolveSourceSelection([updated], ['a'], 'A')?.sources).toEqual([]);
    expect(original.sources).toHaveLength(1);
    expect(original.metadata?.sourceEvidence).toHaveLength(1);
    expect(updated.content).toBe(original.content);
  });

  it('resolves sources of every member, deduplicates shared sources and excludes unrelated facts', () => {
    const facts = [fact('a', ['shared']), fact('b', ['shared', 'second']), fact('outside', ['other'])];
    const selection = resolveSourceSelection(facts, ['a', 'b'], 'Group');
    expect(selection?.sources?.map((source) => source.id)).toEqual(['shared', 'second']);
    expect(selection?.metadata?.sourceEvidence).toHaveLength(3);
    const removed = withoutSource(facts[1], 'second');
    const updated = [facts[0], { ...facts[1], sources: removed.sources, metadata: { sourceEvidence: removed.evidence } }, facts[2]];
    expect(resolveSourceSelection(updated, ['a', 'b'], 'Group')?.sources?.map((source) => source.id)).toEqual(['shared']);
    expect(removed.evidence.map((item) => item.sourceId)).toEqual(['shared']);
    expect(updated[2]).toBe(facts[2]);
  });

  it('does not retain a stale selection when its facts are no longer present', () => {
    expect(resolveSourceSelection([], ['missing'], 'Missing')).toBeNull();
  });
});
