import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AIAssistant from "./components/AIAssistant";
import Home from "./pages/Home";
import Report from "./pages/Report";
import Issues from "./pages/Issues";
import IssueDetail from "./pages/IssueDetail";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Groups from "./pages/Groups";
import GroupPage from "./pages/GroupPage";
import CreateGroupPage from "./pages/CreateGroup";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <Navbar />
      <main className="pt-24 px-4 min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<ProtectedRoute requireProfile={true}><Report /></ProtectedRoute>} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/issues/:id" element={<IssueDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute requireProfile={true}><Groups /></ProtectedRoute>} />
          <Route path="/groups/create" element={<ProtectedRoute requireProfile={true}><CreateGroupPage /></ProtectedRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute requireProfile={true}><GroupPage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<Leaderboard />} />


          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
}
