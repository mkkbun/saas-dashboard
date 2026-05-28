/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Building2, CreditCard, Sparkles, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { SUBSCRIPTION_PRICES } from "../lib/stripe.js";

interface OnboardingStepProps {
  onComplete: () => void;
}

export default function OnboardingStep({ onComplete }: OnboardingStepProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [role, setRole] = useState("FOUNDER");
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"FREE" | "PRO" | "ENTERPRISE">("FREE");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const roles = [
    { id: "FOUNDER", title: "Founder & CEO", desc: "Build workspace, setup recurring billing plans, scale operations." },
    { id: "MARKETER", title: "Growth Marketer", desc: "Analyze metrics, report user trends, run campaign triggers." },
    { id: "ENGINEER", title: "Core Engineer", desc: "Build custom integrations, configure API endpoints, monitor webhooks." },
    { id: "PRODUCT", title: "Product Manager", desc: "Organize metrics charts, manage teammates permissions, audit logs." },
  ];

  const handleNext = () => {
    if (currentStep === 2 && !workspaceName.trim()) {
      setError("Please specify a valid name for your corporate workspace");
      return;
    }
    setError(null);
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // 1. Save onboarding profile structures in server state
      const onboardingRes = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceName: workspaceName,
          profileRole: role,
        }),
      });

      if (!onboardingRes.ok) {
        throw new Error("Failed to finalize onboarding configuration profile");
      }

      // 2. If Pro or Enterprise chosen, trigger payment checkout flow
      if (selectedPlan !== "FREE") {
        const priceId = selectedPlan === "PRO" ? SUBSCRIPTION_PRICES.PRO.id : SUBSCRIPTION_PRICES.ENTERPRISE.id;
        const checkoutRes = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId }),
        });

        const checkoutData = await checkoutRes.json();
        if (checkoutRes.ok && checkoutData.url) {
          window.location.href = checkoutData.url;
          return;
        }
      }

      onComplete();
    } catch (err: any) {
      setError(err.message || "An error occurred during finalizing onboarding.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e293b,transparent_60%)] opacity-30 pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-[#11131c]/90 border border-slate-800 backdrop-blur-md rounded-2xl p-8 md:p-10 shadow-2xl relative z-10">
        
        {/* Step Progress indicators */}
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Onboarding Wizard</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep === step 
                    ? "w-8 bg-emerald-500" 
                    : currentStep > step 
                    ? "w-2 bg-emerald-700" 
                    : "w-2 bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl mb-6 flex items-start gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 rotate-180" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic step renderer */}
        {currentStep === 1 && (
          <div>
            <div className="mb-6">
              <span className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl inline-block mb-3">
                <User className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-medium text-slate-100">Tell us about your core responsibility</h2>
              <p className="text-sm text-slate-400 mt-1">We will optimize performance indicators and telemetry widgets based on your role context.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                    role === r.id
                      ? "bg-emerald-500/10 border-emerald-500/40 text-slate-200"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-100">{r.title}</p>
                  <p className="text-xs mt-1.5 leading-relaxed text-slate-400">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <div className="mb-6">
              <span className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl inline-block mb-3">
                <Building2 className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-medium text-slate-100">Setup your primary workspace workspace</h2>
              <p className="text-sm text-slate-400 mt-1">Workspaces act as secure multi-tenant sandbox clusters for holding teammates, metrics logs, and billing tiers.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Workspace / Corporate Title</label>
                <input
                  type="text"
                  required
                  placeholder="Acme Corporation"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {workspaceName && (
                <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl text-[11px] font-mono text-slate-500">
                  <span className="text-emerald-400">Unique identifier url:</span> https://ais-saas.platform/w/{workspaceName.toLowerCase().replace(/[^a-z0-9]/g, "-")}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <div className="mb-6">
              <span className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl inline-block mb-3">
                <CreditCard className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-medium text-slate-100">Select subscription plan for workspace scale</h2>
              <p className="text-sm text-slate-400 mt-1">Pick a perfect plan. High-precision Stripe simulation mode will help you test premium views immediately.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: "FREE", name: "Free Tier", price: "£0", desc: "For teams assessing functionalities" },
                { id: "PRO", name: "Pro Plan", price: "£9/mo", desc: "Highly-granular widgets for active scale teams" },
                { id: "ENTERPRISE", name: "Enterprise", price: "£29/mo", desc: "Corporate compliant with SLA and maximum capacity" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id as any)}
                  className={`p-4 rounded-xl text-left border flex flex-col justify-between transition-all cursor-pointer ${
                    selectedPlan === p.id
                      ? "bg-slate-900/80 border-emerald-500 ring-1 ring-emerald-500 text-slate-100"
                      : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div>
                    <p className={`text-xs font-bold tracking-widest uppercase ${selectedPlan === p.id ? "text-emerald-400" : "text-slate-500"}`}>{p.name}</p>
                    <p className="text-2xl font-bold text-slate-100 mt-2">{p.price}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action button controls */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-800/60">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="py-2.5 px-4 bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="py-2.5 px-5 bg-slate-100 hover:bg-white text-slate-950 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 active:scale-[0.98]"
              >
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={submitting}
                className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? (
                  <span className="h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : selectedPlan === "FREE" ? (
                  "Complete Configuration"
                ) : (
                  `Upgrade to ${selectedPlan} & Start`
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
