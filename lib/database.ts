import fs from 'fs/promises';
import path from 'path';
import { 
  TyreDatabase, 
  TyreRecord, 
  DiscussionRecord, 
  UsageRecord,
  ScrapedTyreData,
  CommunityDiscussion 
} from '../types/tyre';

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'tyre-database.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(DB_FILE_PATH);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Initialize empty database
async function initializeDatabase(): Promise<TyreDatabase> {
  await ensureDataDirectory();
  
  const db: TyreDatabase = {
    tyres: [],
    discussions: [],
    usageStats: [],
    lastSync: new Date()
  };
  
  await saveDatabase(db);
  return db;
}

// Load database from file
export async function loadDatabase(): Promise<TyreDatabase> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(DB_FILE_PATH, 'utf-8');
    const db: TyreDatabase = JSON.parse(data);
    
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
  } catch (error) {
    console.log('Database not found, initializing new database...');
    return initializeDatabase();
  }
}

// Save database to file
async function saveDatabase(db: TyreDatabase): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(DB_FILE_PATH, JSON.stringify(db, null, 2));
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Add or update tyre record
export async function upsertTyre(scrapedData: ScrapedTyreData): Promise<TyreRecord> {
  const db = await loadDatabase();
  
  // Check if tyre already exists
  const existingTyre = db.tyres.find(t => 
    t.model.toLowerCase() === scrapedData.model.toLowerCase() && 
    t.brand.toLowerCase() === scrapedData.brand.toLowerCase()
  );
  
  if (existingTyre) {
    // Update existing record
    existingTyre.description = scrapedData.description || existingTyre.description;
    existingTyre.price = scrapedData.price || existingTyre.price;
    existingTyre.rating = scrapedData.rating || existingTyre.rating;
    existingTyre.reviewCount = scrapedData.reviewCount || existingTyre.reviewCount;
    existingTyre.popularityScore = scrapedData.popularityScore || existingTyre.popularityScore;
    existingTyre.mentionsCount = scrapedData.mentionsCount || existingTyre.mentionsCount;
    existingTyre.communityRating = scrapedData.communityRating || existingTyre.communityRating;
    existingTyre.lastDiscussed = scrapedData.lastDiscussed || existingTyre.lastDiscussed;
    existingTyre.updatedAt = new Date();
    
    // Add new source if not already present
    if (!existingTyre.sources.includes(scrapedData.source)) {
      existingTyre.sources.push(scrapedData.source);
    }
    if (!existingTyre.urls.includes(scrapedData.url)) {
      existingTyre.urls.push(scrapedData.url);
    }
    
    await saveDatabase(db);
    return existingTyre;
  } else {
    // Create new record
    const newTyre: TyreRecord = {
      id: generateId(),
      model: scrapedData.model,
      brand: scrapedData.brand,
      type: scrapedData.type,
      description: scrapedData.description,
      price: scrapedData.price,
      rating: scrapedData.rating,
      reviewCount: scrapedData.reviewCount || 0,
      popularityScore: scrapedData.popularityScore || 0,
      mentionsCount: scrapedData.mentionsCount || 0,
      communityRating: scrapedData.communityRating || 0,
      lastDiscussed: scrapedData.lastDiscussed,
      sources: [scrapedData.source],
      urls: [scrapedData.url],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    db.tyres.push(newTyre);
    await saveDatabase(db);
    return newTyre;
  }
}

// Add community discussion
export async function addDiscussion(discussion: CommunityDiscussion, tyreId: string): Promise<DiscussionRecord> {
  const db = await loadDatabase();
  
  const discussionRecord: DiscussionRecord = {
    id: generateId(),
    tyreId,
    title: discussion.title,
    content: discussion.content,
    author: discussion.author,
    date: discussion.date,
    source: discussion.source,
    url: discussion.url,
    replies: discussion.replies,
    views: discussion.views,
    sentiment: discussion.sentiment,
    tags: discussion.tags,
    createdAt: new Date()
  };
  
  db.discussions.push(discussionRecord);
  await saveDatabase(db);
  return discussionRecord;
}

// Update usage statistics
export async function updateUsageStats(
  tyreId: string, 
  location: string, 
  latitude: number, 
  longitude: number,
  mentions: number = 1,
  sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
): Promise<UsageRecord> {
  const db = await loadDatabase();
  
  // Find existing usage record for this tyre and location
  const existingUsage = db.usageStats.find(u => 
    u.tyreId === tyreId && u.location === location
  );
  
  if (existingUsage) {
    // Update existing record
    existingUsage.usageCount += 1;
    existingUsage.totalMentions += mentions;
    if (sentiment === 'positive') existingUsage.positiveMentions += mentions;
    if (sentiment === 'negative') existingUsage.negativeMentions += mentions;
    existingUsage.communityScore = calculateCommunityScore(existingUsage);
    existingUsage.trendingScore = calculateTrendingScore(existingUsage);
    existingUsage.lastUpdated = new Date();
    
    await saveDatabase(db);
    return existingUsage;
  } else {
    // Create new usage record
    const newUsage: UsageRecord = {
      id: generateId(),
      tyreId,
      location,
      latitude,
      longitude,
      usageCount: 1,
      totalMentions: mentions,
      positiveMentions: sentiment === 'positive' ? mentions : 0,
      negativeMentions: sentiment === 'negative' ? mentions : 0,
      communityScore: 0,
      trendingScore: 0,
      lastUpdated: new Date()
    };
    
    newUsage.communityScore = calculateCommunityScore(newUsage);
    newUsage.trendingScore = calculateTrendingScore(newUsage);
    
    db.usageStats.push(newUsage);
    await saveDatabase(db);
    return newUsage;
  }
}

// Calculate community score based on mentions and sentiment
function calculateCommunityScore(usage: UsageRecord): number {
  const positiveWeight = 1.0;
  const negativeWeight = -0.5;
  const neutralWeight = 0.1;
  
  const score = (
    usage.positiveMentions * positiveWeight +
    usage.negativeMentions * negativeWeight +
    (usage.totalMentions - usage.positiveMentions - usage.negativeMentions) * neutralWeight
  ) / Math.max(usage.totalMentions, 1);
  
  return Math.max(0, Math.min(10, score * 10)); // Normalize to 0-10
}

// Calculate trending score based on recent activity
function calculateTrendingScore(usage: UsageRecord): number {
  const daysSinceUpdate = (Date.now() - usage.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0, 1 - daysSinceUpdate / 30); // Decay over 30 days
  
  return usage.totalMentions * recencyFactor;
}

// Get popular tyres by location
export async function getPopularTyresByLocation(
  location: string, 
  limit: number = 10
): Promise<UsageRecord[]> {
  const db = await loadDatabase();
  
  return db.usageStats
    .filter(u => u.location === location)
    .sort((a, b) => b.communityScore - a.communityScore)
    .slice(0, limit);
}

// Get recent discussions for a tyre
export async function getRecentDiscussions(
  tyreId: string, 
  limit: number = 10
): Promise<DiscussionRecord[]> {
  const db = await loadDatabase();
  
  return db.discussions
    .filter(d => d.tyreId === tyreId)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

// Get tyre by ID
export async function getTyreById(tyreId: string): Promise<TyreRecord | null> {
  const db = await loadDatabase();
  return db.tyres.find(t => t.id === tyreId) || null;
}

// Search tyres by model or brand
export async function searchTyres(query: string): Promise<TyreRecord[]> {
  const db = await loadDatabase();
  const lowerQuery = query.toLowerCase();
  
  return db.tyres.filter(t => 
    t.model.toLowerCase().includes(lowerQuery) ||
    t.brand.toLowerCase().includes(lowerQuery)
  );
}

// Get database statistics
export async function getDatabaseStats(): Promise<{
  totalTyres: number;
  totalDiscussions: number;
  totalUsageRecords: number;
  lastSync: Date;
}> {
  const db = await loadDatabase();
  
  return {
    totalTyres: db.tyres.length,
    totalDiscussions: db.discussions.length,
    totalUsageRecords: db.usageStats.length,
    lastSync: db.lastSync
  };
} 