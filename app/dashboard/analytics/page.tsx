'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Activity, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Download,
  Calendar
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Mock data for analytics
const taskCompletionData = [
  { date: 'Mon', completed: 12, failed: 2, pending: 5 },
  { date: 'Tue', completed: 15, failed: 1, pending: 3 },
  { date: 'Wed', completed: 18, failed: 3, pending: 4 },
  { date: 'Thu', completed: 14, failed: 1, pending: 6 },
  { date: 'Fri', completed: 20, failed: 2, pending: 2 },
  { date: 'Sat', completed: 10, failed: 1, pending: 3 },
  { date: 'Sun', completed: 8, failed: 0, pending: 2 },
];

const creditUsageData = [
  { date: 'Week 1', credits: 450, cost: 22.5 },
  { date: 'Week 2', credits: 680, cost: 34.0 },
  { date: 'Week 3', credits: 520, cost: 26.0 },
  { date: 'Week 4', credits: 890, cost: 44.5 },
];

const taskStatusData = [
  { name: 'Completed', value: 87, color: '#10b981' },
  { name: 'In Progress', value: 15, color: '#3b82f6' },
  { name: 'Failed', value: 8, color: '#ef4444' },
  { name: 'Pending', value: 25, color: '#f59e0b' },
];

const executionTimeData = [
  { task: 'Code Review', time: 45 },
  { task: 'Data Analysis', time: 120 },
  { task: 'Documentation', time: 30 },
  { task: 'Testing', time: 90 },
  { task: 'Deployment', time: 15 },
  { task: 'Debugging', time: 75 },
];

const recentActivity = [
  { id: 1, task: 'Build React application', status: 'completed', time: '2 hours ago', cost: 2.34 },
  { id: 2, task: 'Analyze customer data', status: 'in_progress', time: '30 min ago', cost: 1.89 },
  { id: 3, task: 'Write API documentation', status: 'completed', time: '5 hours ago', cost: 4.12 },
  { id: 4, task: 'Create marketing content', status: 'pending', time: '1 hour ago', cost: 0.78 },
  { id: 5, task: 'Refactor codebase', status: 'failed', time: '3 hours ago', cost: 1.23 },
];

const chartConfig = {
  completed: {
    label: 'Completed',
    color: '#10b981',
  },
  failed: {
    label: 'Failed',
    color: '#ef4444',
  },
  pending: {
    label: 'Pending',
    color: '#f59e0b',
  },
  credits: {
    label: 'Credits Used',
    color: '#3b82f6',
  },
  cost: {
    label: 'Cost ($)',
    color: '#8b5cf6',
  },
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [totalTasks, setTotalTasks] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [avgDuration, setAvgDuration] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    // Calculate metrics from mock data
    const total = taskStatusData.reduce((sum, item) => sum + item.value, 0);
    const completed = taskStatusData.find(item => item.name === 'Completed')?.value || 0;
    const avgTime = executionTimeData.reduce((sum, item) => sum + item.time, 0) / executionTimeData.length;
    const cost = creditUsageData.reduce((sum, item) => sum + item.cost, 0);

    setTotalTasks(total);
    setCompletionRate(Math.round((completed / total) * 100));
    setAvgDuration(Math.round(avgTime));
    setTotalCost(cost);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your AI-powered task execution and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +3% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDuration}m</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              -8% faster than average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-orange-500 mr-1" />
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="completion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="completion">Task Completion</TabsTrigger>
          <TabsTrigger value="credits">Credit Usage</TabsTrigger>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
          <TabsTrigger value="duration">Execution Time</TabsTrigger>
        </TabsList>

        <TabsContent value="completion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Over Time</CardTitle>
              <CardDescription>
                Track completed, failed, and pending tasks throughout the week
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ChartContainer config={chartConfig} className="h-[400px]">
                <BarChart data={taskCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" fill="var(--color-failed)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" fill="var(--color-pending)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit Usage & Cost Analysis</CardTitle>
              <CardDescription>
                Monitor your credit consumption and associated costs
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ChartContainer config={chartConfig} className="h-[400px]">
                <AreaChart data={creditUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="credits" 
                    stroke="var(--color-credits)" 
                    fill="var(--color-credits)"
                    fillOpacity={0.3}
                  />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="cost" 
                    stroke="var(--color-cost)" 
                    fill="var(--color-cost)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>
                  Breakdown of all tasks by current status
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Statistics</CardTitle>
                <CardDescription>
                  Detailed breakdown of task metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {taskStatusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{item.value} tasks</span>
                        <span className="text-sm font-medium">
                          {((item.value / totalTasks) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="duration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Average Execution Time by Task Type</CardTitle>
              <CardDescription>
                Compare execution times across different task categories
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ChartContainer config={chartConfig} className="h-[400px]">
                <BarChart data={executionTimeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="task" type="category" width={120} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="time" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest task executions and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    activity.status === 'completed' ? 'bg-green-100' :
                    activity.status === 'in_progress' ? 'bg-blue-100' :
                    activity.status === 'failed' ? 'bg-red-100' : 'bg-orange-100'
                  }`}>
                    {activity.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                     activity.status === 'in_progress' ? <Zap className="h-4 w-4 text-blue-600" /> :
                     activity.status === 'failed' ? <Activity className="h-4 w-4 text-red-600" /> :
                     <Clock className="h-4 w-4 text-orange-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.task}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${activity.cost.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{activity.status.replace('_', ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
