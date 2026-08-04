export {
  normalizeKnowledgeInput,
  type KnowledgeInputAdapterOptions,
} from "./knowledgeInputAdapter";
export { adaptBusinessObjectKnowledge } from "./businessObjectKnowledgeAdapter";
export { adaptProfileResultKnowledge } from "./profileResultKnowledgeAdapter";
export {
  assertUniversalAreas,
  validateUniversalAreas,
  type KnowledgeValidationIssue,
} from "./universalKnowledgeValidation";
export {
  ANALYST_AREAS,
  type AnalystAdapterOptions,
  type AnalystFieldCatalog,
  type AnalystFieldDefinition,
} from "./analystAdapterCore";
export type { UniversalArea, UniversalKnowledge, KnowledgeNode } from "../types/universalKnowledge";
