# SaaS Dashboard

A multi-tenant SaaS admin console built with **React 19**, **Express**, and **Vite**. It demonstrates workspace switching, role-based access, onboarding, analytics dashboards, team invites, and subscription billing—with **Stripe** integration or a **local simulated checkout** when API keys are not configured.

![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)

---

## Features

| Area | What you get |
|------|----------------|
| **Authentication** | Sign in, register, sign out, and session restore via REST APIs |
| **Onboarding** | First-run wizard to name your workspace and complete profile setup |
| **Multi-tenancy** | Switch between workspaces; per-workspace subscription tier and members |
| **RBAC** | `OWNER`, `ADMIN`, and `MEMBER` roles with invite restrictions for admins/owners |
| **Analytics** | MRR, users, churn KPI cards; Recharts trends; activity audit log |
| **Billing** | Free, Pro (£9/mo), and Enterprise (£29/mo) plans; Stripe Checkout or simulated flow |
| **Settings** | Profile and organization updates; account deletion |
| **Webhooks** | Stripe subscription lifecycle handlers (`checkout.session.completed`, etc.) |

---

## Tech stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Motion, Lucide icons, Recharts
- **Backend:** Express 4 (single `server.ts`), in-memory data store for local development
- **Build:** Vite 6 (SPA) + esbuild (Node server bundle for production)
- **Payments:** Stripe SDK (optional)
- **Database (schema only):** Prisma + PostgreSQL models in `prisma/schema.prisma`—ready to wire; not connected to the running server yet

---

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- npm (comes with Node)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/saas-dashboard.git
cd saas-dashboard
npm install
```

### 2. Environment variables

Copy the example file and adjust as needed:

```bash
cp .env.example .env
```

For local development, defaults are enough: the app runs on port **3000** and uses **simulated billing** without Stripe keys.

### 3. Run in development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Demo login

Seed data is loaded in `server.ts`. Use any of these accounts with password **`password123`**:

| Email | Role | Notes |
|-------|------|--------|
| `admin@acme.com` | Owner | Acme workspace (Pro), onboarding complete |
| `sarah@acme.com` | Admin | Acme workspace |
| `ethan@acme.com` | Member | Acme workspace; onboarding not complete |

You can also **register** a new account; a personal workspace is created automatically.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Express + Vite dev server on port 3000 |
| `npm run build` | Build client (`dist/`) and server (`dist/server.cjs`) |
| `npm start` | Run production server (after `npm run build`) |
| `npm run preview` | Preview Vite production build only |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm run clean` | Remove `dist/` and legacy artifacts |

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_URL` | No | Public base URL for Stripe redirects (default: `http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | No | Stripe secret key; omit to use simulated checkout |
| `STRIPE_WEBHOOK_SECRET` | No | Webhook signing secret for `/api/webhooks/stripe` |
| `DATABASE_URL` | No | PostgreSQL URL when you connect Prisma |
| `NEXTAUTH_SECRET` | No | For future NextAuth integration (`src/lib/auth.ts`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | OAuth placeholders in `auth.ts` (not used by Express routes today) |

Never commit `.env` files. Only `.env.example` is tracked.

---

## Stripe setup (optional)

1. Create products/prices in the [Stripe Dashboard](https://dashboard.stripe.com/) or map your price IDs in `src/lib/stripe.ts` (`SUBSCRIPTION_PRICES`).
2. Set `STRIPE_SECRET_KEY` and `APP_URL` in `.env`.
3. Forward webhooks locally:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

Without Stripe keys, checkout redirects to `/billing/simulated-checkout`, which upgrades the workspace in memory.

---

## Project structure

```text
saas-dashboard/
├── server.ts              # Express API, in-memory DB, Stripe webhooks, Vite middleware
├── prisma/
│   └── schema.prisma      # Production-ready data model (not wired to server yet)
├── src/
│   ├── App.tsx            # Shell: auth guards, sidebar, tab routing
│   ├── components/        # Dashboard, Team, Billing, Settings, Login, Onboarding
│   ├── lib/
│   │   ├── stripe.ts      # Plans, Checkout, billing portal helpers
│   │   └── auth.ts        # NextAuth config (reference for future migration)
│   └── types.ts
├── vite.config.ts
└── package.json
```

---

## API overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/auth/session` | Current user, workspace, workspace list |
| `POST` | `/api/auth/signin` | Credential login |
| `POST` | `/api/auth/register` | New user + workspace |
| `POST` | `/api/auth/signout` | Clear session |
| `POST` | `/api/onboarding/complete` | Finish onboarding |
| `POST` | `/api/workspaces/select` | Switch active workspace |
| `GET` | `/api/dashboard/metrics` | KPIs, charts, activity logs |
| `POST` | `/api/workspace/members/invite` | Invite member (Owner/Admin) |
| `POST` | `/api/billing/checkout` | Create Stripe or simulated checkout URL |
| `POST` | `/api/billing/simulated-complete` | Complete simulated upgrade |
| `POST` | `/api/settings/update` | Profile / workspace settings |
| `POST` | `/api/settings/delete-account` | Delete user |
| `POST` | `/api/webhooks/stripe` | Stripe event handler (raw body) |

---

## Production build

```bash
npm run build
NODE_ENV=production npm start
```

The server serves static assets from `dist/` and falls back to `index.html` for client-side routing.

---

## Architecture notes

- **In-memory store:** User, workspace, and activity data live in `server.ts` arrays. Data resets when the server restarts. This keeps the repo easy to clone and demo without PostgreSQL.
- **Prisma schema:** Models for `User`, `Workspace`, `WorkspaceMember`, `ActivityLog`, and NextAuth tables are defined for a production path. Connecting Prisma replaces the in-memory layer.
- **Session model:** A single global session per server process (suitable for demos). Production apps should use cookies/JWT and a real session store.
- **Security:** Passwords are stored in plain text in the demo layer only. Use bcrypt (or similar) and HTTPS before any real deployment.

---

## Screens & navigation

After login and onboarding:

1. **SaaS Telemetry** — metrics and charts  
2. **Teammate Access** — members and invites  
3. **Plans & Ledger** — subscription tiers and checkout  
4. **Configurations** — profile, workspace, account deletion  

Use the **Active Tenant Cluster** dropdown in the sidebar to switch workspaces (e.g. Acme vs Personal).

---

## Contributing

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/my-change`)  
3. Commit your changes  
4. Open a pull request  

Issues and suggestions are welcome.

---

## License

Source files are marked **Apache-2.0** (`SPDX-License-Identifier: Apache-2.0`). See the license headers in individual files for details.

---

## Acknowledgments

Originally scaffolded from [Google AI Studio](https://ai.studio). The app has been extended into a standalone Express + React SaaS dashboard suitable for portfolio and learning use.
