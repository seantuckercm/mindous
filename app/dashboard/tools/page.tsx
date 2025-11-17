
/**
 * Tools Management Page
 * Displays available tools in the workspace
 */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToolRegistryView } from '@/components/tools';
import { invokeTool, seedDefaultTools } from '@/actions/tools';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ToolsPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState('');
  const [inputJson, setInputJson] = useState('');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [seeding, setSeeding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  // Mock workspace ID - in production, get from context/params
  const workspaceId = '00000000-0000-0000-0000-000000000000';

  const handleSeedTools = async () => {
    try {
      setSeeding(true);
      const result = await seedDefaultTools(workspaceId);
      
      if (result.success) {
        toast({
          title: 'Tools Seeded',
          description: `Successfully seeded ${result.seededTools?.length || 0} tools`
        });
        // Trigger refresh of ToolRegistryView
        setRefreshKey(prev => prev + 1);
      } else {
        toast({
          title: 'Seeding Failed',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleToolSelect = (toolKey: string) => {
    setSelectedTool(toolKey);
    setResult(null);
    
    // Set default input based on tool
    switch (toolKey) {
      case 'web_search':
        setInputJson(JSON.stringify({ query: 'Next.js best practices', max_results: 5 }, null, 2));
        break;
      case 'calculator':
        setInputJson(JSON.stringify({ expression: '2 + 2 * 3' }, null, 2));
        break;
      case 'data_processor':
        setInputJson(JSON.stringify({ 
          data: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
          operation: 'describe'
        }, null, 2));
        break;
      case 'api_caller':
        setInputJson(JSON.stringify({ 
          url: 'https://api.example.com/data',
          method: 'GET'
        }, null, 2));
        break;
      default:
        setInputJson('{}');
    }
  };

  const handleExecuteTool = async () => {
    if (!selectedTool || !executionId) {
      toast({
        title: 'Missing Information',
        description: 'Please select a tool and provide an execution ID',
        variant: 'destructive'
      });
      return;
    }

    try {
      setExecuting(true);
      const input = JSON.parse(inputJson);
      
      const result = await invokeTool({
        workspaceId,
        executionId,
        toolKey: selectedTool,
        input
      });

      if (result.success) {
        setResult(result.toolRun);
        toast({
          title: 'Tool Invoked',
          description: 'Tool execution has been queued'
        });
      } else {
        toast({
          title: 'Execution Failed',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <main className="p-6 md:p-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tool Ecosystem</h1>
          <p className="text-muted-foreground">
            Browse available tools and test tool execution
          </p>
        </div>
        <Button
          onClick={handleSeedTools}
          disabled={seeding}
          variant="outline"
        >
          {seeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Seed Default Tools
        </Button>
      </div>

      {/* Tool Testing Section */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Tool Execution</CardTitle>
            <CardDescription>
              Select a tool and provide input to test execution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Selected Tool</Label>
                <Input 
                  value={selectedTool || ''} 
                  placeholder="Select a tool below"
                  disabled 
                />
              </div>
              <div className="space-y-2">
                <Label>Execution ID</Label>
                <Input 
                  value={executionId}
                  onChange={(e) => setExecutionId(e.target.value)}
                  placeholder="Enter execution ID"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Input JSON</Label>
              <Textarea 
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                placeholder='{"query": "test"}'
                className="font-mono text-sm"
                rows={8}
              />
            </div>

            <Button 
              onClick={handleExecuteTool}
              disabled={!selectedTool || executing}
              className="w-full"
            >
              {executing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Execute Tool
            </Button>

            {result && (
              <div className="space-y-2">
                <Label>Result</Label>
                <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-64">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tool Registry */}
      <ToolRegistryView 
        key={refreshKey}
        workspaceId={workspaceId}
        onToolSelect={handleToolSelect}
      />
    </main>
  );
}
