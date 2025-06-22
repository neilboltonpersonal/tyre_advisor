import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedTyreData } from '../../types/tyre';

const SINGLETRACKS_URL = 'https://www.singletracks.com/mtb-gear/category/tires/';

export async function scrapeSingletracks(): Promise<ScrapedTyreData[]> {
  console.log(`Scraping singletracks.com from ${SINGLETRACKS_URL}...`);
  try {
    const { data } = await axios.get(SINGLETRACKS_URL);
    const $ = cheerio.load(data);
    const tyres: ScrapedTyreData[] = [];

    $('article.post-type-st_gear').each((_i, el) => {
      const productLink = $(el).find('h2.entry-title a');
      const model = productLink.text().trim();
      const url = productLink.attr('href') || '';
      
      // Brand is not easily available on the list page, will need to infer it or get from product page
      const brand = model.split(' ')[0] || 'Unknown';
      
      const ratingText = $(el).find('.rating-score').text().trim(); // "4.5"
      const rating = ratingText ? parseFloat(ratingText) : undefined;
      
      const description = $(el).find('.entry-content p').text().trim();

      if (model && url) {
        tyres.push({
          model,
          brand,
          url,
          description,
          rating,
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