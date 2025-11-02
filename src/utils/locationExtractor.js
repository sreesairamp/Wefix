/**
 * Extract location information from text messages
 */

import axios from 'axios';

/**
 * Extract location mentions from text
 */
export function extractLocationFromText(text) {
  if (!text || typeof text !== 'string') return null;
  
  // Common location patterns
  const locationPatterns = [
    /(?:near|at|on|in|around|close to|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g, // "near Main Street"
    /([A-Z][a-z]+\s+(?:Street|Road|Avenue|Lane|Drive|Park|Square|Plaza|Circle|Boulevard|Highway))/gi, // Street names
    /([A-Z]{2,}\s+\d{4,6})/g, // Postal codes
    /(\d+\s+[A-Z][a-z]+\s+(?:Street|Road|Avenue|Lane|Drive))/gi, // Numbered addresses
  ];
  
  const locations = [];
  
  locationPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      locations.push(...matches.map(m => m.replace(/^(?:near|at|on|in|around|close to|by)\s+/i, '').trim()));
    }
  });
  
  return locations.length > 0 ? locations[0] : null;
}

/**
 * Geocode location text to coordinates using Nominatim
 */
export async function geocodeLocation(locationText) {
  if (!locationText) return null;
  
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationText)}&limit=1`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'WeFix Civic Platform'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name,
        address: result.address || {}
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  
  return null;
}

/**
 * Get user's current location from browser
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Extract and geocode location from message
 */
export async function extractLocationInfo(text) {
  const locationText = extractLocationFromText(text);
  
  if (!locationText) {
    // Try to get user's current location
    try {
      const currentLocation = await getCurrentLocation();
      return {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        source: 'browser',
        accuracy: currentLocation.accuracy
      };
    } catch (error) {
      return null;
    }
  }
  
  // Geocode the extracted location
  const geocoded = await geocodeLocation(locationText);
  
  if (geocoded) {
    return {
      lat: geocoded.lat,
      lng: geocoded.lng,
      source: 'text',
      locationText,
      displayName: geocoded.display_name,
      address: geocoded.address
    };
  }
  
  return null;
}

