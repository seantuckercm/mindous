'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { User, Bot } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Welcome to Mindous</h2>
        <p className="text-muted-foreground max-w-md">
          I'm your AI agent orchestrator. Describe any complex task and I'll break it down into subtasks and execute them for you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}

function MessageItem({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-muted px-4 py-2 rounded-lg text-sm text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex gap-4',
      isUser && 'flex-row-reverse'
    )}>
      <Avatar className="w-8 h-8">
        <AvatarFallback className={cn(
          isUser ? 'bg-blue-500' : 'bg-purple-500',
          'text-white'
        )}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        'flex flex-col max-w-[70%]',
        isUser && 'items-end'
      )}>
        <div className={cn(
          'rounded-lg px-4 py-3',
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-muted border'
        )}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {message.createdAt.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
