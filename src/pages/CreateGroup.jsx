import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { awardPoints, POINTS } from "../utils/pointsSystem";

export default function CreateGroupPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <p>Loading...</p>
      </div>
    );
  }

  async function handleCreateGroup(e) {
    e?.preventDefault();
    
    // Reset error
    setError("");

    // Validate user
    if (!user) {
      setError("You must be logged in to create a group");
      alert("You must be logged in to create a group");
      return;
    }

    // Validate group name
    if (!groupName.trim()) {
      setError("Group name is required");
      alert("Group name is required");
      return;
    }

    setLoading(true);

    try {
      // Create group - the creator becomes the leader
      const groupData = { 
        name: groupName.trim(), 
        description: description.trim() || null,
        created_by: user.id,
        leader_id: user.id, // Creator becomes the leader
        created_at: new Date().toISOString()
      };

      const { data: group, error: insertError } = await supabase
        .from("groups")
        .insert([groupData])
        .select()
        .single();

      if (insertError) {
        console.error("Create group error:", insertError);
        setError(insertError.message || "Failed to create group");
        alert(`Failed to create group: ${insertError.message || "Unknown error"}`);
        setLoading(false);
        return;
      }

      if (!group || !group.id) {
        setError("Group was created but we couldn't get the group ID");
        alert("Group was created but we couldn't navigate to it");
        setLoading(false);
        return;
      }

      // Award points for creating a group
      await awardPoints(user.id, POINTS.CREATE_GROUP, "Created a group");

      // Success - navigate to the group page
      setGroupName("");
      setDescription("");
      
      // Navigate to the new group page
      navigate(`/groups/${group.id}`);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(err.message || "An unexpected error occurred");
      alert(`An error occurred: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-8 shadow-2xl border border-purple-100">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Create a New Task Team
          </h1>
          <p className="text-gray-600">As the creator, you'll become the team leader and can manage all team activities</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 text-red-700 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleCreateGroup} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="e.g., Downtown Cleanup Crew"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              placeholder="Describe the purpose and goals of your task team..."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-blue-900 mb-1">Team Leader Benefits</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You'll automatically become the team leader</li>
                  <li>• Manage issue status updates for your team</li>
                  <li>• Create and manage fundraisers</li>
                  <li>• Receive donations for team projects</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] hover:shadow-xl"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Team...
              </span>
            ) : (
              "Create Task Team"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

