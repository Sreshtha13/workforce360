import crypto from "node:crypto";
import Stripe from "stripe";
import Razorpay from "razorpay";
import { env } from "../lib/env";
import { AppError } from "../lib/app-error";

/**
 * Thin wrapper around Stripe + Razorpay SDKs. All secret keys stay in this
 * backend service — the frontend only ever receives a publishable key and a
 * checkout session reference (id/url) via the finance controller.
 */

let stripeClient: Stripe | null = null;
function getStripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError("STRIPE_NOT_CONFIGURED", "Stripe is not configured on this server", 503);
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

let razorpayClient: Razorpay | null = null;
function getRazorpayClient(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError("RAZORPAY_NOT_CONFIGURED", "Razorpay is not configured on this server", 503);
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
}

export type CheckoutSessionResult = {
  provider: "STRIPE" | "RAZORPAY";
  sessionId: string;
  /** Stripe: hosted Checkout URL to redirect the browser to. */
  checkoutUrl?: string;
  /** Razorpay: order id + amount/currency + publishable key id for Razorpay Checkout.js on the frontend. */
  razorpayOrderId?: string;
  amount: number;
  currency: string;
  publishableKey?: string;
};

export class PaymentGatewayService {
  /** Client-safe config (publishable keys only — never secrets). */
  getPublicConfig() {
    return {
      stripePublishableKey: env.STRIPE_PUBLISHABLE_KEY ?? null,
      razorpayKeyId: env.RAZORPAY_KEY_ID ?? null,
    };
  }

  async createStripeCheckoutSession(input: {
    invoiceId: string;
    amount: number;
    currency: string;
    description: string;
  }): Promise<CheckoutSessionResult> {
    const stripe = getStripeClient();
    const baseUrl = env.APP_PUBLIC_BASE_URL;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: Math.round(input.amount * 100),
            product_data: { name: input.description },
          },
          quantity: 1,
        },
      ],
      metadata: { invoiceId: input.invoiceId },
      success_url: `${baseUrl}/finance/invoices/${input.invoiceId}?payment=success`,
      cancel_url: `${baseUrl}/finance/invoices/${input.invoiceId}?payment=cancelled`,
    });

    return {
      provider: "STRIPE",
      sessionId: session.id,
      checkoutUrl: session.url ?? undefined,
      amount: input.amount,
      currency: input.currency,
      publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    };
  }

  async createRazorpayOrder(input: {
    invoiceId: string;
    amount: number;
    currency: string;
  }): Promise<CheckoutSessionResult> {
    const razorpay = getRazorpayClient();

    const order = await razorpay.orders.create({
      amount: Math.round(input.amount * 100),
      currency: input.currency.toUpperCase(),
      receipt: `invoice_${input.invoiceId}`,
      notes: { invoiceId: input.invoiceId },
    });

    return {
      provider: "RAZORPAY",
      sessionId: order.id,
      razorpayOrderId: order.id,
      amount: input.amount,
      currency: input.currency,
      publishableKey: env.RAZORPAY_KEY_ID,
    };
  }

  /** Verifies and parses a Stripe webhook request body (must be the raw, unparsed body). */
  verifyStripeWebhook(rawBody: Buffer, signature: string): Stripe.Event {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new AppError("STRIPE_NOT_CONFIGURED", "Stripe webhook secret is not configured", 503);
    }
    const stripe = getStripeClient();
    return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  }

  /** Verifies a Razorpay webhook signature (HMAC-SHA256 over the raw body). */
  verifyRazorpayWebhookSignature(rawBody: Buffer, signature: string): boolean {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      throw new AppError("RAZORPAY_NOT_CONFIGURED", "Razorpay webhook secret is not configured", 503);
    }
    const expected = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signature || "");
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }
}

export const paymentGatewayService = new PaymentGatewayService();
