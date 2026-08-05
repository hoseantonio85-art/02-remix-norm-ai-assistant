import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { formatNodeValue, shouldHideNode, UniversalValueRenderer } from "./UniversalValueRenderer";
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

  it("shows the semantic label and key for named primitive array items", () => {
    const array = node({
      valueType: "array",
      children: [node({
        id: "extra-ebitda",
        key: "ebitdaTurnaround",
        label: "Достижение операционной прибыльности группы",
        value: "EBITDA стала положительной",
      })],
    });
    const html = renderToStaticMarkup(createElement(UniversalValueRenderer, { node: array }));

    expect(html).toContain("Достижение операционной прибыльности группы");
    expect(html).toContain("ebitdaTurnaround");
    expect(html).toContain("EBITDA стала положительной");
  });

  it("hides repeated technical metadata and shows a compact info control for distinct metadata", () => {
    const inheritedOnly = renderToStaticMarkup(createElement(UniversalValueRenderer, {
      node: node({
        value: "7700000000",
        metadata: { actualAt: "2026-07-20", origin: { type: "QWEN", name: "Qwen" } },
      }),
    }));
    const distinct = renderToStaticMarkup(createElement(UniversalValueRenderer, {
      node: node({
        value: "7700000000",
        metadata: { confidence: 0.82, origin: { type: "QWEN", name: "Qwen" } },
      }),
    }));

    expect(inheritedOnly).not.toContain("О данных");
    expect(distinct).toContain('aria-label="О данных"');
    expect(distinct).toContain("Уверенность");
    expect(distinct).toContain("82%");
  });
});
