import type { KnowledgeNode, UniversalArea, UniversalKnowledge } from "../types/universalKnowledge";

export interface KnowledgeValidationIssue {
  path: string;
  message: string;
}

const EMPTY_STATES = new Set(["known_empty", "unknown", "not_applicable"]);
const KNOWLEDGE_STATES = new Set([
  "known",
  "partial",
  "known_empty",
  "unknown",
  "not_applicable",
  "conflicting",
]);

function validateNode(
  node: KnowledgeNode,
  path: string,
  ids: Set<string>,
  issues: KnowledgeValidationIssue[],
) {
  if (!node.id) issues.push({ path, message: "Узел не содержит id" });
  else if (ids.has(node.id)) issues.push({ path, message: `Повторяющийся id: ${node.id}` });
  else ids.add(node.id);
  if (!node.key) issues.push({ path, message: "Узел не содержит key" });
  if (!node.valueType) issues.push({ path, message: "Узел не содержит valueType" });
  if (node.state && !KNOWLEDGE_STATES.has(node.state.code)) {
    issues.push({ path, message: `Недопустимое состояние узла: ${node.state.code}` });
  }

  const composite = node.valueType === "object" || node.valueType === "array";
  if (composite && !Array.isArray(node.children)) {
    issues.push({ path, message: "Составной узел обязан содержать children" });
  }
  if (node.valueType === "array" && (node.children || []).length === 0) {
    if (!node.state || !EMPTY_STATES.has(node.state.code)) {
      issues.push({ path, message: "Пустая коллекция требует known_empty, unknown или not_applicable" });
    }
  }
  if (node.collection) {
    const { loadedCount, totalCount } = node.collection;
    if (loadedCount != null && loadedCount < 0) {
      issues.push({ path, message: "loadedCount не может быть отрицательным" });
    }
    if (totalCount != null && totalCount < 0) {
      issues.push({ path, message: "totalCount не может быть отрицательным" });
    }
    if (loadedCount != null && totalCount != null && loadedCount > totalCount) {
      issues.push({ path, message: "loadedCount не может превышать totalCount" });
    }
  }

  for (const [index, child] of (node.children || []).entries()) {
    validateNode(child, `${path}.children[${index}]`, ids, issues);
  }
}

function validateKnowledge(
  knowledge: UniversalKnowledge,
  path: string,
  ids: Set<string>,
  issues: KnowledgeValidationIssue[],
) {
  if (!knowledge.id) issues.push({ path, message: "Знание не содержит id" });
  else if (ids.has(knowledge.id)) issues.push({ path, message: `Повторяющийся id: ${knowledge.id}` });
  else ids.add(knowledge.id);
  if (!knowledge.areaId) issues.push({ path, message: "Знание не содержит areaId" });
  if (!knowledge.title) issues.push({ path, message: "Знание не содержит title" });
  if (!knowledge.state) issues.push({ path, message: "Знание не содержит state" });
  else if (!KNOWLEDGE_STATES.has(knowledge.state.code)) {
    issues.push({ path, message: `Недопустимое состояние знания: ${knowledge.state.code}` });
  }
  if (knowledge.epistemicKind && knowledge.epistemicKind !== "fact" && !knowledge.derivation) {
    issues.push({ path, message: `${knowledge.epistemicKind} требует derivation` });
  }
  if (!knowledge.content) issues.push({ path, message: "Знание не содержит content" });
  else validateNode(knowledge.content, `${path}.content`, ids, issues);
}

export function validateUniversalAreas(areas: UniversalArea[]): KnowledgeValidationIssue[] {
  const issues: KnowledgeValidationIssue[] = [];
  const areaIds = new Set<string>();
  const ids = new Set<string>();
  for (const [areaIndex, area] of areas.entries()) {
    const path = `$[${areaIndex}]`;
    if (!area.id) issues.push({ path, message: "Область не содержит id" });
    else if (areaIds.has(area.id)) issues.push({ path, message: `Повторяющаяся область: ${area.id}` });
    else areaIds.add(area.id);
    if (!Array.isArray(area.knowledge)) {
      issues.push({ path, message: "Область не содержит массив knowledge" });
      continue;
    }
    for (const [knowledgeIndex, knowledge] of area.knowledge.entries()) {
      validateKnowledge(knowledge, `${path}.knowledge[${knowledgeIndex}]`, ids, issues);
    }
  }
  return issues;
}

export function assertUniversalAreas(areas: UniversalArea[]): void {
  const issues = validateUniversalAreas(areas);
  if (issues.length === 0) return;
  const details = issues.slice(0, 8).map((issue) => `${issue.path}: ${issue.message}`).join("\n");
  throw new TypeError(`Некорректный универсальный профиль:\n${details}`);
}
