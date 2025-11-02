import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPlatformStats } from "../utils/getStats";

export default function Home() {
  const [stats, setStats] = useState({
    totalIssues: 0,
    resolvedIssues: 0,
    totalGroups: 0,
    totalUsers: 0,
    activeFundraisers: 0,
    totalDonations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const platformStats = await getPlatformStats();
    setStats(platformStats);
    setLoading(false);
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-brand via-brand-accent to-brand-dark text-white py-24 px-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="relative z-10 max-w-5xl mx-auto">
          <h1 className="text-6xl font-extrabold mb-6 bg-gradient-to-r from-white to-brand-light bg-clip-text text-transparent">
            WeFix — Fix Your Neighbourhood Together
          </h1>
          <p className="mt-3 text-xl max-w-2xl text-purple-50 leading-relaxed mb-8">
            Report issues, collaborate with your community, and transform your city with collective action.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/report" className="bg-white text-brand font-bold px-8 py-4 rounded-xl shadow-2xl hover:scale-105 transition-all duration-200 hover:shadow-2xl">
              Report an Issue
            </Link>
            <Link to="/issues" className="bg-white/20 backdrop-blur-lg text-white border-2 border-white/40 px-8 py-4 rounded-xl font-semibold hover:bg-white/30 transition-all duration-200 hover:scale-105">
              View Issues
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mt-16 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-xl border border-purple-200">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {loading ? "..." : stats.totalIssues.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 font-medium">Total Issues</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-xl border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {loading ? "..." : stats.resolvedIssues.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 font-medium">Resolved</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-xl border border-blue-200">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {loading ? "..." : stats.totalGroups.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 font-medium">Active Groups</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-xl border border-orange-200">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {loading ? "..." : stats.totalUsers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 font-medium">Community Members</div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="mt-16 grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white to-purple-50/50 rounded-2xl p-8 shadow-xl border border-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Report Issues Easily</h3>
          <p className="text-gray-600 leading-relaxed">Raise civic problems with images, descriptions and location pins. Make your voice heard.</p>
        </div>
        <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl p-8 shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Track Progress</h3>
          <p className="text-gray-600 leading-relaxed">Follow issue resolution status through community updates and real-time notifications.</p>
        </div>
        <div className="bg-gradient-to-br from-white to-purple-50/50 rounded-2xl p-8 shadow-xl border border-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Work as a Community</h3>
          <p className="text-gray-600 leading-relaxed">Join local groups, collaborate with task teams, and volunteer to improve your neighbourhood.</p>
        </div>
      </section>
    </div>
  );
}
