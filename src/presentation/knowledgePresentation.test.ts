import { describe, expect, it } from "vitest";
import type { UniversalArea, UniversalKnowledge } from "../types/universalKnowledge";
import { composeKnowledgePresentation } from "./knowledgePresentation";

function fact(key: string, title: string): UniversalKnowledge {
  return {
    schemaVersion: "2.0",
    id: `fact.${key}`,
    areaId: "general_information",
    key: `generalInfo.${key}.general_information`,
    title,
    epistemicKind: "fact",
    state: { code: "known", label: "Известно" },
    content: {
      id: `fact.${key}.content`,
      key,
      label: title,
      valueType: "string",
      value: title,
      children: [],
      state: { code: "known", label: "Известно" },
    },
  };
}

describe("knowledge presentation composition", () => {
  it("groups atomic registration facts into one accordion without changing them", () => {
    const inn = fact("inn", "ИНН");
    const ogrn = fact("ogrn", "ОГРН");
    const description = fact("description", "Описание");
    const area: UniversalArea = {
      id: "general_information",
      title: "Общая информация",
      knowledge: [inn, ogrn, description],
    };

    const groups = composeKnowledgePresentation(area);

    expect(groups.map((group) => group.title)).toEqual([
      "Регистрационные сведения",
      "Описание компании",
    ]);
    expect(groups[0].knowledge).toEqual([inn, ogrn]);
    expect(groups[0].knowledge[0]).toBe(inn);
    expect(area.knowledge).toEqual([inn, ogrn, description]);
  });

  it("collects unknown keys into one fallback accordion", () => {
    const first = fact("customOne", "Первый факт");
    const second = fact("customTwo", "Второй факт");
    const groups = composeKnowledgePresentation({
      id: "general_information",
      title: "Общая информация",
      knowledge: [first, second],
    });

    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe("Дополнительные сведения");
    expect(groups[0].knowledge).toEqual([first, second]);
  });
});
