import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/archagent/diffs
 * Fetch code diffs for a session
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual diff tracking
    // For now, return mock data
    const mockDiffs = [
      {
        path: 'src/components/Dashboard.tsx',
        oldContent: `import React from 'react';

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to the dashboard</p>
    </div>
  );
}`,
        newContent: `import React from 'react';
import { Card } from '@/components/ui/card';

export function Dashboard() {
  return (
    <div className="p-6">
      <Card>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the enhanced dashboard</p>
      </Card>
    </div>
  );
}`,
        status: 'modified' as const,
        timestamp: new Date().toISOString(),
      },
      {
        path: 'src/lib/api.ts',
        oldContent: '',
        newContent: `export async function fetchData(url: string) {
  const response = await fetch(url);
  return response.json();
}`,
        status: 'added' as const,
        timestamp: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      diffs: mockDiffs,
    });
  } catch (error) {
    console.error('Error fetching diffs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diffs' },
      { status: 500 }
    );
  }
}
