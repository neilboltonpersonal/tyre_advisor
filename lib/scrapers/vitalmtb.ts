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

      if (model && url && brand) {
        tyres.push({
          model,
          brand,
          url: `https://www.vitalmtb.com${url}`,
          description,
          rating,
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