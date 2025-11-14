import { Provider } from './types';

export function preferredModelsForTask(taskType?: string): { provider: Provider; model: string; weight: number }[] {
  switch (taskType) {
    case 'code':
      return [
        { provider: 'openai', model: process.env.OPENAI_CODE_MODEL ?? 'gpt-4o-mini', weight: 1.0 },
        { provider: 'anthropic', model: process.env.ANTHROPIC_ALT_MODEL ?? 'claude-3-5-sonnet-20241022', weight: 0.7 },
        { provider: 'google', model: process.env.GOOGLE_ALT_MODEL ?? 'gemini-1.5-pro', weight: 0.6 },
      ];
    case 'writing':
      return [
        { provider: 'anthropic', model: process.env.ANTHROPIC_WRITE_MODEL ?? 'claude-3-5-sonnet-20241022', weight: 1.0 },
        { provider: 'openai', model: process.env.OPENAI_ALT_MODEL ?? 'gpt-4o-mini', weight: 0.8 },
        { provider: 'google', model: process.env.GOOGLE_ALT_MODEL ?? 'gemini-1.5-pro', weight: 0.7 },
      ];
    case 'analysis':
    case 'extraction':
      return [
        { provider: 'google', model: process.env.GOOGLE_ANALYSIS_MODEL ?? 'gemini-1.5-pro', weight: 1.0 },
        { provider: 'openai', model: process.env.OPENAI_ALT_MODEL ?? 'gpt-4o-mini', weight: 0.8 },
        { provider: 'anthropic', model: process.env.ANTHROPIC_ALT_MODEL ?? 'claude-3-5-sonnet-20241022', weight: 0.7 },
      ];
    default:
      return [
        { provider: 'openai', model: process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o-mini', weight: 1.0 },
        { provider: 'anthropic', model: process.env.ANTHROPIC_DEFAULT_MODEL ?? 'claude-3-5-sonnet-20241022', weight: 0.9 },
        { provider: 'google', model: process.env.GOOGLE_DEFAULT_MODEL ?? 'gemini-1.5-pro', weight: 0.8 },
      ];
  }
}
