import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { ScrapedTyreData } from '../../types/tyre';

const MTBR_URL = 'https://www.mtbr.com/reviews/tyres';

export async function scrapeMTBR(): Promise<ScrapedTyreData[]> {
  console.log(`Scraping mtbr.com from ${MTBR_URL}...`);
  try {
    const response = await fetch(MTBR_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    
    console.log(`MTBR response status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`MTBR responded with status: ${response.status}`);
      return [];
    }
    
    const body = await response.text();
    console.log(`MTBR response body length: ${body.length} characters`);
    
    const $ = cheerio.load(body);
    const tyres: ScrapedTyreData[] = [];

    // Try multiple selectors to find tyre reviews
    const selectors = [
      '.review-item',
      '.product-review', 
      '.review',
      'article',
      '.product',
      '.item'
    ];
    
    let foundElements = 0;
    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`Found ${elements.length} elements with selector: ${selector}`);
      foundElements += elements.length;
      
      elements.each((_i, el) => {
        const titleElement = $(el).find('.review-title, h3 a, .product-name, h2, h3, .title, .name');
        const model = titleElement.text().trim();
        const url = titleElement.attr('href') || '';
        
        if (!model) return; // Skip if no model name found
        
        // Extract brand from model name (usually first word)
        const brand = model.split(' ')[0] || 'Unknown';
        
        // Extract rating
        const ratingElement = $(el).find('.rating, .stars, .score, .review-score');
        const ratingText = ratingElement.text().trim();
        const rating = ratingText ? parseFloat(ratingText.replace(/[^\d.]/g, '')) : undefined;
        
        const description = $(el).find('.review-summary, .description, p, .summary').text().trim();

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
            url: url.startsWith('http') ? url : `https://www.mtbr.com${url}`,
            description,
            rating,
            price: price || undefined,
            reviewCount,
            popularityScore,
            mentionsCount,
            communityRating: rating, // Use the same rating for now
            source: 'mtbr.com',
            scrapedAt: new Date(),
            type: 'Tire',
          });
        }
      });
    }

    console.log(`Finished scraping mtbr.com. Found ${tyres.length} tyres from ${foundElements} total elements.`);
    return tyres;

  } catch (error) {
    console.error('Error scraping mtbr.com:', error);
    return [];
  }
} 