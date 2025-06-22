import { NextResponse } from 'next/server';
import { getPopularTyresByLocationFromDB } from '../../../../lib/tyre-advisor';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || 'Global';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const popularTyres = await getPopularTyresByLocationFromDB(location, limit);
    return NextResponse.json(popularTyres);
  } catch (error) {
    console.error('Error getting popular tyres:', error);
    return NextResponse.json(
      { error: 'Failed to get popular tyres' },
      { status: 500 }
    );
  }
} 