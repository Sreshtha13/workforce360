/**
 * Pipeline stage transition helpers — mirror of backend pipeline-stage.service.ts.
 * Keep rules identical; backend remains the source of truth for enforcement.
 */

import type { PipelineStatus } from "@/types/phase2";
import { PIPELINE_STATUSES } from "@/types/phase2";

/** Ordered forward stages (excludes REJECTED). */
export const PIPELINE_STAGE_ORDER: PipelineStatus[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
];

function stageIndex(status: PipelineStatus): number {
  return PIPELINE_STAGE_ORDER.indexOf(status);
}

export function evaluatePipelineTransition(input: {
  from: PipelineStatus;
  to: PipelineStatus;
  canOverride: boolean;
}): { allowed: boolean } {
  const { from, to, canOverride } = input;

  if (from === to) return { allowed: true };
  if (to === "REJECTED") {
    if (from === "HIRED" && !canOverride) return { allowed: false };
    return { allowed: true };
  }

  const fromIdx = stageIndex(from);
  const toIdx = stageIndex(to);

  if (from === "REJECTED" || fromIdx < 0) {
    return { allowed: Boolean(canOverride && toIdx >= 0) };
  }

  if (toIdx < 0) return { allowed: false };

  if (from === "HIRED") {
    return { allowed: canOverride };
  }

  if (toIdx < fromIdx) {
    return { allowed: canOverride };
  }

  if (toIdx === fromIdx + 1) {
    return { allowed: true };
  }

  if (toIdx > fromIdx + 1) {
    return { allowed: canOverride };
  }

  return { allowed: true };
}

/** Statuses the UI may offer as move targets from the current stage. */
export function getAllowedPipelineTransitions(
  current: PipelineStatus,
  canOverride: boolean,
): PipelineStatus[] {
  return PIPELINE_STATUSES.filter((status) => {
    if (status === current) return false;
    return evaluatePipelineTransition({ from: current, to: status, canOverride }).allowed;
  });
}
