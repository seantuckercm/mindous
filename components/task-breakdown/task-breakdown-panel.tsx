
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  Clock, 
  Play, 
  Pause, 
  AlertTriangle, 
  Loader2,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';

interface Subtask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  dependencies: string[];
  estimatedDuration: string;
  tools: string[];
}

interface TaskBreakdown {
  title: string;
  description: string;
  subtasks: Subtask[];
}

interface TaskBreakdownPanelProps {
  onExecute?: (breakdown: TaskBreakdown) => void;
}

export function TaskBreakdownPanel({ onExecute }: TaskBreakdownPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [breakdown, setBreakdown] = useState<TaskBreakdown | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleBreakdown = async () => {
    if (!prompt.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/tasks/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to break down task');
      }
      
      const data = await response.json();
      setBreakdown(data);
    } catch (error) {
      console.error('Failed to break down task:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExecute = () => {
    if (breakdown && onExecute) {
      onExecute(breakdown);
    }
  };

  const handleEditSubtask = (subtaskId: string, field: string, value: string) => {
    if (!breakdown) return;
    
    setBreakdown({
      ...breakdown,
      subtasks: breakdown.subtasks.map(task =>
        task.id === subtaskId ? { ...task, [field]: value } : task
      )
    });
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    if (!breakdown) return;
    
    setBreakdown({
      ...breakdown,
      subtasks: breakdown.subtasks.filter(task => task.id !== subtaskId)
    });
  };

  const handleAddSubtask = () => {
    if (!breakdown) return;
    
    const newId = (breakdown.subtasks.length + 1).toString();
    const newSubtask: Subtask = {
      id: newId,
      title: 'New Subtask',
      description: 'Description for the new subtask',
      status: 'pending',
      dependencies: [],
      estimatedDuration: '10 minutes',
      tools: []
    };
    
    setBreakdown({
      ...breakdown,
      subtasks: [...breakdown.subtasks, newSubtask]
    });
  };

  const getStatusIcon = (status: Subtask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Subtask['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Task Breakdown</CardTitle>
          <CardDescription>
            Describe your task and I&apos;ll break it down into manageable steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe what you want to accomplish... (e.g., 'Create a landing page for my SaaS product', 'Analyze sales data and create a report', 'Set up a database for user management')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button 
              onClick={handleBreakdown} 
              disabled={!prompt.trim() || isAnalyzing}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Break Down Task'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Results */}
      {breakdown && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{breakdown.title}</CardTitle>
                <CardDescription>{breakdown.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? 'Done' : 'Edit'}
                </Button>
                <Button onClick={handleExecute} className="bg-blue-600 hover:bg-blue-700">
                  <Play className="h-4 w-4 mr-2" />
                  Execute Plan
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {breakdown.subtasks.map((subtask, index) => (
                <Card key={subtask.id} className="border-l-4 border-l-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {index + 1}
                        </span>
                        {getStatusIcon(subtask.status)}
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          {isEditing ? (
                            <input
                              type="text"
                              value={subtask.title}
                              onChange={(e) => handleEditSubtask(subtask.id, 'title', e.target.value)}
                              className="font-semibold text-lg bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none flex-1 mr-4"
                            />
                          ) : (
                            <h3 className="font-semibold text-lg">{subtask.title}</h3>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={getStatusColor(subtask.status)}>
                              {subtask.status}
                            </Badge>
                            <Badge variant="outline">
                              {subtask.estimatedDuration}
                            </Badge>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSubtask(subtask.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {isEditing ? (
                          <textarea
                            value={subtask.description}
                            onChange={(e) => handleEditSubtask(subtask.id, 'description', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded resize-none"
                            rows={2}
                          />
                        ) : (
                          <p className="text-gray-700">{subtask.description}</p>
                        )}
                        
                        {subtask.dependencies.length > 0 && (
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Depends on:</span> {subtask.dependencies.join(', ')}
                          </div>
                        )}
                        
                        {subtask.tools.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {subtask.tools.map((tool) => (
                              <Badge key={tool} variant="outline" className="text-xs">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={handleAddSubtask}
                  className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subtask
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
