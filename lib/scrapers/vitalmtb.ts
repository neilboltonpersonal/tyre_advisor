import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { ScrapedTyreData } from '../../types/tyre';

const VITAL_URL = 'https://www.vitalmtb.com/product/category/Tires';

export async function scrapeVitalMtb(): Promise<ScrapedTyreData[]> {
  console.log(`Scraping vitalmtb.com from ${VITAL_URL}...`);
  try {
    const response = await fetch(VITAL_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    
    console.log(`VitalMTB response status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`VitalMTB responded with status: ${response.status}`);
      return [];
    }
    
    const body = await response.text();
    console.log(`VitalMTB response body length: ${body.length} characters`);
    
    const $ = cheerio.load(body);
    const tyres: ScrapedTyreData[] = [];

    // Try multiple selectors to find tyre products
    const selectors = [
      '.product-list-item',
      '.product-item',
      '.product',
      '.item',
      'article',
      '.review-item'
    ];
    
    let foundElements = 0;
    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`Found ${elements.length} elements with selector: ${selector}`);
      foundElements += elements.length;
      
      elements.each((_i, el) => {
        const productLink = $(el).find('.p-product-name a, .product-name a, h3 a, h2 a, .title a');
        const model = productLink.text().trim();
        const url = productLink.attr('href') || '';
        
        if (!model) return; // Skip if no model name found
        
        const brand = $(el).find('.p-brand-name, .brand-name, .brand').text().trim() || model.split(' ')[0];
        const ratingText = $(el).find('.review-stars, .rating, .stars').attr('title') || $(el).find('.review-stars, .rating, .stars').text().trim();
        const rating = ratingText ? parseFloat(ratingText.replace(/[^\d.]/g, '')) : undefined;
        const description = $(el).find('.short-description, .description, p, .summary').text().trim();

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
            url: url.startsWith('http') ? url : `https://www.vitalmtb.com${url}`,
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
    }

    console.log(`Finished scraping vitalmtb.com. Found ${tyres.length} tyres from ${foundElements} total elements.`);
    return tyres;

  } catch (error) {
    console.error('Error scraping vitalmtb.com:', error);
    return [];
  }
} 