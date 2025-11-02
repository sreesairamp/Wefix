import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";

export default function CreateFundraiser({ groupId, onSuccess, onCancel }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [issueId, setIssueId] = useState("");
  const [availableIssues, setAvailableIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);

  const fetchAvailableIssues = useCallback(async () => {
    if (!groupId) return;
    setLoadingIssues(true);
    try {
      const { data } = await supabase
        .from("issues")
        .select("id, title, status")
        .eq("group_id", groupId)
        .in("status", ["Open", "In-Progress"]);

      setAvailableIssues(data || []);
    } catch (err) {
      console.error("Error fetching issues:", err);
    } finally {
      setLoadingIssues(false);
    }
  }, [groupId]);

  // Fetch available issues for this group
  useEffect(() => {
    fetchAvailableIssues();
  }, [fetchAvailableIssues]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !targetAmount) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("fundraisers")
        .insert([
          {
            group_id: groupId,
            created_by: user.id,
            title: title.trim(),
            description: description.trim() || null,
            target_amount: parseFloat(targetAmount),
            current_amount: 0,
            issue_id: issueId || null,
            status: "active",
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating fundraiser:", error);
        alert("Failed to create fundraiser");
      } else {
        alert("Fundraiser created successfully!");
        onSuccess();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Failed to create fundraiser");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Create Fundraiser</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fundraiser Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Repair Community Park Bench"
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what the funds will be used for..."
            rows={3}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Amount ($) *
          </label>
          <input
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="1000"
            min="1"
            step="0.01"
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Related Issue (Optional)
          </label>
          {loadingIssues ? (
            <p className="text-sm text-gray-500">Loading issues...</p>
          ) : (
            <select
              value={issueId}
              onChange={(e) => setIssueId(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">No specific issue</option>
              {availableIssues.map((issue) => (
                <option key={issue.id} value={issue.id}>
                  {issue.title} ({issue.status})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Fundraiser"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

