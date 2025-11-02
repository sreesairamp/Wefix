import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { createUserProfile } from "../utils/createUserProfile";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      return alert("Please enter your full name");
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) {
        alert(error.message);
        return;
      }

      // Create profile if user was created
      if (data.user) {
        const result = await createUserProfile(data.user);
        if (!result.success) {
          console.error("Profile creation failed:", result.error);
        }
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        alert("Please check your email to confirm your account before signing in!");
        navigate("/login");
      } else if (data.session) {
        // Auto-logged in (if email confirmation is disabled)
        alert("Signup successful! Completing your profile...");
        navigate("/profile");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("An error occurred during signup. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4">
      <div className="bg-gradient-to-br from-white to-purple-50/30 p-8 rounded-2xl shadow-2xl border border-purple-100 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Join WeFix
          </h2>
          <p className="text-gray-600">Create your account and start making a difference</p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl mt-2"
          >
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link className="text-purple-600 font-semibold hover:underline" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
