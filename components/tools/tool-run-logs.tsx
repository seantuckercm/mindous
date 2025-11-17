
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SelectToolRunEvent } from '@/db/schema';
import { getToolRun } from '@/actions/tools';
import { Loader2 } from 'lucide-react';

interface ToolRunLogsProps {
  toolRunId: string;
}

export function ToolRunLogs({ toolRunId }: ToolRunLogsProps) {
  const [events, setEvents] = useState<SelectToolRunEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [toolRunId, loadEvents]);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getToolRun(toolRunId);
      
      if (result.success && result.events) {
        setEvents(result.events);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, [toolRunId]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600';
      case 'warn':
        return 'text-orange-600';
      case 'info':
        return 'text-blue-600';
      case 'debug':
        return 'text-gray-600';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No logs available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Logs</div>
      <ScrollArea className="h-48 w-full border rounded">
        <div className="p-2 space-y-1 font-mono text-xs">
          {events.map((event) => (
            <div key={event.id} className="flex gap-2">
              <span className="text-muted-foreground whitespace-nowrap">
                {new Date(event.ts).toLocaleTimeString()}
              </span>
              <span className={`font-semibold ${getLevelColor(event.level)}`}>
                [{event.level.toUpperCase()}]
              </span>
              <span>{event.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
