'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageList, Message } from './message-list';
import { MessageInput } from './message-input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Plus, Settings, Brain, PanelRight, PanelRightClose } from 'lucide-react';
import { useAgentStream } from '@/lib/hooks/useAgentStream';
import { ArchAgentWorkspace, ClarificationModal } from '@/components/archagent';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  userId: string;
}

interface ActiveExecution {
  executionId: string;
  runId: string;
  buildId?: string;
  messageId: string;
}

interface ClarificationQuestion {
  id: string;
  question: string;
  options: string[];
  default: string;
  category: 'technical' | 'design' | 'functional' | 'other';
  required: boolean;
  explanation?: string;
}

export function ChatInterface({ userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeExecution, setActiveExecution] = useState<ActiveExecution | null>(null);
  const [showArchAgent, setShowArchAgent] = useState(false);
  const [showClarification, setShowClarification] = useState(false);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string>('');
  const [pendingExecutionId, setPendingExecutionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create new session on mount
  useEffect(() => {
    createNewSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createNewSession = async () => {
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title: 'New Chat' }),
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Use agent stream hook if there's an active execution
  const { state: agentState, isConnected } = useAgentStream({
    runId: activeExecution?.runId || '',
    executionId: activeExecution?.executionId || '',
    onCompleted: () => {
      console.log('✅ Agent execution completed');
      setIsExecuting(false);
    },
    onError: (error) => {
      console.error('❌ Agent execution error:', error);
      setIsExecuting(false);
    },
  });

  // Update agent message when state changes
  useEffect(() => {
    if (activeExecution && agentState) {
      setMessages(prev => prev.map(msg => 
        msg.id === activeExecution.messageId 
          ? { ...msg, agentState }
          : msg
      ));
    }
  }, [agentState, activeExecution]);

  const startExecution = async (prompt: string, clarificationAnswers?: Record<string, string>) => {
    try {
      // Start agent execution
      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          clarifications: clarificationAnswers,
          context: {
            taskType: 'code',
            complexity: 'medium',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start agent execution');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to start agent execution');
      }

      // If we have clarification answers, save them
      if (clarificationAnswers && data.executionId) {
        await fetch('/api/archagent/clarify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'submit',
            executionId: data.executionId,
            answers: clarificationAnswers,
          }),
        });
      }

      // Create agent message placeholder
      const agentMessageId = crypto.randomUUID();
      const agentMessage: Message = {
        id: agentMessageId,
        role: 'agent',
        content: 'Starting execution...',
        createdAt: new Date(),
        agentState: {
          runId: data.runId,
          executionId: data.executionId,
          status: 'planning',
          progress: 0,
          totalSteps: 0,
          completedSteps: 0,
          actions: [],
          codeArtifacts: [],
        },
      };

      setMessages(prev => [...prev, agentMessage]);
      
      // Set active execution
      setActiveExecution({
        executionId: data.executionId,
        runId: data.runId,
        buildId: data.buildId,
        messageId: agentMessageId,
      });

      // Auto-show ArchAgent workspace when execution starts
      setShowArchAgent(true);

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: 'Failed to start agent execution. Please try again.',
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsExecuting(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!sessionId || !content.trim() || isExecuting) return;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsExecuting(true);

    try {
      // Generate clarification questions
      const clarifyResponse = await fetch('/api/archagent/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          prompt: content,
          executionId: crypto.randomUUID(), // Temp ID for clarification
        }),
      });

      if (clarifyResponse.ok) {
        const clarifyData = await clarifyResponse.json();
        
        if (clarifyData.success && clarifyData.questions && clarifyData.questions.length > 0) {
          // Show clarification modal
          setClarificationQuestions(clarifyData.questions);
          setPendingPrompt(content);
          setShowClarification(true);
          setIsExecuting(false); // Allow user to interact with clarification modal
          return;
        }
      }

      // No clarifications needed, start execution directly
      await startExecution(content);

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: 'Failed to start agent execution. Please try again.',
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsExecuting(false);
    }
  };

  const handleClarificationSubmit = async (answers: Record<string, string>) => {
    setShowClarification(false);
    setIsExecuting(true);
    toast.success('Clarifications submitted! Starting execution...');
    await startExecution(pendingPrompt, answers);
  };

  const handleClarificationAutoDecide = async () => {
    setShowClarification(false);
    setIsExecuting(true);
    
    try {
      // Get AI to auto-decide
      const response = await fetch('/api/archagent/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto_decide',
          prompt: pendingPrompt,
          executionId: pendingExecutionId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.answers) {
          toast.success('AI has chosen default answers. Starting execution...');
          await startExecution(pendingPrompt, data.answers);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to auto-decide:', error);
    }

    // Fallback: start without clarifications
    toast.success('Starting execution with defaults...');
    await startExecution(pendingPrompt);
  };

  const handleClarificationCancel = () => {
    setShowClarification(false);
    setIsExecuting(false);
    setPendingPrompt('');
    setPendingExecutionId('');
    toast.info('Execution cancelled');
  };

  // Chat Panel Component
  const chatPanel = (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t px-6 py-4">
        <MessageInput 
          onSend={handleSendMessage} 
          disabled={isExecuting}
          placeholder="Describe an app you want to build..."
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Mindous AI</h1>
          </div>
          {isExecuting && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-muted-foreground">
                {agentState?.status === 'planning' && 'Planning execution...'}
                {agentState?.status === 'executing' && 'Executing tasks...'}
                {agentState?.status === 'building' && 'Building app...'}
                {agentState?.status === 'deploying' && 'Deploying preview...'}
              </span>
              {isConnected && agentState?.progress > 0 && (
                <span className="text-xs text-blue-500 font-medium">
                  {agentState.progress}%
                </span>
              )}
            </div>
          )}
          {activeExecution && showArchAgent && (
            <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
              ArchAgent Active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={createNewSession} disabled={isExecuting}>
            <Plus className="h-4 w-4" />
          </Button>
          {activeExecution && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowArchAgent(!showArchAgent)}
              title={showArchAgent ? "Hide ArchAgent Tools" : "Show ArchAgent Tools"}
            >
              {showArchAgent ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRight className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => window.location.href = '/archagent/settings'}
            title="ArchAgent Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeExecution && showArchAgent ? (
          <ArchAgentWorkspace
            runId={activeExecution.runId}
            buildId={activeExecution.buildId}
            chatPanel={chatPanel}
          />
        ) : (
          chatPanel
        )}
      </div>

      {/* Clarification Modal */}
      <ClarificationModal
        open={showClarification}
        questions={clarificationQuestions}
        onSubmit={handleClarificationSubmit}
        onAutoDecide={handleClarificationAutoDecide}
        onCancel={handleClarificationCancel}
      />
    </div>
  );
}
