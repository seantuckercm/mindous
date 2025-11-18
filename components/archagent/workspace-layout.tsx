'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Terminal,
  FileCode,
  Database,
  Monitor,
  FolderTree,
  MessageSquare,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { TerminalViewer } from './terminal-viewer';
import { FileBrowser } from './file-browser';
import { cn } from '@/lib/utils';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';

interface WorkspaceLayoutProps {
  runId: string;
  buildId?: string;
  chatPanel?: React.ReactNode;
  className?: string;
}

export function ArchAgentWorkspace({ runId, buildId, chatPanel, className }: WorkspaceLayoutProps) {
  const [activeTab, setActiveTab] = useState('terminal');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isToolsPanelExpanded, setIsToolsPanelExpanded] = useState(false);

  return (
    <div className={cn('h-screen flex flex-col', className)}>
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <span>ArchAgent</span>
            </div>
            <Badge variant="outline" className="ml-2">
              Phase 1
            </Badge>
          </div>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Sidebar - Chat */}
          {showSidebar && chatPanel && (
            <>
              <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                <div className="h-full overflow-hidden border-r">
                  {chatPanel}
                </div>
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* Center Panel - Tools */}
          <ResizablePanel defaultSize={showSidebar ? 45 : 60} minSize={30}>
            <div className="h-full flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="border-b px-4">
                  <TabsList className="h-12">
                    <TabsTrigger value="terminal" className="gap-2">
                      <Terminal className="h-4 w-4" />
                      Terminal
                    </TabsTrigger>
                    <TabsTrigger value="code-diff" className="gap-2">
                      <FileCode className="h-4 w-4" />
                      Code Diff
                      <Badge variant="secondary" className="ml-1 text-xs">
                        Coming Soon
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="database" className="gap-2">
                      <Database className="h-4 w-4" />
                      Database
                      <Badge variant="secondary" className="ml-1 text-xs">
                        Coming Soon
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="desktop" className="gap-2">
                      <Monitor className="h-4 w-4" />
                      Desktop Stream
                      <Badge variant="secondary" className="ml-1 text-xs">
                        Coming Soon
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-auto">
                  <TabsContent value="terminal" className="h-full m-0 p-4">
                    <TerminalViewer runId={runId} buildId={buildId} />
                  </TabsContent>

                  <TabsContent value="code-diff" className="h-full m-0 p-4">
                    <Card className="h-full flex items-center justify-center">
                      <div className="text-center p-8">
                        <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Code Diff Viewer</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Real-time code change visualization coming in Phase 2
                        </p>
                        <Badge variant="outline">Phase 2 Feature</Badge>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="database" className="h-full m-0 p-4">
                    <Card className="h-full flex items-center justify-center">
                      <div className="text-center p-8">
                        <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Database Inspector</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Live database inspection and query editor coming in Phase 2
                        </p>
                        <Badge variant="outline">Phase 2 Feature</Badge>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="desktop" className="h-full m-0 p-4">
                    <Card className="h-full flex items-center justify-center">
                      <div className="text-center p-8">
                        <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Desktop Stream</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Live browser automation streaming with manual control coming in Phase 2
                        </p>
                        <Badge variant="outline">Phase 2 Feature</Badge>
                      </div>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </ResizablePanel>

          {/* Right Sidebar - File Browser */}
          <ResizableHandle />
          <ResizablePanel defaultSize={showSidebar ? 25 : 40} minSize={20} maxSize={50}>
            <div className="h-full overflow-hidden border-l">
              <div className="h-full p-4">
                <FileBrowser runId={runId} buildId={buildId} />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/40">
        <div className="flex h-10 items-center px-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Run ID: {runId.slice(0, 8)}...</span>
            {buildId && <span>Build ID: {buildId.slice(0, 8)}...</span>}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span>ArchAgent v1.0</span>
            <span>Phase 1 Implementation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simplified wrapper for quick integration
export function ArchAgentWorkspaceSimple({ runId, buildId }: { runId: string; buildId?: string }) {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">ArchAgent Workspace</h1>
            <p className="text-sm text-muted-foreground">AI-Powered Development Environment</p>
          </div>
        </div>
        <Badge variant="outline">Phase 1</Badge>
      </div>

      <Tabs defaultValue="terminal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="terminal" className="gap-2">
            <Terminal className="h-4 w-4" />
            Terminal
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2">
            <FolderTree className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="code-diff" className="gap-2">
            <FileCode className="h-4 w-4" />
            Code Diff
            <Badge variant="secondary" className="ml-1 text-xs">Soon</Badge>
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2">
            <Database className="h-4 w-4" />
            Database
            <Badge variant="secondary" className="ml-1 text-xs">Soon</Badge>
          </TabsTrigger>
          <TabsTrigger value="desktop" className="gap-2">
            <Monitor className="h-4 w-4" />
            Desktop
            <Badge variant="secondary" className="ml-1 text-xs">Soon</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terminal">
          <TerminalViewer runId={runId} buildId={buildId} title="Build Terminal" />
        </TabsContent>

        <TabsContent value="files">
          <FileBrowser runId={runId} buildId={buildId} />
        </TabsContent>

        <TabsContent value="code-diff">
          <Card className="p-12">
            <div className="text-center">
              <FileCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Code Diff Viewer</h3>
              <p className="text-muted-foreground mb-4">
                Real-time code change visualization - Coming in Phase 2
              </p>
              <Badge variant="outline">Phase 2 Feature</Badge>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card className="p-12">
            <div className="text-center">
              <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Database Inspector</h3>
              <p className="text-muted-foreground mb-4">
                Live database inspection - Coming in Phase 2
              </p>
              <Badge variant="outline">Phase 2 Feature</Badge>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="desktop">
          <Card className="p-12">
            <div className="text-center">
              <Monitor className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Desktop Stream</h3>
              <p className="text-muted-foreground mb-4">
                Live browser automation streaming - Coming in Phase 2
              </p>
              <Badge variant="outline">Phase 2 Feature</Badge>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
