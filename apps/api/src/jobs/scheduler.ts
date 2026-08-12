import cron from "node-cron";
import { env } from "../lib/env";
import { reportService } from "../services/report.service";
import { ApprovalService } from "../services/approval.service";

let started = false;

/**
 * Background scheduler for due report schedules and approval escalations.
 * Skipped when NODE_ENV === "test".
 */
export function startScheduler(): void {
  if (started) return;
  if (env.NODE_ENV === "test") {
    console.log("[scheduler] skipped in test environment");
    return;
  }

  started = true;
  const approvalService = new ApprovalService();

  // Every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("[scheduler] tick — running due schedules & escalations");
    try {
      const reportResult = await reportService.runDueSchedules();
      console.log(
        `[scheduler] reports processed=${reportResult.processed} errors=${reportResult.errors.length}`,
      );
    } catch (err) {
      console.error("[scheduler] report schedules failed", err);
    }

    try {
      if (typeof approvalService.escalateOverdueSteps === "function") {
        const result = await approvalService.escalateOverdueSteps("system");
        console.log("[scheduler] approval escalations", result);
      }
    } catch (err) {
      console.error("[scheduler] approval escalations failed", err);
    }
  });

  console.log("[scheduler] started (every 10 minutes)");
}
