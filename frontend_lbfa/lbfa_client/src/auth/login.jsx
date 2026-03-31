import { useState } from "react";
import { loginUser } from "../api/auth.api";
import api from "../api/axios";
import { ShieldCheck, Mail, Lock, ArrowRight, Building2 } from "lucide-react";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await loginUser(form);

      const token = res?.data?.token;

      if (!token) {
        throw new Error("Token not received");
      }

      // ✅ Save token
      localStorage.setItem("token", token);

      // ✅ Update axios default header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // ✅ Force clean reload (guaranteed stable)
      window.location.replace("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900" />

        <div className="absolute top-16 left-16 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-16 right-16 w-56 h-56 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute top-1/2 right-10 w-28 h-28 rounded-full bg-indigo-300/10 blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between h-full w-full p-12 text-white">
          <div>
            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wide">LBFA Sangam</h1>
                <p className="text-sm text-blue-100">
                  Loan & Finance Management System
                </p>
              </div>
            </div>

            <div className="mt-16 max-w-md">
              <div className="inline-flex items-center gap-2 bg-emerald-400/15 border border-emerald-300/20 rounded-full px-4 py-2 text-sm text-emerald-100 mb-6">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Secure Admin Access
              </div>

              <h2 className="text-4xl font-bold leading-tight">
                Simple. Professional. Reliable access for your finance team.
              </h2>

              <p className="mt-5 text-blue-100 leading-7 text-base">
                Manage Members, loans, EMI collections, Payment tracking, and
                reports from one clean and organized dashboard.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-cyan-400/20 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5 text-cyan-200" />
              </div>
              <p className="text-sm font-semibold">Secure Login</p>
              <p className="text-xs text-blue-100 mt-1">Protected admin access</p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center mb-3">
                <Mail className="w-5 h-5 text-yellow-200" />
              </div>
              <p className="text-sm font-semibold">Fast Access</p>
              <p className="text-xs text-blue-100 mt-1">Smooth workflow start</p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-pink-400/20 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5 text-pink-200" />
              </div>
              <p className="text-sm font-semibold">Trusted System</p>
              <p className="text-xs text-blue-100 mt-1">Built for daily use</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center bg-slate-50 px-6 py-10">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-700 flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mt-4">
              LBFA Sangam
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Loan & Finance Management System
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 sm:p-10">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-700 flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Welcome Back
                  </h2>
                  <p className="text-sm text-slate-500">
                    Sign in to continue to your dashboard
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Email
                </label>
                <div className="flex items-center gap-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-700 focus-within:ring-4 focus-within:ring-blue-100 transition">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-700" />
                  </div>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Password
                </label>
                <div className="flex items-center gap-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-700 focus-within:ring-4 focus-within:ring-blue-100 transition">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-violet-600" />
                  </div>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3.5 rounded-2xl shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Login"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                © 2026 LBFA Sangam Finance System
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}