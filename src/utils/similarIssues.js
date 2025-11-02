/**
 * Find similar issues from the database
 */

import { supabase } from '../supabaseClient';
import { classifyTextCategory } from './aiClassification';

/**
 * Find similar issues based on text description
 */
export async function findSimilarIssues(text, limit = 5) {
  if (!text || text.length < 10) return [];
  
  try {
    // Classify the text to get category
    const classification = classifyTextCategory(text);
    const category = classification.category;
    
    // Extract keywords from text
    const keywords = extractKeywords(text);
    
    // Search for similar issues
    let query = supabase
      .from('issues')
      .select('id, title, description, ai_category, status, latitude, longitude, created_at, image_url')
      .limit(limit);
    
    // Filter by category if available
    if (category && category !== 'Other') {
      query = query.eq('ai_category', category);
    }
    
    const { data, error } = await query;
    
    if (error || !data) return [];
    
    // Score and sort by similarity
    const scored = data.map(issue => {
      const score = calculateSimilarity(text, issue.description || issue.title, keywords);
      return { ...issue, similarityScore: score };
    });
    
    // Sort by similarity score and return top results
    return scored
      .filter(item => item.similarityScore > 0.2) // Minimum similarity threshold
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Error finding similar issues:', error);
    return [];
  }
}

/**
 * Extract keywords from text
 */
function extractKeywords(text) {
  const lowerText = text.toLowerCase();
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
  
  return lowerText
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, 10); // Top 10 keywords
}

/**
 * Calculate similarity score between two texts
 */
function calculateSimilarity(text1, text2, keywords) {
  if (!text2) return 0;
  
  const lowerText1 = text1.toLowerCase();
  const lowerText2 = text2.toLowerCase();
  
  // Exact match bonus
  if (lowerText1.includes(lowerText2) || lowerText2.includes(lowerText1)) {
    return 1.0;
  }
  
  // Keyword matching
  let matches = 0;
  keywords.forEach(keyword => {
    if (lowerText2.includes(keyword)) {
      matches++;
    }
  });
  
  // Calculate score based on keyword matches
  const keywordScore = keywords.length > 0 ? matches / keywords.length : 0;
  
  // Word overlap score
  const words1 = new Set(lowerText1.split(/\s+/));
  const words2 = new Set(lowerText2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  const jaccardScore = union.size > 0 ? intersection.size / union.size : 0;
  
  // Combined score
  return (keywordScore * 0.6 + jaccardScore * 0.4);
}

/**
 * Find nearby issues based on coordinates
 */
export async function findNearbyIssues(lat, lng, radiusKm = 2, limit = 10) {
  try {
    // Get all issues and calculate distance
    // Note: For production, use PostGIS for efficient spatial queries
    const { data, error } = await supabase
      .from('issues')
      .select('id, title, description, ai_category, status, latitude, longitude, created_at, image_url')
      .limit(100); // Get more to filter by distance
    
    if (error || !data) return [];
    
    // Calculate distances and filter
    const nearby = data
      .map(issue => {
        if (!issue.latitude || !issue.longitude) return null;
        
        const distance = calculateDistance(lat, lng, issue.latitude, issue.longitude);
        return { ...issue, distance };
      })
      .filter(issue => issue !== null && issue.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
    
    return nearby;
  } catch (error) {
    console.error('Error finding nearby issues:', error);
    return [];
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

