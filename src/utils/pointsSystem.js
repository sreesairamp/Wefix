import { supabase } from "../supabaseClient";

/**
 * Award points to a user
 * @param {string} userId - User ID
 * @param {number} points - Points to award (can be negative)
 * @param {string} reason - Reason for points (for logging)
 */
export async function awardPoints(userId, points, reason = "") {
  if (!userId || !points) return;

  try {
    // Get current points
    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", userId)
      .single();

    const currentPoints = profile?.points || 0;
    const newPoints = Math.max(0, currentPoints + points); // Ensure points don't go negative

    // Update points
    const { error } = await supabase
      .from("profiles")
      .update({ points: newPoints })
      .eq("id", userId);

    if (error) {
      console.error("Error awarding points:", error);
      return false;
    }

    console.log(`Awarded ${points} points to user ${userId}. Reason: ${reason}`);
    return true;
  } catch (err) {
    console.error("Unexpected error awarding points:", err);
    return false;
  }
}

/**
 * Points configuration
 */
export const POINTS = {
  CREATE_GROUP: 25,
  JOIN_GROUP: 10,
  RESOLVE_ISSUE: 50,
  REPORT_ISSUE: 5, // Bonus for reporting
};

