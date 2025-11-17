
"use client";

import { useState, useCallback } from "react";
import { TaskCard, TaskStatus } from "./task-card";
import { StatusBar, StatusBarSpacer } from "./status-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Pause, Square, Play, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRunStream } from "@/components/progress/use-run-stream";
import { pauseRun, cancelRun, resumeRun } from "@/actions/runs/control";
import { useAuth } from "@clerk/nextjs";

// Types for run and subtasks
export interface Subtask {
  id: string;
  title: string;
  status: TaskStatus;
  statusDetail?: string;
  startedAt?: Date;
  finishedAt?: Date;
  errorMessage?: string;
  order: number;
}

export interface RunData {
  id: string;
  title: string;
  status: TaskStatus;
  subtasks: Subtask[];
  startedAt: Date;
  finishedAt?: Date;
}

export interface RunProgressPanelProps {
  runId: string;
  className?: string;
}

// Map streaming status to TaskStatus
const mapStatusToTaskStatus = (status: string): TaskStatus => {
  switch (status) {
    case "queued":
    case "starting":
      return "pending";
    case "running":
    case "resuming":
      return "running";
    case "paused":
      return "paused";
    case "completed":
      return "succeeded";
    case "failed":
      return "failed";
    case "cancelled":
      return "canceled";
    default:
      return "pending";
  }
};

export function RunProgressPanel({
  runId,
  className,
}: RunProgressPanelProps) {
  const { userId } = useAuth();
  const [isPausing, setIsPausing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  // Use the real-time streaming hook
  const { runState, isConnected, error, reconnect } = useRunStream({
    runId,
    onConnected: () => {
      console.log("✅ Connected to run stream");
    },
    onDisconnected: () => {
      console.log("⚠️ Disconnected from run stream");
    },
    onError: (err) => {
      console.error("❌ Stream error:", err);
      toast.error("Connection error. Attempting to reconnect...");
    }
  });

  // Calculate current task and subtask numbers
  const getCurrentProgress = useCallback(() => {
    const totalSubtasks = runState.subtasks.length;
    const currentSubtask = runState.completedSteps + 1;
    const currentOperation = runState.currentStep;

    return {
      currentTask: 1,
      totalTasks: 1,
      currentSubtask: Math.min(currentSubtask, totalSubtasks),
      totalSubtasks: totalSubtasks || 1,
      currentOperation,
    };
  }, [runState]);

  // Handle pause action
  const handlePause = async () => {
    if (!userId) {
      toast.error('Not authenticated');
      return;
    }

    setIsPausing(true);
    try {
      const result = await pauseRun(runId, userId);
      if (result.success) {
        toast.success('Run paused successfully');
      } else {
        toast.error(result.error || 'Failed to pause run');
      }
    } catch (error) {
      console.error('Error pausing run:', error);
      toast.error('Failed to pause run');
    } finally {
      setIsPausing(false);
    }
  };

  // Handle cancel action
  const handleCancel = async () => {
    if (!userId) {
      toast.error('Not authenticated');
      return;
    }

    setIsCanceling(true);
    try {
      const result = await cancelRun(runId, userId);
      if (result.success) {
        toast.success('Run canceled successfully');
      } else {
        toast.error(result.error || 'Failed to cancel run');
      }
    } catch (error) {
      console.error('Error canceling run:', error);
      toast.error('Failed to cancel run');
    } finally {
      setIsCanceling(false);
    }
  };

  // Handle resume action
  const handleResume = async () => {
    if (!userId) {
      toast.error('Not authenticated');
      return;
    }

    setIsResuming(true);
    try {
      const result = await resumeRun(runId, userId);
      if (result.success) {
        toast.success('Run resumed successfully');
      } else {
        toast.error(result.error || 'Failed to resume run');
      }
    } catch (error) {
      console.error('Error resuming run:', error);
      toast.error('Failed to resume run');
    } finally {
      setIsResuming(false);
    }
  };

  // Map status from streaming to component status
  const status = mapStatusToTaskStatus(runState.status);
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = status === 'succeeded' || status === 'failed' || status === 'canceled';

  // Show control buttons for pause/cancel/resume
  const showControls = !isCompleted;

  const progress = getCurrentProgress();

  return (
    <div className={cn("relative w-full", className)}>
      {/* Main Content */}
      <div className="space-y-6">
        {/* Run Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl font-bold break-words">
                    {runState.title}
                  </CardTitle>
                  {/* Connection Status Indicator */}
                  <div className="flex-shrink-0">
                    {isConnected ? (
                      <Wifi className="h-5 w-5 text-green-500" title="Connected" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-red-500 animate-pulse" title="Disconnected" />
                    )}
                  </div>
                </div>
                <CardDescription className="mt-1">
                  Run ID: {runState.id} • Progress: {runState.progress}%
                </CardDescription>
              </div>

              {/* Control Buttons */}
              {showControls && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isPaused && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleResume}
                      disabled={isResuming}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isResuming ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Resuming...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Resume
                        </>
                      )}
                    </Button>
                  )}
                  
                  {isRunning && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePause}
                      disabled={isPausing}
                    >
                      {isPausing ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                          Pausing...
                        </>
                      ) : (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isCanceling}
                  >
                    {isCanceling ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Canceling...
                      </>
                    ) : (
                      <>
                        <Square className="mr-2 h-4 w-4" />
                        Cancel
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        <Separator />

        {/* Subtasks List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Subtasks</h3>
          
          {runState.subtasks.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  {isConnected ? "Waiting for subtasks..." : "Loading subtasks..."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="w-full">
              <div className="space-y-3">
                {runState.subtasks
                  .sort((a, b) => a.order - b.order)
                  .map((subtask) => (
                    <TaskCard
                      key={subtask.id}
                      id={subtask.id}
                      title={subtask.title}
                      status={mapStatusToTaskStatus(subtask.status)}
                      statusDetail={subtask.description}
                      startedAt={subtask.startTime ? new Date(subtask.startTime) : undefined}
                      finishedAt={subtask.endTime ? new Date(subtask.endTime) : undefined}
                      errorMessage={subtask.error}
                    />
                  ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Spacer to prevent content from being hidden behind status bar */}
        <StatusBarSpacer />
      </div>

      {/* Status Bar - Fixed at bottom */}
      <StatusBar
        currentTask={progress.currentTask}
        totalTasks={progress.totalTasks}
        currentSubtask={progress.currentSubtask}
        totalSubtasks={progress.totalSubtasks}
        currentOperation={progress.currentOperation}
        isActive={isRunning}
      />
    </div>
  );
}
