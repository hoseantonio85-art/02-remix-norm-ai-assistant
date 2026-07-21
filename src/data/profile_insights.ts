import raw from "./profile_insights.json";

export interface InsightPoint { text: string; evidenceKnowledgeIds?: string[] }
export interface RiskImpact { area: string; explanation: string; evidenceKnowledgeIds?: string[] }
export interface BlindSpot { text: string; relatedKnowledgeIds?: string[] }
export interface AreaInsight {
  summary: string;
  observations: InsightPoint[];
  conclusions: InsightPoint[];
  riskImpacts: RiskImpact[];
  blindSpots: BlindSpot[];
}
export type ProfileInsight = AreaInsight;

interface InsightsFile {
  profile: ProfileInsight;
  areas: Record<string, AreaInsight>;
}

export const INSIGHTS = raw as unknown as InsightsFile;

export function insightForArea(id: string): AreaInsight | undefined {
  return INSIGHTS.areas[id];
}
export function profileInsight(): ProfileInsight {
  return INSIGHTS.profile;
}