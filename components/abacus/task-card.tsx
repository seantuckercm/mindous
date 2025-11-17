
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  MoreHorizontal,
  Eye
} from 'lucide-react';

interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  totalSteps?: number;
  completedSteps?: number;
  estimatedDuration?: string;
  actualDuration?: string;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onView?: () => void;
}

export function TaskCard({
  id,
  title,
  description,
  status,
  progress,
  totalSteps = 0,
  completedSteps = 0,
  estimatedDuration,
  actualDuration,
  onStart,
  onPause,
  onResume,
  onStop,
  onView
}: TaskCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'running':
        return <Play className="h-5 w-5 text-blue-600" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'running':
        return 'border-blue-200 bg-blue-50 shadow-md';
      case 'paused':
        return 'border-yellow-200 bg-yellow-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'running': return 'bg-blue-600';
      case 'paused': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-300';
    }
  };

  return (
    <Card className={`transition-all duration-200 ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={
                status === 'completed' ? 'bg-green-100 text-green-800' :
                status === 'running' ? 'bg-blue-100 text-blue-800' :
                status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }
            >
              {status}
            </Badge>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {completedSteps}/{totalSteps} steps ({Math.round(progress)}%)
            </span>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-2" />
            <div 
              className={`absolute inset-0 rounded-full opacity-20 ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Duration Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {estimatedDuration && (
              <span>Est: {estimatedDuration}</span>
            )}
          </div>
          <div>
            {actualDuration && (
              <span>Actual: {actualDuration}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {status === 'pending' && onStart && (
            <Button size="sm" onClick={onStart} className="bg-blue-600 hover:bg-blue-700">
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}
          
          {status === 'running' && onPause && (
            <Button size="sm" variant="outline" onClick={onPause}>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          
          {status === 'paused' && onResume && (
            <Button size="sm" onClick={onResume} className="bg-blue-600 hover:bg-blue-700">
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          
          {(status === 'running' || status === 'paused') && onStop && (
            <Button size="sm" variant="outline" onClick={onStop}>
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          
          {onView && (
            <Button size="sm" variant="ghost" onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
