
"use client";

import { useState, useEffect, useCallback } from "react";
import { TaskCard, TaskStatus } from "./task-card";
import { StatusBar, StatusBarSpacer } from "./status-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Pause, Square, Play } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  initialData?: RunData;
  onPause?: (runId: string) => Promise<void>;
  onCancel?: (runId: string) => Promise<void>;
  onResume?: (runId: string) => Promise<void>;
  className?: string;
}

export function RunProgressPanel({
  runId,
  initialData,
  onPause,
  onCancel,
  onResume,
  className,
}: RunProgressPanelProps) {
  const [runData, setRunData] = useState<RunData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isPausing, setIsPausing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  // Fetch initial run data if not provided
  useEffect(() => {
    if (!initialData) {
      fetchRunData();
    }
  }, [runId, initialData]);

  const fetchRunData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/runs/${runId}`);
      if (!response.ok) throw new Error('Failed to fetch run data');
      const data = await response.json();
      setRunData(data);
    } catch (error) {
      console.error('Error fetching run data:', error);
      toast.error('Failed to load run data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate current task and subtask numbers
  const getCurrentProgress = useCallback(() => {
    if (!runData) return { currentTask: 1, totalTasks: 1, currentSubtask: 1, totalSubtasks: 1 };

    const totalSubtasks = runData.subtasks.length;
    
    // Find the first non-succeeded/non-failed subtask
    const currentSubtaskIndex = runData.subtasks.findIndex(
      st => st.status !== 'succeeded' && st.status !== 'failed'
    );
    
    const currentSubtask = currentSubtaskIndex >= 0 ? currentSubtaskIndex + 1 : totalSubtasks;
    
    // Get current operation from status detail of running subtask
    const runningSubtask = runData.subtasks.find(st => st.status === 'running');
    const currentOperation = runningSubtask?.statusDetail;

    return {
      currentTask: 1, // For now, treating each run as a single task
      totalTasks: 1,
      currentSubtask,
      totalSubtasks: totalSubtasks || 1,
      currentOperation,
    };
  }, [runData]);

  // Handle pause action
  const handlePause = async () => {
    if (!onPause) {
      toast.error('Pause functionality not implemented');
      return;
    }

    setIsPausing(true);
    try {
      await onPause(runId);
      toast.success('Run paused successfully');
      // Refresh run data
      await fetchRunData();
    } catch (error) {
      console.error('Error pausing run:', error);
      toast.error('Failed to pause run');
    } finally {
      setIsPausing(false);
    }
  };

  // Handle cancel action
  const handleCancel = async () => {
    if (!onCancel) {
      toast.error('Cancel functionality not implemented');
      return;
    }

    setIsCanceling(true);
    try {
      await onCancel(runId);
      toast.success('Run canceled successfully');
      // Refresh run data
      await fetchRunData();
    } catch (error) {
      console.error('Error canceling run:', error);
      toast.error('Failed to cancel run');
    } finally {
      setIsCanceling(false);
    }
  };

  // Handle resume action
  const handleResume = async () => {
    if (!onResume) {
      toast.error('Resume functionality not implemented');
      return;
    }

    setIsResuming(true);
    try {
      await onResume(runId);
      toast.success('Run resumed successfully');
      // Refresh run data
      await fetchRunData();
    } catch (error) {
      console.error('Error resuming run:', error);
      toast.error('Failed to resume run');
    } finally {
      setIsResuming(false);
    }
  };

  // Check if run is active
  const isRunning = runData?.status === 'running';
  const isPaused = runData?.status === 'paused';
  const isCompleted = runData?.status === 'succeeded' || runData?.status === 'failed' || runData?.status === 'canceled';

  // Show control buttons for pause/cancel/resume
  const showControls = !isCompleted;

  const progress = getCurrentProgress();

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-sm text-muted-foreground">Loading run data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!runData) {
    return (
      <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No run data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* Main Content */}
      <div className="space-y-6">
        {/* Run Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-2xl font-bold break-words">
                  {runData.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  Run ID: {runData.id}
                </CardDescription>
              </div>

              {/* Control Buttons */}
              {showControls && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isPaused && onResume && (
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
                  
                  {isRunning && onPause && (
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
                  
                  {onCancel && (
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
                  )}
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        <Separator />

        {/* Subtasks List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Subtasks</h3>
          
          {runData.subtasks.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No subtasks available</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="w-full">
              <div className="space-y-3">
                {runData.subtasks
                  .sort((a, b) => a.order - b.order)
                  .map((subtask) => (
                    <TaskCard
                      key={subtask.id}
                      id={subtask.id}
                      title={subtask.title}
                      status={subtask.status}
                      statusDetail={subtask.statusDetail}
                      startedAt={subtask.startedAt}
                      finishedAt={subtask.finishedAt}
                      errorMessage={subtask.errorMessage}
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
