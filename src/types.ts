/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Type Definitions for Multi-Tenant SaaS Interface

export type Role = "OWNER" | "ADMIN" | "MEMBER";

export type SubscriptionTier = "FREE" | "PRO" | "ENTERPRISE";

export type SubscriptionStatus = "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: Role;
  onboardingCompleted: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
}

export interface ActivityLog {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface DashboardMetrics {
  cards: {
    mrr: string;
    activeUsers: string;
    mrrChange: string;
    usersChange: string;
    churnRate: string;
    churnChange: string;
    membersCount: number;
  };
  chartData: Array<{
    name: string;
    Users: number;
    MRR: number;
    Tasks: number;
  }>;
  activityLogs: ActivityLog[];
}
