'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Terminal as TerminalIcon, Download, Maximize2, Minimize2, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Dynamic imports for xterm (client-side only)
let Terminal: any;
let FitAddon: any;
let WebLinksAddon: any;

interface TerminalViewerProps {
  runId: string;
  buildId?: string;
  title?: string;
  className?: string;
}

export function TerminalViewer({ runId, buildId, title = 'Terminal Output', className }: TerminalViewerProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Dynamically import xterm modules (client-side only)
    const initTerminal = async () => {
      if (!Terminal) {
        const xtermModule = await import('@xterm/xterm');
        const fitModule = await import('@xterm/addon-fit');
        const webLinksModule = await import('@xterm/addon-web-links');
        await import('@xterm/xterm/css/xterm.css');
        
        Terminal = xtermModule.Terminal;
        FitAddon = fitModule.FitAddon;
        WebLinksAddon = webLinksModule.WebLinksAddon;
      }

      const term = new Terminal({
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#e5e5e5',
        },
        fontSize: 12,
        fontFamily: 'Monaco, Menlo, "Courier New", monospace',
        cursorBlink: false,
        disableStdin: true, // Read-only terminal
        rows: 30,
        convertEol: true
      });

      const fit = new FitAddon();
      term.loadAddon(fit);
      term.loadAddon(new WebLinksAddon());

      term.open(terminalRef.current!);
      fit.fit();

      setTerminal(term);
      setFitAddon(fit);

      // Handle window resize
      const handleResize = () => {
        fit.fit();
      };
      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
      };
    };

    let cleanup: (() => void) | undefined;
    initTerminal().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
    };
  }, []);

  // Connect to terminal stream
  useEffect(() => {
    if (!terminal) return;

    const streamUrl = buildId 
      ? `/api/streams/terminal/${buildId}`
      : `/api/streams/runs/${runId}/terminal`;

    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      terminal.writeln('\x1b[1;32m[Terminal Connected]\x1b[0m');
    };

    eventSource.addEventListener('command', (e) => {
      const data = JSON.parse(e.data);
      const line = `\r\n\x1b[1;36m$ ${data.command}\x1b[0m`;
      terminal.writeln(line);
      setLogs(prev => [...prev, `$ ${data.command}`]);
    });

    eventSource.addEventListener('stdout', (e) => {
      const data = JSON.parse(e.data);
      terminal.write(data.output);
      setLogs(prev => [...prev, data.output]);
    });

    eventSource.addEventListener('stderr', (e) => {
      const data = JSON.parse(e.data);
      const errorOutput = `\x1b[1;31m${data.output}\x1b[0m`;
      terminal.write(errorOutput);
      setLogs(prev => [...prev, data.output]);
    });

    eventSource.addEventListener('exit', (e) => {
      const data = JSON.parse(e.data);
      const color = data.exitCode === 0 ? '\x1b[1;32m' : '\x1b[1;31m';
      const line = `\r\n${color}[Process exited with code ${data.exitCode}]${data.duration ? ` (${data.duration}ms)` : ''}\x1b[0m`;
      terminal.writeln(line);
      setLogs(prev => [...prev, `[Exit code: ${data.exitCode}]`]);
    });

    eventSource.addEventListener('complete', () => {
      terminal.writeln('\r\n\x1b[1;32m[Build Complete]\x1b[0m');
      setIsConnected(false);
    });

    eventSource.onerror = (error) => {
      console.error('Terminal stream error:', error);
      terminal.writeln('\r\n\x1b[1;31m[Connection Lost - Reconnecting...]\x1b[0m');
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [terminal, runId, buildId]);

  const handleDownload = () => {
    const logText = logs.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-${runId || buildId}-${new Date().toISOString()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Terminal log downloaded');
  };

  const handleCopy = async () => {
    const logText = logs.join('\n');
    await navigator.clipboard.writeText(logText);
    toast.success('Terminal output copied to clipboard');
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    // Re-fit terminal after expansion
    setTimeout(() => {
      fitAddon?.fit();
    }, 100);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-4 w-4" />
            <CardTitle className="text-base">{title}</CardTitle>
            {isConnected ? (
              <Badge variant="outline" className="ml-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full mr-1" />
                Idle
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              disabled={logs.length === 0}
              title="Copy output"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownload}
              disabled={logs.length === 0}
              title="Download log"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggleExpand}
              title={isExpanded ? 'Minimize' : 'Maximize'}
            >
              {isExpanded ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={terminalRef}
          className={`bg-[#1e1e1e] ${
            isExpanded ? 'h-[600px]' : 'h-[320px]'
          } transition-all duration-200`}
          style={{ padding: '8px' }}
        />
        {logs.length === 0 && !isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e]/80">
            <div className="text-center text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Waiting for terminal output...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
