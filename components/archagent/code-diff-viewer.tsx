'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code2, 
  FileCode, 
  FolderTree, 
  GitCommit, 
  GitCompare, 
  ChevronRight, 
  ChevronDown,
  FileIcon,
  Trash2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamically import react-diff-viewer to avoid SSR issues
const ReactDiffViewer = dynamic(() => import('react-diff-viewer-continued'), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-muted-foreground">Loading diff viewer...</div>
});

interface FileDiff {
  path: string;
  oldContent: string;
  newContent: string;
  status: 'modified' | 'added' | 'deleted';
  timestamp: string;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  status?: 'modified' | 'added' | 'deleted';
}

interface CodeDiffViewerProps {
  sessionId: string;
  className?: string;
}

export function CodeDiffViewer({ sessionId, className }: CodeDiffViewerProps) {
  const [diffs, setDiffs] = useState<FileDiff[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileDiff | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Build file tree from diffs
  const fileTree = useMemo(() => {
    const root: FileNode = { name: 'root', path: '', type: 'directory', children: [] };

    diffs.forEach(diff => {
      const parts = diff.path.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const path = parts.slice(0, index + 1).join('/');

        if (!current.children) {
          current.children = [];
        }

        let node = current.children.find(child => child.name === part);

        if (!node) {
          node = {
            name: part,
            path,
            type: isFile ? 'file' : 'directory',
            status: isFile ? diff.status : undefined,
          };
          current.children.push(node);
        }

        current = node;
      });
    });

    return root.children || [];
  }, [diffs]);

  // Fetch diffs from API
  const fetchDiffs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/archagent/diffs?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setDiffs(data.diffs || []);
        
        // Auto-select first file if none selected
        if (!selectedFile && data.diffs?.length > 0) {
          setSelectedFile(data.diffs[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch diffs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh diffs
  useEffect(() => {
    fetchDiffs();

    if (autoRefresh) {
      const interval = setInterval(fetchDiffs, 3000);
      return () => clearInterval(interval);
    }
  }, [sessionId, autoRefresh]);

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Render file tree node
  const renderTreeNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile?.path === node.path;

    if (node.type === 'directory') {
      return (
        <div key={node.path}>
          <div
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm',
              'transition-colors'
            )}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <FolderTree className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    const diff = diffs.find(d => d.path === node.path);
    const statusIcon = {
      modified: <FileCode className="h-4 w-4 text-yellow-500" />,
      added: <Plus className="h-4 w-4 text-green-500" />,
      deleted: <Trash2 className="h-4 w-4 text-red-500" />,
    };

    return (
      <div
        key={node.path}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm transition-colors',
          isSelected ? 'bg-accent' : 'hover:bg-accent/50'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => diff && setSelectedFile(diff)}
      >
        {statusIcon[node.status || 'modified']}
        <span className="text-sm truncate flex-1">{node.name}</span>
        <Badge variant="outline" className="text-xs">
          {node.status}
        </Badge>
      </div>
    );
  };

  // Get stats
  const stats = useMemo(() => {
    const modified = diffs.filter(d => d.status === 'modified').length;
    const added = diffs.filter(d => d.status === 'added').length;
    const deleted = diffs.filter(d => d.status === 'deleted').length;
    return { modified, added, deleted, total: diffs.length };
  }, [diffs]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Code Changes</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <FileCode className="h-3 w-3" />
                  {stats.total} files
                </Badge>
                {stats.modified > 0 && (
                  <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600">
                    {stats.modified} modified
                  </Badge>
                )}
                {stats.added > 0 && (
                  <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                    {stats.added} added
                  </Badge>
                )}
                {stats.deleted > 0 && (
                  <Badge variant="outline" className="gap-1 text-red-600 border-red-600">
                    {stats.deleted} deleted
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="gap-2"
              >
                <RefreshCw className={cn('h-4 w-4', autoRefresh && 'animate-spin')} />
                {autoRefresh ? 'Auto Refresh' : 'Manual'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchDiffs}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="flex h-full">
            {/* File Tree Sidebar */}
            <div className="w-64 border-r flex flex-col">
              <div className="p-3 border-b bg-muted/50">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Changed Files</span>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {fileTree.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No changes yet
                    </div>
                  ) : (
                    fileTree.map(node => renderTreeNode(node))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Diff Viewer */}
            <div className="flex-1 flex flex-col">
              {selectedFile ? (
                <>
                  <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{selectedFile.path}</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedFile.status}
                      </Badge>
                    </div>

                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                      <TabsList>
                        <TabsTrigger value="split" className="text-xs">
                          Split View
                        </TabsTrigger>
                        <TabsTrigger value="unified" className="text-xs">
                          Unified View
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <ScrollArea className="flex-1">
                    <ReactDiffViewer
                      oldValue={selectedFile.oldContent}
                      newValue={selectedFile.newContent}
                      splitView={viewMode === 'split'}
                      useDarkTheme={true}
                      showDiffOnly={false}
                      extraLinesSurroundingDiff={3}
                      styles={{
                        variables: {
                          dark: {
                            diffViewerBackground: '#0a0a0a',
                            diffViewerColor: '#e5e5e5',
                            addedBackground: '#044417',
                            addedColor: '#e5e5e5',
                            removedBackground: '#5c1111',
                            removedColor: '#e5e5e5',
                            wordAddedBackground: '#166534',
                            wordRemovedBackground: '#991b1b',
                            addedGutterBackground: '#0a3818',
                            removedGutterBackground: '#3f0e0e',
                            gutterBackground: '#171717',
                            gutterColor: '#737373',
                            highlightBackground: '#262626',
                            highlightGutterBackground: '#1c1c1c',
                          }
                        }
                      }}
                    />
                  </ScrollArea>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                  <GitCommit className="h-16 w-16 opacity-50" />
                  <div className="text-center">
                    <p className="text-lg font-medium">No File Selected</p>
                    <p className="text-sm mt-2">
                      {diffs.length === 0 
                        ? 'No code changes detected yet'
                        : 'Select a file from the tree to view changes'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
