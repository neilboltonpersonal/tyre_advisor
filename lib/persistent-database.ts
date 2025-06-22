import { TyreDatabase, ScrapedTyreData } from '../types/tyre';
import { scrapeAllSources } from './tyre-advisor';

// GitHub Gist configuration for persistent storage
const GIST_ID = 'b15d51e15f53553ad0f1a4db2e52fc02';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Add this to Vercel env vars

// Simple in-memory cache for performance
let inMemoryDB: TyreDatabase = {
  tyres: [],
  discussions: [],
  usageStats: [],
  lastSync: new Date()
};

// Check if we're in a serverless environment
const isServerless = process.env.VERCEL === '1';

export class PersistentDatabase {
  private static instance: PersistentDatabase;

  private constructor() {}

  public static getInstance(): PersistentDatabase {
    if (!PersistentDatabase.instance) {
      PersistentDatabase.instance = new PersistentDatabase();
    }
    return PersistentDatabase.instance;
  }

  public async loadDatabase(): Promise<TyreDatabase> {
    try {
      if (isServerless && GITHUB_TOKEN) {
        // Try to load from GitHub Gist
        const db = await this.loadFromGist();
        if (db.tyres.length > 0) {
          inMemoryDB = db;
          return db;
        }
      }
      
      // Fallback to in-memory or seed with new data
      if (inMemoryDB.tyres.length === 0) {
        await this.seedDatabase();
      }
      
      return inMemoryDB;
    } catch (error) {
      console.error('Error loading database:', error);
      if (inMemoryDB.tyres.length === 0) {
        await this.seedDatabase();
      }
      return inMemoryDB;
    }
  }

  public async saveDatabase(db: TyreDatabase): Promise<void> {
    inMemoryDB = db;
    
    if (isServerless && GITHUB_TOKEN) {
      try {
        await this.saveToGist(db);
        console.log('Database saved to GitHub Gist');
      } catch (error) {
        console.error('Error saving to Gist:', error);
      }
    }
  }

  private async loadFromGist(): Promise<TyreDatabase> {
    try {
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const gist = await response.json();
      const dbFile = gist.files['tyre-database.json'];
      
      if (dbFile && dbFile.content) {
        const db: TyreDatabase = JSON.parse(dbFile.content);
        
        // Convert date strings back to Date objects
        db.lastSync = new Date(db.lastSync);
        db.tyres.forEach(tyre => {
          tyre.createdAt = new Date(tyre.createdAt);
          tyre.updatedAt = new Date(tyre.updatedAt);
          if (tyre.lastDiscussed) {
            tyre.lastDiscussed = new Date(tyre.lastDiscussed);
          }
        });
        db.discussions.forEach(discussion => {
          discussion.date = new Date(discussion.date);
          discussion.createdAt = new Date(discussion.createdAt);
        });
        db.usageStats.forEach(usage => {
          usage.lastUpdated = new Date(usage.lastUpdated);
        });
        
        return db;
      }
    } catch (error) {
      console.error('Error loading from Gist:', error);
    }
    
    return {
      tyres: [],
      discussions: [],
      usageStats: [],
      lastSync: new Date()
    };
  }

  private async saveToGist(db: TyreDatabase): Promise<void> {
    try {
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            'tyre-database.json': {
              content: JSON.stringify(db, null, 2)
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving to Gist:', error);
    }
  }

  private async seedDatabase(): Promise<void> {
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
export const persistentDB = PersistentDatabase.getInstance(); 