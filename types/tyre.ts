export interface TyreRecommendation {
  model: string;
  brand: string;
  type: string;
  bestFor: string;
  priceRange: string;
  rating: number;
  description: string;
  pros: string[];
  cons: string[];
  source: string;
  url?: string;
}

export interface UserPreferences {
  ridingStyle: string;
  terrain: string;
  weatherConditions: string;
  skillLevel: string;
  budget: string;
  bikeType: string;
  wheelSize: string;
  weight: string;
  ridingFrequency: string;
  performancePriority: string;
  suspensionType: string;
  suspensionTravel: string;
  additionalNotes: string;
}

export interface ScrapedTyreData {
  model: string;
  brand: string;
  type: string;
  description: string;
  price?: string;
  rating?: number;
  reviews?: string[];
  source: string;
  url: string;
  scrapedAt: Date;
  reviewCount?: number;
  popularityScore?: number;
  mentionsCount?: number;
  communityRating?: number;
  lastDiscussed?: Date;
  discussionThreads?: CommunityDiscussion[];
}

export interface CommunityDiscussion {
  id: string;
  title: string;
  content: string;
  author: string;
  date: Date;
  source: string;
  url: string;
  replies: number;
  views: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  tags: string[];
}

export interface TyreUsageData {
  tyreId: string;
  model: string;
  brand: string;
  location: string;
  usageCount: number;
  latitude: number;
  longitude: number;
  lastUpdated: Date;
  totalMentions: number;
  positiveMentions: number;
  negativeMentions: number;
  communityScore: number;
  trendingScore: number;
}

export interface UserComment {
  id: string;
  username: string;
  tyreModel: string;
  tyreBrand: string;
  comment: string;
  rating: number;
  location: string;
  date: string;
  ridingStyle: string;
  terrain: string;
  source: string;
}

export interface TyreDatabase {
  tyres: TyreRecord[];
  discussions: DiscussionRecord[];
  usageStats: UsageRecord[];
  lastSync: Date;
}

export interface TyreRecord {
  id: string;
  model: string;
  brand: string;
  type: string;
  description: string;
  price?: string;
  rating?: number;
  reviewCount: number;
  popularityScore: number;
  mentionsCount: number;
  communityRating: number;
  lastDiscussed?: Date;
  sources: string[];
  urls: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscussionRecord {
  id: string;
  tyreId: string;
  title: string;
  content: string;
  author: string;
  date: Date;
  source: string;
  url: string;
  replies: number;
  views: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  tags: string[];
  createdAt: Date;
}

export interface UsageRecord {
  id: string;
  tyreId: string;
  location: string;
  latitude: number;
  longitude: number;
  usageCount: number;
  totalMentions: number;
  positiveMentions: number;
  negativeMentions: number;
  communityScore: number;
  trendingScore: number;
  lastUpdated: Date;
} 