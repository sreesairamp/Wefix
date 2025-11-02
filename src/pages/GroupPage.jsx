import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { awardPoints, POINTS } from "../utils/pointsSystem";
import CreateFundraiser from "../components/CreateFundraiser";
import FundraiserCard from "../components/FundraiserCard";

export default function GroupPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fundraisers, setFundraisers] = useState([]);
  const [showCreateFundraiser, setShowCreateFundraiser] = useState(false);

  // Fetch group details
  const fetchGroupDetails = useCallback(async () => {
    if (!id) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from("groups")
        .select("id, name, description, created_by, leader_id")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Error fetching group:", fetchError);
        setError("Group not found");
        setGroup(null);
      } else {
        setGroup(data);
        setError("");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An error occurred while fetching the group");
      setLoading(false);
    }
  }, [id]);

  // Fetch group members
  const fetchMembers = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("group_members")
        .select("user_id, profiles(full_name, username, email)")
        .eq("group_id", id);

      if (!error && data) {
        setMembers(data || []);
        // Check if current user is a member (only if user is logged in)
        if (user) {
          const userIsMember = data.some((m) => m.user_id === user.id);
          setIsMember(userIsMember);
        }
      }
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  // Join group
  const joinGroup = async () => {
    if (!user) {
      alert("Please log in to join a group");
      return;
    }

    if (isMember) {
      alert("You are already a member of this group");
      return;
    }

    try {
      const { error } = await supabase.from("group_members").insert([
        { group_id: id, user_id: user.id },
      ]);

      if (error) {
        console.error("Error joining group:", error);
        alert("Failed to join group");
        return;
      }

      // Award points for joining
      await awardPoints(user.id, POINTS.JOIN_GROUP, "Joined a group");

      // Refresh members list
      fetchMembers();
      alert(`You joined the group! You earned ${POINTS.JOIN_GROUP} points! 🎉`);
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Failed to join group");
    }
  };

  // Leave group
  const leaveGroup = async () => {
    if (!user) {
      alert("Please log in to leave a group");
      return;
    }

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error leaving group:", error);
        alert("Failed to leave group");
        return;
      }

      // Refresh members list
      fetchMembers();
      alert("You left the group");
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Failed to leave group");
    }
  };

  // Delete group (only if leader)
  const deleteGroup = async () => {
    if (!user || !group || group.leader_id !== user.id) {
      alert("Only the group leader can delete this group");
      return;
    }

    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("groups")
        .delete()
        .eq("id", id)
        .eq("leader_id", user.id);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        alert("Failed to delete group");
      } else {
        alert("Group deleted successfully");
        navigate("/groups");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An error occurred while deleting the group");
    }
  };

  useEffect(() => {
    if (id) {
      fetchGroupDetails();
      fetchMembers();
      fetchFundraisers();
    }
  }, [id, fetchGroupDetails, fetchMembers]);

  const fetchFundraisers = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("fundraisers")
        .select("*")
        .eq("group_id", id)
        .order("created_at", { ascending: false });

      if (!error) {
        setFundraisers(data || []);
      }
    } catch (err) {
      console.error("Error fetching fundraisers:", err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || "Group not found"}
        </div>
        <button
          onClick={() => navigate("/groups")}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  const isLeader = user && group?.leader_id === user.id;

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto p-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-8 shadow-2xl border border-purple-100">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-gray-600 text-lg mb-4 leading-relaxed">{group.description}</p>
            )}
            {isLeader && (
              <span className="inline-flex items-center gap-2 text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                You are the Team Leader
              </span>
            )}
          </div>
          {isLeader && (
            <button
              onClick={deleteGroup}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg transition-all hover:scale-105 font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Team
            </button>
          )}
        </div>
      </div>

      {/* Join/Leave Button */}
      {user && !isLeader && (
        <div className="bg-gradient-to-br from-white to-purple-50/30 p-6 rounded-2xl shadow-xl border border-purple-100">
          {!isMember ? (
            <button
              onClick={joinGroup}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Join Task Team (+{POINTS.JOIN_GROUP} points)
            </button>
          ) : (
            <button
              onClick={leaveGroup}
              className="w-full px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Leave Task Team
            </button>
          )}
        </div>
      )}

      {/* Members List */}
      <div className="bg-gradient-to-br from-white to-purple-50/30 p-6 rounded-2xl shadow-xl border border-purple-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full border border-purple-200">
            <span className="text-sm text-gray-600 font-medium">Total: </span>
            <span className="text-lg font-bold text-purple-600">{members.length}</span>
          </div>
        </div>
        {members.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">No members yet. Be the first to join!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {members.map((member) => {
              const name = member.profiles?.username || 
                          member.profiles?.full_name || 
                          member.profiles?.email || 
                          "Anonymous";
              const isCreator = member.user_id === group?.leader_id;
              return (
                <div
                  key={member.user_id}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-lg transition-all bg-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{name}</div>
                      {isCreator && (
                        <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded-full mt-1 font-semibold">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Leader
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fundraising Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Fundraising Campaigns</h2>
          {isLeader && (
            <button
              onClick={() => setShowCreateFundraiser(!showCreateFundraiser)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 text-sm font-semibold shadow-md transition-transform hover:scale-105"
            >
              {showCreateFundraiser ? "Cancel" : "+ Create Fundraiser"}
            </button>
          )}
        </div>

        {showCreateFundraiser && (
          <div className="mb-6">
            <CreateFundraiser
              groupId={id}
              onSuccess={() => {
                setShowCreateFundraiser(false);
                fetchFundraisers();
              }}
              onCancel={() => setShowCreateFundraiser(false)}
            />
          </div>
        )}

        {fundraisers.length === 0 ? (
          <p className="text-gray-500">No active fundraisers. Create one to start raising funds!</p>
        ) : (
          <div className="space-y-4">
            {fundraisers.map((fundraiser) => (
              <FundraiserCard
                key={fundraiser.id}
                fundraiser={fundraiser}
                groupLeaderId={group?.leader_id}
                onDonateSuccess={() => fetchFundraisers()}
              />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Group Information</h2>
        <div className="space-y-2 text-gray-700">
          <p><strong>Group ID:</strong> {group.id}</p>
          <p><strong>Created by:</strong> {group.created_by}</p>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate("/groups")}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Back to Groups
        </button>
      </div>
    </div>
  );
}

