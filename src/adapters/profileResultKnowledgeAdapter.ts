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

interface ProfileResult {
  profile: Record<string, unknown>;
  coverage?: unknown;
  status?: string;
  profile_date?: string;
}

export function isProfileResult(input: unknown): input is ProfileResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  const profile = (input as Record<string, unknown>).profile;
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return false;
  return ["generalInfo", "orgStructure", "financialProfile", "regulatoryProfile"]
    .some((key) => key in (profile as Record<string, unknown>));
}

function convertValue(
  sectionName: string,
  key: string,
  value: unknown,
  options: AnalystAdapterOptions,
  forcedArea?: AnalystAreaId,
  suffix?: string,
): UniversalKnowledge {
  const areaId = forcedArea || areaFor(sectionName, key);
  const definition = catalogDefinition(options.catalog, sectionName, key);
  const title = definition.title || humanizeKey(key);
  const sourceCode = definition.source || "QWEN";
  const keyWithSuffix = suffix ? `${key}.${suffix}` : key;
  const canonicalKey = `${sectionName}.${keyWithSuffix}.${areaId}`;
  const node = nodeFromValue(value, {
    id: `analyst.${canonicalKey}.content`,
    key,
    label: title,
    path: `$.profile.${sectionName}.${key}`,
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
    options.actualAt,
  );
}

/** Adapts the flat profile_result_qwen.json shape into the same nine areas. */
export function adaptProfileResultKnowledge(
  input: unknown,
  options: AnalystAdapterOptions = {},
): UniversalArea[] {
  if (!isProfileResult(input)) {
    throw new TypeError("Ожидался результат профилирования с объектом profile");
  }
  const actualAt = options.actualAt ?? input.profile_date ?? null;
  const effectiveOptions = {
    ...options,
    actualAt,
    catalog: options.catalog || DEFAULT_ANALYST_FIELD_CATALOG,
  };
  const knowledge: UniversalKnowledge[] = [];

  for (const [sectionName, rawSection] of Object.entries(input.profile)) {
    if (!rawSection || typeof rawSection !== "object" || Array.isArray(rawSection)) continue;
    for (const [key, value] of Object.entries(rawSection as Record<string, unknown>)) {
      if (["goals", "keyInvestProjects"].includes(key)) {
        const split = splitStrategicArray(value, "products_business_model");
        if (split.size > 0) {
          for (const [areaId, entries] of split) {
            knowledge.push(convertValue(sectionName, key, entries, effectiveOptions, areaId, areaId));
          }
          continue;
        }
      }
      knowledge.push(convertValue(sectionName, key, value, effectiveOptions));
    }
  }

  return areasFromKnowledge(knowledge);
}
