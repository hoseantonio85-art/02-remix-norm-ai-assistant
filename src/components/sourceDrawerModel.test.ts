import { describe, expect, it } from 'vitest';
import { knowledgeSourceToUni } from './sourceDrawerModel';

const source = {
  id: 'source-1',
  name: 'Источник',
};

describe('knowledgeSourceToUni', () => {
  it('maps stable source codes to presentation types', () => {
    expect(knowledgeSourceToUni({ ...source, type: 'news' }).type).toBe('news');
    expect(knowledgeSourceToUni({ ...source, type: 'regulation' }).type).toBe(
      'law',
    );
    expect(knowledgeSourceToUni({ ...source, type: 'registry' }).type).toBe(
      'website',
    );
  });

  it('uses structural fallbacks without parsing localized labels', () => {
    expect(
      knowledgeSourceToUni({
        ...source,
        type: 'legacy_file',
        fileName: 'profile.json',
      }).type,
    ).toBe('document');
    expect(
      knowledgeSourceToUni({ ...source, type: 'Внешняя новость' }).type,
    ).toBe('internal_system');
  });
});
