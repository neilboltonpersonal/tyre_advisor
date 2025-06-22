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
} 