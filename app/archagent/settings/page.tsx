'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Settings, 
  Sparkles, 
  Terminal, 
  Monitor, 
  Database, 
  FileCode,
  Save,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

interface ArchAgentSettings {
  // Clarification settings
  autoClarify: boolean;
  clarificationTimeout: number;
  
  // Workspace settings
  autoShowWorkspace: boolean;
  defaultToolPanel: 'terminal' | 'code-diff' | 'database' | 'desktop';
  
  // Terminal settings
  terminalFontSize: number;
  terminalTheme: 'dark' | 'light';
  autoScrollTerminal: boolean;
  
  // Desktop stream settings
  desktopQuality: number;
  desktopAutoConnect: boolean;
  
  // Database settings
  dbAutoRefresh: boolean;
  dbRefreshInterval: number;
  
  // Code diff settings
  diffAutoRefresh: boolean;
  diffViewMode: 'split' | 'unified';
}

const DEFAULT_SETTINGS: ArchAgentSettings = {
  autoClarify: true,
  clarificationTimeout: 30,
  autoShowWorkspace: true,
  defaultToolPanel: 'terminal',
  terminalFontSize: 12,
  terminalTheme: 'dark',
  autoScrollTerminal: true,
  desktopQuality: 6,
  desktopAutoConnect: false,
  dbAutoRefresh: true,
  dbRefreshInterval: 5,
  diffAutoRefresh: true,
  diffViewMode: 'split',
};

export default function ArchAgentSettingsPage() {
  const [settings, setSettings] = useState<ArchAgentSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = <K extends keyof ArchAgentSettings>(
    key: K,
    value: ArchAgentSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('archagent-settings', JSON.stringify(settings));
    toast.success('Settings saved successfully!');
    setHasChanges(false);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('archagent-settings');
    toast.success('Settings reset to defaults');
    setHasChanges(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">ArchAgent Settings</h1>
                <p className="text-muted-foreground">
                  Configure your ArchAgent workspace and tools
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/chat">
                <Button variant="outline">Back to Chat</Button>
              </Link>
              <Link href="/archagent-demo">
                <Button variant="outline">Demo Page</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Clarification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <CardTitle>Clarification System</CardTitle>
              </div>
              <CardDescription>
                Configure how ArchAgent asks for clarifications before execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-clarify">Enable Auto-Clarification</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically ask clarifying questions before starting tasks
                  </p>
                </div>
                <Switch
                  id="auto-clarify"
                  checked={settings.autoClarify}
                  onCheckedChange={(checked) => updateSetting('autoClarify', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Clarification Timeout (seconds)</Label>
                  <Badge variant="secondary">{settings.clarificationTimeout}s</Badge>
                </div>
                <Slider
                  value={[settings.clarificationTimeout]}
                  onValueChange={([value]) => updateSetting('clarificationTimeout', value)}
                  min={10}
                  max={120}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Time to wait for user input before auto-deciding
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Workspace Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                <CardTitle>Workspace Settings</CardTitle>
              </div>
              <CardDescription>
                Configure workspace behavior and default views
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-show-workspace">Auto-show Workspace</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically show ArchAgent tools when execution starts
                  </p>
                </div>
                <Switch
                  id="auto-show-workspace"
                  checked={settings.autoShowWorkspace}
                  onCheckedChange={(checked) => updateSetting('autoShowWorkspace', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Default Tool Panel</Label>
                <Select
                  value={settings.defaultToolPanel}
                  onValueChange={(value: typeof settings.defaultToolPanel) =>
                    updateSetting('defaultToolPanel', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terminal">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        Terminal
                      </div>
                    </SelectItem>
                    <SelectItem value="code-diff">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        Code Diff
                      </div>
                    </SelectItem>
                    <SelectItem value="database">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Database
                      </div>
                    </SelectItem>
                    <SelectItem value="desktop">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Desktop Stream
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Which tool panel to show by default when workspace opens
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terminal Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-green-500" />
                <CardTitle>Terminal Settings</CardTitle>
              </div>
              <CardDescription>
                Configure terminal appearance and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Font Size</Label>
                  <Badge variant="secondary">{settings.terminalFontSize}px</Badge>
                </div>
                <Slider
                  value={[settings.terminalFontSize]}
                  onValueChange={([value]) => updateSetting('terminalFontSize', value)}
                  min={8}
                  max={20}
                  step={1}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={settings.terminalTheme}
                  onValueChange={(value: typeof settings.terminalTheme) =>
                    updateSetting('terminalTheme', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-scroll">Auto-scroll</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically scroll to bottom when new output arrives
                  </p>
                </div>
                <Switch
                  id="auto-scroll"
                  checked={settings.autoScrollTerminal}
                  onCheckedChange={(checked) => updateSetting('autoScrollTerminal', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Desktop Stream Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-orange-500" />
                <CardTitle>Desktop Stream Settings</CardTitle>
              </div>
              <CardDescription>
                Configure desktop streaming quality and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Stream Quality</Label>
                  <Badge variant="secondary">
                    {settings.desktopQuality} (0 = Best, 9 = Fastest)
                  </Badge>
                </div>
                <Slider
                  value={[settings.desktopQuality]}
                  onValueChange={([value]) => updateSetting('desktopQuality', value)}
                  min={0}
                  max={9}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Lower values = better quality but slower, higher = faster but lower quality
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-connect-desktop">Auto-connect</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically connect to desktop stream when available
                  </p>
                </div>
                <Switch
                  id="auto-connect-desktop"
                  checked={settings.desktopAutoConnect}
                  onCheckedChange={(checked) => updateSetting('desktopAutoConnect', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Database Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-cyan-500" />
                <CardTitle>Database Viewer Settings</CardTitle>
              </div>
              <CardDescription>
                Configure database viewer behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="db-auto-refresh">Auto-refresh</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically refresh data when changes are detected
                  </p>
                </div>
                <Switch
                  id="db-auto-refresh"
                  checked={settings.dbAutoRefresh}
                  onCheckedChange={(checked) => updateSetting('dbAutoRefresh', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Refresh Interval (seconds)</Label>
                  <Badge variant="secondary">{settings.dbRefreshInterval}s</Badge>
                </div>
                <Slider
                  value={[settings.dbRefreshInterval]}
                  onValueChange={([value]) => updateSetting('dbRefreshInterval', value)}
                  min={1}
                  max={30}
                  step={1}
                  disabled={!settings.dbAutoRefresh}
                />
              </div>
            </CardContent>
          </Card>

          {/* Code Diff Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-yellow-500" />
                <CardTitle>Code Diff Settings</CardTitle>
              </div>
              <CardDescription>
                Configure code diff viewer preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="diff-auto-refresh">Auto-refresh</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically update diffs when files change
                  </p>
                </div>
                <Switch
                  id="diff-auto-refresh"
                  checked={settings.diffAutoRefresh}
                  onCheckedChange={(checked) => updateSetting('diffAutoRefresh', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Default View Mode</Label>
                <Select
                  value={settings.diffViewMode}
                  onValueChange={(value: typeof settings.diffViewMode) =>
                    updateSetting('diffViewMode', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="split">Split View</SelectItem>
                    <SelectItem value="unified">Unified View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
            {hasChanges && (
              <Badge variant="secondary" className="ml-auto">
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
