import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";

const redIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

export default function Issues() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showMine, setShowMine] = useState(false);
  const [sortBy, setSortBy] = useState("votes"); // "votes" or "recent"

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setIssues(data);
        // Fetch vote counts for all issues
        fetchVoteCounts(data.map((i) => i.id));
      }
    } catch (err) {
      console.error("Error fetching issues:", err);
    }
  };

  const fetchVoteCounts = async (issueIds) => {
    if (issueIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from("issue_votes")
        .select("issue_id")
        .in("issue_id", issueIds);

      if (!error && data) {
        const counts = {};
        data.forEach((vote) => {
          counts[vote.issue_id] = (counts[vote.issue_id] || 0) + 1;
        });
        setVoteCounts(counts);
      }
    } catch (err) {
      console.error("Error fetching vote counts:", err);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const filteredIssues = issues
    .filter((issue) => {
      const matchStatus = filter === "All" || issue.status === filter;
      const matchSearch = issue.title.toLowerCase().includes(search.toLowerCase());
      const matchMine = !showMine || issue.user_id === user?.id;
      return matchStatus && matchSearch && matchMine;
    })
    .sort((a, b) => {
      if (sortBy === "votes") {
        const votesA = voteCounts[a.id] || 0;
        const votesB = voteCounts[b.id] || 0;
        return votesB - votesA; // Highest votes first
      } else {
        // Sort by recent
        return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  const openCount = issues.filter(i => i.status === "Open").length;
  const inProgressCount = issues.filter(i => i.status === "In-Progress").length;
  const resolvedCount = issues.filter(i => i.status === "Resolved").length;

  return (
    <div className="max-w-7xl mx-auto pb-10 px-4 space-y-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-brand to-brand-accent bg-clip-text text-transparent">
          Community Issues
        </h1>
        <p className="text-gray-600 text-lg">Report and track neighbourhood issues in real-time</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 shadow-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">{openCount}</div>
          <div className="text-sm text-gray-600 font-medium">Open Issues</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 shadow-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{inProgressCount}</div>
          <div className="text-sm text-gray-600 font-medium">In Progress</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 shadow-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
          <div className="text-sm text-gray-600 font-medium">Resolved</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 shadow-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{issues.length}</div>
          <div className="text-sm text-gray-600 font-medium">Total Issues</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          {["All", "Open", "In-Progress", "Resolved"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                filter === s
                  ? "bg-gradient-to-r from-brand to-brand-accent text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}

          {user && (
            <button
              onClick={() => setShowMine(!showMine)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                showMine
                  ? "bg-gradient-to-r from-brand to-brand-accent text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              My Issues
            </button>
          )}

          {/* Sort Options */}
          <div className="ml-auto flex gap-2 items-center">
            <span className="text-sm text-gray-600 font-medium">Sort:</span>
            <button
              onClick={() => setSortBy("votes")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                sortBy === "votes"
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Highest Votes
            </button>
            <button
              onClick={() => setSortBy("recent")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                sortBy === "recent"
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Most Recent
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues by title..."
            className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent pl-10"
          />
          <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Issues + Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Issue List */}
        <div className="space-y-4">
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => (
              <Link
                key={issue.id}
                to={`/issues/${issue.id}`}
                className="block bg-gradient-to-br from-white to-purple-50/30 p-6 rounded-2xl shadow-xl border border-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="font-bold text-xl text-gray-900 flex-1">{issue.title}</div>
                  <div className="flex items-center gap-2">
                    {issue.ai_category && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        {issue.ai_category}
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        issue.status === "Resolved"
                          ? "bg-green-100 text-green-700"
                          : issue.status === "In-Progress"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {issue.status}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                  {issue.description}
                </div>

                {/* AI Predictions */}
                {(issue.ai_category || issue.ai_priority) && (
                  <div className="flex items-center gap-2 mb-3">
                    {issue.ai_priority && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                        issue.ai_priority === 'High'
                          ? 'bg-red-100 text-red-700'
                          : issue.ai_priority === 'Medium'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {issue.ai_priority} Priority
                      </span>
                    )}
                    {issue.ai_confidence && (
                      <span className="text-xs text-gray-500">
                        {(issue.ai_confidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>
                )}

                {issue.image_url && (
                  <img
                    src={issue.image_url}
                    alt="issue"
                    className="w-full h-40 object-cover rounded-xl mt-3 shadow-md"
                  />
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 font-semibold text-purple-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      {voteCounts[issue.id] || 0} votes
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-purple-600 font-semibold hover:underline flex items-center gap-1">
                    View Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-12 shadow-xl border border-purple-100 text-center">
              <p className="text-gray-600 text-lg">No issues found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Right: Map */}
        <div className="h-[600px] w-full border-2 border-purple-100 rounded-2xl overflow-hidden shadow-2xl bg-white relative z-0">
          <div className="bg-gradient-to-r from-brand to-brand-accent text-white p-3 font-semibold relative z-10">
            Issue Locations Map
          </div>
          <MapContainer
            center={[17.387, 78.486]}
            zoom={13}
            style={{ height: "calc(100% - 48px)", width: "100%", position: "relative", zIndex: 0 }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filteredIssues.map((issue) => (
              <Marker
                key={issue.id}
                position={[issue.latitude, issue.longitude]}
                icon={redIcon}
              >
                <Popup>
                  <b>{issue.title}</b>
                  <br />
                  {issue.description}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
