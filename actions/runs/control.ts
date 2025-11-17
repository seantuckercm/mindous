"use server";

import { db } from "@/db";
import { runsTable, runSubtasksTable } from "@/db/schema/progress-stream-schema";
import { eq, and } from "drizzle-orm";
import {
  publishRunPaused,
  publishRunResumed,
  publishRunCancelled,
  publishRunFailed
} from "./publish-event";

/**
 * Pause a running execution
 */
export async function pauseRun(
  runId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify run belongs to user and is in running state
    const [run] = await db
      .select()
      .from(runsTable)
      .where(and(eq(runsTable.id, runId), eq(runsTable.userId, userId)))
      .limit(1);

    if (!run) {
      return { success: false, error: "Run not found" };
    }

    if (run.status !== "running") {
      return { success: false, error: `Cannot pause run in ${run.status} state` };
    }

    // 2. Update run status to paused
    await db
      .update(runsTable)
      .set({
        status: "paused",
        pausedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(runsTable.id, runId));

    // 3. Publish pause event
    await publishRunPaused(runId);

    return { success: true };
  } catch (error) {
    console.error("Error pausing run:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Resume a paused execution
 */
export async function resumeRun(
  runId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify run belongs to user and is paused
    const [run] = await db
      .select()
      .from(runsTable)
      .where(and(eq(runsTable.id, runId), eq(runsTable.userId, userId)))
      .limit(1);

    if (!run) {
      return { success: false, error: "Run not found" };
    }

    if (run.status !== "paused") {
      return { success: false, error: `Cannot resume run in ${run.status} state` };
    }

    // 2. Update run status to resuming then running
    await db
      .update(runsTable)
      .set({
        status: "resuming",
        resumedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(runsTable.id, runId));

    // 3. Publish resume event
    await publishRunResumed(runId);

    // 4. Update to running (this would trigger actual execution logic)
    await db
      .update(runsTable)
      .set({
        status: "running",
        updatedAt: new Date()
      })
      .where(eq(runsTable.id, runId));

    return { success: true };
  } catch (error) {
    console.error("Error resuming run:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Cancel a running or paused execution
 */
export async function cancelRun(
  runId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify run belongs to user
    const [run] = await db
      .select()
      .from(runsTable)
      .where(and(eq(runsTable.id, runId), eq(runsTable.userId, userId)))
      .limit(1);

    if (!run) {
      return { success: false, error: "Run not found" };
    }

    if (!["queued", "starting", "running", "paused"].includes(run.status)) {
      return { success: false, error: `Cannot cancel run in ${run.status} state` };
    }

    // 2. Update run status to cancelled
    await db
      .update(runsTable)
      .set({
        status: "cancelled",
        endTime: new Date(),
        updatedAt: new Date()
      })
      .where(eq(runsTable.id, runId));

    // 3. Cancel all pending subtasks
    await db
      .update(runSubtasksTable)
      .set({
        status: "skipped",
        updatedAt: new Date()
      })
      .where(
        and(
          eq(runSubtasksTable.runId, runId),
          eq(runSubtasksTable.status, "pending")
        )
      );

    // 4. Publish cancel event
    await publishRunCancelled(runId);

    return { success: true };
  } catch (error) {
    console.error("Error cancelling run:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Get current run status
 */
export async function getRunStatus(
  runId: string,
  userId: string
): Promise<{
  success: boolean;
  status?: string;
  progress?: number;
  error?: string;
}> {
  try {
    const [run] = await db
      .select()
      .from(runsTable)
      .where(and(eq(runsTable.id, runId), eq(runsTable.userId, userId)))
      .limit(1);

    if (!run) {
      return { success: false, error: "Run not found" };
    }

    return {
      success: true,
      status: run.status,
      progress: run.progress || 0
    };
  } catch (error) {
    console.error("Error getting run status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Update run progress
 */
export async function updateRunProgress(
  runId: string,
  progress: number,
  currentStep?: string,
  completedSteps?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(runsTable)
      .set({
        progress: Math.min(100, Math.max(0, progress)),
        currentStep: currentStep || undefined,
        completedSteps: completedSteps !== undefined ? completedSteps : undefined,
        updatedAt: new Date()
      })
      .where(eq(runsTable.id, runId));

    return { success: true };
  } catch (error) {
    console.error("Error updating run progress:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Mark run as failed
 */
export async function failRun(
  runId: string,
  error: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(runsTable)
      .set({
        status: "failed",
        error,
        endTime: new Date(),
        updatedAt: new Date()
      })
      .where(eq(runsTable.id, runId));

    await publishRunFailed(runId, error);

    return { success: true };
  } catch (err) {
    console.error("Error marking run as failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error"
    };
  }
}

/**
 * Get run details with subtasks
 */
export async function getRunDetails(
  runId: string,
  userId: string
): Promise<{
  success: boolean;
  run?: any;
  subtasks?: any[];
  error?: string;
}> {
  try {
    const [run] = await db
      .select()
      .from(runsTable)
      .where(and(eq(runsTable.id, runId), eq(runsTable.userId, userId)))
      .limit(1);

    if (!run) {
      return { success: false, error: "Run not found" };
    }

    const subtasks = await db
      .select()
      .from(runSubtasksTable)
      .where(eq(runSubtasksTable.runId, runId))
      .orderBy(runSubtasksTable.order);

    return {
      success: true,
      run,
      subtasks
    };
  } catch (error) {
    console.error("Error getting run details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
