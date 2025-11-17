"use client";

/**
 * Test page for Feature 1 (P0) Run Progress Components
 * This page demonstrates the TaskCard, StatusBar, and RunProgressPanel components
 * Updated to use real API endpoints with Drizzle ORM and Supabase
 */

import { useState } from 'react';
import { RunProgressPanel, type RunData } from '@/components/runs/run-progress-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function TestRunProgressPage() {
  const [createdRunId, setCreatedRunId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('Build a Modern Landing Page with React');
  const [description, setDescription] = useState('Create a responsive landing page using React and Tailwind CSS');
  const [subtasks, setSubtasks] = useState<string[]>([
    'Planning project structure',
    'Setting up development environment',
    'Installing dependencies',
    'Creating component structure',
    'Implementing header component',
  ]);
  const [newSubtask, setNewSubtask] = useState('');

  // Handler to create a new run via API
  const handleCreateRun = async () => {
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/runs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          userId: 'test-user-123', // In a real app, this would come from auth
          metadata: {
            source: 'test-page',
            createdBy: 'manual'
          },
          subtasks: subtasks.filter(s => s.trim()).map(s => ({
            title: s.trim(),
            description: ''
          }))
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create run');
      }

      const result = await response.json();
      setCreatedRunId(result.data.taskId);
      toast.success('Run created successfully!');

      // Start the execution by updating its status to running
      await fetch(`/api/runs/${result.data.taskId}/resume`, {
        method: 'PATCH',
      });

    } catch (error) {
      console.error('Error creating run:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create run');
    } finally {
      setIsCreating(false);
    }
  };

  // Handler for pause action
  const handlePause = async (runId: string) => {
    try {
      const response = await fetch(`/api/runs/${runId}/pause`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to pause run');
      }

      toast.success('Run paused successfully');
    } catch (error) {
      console.error('Error pausing run:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to pause run');
      throw error;
    }
  };

  // Handler for cancel action
  const handleCancel = async (runId: string) => {
    try {
      const response = await fetch(`/api/runs/${runId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Cancelled by user from test page'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel run');
      }

      toast.success('Run cancelled successfully');
    } catch (error) {
      console.error('Error cancelling run:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel run');
      throw error;
    }
  };

  // Handler for resume action
  const handleResume = async (runId: string) => {
    try {
      const response = await fetch(`/api/runs/${runId}/resume`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resume run');
      }

      toast.success('Run resumed successfully');
    } catch (error) {
      console.error('Error resuming run:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resume run');
      throw error;
    }
  };

  // Helper to add subtask
  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  // Helper to remove subtask
  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Feature 1 (P0) - Run Progress with Real API</h1>
          <p className="text-muted-foreground text-lg">
            Testing TaskCard, StatusBar, and RunProgressPanel components with real Supabase database
          </p>
        </div>

        {/* Create New Run Form */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Create New Run</CardTitle>
            <CardDescription>
              Create a new run with subtasks to test the API integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                disabled={isCreating}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Subtasks ({subtasks.length})</Label>
              <div className="space-y-2">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={subtask}
                      onChange={(e) => {
                        const newSubtasks = [...subtasks];
                        newSubtasks[index] = e.target.value;
                        setSubtasks(newSubtasks);
                      }}
                      disabled={isCreating}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSubtask(index)}
                      disabled={isCreating}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add new subtask"
                  disabled={isCreating}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSubtask();
                    }
                  }}
                />
                <Button
                  onClick={handleAddSubtask}
                  disabled={isCreating || !newSubtask.trim()}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <Button
              onClick={handleCreateRun}
              disabled={isCreating || !title.trim()}
              className="w-full"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Run...
                </>
              ) : (
                'Create and Start Run'
              )}
            </Button>

            {createdRunId && (
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  ✓ Run created successfully!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Run ID: {createdRunId}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Display Created Run */}
        {createdRunId && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Live Run Progress</h2>
            <RunProgressPanel
              runId={createdRunId}
              onPause={handlePause}
              onCancel={handleCancel}
              onResume={handleResume}
            />
          </div>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Fill in the task title and description above</p>
            <p>2. Add or modify subtasks as needed</p>
            <p>3. Click &quot;Create and Start Run&quot; to create a new run in the database</p>
            <p>4. The run will appear below with real-time data from Supabase</p>
            <p>5. Use the Pause, Cancel, and Resume buttons to test the API endpoints</p>
            <p>6. Check the browser console and network tab for API responses</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
