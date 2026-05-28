/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  BarChart4, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Building2, 
  Sparkles,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

import { UserSession, Workspace, DashboardMetrics } from "./types.js";
import LoginView from "./components/LoginView.js";
import OnboardingStep from "./components/OnboardingStep.js";
import DashboardView from "./components/DashboardView.js";
import TeamView from "./components/TeamView.js";
import BillingView from "./components/BillingView.js";
import SettingsView from "./components/SettingsView.js";
import SimulatedCheckout from "./components/SimulatedCheckout.js";

type TabMode = "DASHBOARD" | "TEAM" | "BILLING" | "SETTINGS";

export default function App() {
  // Render Simulated Stripe Portal interceptor
  if (window.location.pathname.startsWith("/billing/simulated-checkout")) {
    return <SimulatedCheckout />;
  }

  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<Array<{ id: string; name: string; slug: string; subscriptionTier: string }>>([]);
  const [activeTab, setActiveTab] = useState<TabMode>("DASHBOARD");
  const [loading, setLoading] = useState(true);
  
  // Dashboard Analytics payload
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  // Fetch Session status on launch
  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        setActiveWorkspace(data.workspace);
        setAllWorkspaces(data.workspaces || []);
      } else {
        setCurrentUser(null);
        setActiveWorkspace(null);
        setAllWorkspaces([]);
      }
    } catch (err) {
      console.error("Session fetching error: ", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics telemetry metrics
  const fetchMetrics = async () => {
    if (!currentUser) return;
    setMetricsLoading(true);
    try {
      const res = await fetch("/api/dashboard/metrics");
      const data = await res.json();
      if (res.ok) {
        setMetrics(data);
      }
    } catch (err) {
      console.error("Metrics retrieval error", err);
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.onboardingCompleted) {
      fetchMetrics();
    }
  }, [currentUser, activeWorkspace?.id]);

  const selectWorkspace = async (workspaceId: string) => {
    setWorkspaceDropdownOpen(false);
    try {
      const res = await fetch("/api/workspaces/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (res.ok) {
        setLoading(true);
        await checkSession();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      setCurrentUser(null);
      setActiveWorkspace(null);
      setAllWorkspaces([]);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-500 tracking-wider">SECURE ENDPOINT AUTHORIZING...</p>
        </div>
      </div>
    );
  }

  // Auth Guard
  if (!currentUser) {
    return <LoginView onSuccess={checkSession} />;
  }

  // Onboarding Wizard Guard
  if (!currentUser.onboardingCompleted) {
    return <OnboardingStep onComplete={checkSession} />;
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-200 flex flex-col md:flex-row relative overflow-hidden font-sans">
      
      {/* Visual glowing depth indicators */}
      <div className="absolute top-[10%] left-[2%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[5%] right-[5%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800/80 bg-[#11131c]/60 backdrop-blur-md shrink-0 flex flex-col justify-between relative z-20">
        <div>
          {/* Workspace Switcher dropdown */}
          <div className="p-4 border-b border-slate-800/80 relative">
            <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mb-1.5 block">Active Tenant Cluster</span>
            <button
              onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-850 hover:border-slate-800 transition-colors text-left text-xs text-slate-300 font-semibold cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[120px]">{activeWorkspace?.name || "Workspace"}</span>
              </span>
              <ChevronDown className="h-3 w-3 text-slate-500 shrink-0" />
            </button>

            {workspaceDropdownOpen && (
              <div className="absolute top-full left-4 right-4 mt-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl z-30">
                {allWorkspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => selectWorkspace(w.id)}
                    className={`w-full text-left p-3 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      activeWorkspace?.id === w.id 
                        ? "bg-slate-800/80 text-emerald-400 font-semibold" 
                        : "hover:bg-slate-800 text-slate-400 hover:text-slate-100"
                    }`}
                  >
                    <span>{w.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 uppercase">
                      {w.subscriptionTier}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation link triggers */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("DASHBOARD")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === "DASHBOARD" 
                  ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <BarChart4 className="h-4 w-4" />
              SaaS Telemetry
            </button>
            <button
              onClick={() => setActiveTab("TEAM")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === "TEAM" 
                  ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <Users className="h-4 w-4" />
              Teammate Access
            </button>
            <button
              onClick={() => setActiveTab("BILLING")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === "BILLING" 
                  ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Plans & Ledger
            </button>
            <button
              onClick={() => setActiveTab("SETTINGS")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === "SETTINGS" 
                  ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <Settings className="h-4 w-4" />
              Configurations
            </button>
          </nav>
        </div>

        {/* User Status trigger info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/20">
          <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-900/40">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={currentUser.image || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.email}`}
                alt={currentUser.name}
                className="h-8 w-8 rounded-full object-cover shrink-0 border border-slate-800"
                referrerPolicy="no-referrer"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-300 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate uppercase">{currentUser.role || "Owner"}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Area */}
      <main className="flex-1 p-6 md:p-8 min-h-0 overflow-y-auto relative z-10 flex flex-col gap-8">
        
        {/* Top Header Information bar */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-850/60">
          <div>
            <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Console Gateway</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              Management Portal
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-0.5 px-2 rounded-lg font-bold">
                PROD-ACTIVE
              </span>
            </h1>
          </div>

          {/* Active Tenant indicators */}
          <div className="flex items-center gap-2">
            <div className="p-1 px-2.5 rounded-lg bg-[#11131c] border border-slate-805/60 text-xs flex items-center gap-1.5 font-semibold text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Subscription Status: {activeWorkspace?.subscriptionTier || "FREE"}
            </div>
            
            {activeWorkspace?.subscriptionTier === "FREE" && (
              <button
                onClick={() => setActiveTab("BILLING")}
                className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-md shadow-amber-500/20"
              >
                <Sparkles className="h-3 w-3" />
                Upgrade
              </button>
            )}
          </div>
        </header>

        {/* Routed Screen switches */}
        <section className="flex-1">
          {activeTab === "DASHBOARD" && (
            <DashboardView 
              metrics={metrics} 
              loading={metricsLoading} 
              onRefresh={fetchMetrics} 
            />
          )}

          {activeTab === "TEAM" && (
            <TeamView 
              currentUser={currentUser} 
              onRefresh={checkSession} 
            />
          )}

          {activeTab === "BILLING" && (
            <BillingView 
              workspace={activeWorkspace} 
              onRefresh={checkSession} 
            />
          )}

          {activeTab === "SETTINGS" && (
            <SettingsView 
              currentUser={currentUser} 
              workspace={activeWorkspace} 
              onRefresh={checkSession} 
              onLogout={handleLogout} 
            />
          )}
        </section>

      </main>
    </div>
  );
}
