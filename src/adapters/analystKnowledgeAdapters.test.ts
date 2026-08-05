import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { adaptBusinessObjectKnowledge } from "./businessObjectKnowledgeAdapter";
import { adaptProfileResultKnowledge } from "./profileResultKnowledgeAdapter";
import { normalizeKnowledgeInput } from "./knowledgeInputAdapter";
import { validateUniversalAreas } from "./universalKnowledgeValidation";
import companyProfile from "../data/company_profile_full.json";
import { ANALYST_KNOWLEDGE_DATASETS } from "../data/analystKnowledgeSources";
import universalKnowledgeSchema from "../../schemas/universal-knowledge.schema.json";
import type { KnowledgeNode } from "../types/universalKnowledge";
import { composeKnowledgePresentation } from "../presentation/knowledgePresentation";

const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
addFormats(ajv);
const validateSchema = ajv.compile(universalKnowledgeSchema);

function expectUniversalSchema(value: unknown) {
  const valid = validateSchema(value);
  expect(valid, ajv.errorsText(validateSchema.errors, { separator: "\n" })).toBe(true);
}

const envelope = (value: unknown, metadata: Record<string, unknown> = {}) => ({ value, metadata });

function primitiveSignature(value: unknown): string {
  return `${typeof value}:${JSON.stringify(value)}`;
}

function sourcePrimitiveValues(value: unknown, result = new Set<string>()): Set<string> {
  if (value === null || typeof value !== "object") {
    result.add(primitiveSignature(value));
    return result;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => sourcePrimitiveValues(entry, result));
  } else {
    Object.values(value as Record<string, unknown>).forEach((entry) => sourcePrimitiveValues(entry, result));
  }
  return result;
}

function expectNodeValuesInSource(node: KnowledgeNode, sourceValues: Set<string>): void {
  if (!["object", "array"].includes(node.valueType) && node.value !== undefined) {
    expect(sourceValues.has(primitiveSignature(node.value)), `${node.id} is absent from analyst input`).toBe(true);
  }
  node.children?.forEach((child) => expectNodeValuesInSource(child, sourceValues));
}

describe("business object adapter", () => {
  const input = {
    id: "company-1",
    nested: {
      generalInfo: {
        fields: {
          shortName: envelope("ООО Тест", { confidence: 0.9 }),
          goals: envelope([
            envelope("Рост выручки до 10 млрд"),
            envelope("Автоматизация IT-платформы"),
          ]),
        },
        dependents: {
          keyManager: [{
            id: "manager-1",
            fields: { name: envelope("Иван Иванов"), role: envelope("CEO") },
          }],
        },
      },
      financialProfile: {
        fields: {},
        dependents: { taxDebt: [] },
      },
      regulatoryProfile: {
        fields: {},
        nested: {
          enforcementTotal: {
            fields: { totalCount: envelope(2) },
            dependents: {
              enforcementBreakdown: [{
                id: "tax",
                fields: { type: envelope("Налоги"), count: envelope(2) },
              }],
            },
          },
        },
      },
    },
  };

  it("normalizes fields, dependents, deep nesting and metadata", () => {
    const areas = adaptBusinessObjectKnowledge(input);
    expect(areas).toHaveLength(9);
    expect(validateUniversalAreas(areas)).toEqual([]);
    expectUniversalSchema(areas);
    const general = areas.find((area) => area.id === "general_information")!;
    expect(general.knowledge[0].content.metadata?.confidence).toBe(0.9);
    const structure = areas.find((area) => area.id === "structure_management")!;
    expect(structure.knowledge[0].content.children?.[0].id).toContain("manager-1");
    const risk = areas.find((area) => area.id === "regulation_risk_signals")!;
    expect(JSON.stringify(risk)).toContain("enforcementBreakdown");
  });

  it("does not guess the meaning of an empty collection", () => {
    const areas = adaptBusinessObjectKnowledge(input);
    const finance = areas.find((area) => area.id === "finance")!;
    const taxDebt = finance.knowledge.find((item) => item.key.includes("taxDebt"))!;
    expect(taxDebt.state.code).toBe("unknown");
    expect(taxDebt.content.state?.reason).toContain("не передал состояние");
  });

  it("accepts an explicit known_empty decision for a path", () => {
    const areas = adaptBusinessObjectKnowledge(input, {
      emptyCollectionStates: {
        "$.nested.financialProfile.dependents.taxDebt": "known_empty",
      },
    });
    const finance = areas.find((area) => area.id === "finance")!;
    const taxDebt = finance.knowledge.find((item) => item.key.includes("taxDebt"))!;
    expect(taxDebt.state.code).toBe("known_empty");
  });
});

describe("Qwen profile result adapter", () => {
  const input = {
    profile_date: "2026-07-20T15:25:52Z",
    status: "completed",
    coverage: { percent: 100 },
    profile: {
      generalInfo: {
        shortName: "Звук",
        goals: ["Рост EBITDA", "Развитие технологической платформы"],
        keyManagers: [{ name: "Елена Воронцова", role: "CEO" }],
        extras: [{ key: "rating", value: "AAA", description: "Рейтинг" }],
      },
      orgStructure: { branches: [], directorDisqualified: [] },
      financialProfile: { receivablesTop20: [] },
      regulatoryProfile: { regulators: [{ department: "Роскомнадзор", lawAct: "152-ФЗ" }] },
    },
  };

  it("routes the flat result into the same nine areas", () => {
    const areas = adaptProfileResultKnowledge(input);
    expect(areas).toHaveLength(9);
    expect(validateUniversalAreas(areas)).toEqual([]);
    expectUniversalSchema(areas);
    expect(areas.find((area) => area.id === "finance")?.knowledge.length).toBeGreaterThan(0);
    expect(areas.find((area) => area.id === "it_data_technology")?.knowledge.length).toBeGreaterThan(0);
  });

  it("keeps Qwen empty arrays unknown despite global completed status", () => {
    const areas = adaptProfileResultKnowledge(input);
    const operations = areas.find((area) => area.id === "operations")!;
    expect(operations.knowledge.find((item) => item.key.includes("branches"))?.state.code).toBe("unknown");
  });

  it("is selected by the common input boundary", () => {
    expect(normalizeKnowledgeInput(input)).toHaveLength(9);
  });
});

describe("common validated input boundary", () => {
  it("keeps the original prototype profile compatible with strict validation", () => {
    const areas = normalizeKnowledgeInput(companyProfile);
    expect(areas).toHaveLength(9);
    expect(validateUniversalAreas(areas)).toEqual([]);
    expectUniversalSchema(areas);
    expect(
      areas
        .find((area) => area.id === "regulation_risk_signals")
        ?.knowledge.some((knowledge) => knowledge.state.code === "conflicting"),
    ).toBe(true);
  });

  it.each(ANALYST_KNOWLEDGE_DATASETS)(
    "keeps every displayed value traceable to $fileName",
    (dataset) => {
      const areas = normalizeKnowledgeInput(dataset.input, {
        sourceFileName: dataset.fileName,
        sourceDataset: dataset.id,
      });
      const sourceValues = sourcePrimitiveValues(dataset.input);

      expect(areas).toHaveLength(9);
      expectUniversalSchema(areas);
      for (const area of areas) {
        for (const knowledge of area.knowledge) {
          expect(knowledge.epistemicKind).toBe("fact");
          expect(knowledge.sources?.every((source) => source.fileName === dataset.fileName)).toBe(true);
          expectNodeValuesInSource(knowledge.content, sourceValues);
        }
      }
    },
  );

  it("keeps analyst exports as separate company profiles", () => {
    expect(ANALYST_KNOWLEDGE_DATASETS.map((dataset) => dataset.label)).toEqual([
      'ООО "УМНЫЙ РИТЕЙЛ"',
      "Звук",
    ]);
  });

  it.each(ANALYST_KNOWLEDGE_DATASETS)(
    "composes $fileName into semantic accordions without losing atomic facts",
    (dataset) => {
      const areas = normalizeKnowledgeInput(dataset.input, {
        sourceFileName: dataset.fileName,
        sourceDataset: dataset.id,
      });

      for (const area of areas) {
        const groups = composeKnowledgePresentation(area);
        expect(groups.flatMap((group) => group.knowledge.map((knowledge) => knowledge.id)).sort())
          .toEqual(area.knowledge.map((knowledge) => knowledge.id).sort());
        expect(groups.every((group) => group.knowledge.length > 0)).toBe(true);
      }

      const general = areas.find((area) => area.id === "general_information")!;
      expect(composeKnowledgePresentation(general).length).toBeLessThan(general.knowledge.length);
    },
  );
});
