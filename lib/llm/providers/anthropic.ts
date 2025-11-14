import Anthropic from '@anthropic-ai/sdk';
import { UnifiedLLMResponse } from '../types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function callAnthropic(
  model: string,
  prompt: string,
  opts?: { system?: string; maxTokens?: number; temperature?: number }
): Promise<UnifiedLLMResponse> {
  const start = Date.now();
  const res = await client.messages.create({
    model,
    max_tokens: opts?.maxTokens ?? 1024,
    temperature: opts?.temperature ?? 0.2,
    system: opts?.system,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const text = res.content?.[0]?.type === 'text' 
    ? res.content[0].text 
    : (res.content as any[]).map((c: any) => c.text ?? '').join('\n');
  
  const latency = Date.now() - start;
  return {
    provider: 'anthropic',
    model,
    content: text ?? '',
    tokensInput: res.usage?.input_tokens ?? undefined,
    tokensOutput: res.usage?.output_tokens ?? undefined,
    raw: { latencyMs: latency, ...res },
  };
}
