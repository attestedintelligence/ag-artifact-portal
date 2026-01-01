/**
 * Webhook Notification System
 * Per AGA Build Guide Phase 9.3
 *
 * Sends notifications to external systems via webhooks.
 */

// Note: In production, import from @attested/core package
// For now, inline the canonicalize function
function canonicalize(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as object).sort());
}

// ============================================================================
// TYPES
// ============================================================================

export type WebhookEvent =
  | 'artifact.created'
  | 'artifact.sealed'
  | 'artifact.expired'
  | 'artifact.revoked'
  | 'verification.passed'
  | 'verification.failed'
  | 'attestation.requested'
  | 'attestation.completed'
  | 'bundle.generated'
  | 'drift.detected';

export interface WebhookConfig {
  id: string;
  userId: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  enabled: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
  failureCount: number;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: WebhookPayload;
  status: 'pending' | 'success' | 'failed';
  statusCode?: number;
  response?: string;
  attempts: number;
  createdAt: string;
  completedAt?: string;
}

// ============================================================================
// WEBHOOK MANAGER
// ============================================================================

export class WebhookManager {
  private webhooks: Map<string, WebhookConfig[]> = new Map();
  private deliveries: Map<string, WebhookDelivery[]> = new Map();
  private maxRetries = 3;
  private retryDelays = [1000, 5000, 30000]; // 1s, 5s, 30s

  /**
   * Register a new webhook
   */
  async register(
    userId: string,
    url: string,
    events: WebhookEvent[]
  ): Promise<WebhookConfig> {
    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid webhook URL');
    }

    // Validate events
    const validEvents: WebhookEvent[] = [
      'artifact.created',
      'artifact.sealed',
      'artifact.expired',
      'artifact.revoked',
      'verification.passed',
      'verification.failed',
      'attestation.requested',
      'attestation.completed',
      'bundle.generated',
      'drift.detected',
    ];

    for (const event of events) {
      if (!validEvents.includes(event)) {
        throw new Error(`Invalid event: ${event}`);
      }
    }

    // Generate secret
    const secret = await this.generateSecret();

    const webhook: WebhookConfig = {
      id: crypto.randomUUID(),
      userId,
      url,
      secret,
      events,
      enabled: true,
      createdAt: new Date().toISOString(),
      failureCount: 0,
    };

    // Store
    const userWebhooks = this.webhooks.get(userId) || [];
    userWebhooks.push(webhook);
    this.webhooks.set(userId, userWebhooks);

    // In production, save to database

    return webhook;
  }

  /**
   * Get webhooks for a user
   */
  async getWebhooks(userId: string): Promise<WebhookConfig[]> {
    return this.webhooks.get(userId) || [];
  }

  /**
   * Update a webhook
   */
  async update(
    userId: string,
    webhookId: string,
    updates: Partial<Pick<WebhookConfig, 'url' | 'events' | 'enabled'>>
  ): Promise<WebhookConfig | null> {
    const userWebhooks = this.webhooks.get(userId) || [];
    const index = userWebhooks.findIndex((w) => w.id === webhookId);

    if (index === -1) {
      return null;
    }

    const webhook = userWebhooks[index];
    Object.assign(webhook, updates);

    return webhook;
  }

  /**
   * Delete a webhook
   */
  async delete(userId: string, webhookId: string): Promise<boolean> {
    const userWebhooks = this.webhooks.get(userId) || [];
    const index = userWebhooks.findIndex((w) => w.id === webhookId);

    if (index === -1) {
      return false;
    }

    userWebhooks.splice(index, 1);
    return true;
  }

  /**
   * Rotate webhook secret
   */
  async rotateSecret(userId: string, webhookId: string): Promise<string | null> {
    const userWebhooks = this.webhooks.get(userId) || [];
    const webhook = userWebhooks.find((w) => w.id === webhookId);

    if (!webhook) {
      return null;
    }

    const newSecret = await this.generateSecret();
    webhook.secret = newSecret;

    return newSecret;
  }

  /**
   * Trigger webhooks for an event
   */
  async trigger(
    userId: string,
    event: WebhookEvent,
    data: Record<string, unknown>
  ): Promise<void> {
    const userWebhooks = this.webhooks.get(userId) || [];
    const matchingWebhooks = userWebhooks.filter(
      (w) => w.enabled && w.events.includes(event)
    );

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    for (const webhook of matchingWebhooks) {
      await this.deliver(webhook, payload);
    }
  }

  /**
   * Deliver a webhook
   */
  private async deliver(
    webhook: WebhookConfig,
    payload: WebhookPayload,
    attempt = 1
  ): Promise<void> {
    const deliveryId = crypto.randomUUID();

    const delivery: WebhookDelivery = {
      id: deliveryId,
      webhookId: webhook.id,
      event: payload.event,
      payload,
      status: 'pending',
      attempts: attempt,
      createdAt: new Date().toISOString(),
    };

    // Store delivery
    const webhookDeliveries = this.deliveries.get(webhook.id) || [];
    webhookDeliveries.unshift(delivery);
    this.deliveries.set(webhook.id, webhookDeliveries.slice(0, 100)); // Keep last 100

    try {
      // Compute signature
      const signature = await this.computeSignature(payload, webhook.secret);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
          'X-Webhook-Delivery': deliveryId,
          'X-Webhook-Timestamp': payload.timestamp,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      delivery.statusCode = response.status;
      delivery.response = await response.text().catch(() => '');
      delivery.completedAt = new Date().toISOString();

      if (response.ok) {
        delivery.status = 'success';
        webhook.failureCount = 0;
        webhook.lastTriggeredAt = new Date().toISOString();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      delivery.status = 'failed';
      delivery.response = error instanceof Error ? error.message : 'Unknown error';
      delivery.completedAt = new Date().toISOString();
      webhook.failureCount++;

      // Retry if under limit
      if (attempt < this.maxRetries) {
        const delay = this.retryDelays[attempt - 1] || 30000;
        setTimeout(() => {
          this.deliver(webhook, payload, attempt + 1);
        }, delay);
      }

      // Disable webhook after too many failures
      if (webhook.failureCount >= 10) {
        webhook.enabled = false;
        console.warn(`Webhook ${webhook.id} disabled after 10 consecutive failures`);
      }
    }
  }

  /**
   * Get delivery history for a webhook
   */
  async getDeliveries(
    webhookId: string,
    limit = 50
  ): Promise<WebhookDelivery[]> {
    const deliveries = this.deliveries.get(webhookId) || [];
    return deliveries.slice(0, limit);
  }

  /**
   * Test a webhook
   */
  async test(userId: string, webhookId: string): Promise<WebhookDelivery | null> {
    const userWebhooks = this.webhooks.get(userId) || [];
    const webhook = userWebhooks.find((w) => w.id === webhookId);

    if (!webhook) {
      return null;
    }

    const payload: WebhookPayload = {
      event: 'artifact.created',
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'This is a test webhook delivery',
      },
    };

    await this.deliver(webhook, payload);

    const deliveries = this.deliveries.get(webhookId) || [];
    return deliveries[0] || null;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private async generateSecret(): Promise<string> {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async computeSignature(
    payload: WebhookPayload,
    secret: string
  ): Promise<string> {
    const canonical = canonicalize(payload);
    const message = `${payload.timestamp}.${canonical}`;

    // HMAC-SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(message)
    );

    return `sha256=${Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
  }
}

// ============================================================================
// VERIFICATION HELPER
// ============================================================================

export async function verifyWebhookSignature(
  payload: string,
  timestamp: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const message = `${timestamp}.${payload}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const computed = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );

  const computedHex = `sha256=${Array.from(new Uint8Array(computed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`;

  return computedHex === signature;
}

// Singleton instance
export const webhookManager = new WebhookManager();
