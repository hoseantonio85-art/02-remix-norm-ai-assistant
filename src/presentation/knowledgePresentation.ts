import type { UniversalArea, UniversalKnowledge } from "../types/universalKnowledge";

export interface KnowledgePresentationGroup {
  id: string;
  title: string;
  description?: string;
  knowledge: UniversalKnowledge[];
}

interface GroupDefinition {
  id: string;
  title: string;
  description?: string;
  keys: readonly string[];
}

const AREA_GROUPS: Record<string, readonly GroupDefinition[]> = {
  general_information: [
    {
      id: "registration",
      title: "Регистрационные сведения",
      description: "Основные реквизиты и юридическая идентификация компании",
      keys: ["shortName", "name", "inn", "ogrn", "kpp", "legalAddress", "foundingDate"],
    },
    {
      id: "activity",
      title: "Деятельность компании",
      description: "Отрасль, основной и дополнительные виды деятельности",
      keys: ["industry", "okved", "additionalOkved"],
    },
    {
      id: "overview",
      title: "Описание компании",
      keys: ["description"],
    },
  ],
  structure_management: [
    {
      id: "leadership",
      title: "Руководство",
      keys: ["director", "directors", "keyManager", "keyManagers"],
    },
    {
      id: "team",
      title: "Команда и организация",
      keys: ["personnelTotal"],
    },
    {
      id: "governance",
      title: "Корпоративное управление",
      keys: ["extra", "extras"],
    },
  ],
  owners_relations: [
    {
      id: "owners",
      title: "Учредители и владельцы",
      keys: ["founder", "founders"],
    },
    {
      id: "subsidiaries",
      title: "Дочерние и связанные компании",
      keys: ["subsidiary", "subsidiaries"],
    },
  ],
  products_business_model: [
    {
      id: "strategy",
      title: "Стратегия и цели",
      keys: ["goals"],
    },
    {
      id: "projects",
      title: "Ключевые проекты",
      keys: ["keyInvestProjects"],
    },
  ],
  operations: [
    {
      id: "footprint",
      title: "География и присутствие",
      keys: ["geoOfOperations", "branch", "branches", "branchesCountries"],
    },
    {
      id: "rhythm",
      title: "Операционная модель",
      keys: ["seasonality"],
    },
    {
      id: "initiatives",
      title: "Операционные инициативы",
      keys: ["goals", "keyInvestProjects"],
    },
  ],
  it_data_technology: [
    {
      id: "technology",
      title: "Технологии и данные",
      keys: ["goals", "keyInvestProjects"],
    },
  ],
  finance: [
    {
      id: "indicators",
      title: "Финансовые показатели",
      keys: ["capitals", "nonbankRevenue", "operatingIncome"],
    },
    {
      id: "taxes",
      title: "Налоги и обязательства",
      keys: ["taxRegime", "taxDebt"],
    },
    {
      id: "finance_context",
      title: "Финансовый контекст",
      keys: ["extra", "extras"],
    },
  ],
  regulation_risk_signals: [
    {
      id: "regulatory_status",
      title: "Регуляторный статус",
      keys: ["status", "license", "licensesFinancial", "rnpRecord", "rnpStatus", "regulator", "regulators"],
    },
    {
      id: "proceedings",
      title: "Производства и споры",
      keys: ["enforcementTotal", "arbitrationTotal"],
    },
    {
      id: "risk_signals",
      title: "Сигналы риска",
      keys: ["naturalTechFactors", "directorDisqualified", "extra", "extras"],
    },
  ],
  counterparties: [
    {
      id: "receivables",
      title: "Дебиторская задолженность",
      keys: ["receivable", "receivablesTop20"],
    },
  ],
};

function atomicKey(knowledge: UniversalKnowledge): string {
  return knowledge.content.key || knowledge.key.split(".")[1] || knowledge.key;
}

/**
 * Presentation-only composition. The universal knowledge objects stay atomic and
 * untouched; this function merely decides which facts share a top-level accordion.
 */
export function composeKnowledgePresentation(area: UniversalArea): KnowledgePresentationGroup[] {
  const definitions = AREA_GROUPS[area.id] || [];
  const grouped = new Map<string, KnowledgePresentationGroup>();

  for (const knowledge of area.knowledge) {
    const key = atomicKey(knowledge);
    const definition = definitions.find((candidate) => candidate.keys.includes(key));
    const groupId = definition?.id || "additional";
    const current = grouped.get(groupId) || {
      id: `${area.id}.${groupId}`,
      title: definition?.title || "Дополнительные сведения",
      description: definition?.description,
      knowledge: [],
    };
    current.knowledge.push(knowledge);
    grouped.set(groupId, current);
  }

  const order = [...definitions.map((definition) => definition.id), "additional"];
  return [...grouped.values()].sort(
    (left, right) => order.indexOf(left.id.split(".").at(-1) || "") - order.indexOf(right.id.split(".").at(-1) || ""),
  );
}

