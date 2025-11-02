import { supabase } from "../supabaseClient";

export async function createUserProfile(user) {
  if (!user) return;

  // Check if profile exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existing) return; // already exists

  await supabase.from("profiles").insert([
    {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || "",
      avatar_url: user.user_metadata?.avatar_url || "",
      points: 0, // Initialize points to 0
    },
  ]);
}
