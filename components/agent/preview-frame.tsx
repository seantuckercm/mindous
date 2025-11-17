'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  RefreshCw, 
  Monitor, 
  Tablet, 
  Smartphone,
  Loader2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PreviewFrameProps {
  previewUrl?: string;
  title?: string;
  className?: string;
  defaultViewport?: 'desktop' | 'tablet' | 'mobile';
}

type ViewportType = 'desktop' | 'tablet' | 'mobile';

const viewportSizes: Record<ViewportType, { width: string; height: string; icon: any }> = {
  desktop: { width: '100%', height: '600px', icon: Monitor },
  tablet: { width: '768px', height: '1024px', icon: Tablet },
  mobile: { width: '375px', height: '667px', icon: Smartphone },
};

export function PreviewFrame({
  previewUrl,
  title = 'App Preview',
  className,
  defaultViewport = 'desktop',
}: PreviewFrameProps) {
  const [viewport, setViewport] = useState<ViewportType>(defaultViewport);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (previewUrl) {
      setIsLoading(true);
      setHasError(false);
      setKey(prev => prev + 1);
    }
  }, [previewUrl]);

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    setKey(prev => prev + 1);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!previewUrl) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Preview not ready yet
            </p>
            <p className="text-xs text-muted-foreground">
              The preview will appear here once the app is deployed
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {title}
          </CardTitle>
          
          <div className="flex items-center gap-1">
            {/* Viewport Selector */}
            <div className="flex items-center gap-1 mr-2 border rounded-md">
              {(['desktop', 'tablet', 'mobile'] as ViewportType[]).map((vp) => {
                const ViewportIcon = viewportSizes[vp].icon;
                return (
                  <Button
                    key={vp}
                    variant={viewport === vp ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewport(vp)}
                    className="h-7 px-2"
                    title={`${vp.charAt(0).toUpperCase() + vp.slice(1)} view`}
                  >
                    <ViewportIcon className="h-3 w-3" />
                  </Button>
                );
              })}
            </div>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-7 px-2"
              title="Refresh"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>

            {/* Open in new tab */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openInNewTab}
              className="h-7 px-2"
              title="Open in new tab"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* URL Display */}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
          <span className="truncate">{previewUrl}</span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative w-full overflow-auto bg-gray-100 dark:bg-gray-900 flex items-start justify-center">
          {/* Loading State */}
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading preview...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-3 text-center max-w-md px-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Failed to load preview</p>
                  <p className="text-xs text-muted-foreground">
                    The preview URL might not be ready yet or there was an error loading it.
                  </p>
                </div>
                <Button onClick={handleRefresh} size="sm" variant="outline">
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Try again
                </Button>
              </div>
            </div>
          )}

          {/* Preview iframe */}
          <div 
            className="transition-all duration-300 ease-in-out my-4"
            style={{
              width: viewportSizes[viewport].width,
              maxWidth: '100%',
            }}
          >
            <iframe
              key={key}
              src={previewUrl}
              className={cn(
                'w-full border rounded-lg shadow-lg bg-white',
                viewport !== 'desktop' && 'mx-auto'
              )}
              style={{
                height: viewportSizes[viewport].height,
              }}
              onLoad={handleLoad}
              onError={handleError}
              title={title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
