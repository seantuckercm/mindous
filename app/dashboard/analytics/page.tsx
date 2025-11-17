
'use client';

import { LLMPerformanceDashboard } from '@/components/llm/llm-performance-dashboard';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LLM Performance Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Monitor costs, performance, and usage across all AI providers
          </p>
        </div>
      </div>

      {/* Performance Dashboard */}
      <LLMPerformanceDashboard />
    </div>
  );
}
