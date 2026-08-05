import type { UniversalArea, UniversalKnowledge } from "../types/universalKnowledge";
import {
  areaFor,
  areasFromKnowledge,
  catalogDefinition,
  humanizeKey,
  knowledgeFromNode,
  nodeFromValue,
  splitStrategicArray,
  type AnalystAdapterOptions,
  type AnalystAreaId,
} from "./analystAdapterCore";
import { DEFAULT_ANALYST_FIELD_CATALOG } from "./defaultAnalystFieldCatalog";

interface BusinessObjectSection {
  id?: string;
  version?: number;
  fields?: Record<string, unknown>;
  nested?: Record<string, unknown>;
  dependents?: Record<string, unknown>;
}

interface BusinessObjectTransport {
  id?: string;
  version?: number;
  fields?: Record<string, unknown>;
  nested?: Record<string, BusinessObjectSection>;
  dependents?: Record<string, unknown>;
}

export function isBusinessObjectTransport(input: unknown): input is BusinessObjectTransport {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  const record = input as Record<string, unknown>;
  if (!record.nested || typeof record.nested !== "object" || Array.isArray(record.nested)) return false;
  const nested = record.nested as Record<string, unknown>;
  return ["generalInfo", "orgStructure", "financialProfile", "regulatoryProfile"]
    .some((key) => key in nested);
}

function knowledgeKey(section: string, key: string, areaId: AnalystAreaId): string {
  return `${section}.${key}.${areaId}`;
}

function convertValue(
  sectionName: string,
  key: string,
  value: unknown,
  branch: "fields" | "nested" | "dependents",
  options: AnalystAdapterOptions,
  forcedArea?: AnalystAreaId,
  suffix?: string,
): UniversalKnowledge {
  const areaId = forcedArea || areaFor(sectionName, key);
  const definition = catalogDefinition(options.catalog, sectionName, key);
  const title = definition.title || humanizeKey(key);
  const sourceCode = definition.source || (key === "extra" || key === "extras" ? "UI" : "ES");
  const keyWithSuffix = suffix ? `${key}.${suffix}` : key;
  const canonicalKey = knowledgeKey(sectionName, keyWithSuffix, areaId);
  const path = `$.nested.${sectionName}.${branch}.${key}`;
  const node = nodeFromValue(value, {
    id: `analyst.${canonicalKey}.content`,
    key,
    label: title,
    path,
    objectType: definition.objectType || key,
    sourceCode,
    options,
    definition,
    semanticRole: "group",
  });
  const areaSuffix = suffix ? ` — ${humanizeKey(areaId)}` : "";
  return knowledgeFromNode(
    areaId,
    canonicalKey,
    `${title}${areaSuffix}`,
    node,
    sourceCode,
    options,
  );
}

function convertSection(
  sectionName: string,
  section: BusinessObjectSection,
  options: AnalystAdapterOptions,
): UniversalKnowledge[] {
  const result: UniversalKnowledge[] = [];
  for (const branch of ["fields", "nested", "dependents"] as const) {
    const values = section[branch] || {};
    for (const [key, value] of Object.entries(values)) {
      if (["goals", "keyInvestProjects"].includes(key)) {
        const split = splitStrategicArray(value, "products_business_model");
        if (split.size > 0) {
          for (const [areaId, entries] of split) {
            result.push(convertValue(sectionName, key, entries, branch, options, areaId, areaId));
          }
          continue;
        }
      }
      result.push(convertValue(sectionName, key, value, branch, options));
    }
  }
  return result;
}

/**
 * Adapts the transport object used by rest_business_object.json.
 * fields, nested and dependents are normalized recursively; value/metadata
 * envelopes disappear while their metadata stays attached to the value node.
 */
export function adaptBusinessObjectKnowledge(
  input: unknown,
  options: AnalystAdapterOptions = {},
): UniversalArea[] {
  if (!isBusinessObjectTransport(input)) {
    throw new TypeError("Ожидался business object с разделом nested");
  }
  const effectiveOptions: AnalystAdapterOptions = {
    ...options,
    catalog: options.catalog || DEFAULT_ANALYST_FIELD_CATALOG,
  };
  const knowledge: UniversalKnowledge[] = [];
  for (const [sectionName, section] of Object.entries(input.nested || {})) {
    knowledge.push(...convertSection(sectionName, section, effectiveOptions));
  }
  return areasFromKnowledge(knowledge);
}
