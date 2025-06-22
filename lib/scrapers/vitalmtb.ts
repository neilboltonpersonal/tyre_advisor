import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { ScrapedTyreData } from '../../types/tyre';

const VITAL_URL = 'https://www.vitalmtb.com/product/category/Tires';

export async function scrapeVitalMtb(): Promise<ScrapedTyreData[]> {
  console.log(`Scraping vitalmtb.com from ${VITAL_URL}...`);
  try {
    const response = await fetch(VITAL_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const tyres: ScrapedTyreData[] = [];

    $('.product-list-item').each((_i, el) => {
      const productLink = $(el).find('.p-product-name a');
      const model = productLink.text().trim();
      const url = productLink.attr('href') || '';
      
      const brand = $(el).find('.p-brand-name').text().trim();
      const ratingText = $(el).find('.review-stars').attr('title'); // "4.5 out of 5 stars"
      const rating = ratingText ? parseFloat(ratingText) : undefined;
      const description = $(el).find('.short-description').text().trim();

      // Enhanced data extraction
      const reviewCountText = $(el).find('.review-count, .reviews-count').text().trim();
      const reviewCount = reviewCountText ? parseInt(reviewCountText.replace(/\D/g, '')) : undefined;
      
      // Extract price if available
      const priceElement = $(el).find('.price, .msrp, .cost');
      const price = priceElement.text().trim();
      
      // Calculate popularity score based on rating and review count
      let popularityScore = 0;
      if (rating && reviewCount) {
        popularityScore = (rating * 2) + (Math.min(reviewCount / 10, 5)); // Max 10 points
      } else if (rating) {
        popularityScore = rating * 2; // Max 10 points
      }
      
      // Extract mentions count from description and title
      const fullText = (model + ' ' + description).toLowerCase();
      const mentionsCount = (fullText.match(/tyre|tire|wheel/g) || []).length;

      if (model && url && brand) {
        tyres.push({
          model,
          brand,
          url: `https://www.vitalmtb.com${url}`,
          description,
          rating,
          price: price || undefined,
          reviewCount,
          popularityScore,
          mentionsCount,
          communityRating: rating, // Use the same rating for now
          source: 'vitalmtb.com',
          scrapedAt: new Date(),
          type: 'Tire',
        });
      }
    });

    console.log(`Finished scraping vitalmtb.com. Found ${tyres.length} tyres.`);
    return tyres;

  } catch (error) {
    console.error('Error scraping vitalmtb.com:', error);
    return [];
  }
} 