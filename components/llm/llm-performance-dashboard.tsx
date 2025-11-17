
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProviderBadge, LLMProvider, providerConfig } from './provider-badge';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Activity, 
  BarChart3,
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface ProviderStats {
  provider: LLMProvider;
  model: string;
  totalCalls: number;
  successRate: number;
  avgLatency: number;
  totalCost: number;
  totalTokens: number;
  errorRate: number;
  lastUsed: Date;
  strengths: string[];
}

// Mock data - in real app this would come from API
const mockStats: ProviderStats[] = [
  {
    provider: 'abacus',
    model: 'gpt-4',
    totalCalls: 1250,
    successRate: 98.2,
    avgLatency: 2100,
    totalCost: 45.67,
    totalTokens: 125000,
    errorRate: 1.8,
    lastUsed: new Date(Date.now() - 1000 * 60 * 30),
    strengths: ['Complex Analysis', 'Code Generation']
  },
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    totalCalls: 2850,
    successRate: 99.1,
    avgLatency: 800,
    totalCost: 12.34,
    totalTokens: 340000,
    errorRate: 0.9,
    lastUsed: new Date(Date.now() - 1000 * 60 * 15),
    strengths: ['Speed', 'Cost Effective']
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet',
    totalCalls: 850,
    successRate: 97.8,
    avgLatency: 1500,
    totalCost: 28.91,
    totalTokens: 95000,
    errorRate: 2.2,
    lastUsed: new Date(Date.now() - 1000 * 60 * 45),
    strengths: ['Writing', 'Safety']
  },
  {
    provider: 'google',
    model: 'gemini-1.5-pro',
    totalCalls: 650,
    successRate: 96.5,
    avgLatency: 1200,
    totalCost: 19.45,
    totalTokens: 78000,
    errorRate: 3.5,
    lastUsed: new Date(Date.now() - 1000 * 60 * 60),
    strengths: ['Large Context', 'Multimodal']
  },
  {
    provider: 'qwen',
    model: 'qwen-max',
    totalCalls: 420,
    successRate: 95.7,
    avgLatency: 950,
    totalCost: 8.92,
    totalTokens: 52000,
    errorRate: 4.3,
    lastUsed: new Date(Date.now() - 1000 * 60 * 90),
    strengths: ['Versatility', 'Innovation']
  }
];

export function LLMPerformanceDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('7d');

  // Aggregate statistics
  const totalCalls = mockStats.reduce((sum, stat) => sum + stat.totalCalls, 0);
  const totalCost = mockStats.reduce((sum, stat) => sum + stat.totalCost, 0);
  const avgSuccessRate = mockStats.reduce((sum, stat) => sum + stat.successRate, 0) / mockStats.length;

  // Sort providers by different metrics
  const sortedByUsage = [...mockStats].sort((a, b) => b.totalCalls - a.totalCalls);
  const sortedByPerformance = [...mockStats].sort((a, b) => b.successRate - a.successRate);
  const sortedBySpeed = [...mockStats].sort((a, b) => a.avgLatency - b.avgLatency);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium text-muted-foreground">Total Calls</div>
            </div>
            <div className="text-2xl font-bold">{totalCalls.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Last {selectedTimeframe}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="text-sm font-medium text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Average across all providers</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium text-muted-foreground">Total Cost</div>
            </div>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Last {selectedTimeframe}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium text-muted-foreground">Active Providers</div>
            </div>
            <div className="text-2xl font-bold">{mockStats.length}</div>
            <div className="text-xs text-muted-foreground">Currently configured</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Provider Analysis */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage Statistics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Usage Distribution</CardTitle>
              <CardDescription>Calls made to each LLM provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedByUsage.map((stat) => (
                  <div key={`${stat.provider}-${stat.model}`} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ProviderBadge provider={stat.provider} size="sm" />
                        <div>
                          <div className="font-medium">{stat.model}</div>
                          <div className="text-sm text-muted-foreground">
                            {stat.totalCalls.toLocaleString()} calls
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {((stat.totalCalls / totalCalls) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last used {Math.round((Date.now() - stat.lastUsed.getTime()) / (1000 * 60))}m ago
                        </div>
                      </div>
                    </div>
                    <Progress value={(stat.totalCalls / totalCalls) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Success Rates</CardTitle>
                <CardDescription>Success rate by provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedByPerformance.map((stat) => (
                    <div key={`${stat.provider}-${stat.model}`} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <ProviderBadge provider={stat.provider} size="sm" />
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{stat.successRate.toFixed(1)}%</span>
                          {stat.successRate >= 98 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : stat.successRate >= 95 ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <Progress value={stat.successRate} className="h-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <CardDescription>Average latency by provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedBySpeed.map((stat) => (
                    <div key={`${stat.provider}-${stat.model}`} className="flex items-center justify-between">
                      <ProviderBadge provider={stat.provider} size="sm" />
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{stat.avgLatency}ms</span>
                        <Badge variant={stat.avgLatency < 1000 ? 'default' : stat.avgLatency < 2000 ? 'secondary' : 'destructive'}>
                          {stat.avgLatency < 1000 ? 'Fast' : stat.avgLatency < 2000 ? 'Medium' : 'Slow'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>Spending by provider and efficiency metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockStats.map((stat) => (
                  <div key={`${stat.provider}-${stat.model}`} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ProviderBadge provider={stat.provider} size="sm" />
                        <div>
                          <div className="font-medium">{stat.model}</div>
                          <div className="text-sm text-muted-foreground">
                            {stat.totalTokens.toLocaleString()} tokens
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${stat.totalCost.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          ${(stat.totalCost / stat.totalTokens * 1000).toFixed(4)}/1k tokens
                        </div>
                      </div>
                    </div>
                    <Progress value={(stat.totalCost / totalCost) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
