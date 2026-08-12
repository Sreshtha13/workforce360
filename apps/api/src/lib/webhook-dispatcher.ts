import crypto from "node:crypto";
import { prisma } from "../lib/prisma";

const SUBSCRIPTIONS_KEY = "webhook.subscriptions";

export type WebhookSubscription = {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: string;
};

async function readSubscriptions(): Promise<WebhookSubscription[]> {
  const row = await prisma.systemSetting.findUnique({ where: { key: SUBSCRIPTIONS_KEY } });
  if (!row?.value) return [];
  try {
    return JSON.parse(row.value) as WebhookSubscription[];
  } catch {
    return [];
  }
}

async function writeSubscriptions(subscriptions: WebhookSubscription[]): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: SUBSCRIPTIONS_KEY },
    create: {
      key: SUBSCRIPTIONS_KEY,
      value: JSON.stringify(subscriptions),
      category: "integrations",
      description: "Outbound webhook subscriptions for future connectors",
      isSecret: true,
    },
    update: { value: JSON.stringify(subscriptions) },
  });
}

export async function listWebhookSubscriptions(): Promise<Omit<WebhookSubscription, "secret">[]> {
  const subs = await readSubscriptions();
  return subs.map(({ secret: _secret, ...rest }) => rest);
}

export async function createWebhookSubscription(input: {
  url: string;
  events: string[];
}): Promise<Omit<WebhookSubscription, "secret">> {
  const subs = await readSubscriptions();
  const subscription: WebhookSubscription = {
    id: crypto.randomUUID(),
    url: input.url,
    events: input.events,
    secret: crypto.randomBytes(32).toString("hex"),
    active: true,
    createdAt: new Date().toISOString(),
  };
  subs.push(subscription);
  await writeSubscriptions(subs);
  const { secret: _secret, ...publicSub } = subscription;
  return publicSub;
}

export async function deleteWebhookSubscription(id: string): Promise<boolean> {
  const subs = await readSubscriptions();
  const filtered = subs.filter((s) => s.id !== id);
  if (filtered.length === subs.length) return false;
  await writeSubscriptions(filtered);
  return true;
}

/**
 * Dispatches an event to all active webhook subscriptions that listen for it.
 * Failures are logged but do not throw — integrations must not block core flows.
 */
export async function dispatchWebhookEvent(event: string, payload: Record<string, unknown>): Promise<void> {
  const subs = await readSubscriptions();
  const targets = subs.filter((s) => s.active && s.events.includes(event));
  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });

  for (const sub of targets) {
    try {
      const signature = crypto.createHmac("sha256", sub.secret).update(body).digest("hex");
      const response = await fetch(sub.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workforce360-Event": event,
          "X-Workforce360-Signature": signature,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        console.warn("[webhook] delivery failed", { id: sub.id, status: response.status });
      }
    } catch (error) {
      console.warn("[webhook] delivery error", { id: sub.id, error });
    }
  }
}
