
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/archagent/database/data
 * Fetch table data for a session
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const table = searchParams.get('table');
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!table) {
      return NextResponse.json(
        { error: 'Table name is required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual database querying
    // For now, return mock data based on table
    let mockData: any[] = [];

    if (table === 'users') {
      mockData = Array.from({ length: Math.min(limit, 100) }, (_, i) => ({
        id: page * limit + i + 1,
        email: `user${page * limit + i + 1}@example.com`,
        name: `User ${page * limit + i + 1}`,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      }));
    } else if (table === 'posts') {
      mockData = Array.from({ length: Math.min(limit, 100) }, (_, i) => ({
        id: page * limit + i + 1,
        user_id: Math.floor(Math.random() * 1000) + 1,
        title: `Post Title ${page * limit + i + 1}`,
        content: `This is the content of post ${page * limit + i + 1}`,
        published: Math.random() > 0.5,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      }));
    } else if (table === 'comments') {
      mockData = Array.from({ length: Math.min(limit, 100) }, (_, i) => ({
        id: page * limit + i + 1,
        post_id: Math.floor(Math.random() * 4000) + 1,
        user_id: Math.floor(Math.random() * 1000) + 1,
        content: `Comment content ${page * limit + i + 1}`,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      }));
    }

    return NextResponse.json({
      success: true,
      rows: mockData,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
