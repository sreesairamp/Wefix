import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all"); // "all", "month", "week"

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFilter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles, ordered by points descending (including 0 points)
      // Use a larger limit and fetch in batches if needed
      let allData = [];
      let currentPage = 0;
      const pageSize = 1000; // Fetch up to 1000 users per page
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, full_name, email, points, avatar_url")
          .order("points", { ascending: false, nullsLast: true })
          .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

        if (error) {
          console.error("Error fetching leaderboard:", error);
          setLeaderboard([]);
          return;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          currentPage++;
          // If we got less than pageSize, we've reached the end
          if (data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      // Ensure data is sorted by points (descending)
      const sortedData = (allData || []).sort((a, b) => {
        const pointsA = a.points || 0;
        const pointsB = b.points || 0;
        return pointsB - pointsA;
      });
      setLeaderboard(sortedData);
      
      // Find current user's rank
      if (user) {
        const rank = sortedData.findIndex((p) => p.id === user.id) + 1;
        const userData = sortedData.find((p) => p.id === user.id);
        if (userData) {
          setUserRank({
            rank: rank || sortedData.length + 1,
            ...userData,
          });
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) {
      return (
        <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.9 1.603-.9 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.9-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    if (rank === 2) {
      return (
        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    if (rank === 3) {
      return (
        <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return <span className="text-gray-600 font-bold">#{rank}</span>;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return "bg-yellow-100 border-yellow-300";
    if (rank === 2) return "bg-gray-100 border-gray-300";
    if (rank === 3) return "bg-orange-100 border-orange-300";
    return "bg-white border-gray-200";
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-block mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Leaderboard
        </h1>
        <p className="text-gray-600 text-lg">Top contributors making a difference in our community</p>
      </div>

      {/* Points Info */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white p-8 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">How to Earn Points</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-lg p-5 rounded-xl border border-white/30">
            <div className="font-bold text-2xl mb-2">+10 Points</div>
            <div className="text-purple-100">Join a Group</div>
          </div>
          <div className="bg-white/20 backdrop-blur-lg p-5 rounded-xl border border-white/30">
            <div className="font-bold text-2xl mb-2">+25 Points</div>
            <div className="text-purple-100">Create a Group</div>
          </div>
          <div className="bg-white/20 backdrop-blur-lg p-5 rounded-xl border border-white/30">
            <div className="font-bold text-2xl mb-2">+50 Points</div>
            <div className="text-purple-100">Resolve an Issue</div>
          </div>
        </div>
      </div>

      {/* User's Current Rank */}
      {userRank && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {userRank.rank}
              </div>
              <div>
                <div className="font-bold text-xl text-gray-900">
                  {userRank.username || userRank.full_name || "You"}
                </div>
                <div className="text-sm text-gray-600 mt-1">Your Current Rank</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {userRank.points || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">points</div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* 2nd Place */}
          <div className={`${getRankColor(2)} border-2 border-gray-300 p-6 rounded-2xl text-center shadow-xl transform hover:scale-105 transition-all`}>
            <div className="flex justify-center mb-3">
              {getRankIcon(2)}
            </div>
            <div className="font-bold text-lg text-gray-800 truncate mb-2">
              {leaderboard[1]?.username || leaderboard[1]?.full_name || "Anonymous"}
            </div>
            <div className="text-3xl font-bold text-gray-700 mt-2">
              {leaderboard[1]?.points || 0}
            </div>
            <div className="text-xs text-gray-600 mt-1">points</div>
          </div>

          {/* 1st Place */}
          <div className={`${getRankColor(1)} border-2 border-yellow-400 p-6 rounded-2xl text-center transform scale-110 shadow-2xl relative`}>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-full">#1</div>
            </div>
            <div className="flex justify-center mb-3 mt-2">
              {getRankIcon(1)}
            </div>
            <div className="font-bold text-lg text-gray-800 truncate mb-2">
              {leaderboard[0]?.username || leaderboard[0]?.full_name || "Anonymous"}
            </div>
            <div className="text-3xl font-bold text-gray-700 mt-2">
              {leaderboard[0]?.points || 0}
            </div>
            <div className="text-xs text-gray-600 mt-1">points</div>
          </div>

          {/* 3rd Place */}
          <div className={`${getRankColor(3)} border-2 border-orange-300 p-6 rounded-2xl text-center shadow-xl transform hover:scale-105 transition-all`}>
            <div className="flex justify-center mb-3">
              {getRankIcon(3)}
            </div>
            <div className="font-bold text-lg text-gray-800 truncate mb-2">
              {leaderboard[2]?.username || leaderboard[2]?.full_name || "Anonymous"}
            </div>
            <div className="text-3xl font-bold text-gray-700 mt-2">
              {leaderboard[2]?.points || 0}
            </div>
            <div className="text-xs text-gray-600 mt-1">points</div>
          </div>
        </div>
      )}

      {/* Full Leaderboard List */}
      <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-2xl overflow-hidden border border-purple-100">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">All Rankings</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">No rankings yet. Be the first to earn points!</p>
            </div>
          ) : (
            leaderboard.map((person, index) => {
              const rank = index + 1;
              const isCurrentUser = user && person.id === user.id;
              
              return (
                <div
                  key={person.id}
                  className={`p-5 flex items-center gap-4 hover:bg-purple-50/50 transition-all ${
                    isCurrentUser ? "bg-gradient-to-r from-purple-100 to-blue-100 border-l-4 border-purple-500" : ""
                  }`}
                >
                  <div className="w-14 text-center flex items-center justify-center">
                    {getRankIcon(rank)}
                  </div>
                  
                  <div className="flex-1 flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={
                          person.avatar_url ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        alt="avatar"
                        className="w-14 h-14 rounded-full object-cover border-2 border-purple-200 shadow-md"
                      />
                      {isCurrentUser && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full border-2 border-white flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        {person.username || person.full_name || person.email || "Anonymous"}
                        {isCurrentUser && (
                          <span className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full font-semibold">
                            You
                          </span>
                        )}
                      </div>
                      {person.username && person.full_name && (
                        <div className="text-sm text-gray-500 mt-1">{person.full_name}</div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {person.points || 0}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">points</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}


