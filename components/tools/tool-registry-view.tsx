
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SelectTool } from '@/db/schema';
import { ToolCard } from './tool-card';
import { Search, Loader2 } from 'lucide-react';
import { listTools } from '@/actions/tools';

interface ToolRegistryViewProps {
  workspaceId: string;
  onToolSelect?: (toolKey: string) => void;
}

export function ToolRegistryView({ workspaceId, onToolSelect }: ToolRegistryViewProps) {
  const [tools, setTools] = useState<SelectTool[]>([]);
  const [filteredTools, setFilteredTools] = useState<SelectTool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTools();
  }, [workspaceId]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = tools.filter(tool => 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTools(filtered);
    } else {
      setFilteredTools(tools);
    }
  }, [searchQuery, tools]);

  const loadTools = async () => {
    try {
      setLoading(true);
      const result = await listTools(workspaceId);
      
      if (result.success && result.tools) {
        setTools(result.tools);
        setFilteredTools(result.tools);
      } else {
        setError(result.error || 'Failed to load tools');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-destructive">
            <p>Error loading tools: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tool Registry</CardTitle>
          <CardDescription>
            Browse and manage available tools for your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <ToolCard 
            key={tool.id} 
            tool={tool} 
            onSelect={onToolSelect}
          />
        ))}
      </div>

      {filteredTools.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>No tools found</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
