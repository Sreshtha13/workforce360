import { describe, it, expect } from "vitest";
import {
  evaluatePipelineTransition,
  getAllowedPipelineTransitions,
} from "@/lib/pipeline-stage";

describe("pipeline-stage (frontend mirror)", () => {
  it("matches backend adjacent-forward rule", () => {
    expect(
      evaluatePipelineTransition({
        from: "APPLIED",
        to: "SCREENING",
        canOverride: false,
      }).allowed,
    ).toBe(true);
  });

  it("blocks skip and backward without override", () => {
    expect(
      evaluatePipelineTransition({
        from: "APPLIED",
        to: "INTERVIEW",
        canOverride: false,
      }).allowed,
    ).toBe(false);
    expect(
      evaluatePipelineTransition({
        from: "INTERVIEW",
        to: "SCREENING",
        canOverride: false,
      }).allowed,
    ).toBe(false);
  });

  it("exposes only sequential targets without override", () => {
    expect(getAllowedPipelineTransitions("INTERVIEW", false)).toEqual([
      "OFFER",
      "REJECTED",
    ]);
  });
});
