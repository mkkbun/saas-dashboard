/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Stripe from "stripe";

// Subscription constants
export const SUBSCRIPTION_PRICES = {
  FREE: {
    id: "price_free",
    name: "Free",
    amount: 0,
    currency: "GBP",
    interval: "month",
    features: [
      "Up to 3 team members",
      "Basic workspace reporting",
      "10 GB secure storage",
      "Standard community support",
    ],
  },
  PRO: {
    id: "price_pro_99_mo",
    name: "Pro",
    amount: 900, // £9.00
    currency: "GBP",
    interval: "month",
    features: [
      "Unlimited team members",
      "Advanced real-time metrics & Recharts",
      "100 GB high-speed storage",
      "Priority 24/7 Slack & Email support",
      "Custom integrations and webhooks",
    ],
  },
  ENTERPRISE: {
    id: "price_enterprise_29_mo",
    name: "Enterprise",
    amount: 2900, // £29.00
    currency: "GBP",
    interval: "month",
    features: [
      "Custom Multi-tenant structures",
      "Enterprise audit logs & compliance tracking",
      "1 TB dedicated storage & backups",
      "Dedicated account manager",
      "Custom SLA & custom contracts",
    ],
  },
};

let stripeClient: Stripe | null = null;

/**
 * Lazy initialization of the Stripe instance.
 * Prevents application startup failure when Stripe environment variables are omitted.
 */
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn("⚠️ STRIPE_SECRET_KEY environment variable is not defined. Using high-fidelity subscription simulation mode.");
      // Return a wrapper or throw during call. We create a placeholder client to bypass TS, but we will catch missing keys lazily during handler execution.
      stripeClient = new Stripe("sk_test_mock_stripe_key_never_leaked_to_client_side_12345", {
        apiVersion: "2025-02-12-preview" as any,
      });
    } else {
      stripeClient = new Stripe(key, {
        apiVersion: "2025-02-12-preview" as any,
      });
    }
  }
  return stripeClient;
}

/**
 * Creates a checkout session URL for Stripe subscription activation.
 */
export async function createBillingSession({
  workspaceId,
  customerEmail,
  priceId,
  successUrl,
  cancelUrl,
}: {
  workspaceId: String;
  customerEmail: String;
  priceId: String;
  successUrl: String;
  cancelUrl: String;
}): Promise<String> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    // Return simulator session url
    const tier = priceId === "price_enterprise_29_mo" ? "ENTERPRISE" : priceId === "price_pro_99_mo" ? "PRO" : "FREE";
    return `/billing/simulated-checkout?workspaceId=${workspaceId}&pricingTier=${tier}&successUrl=${encodeURIComponent(successUrl as string)}&cancelUrl=${encodeURIComponent(cancelUrl as string)}`;
  }

  const stripe = getStripe();

  // 1. Search for existing stripe customer mapped to this workspace details:
  // (In production, load workspace from database and look for stripeCustomerId)
  let customerId: string | undefined;

  // Create workspace metadata to map on Stripe events securely
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    billing_address_collection: "required",
    customer_email: customerEmail as string,
    line_items: [
      {
        price: priceId as string,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl as string,
    cancel_url: cancelUrl as string,
    metadata: {
      workspaceId: workspaceId as string,
    },
    subscription_data: {
      metadata: {
        workspaceId: workspaceId as string,
      },
    },
  });

  if (!session.url) {
    throw new Error("Failed to construct subscription checkout session");
  }

  return session.url;
}

/**
 * Generates Stripe billing customer portal configurations for users to cancel, upgrade or update billing.
 */
export async function createPortalSession({
  stripeCustomerId,
  returnUrl,
}: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<string> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return `/billing/simulated-portal?returnUrl=${encodeURIComponent(returnUrl)}`;
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}
