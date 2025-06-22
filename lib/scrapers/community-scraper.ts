import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { CommunityDiscussion } from '../../types/tyre';

// Community sites to scrape for tyre discussions
const COMMUNITY_SITES = [
  {
    name: 'Pinkbike Forums',
    baseUrl: 'https://www.pinkbike.com',
    searchUrl: 'https://www.pinkbike.com/search/?q=',
    selectors: {
      threads: '.forum-thread',
      title: '.thread-title a',
      author: '.thread-author',
      date: '.thread-date',
      replies: '.thread-replies',
      views: '.thread-views',
      content: '.thread-preview'
    }
  },
  {
    name: 'MTBR Forums',
    baseUrl: 'https://www.mtbr.com',
    searchUrl: 'https://www.mtbr.com/search/?q=',
    selectors: {
      threads: '.forum-thread',
      title: '.thread-title a',
      author: '.thread-author',
      date: '.thread-date',
      replies: '.thread-replies',
      views: '.thread-views',
      content: '.thread-preview'
    }
  },
  {
    name: 'Reddit r/MTB',
    baseUrl: 'https://www.reddit.com',
    searchUrl: 'https://www.reddit.com/r/MTB/search/?q=',
    selectors: {
      threads: '[data-testid="post-container"]',
      title: 'h3 a',
      author: '[data-testid="post_author_link"]',
      date: 'time',
      replies: '[data-testid="comment-count"]',
      views: '.score',
      content: '.selftext'
    }
  }
];

// Sentiment analysis keywords
const POSITIVE_KEYWORDS = [
  'great', 'excellent', 'amazing', 'love', 'best', 'perfect', 'awesome', 'fantastic',
  'outstanding', 'superb', 'brilliant', 'incredible', 'wonderful', 'terrific'
];

const NEGATIVE_KEYWORDS = [
  'terrible', 'awful', 'horrible', 'worst', 'hate', 'bad', 'poor', 'disappointing',
  'useless', 'broken', 'defective', 'faulty', 'problem', 'issue'
];

// Analyze sentiment of text
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lowerText = text.toLowerCase();
  const positiveCount = POSITIVE_KEYWORDS.filter(word => lowerText.includes(word)).length;
  const negativeCount = NEGATIVE_KEYWORDS.filter(word => lowerText.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Extract tags from text
function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Common mountain biking terms
  const bikingTerms = [
    'trail', 'enduro', 'downhill', 'xc', 'cross country', 'all mountain',
    'dirt jump', 'freeride', 'technical', 'flow', 'singletrack', 'bike park'
  ];
  
  bikingTerms.forEach(term => {
    if (lowerText.includes(term)) {
      tags.push(term);
    }
  });
  
  return tags;
}

// Scrape discussions from a specific site
async function scrapeSiteDiscussions(
  site: typeof COMMUNITY_SITES[0],
  tyreModel: string,
  tyreBrand: string
): Promise<CommunityDiscussion[]> {
  const discussions: CommunityDiscussion[] = [];
  const searchQuery = `${tyreBrand} ${tyreModel}`;
  
  try {
    console.log(`Searching ${site.name} for discussions about ${searchQuery}...`);
    
    const response = await fetch(`${site.searchUrl}${encodeURIComponent(searchQuery)}`);
    const body = await response.text();
    const $ = cheerio.load(body);
    
    $(site.selectors.threads).each((_i, el) => {
      try {
        const titleElement = $(el).find(site.selectors.title);
        const title = titleElement.text().trim();
        const url = titleElement.attr('href');
        
        if (!title || !url) return;
        
        const author = $(el).find(site.selectors.author).text().trim() || 'Anonymous';
        const dateText = $(el).find(site.selectors.date).text().trim();
        const repliesText = $(el).find(site.selectors.replies).text().trim();
        const viewsText = $(el).find(site.selectors.views).text().trim();
        const content = $(el).find(site.selectors.content).text().trim();
        
        // Parse date (simplified - in production you'd want more robust parsing)
        const date = new Date();
        if (dateText.includes('ago')) {
          // Handle relative dates like "2 days ago"
          const agoMatch = dateText.match(/(\d+)\s+(day|hour|minute)s?\s+ago/);
          if (agoMatch) {
            const amount = parseInt(agoMatch[1]);
            const unit = agoMatch[2];
            if (unit === 'day') date.setDate(date.getDate() - amount);
            else if (unit === 'hour') date.setHours(date.getHours() - amount);
            else if (unit === 'minute') date.setMinutes(date.getMinutes() - amount);
          }
        }
        
        const replies = parseInt(repliesText.replace(/\D/g, '')) || 0;
        const views = parseInt(viewsText.replace(/\D/g, '')) || 0;
        const sentiment = analyzeSentiment(title + ' ' + content);
        const tags = extractTags(title + ' ' + content);
        
        const discussion: CommunityDiscussion = {
          id: `${site.name}-${Date.now()}-${Math.random()}`,
          title,
          content: content || 'No content available',
          author,
          date,
          source: site.name,
          url: url.startsWith('http') ? url : `${site.baseUrl}${url}`,
          replies,
          views,
          sentiment,
          tags
        };
        
        discussions.push(discussion);
      } catch (error) {
        console.error(`Error parsing discussion from ${site.name}:`, error);
      }
    });
    
    console.log(`Found ${discussions.length} discussions on ${site.name}`);
    return discussions;
    
  } catch (error) {
    console.error(`Error scraping ${site.name}:`, error);
    return [];
  }
}

// Main function to scrape community discussions for a tyre
export async function scrapeCommunityDiscussions(
  tyreModel: string,
  tyreBrand: string
): Promise<CommunityDiscussion[]> {
  console.log(`Scraping community discussions for ${tyreBrand} ${tyreModel}...`);
  
  const allDiscussions: CommunityDiscussion[] = [];
  
  // Scrape from all community sites
  for (const site of COMMUNITY_SITES) {
    try {
      const discussions = await scrapeSiteDiscussions(site, tyreModel, tyreBrand);
      allDiscussions.push(...discussions);
      
      // Add delay to be respectful to servers
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to scrape ${site.name}:`, error);
    }
  }
  
  // Sort by date (most recent first)
  allDiscussions.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  console.log(`Total community discussions found: ${allDiscussions.length}`);
  return allDiscussions;
}

// Scrape discussions for multiple tyres
export async function scrapeMultipleTyreDiscussions(
  tyres: Array<{ model: string; brand: string }>
): Promise<Map<string, CommunityDiscussion[]>> {
  const results = new Map<string, CommunityDiscussion[]>();
  
  for (const tyre of tyres) {
    const key = `${tyre.brand}-${tyre.model}`;
    const discussions = await scrapeCommunityDiscussions(tyre.model, tyre.brand);
    results.set(key, discussions);
    
    // Add delay between tyres
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
} 