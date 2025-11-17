
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  ChevronDown, 
  ChevronRight,
  RefreshCw,
  Play,
  Edit3,
  Layers,
  Target,
  AlertCircle,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlanOutput, TaskNode } from '@/lib/schemas/planning-schema';

interface TaskDecompositionViewProps {
  plan: PlanOutput | null;
  isLoading?: boolean;
  error?: string | null;
  onApprove?: () => void;
  onRegenerate?: (feedback: string) => void;
  showActions?: boolean;
  className?: string;
}

export function TaskDecompositionView({
  plan,
  isLoading = false,
  error = null,
  onApprove,
  onRegenerate,
  showActions = true,
  className
}: TaskDecompositionViewProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(feedback.trim() || 'Please regenerate with improvements');
      setShowFeedback(false);
      setFeedback('');
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin">
              <Brain className="h-8 w-8 text-blue-600 mx-auto" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Generating Task Plan...</h3>
              <p className="text-sm text-muted-foreground">
                AI is analyzing your task and creating an optimized execution plan
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="font-medium text-red-600">Plan Generation Failed</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            {onRegenerate && (
              <Button onClick={() => handleRegenerate()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return null;
  }

  const renderTask = (task: TaskNode, level = 0) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasChildren = task.children && task.children.length > 0;

    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-2"
        style={{ marginLeft: `${level * 16}px` }}
      >
        <Collapsible open={isExpanded} onOpenChange={() => toggleTask(task.id)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  {hasChildren ? (
                    isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                    {task.id}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {task.type}
                  </Badge>
                  
                  {task.estimate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {task.estimate.time_minutes}m
                    </div>
                  )}
                  
                  {task.estimate && task.estimate.usd > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      ${task.estimate.usd.toFixed(3)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          {hasChildren && (
            <CollapsibleContent className="space-y-2 mt-2">
              <AnimatePresence>
                {task.children?.map((child) => 
                  renderTask(child as TaskNode, level + 1)
                )}
              </AnimatePresence>
            </CollapsibleContent>
          )}
        </Collapsible>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Task Execution Plan
              </CardTitle>
              <CardDescription>
                AI-generated breakdown with intelligent subtask organization
              </CardDescription>
            </div>
            
            {showActions && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFeedback(!showFeedback)}
                  size="sm"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Modify
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Plan Overview */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{plan.tasks?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Subtasks</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {plan.estimate?.time_minutes || 0}m
                  </div>
                  <div className="text-sm text-muted-foreground">Est. Time</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${plan.estimate?.usd?.toFixed(3) || '0.000'}
                  </div>
                  <div className="text-sm text-muted-foreground">Est. Cost</div>
                </CardContent>
              </Card>
            </div>

            {/* Plan Strategy */}
            {plan.overview?.overall_strategy && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Execution Strategy
                </h4>
                <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                  {plan.overview.overall_strategy}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Task Hierarchy */}
          <div className="space-y-4">
            <h4 className="font-medium">Task Breakdown</h4>
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {plan.tasks?.map((task) => renderTask(task))}
              </div>
            </ScrollArea>
          </div>

          {/* Feedback Section */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <Separator />
                <div className="space-y-3">
                  <Label htmlFor="feedback">Provide feedback to improve the plan</Label>
                  <Textarea
                    id="feedback"
                    placeholder="e.g., Add more detail to the testing phase, prioritize security considerations, use different technology stack..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleRegenerate} size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate Plan
                    </Button>
                    <Button variant="outline" onClick={() => setShowFeedback(false)} size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          {showActions && (
            <>
              <Separator />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={onApprove} className="flex-1" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Approve & Execute Plan
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowFeedback(true)}
                  className="sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
