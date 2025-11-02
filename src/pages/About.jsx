import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          About WeFix
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Empowering communities to fix neighbourhood issues together
        </p>
      </div>

      {/* Mission Section */}
      <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-8 shadow-xl border border-purple-100 mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
        <p className="text-gray-600 leading-relaxed text-lg">
          WeFix is a community-driven platform that connects residents with local task teams to address 
          and resolve neighbourhood issues. We believe that when communities work together, we can create 
          positive change in our cities, one issue at a time.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-6 shadow-xl border border-blue-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Report Issues</h3>
          <p className="text-gray-600 leading-relaxed">
            Easily report civic problems with photos, descriptions, and precise location mapping. 
            Your voice matters in shaping your community.
          </p>
        </div>
        <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-6 shadow-xl border border-purple-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Task Teams</h3>
          <p className="text-gray-600 leading-relaxed">
            Join or create task teams led by dedicated leaders who coordinate efforts to resolve 
            community issues efficiently.
          </p>
        </div>
        <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl p-6 shadow-xl border border-green-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Track Progress</h3>
          <p className="text-gray-600 leading-relaxed">
            Monitor issue resolution in real-time, vote on priorities, and see your community 
            transform through collective action.
          </p>
        </div>
        <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl p-6 shadow-xl border border-orange-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Fundraising</h3>
          <p className="text-gray-600 leading-relaxed">
            Support solutions through secure donations that go directly to task team leaders, 
            ensuring resources reach where they're needed most.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 shadow-2xl text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
        <p className="text-purple-100 mb-6 text-lg">
          Join thousands of community members working together to improve neighbourhoods
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/signup"
            className="bg-white text-purple-600 font-bold px-8 py-3 rounded-xl hover:bg-purple-50 transition-all shadow-lg"
          >
            Get Started
          </Link>
          <Link
            to="/issues"
            className="bg-white/20 backdrop-blur-lg text-white border-2 border-white/40 px-8 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all"
          >
            View Issues
          </Link>
        </div>
      </div>
    </div>
  );
}
