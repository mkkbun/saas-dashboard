/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserPlus, Mail, Shield, Check, ShieldCheck, HelpCircle } from "lucide-react";
import { UserSession } from "../types.js";

interface TeamViewProps {
  currentUser: UserSession | null;
  onRefresh: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  status: "ACTIVE" | "PENDING";
}

export default function TeamView({ currentUser, onRefresh }: TeamViewProps) {
  const [invitedEmail, setInvitedEmail] = useState("");
  const [invitedRole, setInvitedRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Simulated live workspace team list derived from the current operational workspace DB
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: "usr-admin-01",
      name: "Alexander Mercer",
      email: "admin@acme.com",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      role: "OWNER",
      status: "ACTIVE",
    },
    {
      id: "usr-member-02",
      name: "Sarah Jenkins",
      email: "sarah@acme.com",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      role: "ADMIN",
      status: "ACTIVE",
    },
    {
      id: "usr-member-03",
      name: "Ethan Wright",
      email: "ethan@acme.com",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      role: "MEMBER",
      status: "ACTIVE",
    }
  ]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setInviting(true);

    if (!invitedEmail.trim() || !invitedEmail.includes("@")) {
      setError("Please specify a valid academic or professional email address");
      setInviting(false);
      return;
    }

    try {
      const res = await fetch("/api/workspace/members/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invitedEmail, role: invitedRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to issue workspace membership token");
      }

      // Append locally to keep prompt response state immediate
      const newMember: TeamMember = {
        id: `usr-inv-${Date.now()}`,
        name: invitedEmail.split("@")[0].toUpperCase(),
        email: invitedEmail,
        image: `https://api.dicebear.com/7.x/initials/svg?seed=${invitedEmail}`,
        role: invitedRole,
        status: "PENDING",
      };

      setMembers((prev) => [...prev, newMember]);
      setSuccess(`🎉 Successful Invitation! Sent an authorization link to ${invitedEmail}.`);
      setInvitedEmail("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Team & Workspace Memberships</h2>
        <p className="text-xs text-slate-500">Add teammates, assign security access permissions, and audit membership lists.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Members Roster grid */}
        <div className="lg:col-span-2 bg-[#11131c] border border-slate-800/80 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 pb-2 border-b border-slate-800/40">Active workspace roster</h3>

          <div className="space-y-4">
            {members.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between p-3.5 bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/60 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-9 w-9 rounded-full object-cover border border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-200">{member.name}</p>
                      {member.status === "PENDING" && (
                        <span className="text-[9px] font-bold uppercase py-0.5 px-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Role Badge */}
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-lg border ${
                    member.role === "OWNER" 
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                      : member.role === "ADMIN" 
                      ? "bg-blue-500/10 text-sky-400 border-blue-500/20" 
                      : "bg-slate-500/10 text-slate-400 border-slate-800"
                  }`}>
                    <Shield className="h-3 w-3" />
                    {member.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Member module with RBAC warnings */}
        <div className="bg-[#11131c] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-800/40 mb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-emerald-400" />
                Invite Teammate
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Emanate secure authorization codes to emails</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl mb-4 flex items-start gap-1.5 font-medium">
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collaborator Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="teammate@acme.com"
                    value={invitedEmail}
                    onChange={(e) => setInvitedEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["MEMBER", "ADMIN"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInvitedRole(r)}
                      className={`py-2 px-3 border rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        invitedRole === r
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                          : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400"
                      }`}
                    >
                      {r === "ADMIN" ? "Admin" : "Member"}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={inviting || currentUser?.role === "MEMBER"}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs transition-colors mt-6 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {inviting ? (
                  <span className="h-3 w-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    Dispatch Invite Token
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RBAC Notice */}
          <div className="pt-4 border-t border-slate-800/40 mt-6 flex gap-2 text-[10px] text-slate-600 leading-normal">
            <ShieldCheck className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
            <p>
              Your active workspace membership level controls invites. Standard Members are blocked from sending subscription or roles authorizations.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
