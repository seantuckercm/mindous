'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { Button } from '../ui/button';
import { Plus, Settings, Brain } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

interface ChatInterfaceProps {
  userId: string;
}

export function ChatInterface({ userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>('');
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
  }, [messages, currentStreamingMessage]);

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
    setCurrentStreamingMessage('');

    try {
      // Send message and handle streaming
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          content,
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      // Create placeholder message for streaming
      const streamingMessageId = crypto.randomUUID();
      setMessages(prev => [...prev, {
        id: streamingMessageId,
        role: 'assistant',
        content: '',
        createdAt: new Date(),
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk' && data.content) {
                fullContent += data.content;
                // Update the streaming message in real-time
                setMessages(prev => prev.map(msg => 
                  msg.id === streamingMessageId 
                    ? { ...msg, content: fullContent }
                    : msg
                ));
              } else if (data.type === 'done') {
                // Final update
                setMessages(prev => prev.map(msg => 
                  msg.id === streamingMessageId 
                    ? { ...msg, content: data.content }
                    : msg
                ));
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
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
      setCurrentStreamingMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Mindous AI</h1>
          </div>
          {isStreaming && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              AI is thinking...
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

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
