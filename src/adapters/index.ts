export type {
  KnowledgeNode,
  UniversalArea,
  UniversalKnowledge,
} from '../types/universalKnowledge';
export {
  ANALYST_AREAS,
  type AnalystAdapterOptions,
  type AnalystFieldCatalog,
  type AnalystFieldDefinition,
} from './analystAdapterCore';
export { adaptBusinessObjectKnowledge } from './businessObjectKnowledgeAdapter';
export {
  type KnowledgeInputAdapterOptions,
  normalizeKnowledgeInput,
} from './knowledgeInputAdapter';
export { adaptProfileResultKnowledge } from './profileResultKnowledgeAdapter';
export {
  assertUniversalAreas,
  type KnowledgeValidationIssue,
  validateUniversalAreas,
} from './universalKnowledgeValidation';
