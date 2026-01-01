/**
 * In-App Alert System
 * Per AGA Build Guide Phase 9.2
 *
 * Manages in-app notifications and alerts.
 */

// ============================================================================
// TYPES
// ============================================================================

export type AlertType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'security';

export type AlertCategory =
  | 'artifact'
  | 'verification'
  | 'attestation'
  | 'system'
  | 'security';

export interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  category: AlertCategory;
  title: string;
  message: string;
  artifactId?: string;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  dismissed: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface AlertPreferences {
  userId: string;
  emailEnabled: boolean;
  emailFrequency: 'immediate' | 'daily' | 'weekly';
  categories: {
    artifact: boolean;
    verification: boolean;
    attestation: boolean;
    system: boolean;
    security: boolean;
  };
}

// ============================================================================
// ALERT MANAGER
// ============================================================================

export class AlertManager {
  private alerts: Map<string, Alert[]> = new Map();
  private preferences: Map<string, AlertPreferences> = new Map();
  private listeners: Map<string, Array<(alert: Alert) => void>> = new Map();

  /**
   * Create a new alert
   */
  async create(
    userId: string,
    data: Omit<Alert, 'id' | 'userId' | 'read' | 'dismissed' | 'createdAt'>
  ): Promise<Alert> {
    const alert: Alert = {
      id: crypto.randomUUID(),
      userId,
      ...data,
      read: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    };

    // Store alert
    const userAlerts = this.alerts.get(userId) || [];
    userAlerts.unshift(alert);
    this.alerts.set(userId, userAlerts);

    // Notify listeners
    const userListeners = this.listeners.get(userId) || [];
    userListeners.forEach((listener) => listener(alert));

    // In production, save to database
    console.log('Alert created:', alert.id);

    return alert;
  }

  /**
   * Get alerts for a user
   */
  async getAlerts(
    userId: string,
    options: {
      unreadOnly?: boolean;
      category?: AlertCategory;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ alerts: Alert[]; total: number }> {
    let userAlerts = this.alerts.get(userId) || [];

    // Filter
    if (options.unreadOnly) {
      userAlerts = userAlerts.filter((a) => !a.read);
    }
    if (options.category) {
      userAlerts = userAlerts.filter((a) => a.category === options.category);
    }

    // Filter expired
    const now = new Date();
    userAlerts = userAlerts.filter(
      (a) => !a.expiresAt || new Date(a.expiresAt) > now
    );

    // Paginate
    const total = userAlerts.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const alerts = userAlerts.slice(offset, offset + limit);

    return { alerts, total };
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { alerts } = await this.getAlerts(userId, { unreadOnly: true });
    return alerts.length;
  }

  /**
   * Mark alert as read
   */
  async markAsRead(userId: string, alertId: string): Promise<void> {
    const userAlerts = this.alerts.get(userId) || [];
    const alert = userAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.read = true;
    }
  }

  /**
   * Mark all alerts as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const userAlerts = this.alerts.get(userId) || [];
    userAlerts.forEach((a) => (a.read = true));
  }

  /**
   * Dismiss alert
   */
  async dismiss(userId: string, alertId: string): Promise<void> {
    const userAlerts = this.alerts.get(userId) || [];
    const index = userAlerts.findIndex((a) => a.id === alertId);
    if (index !== -1) {
      userAlerts[index].dismissed = true;
      // Remove from array
      userAlerts.splice(index, 1);
    }
  }

  /**
   * Subscribe to alerts
   */
  subscribe(userId: string, listener: (alert: Alert) => void): () => void {
    const userListeners = this.listeners.get(userId) || [];
    userListeners.push(listener);
    this.listeners.set(userId, userListeners);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(userId) || [];
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<AlertPreferences> {
    return (
      this.preferences.get(userId) || {
        userId,
        emailEnabled: true,
        emailFrequency: 'immediate',
        categories: {
          artifact: true,
          verification: true,
          attestation: true,
          system: true,
          security: true,
        },
      }
    );
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    prefs: Partial<AlertPreferences>
  ): Promise<AlertPreferences> {
    const current = await this.getPreferences(userId);
    const updated = { ...current, ...prefs };
    this.preferences.set(userId, updated);
    return updated;
  }
}

// ============================================================================
// ALERT FACTORIES
// ============================================================================

export function createArtifactSealedAlert(
  artifactId: string,
  displayName: string
): Omit<Alert, 'id' | 'userId' | 'read' | 'dismissed' | 'createdAt'> {
  return {
    type: 'success',
    category: 'artifact',
    title: 'Artifact Sealed',
    message: `"${displayName}" has been sealed successfully.`,
    artifactId,
    actionUrl: `/vault/${artifactId}`,
    actionLabel: 'View Artifact',
  };
}

export function createArtifactExpiringAlert(
  artifactId: string,
  displayName: string,
  hoursRemaining: number
): Omit<Alert, 'id' | 'userId' | 'read' | 'dismissed' | 'createdAt'> {
  return {
    type: 'warning',
    category: 'artifact',
    title: 'Artifact Expiring Soon',
    message: `"${displayName}" will expire in ${hoursRemaining} hours.`,
    artifactId,
    actionUrl: `/vault/${artifactId}`,
    actionLabel: 'View Artifact',
  };
}

export function createVerificationFailedAlert(
  artifactId: string,
  displayName: string,
  reason: string
): Omit<Alert, 'id' | 'userId' | 'read' | 'dismissed' | 'createdAt'> {
  return {
    type: 'error',
    category: 'verification',
    title: 'Verification Failed',
    message: `Verification failed for "${displayName}": ${reason}`,
    artifactId,
    actionUrl: `/vault/${artifactId}`,
    actionLabel: 'Investigate',
  };
}

export function createAttestationReceivedAlert(
  artifactId: string,
  displayName: string,
  attestorName: string,
  decision: 'approved' | 'denied'
): Omit<Alert, 'id' | 'userId' | 'read' | 'dismissed' | 'createdAt'> {
  return {
    type: decision === 'approved' ? 'success' : 'warning',
    category: 'attestation',
    title: `Attestation ${decision === 'approved' ? 'Approved' : 'Denied'}`,
    message: `${attestorName} has ${decision} the attestation for "${displayName}".`,
    artifactId,
    actionUrl: `/vault/${artifactId}`,
    actionLabel: 'View Details',
  };
}

export function createSecurityAlert(
  title: string,
  message: string,
  artifactId?: string
): Omit<Alert, 'id' | 'userId' | 'read' | 'dismissed' | 'createdAt'> {
  return {
    type: 'security',
    category: 'security',
    title,
    message,
    artifactId,
    actionUrl: artifactId ? `/vault/${artifactId}` : '/vault',
    actionLabel: 'Investigate',
  };
}

// Singleton instance
export const alertManager = new AlertManager();
