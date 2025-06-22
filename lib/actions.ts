"use server";

import { TyreRecommendation, UserPreferences, ScrapedTyreData } from '../types/tyre';
import { getTyreRecommendations as getRecs } from './tyre-advisor';
import { persistentDB } from './persistent-database';

/**
 * This is the main Server Action that fetches tyre recommendations.
 * It's safe to call this from Client Components.
 */
export async function getTyreRecommendations(
  userPreferences: UserPreferences,
  refinementQuestion?: string,
  currentRecommendations?: TyreRecommendation[]
): Promise<{ recommendations: TyreRecommendation[], scrapedData: ScrapedTyreData[] }> {
  // The actual implementation is in tyre-advisor.ts to keep this file clean.
  return getRecs(userPreferences, refinementQuestion, currentRecommendations);
}

/**
 * Server Action to refresh the database with real scraped data.
 * This will scrape all sources and update the persistent database.
 */
export async function refreshDatabaseWithRealData(): Promise<{
  success: boolean;
  message: string;
  tyreCount?: number;
}> {
  try {
    console.log('Refreshing database with real scraped data...');
    
    // First, scrape fresh data
    const { scrapeAllSources } = await import('./tyre-advisor');
    console.log('Starting to scrape all sources...');
    const scrapedData = await scrapeAllSources();
    console.log(`Scraped ${scrapedData.length} tyres from all sources`);
    
    if (scrapedData.length === 0) {
      console.log('No data was scraped, this might indicate an issue with the scrapers');
      return {
        success: false,
        message: 'No data was scraped from any source. This might indicate an issue with the scrapers or network connectivity.',
        tyreCount: 0
      };
    }
    
    // Clear the current database
    await persistentDB.saveDatabase({
      tyres: [],
      discussions: [],
      usageStats: [],
      lastSync: new Date()
    });
    
    // Load fresh data (this will trigger scraping again and store the data)
    const db = await persistentDB.loadDatabase();
    
    return {
      success: true,
      message: `Database refreshed successfully with ${scrapedData.length} real tyres from scrapers`,
      tyreCount: scrapedData.length
    };
  } catch (error) {
    console.error('Error refreshing database:', error);
    return {
      success: false,
      message: `Failed to refresh database: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tyreCount: 0
    };
  }
}

/**
 * Server Action to get database statistics.
 */
export async function getDatabaseStatistics(): Promise<{
  totalTyres: number;
  totalDiscussions: number;
  totalUsageRecords: number;
  lastSync: Date;
}> {
  const db = await persistentDB.loadDatabase();
  
  return {
    totalTyres: db.tyres.length,
    totalDiscussions: db.discussions.length,
    totalUsageRecords: db.usageStats.length,
    lastSync: db.lastSync
  };
} 