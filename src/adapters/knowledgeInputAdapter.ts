import type { CompanyProfile } from "../types/profile";
import type { UniversalArea } from "../types/universalKnowledge";
import { normalizeProfile } from "./profileKnowledgeAdapter";
import { adaptBusinessObjectKnowledge, isBusinessObjectTransport } from "./businessObjectKnowledgeAdapter";
import { adaptProfileResultKnowledge, isProfileResult } from "./profileResultKnowledgeAdapter";
import type { AnalystAdapterOptions } from "./analystAdapterCore";
import { assertUniversalAreas } from "./universalKnowledgeValidation";

export type KnowledgeInputAdapterOptions = AnalystAdapterOptions;

function isCompanyProfile(input: unknown): input is CompanyProfile {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  const profile = (input as Record<string, unknown>).profile;
  return !!profile && typeof profile === "object" &&
    Array.isArray((profile as Record<string, unknown>).areas);
}

/** Single validated boundary for prototype, business-object and Qwen inputs. */
export function normalizeKnowledgeInput(
  input: unknown,
  options: AnalystAdapterOptions = {},
): UniversalArea[] {
  let areas: UniversalArea[];
  if (isCompanyProfile(input)) {
    areas = normalizeProfile(input.profile.areas);
  } else if (isBusinessObjectTransport(input)) {
    areas = adaptBusinessObjectKnowledge(input, options);
  } else if (isProfileResult(input)) {
    areas = adaptProfileResultKnowledge(input, options);
  } else {
    throw new TypeError("Неизвестный формат профиля знаний");
  }
  assertUniversalAreas(areas);
  return areas;
}
