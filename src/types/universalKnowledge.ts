export type KnowledgeStateCode =
  | "known"
  | "partial"
  | "known_empty"
  | "unknown"
  | "not_applicable"
  | "conflicting";

export interface KnowledgeState {
  code: KnowledgeStateCode;
  label: string;
}

export type KnowledgeValueType =
  | "string"
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "enum"
  | "url"
  | "object"
  | "array";

export interface KnowledgeFormat {
  kind?: "text" | "identifier" | "money" | "percentage" | "date" | "number";
  currency?: string | null;
  unit?: string | null;
  decimals?: number | null;
  datePattern?: string | null;
  prefix?: string | null;
  suffix?: string | null;
}

export interface KnowledgeSourceReference {
  sourceId: string;
  quote?: string | null;
  locator?: {
    page?: number | null;
    section?: string | null;
    field?: string | null;
    dataset?: string | null;
    recordId?: string | null;
  };
}

export interface KnowledgeMetadata {
  actualAt?: string | null;
  validFrom?: string | null;
  validityTo?: string | null;
  freshness?: {
    code: string | null;
    label: string | null;
    reason?: string | null;
  };
  origin?: {
    type: string | null;
    name: string | null;
  };
  sourceEvidence?: KnowledgeSourceReference[];
  confidence?: number | null;
  riskRelevanceScore?: number | null;
}

export interface KnowledgeNode {
  id: string;
  key: string;
  label?: string | null;
  valueType: KnowledgeValueType;
  value?: string | number | boolean | null;
  displayValue?: string | null;
  children?: KnowledgeNode[];
  state?: KnowledgeState;
  format?: KnowledgeFormat | null;
  metadata?: KnowledgeMetadata | null;
}

export interface KnowledgeSource {
  id: string;
  type: string;
  name: string;
  dataset?: string | null;
  documentName?: string | null;
  url?: string | null;
  official?: boolean;
  actualAt?: string | null;
}

export interface UniversalKnowledgeTag {
  code: string;
  label: string;
  tone?: string;
}

export interface UniversalKnowledgeAlert {
  id: string;
  code: string;
  severity: string;
  message: string;
}

export interface UniversalKnowledge {
  id: string;
  areaId: string;
  key: string;
  title: string;
  description?: string | null;
  state: KnowledgeState;
  required?: boolean;
  coverageWeight?: number;
  order?: number;
  content: KnowledgeNode;
  metadata?: KnowledgeMetadata | null;
  sources?: KnowledgeSource[];
  tags?: UniversalKnowledgeTag[];
  alerts?: UniversalKnowledgeAlert[];
}

export interface UniversalKnowledgeDemo {
  areaId: string;
  knowledge: UniversalKnowledge[];
}