
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProviderBadge, LLMProvider } from './provider-badge';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ChevronDown,
  ChevronRight,
  Brain,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubtaskExecution {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  assignedProvider?: LLMProvider;
  assignedModel?: string;
  startTime?: Date;
  endTime?: Date;
  progress?: number;
  logs?: string[];
  cost?: number;
  tokens?: number;
}

interface TaskExecutionMonitorProps {
  taskId: string;
  title: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  subtasks: SubtaskExecution[];
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  className?: string;
}

export function TaskExecutionMonitor({
  taskId,
  title,
  status,
  subtasks,
  onPause,
  onResume,
  onStop,
  className
}: TaskExecutionMonitorProps) {
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());
  const [currentSubtask, setCurrentSubtask] = useState<number>(0);

  // Calculate overall progress
  const completedCount = subtasks.filter(s => s.status === 'completed').length;
  const overallProgress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  // Find currently running subtask
  const runningSubtask = subtasks.find(s => s.status === 'running');
  
  useEffect(() => {
    if (runningSubtask) {
      const index = subtasks.findIndex(s => s.id === runningSubtask.id);
      setCurrentSubtask(index + 1);
    }
  }, [runningSubtask, subtasks]);

  const toggleSubtask = (subtaskId: string) => {
    const newExpanded = new Set(expandedSubtasks);
    if (newExpanded.has(subtaskId)) {
      newExpanded.delete(subtaskId);
    } else {
      newExpanded.add(subtaskId);
    }
    setExpandedSubtasks(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'running':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'paused':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const totalCost = subtasks.reduce((sum, s) => sum + (s.cost || 0), 0);
  const totalTokens = subtasks.reduce((sum, s) => sum + (s.tokens || 0), 0);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Task Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {getStatusIcon(status)}
                <CardTitle className="text-lg">{title}</CardTitle>
                <Badge className={getStatusColor(status)}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>
              <CardDescription>
                Task {currentSubtask} of {subtasks.length} • {completedCount} completed
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {status === 'running' && (
                <Button variant="outline" size="sm" onClick={onPause}>
                  <Pause className="h-4 w-4" />
                </Button>
              )}
              {status === 'paused' && (
                <Button variant="outline" size="sm" onClick={onResume}>
                  <Play className="h-4 w-4" />
                </Button>
              )}
              {(status === 'running' || status === 'paused') && (
                <Button variant="destructive" size="sm" onClick={onStop}>
                  <Square className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={overallProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress: {Math.round(overallProgress)}%</span>
              <span>${totalCost.toFixed(4)} • {totalTokens.toLocaleString()} tokens</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Subtasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Subtask Execution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {subtasks.map((subtask, index) => (
                <div key={subtask.id} className="space-y-2">
                  <div 
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                      subtask.status === 'running' ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50',
                      expandedSubtasks.has(subtask.id) && 'bg-gray-50'
                    )}
                    onClick={() => toggleSubtask(subtask.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {expandedSubtasks.has(subtask.id) ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                        <span className="text-sm font-medium text-muted-foreground">
                          {index + 1}
                        </span>
                      </div>
                      
                      {getStatusIcon(subtask.status)}
                      
                      <div className="flex-1">
                        <div className="font-medium">{subtask.title}</div>
                        {subtask.progress !== undefined && subtask.status === 'running' && (
                          <div className="mt-1">
                            <Progress value={subtask.progress} className="h-1" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {subtask.assignedProvider && (
                          <ProviderBadge 
                            provider={subtask.assignedProvider}
                            model={subtask.assignedModel}
                            size="sm"
                            variant="outline"
                          />
                        )}
                        
                        {(subtask.cost || subtask.tokens) && (
                          <div className="text-xs text-muted-foreground">
                            {subtask.cost && `$${subtask.cost.toFixed(4)}`}
                            {subtask.cost && subtask.tokens && ' • '}
                            {subtask.tokens && `${subtask.tokens} tokens`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {expandedSubtasks.has(subtask.id) && (
                    <div className="ml-8 p-4 bg-gray-50 rounded-lg space-y-3">
                      {/* Timing Info */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {subtask.startTime && (
                          <span>Started: {subtask.startTime.toLocaleTimeString()}</span>
                        )}
                        {subtask.endTime && (
                          <span>Finished: {subtask.endTime.toLocaleTimeString()}</span>
                        )}
                        {subtask.startTime && subtask.endTime && (
                          <span>
                            Duration: {Math.round((subtask.endTime.getTime() - subtask.startTime.getTime()) / 1000)}s
                          </span>
                        )}
                      </div>
                      
                      {/* Logs */}
                      {subtask.logs && subtask.logs.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Execution Logs</h5>
                          <ScrollArea className="max-h-32">
                            <div className="space-y-1">
                              {subtask.logs.map((log, logIndex) => (
                                <div key={logIndex} className="text-xs font-mono bg-white p-2 rounded border">
                                  {log}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {index < subtasks.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Status Bar - Fixed at bottom when running */}
      {status === 'running' && runningSubtask && (
        <div className="fixed bottom-4 right-4 left-4 z-50">
          <Card className="shadow-lg border-blue-200">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="font-medium">
                    Task {currentSubtask}, Subtask: {runningSubtask.title}
                  </span>
                  {runningSubtask.assignedProvider && (
                    <ProviderBadge 
                      provider={runningSubtask.assignedProvider}
                      size="sm"
                    />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {Math.round(overallProgress)}% complete
                  </span>
                  <Button variant="ghost" size="sm" onClick={onPause}>
                    <Pause className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
