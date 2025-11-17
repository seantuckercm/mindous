"use server";

import { db } from "@/db";
import { runEventsTable, eventTypeEnum } from "@/db/schema/progress-stream-schema";
import { publishEvent, getRunChannel } from "@/lib/redis";

export type EventType = typeof eventTypeEnum.enumValues[number];

export interface PublishEventData {
  runId: string;
  subtaskId?: string;
  eventType: EventType;
  message: string;
  data?: any;
}

/**
 * Publish a progress event to both database and Redis channel
 */
export async function publishProgressEvent({
  runId,
  subtaskId,
  eventType,
  message,
  data
}: PublishEventData): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Store event in database for replay capability
    const [event] = await db.insert(runEventsTable).values({
      runId,
      subtaskId: subtaskId || null,
      eventType,
      message,
      data: data || null,
    }).returning();

    // 2. Publish event to Redis channel for real-time streaming
    const channel = getRunChannel(runId);
    const eventPayload = {
      id: event.id,
      runId,
      subtaskId: subtaskId || null,
      eventType,
      message,
      data: data || null,
      timestamp: event.timestamp.toISOString(),
    };

    await publishEvent(channel, eventPayload);

    return { success: true };
  } catch (error) {
    console.error("Error publishing progress event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Publish RUN_STARTED event
 */
export async function publishRunStarted(
  runId: string,
  title: string,
  totalSteps?: number
): Promise<{ success: boolean; error?: string }> {
  return publishProgressEvent({
    runId,
    eventType: "RUN_STARTED",
    message: `Started: ${title}`,
    data: { title, totalSteps }
  });
}

/**
 * Publish RUN_PROGRESS event
 */
export async function publishRunProgress(
  runId: string,
  progress: number,
  currentStep: string
): Promise<{ success: boolean; error?: string }> {
  return publishProgressEvent({
    runId,
    eventType: "RUN_PROGRESS",
    message: `Progress: ${progress}% - ${currentStep}`,
    data: { progress, currentStep }
  });
}

/**
 * Publish RUN_COMPLETED event
 */
export async function publishRunCompleted(
  runId: string,
  result?: any
): Promise<{ success: boolean; error?: string }> {
  return publishProgressEvent({
    runId,
    eventType: "RUN_COMPLETED",
    message: "Run completed successfully",
    data: { result }
  });
}

/**
 * Publish RUN_FAILED event
 */
export async function publishRunFailed(
  runId: string,
  error: string
): Promise<{ success: boolean; error?: string }> {
  return publishProgressEvent({
    runId,
    eventType: "RUN_FAILED",
    message: `Run failed: ${error}`,
    data: { error }
  });
}

/**
 * Publish RUN_PAUSED event
 */
export async function publishRunPaused(
  runId: string
): Promise<{ success: boolean; error?: string }> {
  return publishProgressEvent({
    runId,
    eventType: "RUN_PAUSED",
    message: "Run paused",
    data: {}
  });
}

/**
 * Publish RUN_RESUMED event
 */
export async function publishRunResumed(
  runId: string
): Promise<{ success: boolean; error?: string }> {
  return publishProgressEvent({
    runId,
    eventType: "RUN_RESUMED",
    message: "Run resumed",
    data: {}
  });
}

/**
 * Publish RUN_CANCELLED event
 */
export async function publishRunCancelled(
  runId: string
): Promise<{ success: boolean; error?: string }> {
  return publishProgressEvent({
    runId,
    eventType: "RUN_CANCELLED",
    message: "Run cancelled",
    data: {}
  });
}

/**
 * Publish SUBTASK_CREATED event
 */
export async function publishSubtaskCreated(
  runId: string,
  subtaskId: string,
  title: string,
  order: number
): Promise<{ success: boolean; error?: string }> {
  return publishProgressEvent({
    runId,
    subtaskId,
    eventType: "SUBTASK_CREATED",
    message: `Subtask created: ${title}`,
    data: { subtaskId, title, order }
  });
}

/**
 * Publish SUBTASK_STARTED event
 */
export async function publishSubtaskStarted(
  runId: string,
  subtaskId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  return publishProgressEvent({
    runId,
    subtaskId,
    eventType: "SUBTASK_STARTED",
    message: `Started: ${title}`,
    data: { subtaskId, title }
  });
}

/**
 * Publish SUBTASK_PROGRESS event
 */
export async function publishSubtaskProgress(
  runId: string,
  subtaskId: string,
  progress: number,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  return publishProgressEvent({
    runId,
    subtaskId,
    eventType: "SUBTASK_PROGRESS",
    message: message || `Progress: ${progress}%`,
    data: { subtaskId, progress }
  });
}

/**
 * Publish SUBTASK_COMPLETED event
 */
export async function publishSubtaskCompleted(
  runId: string,
  subtaskId: string,
  result?: any
): Promise<{ success: boolean; error?: string }> {
  return publishProgressEvent({
    runId,
    subtaskId,
    eventType: "SUBTASK_COMPLETED",
    message: "Subtask completed",
    data: { subtaskId, result }
  });
}

/**
 * Publish SUBTASK_FAILED event
 */
export async function publishSubtaskFailed(
  runId: string,
  subtaskId: string,
  error: string
): Promise<{ success: boolean; error?: string }> {
  return publishProgressEvent({
    runId,
    subtaskId,
    eventType: "SUBTASK_FAILED",
    message: `Subtask failed: ${error}`,
    data: { subtaskId, error }
  });
}

/**
 * Publish ARTIFACT_CREATED event
 */
export async function publishArtifactCreated(
  runId: string,
  artifactId: string,
  name: string,
  type: string,
  subtaskId?: string
): Promise<{ success: boolean; error?: string }> {
  return publishProgressEvent({
    runId,
    subtaskId,
    eventType: "ARTIFACT_CREATED",
    message: `Artifact created: ${name}`,
    data: { artifactId, name, type }
  });
}

/**
 * Publish LOG_MESSAGE event
 */
export async function publishLogMessage(
  runId: string,
  message: string,
  level: "info" | "warning" | "error" = "info",
  subtaskId?: string
): Promise<{ success: boolean; error?: string }> {
  return publishProgressEvent({
    runId,
    subtaskId,
    eventType: "LOG_MESSAGE",
    message,
    data: { level, message }
  });
}
