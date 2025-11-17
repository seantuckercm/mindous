'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { PlanOutput, TaskNode } from '@/lib/schemas/planning-schema';
import { TaskTree } from './task-tree';
import { cn } from '@/lib/utils';

interface TaskDecompositionViewProps {
  plan: PlanOutput | null;
  isLoading?: boolean;
  error?: string | null;
  onApprove?: () => void;
  onRegenerate?: (feedback: string) => void;
  onEdit?: (taskId: string, updates: Partial<TaskNode>) => void;
  showActions?: boolean;
}

export function TaskDecompositionView({
  plan,
  isLoading = false,
  error = null,
  onApprove,
  onRegenerate,
  onEdit,
  showActions = true,
}: TaskDecompositionViewProps) {
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(true);
  const [isEstimateExpanded, setIsEstimateExpanded] = useState(true);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Analyzing your goal...</p>
          <p className="text-sm text-muted-foreground mt-2">Generating task breakdown</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg font-medium text-destructive">Failed to generate plan</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          {onRegenerate && (
            <Button variant="outline" className="mt-4" onClick={() => onRegenerate('')}>
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No plan generated yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOverviewExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <CardTitle>Plan Overview</CardTitle>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <CardDescription>{plan.overview.objective}</CardDescription>
        </CardHeader>
        {isOverviewExpanded && (
          <CardContent className="space-y-4">
            {/* Strategy */}
            {plan.overview.overall_strategy && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Strategy</h4>
                <p className="text-sm text-muted-foreground">{plan.overview.overall_strategy}</p>
              </div>
            )}

            {/* Success Criteria */}
            {plan.overview.success_criteria.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Success Criteria</h4>
                <ul className="list-disc list-inside space-y-1">
                  {plan.overview.success_criteria.map((criterion, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Assumptions */}
            {plan.overview.assumptions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Assumptions</h4>
                <ul className="list-disc list-inside space-y-1">
                  {plan.overview.assumptions.map((assumption, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Constraints */}
            {plan.overview.constraints.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Constraints</h4>
                <ul className="list-disc list-inside space-y-1">
                  {plan.overview.constraints.map((constraint, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {constraint}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Notes */}
            {plan.overview.risk_notes && plan.overview.risk_notes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-amber-600">Risks & Concerns</h4>
                <ul className="list-disc list-inside space-y-1">
                  {plan.overview.risk_notes.map((risk, idx) => (
                    <li key={idx} className="text-sm text-amber-600">
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Estimates Section */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setIsEstimateExpanded(!isEstimateExpanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEstimateExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <CardTitle>Resource Estimates</CardTitle>
            </div>
          </div>
          <CardDescription>Estimated time, cost, and tokens for execution</CardDescription>
        </CardHeader>
        {isEstimateExpanded && (
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Time</p>
                <p className="text-2xl font-bold">{plan.estimate.time_minutes}</p>
                <p className="text-xs text-muted-foreground">minutes</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Cost</p>
                <p className="text-2xl font-bold">${plan.estimate.usd.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">USD</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Tokens</p>
                <p className="text-2xl font-bold">{plan.estimate.tokens.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">tokens</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Task Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Task Breakdown</CardTitle>
          <CardDescription>
            {plan.tasks.length} {plan.tasks.length === 1 ? 'task' : 'tasks'} identified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskTree tasks={plan.tasks} onEdit={onEdit} />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-3 justify-end">
          {onRegenerate && (
            <Button variant="outline" onClick={() => onRegenerate('')}>
              Regenerate Plan
            </Button>
          )}
          {onApprove && (
            <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve & Continue
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
