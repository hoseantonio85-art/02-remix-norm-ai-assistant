export type ValueType = "text" | "date" | "year" | "list" | "number" | string;

export interface Attribute {
  key: string;
  label: string;
  value?: string | number | string[] | null;
  value_type?: ValueType;
  format?: {
    kind?: "text" | "identifier" | "number" | "money" | "percentage" | "date";
    currency?: string | null;
    unit?: string | null;
    decimals?: number | null;
    prefix?: string | null;
    suffix?: string | null;
  };
}

export interface Tag {
  code: string;
  label: string;
  tone?: "positive" | "neutral" | "warning" | "negative" | string;
}

export interface KnowledgeLink {
  label: string;
  url: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  value?: string | number | string[];
  description?: string;
  attributes: Attribute[];
  tags: Tag[];
  status?: { code: string; label: string; tone?: string };
  children?: KnowledgeItem[];
  links?: KnowledgeLink[];
}

export interface Source {
  id: string;
  type: string;
  name: string;
  dataset?: string;
  document_name?: string;
  official?: boolean;
}

export interface Freshness {
  code: "current" | "outdated" | "update_required" | string;
  label: string;
  reason?: string;
}

export interface AlertAction {
  type: string;
  label: string;
  target_item_id?: string;
}

export interface KnowledgeAlert {
  code: string;
  message: string;
  severity: "info" | "warning" | "error" | string;
  action?: AlertAction;
  target_item_id?: string;
}

export interface Presentation {
  variant:
    | "details"
    | "collection"
    | "table"
    | "narrative"
    | "metric"
    | "metrics"
    | "statistics"
    | "map_list"
    | "timeline"
    | "periods"
    | "risk_list"
    | string;
  page_size?: number;
}

export interface Knowledge {
  id: string;
  area_id: string;
  category: string;
  title: string;
  summary?: string;
  state: { code: string; label: string };
  items: KnowledgeItem[];
  actual_at: string;
  freshness: Freshness;
  alerts: KnowledgeAlert[];
  related_area_ids?: string[];
  presentation: Presentation;
  sources: Source[];
}

export interface Area {
  id: string;
  title: string;
  description?: string;
  knowledge: Knowledge[];
}

export interface CompanyProfile {
  schema_version: string;
  profile: {
    id: string;
    title: string;
    company: {
      short_name: string;
      full_name: string;
      inn: string;
      ogrn: string;
    };
    generated_at: string;
    freshness_reference_date: string;
    areas: Area[];
  };
  knowledge_contract?: unknown;
}