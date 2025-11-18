import { routeAndExecute } from '@/lib/llm/router';
import { db } from '@/db';
import { clarificationsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Clarification Service
 * Generates clarification questions using LLM to resolve ambiguities before execution
 */

export interface ClarificationQuestion {
  id: string;
  question: string;
  options?: string[];
  default?: string;
  category: 'technical' | 'design' | 'features' | 'data';
  required: boolean;
  explanation?: string;
}

export interface ClarificationContext {
  prompt: string;
  plan?: any;
  userId: string;
  executionId: string;
}

/**
 * Analyze prompt and generate clarification questions
 */
export async function generateClarifications(
  context: ClarificationContext
): Promise<ClarificationQuestion[]> {
  const systemPrompt = `You are an expert requirements analyst. Your role is to identify ambiguities in user requests that could lead to wrong implementations.

Analyze the user's request and generate 3-5 clarifying questions that would help ensure correct implementation.

Focus on:
1. Technical choices (authentication method, database type, API choices)
2. Design preferences (color scheme, layout, responsive design)
3. Feature scope (which features to include/exclude)
4. Data handling (persistence, validation, privacy)

For each question:
- Make it clear and actionable
- Provide 2-4 specific options when possible
- Suggest a reasonable default
- Explain briefly why it matters

Output format (JSON only, no markdown):
{
  "questions": [
    {
      "id": "unique-id",
      "question": "Clear question text?",
      "options": ["Option 1", "Option 2", "Option 3"],
      "default": "Option 1",
      "category": "technical|design|features|data",
      "required": true|false,
      "explanation": "Why this matters"
    }
  ]
}`;

  const userPrompt = `User Request: ${context.prompt}

${context.plan ? `Planned Approach:\n${JSON.stringify(context.plan, null, 2)}` : ''}

Generate clarification questions that would prevent implementation errors.`;

  try {
    const response = await routeAndExecute({
      prompt: userPrompt,
      system: systemPrompt,
      userId: context.userId,
      context: {
        taskType: 'analysis',
        allowCache: true,
        scope: 'system'
      },
      options: {
        temperature: 0.3,
        maxTokens: 2000
      }
    });

    // Parse LLM response
    const parsed = JSON.parse(response.output);
    const questions: ClarificationQuestion[] = parsed.questions || [];

    // Store questions in database
    for (const q of questions) {
      await db.insert(clarificationsTable).values({
        userId: context.userId,
        executionId: context.executionId,
        question: q.question,
        options: q.options || null,
        category: q.category,
        required: q.required,
        explanation: q.explanation || null,
        defaultValue: q.default || null
      });
    }

    return questions;
  } catch (error) {
    console.error('Error generating clarifications:', error);
    // Return minimal default questions on error
    return [
      {
        id: 'auth',
        question: 'Should this application include user authentication?',
        options: ['Yes, with login/signup', 'No, no authentication needed'],
        default: 'No, no authentication needed',
        category: 'features',
        required: false,
        explanation: 'Determines if user accounts and sessions are needed'
      }
    ];
  }
}

/**
 * Auto-decide answers for clarification questions using LLM
 */
export async function autoDecideClarifications(
  questions: ClarificationQuestion[],
  context: ClarificationContext
): Promise<Record<string, string>> {
  // Use defaults if available
  const answers: Record<string, string> = {};
  
  for (const q of questions) {
    if (q.default) {
      answers[q.id] = q.default;
      
      // Update database with auto-decided answer
      const dbRecords = await db
        .select()
        .from(clarificationsTable)
        .where(eq(clarificationsTable.question, q.question))
        .limit(1);
      
      if (dbRecords.length > 0) {
        await db
          .update(clarificationsTable)
          .set({
            answer: q.default,
            isAutoDecided: true,
            answeredAt: new Date()
          })
          .where(eq(clarificationsTable.id, dbRecords[0].id));
      }
    } else if (q.options && q.options.length > 0) {
      // Choose first option as default
      answers[q.id] = q.options[0];
      
      const dbRecords = await db
        .select()
        .from(clarificationsTable)
        .where(eq(clarificationsTable.question, q.question))
        .limit(1);
      
      if (dbRecords.length > 0) {
        await db
          .update(clarificationsTable)
          .set({
            answer: q.options[0],
            isAutoDecided: true,
            answeredAt: new Date()
          })
          .where(eq(clarificationsTable.id, dbRecords[0].id));
      }
    }
  }

  return answers;
}

/**
 * Store user answers to clarification questions
 */
export async function saveClarificationAnswers(
  executionId: string,
  answers: Record<string, string>
): Promise<void> {
  const clarifications = await db
    .select()
    .from(clarificationsTable)
    .where(eq(clarificationsTable.executionId, executionId));

  for (const clarification of clarifications) {
    const answer = answers[clarification.id];
    if (answer) {
      await db
        .update(clarificationsTable)
        .set({
          answer,
          isAutoDecided: false,
          answeredAt: new Date()
        })
        .where(eq(clarificationsTable.id, clarification.id));
    }
  }
}

/**
 * Get clarification summary for display
 */
export async function getClarificationSummary(
  executionId: string
): Promise<string> {
  const clarifications = await db
    .select()
    .from(clarificationsTable)
    .where(eq(clarificationsTable.executionId, executionId));

  if (clarifications.length === 0) {
    return 'No clarifications needed';
  }

  const summary = clarifications
    .map(c => `${c.question}: ${c.answer || '(not answered)'}`)
    .join('\n');

  return summary;
}

/**
 * Apply clarification answers to execution context
 */
export function applyClarificationsToContext(
  answers: Record<string, string>,
  originalPrompt: string
): string {
  // Enhance the prompt with clarification answers
  const clarificationText = Object.entries(answers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  return `${originalPrompt}

Additional Requirements (from clarifications):
${clarificationText}`;
}
