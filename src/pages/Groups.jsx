import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [groupCounts, setGroupCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("id, name, description, created_by, leader_id")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching groups:", error);
        setGroups([]);
      } else {
        setGroups(data || []);
        // Fetch member counts for each group
        if (data && data.length > 0) {
          fetchMemberCounts(data.map(g => g.id));
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMemberCounts(groupIds) {
    try {
      const { data } = await supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", groupIds);

      const counts = {};
      data?.forEach(member => {
        counts[member.group_id] = (counts[member.group_id] || 0) + 1;
      });
      setGroupCounts(counts);
    } catch (err) {
      console.error("Error fetching member counts:", err);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading groups...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-brand to-brand-accent bg-clip-text text-transparent">
          Community Groups
        </h1>
        <p className="text-gray-600 text-lg">Join task teams and collaborate to solve neighbourhood issues together</p>
      </div>

      {/* Create Button */}
      <div className="mb-8">
        <Link
          to="/groups/create"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand to-brand-accent text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:from-brand-dark hover:to-brand transition-all duration-200 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Group
        </Link>
      </div>

      {/* Groups Count Badge */}
      <div className="mb-6 flex items-center gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 px-4 py-2 rounded-lg border border-purple-200">
          <span className="text-sm text-gray-600">Total Groups: </span>
          <span className="text-lg font-bold text-purple-600">{groups.length}</span>
        </div>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-12 shadow-xl border border-purple-100 text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg mb-4">No groups created yet.</p>
          <p className="text-gray-500">Be the first to create one and start making a difference!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-6 shadow-xl border border-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{group.name}</h3>
                  <p className="text-gray-600 mb-3">{group.description || "No description provided"}</p>
                  {(group.created_by === user?.id || group.leader_id === user?.id) && (
                    <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-brand to-brand-accent text-white px-3 py-1 rounded-full font-semibold">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Your Group
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    <span className="font-bold text-purple-600">{groupCounts[group.id] || 0}</span> Members
                  </span>
                </div>
              </div>

              <Link
                to={`/groups/${group.id}`}
                className="w-full bg-gradient-to-r from-brand to-brand-accent text-white px-4 py-3 rounded-xl font-semibold hover:from-brand-dark hover:to-brand transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                View Group
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

