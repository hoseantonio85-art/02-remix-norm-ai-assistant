import { describe, expect, it } from "vitest";
import { getLocalKnowledgeDataset, localKnowledgeService } from "./knowledgeService";

describe("knowledgeService", () => {
  it("exposes only the Zvuk dataset through the service boundary", async () => {
    const dataset = await localKnowledgeService.loadCompanyKnowledge();

    expect(dataset.id).toBe("zvuk");
    expect(dataset.label).toBe("Звук");
    expect(dataset.fileName).toBe("profile_result_qwen.json");
    expect(dataset.areas.length).toBeGreaterThan(0);
  });

  it("returns independent normalized collections", () => {
    const first = getLocalKnowledgeDataset();
    const second = getLocalKnowledgeDataset();

    expect(first.areas).not.toBe(second.areas);
    expect(first.areas).toEqual(second.areas);
  });
});
