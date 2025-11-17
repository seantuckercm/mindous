'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Zap,
  FileText,
  Edit2,
  Check,
  X,
  Link2,
} from 'lucide-react';
import { TaskNode } from '@/lib/schemas/planning-schema';
import { cn } from '@/lib/utils';

interface TaskNodeCardProps {
  task: TaskNode;
  index: number;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit?: (updates: Partial<TaskNode>) => void;
}

const taskTypeColors: Record<string, string> = {
  research: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  analysis: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  action: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  deliverable: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export function TaskNodeCard({
  task,
  index,
  level,
  hasChildren,
  isExpanded,
  onToggleExpand,
  onEdit,
}: TaskNodeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [showDetails, setShowDetails] = useState(false);

  const handleSave = () => {
    if (onEdit) {
      onEdit({
        title: editTitle,
        description: editDescription,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(false);
  };

  return (
    <Card className={cn('p-4 hover:shadow-md transition-shadow', level > 0 && 'ml-6 border-l-4')}>
      {/* Task Header */}
      <div className="flex items-start gap-3">
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={onToggleExpand}
            className="mt-1 p-1 hover:bg-muted rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Type */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-muted-foreground">
              {level === 0 ? `Task ${index + 1}` : `Subtask ${index + 1}`}
            </span>
            <Badge variant="outline" className={cn('text-xs', taskTypeColors[task.type])}>
              {task.type}
            </Badge>
            {task.dependencies && task.dependencies.length > 0 && (
              <Badge variant="outline" className="text-xs">
                <Link2 className="h-3 w-3 mr-1" />
                {task.dependencies.length} dep{task.dependencies.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Title (Editable) */}
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mb-2"
              placeholder="Task title"
            />
          ) : (
            <h4 className="font-semibold text-lg mb-1">{task.title}</h4>
          )}

          {/* Description (Editable) */}
          {isEditing ? (
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="mb-2"
              placeholder="Task description"
              rows={3}
            />
          ) : (
            task.description && (
              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
            )
          )}

          {/* Estimates */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
            {task.estimate?.time_minutes > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{task.estimate.time_minutes} min</span>
              </div>
            )}
            {task.estimate?.usd > 0 && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>${task.estimate.usd.toFixed(3)}</span>
              </div>
            )}
            {task.estimate?.tokens > 0 && (
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>{task.estimate.tokens} tokens</span>
              </div>
            )}
          </div>

          {/* Expected Artifacts */}
          {task.expected_artifacts && task.expected_artifacts.length > 0 && !isEditing && (
            <div className="mb-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <FileText className="h-3 w-3" />
                {task.expected_artifacts.length} expected artifact
                {task.expected_artifacts.length > 1 ? 's' : ''}
                {showDetails ? ' (hide)' : ' (show)'}
              </button>
              {showDetails && (
                <ul className="mt-1 ml-4 list-disc text-xs text-muted-foreground">
                  {task.expected_artifacts.map((artifact, idx) => (
                    <li key={idx}>{artifact}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Dependencies */}
          {task.dependencies && task.dependencies.length > 0 && showDetails && (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Depends on:</span>{' '}
                {task.dependencies.join(', ')}
              </p>
            </div>
          )}

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleSave}>
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Edit Button */}
        {!isEditing && onEdit && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
