'use client';

import { useState } from 'react';
import { TaskNode } from '@/lib/schemas/planning-schema';
import { TaskNodeCard } from './task-node-card';

interface TaskTreeProps {
  tasks: TaskNode[];
  onEdit?: (taskId: string, updates: Partial<TaskNode>) => void;
  level?: number;
}

export function TaskTree({ tasks, onEdit, level = 0 }: TaskTreeProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No tasks defined
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => {
        const hasChildren = task.children && task.children.length > 0;
        const isExpanded = expandedTasks.has(task.id);

        return (
          <div key={task.id} className="relative">
            {/* Connection line for nested tasks */}
            {level > 0 && (
              <div
                className="absolute left-0 top-0 bottom-0 w-px bg-border"
                style={{ marginLeft: `${(level - 1) * 24}px` }}
              />
            )}

            {/* Task Node */}
            <div style={{ marginLeft: `${level * 24}px` }}>
              <TaskNodeCard
                task={task}
                index={index}
                level={level}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleExpand(task.id)}
                onEdit={onEdit ? (updates) => onEdit(task.id, updates) : undefined}
              />
            </div>

            {/* Render children if expanded */}
            {hasChildren && isExpanded && (
              <div className="mt-2">
                <TaskTree
                  tasks={task.children as TaskNode[]}
                  onEdit={onEdit}
                  level={level + 1}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
