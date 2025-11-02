import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { awardPoints, POINTS } from "../utils/pointsSystem";

const redIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30],
});

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignedGroup, setAssignedGroup] = useState(null);
  const [isGroupCreator, setIsGroupCreator] = useState(false);

  // Fetch issue details
  useEffect(() => {
    if (id) {
      fetchIssueDetails();
      fetchComments();
      fetchVoteCount();
      checkUserVote();
    }
  }, [id, user]);

  const fetchIssueDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching issue:", error);
        alert("Issue not found");
        navigate("/issues");
        return;
      }

      setIssue(data);

      // If issue is assigned to a group, fetch group details and check if user is leader
      if (data.group_id && user) {
        const { data: groupData } = await supabase
          .from("groups")
          .select("id, name, leader_id")
          .eq("id", data.group_id)
          .single();

        if (groupData) {
          setAssignedGroup(groupData);
          setIsGroupCreator(groupData.leader_id === user.id);
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      // First try with profiles join
      let { data, error } = await supabase
        .from("issue_comments")
        .select("*, profiles(full_name, email)")
        .eq("issue_id", id)
        .order("created_at", { ascending: false });

      // If profiles join fails, try without it
      if (error) {
        console.warn("Error fetching with profiles, trying without:", error);
        const result = await supabase
          .from("issue_comments")
          .select("*")
          .eq("issue_id", id)
          .order("created_at", { ascending: false });

        if (result.error) {
          console.error("Error fetching comments:", result.error);
          alert("Failed to load comments. Please refresh the page.");
          return;
        }

        // Fetch profile data separately
        if (result.data && result.data.length > 0) {
          const userIds = [...new Set(result.data.map(c => c.user_id))];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);

          // Merge profile data
          data = result.data.map(comment => {
            const profile = profilesData?.find(p => p.id === comment.user_id);
            return {
              ...comment,
              profiles: profile || null
            };
          });
        } else {
          data = [];
        }
      }

      setComments(data || []);
    } catch (err) {
      console.error("Unexpected error fetching comments:", err);
      setComments([]);
    }
  };

  const fetchVoteCount = async () => {
    try {
      const { count, error } = await supabase
        .from("issue_votes")
        .select("*", { count: "exact", head: true })
        .eq("issue_id", id);

      if (!error) {
        setVoteCount(count || 0);
      }
    } catch (err) {
      console.error("Error fetching votes:", err);
    }
  };

  const checkUserVote = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("issue_votes")
        .select("id")
        .eq("issue_id", id)
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setHasVoted(true);
      }
    } catch (err) {
      // User hasn't voted
      setHasVoted(false);
    }
  };

  const handleVote = async () => {
    if (!user) {
      alert("Please log in to vote");
      return;
    }

    if (hasVoted) {
      // Remove vote
      try {
        const { error } = await supabase
          .from("issue_votes")
          .delete()
          .eq("issue_id", id)
          .eq("user_id", user.id);

        if (!error) {
          setHasVoted(false);
          setVoteCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error("Error removing vote:", err);
      }
    } else {
      // Add vote
      try {
        const { error } = await supabase
          .from("issue_votes")
          .insert([{ issue_id: id, user_id: user.id }]);

        if (!error) {
          setHasVoted(true);
          setVoteCount((prev) => prev + 1);
        } else {
          console.error("Error adding vote:", error);
          alert("Failed to vote");
        }
      } catch (err) {
        console.error("Error adding vote:", err);
        alert("Failed to vote");
      }
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Please log in to comment");
      return;
    }

    if (!newComment.trim()) {
      alert("Please enter a comment");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("issue_comments")
        .insert([
          {
            issue_id: id,
            user_id: user.id,
            comment_text: newComment.trim(),
          },
        ])
        .select();

      if (error) {
        console.error("Error adding comment:", error);
        alert(`Failed to add comment: ${error.message || "Unknown error"}`);
      } else {
        console.log("Comment added successfully:", data);
        setNewComment("");
        // Wait a moment then refresh comments
        setTimeout(() => {
          fetchComments();
        }, 100);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert(`Failed to add comment: ${err.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusReaction = async (newStatus) => {
    if (!user) {
      alert("Please log in to update status");
      return;
    }

    // Prevent changing from Resolved to anything else
    if (issue.status === "Resolved") {
      alert("Once an issue is resolved, its status cannot be changed back.");
      return;
    }

    // Only group leaders can update status (if issue is assigned to a group)
    if (issue.group_id) {
      if (!isGroupCreator) {
        alert("Only the group leader can update the status of this issue.");
        return;
      }
    } else {
      // If not assigned to a group, only the issue creator can update
      if (issue.user_id !== user.id) {
        alert("Only the issue creator can update the status.");
        return;
      }
    }

    try {
      const { error } = await supabase
        .from("issues")
        .update({ status: newStatus })
        .eq("id", id);

      if (!error) {
        setIssue((prev) => ({ ...prev, status: newStatus }));
        
        // Award points if issue is resolved (only if it wasn't already resolved)
        if (newStatus === "Resolved" && issue.status !== "Resolved") {
          // Award points to the group leader who resolved it
          const userIdToAward = issue.group_id ? (assignedGroup?.leader_id || user.id) : user.id;
          await awardPoints(userIdToAward, POINTS.RESOLVE_ISSUE, "Resolved an issue");
        }
        
        alert(`Status updated to ${newStatus}${newStatus === "Resolved" && issue.status !== "Resolved" ? ` - You earned ${POINTS.RESOLVE_ISSUE} points! 🎉` : ""}`);
      } else {
        console.error("Error updating status:", error);
        alert("Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>Loading issue details...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>Issue not found</p>
        <Link to="/issues" className="text-blue-600 underline">
          Back to Issues
        </Link>
      </div>
    );
  }

  const statusColors = {
    Open: "bg-red-100 text-red-700 border-red-300",
    "In-Progress": "bg-orange-100 text-orange-700 border-orange-300",
    Resolved: "bg-green-100 text-green-700 border-green-300",
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 pb-10">
      {/* Back Button */}
      <Link to="/issues" className="text-blue-600 hover:underline inline-block">
        ← Back to Issues
      </Link>

      {/* Issue Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-800">{issue.title}</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusColors[issue.status] || "bg-gray-100 text-gray-700"}`}
          >
            {issue.status}
          </span>
        </div>

        <p className="text-gray-700 text-lg mb-4">{issue.description}</p>

        {/* Vote Section */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleVote}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
              hasVoted
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <span>👍</span>
            <span>Vote</span>
            {voteCount > 0 && <span className="text-sm">({voteCount})</span>}
          </button>
          <span className="text-sm text-gray-600">
            {voteCount} {voteCount === 1 ? "vote" : "votes"}
          </span>
        </div>

        {/* Status Reaction Buttons */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Update Status:
            {issue.group_id && assignedGroup && (
              <span className="ml-2 text-xs">
                (Only {isGroupCreator ? "you (group leader)" : "group leader"} can update)
              </span>
            )}
          </p>
          <div className="flex gap-2 flex-wrap">
            {["Open", "In-Progress", "Resolved"].map((status) => {
              const isDisabled = issue.status === "Resolved" || 
                                (issue.group_id && !isGroupCreator) ||
                                (!issue.group_id && issue.user_id !== user?.id);
              
              return (
                <button
                  key={status}
                  onClick={() => handleStatusReaction(status)}
                  disabled={isDisabled}
                  className={`px-3 py-1 rounded text-sm border transition ${
                    issue.status === status
                      ? statusColors[status]
                      : isDisabled
                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
          {issue.status === "Resolved" && (
            <p className="text-xs text-gray-500 mt-2">
              ⚠️ This issue is resolved and cannot be changed back.
            </p>
          )}
        </div>

        {/* Image */}
        {issue.image_url && (
          <img
            src={issue.image_url}
            alt={issue.title}
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
        )}

        {/* Metadata */}
        <div className="text-sm text-gray-500">
          <p>Reported on: {new Date(issue.created_at).toLocaleString()}</p>
          <p>Location: {issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}</p>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-3">Location</h2>
        <div className="h-[300px] w-full rounded overflow-hidden border">
          <MapContainer
            center={[issue.latitude, issue.longitude]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[issue.latitude, issue.longitude]} icon={redIcon}>
              <Popup>
                <b>{issue.title}</b>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Comments ({comments.length})
        </h2>

        {/* Comment Form */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full border p-3 rounded mb-2"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </form>
        ) : (
          <p className="text-gray-600 mb-4">
            <Link to="/login" className="text-blue-600 underline">
              Log in
            </Link>{" "}
            to add a comment
          </p>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => {
              const userName = comment.profiles?.full_name 
                || comment.profiles?.email 
                || "Anonymous";
              
              return (
                <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-800">
                      {userName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.comment_text}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

