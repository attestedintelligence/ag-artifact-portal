/**
 * Notifications Module
 * Per AGA Build Guide Phase 9
 *
 * Exports all notification services.
 */

export { EmailService, emailService } from './email';
export type { EmailTemplate } from './email';

export {
  AlertManager,
  alertManager,
  createArtifactSealedAlert,
  createArtifactExpiringAlert,
  createVerificationFailedAlert,
  createAttestationReceivedAlert,
  createSecurityAlert,
} from './alerts';
export type { Alert, AlertType, AlertCategory, AlertPreferences } from './alerts';

export {
  WebhookManager,
  webhookManager,
  verifyWebhookSignature,
} from './webhooks';
export type {
  WebhookEvent,
  WebhookConfig,
  WebhookPayload,
  WebhookDelivery,
} from './webhooks';
