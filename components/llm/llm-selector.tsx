
'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ProviderBadge, LLMProvider } from './provider-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, DollarSign, Clock, TrendingUp } from 'lucide-react';

interface LLMOption {
  provider: LLMProvider;
  model: string;
  displayName: string;
  description: string;
  strengths: string[];
  costLevel: 'low' | 'medium' | 'high';
  speedLevel: 'fast' | 'medium' | 'slow';
}

const llmOptions: LLMOption[] = [
  {
    provider: 'auto',
    model: 'intelligent',
    displayName: 'Auto-Route (Recommended)',
    description: 'Automatically selects the best LLM for each subtask',
    strengths: ['Cost Optimization', 'Performance Routing', 'Fallback Handling'],
    costLevel: 'medium',
    speedLevel: 'fast'
  },
  {
    provider: 'abacus',
    model: 'gpt-4',
    displayName: 'Abacus AI GPT-4',
    description: 'Advanced reasoning and complex problem solving',
    strengths: ['Complex Analysis', 'Code Generation', 'Reasoning'],
    costLevel: 'high',
    speedLevel: 'medium'
  },
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    displayName: 'ChatGPT 4o Mini',
    description: 'Fast and efficient for most tasks',
    strengths: ['Speed', 'Cost Effective', 'General Purpose'],
    costLevel: 'low',
    speedLevel: 'fast'
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet',
    displayName: 'Claude 3.5 Sonnet',
    description: 'Excellent for writing and analysis',
    strengths: ['Writing', 'Analysis', 'Safety'],
    costLevel: 'medium',
    speedLevel: 'medium'
  },
  {
    provider: 'google',
    model: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    description: 'Great for large context and multimodal tasks',
    strengths: ['Large Context', 'Multimodal', 'Research'],
    costLevel: 'medium',
    speedLevel: 'medium'
  },
  {
    provider: 'qwen',
    model: 'qwen-max',
    displayName: 'Qwen Max',
    description: 'Powerful model for diverse applications',
    strengths: ['Versatility', 'Performance', 'Innovation'],
    costLevel: 'medium',
    speedLevel: 'fast'
  }
];

interface LLMSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  showDetails?: boolean;
  label?: string;
}

export function LLMSelector({ 
  value = 'auto:intelligent',
  onValueChange,
  className,
  showDetails = false,
  label = 'Select LLM Provider'
}: LLMSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<LLMOption | null>(
    llmOptions.find(option => `${option.provider}:${option.model}` === value) || llmOptions[0]
  );

  const handleValueChange = (newValue: string) => {
    const option = llmOptions.find(opt => `${opt.provider}:${opt.model}` === newValue);
    setSelectedOption(option || null);
    onValueChange?.(newValue);
  };

  return (
    <div className={className}>
      <div className="space-y-2">
        <Label>{label}</Label>
        <Select value={value} onValueChange={handleValueChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {selectedOption && (
                <div className="flex items-center gap-2">
                  <ProviderBadge 
                    provider={selectedOption.provider} 
                    size="sm" 
                    variant="outline"
                  />
                  <span>{selectedOption.displayName}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {llmOptions.map((option) => (
              <SelectItem 
                key={`${option.provider}:${option.model}`} 
                value={`${option.provider}:${option.model}`}
                className="py-3"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <ProviderBadge 
                      provider={option.provider} 
                      size="sm" 
                      variant="outline"
                    />
                    <div>
                      <div className="font-medium">{option.displayName}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {option.costLevel}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {option.speedLevel}
                    </Badge>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showDetails && selectedOption && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ProviderBadge provider={selectedOption.provider} />
              <div>
                <CardTitle className="text-base">{selectedOption.displayName}</CardTitle>
                <CardDescription>{selectedOption.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Strengths
                </h4>
                <div className="flex flex-wrap gap-1">
                  {selectedOption.strengths.map((strength) => (
                    <Badge key={strength} variant="secondary" className="text-xs">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Cost: {selectedOption.costLevel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Speed: {selectedOption.speedLevel}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { llmOptions };
