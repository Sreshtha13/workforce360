import type { Request, Response } from "express";
import Stripe from "stripe";
import { financeService } from "../services/finance.service";
import { paymentGatewayService } from "../services/payment-gateway.service";

/**
 * Stripe/Razorpay webhook handlers. Both must receive the *raw* request body
 * (registered before express.json() in app.ts) so the signature can be verified.
 * These endpoints are unauthenticated by design (the provider calls them
 * server-to-server) — trust is established purely via signature verification.
 */
export class PaymentWebhookController {
  stripeWebhook = async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    let event: Stripe.Event;
    try {
      event = paymentGatewayService.verifyStripeWebhook(req.body as Buffer, signature);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid signature" });
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const paymentIntentId =
            typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
          await financeService.handleStripeCheckoutCompleted(session.id, paymentIntentId);
          break;
        }
        case "checkout.session.expired": {
          const session = event.data.object as Stripe.Checkout.Session;
          await financeService.handleStripeCheckoutFailed(session.id);
          break;
        }
        default:
          break;
      }
      res.status(200).json({ received: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Webhook handler failed" });
    }
  };

  razorpayWebhook = async (req: Request, res: Response) => {
    const signature = req.headers["x-razorpay-signature"];
    if (typeof signature !== "string") {
      res.status(400).json({ error: "Missing x-razorpay-signature header" });
      return;
    }

    const rawBody = req.body as Buffer;
    let valid: boolean;
    try {
      valid = paymentGatewayService.verifyRazorpayWebhookSignature(rawBody, signature);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid signature" });
      return;
    }
    if (!valid) {
      res.status(400).json({ error: "Signature verification failed" });
      return;
    }

    try {
      const event = JSON.parse(rawBody.toString("utf8")) as {
        event: string;
        payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
      };

      const orderId = event.payload?.payment?.entity?.order_id;
      const paymentId = event.payload?.payment?.entity?.id;

      if (event.event === "payment.captured" && orderId) {
        await financeService.handleRazorpayPaymentCaptured(orderId, paymentId);
      } else if (event.event === "payment.failed" && orderId) {
        await financeService.handleRazorpayPaymentFailed(orderId);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Webhook handler failed" });
    }
  };
}
