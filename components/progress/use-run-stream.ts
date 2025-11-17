"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface RunEvent {
  id: string;
  runId: string;
  subtaskId: string | null;
  eventType: string;
  message: string;
  data: any;
  timestamp: string;
}

export interface RunState {
  id: string;
  status: string;
  title: string;
  description?: string;
  progress: number;
  currentStep?: string;
  totalSteps: number;
  completedSteps: number;
  startTime?: string;
  endTime?: string;
  error?: string;
  subtasks: SubtaskState[];
  artifacts: ArtifactState[];
  logs: LogEntry[];
}

export interface SubtaskState {
  id: string;
  title: string;
  description?: string;
  status: string;
  order: number;
  progress: number;
  startTime?: string;
  endTime?: string;
  error?: string;
}

export interface ArtifactState {
  id: string;
  name: string;
  type: string;
  path?: string;
  createdAt: string;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
}

export interface UseRunStreamOptions {
  runId: string;
  onEvent?: (event: RunEvent) => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useRunStream({
  runId,
  onEvent,
  onError,
  onConnected,
  onDisconnected
}: UseRunStreamOptions) {
  const [runState, setRunState] = useState<RunState>({
    id: runId,
    status: "queued",
    title: "Loading...",
    progress: 0,
    totalSteps: 0,
    completedSteps: 0,
    subtasks: [],
    artifacts: [],
    logs: []
  });

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventIdRef = useRef<string | null>(null);

  // Process incoming events and update state
  const processEvent = useCallback((event: RunEvent) => {
    lastEventIdRef.current = event.timestamp;

    setRunState(prev => {
      const newState = { ...prev };

      switch (event.eventType) {
        case "RUN_STARTED":
          newState.status = "running";
          newState.title = event.data?.title || prev.title;
          newState.totalSteps = event.data?.totalSteps || 0;
          newState.startTime = event.timestamp;
          break;

        case "RUN_PROGRESS":
          newState.progress = event.data?.progress || prev.progress;
          newState.currentStep = event.data?.currentStep || prev.currentStep;
          break;

        case "RUN_PAUSED":
          newState.status = "paused";
          break;

        case "RUN_RESUMED":
          newState.status = "running";
          break;

        case "RUN_COMPLETED":
          newState.status = "completed";
          newState.progress = 100;
          newState.endTime = event.timestamp;
          break;

        case "RUN_FAILED":
          newState.status = "failed";
          newState.error = event.data?.error || "Unknown error";
          newState.endTime = event.timestamp;
          break;

        case "RUN_CANCELLED":
          newState.status = "cancelled";
          newState.endTime = event.timestamp;
          break;

        case "SUBTASK_CREATED": {
          const existingIndex = newState.subtasks.findIndex(
            s => s.id === event.data?.subtaskId
          );
          
          const subtask: SubtaskState = {
            id: event.data?.subtaskId,
            title: event.data?.title || "Untitled",
            status: "pending",
            order: event.data?.order || 0,
            progress: 0
          };

          if (existingIndex >= 0) {
            newState.subtasks[existingIndex] = subtask;
          } else {
            newState.subtasks.push(subtask);
            newState.subtasks.sort((a, b) => a.order - b.order);
          }
          break;
        }

        case "SUBTASK_STARTED": {
          const subtaskIndex = newState.subtasks.findIndex(
            s => s.id === event.subtaskId
          );
          if (subtaskIndex >= 0) {
            newState.subtasks[subtaskIndex] = {
              ...newState.subtasks[subtaskIndex],
              status: "in_progress",
              startTime: event.timestamp
            };
          }
          break;
        }

        case "SUBTASK_PROGRESS": {
          const subtaskIndex = newState.subtasks.findIndex(
            s => s.id === event.subtaskId
          );
          if (subtaskIndex >= 0) {
            newState.subtasks[subtaskIndex] = {
              ...newState.subtasks[subtaskIndex],
              progress: event.data?.progress || 0
            };
          }
          break;
        }

        case "SUBTASK_COMPLETED": {
          const subtaskIndex = newState.subtasks.findIndex(
            s => s.id === event.subtaskId
          );
          if (subtaskIndex >= 0) {
            newState.subtasks[subtaskIndex] = {
              ...newState.subtasks[subtaskIndex],
              status: "completed",
              progress: 100,
              endTime: event.timestamp
            };
            newState.completedSteps = prev.completedSteps + 1;
          }
          break;
        }

        case "SUBTASK_FAILED": {
          const subtaskIndex = newState.subtasks.findIndex(
            s => s.id === event.subtaskId
          );
          if (subtaskIndex >= 0) {
            newState.subtasks[subtaskIndex] = {
              ...newState.subtasks[subtaskIndex],
              status: "failed",
              error: event.data?.error || "Unknown error",
              endTime: event.timestamp
            };
          }
          break;
        }

        case "ARTIFACT_CREATED": {
          const artifact: ArtifactState = {
            id: event.data?.artifactId,
            name: event.data?.name || "Unnamed",
            type: event.data?.type || "file",
            createdAt: event.timestamp
          };
          newState.artifacts.push(artifact);
          break;
        }

        case "LOG_MESSAGE": {
          const log: LogEntry = {
            timestamp: event.timestamp,
            level: event.data?.level || "info",
            message: event.data?.message || event.message
          };
          newState.logs.push(log);
          // Keep only last 100 logs
          if (newState.logs.length > 100) {
            newState.logs = newState.logs.slice(-100);
          }
          break;
        }
      }

      return newState;
    });

    // Call event callback if provided
    if (onEvent) {
      onEvent(event);
    }
  }, [onEvent]);

  // Connect to SSE stream
  const connect = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Build URL with lastEventId for reconnection
      const url = lastEventIdRef.current
        ? `/api/streams/runs/${runId}?lastEventId=${encodeURIComponent(lastEventIdRef.current)}`
        : `/api/streams/runs/${runId}`;

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener("connected", () => {
        console.log("✅ Connected to run stream");
        setIsConnected(true);
        setError(null);
        setReconnectAttempt(0);
        if (onConnected) {
          onConnected();
        }
      });

      eventSource.addEventListener("event", (e) => {
        try {
          const event: RunEvent = JSON.parse(e.data);
          processEvent(event);
        } catch (err) {
          console.error("Error parsing event:", err);
        }
      });

      eventSource.addEventListener("history-complete", (e) => {
        console.log("📜 History replay complete");
      });

      eventSource.addEventListener("replay-complete", (e) => {
        console.log("🔄 Missed events replay complete");
      });

      eventSource.addEventListener("run-finished", (e) => {
        console.log("🏁 Run finished");
      });

      eventSource.addEventListener("error", (e) => {
        console.error("❌ SSE error:", e);
        setIsConnected(false);
        
        const err = new Error("SSE connection error");
        setError(err);
        
        if (onError) {
          onError(err);
        }

        // Attempt reconnection with exponential backoff
        const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
        console.log(`Reconnecting in ${backoffMs}ms...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempt(prev => prev + 1);
          connect();
        }, backoffMs);
      });

      eventSource.onerror = () => {
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log("SSE connection closed");
          setIsConnected(false);
          if (onDisconnected) {
            onDisconnected();
          }
        }
      };

    } catch (err) {
      console.error("Error creating EventSource:", err);
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      if (onError) {
        onError(error);
      }
    }
  }, [runId, reconnectAttempt, processEvent, onConnected, onError, onDisconnected]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  return {
    runState,
    isConnected,
    error,
    reconnect: connect
  };
}
