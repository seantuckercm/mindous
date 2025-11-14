import { GoogleGenerativeAI } from '@google/generative-ai';
import { UnifiedLLMResponse } from '../types';

const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function callGoogle(
  model: string,
  prompt: string,
  opts?: { system?: string; maxTokens?: number; temperature?: number }
): Promise<UnifiedLLMResponse> {
  const start = Date.now();
  const genModel = client.getGenerativeModel({ model });
  const res = await genModel.generateContent({
    contents: [{ 
      role: 'user', 
      parts: [{ text: [opts?.system, prompt].filter(Boolean).join('\n\n') }] 
    }],
    generationConfig: {
      maxOutputTokens: opts?.maxTokens,
      temperature: opts?.temperature ?? 0.2,
    },
  });
  const text = res.response.text();
  const latency = Date.now() - start;
  return {
    provider: 'google',
    model,
    content: text ?? '',
    raw: { latencyMs: latency, ...res },
  };
}
