"use server";

import { TyreRecommendation, UserPreferences, ScrapedTyreData } from '../types/tyre';
import { getTyreRecommendations as getRecs } from './tyre-advisor';

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