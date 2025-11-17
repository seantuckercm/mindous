
'use client';

/**
 * Dashboard - Mindous.ai
 * AI-powered workspace for building and automation
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquare, FileText, BarChart3, Zap, Play } from "lucide-react";
import Link from "next/link";
import { TaskBreakdownPanel } from "@/components/task-breakdown/task-breakdown-panel";
import { TaskCard } from "@/components/abacus/task-card";
import { ToolVisibilityPanel } from "@/components/abacus/tool-visibility-panel";
import { ProgressStatusBar } from "@/components/abacus/progress-status-bar";

/**
 * Main dashboard page component
 */
export default function DashboardPage() {
  const [activeTask, setActiveTask] = useState<any>(null);
  const [isTaskRunning, setIsTaskRunning] = useState(false);
  
  // Mock data for demonstration
  const recentTasks = [
    {
      id: '1',
      title: 'Create Landing Page',
      description: 'Build a responsive landing page for SaaS product',
      status: 'completed' as const,
      progress: 100,
      totalSteps: 8,
      completedSteps: 8,
      estimatedDuration: '45 min',
      actualDuration: '38 min'
    },
    {
      id: '2', 
      title: 'Data Analysis Report',
      description: 'Analyze sales data and generate insights report',
      status: 'running' as const,
      progress: 65,
      totalSteps: 12,
      completedSteps: 8,
      estimatedDuration: '60 min'
    }
  ];

  const mockFileOperations = [
    { type: 'create' as const, fileName: 'index.html', status: 'completed' as const },
    { type: 'write' as const, fileName: 'styles.css', status: 'running' as const },
    { type: 'read' as const, fileName: 'data.json', status: 'pending' as const }
  ];

  const handleExecuteTask = (breakdown: any) => {
    console.log('Executing task breakdown:', breakdown);
    setActiveTask(breakdown);
    setIsTaskRunning(true);
    
    // Simulate task execution
    setTimeout(() => {
      setIsTaskRunning(false);
    }, 10000);
  };

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 p-6 md:p-10 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">AI Workspace</h1>
          <p className="text-muted-foreground">
            Your intelligent workspace for task automation and AI-powered workflows
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Start Chat</CardTitle>
              </div>
              <CardDescription className="mb-4">
                Chat with AI to break down and execute tasks
              </CardDescription>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/chat">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Open Chat
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">View Tasks</CardTitle>
              </div>
              <CardDescription className="mb-4">
                Manage and monitor your tasks
              </CardDescription>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/tasks">
                  View All Tasks
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Analytics</CardTitle>
              </div>
              <CardDescription className="mb-4">
                Performance insights and metrics
              </CardDescription>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/analytics">
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Quick Task</CardTitle>
              </div>
              <CardDescription className="mb-4">
                Break down task below
              </CardDescription>
              <Button variant="outline" className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Here
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Task Breakdown Panel */}
          <div className="space-y-6">
            <TaskBreakdownPanel onExecute={handleExecuteTask} />
            
            {/* Recent Tasks */}
            {recentTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <CardTitle>Recent Tasks</CardTitle>
                  </div>
                  <CardDescription>
                    Your latest AI task executions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      {...task}
                      onView={() => console.log('View task:', task.id)}
                      onStart={() => console.log('Start task:', task.id)}
                      onPause={() => console.log('Pause task:', task.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tool Activity Panel */}
          <div className="space-y-6">
            <ToolVisibilityPanel 
              isActive={isTaskRunning}
              activities={[]}
            />
          </div>
        </div>
      </main>

      {/* Progress Status Bar */}
      {isTaskRunning && (
        <ProgressStatusBar
          currentTask={activeTask?.title || "Processing task..."}
          currentStep={3}
          totalSteps={activeTask?.subtasks?.length || 8}
          overallProgress={45}
          fileOperations={mockFileOperations}
          isRunning={isTaskRunning}
        />
      )}
    </div>
  );
}
