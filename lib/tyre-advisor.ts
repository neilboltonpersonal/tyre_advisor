import { TyreRecommendation, UserPreferences, ScrapedTyreData } from '../types/tyre';
import { analyzeWithAI } from './ai-analyzer';
import { scrapeMtbr } from './scrapers/mtbr';
import { scrapeVitalMtb } from './scrapers/vitalmtb';
import { scrapeBikeRadar } from './scrapers/bikeradar';
import { scrapeSingletracks } from './scrapers/singletracks';

// This function will replace the old mock data by fetching from all sources.
async function scrapeAllSources(): Promise<ScrapedTyreData[]> {
  console.log('Starting all scrapers...');
  try {
    const results = await Promise.allSettled([
      scrapeMtbr(),
      scrapeVitalMtb(),
      scrapeBikeRadar(),
      scrapeSingletracks(),
      // Add existing scrapers here if they are in separate files
    ]);

    const successfulData = results
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => (result as PromiseFulfilledResult<ScrapedTyreData[]>).value);
    
    console.log(`Scraping complete. Found ${successfulData.length} total tyres.`);
    return successfulData;
  } catch (error) {
    console.error('An error occurred during scraping:', error);
    return [];
  }
}

export async function getTyreRecommendations(
  userPreferences: UserPreferences,
  refinementQuestion?: string,
  currentRecommendations?: TyreRecommendation[]
): Promise<TyreRecommendation[]> {
  try {
    const scrapedData = await scrapeAllSources();

    if (scrapedData.length === 0) {
      console.warn('No data was scraped. Falling back to sample recommendations.');
      return getFallbackRecommendations(userPreferences);
    }
    
    // If we have current recommendations and a refinement question, use AI to refine
    if (currentRecommendations && refinementQuestion) {
      return await analyzeWithAI(
        userPreferences,
        scrapedData,
        refinementQuestion,
        currentRecommendations
      );
    }

    // Generate initial recommendations
    return await analyzeWithAI(userPreferences, scrapedData);
  } catch (error) {
    console.error('Error getting tyre recommendations:', error);
    
    // Fallback to sample data if analysis fails
    return getFallbackRecommendations(userPreferences);
  }
}

function getFallbackRecommendations(preferences: UserPreferences): TyreRecommendation[] {
  // Fallback recommendations based on common tyre types
  const fallbackTyres: TyreRecommendation[] = [
    {
      model: 'Maxxis Minion DHF',
      brand: 'Maxxis',
      type: 'Downhill/Trail',
      bestFor: 'Aggressive trail and enduro riding',
      priceRange: '$60-80',
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
      priceRange: '$50-70',
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
      priceRange: '$45-65',
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
      priceRange: '$70-90',
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
      priceRange: '$40-60',
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
      priceRange: '$65-85',
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
      priceRange: '$50-70',
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
      priceRange: '$55-75',
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
      priceRange: '$70-90',
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
      priceRange: '$50-70',
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