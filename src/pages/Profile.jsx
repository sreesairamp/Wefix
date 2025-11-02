import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const showCompletionPrompt = searchParams.get("complete") === "true";
  const [profile, setProfile] = useState({ 
    full_name: "", 
    email: "", 
    avatar_url: "", 
    bio: "", 
    phone: "", 
    location: "",
    username: "",
    gender: ""
  });
  const [stats, setStats] = useState({
    issuesCount: 0,
    votesCount: 0,
    commentsCount: 0,
    groupsCount: 0
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load profile + stats
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        // Load profile
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();

        if (data) {
          setProfile({
            full_name: data.full_name ?? "",
            email: data.email ?? user.email,
            avatar_url: data.avatar_url ?? "",
            bio: data.bio ?? "",
            phone: data.phone ?? "",
            location: data.location ?? "",
            username: data.username ?? "",
            gender: data.gender ?? ""
          });
        } else {
          // If no profile row exists, create one
          await supabase.from("profiles").insert({
            id: user.id,
            email: user.email
          });
        }

        // Load stats
        const [issuesResult, votesResult, commentsResult, groupsResult] = await Promise.all([
          supabase.from("issues").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("issue_votes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("issue_comments").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("groups").select("*", { count: "exact", head: true }).eq("created_by", user.id)
        ]);

        setStats({
          issuesCount: issuesResult.count ?? 0,
          votesCount: votesResult.count ?? 0,
          commentsCount: commentsResult.count ?? 0,
          groupsCount: groupsResult.count ?? 0
        });

        // Load recent issues
        const { data: issues } = await supabase
          .from("issues")
          .select("id, title, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        setRecentIssues(issues || []);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Upload Avatar
  const uploadAvatar = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update DB
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);

      if (dbErr) throw dbErr;

      // Update UI instantly
      setProfile(prev => ({ ...prev, avatar_url: urlData.publicUrl }));

      alert("Profile Picture Updated ✅");
    } catch (err) {
      alert("Upload failed ❌");
    } finally {
      setUploading(false);
    }
  };

  // Save Profile
  const saveProfile = async () => {
    if (!user) return;

    // Validate required fields
    if (!profile.full_name || profile.full_name.trim().length === 0) {
      alert("Please enter your full name. This is required to use all features.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          username: profile.username,
          bio: profile.bio,
          phone: profile.phone,
          location: profile.location,
          gender: profile.gender
        })
        .eq("id", user.id);

      if (error) {
        console.error("Save error:", error);
        alert("Save failed ❌");
        return;
      }

      alert("Profile Saved ✅");
      
      // If this was a completion prompt, redirect to home
      if (showCompletionPrompt) {
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Save failed ❌");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  const statusColors = {
    Open: "bg-red-100 text-red-700",
    "In-Progress": "bg-orange-100 text-orange-700",
    Resolved: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen p-6 space-y-6 max-w-6xl mx-auto">
      {showCompletionPrompt && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
              <p className="text-gray-700 mb-4">
                To use all features like reporting issues and creating groups, please complete your profile by filling in at least your <strong>Full Name</strong>.
              </p>
              {!profile.full_name && (
                <p className="text-red-600 font-semibold">⚠️ Full Name is required</p>
              )}
            </div>
          </div>
        </div>
      )}
      <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <img
                src={
                  profile.avatar_url ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-purple-200"
              />
              <label className="cursor-pointer text-blue-600 text-sm hover:text-blue-700 font-medium">
                {uploading ? "Uploading..." : "📷 Change Photo"}
                <input type="file" className="hidden" onChange={uploadAvatar} accept="image/*" disabled={uploading} />
              </label>
            </div>

            {/* Username */}
            <div>
              <label className="text-gray-600 text-sm font-medium">Username</label>
              <input
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                placeholder="Enter username"
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">This will be your unique identifier</p>
            </div>

            {/* Full Name */}
            <div>
              <label className="text-gray-600 text-sm font-medium">Full Name</label>
              <input
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-gray-600 text-sm font-medium">Email</label>
              <input
                value={profile.email}
                disabled
                className="w-full border p-2 rounded mt-1 bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Gender */}
            <div>
              <label className="text-gray-600 text-sm font-medium">Gender</label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="text-gray-600 text-sm font-medium">Phone (Optional)</label>
              <input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="Enter phone number"
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-gray-600 text-sm font-medium">Location (Optional)</label>
              <input
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="Enter your location"
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="text-gray-600 text-sm font-medium">Bio (Optional)</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={3}
                className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              {saving ? "Saving..." : "💾 Save Changes"}
            </button>
          </div>
        </div>

        {/* Right Column - Stats and Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.issuesCount}</div>
              <div className="text-sm text-gray-600 mt-1">Issues</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.votesCount}</div>
              <div className="text-sm text-gray-600 mt-1">Votes</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md text-center">
              <div className="text-2xl font-bold text-green-600">{stats.commentsCount}</div>
              <div className="text-sm text-gray-600 mt-1">Comments</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.groupsCount}</div>
              <div className="text-sm text-gray-600 mt-1">Groups</div>
            </div>
          </div>

          {/* Recent Issues */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Issues</h2>
            {recentIssues.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No issues reported yet.</p>
                <Link to="/report" className="text-purple-600 hover:underline mt-2 inline-block">
                  Report your first issue →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentIssues.map((issue) => (
                  <Link
                    key={issue.id}
                    to={`/issues/${issue.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 hover:shadow-sm transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{issue.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(issue.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[issue.status] || "bg-gray-100 text-gray-700"}`}>
                        {issue.status}
                      </span>
                    </div>
                  </Link>
                ))}
                <Link
                  to="/issues"
                  className="block text-center text-purple-600 hover:underline mt-4 text-sm font-medium"
                >
                  View All Issues →
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/report"
                className="p-4 border-2 border-purple-200 rounded-lg text-center hover:bg-purple-50 hover:border-purple-400 transition"
              >
                <div className="text-2xl mb-2">📝</div>
                <div className="font-medium text-gray-800">Report Issue</div>
              </Link>
              <Link
                to="/groups/create"
                className="p-4 border-2 border-blue-200 rounded-lg text-center hover:bg-blue-50 hover:border-blue-400 transition"
              >
                <div className="text-2xl mb-2">👥</div>
                <div className="font-medium text-gray-800">Create Group</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
