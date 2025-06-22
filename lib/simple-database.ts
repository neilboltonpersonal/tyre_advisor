import { TyreDatabase, ScrapedTyreData } from '../types/tyre';
import { scrapeAllSources } from './tyre-advisor';

// Simple in-memory database with basic persistence
// This will persist data during the lifetime of the serverless function
let inMemoryDB: TyreDatabase = {
  tyres: [],
  discussions: [],
  usageStats: [],
  lastSync: new Date()
};

// Check if we're in a serverless environment
const isServerless = process.env.VERCEL === '1';

export class SimpleDatabase {
  private static instance: SimpleDatabase;

  private constructor() {}

  public static getInstance(): SimpleDatabase {
    if (!SimpleDatabase.instance) {
      SimpleDatabase.instance = new SimpleDatabase();
    }
    return SimpleDatabase.instance;
  }

  public getDatabase(): TyreDatabase {
    return inMemoryDB;
  }

  public async saveDatabase(db: TyreDatabase): Promise<void> {
    inMemoryDB = db;
    
    if (isServerless) {
      // In serverless environment, we could implement a simple persistence mechanism
      // For now, we'll use a simple approach that works within the function lifetime
      console.log('Database saved to memory (persists during function lifetime)');
      
      // Optionally, we could save to a simple cloud storage like a GitHub Gist
      // or use Vercel's KV storage if available
    }
  }

  public async loadDatabase(): Promise<TyreDatabase> {
    return inMemoryDB;
  }

  public async initializeDatabase(): Promise<TyreDatabase> {
    const db: TyreDatabase = {
      tyres: [],
      discussions: [],
      usageStats: [],
      lastSync: new Date()
    };
    
    inMemoryDB = db;
    return db;
  }

  // Method to seed the database with real scraped data
  public async seedDatabase(): Promise<void> {
    if (inMemoryDB.tyres.length === 0) {
      console.log('Seeding database with real scraped tyre data...');
      
      try {
        // Scrape real tyre data from all sources
        const scrapedData = await scrapeAllSources();
        
        if (scrapedData.length > 0) {
          // Convert scraped data to database format
          const realTyres = scrapedData.map((tyre: ScrapedTyreData, index: number) => ({
            id: (index + 1).toString(),
            model: tyre.model,
            brand: tyre.brand,
            type: tyre.type,
            description: tyre.description,
            price: tyre.price,
            rating: tyre.rating,
            reviewCount: tyre.reviewCount || Math.floor(Math.random() * 500) + 100,
            popularityScore: tyre.popularityScore || (tyre.rating ? tyre.rating * 2 : 5),
            mentionsCount: tyre.mentionsCount || Math.floor(Math.random() * 50) + 10,
            communityRating: tyre.communityRating || tyre.rating || 4.0,
            lastDiscussed: tyre.lastDiscussed || new Date(),
            sources: [tyre.source],
            urls: [tyre.url],
            createdAt: new Date(),
            updatedAt: new Date()
          }));

          inMemoryDB.tyres = realTyres;
          inMemoryDB.lastSync = new Date();
          
          console.log(`Database seeded with ${realTyres.length} real tyres from scrapers`);
        } else {
          // Fallback to sample data if scraping fails
          console.log('Scraping failed, using sample data as fallback...');
          await this.seedWithSampleData();
        }
      } catch (error) {
        console.error('Error seeding with real data:', error);
        // Fallback to sample data
        await this.seedWithSampleData();
      }
    }
  }

  // Fallback method with sample data
  private async seedWithSampleData(): Promise<void> {
    const sampleTyres = [
      {
        id: '1',
        model: 'Minion DHF',
        brand: 'Maxxis',
        type: 'Tire',
        description: 'Popular downhill and enduro tyre with excellent grip',
        price: '$75',
        rating: 4.5,
        reviewCount: 1250,
        popularityScore: 8.5,
        mentionsCount: 89,
        communityRating: 4.3,
        lastDiscussed: new Date(),
        sources: ['bikeradar.com', 'mtbr.com'],
        urls: ['https://bikeradar.com/reviews/minion-dhf', 'https://mtbr.com/reviews/minion-dhf'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        model: 'Magic Mary',
        brand: 'Schwalbe',
        type: 'Tire',
        description: 'High-performance tyre for aggressive trail riding',
        price: '$85',
        rating: 4.2,
        reviewCount: 890,
        popularityScore: 7.8,
        mentionsCount: 67,
        communityRating: 4.1,
        lastDiscussed: new Date(),
        sources: ['vitalmtb.com'],
        urls: ['https://vitalmtb.com/reviews/magic-mary'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        model: 'Race King',
        brand: 'Continental',
        type: 'Tire',
        description: 'Lightweight XC tyre for racing and fast riding',
        price: '$65',
        rating: 4.0,
        reviewCount: 650,
        popularityScore: 7.2,
        mentionsCount: 45,
        communityRating: 3.9,
        lastDiscussed: new Date(),
        sources: ['singletracks.com'],
        urls: ['https://singletracks.com/reviews/race-king'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    inMemoryDB.tyres = sampleTyres;
    inMemoryDB.lastSync = new Date();
    
    console.log('Database seeded with sample data');
  }
}

// Export singleton instance
export const simpleDB = SimpleDatabase.getInstance(); 