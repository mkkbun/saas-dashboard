/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  Percent, 
  Activity, 
  Inbox, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  BellRing
} from "lucide-react";
import { DashboardMetrics } from "../types.js";

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function DashboardView({ metrics, loading, onRefresh }: DashboardViewProps) {
  const [metricMode, setMetricMode] = useState<"Users" | "MRR" | "Tasks">("Users");

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#11131c]/50 border border-slate-800/80 rounded-2xl p-6 h-28 animate-pulse" />
          ))}
        </div>
        {/* Chart Canvas Skeleton */}
        <div className="bg-[#11131c]/50 border border-slate-800/80 rounded-2xl p-6 h-96 animate-pulse" />
      </div>
    );
  }

  const { cards, chartData, activityLogs } = metrics;

  return (
    <div className="space-y-6">
      
      {/* Mini Top Utility Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Workspace Metrics Roll</h2>
          <p className="text-xs text-slate-500">Real-time SaaS billing telemetry and multi-tenant telemetry streams.</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Fetch Updates
        </button>
      </div>

      {/* Grid Indicators Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: MRR */}
        <div className="bg-[#11131c] border border-slate-800 hover:border-slate-700/60 transition-all rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Monthly Recurring Revenue</span>
              <p className="text-2xl font-bold tracking-tight text-slate-100 mt-1">{cards.mrr}</p>
            </div>
            <span className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-medium">{cards.mrrChange}</span>
            <span className="text-slate-500">vs historical baseline</span>
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div className="bg-[#11131c] border border-slate-800 hover:border-slate-700/60 transition-all rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-sky-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Active Tenant Users</span>
              <p className="text-2xl font-bold tracking-tight text-slate-100 mt-1">{cards.activeUsers}</p>
            </div>
            <span className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-sky-400 font-medium">{cards.usersChange}</span>
            <span className="text-slate-500">active this week</span>
          </div>
        </div>

        {/* Card 3: Churn rate */}
        <div className="bg-[#11131c] border border-slate-800 hover:border-slate-700/60 transition-all rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-rose-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Tenant Churn Index</span>
              <p className="text-2xl font-bold tracking-tight text-slate-100 mt-1">{cards.churnRate}</p>
            </div>
            <span className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
              <Percent className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-rose-400 font-medium">{cards.churnChange}</span>
            <span className="text-slate-500">stabilized response</span>
          </div>
        </div>

      </div>

      {/* Main Graph & Metric Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Block Layout */}
        <div className="lg:col-span-2 bg-[#11131c] border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/40">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Historical telemetry trends</h3>
              <p className="text-[11px] text-slate-500">Stiff linear projections for workspace active variables</p>
            </div>
            <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-800/80 rounded-xl">
              {(["Users", "MRR", "Tasks"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setMetricMode(mode)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    metricMode === mode 
                      ? "bg-emerald-500 text-slate-950 shadow-md" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => metricMode === "MRR" ? `£${val}` : val.toLocaleString()}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#11131c", 
                    borderColor: "#334155", 
                    borderRadius: "12px", 
                    fontSize: "11px",
                    fontFamily: "monospace" 
                  }}
                  itemStyle={{ color: "#10b981" }}
                />
                <Area 
                  type="monotone" 
                  dataKey={metricMode} 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#gradientColor)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Workspace Activity feed */}
        <div className="bg-[#11131c] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-800/40 mb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <BellRing className="h-4 w-4 text-emerald-400" />
                Audited Workspace Activity
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Multi-tenant logs tracked securely</p>
            </div>

            <div className="space-y-4">
              {activityLogs.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Inbox className="h-10 w-10 text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500">No telemetry activities available yet</p>
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="flex gap-3 text-xs leading-relaxed group">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0 group-hover:scale-125 transition-transform" />
                    <div>
                      <p className="font-semibold text-slate-300">
                        {log.action}
                      </p>
                      <p className="text-slate-500 text-[10px] leading-normal">{log.details}</p>
                      <p className="text-[9px] font-mono text-slate-600 mt-1">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/20 text-center mt-4">
            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-help">
              <Activity className="h-3 w-3 text-emerald-500" />
              Auditing stream live
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
