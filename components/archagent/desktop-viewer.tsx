'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Monitor, Maximize2, Minimize2, Power, Settings, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DesktopViewerProps {
  sessionId: string;
  vncUrl?: string;
  className?: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function DesktopViewer({ sessionId, vncUrl, className }: DesktopViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rfbRef = useRef<any>(null);
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isControlEnabled, setIsControlEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quality, setQuality] = useState([6]);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string>('');
  const [resolution, setResolution] = useState({ width: 0, height: 0 });

  // Initialize VNC connection (mock implementation for demo)
  const connectVNC = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      setError('');

      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful connection
      setConnectionStatus('connected');
      setResolution({ width: 1280, height: 720 });

      // TODO: Implement actual noVNC connection
      // This is a mock implementation for Phase 2 demo
      // Real implementation would use noVNC RFB client
      
    } catch (err) {
      console.error('VNC connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setConnectionStatus('error');
    }
  }, [sessionId, vncUrl, quality, isControlEnabled]);

  // Disconnect VNC
  const disconnectVNC = useCallback(() => {
    if (rfbRef.current) {
      rfbRef.current.disconnect();
      rfbRef.current = null;
    }
    setConnectionStatus('disconnected');
    setIsControlEnabled(false);
  }, []);

  // Toggle control mode
  const toggleControl = useCallback(() => {
    if (rfbRef.current && connectionStatus === 'connected') {
      const newControlState = !isControlEnabled;
      rfbRef.current.viewOnly = !newControlState;
      setIsControlEnabled(newControlState);
    }
  }, [isControlEnabled, connectionStatus]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  // Update quality
  const updateQuality = useCallback((value: number[]) => {
    setQuality(value);
    if (rfbRef.current && connectionStatus === 'connected') {
      rfbRef.current.qualityLevel = value[0];
    }
  }, [connectionStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectVNC();
    };
  }, [disconnectVNC]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-3 w-3" />;
      case 'connecting': return <RefreshCw className="h-3 w-3 animate-spin" />;
      case 'error': return <WifiOff className="h-3 w-3" />;
      default: return <WifiOff className="h-3 w-3" />;
    }
  };

  return (
    <div ref={containerRef} className={cn('flex flex-col h-full', className)}>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Live Desktop Stream</CardTitle>
              </div>
              <Badge variant="outline" className="gap-1">
                <div className={cn('h-2 w-2 rounded-full', getStatusColor())} />
                {connectionStatus}
              </Badge>
              {resolution.width > 0 && (
                <Badge variant="secondary">
                  {resolution.width}×{resolution.height}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' && (
                <Button
                  variant={isControlEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleControl}
                  className="gap-2"
                >
                  {isControlEnabled ? 'Control Enabled' : 'View Only'}
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              {connectionStatus === 'connected' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={disconnectVNC}
                  className="gap-2"
                >
                  <Power className="h-4 w-4" />
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={connectVNC}
                  disabled={connectionStatus === 'connecting'}
                  className="gap-2"
                >
                  {getStatusIcon()}
                  {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
                </Button>
              )}
            </div>
          </div>

          {showSettings && (
            <div className="mt-4 p-4 border rounded-lg space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Quality Level</label>
                  <span className="text-sm text-muted-foreground">{quality[0]}</span>
                </div>
                <Slider
                  value={quality}
                  onValueChange={updateQuality}
                  min={0}
                  max={9}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  0 = Best quality, 9 = Best performance
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-2 p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive font-medium">Error: {error}</p>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
            {connectionStatus === 'disconnected' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-4">
                <Monitor className="h-16 w-16 opacity-50" />
                <div className="text-center">
                  <p className="text-lg font-medium">Desktop Stream Not Connected</p>
                  <p className="text-sm mt-2">Click Connect to view the agent's desktop</p>
                </div>
                <Button onClick={connectVNC} className="gap-2">
                  <Wifi className="h-4 w-4" />
                  Connect to Desktop
                </Button>
              </div>
            )}

            {connectionStatus === 'connecting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-4">
                <RefreshCw className="h-16 w-16 opacity-50 animate-spin" />
                <p className="text-lg font-medium">Connecting to desktop stream...</p>
              </div>
            )}

            {connectionStatus === 'connected' && (
              <div 
                ref={canvasRef} 
                className={cn(
                  'w-full h-full flex items-center justify-center bg-gray-900',
                  isControlEnabled && 'cursor-pointer'
                )}
              >
                <div className="text-center text-gray-400">
                  <Monitor className="h-24 w-24 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Mock Desktop Stream</p>
                  <p className="text-sm mt-2">VNC connection would display here</p>
                  <p className="text-xs mt-4 opacity-75">Resolution: {resolution.width}×{resolution.height}</p>
                  <p className="text-xs opacity-75">
                    Control: {isControlEnabled ? 'Enabled' : 'View Only'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
