'use client';

import { Badge } from '@/components/ui/badge';

interface RouterStatusBadgeProps {
  provider: string;
  model: string;
  cacheHit?: boolean;
}

export function RouterStatusBadge({ provider, model, cacheHit }: RouterStatusBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={cacheHit ? 'secondary' : 'default'}>
        {provider}:{model}
      </Badge>
      {cacheHit && <span className="text-xs text-muted-foreground">cached</span>}
    </div>
  );
}
