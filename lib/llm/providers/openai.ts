import OpenAI from 'openai';
import { UnifiedLLMResponse } from '../types';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function callOpenAI(
  model: string,
  prompt: string,
  opts?: { system?: string; maxTokens?: number; temperature?: number }
): Promise<UnifiedLLMResponse> {
  const start = Date.now();
  const res = await client.chat.completions.create({
    model,
    messages: [
      ...(opts?.system ? [{ role: 'system' as const, content: opts.system }] : []),
      { role: 'user' as const, content: prompt },
    ],
    temperature: opts?.temperature ?? 0.2,
    max_tokens: opts?.maxTokens,
  });
  const content = res.choices?.[0]?.message?.content ?? '';
  const latency = Date.now() - start;
  return {
    provider: 'openai',
    model,
    content,
    tokensInput: res.usage?.prompt_tokens ?? undefined,
    tokensOutput: res.usage?.completion_tokens ?? undefined,
    raw: { latencyMs: latency, ...res },
  };
}
