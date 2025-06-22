import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing scraping functionality...');
    
    // Import and test the scraping function
    const { scrapeAllSources } = await import('../../../lib/tyre-advisor');
    const scrapedData = await scrapeAllSources();
    
    console.log(`Scraping test completed. Found ${scrapedData.length} tyres.`);
    
    return NextResponse.json({
      success: true,
      tyreCount: scrapedData.length,
      tyres: scrapedData.slice(0, 5), // Return first 5 tyres as sample
      message: `Successfully scraped ${scrapedData.length} tyres from all sources`
    });
  } catch (error) {
    console.error('Error in scraping test:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        tyreCount: 0,
        tyres: []
      },
      { status: 500 }
    );
  }
} 