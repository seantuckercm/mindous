'use client';

import { useState } from 'react';
import { ArchAgentWorkspaceSimple } from '@/components/archagent';
import { ClarificationModal } from '@/components/archagent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

// Generate a valid UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function ArchAgentDemoPage() {
  const [showClarificationDemo, setShowClarificationDemo] = useState(false);
  const [runId, setRunId] = useState(generateUUID());
  const [buildId, setBuildId] = useState(generateUUID());

  const demoQuestions = [
    {
      id: 'auth',
      question: 'Should this application include user authentication?',
      options: ['Yes, with email/password', 'Yes, with social login', 'No authentication'],
      default: 'Yes, with email/password',
      category: 'technical' as const,
      required: true,
      explanation: 'This determines whether users need accounts to access the app'
    },
    {
      id: 'database',
      question: 'What type of database would you like to use?',
      options: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite'],
      default: 'PostgreSQL',
      category: 'technical' as const,
      required: true,
      explanation: 'The database choice affects data structure and querying'
    },
    {
      id: 'theme',
      question: 'What color theme would you prefer?',
      options: ['Blue', 'Purple', 'Green', 'Dark'],
      default: 'Blue',
      category: 'design' as const,
      required: false,
      explanation: 'This sets the primary color palette for the UI'
    },
    {
      id: 'responsive',
      question: 'Should the app be fully responsive for mobile devices?',
      options: ['Yes, mobile-first', 'Yes, desktop-first', 'Desktop only'],
      default: 'Yes, mobile-first',
      category: 'design' as const,
      required: true,
      explanation: 'Determines if mobile users can access the app'
    }
  ];

  const handleClarificationSubmit = (answers: Record<string, string>) => {
    console.log('User answers:', answers);
    toast.success('Clarifications submitted! Continuing execution...');
    setShowClarificationDemo(false);
  };

  const handleAutoDecide = () => {
    console.log('Auto-deciding answers...');
    toast.success('AI has chosen default answers. Continuing execution...');
    setShowClarificationDemo(false);
  };

  const handleClarificationCancel = () => {
    setShowClarificationDemo(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Page Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">ArchAgent Phase 2 Demo</h1>
              <p className="text-muted-foreground">
                Test all Phase 2 features: Desktop Streaming, Code Diffs, and Database Viewer
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowClarificationDemo(true)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Test Clarification System
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="workspace" className="space-y-6">
          <TabsList>
            <TabsTrigger value="workspace">Workspace Demo</TabsTrigger>
            <TabsTrigger value="features">Feature Showcase</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="workspace" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ArchAgent Workspace</CardTitle>
                <CardDescription>
                  Full workspace with Terminal, File Browser, and tool panels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ArchAgentWorkspaceSimple runId={runId} buildId={buildId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    Clarification System
                  </CardTitle>
                  <CardDescription>
                    AI-powered question generation before execution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    The clarification system analyzes user requests and asks targeted questions
                    to ensure correct implementation. Users can answer manually or let AI decide.
                  </p>
                  <Button onClick={() => setShowClarificationDemo(true)}>
                    Try Clarification Modal
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Terminal Streaming</CardTitle>
                  <CardDescription>
                    Live terminal output with ANSI color support
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Real-time terminal output streaming using xterm.js with command tracking,
                    exit codes, and log download functionality.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ ANSI color codes preserved</li>
                    <li>✓ Command duration tracking</li>
                    <li>✓ Copy and download logs</li>
                    <li>✓ Real-time streaming</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>File Browser</CardTitle>
                  <CardDescription>
                    Interactive file tree with download capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Browse, search, and download files from your builds. Supports individual
                    file downloads and ZIP archives.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ Tree view with expand/collapse</li>
                    <li>✓ File search and filtering</li>
                    <li>✓ Multi-select downloads</li>
                    <li>✓ ZIP archive generation</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Workspace Layout</CardTitle>
                  <CardDescription>
                    Three-panel design with resizable sections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Professional workspace with chat, tools, and file browser panels.
                    Includes tabs for future features like Code Diff, Database, and Desktop Stream.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ Resizable panels</li>
                    <li>✓ Tabbed tool interface</li>
                    <li>✓ Collapsible sidebar</li>
                    <li>✓ Phase 2 placeholders</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Demo Settings</CardTitle>
                <CardDescription>
                  Configure demo IDs and test different scenarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="runId">Run ID</Label>
                  <Input
                    id="runId"
                    value={runId}
                    onChange={(e) => setRunId(e.target.value)}
                    placeholder="Enter run ID"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for identifying the execution run
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buildId">Build ID</Label>
                  <Input
                    id="buildId"
                    value={buildId}
                    onChange={(e) => setBuildId(e.target.value)}
                    placeholder="Enter build ID"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for build-specific operations
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRunId(generateUUID());
                      setBuildId(generateUUID());
                      toast.success('IDs reset to new values');
                    }}
                  >
                    Reset IDs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Clarification Modal Demo */}
      <ClarificationModal
        open={showClarificationDemo}
        questions={demoQuestions}
        onSubmit={handleClarificationSubmit}
        onAutoDecide={handleAutoDecide}
        onCancel={handleClarificationCancel}
      />
    </div>
  );
}
