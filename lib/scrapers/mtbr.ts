import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { ScrapedTyreData } from '../../types/tyre';

const MTBR_URL = 'https://www.mtbr.com/product/tires-and-wheels/tire.html';

export async function scrapeMtbr(): Promise<ScrapedTyreData[]> {
  console.log(`Scraping mtbr.com from ${MTBR_URL}...`);
  try {
    const response = await fetch(MTBR_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const tyres: ScrapedTyreData[] = [];

    $('.product-listing-row').each((_i, el) => {
      const productLink = $(el).find('.product-listing-name a');
      const model = productLink.text().trim();
      const url = productLink.attr('href') || '';
      
      const brandText = $(el).find('.product-listing-brand').text().trim();
      // Brand is often part of the model name, let's try to extract it
      const brand = brandText || model.split(' ')[0] || 'Unknown Brand';

      const ratingText = $(el).find('.product-listing-rating-score').text().trim();
      const rating = ratingText ? parseFloat(ratingText) : undefined;
      
      const reviewsText = $(el).find('.product-listing-reviews').text().trim();
      const reviewCount = reviewsText ? parseInt(reviewsText.replace(' reviews', ''), 10) : 0;
      
      // MTBR doesn't list descriptions on the main page, so we'd need to visit each product URL for that.
      // For now, we will leave it blank.
      const description = `A popular tyre with ${reviewCount} reviews on MTBR.`;

      if (model && url) {
        tyres.push({
          model,
          brand,
          url: `https://www.mtbr.com${url}`,
          description,
          rating,
          source: 'mtbr.com',
          scrapedAt: new Date(),
          type: 'Tire', // MTBR doesn't specify type on this page
        });
      }
    });

    console.log(`Finished scraping mtbr.com. Found ${tyres.length} tyres.`);
    return tyres;

  } catch (error) {
    console.error('Error scraping mtbr.com:', error);
    return []; // Return empty array on error
  }
} 