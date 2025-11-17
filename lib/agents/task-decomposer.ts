import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface Subtask {
  title: string;
  description?: string;
  dependencies?: string[];
}

export interface TaskDecomposition {
  subtasks: Subtask[];
  overview: string;
}

export async function decomposeTask(userRequest: string): Promise<TaskDecomposition> {
  const systemPrompt = `You are an expert task planner. Given a complex request, break it down into 3-8 clear, actionable subtasks.

Rules:
- Each subtask should be specific and achievable
- Keep subtasks atomic (10-60 seconds each)
- Order subtasks logically
- Be concise but clear

Return JSON format:
{
  "overview": "Brief summary of approach",
  "subtasks": [
    { "title": "Subtask 1", "description": "Details..." },
    { "title": "Subtask 2", "description": "Details..." }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User request: ${userRequest}` },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    const parsed = JSON.parse(content);
    return {
      overview: parsed.overview || '',
      subtasks: parsed.subtasks || [],
    };
  } catch (error) {
    console.error('Task decomposition failed:', error);
    
    // Fallback: simple decomposition
    return {
      overview: 'I will help you with this request.',
      subtasks: [
        {
          title: 'Analyze request',
          description: 'Understanding the user requirement',
        },
        {
          title: 'Execute task',
          description: userRequest,
        },
        {
          title: 'Verify and respond',
          description: 'Ensure completion and provide results',
        },
      ],
    };
  }
}
