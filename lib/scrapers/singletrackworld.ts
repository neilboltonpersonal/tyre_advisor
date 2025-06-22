import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedTyreData } from '../../types/tyre';

export async function scrapeSingletrackworld(): Promise<ScrapedTyreData[]> {
  const tyres: ScrapedTyreData[] = [];
  
  try {
    // Scrape tyre reviews and discussions from Singletrackworld
    const urls = [
      'https://singletrackworld.com/forum/topic/tyres/',
      'https://singletrackworld.com/reviews/',
      'https://singletrackworld.com/forum/topic/tires/'
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
        
        // Extract forum posts about tyres
        $('.forum-post, .review-item').each((index: number, element: any) => {
          const title = $(element).find('.post-title, .review-title').text().trim();
          const content = $(element).find('.post-content, .review-content').text().trim();
          const author = $(element).find('.post-author, .review-author').text().trim();
          
          if (title.toLowerCase().includes('tyre') || title.toLowerCase().includes('tire') || 
              content.toLowerCase().includes('tyre') || content.toLowerCase().includes('tire')) {
            const tyreData = parseTyreFromContent(title, content, author);
            if (tyreData) {
              tyres.push({
                ...tyreData,
                source: 'Singletrackworld',
                url: url,
                scrapedAt: new Date()
              });
            }
          }
        });

        // Look for specific tyre review pages
        const tyreReviewUrls = [
          'https://singletrackworld.com/reviews/tyres/',
          'https://singletrackworld.com/reviews/components/tyres/'
        ];

        for (const reviewUrl of tyreReviewUrls) {
          try {
            const reviewResponse = await axios.get(reviewUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              },
              timeout: 10000
            });

            const $reviews = cheerio.load(reviewResponse.data);
            
            $reviews('.review-item, .product-review').each((index: number, element: any) => {
              const title = $reviews(element).find('.review-title, .product-title').text().trim();
              const content = $reviews(element).find('.review-content, .product-description').text().trim();
              const rating = $reviews(element).find('.rating, .stars').text().trim();
              
              const tyreData = parseTyreFromReview(title, content, rating);
              if (tyreData) {
                tyres.push({
                  ...tyreData,
                  source: 'Singletrackworld Reviews',
                  url: reviewUrl,
                  scrapedAt: new Date()
                });
              }
            });
          } catch (error) {
            console.error(`Error scraping Singletrackworld review URL ${reviewUrl}:`, error);
          }
        }

      } catch (error) {
        console.error(`Error scraping Singletrackworld URL ${url}:`, error);
      }
    }

    console.log(`Scraped ${tyres.length} tyre entries from Singletrackworld`);
    return tyres;

  } catch (error) {
    console.error('Error scraping Singletrackworld:', error);
    return [];
  }
}

function parseTyreFromContent(title: string, content: string, author: string): Partial<ScrapedTyreData> | null {
  // Common tyre brands and models
  const brands = ['Maxxis', 'Continental', 'Schwalbe', 'Michelin', 'Hutchinson', 'Vittoria', 'Pirelli', 'Specialized', 'Bontrager', 'WTB', 'Panaracer', 'IRC'];
  const models = ['Minion', 'High Roller', 'Ardent', 'Crossmark', 'Trail King', 'Mountain King', 'Nobby Nic', 'Rocket Ron', 'Racing Ralph', 'Wild Enduro', 'DHR', 'Aggressor'];
  
  let brand = '';
  let model = '';
  
  // Extract brand
  for (const b of brands) {
    if (title.includes(b) || content.includes(b)) {
      brand = b;
      break;
    }
  }
  
  // Extract model
  for (const m of models) {
    if (title.includes(m) || content.includes(m)) {
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
    type: determineTyreType(title, content),
    description: content || title,
    reviews: [author ? `Review by ${author}` : 'Community review']
  };
}

function parseTyreFromReview(title: string, content: string, rating: string): Partial<ScrapedTyreData> | null {
  const tyreData = parseTyreFromContent(title, content, '');
  
  if (tyreData) {
    // Parse rating if available
    const ratingMatch = rating.match(/(\d+(?:\.\d+)?)/);
    if (ratingMatch) {
      tyreData.rating = parseFloat(ratingMatch[1]);
    }
  }
  
  return tyreData;
}

function determineTyreType(title: string, content: string): string {
  const text = (title + ' ' + content).toLowerCase();
  
  if (text.includes('downhill') || text.includes('dh')) return 'Downhill';
  if (text.includes('enduro')) return 'Enduro';
  if (text.includes('trail')) return 'Trail';
  if (text.includes('cross country') || text.includes('xc')) return 'Cross Country';
  if (text.includes('all mountain') || text.includes('am')) return 'All Mountain';
  if (text.includes('gravel')) return 'Gravel';
  if (text.includes('road')) return 'Road';
  if (text.includes('plus') || text.includes('fat')) return 'Plus/Fat';
  
  return 'Trail'; // Default
} 