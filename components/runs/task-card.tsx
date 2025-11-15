
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Types for task card
export type TaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'paused' | 'canceled';

export interface TaskCardProps {
  id: string;
  title: string;
  status: TaskStatus;
  statusDetail?: string;
  icon?: React.ReactNode;
  startedAt?: Date;
  finishedAt?: Date;
  errorMessage?: string;
  children?: React.ReactNode;
  onExpand?: (expanded: boolean) => void;
  className?: string;
}

// Status icon mapping
const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'running':
      return <Loader2 className="h-5 w-5 animate-spin text-purple-600" />;
    case 'succeeded':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'paused':
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    case 'canceled':
      return <XCircle className="h-5 w-5 text-gray-600" />;
    case 'queued':
    default:
      return <Clock className="h-5 w-5 text-gray-400" />;
  }
};

// Status badge styling
const getStatusBadgeVariant = (status: TaskStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'running':
      return 'default';
    case 'succeeded':
      return 'secondary';
    case 'failed':
    case 'canceled':
      return 'destructive';
    default:
      return 'outline';
  }
};

// Status text mapping
const getStatusText = (status: TaskStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Card background color based on status
const getCardColorClasses = (status: TaskStatus): string => {
  switch (status) {
    case 'running':
      return 'border-purple-200 bg-purple-50/50';
    case 'succeeded':
      return 'border-green-200 bg-green-50/50';
    case 'failed':
      return 'border-red-200 bg-red-50/50';
    case 'canceled':
      return 'border-gray-200 bg-gray-50/50';
    case 'paused':
      return 'border-yellow-200 bg-yellow-50/50';
    default:
      return 'border-gray-200';
  }
};

export function TaskCard({
  id,
  title,
  status,
  statusDetail,
  icon,
  startedAt,
  finishedAt,
  errorMessage,
  children,
  onExpand,
  className,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = Boolean(children || errorMessage);

  const handleToggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpand?.(newExpanded);
  };

  // Calculate duration if both timestamps available
  const duration = startedAt && finishedAt 
    ? Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000)
    : null;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        getCardColorClasses(status),
        className
      )}
      data-task-id={id}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Agent/Task Icon */}
            <div className="flex-shrink-0 mt-1">
              {icon || (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-sm font-semibold">
                  AI
                </div>
              )}
            </div>
            
            {/* Task Title and Status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(status)}
                <Badge variant={getStatusBadgeVariant(status)} className="font-medium">
                  {getStatusText(status)}
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold break-words">
                {title}
              </CardTitle>
              {statusDetail && (
                <CardDescription className="mt-1 text-sm">
                  {statusDetail}
                </CardDescription>
              )}
              
              {/* Duration display for completed tasks */}
              {duration !== null && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Duration: {formatDuration(duration)}
                </div>
              )}
            </div>
          </div>

          {/* Expand/Collapse Button */}
          {hasDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpand}
              className="flex-shrink-0"
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Expandable Content */}
      {hasDetails && isExpanded && (
        <CardContent className="pt-0">
          <div className="border-t pt-3 space-y-3">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1 break-words">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Additional Details (logs, artifacts, etc.) */}
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
