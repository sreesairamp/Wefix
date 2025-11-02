import { supabase } from "../supabaseClient";

export async function createUserProfile(user) {
  if (!user) {
    console.error("No user provided to createUserProfile");
    return { success: false, error: "No user provided" };
  }

  try {
    // Check if profile exists
    const { data: existing, error: checkError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", user.id)
      .single();

    if (existing) {
      // Profile exists, but update if needed
      if (!existing.full_name && user.user_metadata?.full_name) {
        await supabase
          .from("profiles")
          .update({ full_name: user.user_metadata.full_name })
          .eq("id", user.id);
      }
      return { success: true, exists: true };
    }

    // Create new profile
    const { data, error } = await supabase.from("profiles").insert([
      {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "",
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
        points: 0, // Initialize points to 0
      },
    ]).select();

    if (error) {
      console.error("Error creating profile:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error creating profile:", error);
    return { success: false, error: error.message };
  }
}
