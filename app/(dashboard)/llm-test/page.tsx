'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { routeAndExecuteSubtaskAction } from '@/actions/llm-actions';
import { RouterStatusBadge } from '@/components/llm/router-status-badge';
import { Loader2 } from 'lucide-react';

export default function LLMTestPage() {
  const [prompt, setPrompt] = useState('Write a short poem about artificial intelligence.');
  const [taskType, setTaskType] = useState<'code' | 'writing' | 'analysis' | 'extraction' | 'reasoning'>('writing');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await routeAndExecuteSubtaskAction({
        prompt,
        context: {
          taskType,
          allowCache: true,
          scope: 'user',
        },
      });
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">LLM Routing Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the Multi-LLM routing and execution system. This feature automatically selects
            the best LLM provider based on task type, cost, latency, and success rate.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>Configure your test prompt and task type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-type">Task Type</Label>
              <Select value={taskType} onValueChange={(v: any) => setTaskType(v)}>
                <SelectTrigger id="task-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="writing">Writing</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="extraction">Extraction</SelectItem>
                  <SelectItem value="reasoning">Reasoning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="Enter your prompt here..."
              />
            </div>

            <Button onClick={handleTest} disabled={loading || !prompt}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Executing...' : 'Execute'}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
              <CardDescription>
                <RouterStatusBadge 
                  provider={result.provider} 
                  model={result.model} 
                  cacheHit={result.cacheHit} 
                />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Response</Label>
                <div className="mt-2 p-4 bg-muted rounded-md">
                  <p className="whitespace-pre-wrap">{result.content}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Tokens Input</Label>
                  <p className="mt-1">{result.tokensInput ?? 'N/A'}</p>
                </div>
                <div>
                  <Label>Tokens Output</Label>
                  <p className="mt-1">{result.tokensOutput ?? 'N/A'}</p>
                </div>
                <div>
                  <Label>Correlation ID</Label>
                  <p className="mt-1 font-mono text-xs">{result.correlationId}</p>
                </div>
                <div>
                  <Label>Cache Hit</Label>
                  <p className="mt-1">{result.cacheHit ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
