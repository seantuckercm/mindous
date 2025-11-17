
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  FileText, 
  Database, 
  Globe, 
  Activity,
  Zap
} from 'lucide-react';

interface FileOperation {
  type: 'read' | 'write' | 'create' | 'delete';
  fileName: string;
  status: 'completed' | 'running' | 'pending';
}

interface ProgressStatusBarProps {
  currentTask?: string;
  currentStep?: number;
  totalSteps?: number;
  overallProgress?: number;
  fileOperations?: FileOperation[];
  isRunning?: boolean;
}

export function ProgressStatusBar({
  currentTask = "Idle",
  currentStep = 0,
  totalSteps = 0,
  overallProgress = 0,
  fileOperations = [],
  isRunning = false
}: ProgressStatusBarProps) {
  
  const getFileOperationIcon = (type: FileOperation['type']) => {
    switch (type) {
      case 'read': return <FileText className="h-3 w-3" />;
      case 'write': return <FileText className="h-3 w-3" />;
      case 'create': return <FileText className="h-3 w-3" />;
      case 'delete': return <FileText className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const getOperationColor = (type: FileOperation['type']) => {
    switch (type) {
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'write': return 'bg-orange-100 text-orange-800';
      case 'create': return 'bg-green-100 text-green-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-t-4 border-t-blue-600 rounded-t-none">
      <CardContent className="p-4">
        <div className="flex items-center gap-6">
          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            {isRunning ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
            ) : (
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
            )}
            
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">
                {currentTask}
              </div>
              {totalSteps > 0 && (
                <div className="text-xs text-muted-foreground">
                  Step {currentStep} of {totalSteps}
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-md space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* File Operations */}
          {fileOperations.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Files:</span>
              <div className="flex gap-1">
                {fileOperations.slice(0, 3).map((operation, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className={`text-xs px-2 py-1 ${getOperationColor(operation.type)}`}
                  >
                    <div className="flex items-center gap-1">
                      {getFileOperationIcon(operation.type)}
                      <span>{operation.type}</span>
                      {operation.status === 'running' && (
                        <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
                      )}
                    </div>
                  </Badge>
                ))}
                {fileOperations.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{fileOperations.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Activity Icons */}
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-600" />
            <Globe className="h-4 w-4 text-green-600" />
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
