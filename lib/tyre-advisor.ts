import { TyreRecommendation, UserPreferences, ScrapedTyreData } from '../types/tyre';
import { analyzeWithAI } from './ai-analyzer';
import { scrapeMTBR } from './scrapers/mtbr';
import { scrapeVitalMtb } from './scrapers/vitalmtb';
import { scrapeBikeRadar } from './scrapers/bikeradar';
import { scrapeSingletracks } from './scrapers/singletracks';
import { scrapeCommunityDiscussions } from './scrapers/community-scraper';
import { 
  upsertTyre, 
  addDiscussion, 
  updateUsageStats, 
  getPopularTyresByLocation,
  getDatabaseStats,
  getTyreById
} from './database';

// This function will replace the old mock data by fetching from all sources.
export async function scrapeAllSources(): Promise<ScrapedTyreData[]> {
  console.log('Scraping all tyre sources...');
  
  try {
    const results = await Promise.allSettled([
      scrapeMTBR(),
      scrapeVitalMtb(),
      scrapeBikeRadar(),
      scrapeSingletracks(),
    ]);

    const allTyres: ScrapedTyreData[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Source ${index + 1} scraped successfully: ${result.value.length} tyres`);
        allTyres.push(...result.value);
      } else {
        console.error(`Source ${index + 1} failed:`, result.reason);
      }
    });

    console.log(`Total tyres scraped: ${allTyres.length}`);
    return allTyres;
  } catch (error) {
    console.error('Error scraping sources:', error);
    return [];
  }
}

// Convert USD price range to GBP
function convertUSDToGBP(usdRange: string): string {
  // Extract numbers from the range (e.g., "$60-80" -> [60, 80])
  const numbers = usdRange.match(/\d+/g);
  if (!numbers || numbers.length === 0) return usdRange;
  
  // Convert USD to GBP (approximate rate: 1 USD = 0.79 GBP)
  const gbpNumbers = numbers.map(num => Math.round(parseInt(num) * 0.79));
  
  if (gbpNumbers.length === 1) {
    return `£${gbpNumbers[0]}`;
  } else if (gbpNumbers.length === 2) {
    return `£${gbpNumbers[0]}-${gbpNumbers[1]}`;
  }
  
  return usdRange;
}

export async function getTyreRecommendations(
  userPreferences: UserPreferences,
  refinementQuestion?: string,
  currentRecommendations?: TyreRecommendation[]
): Promise<{ recommendations: TyreRecommendation[], scrapedData: ScrapedTyreData[] }> {
  const scrapedData = await scrapeAllSources();

  try {
    if (scrapedData.length === 0) {
      console.warn('No data was scraped. Falling back to sample recommendations.');
      return { 
        recommendations: getFallbackRecommendations(userPreferences),
        scrapedData: [] 
      };
    }

    // Store scraped data in database and enrich with community data
    const enrichedData = await enrichWithCommunityData(scrapedData);

    let aiRecommendations: TyreRecommendation[];
    // If we have current recommendations and a refinement question, use AI to refine
    if (currentRecommendations && refinementQuestion) {
      aiRecommendations = await analyzeWithAI(
        userPreferences,
        enrichedData,
        refinementQuestion,
        currentRecommendations
      );
    } else {
      // Generate initial recommendations
      aiRecommendations = await analyzeWithAI(userPreferences, enrichedData);
    }

    // Convert price ranges to GBP
    aiRecommendations.forEach(rec => {
      if (rec.priceRange) {
        rec.priceRange = convertUSDToGBP(rec.priceRange);
      }
    });

    return { recommendations: aiRecommendations, scrapedData: enrichedData };

  } catch (error) {
    console.error('Error getting tyre recommendations:', error);
    
    // Fallback to sample data if analysis fails, but still return scraped data if available
    return { 
        recommendations: getFallbackRecommendations(userPreferences),
        scrapedData: scrapedData 
    };
  }
}

// Enrich scraped data with community discussions and store in database
async function enrichWithCommunityData(scrapedData: ScrapedTyreData[]): Promise<ScrapedTyreData[]> {
  console.log('Enriching scraped data with community discussions...');
  
  const enrichedData: ScrapedTyreData[] = [];
  
  for (const tyre of scrapedData) {
    try {
      // Store tyre in database
      const tyreRecord = await upsertTyre(tyre);
      
      // Scrape community discussions for this tyre
      const discussions = await scrapeCommunityDiscussions(tyre.model, tyre.brand);
      
      // Store discussions in database
      for (const discussion of discussions) {
        await addDiscussion(discussion, tyreRecord.id);
      }
      
      // Update usage statistics based on community activity
      const totalMentions = discussions.length;
      const positiveMentions = discussions.filter(d => d.sentiment === 'positive').length;
      const negativeMentions = discussions.filter(d => d.sentiment === 'negative').length;
      
      // Calculate community rating from discussions
      const communityRating = discussions.length > 0 
        ? discussions.reduce((sum, d) => sum + (d.sentiment === 'positive' ? 1 : d.sentiment === 'negative' ? 0 : 0.5), 0) / discussions.length * 5
        : tyre.rating || 0;
      
      // Update usage stats (using a default location for now)
      await updateUsageStats(
        tyreRecord.id,
        'Global',
        0, 0, // Default coordinates
        totalMentions,
        positiveMentions > negativeMentions ? 'positive' : negativeMentions > positiveMentions ? 'negative' : 'neutral'
      );
      
      // Create enriched tyre data
      const enrichedTyre: ScrapedTyreData = {
        ...tyre,
        reviewCount: tyre.reviewCount || discussions.length,
        popularityScore: tyre.popularityScore || (discussions.length * 0.5),
        mentionsCount: tyre.mentionsCount || totalMentions,
        communityRating,
        lastDiscussed: discussions.length > 0 ? discussions[0].date : undefined,
        discussionThreads: discussions
      };
      
      enrichedData.push(enrichedTyre);
      
      // Add delay to be respectful to servers
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error enriching data for ${tyre.brand} ${tyre.model}:`, error);
      enrichedData.push(tyre); // Add original data if enrichment fails
    }
  }
  
  console.log(`Enriched ${enrichedData.length} tyres with community data`);
  return enrichedData;
}

// Get popular tyres by location from database
export async function getPopularTyresByLocationFromDB(
  location: string = 'Global',
  limit: number = 10
): Promise<ScrapedTyreData[]> {
  try {
    const usageStats = await getPopularTyresByLocation(location, limit);
    const enrichedData: ScrapedTyreData[] = [];
    
    for (const usage of usageStats) {
      // Get the tyre record to access model and brand
      const tyreRecord = await getTyreById(usage.tyreId);
      if (!tyreRecord) continue;
      
      // Convert usage stats back to ScrapedTyreData format for UI compatibility
      const tyreData: ScrapedTyreData = {
        model: tyreRecord.model,
        brand: tyreRecord.brand,
        type: 'Tire',
        description: `Popular tyre with ${usage.totalMentions} community mentions`,
        source: 'Community Database',
        url: '',
        scrapedAt: new Date(),
        reviewCount: usage.totalMentions,
        popularityScore: usage.communityScore,
        mentionsCount: usage.totalMentions,
        communityRating: usage.communityScore,
        lastDiscussed: usage.lastUpdated
      };
      
      enrichedData.push(tyreData);
    }
    
    return enrichedData;
  } catch (error) {
    console.error('Error getting popular tyres from database:', error);
    return [];
  }
}

// Get database statistics
export async function getDatabaseStatistics() {
  return await getDatabaseStats();
}

function getFallbackRecommendations(preferences: UserPreferences): TyreRecommendation[] {
  // Fallback recommendations based on common tyre types
  const fallbackTyres: TyreRecommendation[] = [
    {
      model: 'Maxxis Minion DHF',
      brand: 'Maxxis',
      type: 'Downhill/Trail',
      bestFor: 'Aggressive trail and enduro riding',
      priceRange: '£47-63',
      rating: 4.8,
      description: 'Excellent grip and durability for aggressive riding',
      pros: ['Excellent grip', 'Durable', 'Good in wet conditions'],
      cons: ['Heavy', 'Slow rolling'],
      source: 'Pinkbike Reviews'
    },
    {
      model: 'Continental Trail King',
      brand: 'Continental',
      type: 'Trail/All Mountain',
      bestFor: 'Versatile trail riding',
      priceRange: '£40-55',
      rating: 4.5,
      description: 'Balanced performance for mixed terrain',
      pros: ['Good all-around performance', 'Lightweight', 'Fast rolling'],
      cons: ['Less grip in extreme conditions'],
      source: 'Singletrackworld Reviews'
    },
    {
      model: 'Schwalbe Nobby Nic',
      brand: 'Schwalbe',
      type: 'Cross Country/Trail',
      bestFor: 'Fast trail and XC riding',
      priceRange: '£36-51',
      rating: 4.3,
      description: 'Fast rolling with good grip for XC and light trail use',
      pros: ['Fast rolling', 'Lightweight', 'Good for XC'],
      cons: ['Less durable', 'Limited grip in technical terrain'],
      source: 'Pinkbike Reviews'
    },
    {
      model: 'Michelin Wild Enduro',
      brand: 'Michelin',
      type: 'Enduro/Downhill',
      bestFor: 'Aggressive enduro and downhill riding',
      priceRange: '£55-71',
      rating: 4.7,
      description: 'Aggressive enduro tyre with excellent grip in all conditions',
      pros: ['Excellent grip', 'Very durable', 'All-weather performance'],
      cons: ['Heavy', 'Expensive', 'Slow rolling'],
      source: 'Singletrackworld Reviews'
    },
    {
      model: 'WTB Trail Boss',
      brand: 'WTB',
      type: 'Trail',
      bestFor: 'Versatile trail riding',
      priceRange: '£32-47',
      rating: 4.2,
      description: 'Versatile trail tyre with good all-around performance',
      pros: ['Affordable', 'Good all-around performance', 'Reliable'],
      cons: ['Not exceptional in any area', 'Limited grip in extreme conditions'],
      source: 'Pinkbike Reviews'
    },
    {
      model: 'Vittoria Mazza',
      brand: 'Vittoria',
      type: 'Enduro/Trail',
      bestFor: 'Aggressive enduro and trail riding',
      priceRange: '£51-67',
      rating: 4.6,
      description: 'Aggressive enduro tyre with excellent grip and durability',
      pros: ['Excellent grip', 'Durable', 'Great for technical terrain'],
      cons: ['Heavy', 'Expensive'],
      source: 'Pinkbike Reviews'
    },
    {
      model: 'Pirelli Scorpion XC',
      brand: 'Pirelli',
      type: 'Cross Country',
      bestFor: 'Fast cross country and racing',
      priceRange: '£40-55',
      rating: 4.2,
      description: 'Fast rolling XC tyre with good grip for racing',
      pros: ['Fast rolling', 'Lightweight', 'Good for racing'],
      cons: ['Less durable', 'Limited grip in technical terrain'],
      source: 'Singletrackworld Reviews'
    },
    {
      model: 'Maxxis High Roller II',
      brand: 'Maxxis',
      type: 'Trail/Enduro',
      bestFor: 'Versatile trail and enduro riding',
      priceRange: '£43-59',
      rating: 4.5,
      description: 'Versatile trail tyre with excellent grip and good rolling speed',
      pros: ['Excellent grip', 'Good rolling speed', 'Versatile'],
      cons: ['Can be noisy on pavement'],
      source: 'Pinkbike Reviews'
    },
    {
      model: 'Schwalbe Magic Mary',
      brand: 'Schwalbe',
      type: 'Downhill/Enduro',
      bestFor: 'Aggressive downhill and enduro riding',
      priceRange: '£55-71',
      rating: 4.7,
      description: 'Aggressive downhill tyre with exceptional grip in all conditions',
      pros: ['Exceptional grip', 'All-weather performance', 'Very durable'],
      cons: ['Heavy', 'Expensive', 'Slow rolling'],
      source: 'Singletrackworld Reviews'
    },
    {
      model: 'Hutchinson Toro',
      brand: 'Hutchinson',
      type: 'Trail/All Mountain',
      bestFor: 'Versatile all-mountain riding',
      priceRange: '£40-55',
      rating: 4.3,
      description: 'Versatile all-mountain tyre with good grip and rolling speed',
      pros: ['Good all-around performance', 'Tubeless ready', 'Versatile'],
      cons: ['Not exceptional in any area'],
      source: 'Pinkbike Reviews'
    }
  ];

  // Simple filtering based on preferences
  return fallbackTyres.filter(tyre => {
    if (preferences.ridingStyle.includes('Downhill') && tyre.type.includes('Downhill')) {
      return true;
    }
    if (preferences.ridingStyle.includes('Cross Country') && tyre.type.includes('Cross Country')) {
      return true;
    }
    if (preferences.ridingStyle.includes('Trail') && tyre.type.includes('Trail')) {
      return true;
    }
    return true; // Return all if no specific match
  });
}

export async function getTyreDataStats(): Promise<{
  totalTyres: number;
  lastUpdated: Date | null;
  sources: string[];
}> {
  return {
    totalTyres: 0, // This will be updated when scrapeAllSources is implemented
    lastUpdated: null,
    sources: []
  };
} 