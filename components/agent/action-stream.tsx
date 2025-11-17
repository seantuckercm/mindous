'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Code, 
  Hammer, 
  Eye,
  Clock,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentAction } from '@/lib/hooks/useAgentStream';

export interface ActionStreamProps {
  actions: AgentAction[];
  className?: string;
  autoScroll?: boolean;
}

function getActionIcon(type: AgentAction['type']) {
  switch (type) {
    case 'task_started':
      return Circle;
    case 'task_completed':
      return CheckCircle2;
    case 'code_generated':
      return Code;
    case 'build_started':
    case 'build_completed':
      return Hammer;
    case 'preview_ready':
      return Eye;
    case 'error':
      return AlertCircle;
    default:
      return ChevronRight;
  }
}

function getActionColor(type: AgentAction['type']) {
  switch (type) {
    case 'task_started':
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'task_completed':
      return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'code_generated':
      return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    case 'build_started':
      return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    case 'build_completed':
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    case 'preview_ready':
      return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
    case 'error':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    default:
      return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  });
}

function ActionItem({ action }: { action: AgentAction }) {
  const Icon = getActionIcon(action.type);
  const colorClass = getActionColor(action.type);
  
  return (
    <div className="flex items-start gap-3 group hover:bg-accent/50 p-2 rounded-lg transition-colors">
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border',
        colorClass
      )}>
        <Icon className="h-4 w-4" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-foreground leading-tight">
            {action.title}
          </p>
          <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimestamp(action.timestamp)}
          </span>
        </div>
        
        {action.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {action.description}
          </p>
        )}
        
        {/* Additional data display for specific action types */}
        {action.type === 'code_generated' && action.data && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
            <Code className="h-3 w-3" />
            <span className="font-mono">{action.data.fileName}</span>
            <span className="text-xs opacity-60">•</span>
            <span className="uppercase">{action.data.language}</span>
          </div>
        )}
        
        {action.type === 'preview_ready' && action.data?.url && (
          <div className="mt-2">
            <a 
              href={action.data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              Open preview
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export function ActionStream({ actions, className, autoScroll = true }: ActionStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new actions arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [actions, autoScroll]);

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Agent Actions</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px] px-4 pb-4" ref={scrollAreaRef}>
          {actions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center py-8">
              <div className="text-muted-foreground">
                <Circle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Waiting for actions...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {actions.map((action) => (
                <ActionItem key={action.id} action={action} />
              ))}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
