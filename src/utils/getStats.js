import { supabase } from "../supabaseClient";

export async function getPlatformStats() {
  try {
    // Fetch counts in parallel
    const [issuesResult, groupsResult, usersResult, donationsResult] = await Promise.all([
      supabase.from("issues").select("id", { count: "exact", head: true }),
      supabase.from("groups").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("donations").select("amount").eq("payment_status", "completed"),
    ]);

    const resolvedIssues = await supabase
      .from("issues")
      .select("id", { count: "exact", head: true })
      .eq("status", "Resolved");

    const activeFundraisers = await supabase
      .from("fundraisers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    const totalDonations = donationsResult.data?.reduce((sum, donation) => sum + (donation.amount || 0), 0) || 0;

    return {
      totalIssues: issuesResult.count || 0,
      resolvedIssues: resolvedIssues.count || 0,
      totalGroups: groupsResult.count || 0,
      totalUsers: usersResult.count || 0,
      activeFundraisers: activeFundraisers.count || 0,
      totalDonations: totalDonations,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      totalIssues: 0,
      resolvedIssues: 0,
      totalGroups: 0,
      totalUsers: 0,
      activeFundraisers: 0,
      totalDonations: 0,
    };
  }
}

