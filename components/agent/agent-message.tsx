'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentExecutionState } from '@/lib/hooks/useAgentStream';
import { ActionStream } from './action-stream';
import { CodeDisplay } from './code-display';
import { BuildProgress } from './build-progress';
import { PreviewFrame } from './preview-frame';
import ReactMarkdown from 'react-markdown';

export interface AgentMessageProps {
  content?: string;
  agentState?: AgentExecutionState;
  className?: string;
}

export function AgentMessage({ content, agentState, className }: AgentMessageProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // If we only have text content
  if (content && !agentState) {
    return (
      <div className={cn('flex gap-3 items-start', className)}>
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Brain className="h-5 w-5 text-white" />
        </div>

        {/* Message content */}
        <Card className="flex-1">
          <CardContent className="py-3 px-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we have agent state
  if (agentState) {
    const hasContent = content || agentState.actions.length > 0;
    const hasCodeArtifacts = agentState.codeArtifacts.length > 0;
    const hasBuildInfo = agentState.buildInfo !== undefined;
    const hasPreview = agentState.previewUrl !== undefined;

    return (
      <div className={cn('flex gap-3 items-start', className)}>
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Brain className="h-5 w-5 text-white" />
        </div>

        {/* Message content */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Text content */}
          {content && (
            <Card>
              <CardContent className="py-3 px-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <div className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
              agentState.status === 'completed' && 'bg-green-500/10 text-green-500 border border-green-500/20',
              agentState.status === 'failed' && 'bg-red-500/10 text-red-500 border border-red-500/20',
              ['planning', 'executing', 'building', 'deploying'].includes(agentState.status) && 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
              agentState.status === 'idle' && 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
            )}>
              {agentState.status === 'completed' && '✓ Completed'}
              {agentState.status === 'failed' && '✗ Failed'}
              {agentState.status === 'planning' && '🤔 Planning...'}
              {agentState.status === 'executing' && '⚙️ Executing...'}
              {agentState.status === 'building' && '🔨 Building...'}
              {agentState.status === 'deploying' && '🚀 Deploying...'}
              {agentState.status === 'idle' && '⏸️ Idle'}
            </div>
            
            {agentState.progress > 0 && (
              <span className="text-xs text-muted-foreground">
                {agentState.progress}% complete
              </span>
            )}
          </div>

          {/* Collapsible section for details */}
          {hasContent && (
            <Card>
              <div className="p-3 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full justify-between h-8 px-2"
                >
                  <span className="text-xs font-medium">
                    Agent Details 
                    {agentState.completedSteps > 0 && (
                      <span className="ml-2 text-muted-foreground">
                        ({agentState.completedSteps}/{agentState.totalSteps} steps)
                      </span>
                    )}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {isExpanded && (
                <CardContent className="p-4 space-y-4">
                  {/* Action stream */}
                  {agentState.actions.length > 0 && (
                    <ActionStream actions={agentState.actions} />
                  )}
                </CardContent>
              )}
            </Card>
          )}

          {/* Code artifacts */}
          {hasCodeArtifacts && (
            <div className="space-y-3">
              {agentState.codeArtifacts.map((artifact) => (
                <CodeDisplay
                  key={artifact.id}
                  fileName={artifact.fileName}
                  language={artifact.language}
                  code={artifact.code}
                  defaultExpanded={false}
                />
              ))}
            </div>
          )}

          {/* Build progress */}
          {hasBuildInfo && agentState.buildInfo && (
            <BuildProgress buildInfo={agentState.buildInfo} />
          )}

          {/* Preview */}
          {hasPreview && (
            <PreviewFrame 
              previewUrl={agentState.previewUrl}
              title="Live Preview"
            />
          )}

          {/* Error message */}
          {agentState.error && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="py-3 px-4">
                <p className="text-sm text-red-500 font-medium mb-1">Error</p>
                <p className="text-xs text-red-400/80">{agentState.error}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return null;
}
