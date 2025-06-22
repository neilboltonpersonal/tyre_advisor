import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { ScrapedTyreData } from '../../types/tyre';

const BIKERADAR_URL = 'https://www.bikeradar.com/reviews/components/tyres';

export async function scrapeBikeRadar(): Promise<ScrapedTyreData[]> {
  console.log(`Scraping bikeradar.com from ${BIKERADAR_URL}...`);
  try {
    const response = await fetch(BIKERADAR_URL);
    const body = await response.text();
    const $ = cheerio.load(body);
    const tyres: ScrapedTyreData[] = [];

    $('.template-article-listing .card-details').each((_i, el) => {
      const productLink = $(el).find('a.card-title-link');
      const model = productLink.text().trim().replace(' review', '');
      const url = productLink.attr('href') || '';
      
      const brand = model.split(' ')[0] || 'Unknown'; // Bikeradar often puts brand in the title
      
      const ratingText = $(el).find('.review-rating-average').text().trim(); // "4.5"
      const rating = ratingText ? parseFloat(ratingText) : undefined;
      
      const description = $(el).find('p.card-description').text().trim();

      if (model && url) {
        tyres.push({
          model,
          brand,
          url, // Bikeradar uses full URLs in href
          description,
          rating,
          source: 'bikeradar.com',
          scrapedAt: new Date(),
          type: 'Tire',
        });
      }
    });

    console.log(`Finished scraping bikeradar.com. Found ${tyres.length} tyres.`);
    return tyres;

  } catch (error) {
    console.error('Error scraping bikeradar.com:', error);
    return [];
  }
} 