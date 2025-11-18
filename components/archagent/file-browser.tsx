'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FolderTree,
  File,
  Folder,
  FolderOpen,
  Download,
  Search,
  Loader2,
  FileText,
  FileCode,
  FileImage,
  Check,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  children?: FileNode[];
}

interface FileBrowserProps {
  runId: string;
  buildId?: string;
  className?: string;
}

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  selected: Set<string>;
  expanded: Set<string>;
  onToggleSelect: (path: string) => void;
  onToggleExpand: (path: string) => void;
  onPreview: (path: string) => void;
  searchQuery: string;
}

function FileTreeNode({
  node,
  level,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  onPreview,
  searchQuery
}: FileTreeNodeProps) {
  const isExpanded = expanded.has(node.path);
  const isSelected = selected.has(node.path);
  
  // Filter logic for search
  const matchesSearch = searchQuery
    ? node.name.toLowerCase().includes(searchQuery.toLowerCase())
    : true;
  
  if (!matchesSearch && node.type === 'file') {
    return null;
  }

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    
    if (['ts', 'tsx', 'js', 'jsx', 'json', 'html', 'css'].includes(ext || '')) {
      return <FileCode className="h-4 w-4 text-blue-500" />;
    } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) {
      return <FileImage className="h-4 w-4 text-purple-500" />;
    } else if (['md', 'txt', 'log'].includes(ext || '')) {
      return <FileText className="h-4 w-4 text-gray-500" />;
    }
    
    return <File className="h-4 w-4 text-gray-400" />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1 px-2 rounded hover:bg-accent cursor-pointer group',
          isSelected && 'bg-accent/50'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {node.type === 'directory' ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => onToggleExpand(node.path)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <div className="w-5" />
            {getFileIcon(node.name)}
          </>
        )}
        
        <span
          className="flex-1 text-sm truncate"
          onClick={() => node.type === 'file' && onPreview(node.path)}
        >
          {node.name}
        </span>
        
        {node.size !== undefined && (
          <span className="text-xs text-muted-foreground">
            {formatSize(node.size)}
          </span>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(node.path);
          }}
        >
          {isSelected ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <div className="h-3 w-3 border border-gray-300 rounded" />
          )}
        </Button>
      </div>
      
      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selected={selected}
              expanded={expanded}
              onToggleSelect={onToggleSelect}
              onToggleExpand={onToggleExpand}
              onPreview={onPreview}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileBrowser({ runId, buildId, className }: FileBrowserProps) {
  const [tree, setTree] = useState<FileNode | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/']));
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewPath, setPreviewPath] = useState<string | null>(null);

  useEffect(() => {
    loadFileTree();
  }, [runId, buildId]);

  const loadFileTree = async () => {
    setIsLoading(true);
    try {
      const endpoint = buildId
        ? `/api/archagent/files/tree?buildId=${buildId}`
        : `/api/archagent/files/tree?runId=${runId}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to load file tree');
      
      const data = await response.json();
      setTree(data.tree);
      
      // Auto-expand first level
      if (data.tree && data.tree.children) {
        const firstLevelPaths = data.tree.children.map((child: FileNode) => child.path);
        setExpanded(new Set(['/', ...firstLevelPaths]));
      }
    } catch (error) {
      console.error('Error loading file tree:', error);
      toast.error('Failed to load file tree');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (path: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelected(newSelected);
  };

  const handleToggleExpand = (path: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpanded(newExpanded);
  };

  const handleSelectAll = () => {
    if (!tree) return;
    
    const allPaths = new Set<string>();
    const collectPaths = (node: FileNode) => {
      if (node.type === 'file') {
        allPaths.add(node.path);
      }
      if (node.children) {
        node.children.forEach(collectPaths);
      }
    };
    collectPaths(tree);
    setSelected(allPaths);
  };

  const handleDeselectAll = () => {
    setSelected(new Set());
  };

  const handleDownload = async (downloadAll: boolean = false) => {
    setIsDownloading(true);
    try {
      const paths = downloadAll ? [] : Array.from(selected);
      
      const endpoint = buildId
        ? `/api/archagent/files/download`
        : `/api/archagent/files/download`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId,
          buildId,
          paths: paths.length > 0 ? paths : undefined
        })
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${runId || buildId}-files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Files downloaded successfully');
    } catch (error) {
      console.error('Error downloading files:', error);
      toast.error('Failed to download files');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = (path: string) => {
    setPreviewPath(path);
    // TODO: Implement file preview modal
    toast.info('File preview coming soon');
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Loading file tree...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            <CardTitle className="text-base">Project Files</CardTitle>
            {tree && (
              <Badge variant="outline" className="ml-2">
                {selected.size} selected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {selected.size > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDeselectAll}
              >
                Deselect All
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSelectAll}
            >
              Select All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload(false)}
              disabled={isDownloading || (selected.size === 0 && tree !== null)}
            >
              {isDownloading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              ) : (
                <Download className="h-3 w-3 mr-2" />
              )}
              {selected.size > 0 ? `Download (${selected.size})` : 'Download All'}
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {tree ? (
            <div className="p-2">
              {tree.children && tree.children.map((child) => (
                <FileTreeNode
                  key={child.path}
                  node={child}
                  level={0}
                  selected={selected}
                  expanded={expanded}
                  onToggleSelect={handleToggleSelect}
                  onToggleExpand={handleToggleExpand}
                  onPreview={handlePreview}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No files available
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
