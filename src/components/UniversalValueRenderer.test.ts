import { describe, expect, it } from "vitest";
import { formatNodeValue, shouldHideNode } from "./UniversalValueRenderer";
import type { KnowledgeNode } from "../types/universalKnowledge";

function node(overrides: Partial<KnowledgeNode>): KnowledgeNode {
  return { id: "node", key: "node", valueType: "string", ...overrides };
}

describe("UniversalValueRenderer value rules", () => {
  it("preserves time for datetime", () => {
    expect(formatNodeValue(node({ valueType: "datetime", value: "2026-07-20T15:25:52Z" })))
      .toContain("15:25:52");
  });

  it("uses enum labels and boolean labels", () => {
    expect(formatNodeValue(node({ valueType: "enum", value: "active", enumLabels: { active: "Действует" } })))
      .toBe("Действует");
    expect(formatNodeValue(node({ valueType: "boolean", value: false, format: { falseLabel: "Отсутствует" } })))
      .toBe("Отсутствует");
  });

  it("keeps explicit completeness states visible", () => {
    expect(shouldHideNode(node({ value: null, state: { code: "unknown", label: "Пока неизвестно" } })))
      .toBe(false);
    expect(shouldHideNode(node({ value: null, state: { code: "not_applicable", label: "Неприменимо" } })))
      .toBe(false);
  });

  it("keeps a composite node's own value", () => {
    expect(shouldHideNode(node({ valueType: "object", value: "51%", children: [] }))).toBe(false);
  });
});
