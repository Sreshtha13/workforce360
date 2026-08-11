import { describe, it, expect } from "vitest";
import {
  assertPipelineTransition,
  evaluatePipelineTransition,
  getAllowedPipelineTransitions,
  nextSequentialStage,
} from "./pipeline-stage.service";
import { AppError } from "../lib/app-error";

describe("pipeline-stage.service", () => {
  describe("evaluatePipelineTransition", () => {
    it("allows adjacent forward moves without override", () => {
      expect(
        evaluatePipelineTransition({
          from: "APPLIED",
          to: "SCREENING",
          canOverride: false,
        }).allowed,
      ).toBe(true);
    });

    it("rejects forward skips without override", () => {
      const result = evaluatePipelineTransition({
        from: "APPLIED",
        to: "INTERVIEW",
        canOverride: false,
      });
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.code).toBe("PIPELINE_SKIP_FORBIDDEN");
      }
    });

    it("allows forward skips with override", () => {
      expect(
        evaluatePipelineTransition({
          from: "APPLIED",
          to: "OFFER",
          canOverride: true,
        }).allowed,
      ).toBe(true);
    });

    it("rejects backward moves without override", () => {
      const result = evaluatePipelineTransition({
        from: "INTERVIEW",
        to: "SCREENING",
        canOverride: false,
      });
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.code).toBe("PIPELINE_BACKWARD_FORBIDDEN");
      }
    });

    it("allows backward moves with override", () => {
      expect(
        evaluatePipelineTransition({
          from: "INTERVIEW",
          to: "SCREENING",
          canOverride: true,
        }).allowed,
      ).toBe(true);
    });

    it("always allows moving to REJECTED", () => {
      expect(
        evaluatePipelineTransition({
          from: "INTERVIEW",
          to: "REJECTED",
          canOverride: false,
        }).allowed,
      ).toBe(true);
    });

    it("requires override to leave REJECTED", () => {
      const result = evaluatePipelineTransition({
        from: "REJECTED",
        to: "APPLIED",
        canOverride: false,
      });
      expect(result.allowed).toBe(false);
    });

    it("requires override to leave HIRED", () => {
      const result = evaluatePipelineTransition({
        from: "HIRED",
        to: "OFFER",
        canOverride: false,
      });
      expect(result.allowed).toBe(false);
    });
  });

  describe("assertPipelineTransition", () => {
    it("throws AppError for forbidden transitions", () => {
      expect(() =>
        assertPipelineTransition({
          from: "OFFER",
          to: "SCREENING",
          canOverride: false,
        }),
      ).toThrow(AppError);
    });
  });

  describe("getAllowedPipelineTransitions", () => {
    it("offers only next stage and REJECTED without override", () => {
      const targets = getAllowedPipelineTransitions("SCREENING", false);
      expect(targets).toEqual(["INTERVIEW", "REJECTED"]);
    });

    it("offers no moves from HIRED without override", () => {
      expect(getAllowedPipelineTransitions("HIRED", false)).toEqual([]);
    });

    it("offers broader moves with override", () => {
      const targets = getAllowedPipelineTransitions("SCREENING", true);
      expect(targets).toContain("APPLIED");
      expect(targets).toContain("INTERVIEW");
      expect(targets).toContain("OFFER");
      expect(targets).toContain("HIRED");
      expect(targets).toContain("REJECTED");
    });
  });

  describe("nextSequentialStage", () => {
    it("returns the next ordered stage", () => {
      expect(nextSequentialStage("APPLIED")).toBe("SCREENING");
      expect(nextSequentialStage("OFFER")).toBe("HIRED");
      expect(nextSequentialStage("HIRED")).toBeNull();
      expect(nextSequentialStage("REJECTED")).toBeNull();
    });
  });
});
