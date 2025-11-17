
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SelectTool } from '@/db/schema';
import { Clock, Cpu, HardDrive, CheckCircle, XCircle } from 'lucide-react';

interface ToolCardProps {
  tool: SelectTool;
  onSelect?: (toolKey: string) => void;
}

export function ToolCard({ tool, onSelect }: ToolCardProps) {
  const manifest = tool.manifest as any;
  const resources = manifest?.resources || {};

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {tool.name}
              {tool.active ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Inactive
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{tool.description}</CardDescription>
          </div>
          <Badge variant="outline">{tool.version}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Tool Key</div>
          <code className="text-xs bg-muted px-2 py-1 rounded">{tool.key}</code>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Resource Limits</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{resources.timeoutSec}s timeout</span>
            </div>
            {resources.memMb && (
              <div className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                <span>{resources.memMb}MB RAM</span>
              </div>
            )}
            {resources.cpuShares && (
              <div className="flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                <span>{resources.cpuShares} CPU shares</span>
              </div>
            )}
          </div>
        </div>

        {manifest?.permissions?.network && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Permissions</div>
            <div className="text-xs">
              <Badge variant={manifest.permissions.network.enabled ? 'default' : 'secondary'}>
                Network: {manifest.permissions.network.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        )}

        {onSelect && (
          <Button 
            onClick={() => onSelect(tool.key)} 
            className="w-full"
            disabled={!tool.active}
          >
            Use Tool
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
