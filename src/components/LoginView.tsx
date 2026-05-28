/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { KeyRound, Mail, User, ShieldCheck, Github, Chrome, AlertCircle } from "lucide-react";

interface LoginViewProps {
  onSuccess: () => void;
}

export default function LoginView({ onSuccess }: LoginViewProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/signin";
    const payload = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "An error occurred during authentication.");
      }

      // Success
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleLogin = () => {
    setLoading(true);
    // Simulate OAuth callback trigger
    setTimeout(() => {
      setEmail("admin@acme.com");
      setPassword("password");
      setIsRegister(false);
      setLoading(false);
      setError("👉 Simulated Google login successfully completed. Click Sign In to authorize session!");
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative cosmic background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#11131c]/80 border border-slate-800 backdrop-blur-md rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Logo and Greeting Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">
            {isRegister ? "Join the Workspace" : "Access your Dashboard"}
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {isRegister ? "Start building with teammates in seconds" : "Enter credentials to resume your workspace"}
          </p>
        </div>

        {error && (
          <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 mb-6 border ${
            error.includes("successfully") 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Alexander Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Work Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="admin@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-400">Account Password</label>
              {!isRegister && (
                <button
                  type="button"
                  onClick={() => setError("💡 Demo account password: password")}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium rounded-xl text-sm transition-colors mt-6 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : isRegister ? (
              "Create Workspace Account"
            ) : (
              "Sign In to Workspace"
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <span className="relative bg-[#11131c] px-3 text-xs text-slate-500 uppercase tracking-widest">
            or continue with
          </span>
        </div>

        {/* Google OAuth Simulation button */}
        <button
          type="button"
          onClick={triggerGoogleLogin}
          className="w-full py-2.5 px-4 bg-slate-900/80 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs text-slate-300 font-medium transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:border-slate-700"
        >
          <Chrome className="h-4 w-4 text-slate-400" />
          Authenticate with Google Workspace
        </button>

        {/* Footer toggler */}
        <div className="mt-8 text-center text-xs">
          <span className="text-slate-500">
            {isRegister ? "Already registered with us? " : "New to the platform? "}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-emerald-400 font-medium hover:text-emerald-300 underline transition-colors"
          >
            {isRegister ? "Sign In instead" : "Create standard account"}
          </button>
        </div>

        {/* Demo Account Indicator */}
        <div className="mt-6 pt-4 border-t border-slate-800/40 text-center">
          <p className="text-[10px] font-mono text-slate-600">
            Sandbox Credentials: admin@acme.com / password
          </p>
        </div>
      </div>
    </div>
  );
}
