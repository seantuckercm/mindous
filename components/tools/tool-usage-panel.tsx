
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SelectToolRun, SelectTool } from '@/db/schema';
import { ToolRunItem } from './tool-run-item';
import { getToolRunsForExecution, listTools } from '@/actions/tools';
import { Loader2, RefreshCw } from 'lucide-react';

interface ToolUsagePanelProps {
  workspaceId: string;
  executionId: string;
}

export function ToolUsagePanel({ workspaceId, executionId }: ToolUsagePanelProps) {
  const [toolRuns, setToolRuns] = useState<SelectToolRun[]>([]);
  const [tools, setTools] = useState<Record<string, SelectTool>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadToolRuns = useCallback(async () => {
    try {
      const result = await getToolRunsForExecution(executionId);
      if (result.success && result.toolRuns) {
        setToolRuns(result.toolRuns);
      }
    } catch (err) {
      console.error('Failed to load tool runs:', err);
    }
  }, [executionId]);

  const loadTools = useCallback(async () => {
    try {
      const result = await listTools(workspaceId);
      if (result.success && result.tools) {
        const toolMap: Record<string, SelectTool> = {};
        result.tools.forEach(tool => {
          toolMap[tool.id] = tool;
        });
        setTools(toolMap);
      }
    } catch (err) {
      console.error('Failed to load tools:', err);
    }
  }, [workspaceId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadToolRuns(), loadTools()]);
    setLoading(false);
  }, [loadToolRuns, loadTools]);

  useEffect(() => {
    loadData();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(loadToolRuns, 5000);
    return () => clearInterval(interval);
  }, [executionId, loadData, loadToolRuns]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadToolRuns();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tool Usage</CardTitle>
              <CardDescription>
                Tools used in this execution
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {toolRuns.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>No tools have been used in this execution yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {toolRuns.map((toolRun) => (
            <ToolRunItem
              key={toolRun.id}
              toolRun={toolRun}
              toolName={tools[toolRun.toolId]?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
