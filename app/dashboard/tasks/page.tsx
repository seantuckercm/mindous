
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Pause,
  Play,
  MoreVertical,
  FileText,
  Download,
  Eye
} from 'lucide-react';

interface TaskItem {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  createdAt: Date;
  completedAt?: Date;
  cost: number;
  subtasks: number;
  completedSubtasks: number;
}

// Mock data
const mockTasks: TaskItem[] = [
  {
    id: '1',
    title: 'Build React todo application with TypeScript',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    completedAt: new Date(Date.now() - 1000 * 60 * 30),
    cost: 2.34,
    subtasks: 8,
    completedSubtasks: 8
  },
  {
    id: '2',
    title: 'Analyze customer feedback data and generate insights',
    status: 'running',
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
    cost: 1.89,
    subtasks: 5,
    completedSubtasks: 3
  },
  {
    id: '3',
    title: 'Write comprehensive API documentation',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 22),
    cost: 4.12,
    subtasks: 12,
    completedSubtasks: 12
  },
  {
    id: '4',
    title: 'Create marketing campaign content',
    status: 'paused',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    cost: 0.78,
    subtasks: 6,
    completedSubtasks: 2
  },
  {
    id: '5',
    title: 'Refactor legacy codebase structure',
    status: 'failed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    cost: 1.23,
    subtasks: 4,
    completedSubtasks: 1
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'running':
      return <Play className="h-4 w-4 text-blue-500" />;
    case 'paused':
      return <Pause className="h-4 w-4 text-orange-500" />;
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
    case 'paused':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'failed':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    if (activeTab !== 'all') {
      const matchesTab = activeTab === task.status;
      return matchesSearch && matchesStatus && matchesTab;
    }
    
    return matchesSearch && matchesStatus;
  });

  const taskCounts = {
    all: mockTasks.length,
    running: mockTasks.filter(t => t.status === 'running').length,
    completed: mockTasks.filter(t => t.status === 'completed').length,
    failed: mockTasks.filter(t => t.status === 'failed').length,
    paused: mockTasks.filter(t => t.status === 'paused').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage all your AI task executions
          </p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{taskCounts.all}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{taskCounts.running}</div>
            <div className="text-sm text-muted-foreground">Running</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{taskCounts.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{taskCounts.paused}</div>
            <div className="text-sm text-muted-foreground">Paused</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{taskCounts.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({taskCounts.all})</TabsTrigger>
          <TabsTrigger value="running">Running ({taskCounts.running})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({taskCounts.completed})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({taskCounts.paused})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({taskCounts.failed})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters or search terms'
                    : 'Create your first task to get started'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {getStatusIcon(task.status)}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{task.title}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{task.createdAt.toLocaleDateString()} at {task.createdAt.toLocaleTimeString()}</span>
                            {task.completedAt && (
                              <span>• Completed {task.completedAt.toLocaleTimeString()}</span>
                            )}
                            <span>• {task.completedSubtasks}/{task.subtasks} subtasks</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </Badge>

                          <div className="text-right">
                            <div className="text-sm font-medium">${task.cost.toFixed(2)}</div>
                          </div>

                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar for running/paused tasks */}
                    {(task.status === 'running' || task.status === 'paused') && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{Math.round((task.completedSubtasks / task.subtasks) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(task.completedSubtasks / task.subtasks) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      
                      {task.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download Results
                        </Button>
                      )}
                      
                      {task.status === 'running' && (
                        <Button variant="outline" size="sm">
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      )}
                      
                      {task.status === 'paused' && (
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
