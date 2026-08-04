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
  reason?: string | null;
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
  kind?:
    | "text"
    | "identifier"
    | "money"
    | "percentage"
    | "date"
    | "datetime"
    | "number"
    | "duration";
  currency?: string | null;
  unit?: string | null;
  decimals?: number | null;
  datePattern?: string | null;
  timezone?: string | null;
  prefix?: string | null;
  suffix?: string | null;
  trueLabel?: string | null;
  falseLabel?: string | null;
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
    sheet?: string | null;
    range?: string | null;
  };
}

export interface KnowledgeActor {
  type: string;
  id?: string | null;
  name?: string | null;
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
  scope?: {
    type?: string | null;
    id?: string | null;
    label?: string | null;
  };
  sourceEvidence?: KnowledgeSourceReference[];
  confidence?: number | null;
  riskRelevanceScore?: number | null;
  access?: {
    classification?: string | null;
    containsPersonalData?: boolean;
  };
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: KnowledgeActor | null;
  updatedBy?: KnowledgeActor | null;
  raw?: Record<string, unknown> | null;
}

export interface KnowledgeCollectionInfo {
  totalCount?: number | null;
  loadedCount?: number | null;
  truncated?: boolean;
  nextCursor?: string | null;
}

export interface KnowledgeNode {
  id: string;
  key: string;
  label?: string | null;
  semanticRole?: "value" | "summary" | "attribute" | "item" | "group" | null;
  valueType: KnowledgeValueType;
  value?: string | number | boolean | null;
  displayValue?: string | null;
  enumLabels?: Record<string, string>;
  children?: KnowledgeNode[];
  state?: KnowledgeState;
  format?: KnowledgeFormat | null;
  metadata?: KnowledgeMetadata | null;
  status?: { code: string; label: string; tone?: string | null } | null;
  tags?: { code: string; label: string; tone?: string | null }[];
  links?: { label: string; url: string }[];
  collection?: KnowledgeCollectionInfo | null;
}

export interface KnowledgeSource {
  id: string;
  type: string;
  name: string;
  dataset?: string | null;
  documentId?: string | null;
  documentName?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  downloadUrl?: string | null;
  url?: string | null;
  official?: boolean;
  actualAt?: string | null;
  receivedAt?: string | null;
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
  targetItemId?: string | null;
  action?: {
    type: string;
    label: string;
    targetItemId?: string | null;
  } | null;
}

export type EpistemicKind =
  | "fact"
  | "calculation"
  | "observation"
  | "conclusion"
  | "hypothesis";

export interface KnowledgeDerivation {
  method: string;
  basedOnKnowledgeIds: string[];
  formula?: string | null;
  model?: string | null;
  generatedAt?: string | null;
}

export interface UniversalKnowledgeRelation {
  id?: string | null;
  type: string;
  targetAreaId?: string | null;
  targetKnowledgeId?: string | null;
  targetObjectType?: string | null;
  targetObjectId?: string | null;
  label?: string | null;
  description?: string | null;
}

export interface UniversalKnowledge {
  schemaVersion: "2.0";
  id: string;
  areaId: string;
  key: string;
  title: string;
  description?: string | null;
  epistemicKind: EpistemicKind;
  derivation?: KnowledgeDerivation | null;
  state: KnowledgeState;
  required?: boolean;
  coverageWeight?: number;
  order?: number;
  content: KnowledgeNode;
  metadata?: KnowledgeMetadata | null;
  sources?: KnowledgeSource[];
  tags?: UniversalKnowledgeTag[];
  alerts?: UniversalKnowledgeAlert[];
  relations?: UniversalKnowledgeRelation[];
}

export interface UniversalArea {
  id: string;
  title: string;
  description?: string | null;
  knowledge: UniversalKnowledge[];
}

export interface UniversalKnowledgeDemo {
  areaId: string;
  knowledge: UniversalKnowledge[];
}
