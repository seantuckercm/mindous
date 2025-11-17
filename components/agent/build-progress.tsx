'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Hammer, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BuildInfo } from '@/lib/hooks/useAgentStream';

export interface BuildProgressProps {
  buildInfo: BuildInfo;
  className?: string;
}

function formatDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const durationSec = Math.floor((end - start) / 1000);
  
  if (durationSec < 60) {
    return `${durationSec}s`;
  }
  
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  return `${minutes}m ${seconds}s`;
}

function getBuildStatusIcon(status: BuildInfo['status']) {
  switch (status) {
    case 'completed':
      return CheckCircle2;
    case 'failed':
      return XCircle;
    case 'in_progress':
      return Loader2;
    default:
      return Hammer;
  }
}

function getBuildStatusColor(status: BuildInfo['status']) {
  switch (status) {
    case 'completed':
      return 'text-green-500';
    case 'failed':
      return 'text-red-500';
    case 'in_progress':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
}

function getBuildProgress(status: BuildInfo['status']): number {
  switch (status) {
    case 'completed':
      return 100;
    case 'failed':
      return 100;
    case 'in_progress':
      return 50; // Indeterminate progress
    default:
      return 0;
  }
}

export function BuildProgress({ buildInfo, className }: BuildProgressProps) {
  const [isLogsExpanded, setIsLogsExpanded] = useState(true);
  
  const StatusIcon = getBuildStatusIcon(buildInfo.status);
  const statusColor = getBuildStatusColor(buildInfo.status);
  const progress = getBuildProgress(buildInfo.status);
  const duration = formatDuration(buildInfo.startTime, buildInfo.endTime);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Hammer className="h-4 w-4" />
            Build Progress
          </CardTitle>
          
          <div className="flex items-center gap-3">
            {/* Duration */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {duration}
            </div>
            
            {/* Status */}
            <div className={cn('flex items-center gap-1', statusColor)}>
              <StatusIcon 
                className={cn(
                  'h-4 w-4',
                  buildInfo.status === 'in_progress' && 'animate-spin'
                )} 
              />
              <span className="text-xs font-medium capitalize">
                {buildInfo.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 space-y-2">
          <Progress 
            value={progress} 
            className="h-2"
            indicatorClassName={cn(
              buildInfo.status === 'completed' && 'bg-green-500',
              buildInfo.status === 'failed' && 'bg-red-500',
              buildInfo.status === 'in_progress' && 'bg-blue-500'
            )}
          />
          
          {/* Current step */}
          {buildInfo.currentStep && (
            <p className="text-xs text-muted-foreground">
              {buildInfo.currentStep}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Error message */}
        {buildInfo.status === 'failed' && buildInfo.error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-red-500 mb-1">Build Failed</p>
                <p className="text-xs text-red-400/80">{buildInfo.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Build logs */}
        {buildInfo.logs.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLogsExpanded(!isLogsExpanded)}
              className="w-full justify-between h-8 px-3"
            >
              <span className="flex items-center gap-2 text-xs font-medium">
                <Terminal className="h-3 w-3" />
                Build Logs ({buildInfo.logs.length})
              </span>
              {isLogsExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>

            {isLogsExpanded && (
              <ScrollArea className="h-[200px] w-full rounded-lg border bg-gray-950 text-gray-100">
                <div className="p-3 font-mono text-xs space-y-1">
                  {buildInfo.logs.map((log, index) => (
                    <div key={index} className="leading-relaxed whitespace-pre-wrap break-words">
                      <span className="text-gray-500 select-none">{index + 1} │ </span>
                      <span className="text-gray-300">{log}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Success message */}
        {buildInfo.status === 'completed' && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="text-xs font-medium text-green-500">
                Build completed successfully
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
