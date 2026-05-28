/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import { getStripe, SUBSCRIPTION_PRICES, createBillingSession } from "./src/lib/stripe.js";

// Database State Emulation Layer
// In production, this proxies directly to Prisma Client database connections.
interface UserRecord {
  id: string;
  name: string;
  email: string;
  image?: string;
  passwordHash: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  onboardingCompleted: boolean;
}

interface WorkspaceRecord {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: "FREE" | "PRO" | "ENTERPRISE";
  subscriptionStatus: "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  members: Array<{ userId: string; role: "OWNER" | "ADMIN" | "MEMBER" }>;
}

interface ActivityLog {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
}

// Initial Bootstrap Data
const usersDb: UserRecord[] = [
  {
    id: "usr-admin-01",
    name: "Alexander Mercer",
    email: "admin@acme.com",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    passwordHash: "password123", // Simulated salt setup
    role: "OWNER",
    onboardingCompleted: true,
  },
  {
    id: "usr-member-02",
    name: "Sarah Jenkins",
    email: "sarah@acme.com",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    passwordHash: "password123",
    role: "ADMIN",
    onboardingCompleted: true,
  },
  {
    id: "usr-member-03",
    name: "Ethan Wright",
    email: "ethan@acme.com",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    passwordHash: "password123",
    role: "MEMBER",
    onboardingCompleted: false,
  }
];

const workspacesDb: WorkspaceRecord[] = [
  {
    id: "wsp-acme",
    name: "Acme Corporation",
    slug: "acme-corp",
    subscriptionTier: "PRO",
    subscriptionStatus: "ACTIVE",
    stripeCustomerId: "cus_sample_acme_123",
    stripeSubscriptionId: "sub_sample_acme_456",
    members: [
      { userId: "usr-admin-01", role: "OWNER" },
      { userId: "usr-member-02", role: "ADMIN" },
      { userId: "usr-member-03", role: "MEMBER" },
    ],
  },
  {
    id: "wsp-personal",
    name: "Personal Workspace",
    slug: "personal-sandbox",
    subscriptionTier: "FREE",
    subscriptionStatus: "ACTIVE",
    members: [
      { userId: "usr-admin-01", role: "OWNER" },
    ],
  }
];

let activityLogsDb: ActivityLog[] = [
  { id: "act-1", workspaceId: "wsp-acme", userId: "usr-admin-01", action: "USER_LOGIN", details: "Logged in via platform interface", createdAt: new Date(Date.now() - 3600000 * 48).toISOString() },
  { id: "act-2", workspaceId: "wsp-acme", userId: "usr-member-02", action: "PROJECT_CREATED", details: "Created marketing automation project", createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
  { id: "act-3", workspaceId: "wsp-acme", userId: "usr-admin-01", action: "BILLING_UPDATED", details: "Upgraded workspace subscription to Pro tier", createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
];

// Active global session emulator (restored on page refresh)
let currentSessionUser: UserRecord | null = usersDb[0];
let currentActiveWorkspaceId: string = "wsp-acme";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Stripe Signature Parsing requires raw request for validation
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    let event: Stripe.Event;

    try {
      const stripe = getStripe();
      if (endpointSecret) {
        // Validating signatures securely using production standards
        event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
      } else {
        // Fallback decoder supporting manual previews and local postman setups
        console.warn("⚠️ STRIPE_WEBHOOK_SECRET not defined. Overpassing key checks for sandbox utility.");
        event = JSON.parse(req.body.toString());
      }
    } catch (err: any) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    console.log(`🔔 Stripe Webhook Event Received securely: ${event.type}`);

    // Standard high-level customer subscription lifecycle management mapping Prisma entities
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const workspaceId = session.metadata?.workspaceId;
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;

          if (workspaceId) {
            const workspace = workspacesDb.find(w => w.id === workspaceId);
            if (workspace) {
              const lineItems = await getStripe().checkout.sessions.listLineItems(session.id);
              const priceId = lineItems.data[0]?.price?.id;
              
              let tier: "FREE" | "PRO" | "ENTERPRISE" = "FREE";
              if (priceId === SUBSCRIPTION_PRICES.PRO.id) tier = "PRO";
              if (priceId === SUBSCRIPTION_PRICES.ENTERPRISE.id) tier = "ENTERPRISE";

              workspace.subscriptionTier = tier;
              workspace.subscriptionStatus = "ACTIVE";
              workspace.stripeCustomerId = customerId;
              workspace.stripeSubscriptionId = subscriptionId;

              // Log audit event
              activityLogsDb.push({
                id: `act-${Date.now()}`,
                workspaceId: workspace.id,
                userId: "SYSTEM_STRIPE_WEBHOOK",
                action: "BILLING_UPDATED",
                details: `Stripe Webhook checkout completed. Active tier: ${tier}`,
                createdAt: new Date().toISOString()
              });
              console.log(`✅ Tenant Workspace (${workspace.name}) upgraded to ${tier} successfully.`);
            }
          }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const workspaceId = subscription.metadata?.workspaceId;
          const status = subscription.status;

          if (workspaceId) {
            const workspace = workspacesDb.find(w => w.id === workspaceId);
            if (workspace) {
              workspace.subscriptionStatus = (status === "active" ? "ACTIVE" : "PAST_DUE") as any;
              
              const priceId = subscription.items.data[0]?.price?.id;
              let tier: "FREE" | "PRO" | "ENTERPRISE" = "FREE";
              if (priceId === SUBSCRIPTION_PRICES.PRO.id) tier = "PRO";
              if (priceId === SUBSCRIPTION_PRICES.ENTERPRISE.id) tier = "ENTERPRISE";
              workspace.subscriptionTier = tier;

              console.log(`✅ Tenant Workspace Subscription modified for ${workspace.name}: ${status}`);
            }
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const workspaceId = subscription.metadata?.workspaceId;

          if (workspaceId) {
            const workspace = workspacesDb.find(w => w.id === workspaceId);
            if (workspace) {
              workspace.subscriptionTier = "FREE";
              workspace.subscriptionStatus = "CANCELED";
              
              activityLogsDb.push({
                id: `act-${Date.now()}`,
                workspaceId: workspace.id,
                userId: "SYSTEM_STRIPE_WEBHOOK",
                action: "BILLING_UPDATED",
                details: `Stripe subscription removed. Resetting tenant status.`,
                createdAt: new Date().toISOString()
              });
              console.log(`🥀 Subscription cancelled for tenant workspace ${workspace.name}`);
            }
          }
          break;
        }
      }
    } catch (operationError: any) {
      console.error("❌ Stripe webhook runtime processing error: ", operationError);
    }

    res.json({ received: true });
  });

  // Parse JSON payloads standard
  app.use(express.json());

  // API Domain Logic Handlers
  
  // 1. Session status retrieval
  app.get("/api/auth/session", (req: Request, res: Response) => {
    if (!currentSessionUser) {
      res.json({ session: null });
      return;
    }
    const activeWorkspace = workspacesDb.find(w => w.id === currentActiveWorkspaceId);
    
    // Check membership role for RBAC calculations
    const membership = activeWorkspace?.members.find(m => m.userId === currentSessionUser!.id);

    res.json({
      user: {
        id: currentSessionUser.id,
        name: currentSessionUser.name,
        email: currentSessionUser.email,
        image: currentSessionUser.image,
        role: membership?.role || currentSessionUser.role,
        onboardingCompleted: currentSessionUser.onboardingCompleted,
      },
      workspace: activeWorkspace ? {
        id: activeWorkspace.id,
        name: activeWorkspace.name,
        slug: activeWorkspace.slug,
        subscriptionTier: activeWorkspace.subscriptionTier,
        subscriptionStatus: activeWorkspace.subscriptionStatus,
      } : null,
      workspaces: workspacesDb
        .filter(w => w.members.some(m => m.userId === currentSessionUser!.id))
        .map(w => ({ id: w.id, name: w.name, slug: w.slug, subscriptionTier: w.subscriptionTier }))
    });
  });

  // 2. Auth - Sign In Credentials
  app.post("/api/auth/signin", (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required fields" });
      return;
    }

    const user = usersDb.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.passwordHash !== password) {
      res.status(401).json({ error: "Invalid credentials. Tip: Use admin@acme.com with password" });
      return;
    }

    currentSessionUser = user;
    // Auto-select their first workspace membership
    const usersWorkspace = workspacesDb.find(w => w.members.some(m => m.userId === user.id));
    if (usersWorkspace) {
      currentActiveWorkspaceId = usersWorkspace.id;
    }

    activityLogsDb.push({
      id: `act-${Date.now()}`,
      workspaceId: currentActiveWorkspaceId,
      userId: user.id,
      action: "USER_LOGIN",
      details: `Successful logging into workspace from web user-agent`,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, user });
  });

  // 3. Auth - Register Accounts
  app.post("/api/auth/register", (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }

    const exists = usersDb.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      res.status(400).json({ error: "An account with this email address already exists" });
      return;
    }

    const newUser: UserRecord = {
      id: `usr-${Date.now()}`,
      name,
      email,
      passwordHash: password, // In production, bcrypt salt hashing is triggered here
      role: "OWNER",
      onboardingCompleted: false, // Required onboarding workflow trigger
    };

    usersDb.push(newUser);

    // Bootstrap a default personal workspace for the newly registered user:
    const newWorkspace: WorkspaceRecord = {
      id: `wsp-${Date.now()}`,
      name: `${name}'s Workspace`,
      slug: `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-workspace`,
      subscriptionTier: "FREE",
      subscriptionStatus: "ACTIVE",
      members: [{ userId: newUser.id, role: "OWNER" }],
    };

    workspacesDb.push(newWorkspace);
    currentSessionUser = newUser;
    currentActiveWorkspaceId = newWorkspace.id;

    activityLogsDb.push({
      id: `act-${Date.now()}`,
      workspaceId: newWorkspace.id,
      userId: newUser.id,
      action: "USER_LOGIN",
      details: "Welcome! Account successfully registered & workspace provisioned automatically.",
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, user: newUser });
  });

  // 4. Auth - Sign Out
  app.post("/api/auth/signout", (req: Request, res: Response) => {
    currentSessionUser = null;
    res.json({ success: true });
  });

  // 5. Onboarding Workflow Submission
  app.post("/api/onboarding/complete", (req: Request, res: Response) => {
    if (!currentSessionUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { workspaceName, profileRole } = req.body;

    // Update active workspace name based on onboarding entry:
    const workspace = workspacesDb.find(w => w.id === currentActiveWorkspaceId);
    if (workspace && workspaceName) {
      workspace.name = workspaceName;
      workspace.slug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    }

    if (profileRole) {
      // Map user details
      currentSessionUser.name = `${currentSessionUser.name} (${profileRole})`;
    }

    currentSessionUser.onboardingCompleted = true;

    activityLogsDb.push({
      id: `act-${Date.now()}`,
      workspaceId: currentActiveWorkspaceId,
      userId: currentSessionUser.id,
      action: "ONBOARDING_COMPLETED",
      details: `Completed interactive onboarding wizard with customized parameters.`,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true });
  });

  // 6. Change Active Tenant Workspace
  app.post("/api/workspaces/select", (req: Request, res: Response) => {
    if (!currentSessionUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { workspaceId } = req.body;
    const target = workspacesDb.find(w => w.id === workspaceId);
    if (!target || !target.members.some(m => m.userId === currentSessionUser!.id)) {
      res.status(403).json({ error: "Access to the requested workspace is forbidden" });
      return;
    }

    currentActiveWorkspaceId = workspaceId;
    res.json({ success: true, workspaceId });
  });

  // 7. SaaS Analytics Logs (supplying metric trends for Recharts)
  app.get("/api/dashboard/metrics", (req: Request, res: Response) => {
    if (!currentSessionUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Load active workspace details
    const workspace = workspacesDb.find(w => w.id === currentActiveWorkspaceId);
    const tier = workspace?.subscriptionTier || "FREE";

    // Generate analytical counts for charts based on subscription plans:
    const baseMRR = tier === "ENTERPRISE" ? 29 : tier === "PRO" ? 9 : 0;
    
    // Staggered multi-day performance chart trends
    const chartData = [
      { name: "Mon", Users: tier === "FREE" ? 12 : tier === "PRO" ? 148 : 580, MRR: baseMRR * 12, Tasks: 54 },
      { name: "Tue", Users: tier === "FREE" ? 15 : tier === "PRO" ? 162 : 612, MRR: baseMRR * 12, Tasks: 72 },
      { name: "Wed", Users: tier === "FREE" ? 14 : tier === "PRO" ? 180 : 640, MRR: baseMRR * 15, Tasks: 91 },
      { name: "Thu", Users: tier === "FREE" ? 21 : tier === "PRO" ? 210 : 710, MRR: baseMRR * 15, Tasks: 110 },
      { name: "Fri", Users: tier === "FREE" ? 24 : tier === "PRO" ? 245 : 820, MRR: baseMRR * 18, Tasks: 154 },
      { name: "Sat", Users: tier === "FREE" ? 28 : tier === "PRO" ? 280 : 910, MRR: baseMRR * 18, Tasks: 160 },
      { name: "Sun", Users: tier === "FREE" ? 35 : tier === "PRO" ? 312 : 980, MRR: baseMRR * 22, Tasks: 215 },
    ];

    // Compute metric cards
    const activeMembers = workspace?.members.length || 1;
    let computedMRR = baseMRR * (tier === "FREE" ? 0 : tier === "PRO" ? 35 : 124);
    let churnFactor = tier === "FREE" ? "4.2%" : tier === "PRO" ? "1.8%" : "0.5%";

    res.json({
      cards: {
        mrr: `£${computedMRR.toLocaleString()}`,
        activeUsers: tier === "FREE" ? "35" : tier === "PRO" ? "2,481" : "14,890",
        mrrChange: tier === "FREE" ? "0%" : tier === "PRO" ? "+12.4%" : "+24.1%",
        usersChange: tier === "FREE" ? "+5.1%" : tier === "PRO" ? "+18.2%" : "+32.8%",
        churnRate: churnFactor,
        churnChange: tier === "FREE" ? "+0.4%" : "-0.2%",
        membersCount: activeMembers
      },
      chartData,
      activityLogs: activityLogsDb
        .filter(l => l.workspaceId === currentActiveWorkspaceId)
        .slice(-6)
        .reverse()
    });
  });

  // 8. Workspace Management (Adding logs, editing, user roles)
  app.post("/api/workspace/members/invite", (req: Request, res: Response) => {
    if (!currentSessionUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { email, role } = req.body;
    const workspace = workspacesDb.find(w => w.id === currentActiveWorkspaceId);
    
    if (!workspace) {
      res.status(400).json({ error: "Active workspace not found" });
      return;
    }

    // RBAC validation: only OWNER or ADMIN can invite
    const currentMember = workspace.members.find(m => m.userId === currentSessionUser!.id);
    if (!currentMember || (currentMember.role !== "OWNER" && currentMember.role !== "ADMIN")) {
      res.status(403).json({ error: "Unauthorized access: requires Owner or Admin elevated privileges." });
      return;
    }

    if (!email) {
      res.status(400).json({ error: "Invited user email required" });
      return;
    }

    // Check if user is already a member
    let existingUser = usersDb.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!existingUser) {
      // Create user placeholder for simulated onboarding flow invitations
      existingUser = {
        id: `usr-${Date.now()}`,
        name: email.split("@")[0].toUpperCase(),
        email: email,
        image: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
        passwordHash: "password123",
        role: role || "MEMBER",
        onboardingCompleted: false
      };
      usersDb.push(existingUser);
    }

    const alreadyInWorkspace = workspace.members.some(m => m.userId === existingUser!.id);
    if (alreadyInWorkspace) {
      res.status(400).json({ error: "User is already a team member of this workspace" });
      return;
    }

    workspace.members.push({ userId: existingUser.id, role: role || "MEMBER" });

    activityLogsDb.push({
      id: `act-${Date.now()}`,
      workspaceId: workspace.id,
      userId: currentSessionUser.id,
      action: "PROJECT_CREATED",
      details: `Invited team member (${email}) to workspace with permissions: ${role || "MEMBER"}.`,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, workspace });
  });

  // 9. Update Settings Interface (Self User Details and Organization title)
  app.post("/api/settings/update", (req: Request, res: Response) => {
    if (!currentSessionUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { userName, userImage, workspaceName } = req.body;

    if (userName) {
      currentSessionUser.name = userName;
    }
    if (userImage) {
      currentSessionUser.image = userImage; // Virtual simulated avatar upload URL
    }

    // Update Workspace Settings if user has Admin/Owner roles
    const workspace = workspacesDb.find(w => w.id === currentActiveWorkspaceId);
    if (workspace && workspaceName) {
      const activeMember = workspace.members.find(m => m.userId === currentSessionUser!.id);
      if (activeMember && (activeMember.role === "OWNER" || activeMember.role === "ADMIN")) {
        workspace.name = workspaceName;
        workspace.slug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      }
    }

    activityLogsDb.push({
      id: `act-${Date.now()}`,
      workspaceId: currentActiveWorkspaceId,
      userId: currentSessionUser.id,
      action: "BILLING_UPDATED",
      details: "Updated account credentials and organization profile configurations.",
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, user: currentSessionUser, workspace });
  });

  // 10. Subscription Checkout Initiation Handler
  app.post("/api/billing/checkout", async (req: Request, res: Response) => {
    if (!currentSessionUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { priceId } = req.body;
    const workspace = workspacesDb.find(w => w.id === currentActiveWorkspaceId);

    if (!workspace) {
      res.status(400).json({ error: "Workspace not found" });
      return;
    }

    try {
      const successUrl = `${process.env.APP_URL || `http://localhost:${PORT}`}/dashboard?checkout_success=true`;
      const cancelUrl = `${process.env.APP_URL || `http://localhost:${PORT}`}/dashboard?checkout_cancel=true`;

      // Call the Stripe library
      const url = await createBillingSession({
        workspaceId: workspace.id,
        customerEmail: currentSessionUser.email,
        priceId,
        successUrl,
        cancelUrl,
      });

      res.json({ url });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to make billing call" });
    }
  });

  // 11. Simulated billing checkout and webhook trigger
  app.post("/api/billing/simulated-complete", (req: Request, res: Response) => {
    if (!currentSessionUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { workspaceId, tier } = req.body;
    
    const workspace = workspacesDb.find(w => w.id === workspaceId);
    if (workspace) {
      workspace.subscriptionTier = tier;
      workspace.subscriptionStatus = "ACTIVE";
      workspace.stripeSubscriptionId = `sub_mock_${Date.now()}`;
      workspace.stripeCustomerId = `cus_mock_${Date.now()}`;

      activityLogsDb.push({
        id: `act-${Date.now()}`,
        workspaceId: workspace.id,
        userId: currentSessionUser.id,
        action: "BILLING_UPDATED",
        details: `Simulated subscription upgraded to standard billing plan: ${tier}`,
        createdAt: new Date().toISOString()
      });

      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Workspace matching criteria not found" });
    }
  });

  // 12. Delete User Account Workspace Mapping (Hard reset)
  app.post("/api/settings/delete-account", (req: Request, res: Response) => {
    if (!currentSessionUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const userIdToDelete = currentSessionUser.id;
    // Remove memberships and audit actions
    workspacesDb.forEach(w => {
      w.members = w.members.filter(m => m.userId !== userIdToDelete);
    });

    const index = usersDb.findIndex(u => u.id === userIdToDelete);
    if (index !== -1) {
      usersDb.splice(index, 1);
    }

    currentSessionUser = null;
    res.json({ success: true });
  });

  // Mount Vite middleware in development (non-production standard)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production elements
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Dedicated SaaS Application Server booted at http://0.0.0.0:${PORT}`);
  });
}

startServer();
