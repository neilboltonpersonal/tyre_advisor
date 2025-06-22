import { NextResponse } from 'next/server';
import { getDatabaseStats } from '../../../../lib/database';

export async function GET() {
  try {
    const stats = await getDatabaseStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting database stats:', error);
    return NextResponse.json(
      { error: 'Failed to get database statistics' },
      { status: 500 }
    );
  }
} 