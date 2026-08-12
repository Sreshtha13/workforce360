import { describe, it, expect } from "vitest";
import { matchesAllConditions, matchesCondition } from "../lib/approval-conditions";

describe("approval condition matching", () => {
  it("matches eq / gt / in operators", () => {
    expect(matchesCondition({ field: "priority", operator: "eq", value: "HIGH" }, { priority: "HIGH" })).toBe(true);
    expect(matchesCondition({ field: "amount", operator: "gt", value: "1000" }, { amount: 2500 })).toBe(true);
    expect(matchesCondition({ field: "amount", operator: "gt", value: "1000" }, { amount: 500 })).toBe(false);
    expect(matchesCondition({ field: "priority", operator: "in", value: "HIGH,URGENT" }, { priority: "URGENT" })).toBe(true);
  });

  it("requires all conditions (AND) for workflow match", () => {
    const conditions = [
      { field: "amount", operator: "gte", value: "1000" },
      { field: "category", operator: "eq", value: "TRAVEL" },
    ];
    expect(matchesAllConditions(conditions, { amount: 1500, category: "TRAVEL" })).toBe(true);
    expect(matchesAllConditions(conditions, { amount: 1500, category: "MEALS" })).toBe(false);
    expect(matchesAllConditions([], { amount: 1 })).toBe(true);
  });
});

describe("multi-level approve progression (pure level math)", () => {
  it("advances currentLevel until totalLevels then marks approved", () => {
    function nextState(currentLevel: number, totalLevels: number) {
      if (currentLevel >= totalLevels) {
        return { status: "APPROVED" as const, currentLevel };
      }
      return { status: "PENDING" as const, currentLevel: currentLevel + 1 };
    }

    expect(nextState(1, 2)).toEqual({ status: "PENDING", currentLevel: 2 });
    expect(nextState(2, 2)).toEqual({ status: "APPROVED", currentLevel: 2 });
  });
});
