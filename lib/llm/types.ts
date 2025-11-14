export type Provider = 'openai' | 'anthropic' | 'google';

export type RouteContext = {
  taskType?: 'code' | 'writing' | 'analysis' | 'extraction' | 'reasoning';
  complexity?: 'low' | 'medium' | 'high';
  maxTokens?: number;
  temperature?: number;
  allowCache?: boolean;
  scope?: 'system' | 'tenant' | 'user';
  ownerId?: string | null;
};

export type RouteAndExecuteInput = {
  subtaskId?: string;
  userId?: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  context?: RouteContext;
  idempotencyKey?: string;
};

export type UnifiedLLMResponse = {
  provider: Provider;
  model: string;
  content: string;
  tokensInput?: number;
  tokensOutput?: number;
  raw?: unknown;
};
