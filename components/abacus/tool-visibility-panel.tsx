
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Database, 
  Globe, 
  Search, 
  FileText, 
  Calculator,
  Code,
  MessageSquare,
  ChevronRight,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface ToolActivity {
  id: string;
  toolName: string;
  action: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: Date;
  duration?: number;
  result?: string;
  input?: string;
}

interface ToolVisibilityPanelProps {
  activities?: ToolActivity[];
  isActive?: boolean;
}

export function ToolVisibilityPanel({ activities = [], isActive = false }: ToolVisibilityPanelProps) {
  const [realTimeActivities, setRealTimeActivities] = useState<ToolActivity[]>(activities);

  // Mock real-time updates for demo
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // Simulate new activities
      const mockTools = [
        { name: 'Web Search', icon: Search },
        { name: 'Database Query', icon: Database },
        { name: 'Text Analysis', icon: FileText },
        { name: 'API Call', icon: Globe },
        { name: 'Calculator', icon: Calculator },
        { name: 'Code Execute', icon: Code }
      ];

      const randomTool = mockTools[Math.floor(Math.random() * mockTools.length)];
      
      const newActivity: ToolActivity = {
        id: Date.now().toString(),
        toolName: randomTool.name,
        action: getRandomAction(randomTool.name),
        status: Math.random() > 0.8 ? 'failed' : 'completed',
        timestamp: new Date(),
        duration: Math.floor(Math.random() * 3000) + 500,
        result: getRandomResult(randomTool.name)
      };

      setRealTimeActivities(prev => [newActivity, ...prev.slice(0, 19)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  const getRandomAction = (toolName: string): string => {
    const actions: Record<string, string[]> = {
      'Web Search': ['Searching for "React best practices"', 'Finding latest documentation', 'Looking up API references'],
      'Database Query': ['Fetching user records', 'Updating task status', 'Inserting new data'],
      'Text Analysis': ['Processing user input', 'Extracting key information', 'Analyzing sentiment'],
      'API Call': ['Calling OpenAI API', 'Fetching weather data', 'Getting stock prices'],
      'Calculator': ['Computing percentages', 'Calculating averages', 'Processing statistics'],
      'Code Execute': ['Running Python script', 'Compiling TypeScript', 'Testing function']
    };
    
    const toolActions = actions[toolName] || ['Processing request'];
    return toolActions[Math.floor(Math.random() * toolActions.length)];
  };

  const getRandomResult = (toolName: string): string => {
    const results: Record<string, string[]> = {
      'Web Search': ['Found 15 relevant results', 'Retrieved documentation page', 'Located API reference'],
      'Database Query': ['Retrieved 5 records', 'Updated successfully', 'Query completed'],
      'Text Analysis': ['Extracted 3 key points', 'Positive sentiment detected', 'Summary generated'],
      'API Call': ['Response received (200 OK)', 'Data retrieved successfully', 'API call completed'],
      'Calculator': ['Result: 85.6%', 'Average: 42.3', 'Total: 1,247'],
      'Code Execute': ['Execution completed', 'Tests passed (3/3)', 'Output generated']
    };
    
    const toolResults = results[toolName] || ['Task completed'];
    return toolResults[Math.floor(Math.random() * toolResults.length)];
  };

  const getToolIcon = (toolName: string) => {
    const iconMap: Record<string, any> = {
      'Web Search': Search,
      'Database Query': Database,
      'Text Analysis': FileText,
      'API Call': Globe,
      'Calculator': Calculator,
      'Code Execute': Code,
      'Chat': MessageSquare
    };
    
    const IconComponent = iconMap[toolName] || Activity;
    return <IconComponent className="h-4 w-4" />;
  };

  const getStatusIcon = (status: ToolActivity['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'failed':
        return <Activity className="h-3 w-3 text-red-600" />;
    }
  };

  const getStatusColor = (status: ToolActivity['status']) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">AI Tools Activity</CardTitle>
          </div>
          {isActive && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </div>
          )}
        </div>
        <CardDescription>
          Real-time view of AI agent tool usage and operations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6">
          {realTimeActivities.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tool activity yet</p>
                <p className="text-xs">Start a task to see AI tools in action</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {realTimeActivities.map((activity, index) => (
                <div 
                  key={activity.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    index === 0 && isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-lg">
                    {getToolIcon(activity.toolName)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{activity.toolName}</h4>
                        {getStatusIcon(activity.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {activity.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">
                      {activity.action}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(activity.status)}`}
                      >
                        {activity.status}
                        {activity.duration && ` • ${formatDuration(activity.duration)}`}
                      </Badge>
                      
                      {activity.result && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="truncate max-w-32">{activity.result}</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
