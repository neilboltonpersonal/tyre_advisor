import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedTyreData } from '../../types/tyre';

export async function scrapePinkbike(): Promise<ScrapedTyreData[]> {
  const tyres: ScrapedTyreData[] = [];
  
  try {
    // Scrape tyre reviews and discussions from Pinkbike
    const urls = [
      'https://www.pinkbike.com/buysell/list/?category=2&region=3&w=169&keywords=tyre',
      'https://www.pinkbike.com/buysell/list/?category=2&region=3&w=169&keywords=tire'
    ];

    for (const url of urls) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        });

        const $ = cheerio.load(response.data);
        
        // Extract tyre listings
        $('.buysell-item').each((index, element) => {
          const title = $(element).find('.buysell-item-title').text().trim();
          const description = $(element).find('.buysell-item-description').text().trim();
          const price = $(element).find('.buysell-item-price').text().trim();
          
          if (title.toLowerCase().includes('tyre') || title.toLowerCase().includes('tire')) {
            const tyreData = parseTyreFromTitle(title, description, price);
            if (tyreData) {
              tyres.push({
                ...tyreData,
                source: 'Pinkbike',
                url: url,
                scrapedAt: new Date()
              });
            }
          }
        });

        // Also look for tyre reviews in the reviews section
        const reviewsUrl = 'https://www.pinkbike.com/reviews/';
        const reviewsResponse = await axios.get(reviewsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        });

        const $reviews = cheerio.load(reviewsResponse.data);
        
        $reviews('.review-item').each((index, element) => {
          const title = $reviews(element).find('.review-title').text().trim();
          const content = $reviews(element).find('.review-content').text().trim();
          
          if (title.toLowerCase().includes('tyre') || title.toLowerCase().includes('tire')) {
            const tyreData = parseTyreFromReview(title, content);
            if (tyreData) {
              tyres.push({
                ...tyreData,
                source: 'Pinkbike Reviews',
                url: reviewsUrl,
                scrapedAt: new Date()
              });
            }
          }
        });

      } catch (error) {
        console.error(`Error scraping Pinkbike URL ${url}:`, error);
      }
    }

    console.log(`Scraped ${tyres.length} tyre entries from Pinkbike`);
    return tyres;

  } catch (error) {
    console.error('Error scraping Pinkbike:', error);
    return [];
  }
}

function parseTyreFromTitle(title: string, description: string, price: string): Partial<ScrapedTyreData> | null {
  // Common tyre brands and models
  const brands = ['Maxxis', 'Continental', 'Schwalbe', 'Michelin', 'Hutchinson', 'Vittoria', 'Pirelli', 'Specialized', 'Bontrager', 'WTB'];
  const models = ['Minion', 'High Roller', 'Ardent', 'Crossmark', 'Trail King', 'Mountain King', 'Nobby Nic', 'Rocket Ron', 'Racing Ralph', 'Wild Enduro'];
  
  let brand = '';
  let model = '';
  
  // Extract brand
  for (const b of brands) {
    if (title.includes(b)) {
      brand = b;
      break;
    }
  }
  
  // Extract model
  for (const m of models) {
    if (title.includes(m)) {
      model = m;
      break;
    }
  }
  
  if (!brand || !model) {
    return null;
  }
  
  return {
    model: `${brand} ${model}`,
    brand,
    type: determineTyreType(title, description),
    description: description || title,
    price: price || undefined
  };
}

function parseTyreFromReview(title: string, content: string): Partial<ScrapedTyreData> | null {
  // Similar parsing logic for reviews
  return parseTyreFromTitle(title, content, '');
}

function determineTyreType(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();
  
  if (text.includes('downhill') || text.includes('dh')) return 'Downhill';
  if (text.includes('enduro')) return 'Enduro';
  if (text.includes('trail')) return 'Trail';
  if (text.includes('cross country') || text.includes('xc')) return 'Cross Country';
  if (text.includes('all mountain') || text.includes('am')) return 'All Mountain';
  if (text.includes('gravel')) return 'Gravel';
  if (text.includes('road')) return 'Road';
  
  return 'Trail'; // Default
} 