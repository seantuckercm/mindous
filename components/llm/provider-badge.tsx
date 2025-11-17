
'use client';

import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Sparkles, Bot, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LLMProvider = 'abacus' | 'openai' | 'anthropic' | 'google' | 'qwen' | 'auto';

interface ProviderBadgeProps {
  provider: LLMProvider;
  model?: string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const providerConfig = {
  abacus: {
    name: 'Abacus AI',
    color: 'bg-blue-500 hover:bg-blue-600',
    textColor: 'text-white',
    icon: Brain,
    description: 'Advanced AI Platform'
  },
  openai: {
    name: 'ChatGPT',
    color: 'bg-green-500 hover:bg-green-600',
    textColor: 'text-white',
    icon: Zap,
    description: 'OpenAI GPT Models'
  },
  anthropic: {
    name: 'Claude',
    color: 'bg-purple-500 hover:bg-purple-600',
    textColor: 'text-white',
    icon: Sparkles,
    description: 'Anthropic Claude'
  },
  google: {
    name: 'Gemini',
    color: 'bg-orange-500 hover:bg-orange-600',
    textColor: 'text-white',
    icon: Star,
    description: 'Google Gemini'
  },
  qwen: {
    name: 'Qwen',
    color: 'bg-red-500 hover:bg-red-600',
    textColor: 'text-white',
    icon: Bot,
    description: 'Qwen Models'
  },
  auto: {
    name: 'Auto-Route',
    color: 'bg-gradient-to-r from-blue-500 via-purple-500 to-green-500',
    textColor: 'text-white',
    icon: Brain,
    description: 'Intelligent Routing'
  }
};

export function ProviderBadge({ 
  provider, 
  model, 
  variant = 'default', 
  size = 'default',
  showIcon = true,
  className 
}: ProviderBadgeProps) {
  const config = providerConfig[provider];
  const Icon = config.icon;

  if (variant === 'default') {
    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium transition-colors',
        config.color,
        config.textColor,
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'lg' && 'px-3 py-2 text-base',
        className
      )}>
        {showIcon && <Icon className="h-3.5 w-3.5" />}
        <span>{config.name}</span>
        {model && <span className="opacity-75">:{model}</span>}
      </div>
    );
  }

  return (
    <Badge variant={variant} className={cn('gap-1.5', className)}>
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.name}
      {model && <span className="opacity-75">:{model}</span>}
    </Badge>
  );
}

export function ProviderIcon({ provider, className }: { provider: LLMProvider; className?: string }) {
  const config = providerConfig[provider];
  const Icon = config.icon;
  
  return (
    <div className={cn(
      'inline-flex items-center justify-center rounded-md',
      config.color,
      className
    )}>
      <Icon className="h-4 w-4 text-white" />
    </div>
  );
}

export { providerConfig };
