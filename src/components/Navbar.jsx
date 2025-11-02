import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (path) =>
    `px-4 py-2 rounded-md text-sm font-medium transition ${
      pathname === path
        ? "text-brand font-semibold"
        : "text-gray-700 hover:text-brand"
    }`;

  return (
    <header className="fixed top-0 left-0 w-full z-[100]">
      <nav className="bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="font-bold text-2xl bg-gradient-to-r from-brand to-brand-accent bg-clip-text text-transparent tracking-tight">
            WeFix
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-4 items-center">
            <Link className={linkClass("/")} to="/">Home</Link>
            <Link className={linkClass("/report")} to="/report">Report</Link>
            <Link className={linkClass("/issues")} to="/issues">Issues</Link>
            <Link className={linkClass("/groups")} to="/groups">Groups</Link>
            <Link className={linkClass("/leaderboard")} to="/leaderboard">Leaderboard</Link>
            <Link className={linkClass("/about")} to="/about">About</Link>

            {!user ? (
              <>
                <Link to="/login" className="px-4 py-2 rounded border text-sm">Sign In</Link>
                <Link to="/signup" className="px-4 py-2 rounded bg-brand text-white text-sm">Sign Up</Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="text-sm text-gray-700 hover:text-brand font-medium">
                  Profile
                </Link>
                <button onClick={signOut} className="px-3 py-1 rounded border text-sm hover:bg-gray-50">
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t shadow-sm">
            <div className="flex flex-col px-4 py-3 space-y-2">
              <Link onClick={() => setMenuOpen(false)} className={linkClass("/")} to="/">Home</Link>
              <Link onClick={() => setMenuOpen(false)} className={linkClass("/report")} to="/report">Report</Link>
              <Link onClick={() => setMenuOpen(false)} className={linkClass("/issues")} to="/issues">Issues</Link>
              <Link onClick={() => setMenuOpen(false)} className={linkClass("/groups")} to="/groups">Groups</Link>
              <Link onClick={() => setMenuOpen(false)} className={linkClass("/leaderboard")} to="/leaderboard">Leaderboard</Link>
              <Link onClick={() => setMenuOpen(false)} className={linkClass("/about")} to="/about">About</Link>

              {!user ? (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded border text-sm">Sign In</Link>
                  <Link to="/signup" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded bg-brand text-white text-sm">Sign Up</Link>
                </>
              ) : (
                <>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className={linkClass("/profile")}>Profile</Link>
                  <button onClick={() => { setMenuOpen(false); signOut(); }} className="px-3 py-2 rounded border text-sm">Logout</button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="h-[4px] w-full bg-gradient-to-r from-brand to-brand-accent"></div>
    </header>
  );
}
