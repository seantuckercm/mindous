'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, ChevronDown, ChevronUp, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CodeDisplayProps {
  fileName: string;
  language: string;
  code: string;
  className?: string;
  defaultExpanded?: boolean;
}

// Language-specific syntax highlighting color mappings
const languageColors: Record<string, string> = {
  typescript: 'text-blue-400',
  javascript: 'text-yellow-400',
  python: 'text-green-400',
  css: 'text-purple-400',
  html: 'text-orange-400',
  json: 'text-gray-400',
};

// Simple syntax highlighter for demo purposes
// In production, consider using a library like Prism.js or highlight.js
function highlightCode(code: string, language: string): string {
  // This is a basic implementation - you can enhance it or use a library
  let highlighted = code;
  
  // Keywords
  const keywords = [
    'import', 'export', 'from', 'const', 'let', 'var', 'function', 'async', 'await',
    'return', 'if', 'else', 'for', 'while', 'class', 'interface', 'type', 'enum',
    'public', 'private', 'protected', 'static', 'readonly', 'extends', 'implements',
  ];
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    highlighted = highlighted.replace(regex, `<span class="text-purple-400 font-semibold">${keyword}</span>`);
  });
  
  // Strings
  highlighted = highlighted.replace(
    /(['"`])(.*?)\1/g,
    '<span class="text-green-400">$1$2$1</span>'
  );
  
  // Comments
  highlighted = highlighted.replace(
    /(\/\/.*$)/gm,
    '<span class="text-gray-500 italic">$1</span>'
  );
  highlighted = highlighted.replace(
    /(\/\*[\s\S]*?\*\/)/g,
    '<span class="text-gray-500 italic">$1</span>'
  );
  
  return highlighted;
}

export function CodeDisplay({
  fileName,
  language,
  code,
  className,
  defaultExpanded = true,
}: CodeDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const lines = code.split('\n');
  const languageColor = languageColors[language.toLowerCase()] || 'text-gray-400';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-mono">{fileName}</CardTitle>
            <span className={cn('text-xs font-semibold uppercase', languageColor)}>
              {language}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2"
            >
              {isCopied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Expand
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          <div className="bg-gray-950 text-gray-100 overflow-x-auto">
            <div className="flex">
              {/* Line numbers */}
              <div className="select-none bg-gray-900 text-gray-500 text-xs py-4 px-3 text-right border-r border-gray-800">
                {lines.map((_, i) => (
                  <div key={i} className="leading-6 h-6">
                    {i + 1}
                  </div>
                ))}
              </div>
              
              {/* Code content */}
              <pre className="flex-1 py-4 px-4 text-xs leading-6 overflow-x-auto">
                <code className="font-mono">
                  {lines.map((line, i) => (
                    <div key={i} className="h-6">
                      {line || ' '}
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </CardContent>
      )}
      
      {!isExpanded && (
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            {lines.length} lines • Click expand to view code
          </p>
        </CardContent>
      )}
    </Card>
  );
}
