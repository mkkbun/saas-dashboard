/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Check, ShieldAlert, Sparkles, Receipt, Rocket, ShieldCheck, HeartPulse } from "lucide-react";
import { SUBSCRIPTION_PRICES } from "../lib/stripe.js";
import { Workspace } from "../types.js";

interface BillingViewProps {
  workspace: Workspace | null;
  onRefresh: () => void;
}

export default function BillingView({ workspace, onRefresh }: BillingViewProps) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeTier = workspace?.subscriptionTier || "FREE";

  const handleSubscribe = async (tierKey: "PRO" | "ENTERPRISE") => {
    setSubmitting(tierKey);
    setError(null);

    const priceId = tierKey === "PRO" ? SUBSCRIPTION_PRICES.PRO.id : SUBSCRIPTION_PRICES.ENTERPRISE.id;

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to bootstrap checkout redirect session");
      }

      // If simulated checkout or real session url generated, go to URL
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during billing submission");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Subscriptions & Billing Ledger</h2>
        <p className="text-xs text-slate-500">Configure corporate billing, scale active workspace capacities, and update payment profiles.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-start gap-2 max-w-2xl">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Card */}
      <div className="bg-[#11131c] border border-slate-800 rounded-2xl p-6 max-w-4xl relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Tenant Plan</span>
            <div className="flex items-center gap-2.5 mt-1">
              <h3 className="text-xl font-bold text-slate-100">{activeTier} SUBSCRIPTION</h3>
              <span className={`text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg ${
                workspace?.subscriptionStatus === "ACTIVE" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {workspace?.subscriptionStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Mapped client organization: <span className="font-semibold text-slate-300">{workspace?.name}</span>. Billing actions automatically update MRR indicators.
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => setError("💡 You are operating in Simulated Sandbox Portal. All upgrades occur immediately with immediate state feedback!")}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 hover:text-slate-100 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Receipt className="h-3.5 w-3.5 text-slate-400" />
              Billing History
            </button>
          </div>
        </div>
      </div>

      {/* 3-Tier plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        
        {/* Tier Free */}
        <div className={`p-6 bg-[#11131c] border rounded-2xl flex flex-col justify-between hover:border-slate-700/40 transition-all relative ${
          activeTier === "FREE" ? "ring-1 ring-emerald-500/40 border-emerald-500/20" : "border-slate-800"
        }`}>
          {activeTier === "FREE" && (
            <span className="absolute top-4 right-4 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
              Active Tier
            </span>
          )}
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sandbox Standard</span>
            <h3 className="text-xl font-bold text-slate-100 mt-2">Free Plan</h3>
            <p className="text-sm mt-1 text-slate-400">£0 <span className="text-xs text-slate-500">/ forever</span></p>
            <p className="text-xs leading-relaxed text-slate-500 mt-3">Evaluate initial functionalities for your local setup.</p>
            
            <ul className="space-y-2.5 mt-6 border-t border-slate-800/40 pt-4">
              {SUBSCRIPTION_PRICES.FREE.features.map((f, idx) => (
                <li key={idx} className="flex gap-2 text-xs text-slate-400 leading-normal">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            disabled
            className="w-full py-2.5 mt-8 border border-slate-800 text-slate-500 text-xs font-semibold rounded-xl"
          >
            {activeTier === "FREE" ? "Current Active tier" : "Baseline Account"}
          </button>
        </div>

        {/* Tier Pro */}
        <div className={`p-6 bg-[#11131c] border rounded-2xl flex flex-col justify-between hover:border-slate-700/60 transition-all relative ${
          activeTier === "PRO" ? "ring-2 ring-emerald-500 border-emerald-500" : "border-slate-800"
        }`}>
          <div className="absolute top-4 right-4">
            {activeTier === "PRO" ? (
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Active Tier
              </span>
            ) : (
              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" /> Core Pick
              </span>
            )}
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Rapid Scaling</span>
            <h3 className="text-xl font-bold text-slate-100 mt-2">Pro Scale</h3>
            <p className="text-sm mt-1 text-slate-100">£9 <span className="text-xs text-slate-500">/ user-month</span></p>
            <p className="text-xs leading-relaxed text-slate-500 mt-3">The premium standard for teams demanding performance dashboard visualizers.</p>
            
            <ul className="space-y-2.5 mt-6 border-t border-slate-800/40 pt-4">
              {SUBSCRIPTION_PRICES.PRO.features.map((f, idx) => (
                <li key={idx} className="flex gap-2 text-xs text-slate-300 leading-normal">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleSubscribe("PRO")}
            disabled={activeTier === "PRO" || !!submitting}
            className={`w-full py-2.5 mt-8 text-xs font-semibold rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
              activeTier === "PRO" 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            }`}
          >
            {submitting === "PRO" ? (
              <span className="h-3 w-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin mx-auto inline-block" />
            ) : activeTier === "PRO" ? (
              "Currently Subscribed"
            ) : (
              "Upgrade to Pro"
            )}
          </button>
        </div>

        {/* Tier Enterprise */}
        <div className={`p-6 bg-[#11131c] border rounded-2xl flex flex-col justify-between hover:border-slate-700/40 transition-all relative ${
          activeTier === "ENTERPRISE" ? "ring-2 ring-emerald-500 border-emerald-500" : "border-slate-800"
        }`}>
          {activeTier === "ENTERPRISE" && (
            <span className="absolute top-4 right-4 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
              Active Tier
            </span>
          )}
          <div>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Enterprise Compliant</span>
            <h3 className="text-xl font-bold text-slate-100 mt-2">Enterprise</h3>
            <p className="text-sm mt-1 text-slate-100">£29 <span className="text-xs text-slate-500">/ month</span></p>
            <p className="text-xs leading-relaxed text-slate-500 mt-3">Secure dedicated capacities suited for multi-tenant integrations and SLA checks.</p>
            
            <ul className="space-y-2.5 mt-6 border-t border-slate-800/40 pt-4">
              {SUBSCRIPTION_PRICES.ENTERPRISE.features.map((f, idx) => (
                <li key={idx} className="flex gap-2 text-xs text-slate-300 leading-normal">
                  <Check className="h-4 w-4 shrink-0 text-purple-400 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleSubscribe("ENTERPRISE")}
            disabled={activeTier === "ENTERPRISE" || !!submitting}
            className={`w-full py-2.5 mt-8 text-xs font-semibold rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
              activeTier === "ENTERPRISE" 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "bg-slate-100 hover:bg-white text-slate-950 font-bold"
            }`}
          >
            {submitting === "ENTERPRISE" ? (
              <span className="h-3 w-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin mx-auto inline-block" />
            ) : activeTier === "ENTERPRISE" ? (
              "Currently Subscribed"
            ) : (
              "Unlock Enterprise"
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
