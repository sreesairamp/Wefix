import { supabase } from '../supabaseClient';

/**
 * Check if user profile is complete
 */
export async function isProfileComplete(userId) {
  if (!userId) return false;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', userId)
      .single();
    
    if (error || !data) return false;
    
    // Check if required fields are filled
    return !!(data.full_name && data.full_name.trim().length > 0);
  } catch (error) {
    console.error('Error checking profile:', error);
    return false;
  }
}

/**
 * Get profile completion status
 */
export async function getProfileStatus(userId) {
  if (!userId) return { complete: false, missing: ['profile'] };
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, username, bio, location')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      return { complete: false, missing: ['profile'] };
    }
    
    const missing = [];
    if (!data.full_name || data.full_name.trim().length === 0) {
      missing.push('full_name');
    }
    
    return {
      complete: missing.length === 0,
      missing,
      data
    };
  } catch (error) {
    console.error('Error getting profile status:', error);
    return { complete: false, missing: ['profile'] };
  }
}

