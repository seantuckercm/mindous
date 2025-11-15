
"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatusBarProps {
  currentTask?: number;
  totalTasks?: number;
  currentSubtask?: number;
  totalSubtasks?: number;
  currentOperation?: string;
  isActive?: boolean;
  className?: string;
}

export function StatusBar({
  currentTask = 1,
  totalTasks = 1,
  currentSubtask = 1,
  totalSubtasks = 1,
  currentOperation,
  isActive = false,
  className,
}: StatusBarProps) {
  // Calculate overall progress percentage
  const calculateProgress = () => {
    if (totalTasks <= 0 || totalSubtasks <= 0) return 0;
    
    // Weight: Each task contributes equally to overall progress
    // Within a task, subtasks contribute to that task's portion
    const taskWeight = 100 / totalTasks;
    const completedTasks = currentTask - 1;
    const currentTaskProgress = (currentSubtask / totalSubtasks) * taskWeight;
    const completedProgress = completedTasks * taskWeight;
    
    return Math.min(100, Math.round(completedProgress + currentTaskProgress));
  };

  const progress = calculateProgress();

  // Format the status text
  const getStatusText = () => {
    if (totalTasks > 1) {
      return `Task ${currentTask}/${totalTasks}, Subtask ${currentSubtask}/${totalSubtasks}`;
    }
    return `Task ${currentTask}, Subtask ${currentSubtask}/${totalSubtasks}`;
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "shadow-lg",
        className
      )}
    >
      {/* Progress Bar */}
      <Progress 
        value={progress} 
        className="h-1 rounded-none"
      />
      
      {/* Status Content */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Status Text */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isActive && (
              <Loader2 className="h-4 w-4 animate-spin text-purple-600 flex-shrink-0" />
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant={isActive ? "default" : "secondary"}
                className={cn(
                  "font-mono text-xs",
                  isActive && "bg-purple-600"
                )}
              >
                {getStatusText()}
              </Badge>
              {currentOperation && (
                <span className="text-sm text-muted-foreground truncate">
                  {currentOperation}
                </span>
              )}
            </div>
          </div>

          {/* Right: Progress Percentage */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-muted-foreground">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility component for fixed spacing to prevent content from being hidden behind status bar
export function StatusBarSpacer({ className }: { className?: string }) {
  return <div className={cn("h-[60px]", className)} aria-hidden="true" />;
}
