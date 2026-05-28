/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CreditCard, ShieldCheck, ShoppingCart, Loader2, ArrowLeft, ArrowUpRight } from "lucide-react";

export default function SimulatedCheckout() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [params, setParams] = useState<any>({});

  useEffect(() => {
    // Parse query details
    const searchParams = new URLSearchParams(window.location.search);
    setParams({
      workspaceId: searchParams.get("workspaceId") || "",
      pricingTier: searchParams.get("pricingTier") || "PRO",
      successUrl: searchParams.get("successUrl") || "/dashboard",
      cancelUrl: searchParams.get("cancelUrl") || "/dashboard",
    });
  }, []);

  const priceLabel = params.pricingTier === "ENTERPRISE" ? "£29.00" : "£9.00";
  const planName = params.pricingTier === "ENTERPRISE" ? "Enterprise subscription" : "Pro billing plan";

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Direct post updating active sandbox workspace tier details:
      const res = await fetch("/api/billing/simulated-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: params.workspaceId,
          tier: params.pricingTier
        })
      });

      if (!res.ok) {
        throw new Error("Simulated upgrade trigger failed");
      }

      setSuccess(true);
      setTimeout(() => {
        // Safe redirect to callback success URL
        window.location.href = params.successUrl;
      }, 1500);

    } catch (err) {
      alert("Error processing sandbox transaction details.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] flex items-center justify-center p-4">
      
      {/* Visual background lines */}
      <div className="absolute top-0 left-0 w-full h-[320px] bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

      <div className="w-full max-w-4xl bg-[#11131c] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative z-10 grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Column: Checkout Summary details */}
        <div className="p-8 md:p-10 bg-[#0d0f17]/90 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
          <div className="space-y-6">
            <button
              onClick={() => window.location.href = params.cancelUrl}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Cancel and return
            </button>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <ShoppingCart className="h-3 w-3" /> Stripe Secure Sandbox
              </span>
              <p className="text-2xl font-bold tracking-tight text-slate-100">{planName}</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-extrabold text-slate-100">{priceLabel}</span>
                <span className="text-xs text-slate-500 font-medium">/ monthly</span>
              </div>
            </div>

            <div className="py-4 border-t border-slate-800/60 text-xs text-slate-400 space-y-2.5 leading-relaxed">
              <div className="flex justify-between">
                <span>Workspace ID:</span>
                <span className="font-mono text-slate-500 text-[10px]">{params.workspaceId || "wsp-acme"}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-200">
                <span>Total Due Today:</span>
                <span>{priceLabel}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 mt-10 leading-relaxed">
            Stripe payments simulation mode. Click Submit below to immediately publish mock subscription webhooks.
          </p>
        </div>

        {/* Right Column: Cards Inputs simulator Form */}
        <div className="p-8 md:p-10 flex flex-col justify-between">
          {success ? (
            <div className="text-center py-20 space-y-4">
              <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                <ShieldCheck className="h-6 w-6 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-slate-100">Checkout Complete!</p>
              <p className="text-xs text-slate-500">Upgrade successfully completed. Returning to console...</p>
            </div>
          ) : (
            <form onSubmit={handleCheckoutSubmit} className="space-y-5">
              <h3 className="text-sm font-semibold text-slate-200 pb-3 border-b border-slate-800/40">Secure Payment Card details</h3>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dummy Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4242 •••• •••• 4242"
                    defaultValue="4242 4242 4242 4242"
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiration Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM / YY"
                    defaultValue="12/29"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CVC Security</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    placeholder="•••"
                    defaultValue="345"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl text-xs transition-colors mt-8 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                ) : (
                  <>
                    Subscribe securely with Stripe <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <span className="text-[10px] font-semibold text-slate-600 tracking-wider flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-emerald-500" /> Verified PCI-DSS Compliance
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
