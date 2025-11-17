'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface AgentEvent {
  id: string;
  runId: string;
  subtaskId?: string;
  eventType: string;
  message: string;
  data?: any;
  timestamp: string;
}

export interface AgentAction {
  id: string;
  type: 'task_started' | 'task_completed' | 'code_generated' | 'build_started' | 'build_completed' | 'preview_ready' | 'error';
  title: string;
  description?: string;
  timestamp: string;
  data?: any;
}

export interface AgentExecutionState {
  runId: string;
  executionId: string;
  status: 'idle' | 'planning' | 'executing' | 'building' | 'deploying' | 'completed' | 'failed';
  currentStep?: string;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  actions: AgentAction[];
  codeArtifacts: CodeArtifact[];
  buildInfo?: BuildInfo;
  previewUrl?: string;
  error?: string;
}

export interface CodeArtifact {
  id: string;
  fileName: string;
  language: string;
  code: string;
  timestamp: string;
}

export interface BuildInfo {
  buildId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  currentStep?: string;
  logs: string[];
  startTime: string;
  endTime?: string;
  error?: string;
}

export interface UseAgentStreamOptions {
  runId: string;
  executionId: string;
  onAction?: (action: AgentAction) => void;
  onCodeGenerated?: (artifact: CodeArtifact) => void;
  onBuildUpdate?: (buildInfo: BuildInfo) => void;
  onPreviewReady?: (previewUrl: string) => void;
  onError?: (error: Error) => void;
  onCompleted?: () => void;
}

export function useAgentStream(options: UseAgentStreamOptions) {
  const {
    runId,
    executionId,
    onAction,
    onCodeGenerated,
    onBuildUpdate,
    onPreviewReady,
    onError,
    onCompleted
  } = options;

  const [state, setState] = useState<AgentExecutionState>({
    runId,
    executionId,
    status: 'idle',
    progress: 0,
    totalSteps: 0,
    completedSteps: 0,
    actions: [],
    codeArtifacts: [],
  });

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const lastEventIdRef = useRef<string | null>(null);

  // Process incoming events and update state
  const processEvent = useCallback((event: AgentEvent) => {
    lastEventIdRef.current = event.timestamp;

    setState(prev => {
      const newState = { ...prev };

      switch (event.eventType) {
        case 'EXECUTION_STARTED':
          newState.status = 'planning';
          newState.totalSteps = event.data?.totalSteps || 0;
          
          // Add action
          const startAction: AgentAction = {
            id: crypto.randomUUID(),
            type: 'task_started',
            title: 'Agent execution started',
            description: event.data?.prompt || '',
            timestamp: event.timestamp,
          };
          newState.actions.push(startAction);
          if (onAction) onAction(startAction);
          break;

        case 'EXECUTION_PROGRESS':
          newState.status = 'executing';
          newState.progress = event.data?.progress || 0;
          newState.currentStep = event.data?.currentStep || '';
          break;

        case 'EXECUTION_COMPLETED':
          newState.status = 'completed';
          newState.progress = 100;
          
          const completeAction: AgentAction = {
            id: crypto.randomUUID(),
            type: 'task_completed',
            title: 'Execution completed',
            timestamp: event.timestamp,
          };
          newState.actions.push(completeAction);
          if (onAction) onAction(completeAction);
          if (onCompleted) onCompleted();
          break;

        case 'EXECUTION_FAILED':
          newState.status = 'failed';
          newState.error = event.data?.error || 'Unknown error';
          
          const errorAction: AgentAction = {
            id: crypto.randomUUID(),
            type: 'error',
            title: 'Execution failed',
            description: event.data?.error,
            timestamp: event.timestamp,
          };
          newState.actions.push(errorAction);
          if (onAction) onAction(errorAction);
          if (onError) onError(new Error(event.data?.error));
          break;

        case 'STEP_STARTED':
          const stepStartAction: AgentAction = {
            id: event.subtaskId || crypto.randomUUID(),
            type: 'task_started',
            title: event.data?.stepName || event.message,
            timestamp: event.timestamp,
          };
          newState.actions.push(stepStartAction);
          if (onAction) onAction(stepStartAction);
          break;

        case 'STEP_COMPLETED':
          newState.completedSteps++;
          
          const stepCompleteAction: AgentAction = {
            id: event.subtaskId || crypto.randomUUID(),
            type: 'task_completed',
            title: event.data?.stepName || event.message,
            timestamp: event.timestamp,
            data: event.data?.result,
          };
          newState.actions.push(stepCompleteAction);
          if (onAction) onAction(stepCompleteAction);
          break;

        case 'CODE_GENERATION_STARTED':
          newState.currentStep = 'Generating code...';
          break;

        case 'CODE_GENERATION_COMPLETED':
          const artifact: CodeArtifact = {
            id: crypto.randomUUID(),
            fileName: event.data?.fileName || 'code.ts',
            language: event.data?.language || 'typescript',
            code: event.data?.code || '',
            timestamp: event.timestamp,
          };
          newState.codeArtifacts.push(artifact);
          
          const codeAction: AgentAction = {
            id: crypto.randomUUID(),
            type: 'code_generated',
            title: `Code generated: ${artifact.fileName}`,
            timestamp: event.timestamp,
            data: artifact,
          };
          newState.actions.push(codeAction);
          if (onAction) onAction(codeAction);
          if (onCodeGenerated) onCodeGenerated(artifact);
          break;

        case 'BUILD_STARTED':
          newState.status = 'building';
          newState.buildInfo = {
            buildId: event.data?.buildId,
            status: 'in_progress',
            logs: [],
            startTime: event.timestamp,
          };
          
          const buildStartAction: AgentAction = {
            id: crypto.randomUUID(),
            type: 'build_started',
            title: 'Build started',
            timestamp: event.timestamp,
          };
          newState.actions.push(buildStartAction);
          if (onAction) onAction(buildStartAction);
          if (onBuildUpdate && newState.buildInfo) onBuildUpdate(newState.buildInfo);
          break;

        case 'BUILD_LOG':
          if (newState.buildInfo) {
            newState.buildInfo.logs.push(event.data?.log || event.message);
            if (onBuildUpdate) onBuildUpdate(newState.buildInfo);
          }
          break;

        case 'BUILD_PROGRESS':
          if (newState.buildInfo) {
            newState.buildInfo.currentStep = event.data?.step || event.message;
            if (onBuildUpdate) onBuildUpdate(newState.buildInfo);
          }
          break;

        case 'BUILD_COMPLETED':
          if (newState.buildInfo) {
            newState.buildInfo.status = 'completed';
            newState.buildInfo.endTime = event.timestamp;
          }
          newState.status = 'deploying';
          
          const buildCompleteAction: AgentAction = {
            id: crypto.randomUUID(),
            type: 'build_completed',
            title: 'Build completed',
            timestamp: event.timestamp,
          };
          newState.actions.push(buildCompleteAction);
          if (onAction) onAction(buildCompleteAction);
          if (onBuildUpdate && newState.buildInfo) onBuildUpdate(newState.buildInfo);
          break;

        case 'BUILD_FAILED':
          if (newState.buildInfo) {
            newState.buildInfo.status = 'failed';
            newState.buildInfo.error = event.data?.error || 'Build failed';
            newState.buildInfo.endTime = event.timestamp;
          }
          
          const buildErrorAction: AgentAction = {
            id: crypto.randomUUID(),
            type: 'error',
            title: 'Build failed',
            description: event.data?.error,
            timestamp: event.timestamp,
          };
          newState.actions.push(buildErrorAction);
          if (onAction) onAction(buildErrorAction);
          if (onBuildUpdate && newState.buildInfo) onBuildUpdate(newState.buildInfo);
          break;

        case 'PREVIEW_STARTING':
          newState.currentStep = 'Starting preview...';
          break;

        case 'PREVIEW_READY':
          newState.previewUrl = event.data?.previewUrl;
          
          const previewAction: AgentAction = {
            id: crypto.randomUUID(),
            type: 'preview_ready',
            title: 'Preview ready',
            timestamp: event.timestamp,
            data: { url: event.data?.previewUrl },
          };
          newState.actions.push(previewAction);
          if (onAction) onAction(previewAction);
          if (onPreviewReady) onPreviewReady(event.data?.previewUrl);
          break;

        case 'PREVIEW_FAILED':
          const previewErrorAction: AgentAction = {
            id: crypto.randomUUID(),
            type: 'error',
            title: 'Preview failed',
            description: event.data?.error,
            timestamp: event.timestamp,
          };
          newState.actions.push(previewErrorAction);
          if (onAction) onAction(previewErrorAction);
          break;
      }

      return newState;
    });
  }, [onAction, onCodeGenerated, onBuildUpdate, onPreviewReady, onError, onCompleted]);

  // Connect to SSE stream
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const url = lastEventIdRef.current
        ? `/api/streams/runs/${runId}?lastEventId=${encodeURIComponent(lastEventIdRef.current)}`
        : `/api/streams/runs/${runId}`;

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('connected', () => {
        console.log('✅ Connected to agent stream');
        setIsConnected(true);
        setError(null);
      });

      eventSource.addEventListener('event', (e) => {
        try {
          const event: AgentEvent = JSON.parse(e.data);
          processEvent(event);
        } catch (err) {
          console.error('Error parsing event:', err);
        }
      });

      eventSource.addEventListener('error', () => {
        console.error('❌ SSE error');
        setIsConnected(false);
        const err = new Error('SSE connection error');
        setError(err);
      });

    } catch (err) {
      console.error('Error creating EventSource:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    }
  }, [runId, processEvent]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  return {
    state,
    isConnected,
    error,
    reconnect: connect,
  };
}
