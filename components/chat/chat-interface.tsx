'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { TaskCard } from '../runs/task-card';
import { StatusBar } from '../runs/status-bar';
import { Button } from '../ui/button';
import { Plus, Settings } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

interface AgentTask {
  id: string;
  title: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  statusDetail?: string;
  currentSubtask?: number;
  totalSubtasks?: number;
}

interface ChatInterfaceProps {
  userId: string;
}

export function ChatInterface({ userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create new session on mount
  useEffect(() => {
    createNewSession();
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

  const handleSendMessage = async (content: string) => {
    if (!sessionId || !content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    try {
      // Send message and start agent orchestration
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          content,
        }),
      });

      const data = await res.json();
      
      // Start task monitoring
      if (data.agentRunId) {
        monitorAgentRun(data.agentRunId);
      }

      // Add assistant response
      if (data.response) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          createdAt: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: 'Failed to process your request. Please try again.',
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  const monitorAgentRun = async (runId: string) => {
    // Poll for agent run updates
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/agent/run/${runId}`);
        const data = await res.json();
        
        setCurrentTask({
          id: data.id,
          title: data.title || 'Processing your request...',
          status: data.status,
          statusDetail: data.statusDetail,
          currentSubtask: data.currentSubtask,
          totalSubtasks: data.totalSubtasks,
        });

        // Stop polling when completed
        if (['completed', 'failed'].includes(data.status)) {
          clearInterval(interval);
          setCurrentTask(null);
        }
      } catch (error) {
        console.error('Failed to fetch run status:', error);
        clearInterval(interval);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Mindous Chat</h1>
          {currentTask && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Agent is working...
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={createNewSession}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Task Card */}
      {currentTask && (
        <div className="px-6 py-4 border-b bg-muted/30">
          <TaskCard
            title={currentTask.title}
            status={currentTask.status}
            statusDetail={currentTask.statusDetail}
          />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {/* Status Bar */}
      {currentTask && (
        <StatusBar
          currentTask={1}
          currentSubtask={currentTask.currentSubtask || 0}
          totalSubtasks={currentTask.totalSubtasks || 0}
        />
      )}

      {/* Message Input */}
      <div className="border-t px-6 py-4">
        <MessageInput 
          onSend={handleSendMessage} 
          disabled={isStreaming}
          placeholder="Ask me anything... I'll break it down and execute it for you."
        />
      </div>
    </div>
  );
}
