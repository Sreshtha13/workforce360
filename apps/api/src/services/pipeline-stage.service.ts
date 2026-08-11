import type { CandidatePipelineStatus } from "@prisma/client";
import { AppError } from "../lib/app-error";

/**
 * Ordered forward pipeline stages (REJECTED is a side-exit, not in this list).
 * Keep in sync with apps/web/lib/pipeline-stage.ts
 */
export const PIPELINE_STAGE_ORDER: CandidatePipelineStatus[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
];

export type PipelineTransitionContext = {
  from: CandidatePipelineStatus;
  to: CandidatePipelineStatus;
  canOverride: boolean;
};

export type PipelineTransitionResult =
  | { allowed: true }
  | { allowed: false; code: string; message: string };

function stageIndex(status: CandidatePipelineStatus): number {
  return PIPELINE_STAGE_ORDER.indexOf(status);
}

/**
 * Validates a pipeline stage transition.
 *
 * Rules (centralized — used by recruitment service and mirrored on the frontend):
 * - No-op (same stage) is allowed
 * - Moving to REJECTED is always allowed (side exit)
 * - Terminal HIRED / REJECTED → any other stage requires override
 * - Backward moves require override
 * - Forward skips (non-adjacent) require override
 * - Adjacent forward moves are always allowed without override
 */
export function evaluatePipelineTransition(
  ctx: PipelineTransitionContext,
): PipelineTransitionResult {
  const { from, to, canOverride } = ctx;

  if (from === to) {
    return { allowed: true };
  }

  if (to === "REJECTED") {
    if (from === "HIRED" && !canOverride) {
      return {
        allowed: false,
        code: "PIPELINE_OVERRIDE_REQUIRED",
        message:
          "Cannot reject a hired application without pipeline override permission",
      };
    }
    return { allowed: true };
  }

  const fromIdx = stageIndex(from);
  const toIdx = stageIndex(to);

  // Leaving REJECTED (or unknown) into an ordered stage
  if (from === "REJECTED" || fromIdx < 0) {
    if (canOverride && toIdx >= 0) {
      return { allowed: true };
    }
    return {
      allowed: false,
      code: "PIPELINE_OVERRIDE_REQUIRED",
      message:
        "Cannot reactivate a rejected application without pipeline override permission",
    };
  }

  if (toIdx < 0) {
    return {
      allowed: false,
      code: "INVALID_PIPELINE_STAGE",
      message: `Unknown pipeline stage: ${to}`,
    };
  }

  // From HIRED (terminal) to any ordered stage
  if (from === "HIRED") {
    if (canOverride) {
      return { allowed: true };
    }
    return {
      allowed: false,
      code: "PIPELINE_OVERRIDE_REQUIRED",
      message:
        "Cannot move a hired application to another stage without pipeline override permission",
    };
  }

  // Backward
  if (toIdx < fromIdx) {
    if (canOverride) {
      return { allowed: true };
    }
    return {
      allowed: false,
      code: "PIPELINE_BACKWARD_FORBIDDEN",
      message:
        "Cannot move candidate to an earlier pipeline stage without override permission",
    };
  }

  // Adjacent forward
  if (toIdx === fromIdx + 1) {
    return { allowed: true };
  }

  // Forward skip
  if (toIdx > fromIdx + 1) {
    if (canOverride) {
      return { allowed: true };
    }
    return {
      allowed: false,
      code: "PIPELINE_SKIP_FORBIDDEN",
      message:
        "Cannot skip pipeline stages without override permission. Move to the next stage only.",
    };
  }

  return { allowed: true };
}

export function assertPipelineTransition(ctx: PipelineTransitionContext): void {
  const result = evaluatePipelineTransition(ctx);
  if (!result.allowed) {
    throw new AppError(result.code, result.message, 400);
  }
}

/**
 * Returns statuses the UI may offer as move targets from the current stage.
 */
export function getAllowedPipelineTransitions(
  current: CandidatePipelineStatus,
  canOverride: boolean,
): CandidatePipelineStatus[] {
  const targets: CandidatePipelineStatus[] = [];

  for (const status of [...PIPELINE_STAGE_ORDER, "REJECTED" as const]) {
    if (status === current) continue;
    const result = evaluatePipelineTransition({
      from: current,
      to: status,
      canOverride,
    });
    if (result.allowed) {
      targets.push(status);
    }
  }

  return targets;
}

export function nextSequentialStage(
  current: CandidatePipelineStatus,
): CandidatePipelineStatus | null {
  const idx = stageIndex(current);
  if (idx < 0 || idx >= PIPELINE_STAGE_ORDER.length - 1) return null;
  return PIPELINE_STAGE_ORDER[idx + 1] ?? null;
}
