import { TyreRecommendation, UserPreferences, ScrapedTyreData } from '../types/tyre';

export async function analyzeWithAI(
  userPreferences: UserPreferences,
  scrapedData: ScrapedTyreData[],
  refinementQuestion?: string,
  currentRecommendations?: TyreRecommendation[]
): Promise<TyreRecommendation[]> {
  
  // For now, we'll use a rule-based system since we don't have OpenAI API key
  // In production, this would use OpenAI's API for more sophisticated analysis
  
  let recommendations: TyreRecommendation[] = [];
  
  if (currentRecommendations && refinementQuestion) {
    // Refine existing recommendations based on the question
    recommendations = refineRecommendations(currentRecommendations, refinementQuestion, userPreferences);
  } else {
    // Generate initial recommendations
    recommendations = generateInitialRecommendations(userPreferences, scrapedData);
  }
  
  // Sort by relevance score
  recommendations.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  
  // Return top 10 recommendations instead of 5
  return recommendations.slice(0, 10);
}

function generateInitialRecommendations(
  preferences: UserPreferences,
  scrapedData: ScrapedTyreData[]
): TyreRecommendation[] {
  const recommendations: TyreRecommendation[] = [];
  
  // If we have scraped data, use it
  if (scrapedData.length > 0) {
    const relevantTyres = filterRelevantTyres(scrapedData, preferences);
    
    for (const tyre of relevantTyres.slice(0, 20)) {
      const recommendation = convertToRecommendation(tyre, preferences);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }
  }
  
  // If we don't have enough recommendations, add fallback options
  if (recommendations.length < 10) {
    const fallbackOptions = getFallbackRecommendations(preferences);
    recommendations.push(...fallbackOptions);
  }
  
  return recommendations;
}

function filterRelevantTyres(
  scrapedData: ScrapedTyreData[],
  preferences: UserPreferences
): ScrapedTyreData[] {
  return scrapedData.filter(tyre => {
    // Filter by riding style
    if (preferences.ridingStyle && !isStyleMatch(tyre.type, preferences.ridingStyle)) {
      return false;
    }
    
    // Filter by terrain
    if (preferences.terrain && !isTerrainMatch(tyre.description, preferences.terrain)) {
      return false;
    }
    
    // Filter by weather conditions
    if (preferences.weatherConditions && !isWeatherMatch(tyre.description, preferences.weatherConditions)) {
      return false;
    }
    
    return true;
  });
}

function isStyleMatch(tyreType: string, userStyle: string): boolean {
  const styleMap: { [key: string]: string[] } = {
    'Cross Country (XC)': ['Cross Country', 'XC'],
    'Trail': ['Trail', 'All Mountain'],
    'Enduro': ['Enduro', 'Trail'],
    'Downhill': ['Downhill', 'DH'],
    'All Mountain': ['All Mountain', 'Trail', 'Enduro'],
    'Gravel': ['Gravel'],
    'Road': ['Road'],
    'Urban/Commuting': ['Road', 'Gravel']
  };
  
  const userStyles = styleMap[userStyle] || [];
  return userStyles.some(style => tyreType.includes(style));
}

function isTerrainMatch(description: string, terrain: string): boolean {
  const terrainMap: { [key: string]: string[] } = {
    'Smooth trails': ['smooth', 'flow', 'fast'],
    'Rocky trails': ['rocky', 'technical', 'rough'],
    'Muddy trails': ['mud', 'wet', 'slippery'],
    'Loose gravel': ['loose', 'gravel', 'sandy'],
    'Hardpack': ['hardpack', 'hard', 'packed'],
    'Mixed terrain': ['mixed', 'varied', 'all-around'],
    'Pavement': ['pavement', 'road', 'urban'],
    'Technical trails': ['technical', 'challenging', 'difficult']
  };
  
  const terrainKeywords = terrainMap[terrain] || [];
  return terrainKeywords.some(keyword => description.toLowerCase().includes(keyword));
}

function isWeatherMatch(description: string, weather: string): boolean {
  const weatherMap: { [key: string]: string[] } = {
    'Dry conditions': ['dry', 'summer', 'hardpack'],
    'Wet conditions': ['wet', 'mud', 'rain', 'slippery'],
    'Mixed conditions': ['mixed', 'all-weather', 'versatile'],
    'All weather': ['all-weather', 'versatile', 'mixed'],
    'Mostly dry': ['dry', 'summer', 'hardpack'],
    'Mostly wet': ['wet', 'mud', 'rain', 'slippery']
  };
  
  const weatherKeywords = weatherMap[weather] || [];
  return weatherKeywords.some(keyword => description.toLowerCase().includes(keyword));
}

function convertToRecommendation(
  tyre: ScrapedTyreData,
  preferences: UserPreferences
): TyreRecommendation | null {
  if (!tyre.model || !tyre.brand) {
    return null;
  }
  
  const pros = generatePros(tyre, preferences);
  const cons = generateCons(tyre, preferences);
  const bestFor = determineBestFor(tyre, preferences);
  const priceRange = estimatePriceRange(tyre);
  
  return {
    model: tyre.model,
    brand: tyre.brand,
    type: tyre.type,
    bestFor,
    priceRange,
    rating: tyre.rating || 4.0,
    description: tyre.description,
    pros,
    cons,
    source: tyre.source,
    url: tyre.url
  };
}

function generatePros(tyre: ScrapedTyreData, preferences: UserPreferences): string[] {
  const pros: string[] = [];
  
  if (tyre.description.toLowerCase().includes('grip') || tyre.description.toLowerCase().includes('traction')) {
    pros.push('Excellent grip and traction');
  }
  
  if (tyre.description.toLowerCase().includes('durable') || tyre.description.toLowerCase().includes('long-lasting')) {
    pros.push('Durable and long-lasting');
  }
  
  if (tyre.description.toLowerCase().includes('lightweight') || tyre.description.toLowerCase().includes('light')) {
    pros.push('Lightweight');
  }
  
  if (tyre.description.toLowerCase().includes('fast') || tyre.description.toLowerCase().includes('rolling')) {
    pros.push('Fast rolling');
  }
  
  if (tyre.description.toLowerCase().includes('puncture') || tyre.description.toLowerCase().includes('flat')) {
    pros.push('Puncture resistant');
  }
  
  return pros.length > 0 ? pros : ['Good all-around performance'];
}

function generateCons(tyre: ScrapedTyreData, preferences: UserPreferences): string[] {
  const cons: string[] = [];
  
  if (tyre.description.toLowerCase().includes('heavy') || tyre.description.toLowerCase().includes('weight')) {
    cons.push('Heavy');
  }
  
  if (tyre.description.toLowerCase().includes('slow') || tyre.description.toLowerCase().includes('rolling resistance')) {
    cons.push('Slow rolling');
  }
  
  if (tyre.description.toLowerCase().includes('expensive') || tyre.description.toLowerCase().includes('pricey')) {
    cons.push('Expensive');
  }
  
  if (tyre.description.toLowerCase().includes('noisy') || tyre.description.toLowerCase().includes('loud')) {
    cons.push('Noisy on pavement');
  }
  
  return cons.length > 0 ? cons : ['May not excel in all conditions'];
}

function determineBestFor(tyre: ScrapedTyreData, preferences: UserPreferences): string {
  if (tyre.type.includes('Downhill')) return 'Aggressive downhill and enduro riding';
  if (tyre.type.includes('Enduro')) return 'Enduro and aggressive trail riding';
  if (tyre.type.includes('Trail')) return 'Versatile trail riding';
  if (tyre.type.includes('Cross Country')) return 'Fast cross country and light trail riding';
  if (tyre.type.includes('All Mountain')) return 'All-around mountain biking';
  if (tyre.type.includes('Gravel')) return 'Gravel and mixed surface riding';
  if (tyre.type.includes('Road')) return 'Road and urban riding';
  
  return 'General mountain biking';
}

function estimatePriceRange(tyre: ScrapedTyreData): string {
  if (tyre.price) {
    return tyre.price;
  }
  
  // Estimate based on brand and type
  if (tyre.brand === 'Maxxis' || tyre.brand === 'Continental') {
    return '£47-63';
  }
  if (tyre.brand === 'Schwalbe' || tyre.brand === 'Michelin') {
    return '£40-55';
  }
  if (tyre.brand === 'Specialized' || tyre.brand === 'Bontrager') {
    return '£32-47';
  }
  
  return '£36-51';
}

function refineRecommendations(
  currentRecommendations: TyreRecommendation[],
  question: string,
  preferences: UserPreferences
): TyreRecommendation[] {
  const questionLower = question.toLowerCase();
  
  // Simple refinement logic based on keywords in the question
  if (questionLower.includes('wet') || questionLower.includes('mud')) {
    return currentRecommendations.filter(rec => 
      rec.pros.some(pro => pro.toLowerCase().includes('grip') || pro.toLowerCase().includes('traction'))
    );
  }
  
  if (questionLower.includes('durability') || questionLower.includes('long-lasting')) {
    return currentRecommendations.filter(rec => 
      rec.pros.some(pro => pro.toLowerCase().includes('durable') || pro.toLowerCase().includes('long-lasting'))
    );
  }
  
  if (questionLower.includes('speed') || questionLower.includes('fast')) {
    return currentRecommendations.filter(rec => 
      rec.pros.some(pro => pro.toLowerCase().includes('fast') || pro.toLowerCase().includes('rolling'))
    );
  }
  
  if (questionLower.includes('weight') || questionLower.includes('light')) {
    return currentRecommendations.filter(rec => 
      rec.pros.some(pro => pro.toLowerCase().includes('lightweight'))
    );
  }
  
  if (questionLower.includes('price') || questionLower.includes('cost') || questionLower.includes('budget')) {
    return currentRecommendations.sort((a, b) => {
      const priceA = parseFloat(a.priceRange.replace(/[^0-9]/g, ''));
      const priceB = parseFloat(b.priceRange.replace(/[^0-9]/g, ''));
      return priceA - priceB;
    });
  }
  
  // If no specific refinement, return original recommendations
  return currentRecommendations;
}

function getFallbackRecommendations(preferences: UserPreferences): TyreRecommendation[] {
  const fallbackTyres: TyreRecommendation[] = [
    {
      model: 'Maxxis Minion DHF',
      brand: 'Maxxis',
      type: 'Downhill/Trail',
      bestFor: 'Aggressive trail and enduro riding',
      priceRange: '£47-63',
      rating: 4.8,
      description: 'Excellent grip and durability for aggressive riding',
      pros: ['Excellent grip', 'Durable', 'Good in wet conditions'],
      cons: ['Heavy', 'Slow rolling'],
      source: 'Pinkbike Reviews'
    },
    {
      model: 'Continental Trail King',
      brand: 'Continental',
      type: 'Trail/All Mountain',
      bestFor: 'Versatile trail riding',
      priceRange: '£40-55',
      rating: 4.5,
      description: 'Balanced performance for mixed terrain',
      pros: ['Good all-around performance', 'Lightweight', 'Fast rolling'],
      cons: ['Less grip in extreme conditions'],
      source: 'Singletrackworld Reviews'
    },
    {
      model: 'Schwalbe Nobby Nic',
      brand: 'Schwalbe',
      type: 'Cross Country/Trail',
      bestFor: 'Fast trail and XC riding',
      priceRange: '£36-51',
      rating: 4.3,
      description: 'Fast rolling with good grip for XC and light trail use',
      pros: ['Fast rolling', 'Lightweight', 'Good for XC'],
      cons: ['Less durable', 'Limited grip in technical terrain'],
      source: 'Pinkbike Reviews'
    },
    {
      model: 'Michelin Wild Enduro',
      brand: 'Michelin',
      type: 'Enduro/Downhill',
      bestFor: 'Aggressive enduro and downhill riding',
      priceRange: '£55-71',
      rating: 4.7,
      description: 'Aggressive enduro tyre with excellent grip in all conditions',
      pros: ['Excellent grip', 'Very durable', 'All-weather performance'],
      cons: ['Heavy', 'Expensive', 'Slow rolling'],
      source: 'Singletrackworld Reviews'
    },
    {
      model: 'WTB Trail Boss',
      brand: 'WTB',
      type: 'Trail',
      bestFor: 'Versatile trail riding',
      priceRange: '£32-47',
      rating: 4.2,
      description: 'Versatile trail tyre with good all-around performance',
      pros: ['Affordable', 'Good all-around performance', 'Reliable'],
      cons: ['Not exceptional in any area', 'Limited grip in extreme conditions'],
      source: 'Pinkbike Reviews'
    },
    {
      model: 'Vittoria Mazza',
      brand: 'Vittoria',
      type: 'Enduro/Trail',
      bestFor: 'Aggressive enduro and trail riding',
      priceRange: '£51-67',
      rating: 4.6,
      description: 'Aggressive enduro tyre with excellent grip and durability',
      pros: ['Excellent grip', 'Durable', 'Great for technical terrain'],
      cons: ['Heavy', 'Expensive'],
      source: 'Pinkbike Reviews'
    },
    {
      model: 'Pirelli Scorpion XC',
      brand: 'Pirelli',
      type: 'Cross Country',
      bestFor: 'Fast cross country and racing',
      priceRange: '£40-55',
      rating: 4.2,
      description: 'Fast rolling XC tyre with good grip for racing',
      pros: ['Fast rolling', 'Lightweight', 'Good for racing'],
      cons: ['Less durable', 'Limited grip in technical terrain'],
      source: 'Singletrackworld Reviews'
    },
    {
      model: 'Maxxis High Roller II',
      brand: 'Maxxis',
      type: 'Trail/Enduro',
      bestFor: 'Versatile trail and enduro riding',
      priceRange: '£43-59',
      rating: 4.5,
      description: 'Versatile trail tyre with excellent grip and good rolling speed',
      pros: ['Excellent grip', 'Good rolling speed', 'Versatile'],
      cons: ['Can be noisy on pavement'],
      source: 'Pinkbike Reviews'
    },
    {
      model: 'Schwalbe Magic Mary',
      brand: 'Schwalbe',
      type: 'Downhill/Enduro',
      bestFor: 'Aggressive downhill and enduro riding',
      priceRange: '£55-71',
      rating: 4.7,
      description: 'Aggressive downhill tyre with exceptional grip in all conditions',
      pros: ['Exceptional grip', 'All-weather performance', 'Very durable'],
      cons: ['Heavy', 'Expensive', 'Slow rolling'],
      source: 'Singletrackworld Reviews'
    },
    {
      model: 'Hutchinson Toro',
      brand: 'Hutchinson',
      type: 'Trail/All Mountain',
      bestFor: 'Versatile all-mountain riding',
      priceRange: '£40-55',
      rating: 4.3,
      description: 'Versatile all-mountain tyre with good grip and rolling speed',
      pros: ['Good all-around performance', 'Tubeless ready', 'Versatile'],
      cons: ['Not exceptional in any area'],
      source: 'Pinkbike Reviews'
    }
  ];

  return fallbackTyres;
} 