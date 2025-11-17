'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { TaskDecompositionView } from './planning/task-decomposition-view';
import { PlanOutput } from '@/lib/schemas/planning-schema';

export default function TaskFormWithPlanning() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [autoDecompose, setAutoDecompose] = useState(false);
  const [taskType, setTaskType] = useState<string>('action');
  const [complexity, setComplexity] = useState<string>('medium');
  
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [plan, setPlan] = useState<PlanOutput | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [showPlanPreview, setShowPlanPreview] = useState(false);

  const handleDecompose = async () => {
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setIsDecomposing(true);
    setPlanError(null);
    setPlan(null);

    try {
      const response = await fetch('/api/tasks/decompose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalTitle: title.trim(),
          goalDescription: description.trim() || undefined,
          context: {
            taskType,
            complexity,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to decompose task');
      }

      if (data.success && data.plan) {
        setPlan(data.plan);
        setShowPlanPreview(true);
        toast.success('Plan generated successfully!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to decompose task';
      setPlanError(errorMessage);
      toast.error(errorMessage);
      console.error('Error decomposing task:', error);
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }

    // If auto-decompose is enabled but no plan generated yet
    if (autoDecompose && !plan) {
      await handleDecompose();
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          plan: plan || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      toast.success('Task created successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setPlan(null);
      setShowPlanPreview(false);
      setAutoDecompose(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      toast.error(errorMessage);
      console.error('Error creating task:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRegeneratePlan = async (feedback: string) => {
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setIsDecomposing(true);
    setPlanError(null);

    try {
      const response = await fetch('/api/tasks/decompose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalTitle: title.trim(),
          goalDescription: description.trim() || undefined,
          context: {
            taskType,
            complexity,
          },
          feedback: feedback || 'Please regenerate with improvements',
          previousVersion: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate plan');
      }

      if (data.success && data.plan) {
        setPlan(data.plan);
        toast.success('Plan regenerated successfully!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate plan';
      setPlanError(errorMessage);
      toast.error(errorMessage);
      console.error('Error regenerating plan:', error);
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleApprovePlan = () => {
    toast.success('Plan approved! Creating task...');
    // Trigger form submission
    const form = document.getElementById('task-form') as HTMLFormElement;
    form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Create New Task
          </CardTitle>
          <CardDescription>
            Add a new task to your workflow. Enable auto-decompose for AI-powered task breakdown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter task title (e.g., Build a todo app)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isDecomposing || isCreating}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isDecomposing || isCreating}
                rows={4}
              />
            </div>

            {/* Auto-decompose Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="auto-decompose" className="text-base cursor-pointer">
                  Auto-decompose Task
                </Label>
                <p className="text-sm text-muted-foreground">
                  Let AI break down your task into structured subtasks
                </p>
              </div>
              <Switch
                id="auto-decompose"
                checked={autoDecompose}
                onCheckedChange={(checked) => {
                  setAutoDecompose(checked);
                  if (!checked) {
                    setPlan(null);
                    setShowPlanPreview(false);
                  }
                }}
                disabled={isDecomposing || isCreating}
              />
            </div>

            {/* Task Type and Complexity (only shown when auto-decompose is enabled) */}
            {autoDecompose && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-type">Task Type</Label>
                  <Select value={taskType} onValueChange={setTaskType} disabled={isDecomposing || isCreating}>
                    <SelectTrigger id="task-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code">Code</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="extraction">Extraction</SelectItem>
                      <SelectItem value="reasoning">Reasoning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complexity">Complexity</Label>
                  <Select value={complexity} onValueChange={setComplexity} disabled={isDecomposing || isCreating}>
                    <SelectTrigger id="complexity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {!showPlanPreview && (
              <Button
                type="submit"
                disabled={isDecomposing || isCreating}
                className="w-full"
              >
                {isDecomposing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Plan...
                  </>
                ) : isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Task...
                  </>
                ) : autoDecompose ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Plan
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Plan Preview */}
      {showPlanPreview && (
        <TaskDecompositionView
          plan={plan}
          isLoading={isDecomposing}
          error={planError}
          onApprove={handleApprovePlan}
          onRegenerate={handleRegeneratePlan}
          showActions={true}
        />
      )}
    </div>
  );
}
