/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, ShieldAlert, Check, HelpCircle, Save, Trash2, Building } from "lucide-react";
import { UserSession, Workspace } from "../types.js";

interface SettingsViewProps {
  currentUser: UserSession | null;
  workspace: Workspace | null;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function SettingsView({ currentUser, workspace, onRefresh, onLogout }: SettingsViewProps) {
  const [userName, setUserName] = useState(currentUser?.name || "");
  const [userImage, setUserImage] = useState(currentUser?.image || "");
  const [workspaceName, setWorkspaceName] = useState(workspace?.name || "");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch("/api/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, userImage, workspaceName }),
      });

      if (!res.ok) {
        throw new Error("Failed to post configuration updates");
      }

      setSuccess(true);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      "🔄 CRITICAL WARNING:\nAre you absolutely sure you want to delete your SaaS cluster administrative mapping?\nThis deletes workspace records, team member tokens, and terminates Stripe subscriptions simulations."
    );

    if (!confirmation) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/settings/delete-account", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failure processing account deletion teardown");
      }

      // Hard redirect to welcome signup workflow
      onLogout();
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header info */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Workspace Configurations</h2>
        <p className="text-xs text-slate-500">Allelopathic alignment parameters, personal user details, and compliance resets.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-1.5 font-medium">
          <Check className="h-4 w-4" />
          Settings details updated successfully.
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#11131c] border border-slate-800 rounded-2xl p-6">
        
        {/* Left Column: Personal configuration */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-800/60 flex items-center gap-1.5">
            <User className="h-4 w-4 text-emerald-400" />
            Persona Fields
          </h3>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full User Username</label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-slate-300 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avatar Illustration URL (Simulated Upload)</label>
            <input
              type="text"
              placeholder="https://..."
              value={userImage}
              onChange={(e) => setUserImage(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-slate-300 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Right Column: Organization config */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-800/60 flex items-center gap-1.5">
            <Building className="h-4 w-4 text-emerald-400" />
            Organization Fields
          </h3>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workspace Cluster Title</label>
            <input
              type="text"
              required
              disabled={currentUser?.role === "MEMBER"}
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-slate-300 disabled:opacity-40 focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-4 text-[10px] text-slate-500 leading-normal">
            * Note: Members with Standard authorization levels do not possess permissions to edit the Corporate Workspace Title settings.
          </div>
        </div>

        <div className="md:col-span-2 pt-4 border-t border-slate-800/40 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition-all active:scale-[0.98] disabled:opacity-40 flex items-center gap-1.5"
          >
            {submitting ? (
              <span className="h-3 w-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Preserve updates
              </>
            )}
          </button>
        </div>

      </form>

      {/* Dangerous Teardown Panel */}
      <div className="bg-[#11131c] border border-rose-950/40 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 px-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md font-bold text-[9px] uppercase tracking-wide">Danger Area</span>
              <h3 className="text-sm font-semibold text-slate-100">Terminate Workspace Account</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              This completely resets your active session and discards user memberships, audit entries, and resets Simulated Stripe Customer indexes. This action cannot be reversed.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 border border-rose-500/20 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            {deleting ? (
              <span className="h-3 w-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Terminate Mapping
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
