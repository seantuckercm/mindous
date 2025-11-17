
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { LLMSelector } from './llm-selector';
import { TaskExecutionMonitor } from './task-execution-monitor';
import { ProviderBadge, LLMProvider } from './provider-badge';
import { TaskDecompositionView } from '../planning/task-decomposition-view';
import { 
  Brain, 
  Sparkles, 
  Play, 
  Settings, 
  FileText,
  Layers,
  Zap,
  DollarSign,
  Clock,
  Activity,
  Plus,
  History
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkspaceStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalCost: number;
  avgExecutionTime: number;
  favoriteProvider: LLMProvider;
}

const mockStats: WorkspaceStats = {
  totalTasks: 156,
  activeTasks: 3,
  completedTasks: 153,
  totalCost: 89.34,
  avgExecutionTime: 245,
  favoriteProvider: 'openai'
};

export function MultiLLMWorkspace() {
  const [activeTab, setActiveTab] = useState('compose');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedLLM, setSelectedLLM] = useState('auto:intelligent');
  const [taskType, setTaskType] = useState('action');
  const [priority, setPriority] = useState('medium');
  const [enableDecomposition, setEnableDecomposition] = useState(true);
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    setIsCreating(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Task created and queued for execution!');
      
      // Reset form
      setTaskTitle('');
      setTaskDescription('');
      
      // Switch to monitor tab to show execution
      setActiveTab('monitor');
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setIsCreating(false);
    }
  };

  const mockExecutionData = {
    taskId: '1',
    title: taskTitle || 'Build a React todo app with TypeScript',
    status: 'running' as const,
    subtasks: [
      {
        id: '1',
        title: 'Initialize project structure',
        status: 'completed' as const,
        assignedProvider: 'openai' as LLMProvider,
        assignedModel: 'gpt-4o-mini',
        startTime: new Date(Date.now() - 300000),
        endTime: new Date(Date.now() - 240000),
        cost: 0.023,
        tokens: 1200,
        logs: ['Created package.json', 'Installed dependencies', 'Set up TypeScript config']
      },
      {
        id: '2',
        title: 'Design component architecture',
        status: 'completed' as const,
        assignedProvider: 'anthropic' as LLMProvider,
        assignedModel: 'claude-3-5-sonnet',
        startTime: new Date(Date.now() - 240000),
        endTime: new Date(Date.now() - 180000),
        cost: 0.045,
        tokens: 1800,
        logs: ['Analyzed requirements', 'Created component tree', 'Defined interfaces']
      },
      {
        id: '3',
        title: 'Implement todo components',
        status: 'running' as const,
        assignedProvider: 'abacus' as LLMProvider,
        assignedModel: 'gpt-4',
        startTime: new Date(Date.now() - 180000),
        progress: 65,
        cost: 0.078,
        tokens: 2400,
        logs: ['Created TodoItem component', 'Implementing TodoList', 'Adding state management...']
      },
      {
        id: '4',
        title: 'Add TypeScript types and interfaces',
        status: 'pending' as const,
        assignedProvider: 'google' as LLMProvider,
        assignedModel: 'gemini-1.5-pro'
      },
      {
        id: '5',
        title: 'Implement CRUD operations',
        status: 'pending' as const,
        assignedProvider: 'openai' as LLMProvider,
        assignedModel: 'gpt-4o-mini'
      }
    ]
  };

  return (
    <div className="w-full max-w-7xl space-y-6">
      {/* Workspace Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            Multi-LLM Workspace
          </h1>
          <p className="text-muted-foreground mt-1">
            Orchestrate complex tasks across multiple AI providers with intelligent routing
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{mockStats.completedTasks}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{mockStats.activeTasks}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="text-center">
            <div className="text-2xl font-bold">${mockStats.totalCost.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Total Cost</div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Compose Task
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Monitor
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Task History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Task Composition */}
        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Input Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    New Task Specification
                  </CardTitle>
                  <CardDescription>
                    Describe your task and let our multi-LLM system break it down and execute it efficiently
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Task Details */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Task Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Build a React todo application with TypeScript"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Detailed Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Provide additional context, requirements, constraints, or specific instructions..."
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        rows={4}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* LLM Configuration */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      LLM Configuration
                    </h4>
                    
                    <LLMSelector
                      value={selectedLLM}
                      onValueChange={setSelectedLLM}
                      showDetails={selectedLLM !== 'auto:intelligent'}
                      label="Primary LLM Provider"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Task Type</Label>
                        <Select value={taskType} onValueChange={setTaskType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="code">Code Generation</SelectItem>
                            <SelectItem value="writing">Content Writing</SelectItem>
                            <SelectItem value="analysis">Data Analysis</SelectItem>
                            <SelectItem value="reasoning">Complex Reasoning</SelectItem>
                            <SelectItem value="action">General Action</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Priority Level</Label>
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Priority</SelectItem>
                            <SelectItem value="medium">Medium Priority</SelectItem>
                            <SelectItem value="high">High Priority</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Advanced Options */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Execution Options
                    </h4>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="decomposition">Task Decomposition</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically break down complex tasks into subtasks
                          </p>
                        </div>
                        <Switch
                          id="decomposition"
                          checked={enableDecomposition}
                          onCheckedChange={setEnableDecomposition}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="streaming">Real-time Streaming</Label>
                          <p className="text-sm text-muted-foreground">
                            Show live progress updates during execution
                          </p>
                        </div>
                        <Switch
                          id="streaming"
                          checked={enableStreaming}
                          onCheckedChange={setEnableStreaming}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Submit Button */}
                  <Button
                    onClick={handleCreateTask}
                    disabled={!taskTitle.trim() || isCreating}
                    size="lg"
                    className="w-full"
                  >
                    {isCreating ? (
                      <>
                        <Brain className="mr-2 h-4 w-4 animate-pulse" />
                        Creating & Planning Task...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Create & Execute Task
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Live Provider Status */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Provider Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <ProviderBadge provider="abacus" size="sm" />
                    <Badge variant="default">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <ProviderBadge provider="openai" size="sm" />
                    <Badge variant="default">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <ProviderBadge provider="anthropic" size="sm" />
                    <Badge variant="default">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <ProviderBadge provider="google" size="sm" />
                    <Badge variant="secondary">Slow</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <ProviderBadge provider="qwen" size="sm" />
                    <Badge variant="default">Online</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Today's Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      API Calls
                    </span>
                    <span className="font-medium">2,847</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Cost
                    </span>
                    <span className="font-medium">$12.34</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Avg Time
                    </span>
                    <span className="font-medium">1.2s</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Live Monitoring */}
        <TabsContent value="monitor" className="space-y-4">
          <TaskExecutionMonitor
            {...mockExecutionData}
            onPause={() => toast.info('Task execution paused')}
            onResume={() => toast.info('Task execution resumed')}
            onStop={() => toast.info('Task execution stopped')}
          />
        </TabsContent>

        {/* Task History */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Task History</CardTitle>
              <CardDescription>View and manage your completed tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">Build React todo app #{i}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline">Completed</Badge>
                        <span>2 hours ago</span>
                        <ProviderBadge provider="openai" size="sm" variant="outline" />
                        <span>$1.23</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>Performance metrics across all LLM providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics dashboard will be loaded here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
