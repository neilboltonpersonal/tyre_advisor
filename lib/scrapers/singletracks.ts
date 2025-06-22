import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { ScrapedTyreData } from '../../types/tyre';

const SINGLETRACKS_URL = 'https://www.singletracks.com/bike-gear/tires/';

export async function scrapeSingletracks(): Promise<ScrapedTyreData[]> {
  console.log(`Scraping singletracks.com from ${SINGLETRACKS_URL}...`);
  try {
    const response = await fetch(SINGLETRACKS_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const tyres: ScrapedTyreData[] = [];

    $('.product-item, .gear-item').each((_i, el) => {
      const productLink = $(el).find('.product-name a, .gear-name a');
      const model = productLink.text().trim();
      const url = productLink.attr('href') || '';
      
      // Extract brand from model name (usually first word)
      const brand = model.split(' ')[0] || 'Unknown';
      
      // Extract rating
      const ratingElement = $(el).find('.rating, .stars, .score');
      const ratingText = ratingElement.text().trim();
      const rating = ratingText ? parseFloat(ratingText.replace(/[^\d.]/g, '')) : undefined;
      
      const description = $(el).find('.product-description, .gear-description, p').text().trim();

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

      if (model && url) {
        tyres.push({
          model,
          brand,
          url: url.startsWith('http') ? url : `https://www.singletracks.com${url}`,
          description,
          rating,
          price: price || undefined,
          reviewCount,
          popularityScore,
          mentionsCount,
          communityRating: rating, // Use the same rating for now
          source: 'singletracks.com',
          scrapedAt: new Date(),
          type: 'Tire',
        });
      }
    });

    console.log(`Finished scraping singletracks.com. Found ${tyres.length} tyres.`);
    return tyres;

  } catch (error) {
    console.error('Error scraping singletracks.com:', error);
    return [];
  }
} 