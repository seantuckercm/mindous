
'use client';

import { format } from 'date-fns';
import { User, Bot, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AgentMessage } from '@/components/agent/agent-message';
import { AgentExecutionState } from '@/lib/hooks/useAgentStream';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  createdAt: Date;
  agentState?: AgentExecutionState;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-3">
          <Bot className="h-12 w-12 mx-auto opacity-50" />
          <div>
            <p className="text-lg font-medium">Ready to help!</p>
            <p className="text-sm">Ask me anything and I&apos;ll break it down into actionable steps.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        // Agent message with full state
        if (message.role === 'agent' && message.agentState) {
          return (
            <AgentMessage
              key={message.id}
              content={message.content}
              agentState={message.agentState}
            />
          );
        }

        // Regular messages
        return (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role !== 'user' && (
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  {message.role === 'assistant' ? (
                    <Bot className="h-4 w-4 text-blue-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
              </div>
            )}
            
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : ''}`}>
              <Card className={`${message.role === 'user' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : message.role === 'system'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-white'
              }`}>
                <CardContent className="p-4">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>
                  <div className={`text-xs mt-2 opacity-70 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                  }`}>
                    {format(message.createdAt, 'HH:mm')}
                  </div>
                </CardContent>
              </Card>
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 mt-1 order-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
