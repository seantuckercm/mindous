
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SelectToolRun } from '@/db/schema';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  Ban,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import { ToolRunLogs } from './tool-run-logs';

interface ToolRunItemProps {
  toolRun: SelectToolRun;
  toolName?: string;
}

export function ToolRunItem({ toolRun, toolName }: ToolRunItemProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (toolRun.status) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'canceled':
        return <Ban className="h-4 w-4 text-gray-600" />;
      case 'timed_out':
        return <XCircle className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      succeeded: 'default',
      failed: 'destructive',
      running: 'default',
      queued: 'secondary',
      canceled: 'secondary',
      timed_out: 'destructive'
    };

    return (
      <Badge variant={variants[toolRun.status] || 'outline'} className="flex items-center gap-1">
        {getStatusIcon()}
        {toolRun.status}
      </Badge>
    );
  };

  const getDuration = () => {
    if (!toolRun.startedAt) return null;
    
    const end = toolRun.finishedAt || new Date();
    const duration = Math.round((end.getTime() - toolRun.startedAt.getTime()) / 1000);
    
    return `${duration}s`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getStatusIcon()}
            {toolName || 'Tool Run'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getDuration() && (
              <span className="text-sm text-muted-foreground">{getDuration()}</span>
            )}
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-4">
          {/* Input */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Input</div>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(toolRun.inputPayload, null, 2)}
            </pre>
          </div>

          {/* Output */}
          {toolRun.outputPayload && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Output</div>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(toolRun.outputPayload, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {toolRun.error && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-destructive">Error</div>
              <div className="text-xs bg-destructive/10 text-destructive p-2 rounded">
                {toolRun.error}
              </div>
            </div>
          )}

          {/* Logs */}
          <ToolRunLogs toolRunId={toolRun.id} />
        </CardContent>
      )}
    </Card>
  );
}
