/**
 * Email Notification Service
 * Per AGA Build Guide Phase 9.1
 *
 * Uses Resend for transactional emails.
 */

// ============================================================================
// TYPES
// ============================================================================

export type EmailTemplate =
  | 'vault_created'
  | 'artifact_sealed'
  | 'artifact_expiring'
  | 'artifact_expired'
  | 'artifact_revoked'
  | 'attestation_requested'
  | 'attestation_completed'
  | 'verification_failed'
  | 'magic_link';

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailData {
  template: EmailTemplate;
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  variables: Record<string, string | number | boolean>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// TEMPLATE SUBJECTS
// ============================================================================

const TEMPLATE_SUBJECTS: Record<EmailTemplate, string> = {
  vault_created: 'Welcome to AGA Portal - Your Account is Ready',
  artifact_sealed: 'Artifact Sealed Successfully',
  artifact_expiring: 'Artifact Expiration Warning',
  artifact_expired: 'Artifact Has Expired',
  artifact_revoked: 'Artifact Revoked',
  attestation_requested: 'Third-Party Attestation Requested',
  attestation_completed: 'Attestation Review Complete',
  verification_failed: 'Verification Alert',
  magic_link: 'Sign in to AGA Portal',
};

// ============================================================================
// EMAIL SERVICE
// ============================================================================

export class EmailService {
  private apiKey: string;
  private fromAddress: string;
  private fromName: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromAddress = process.env.EMAIL_FROM || 'noreply@attestedgovernance.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Attested Intelligence';
  }

  /**
   * Send an email using a template
   */
  async send(data: EmailData): Promise<EmailResult> {
    try {
      if (!this.apiKey) {
        console.warn('Email service not configured - RESEND_API_KEY missing');
        return { success: false, error: 'Email service not configured' };
      }

      const recipients = Array.isArray(data.to) ? data.to : [data.to];

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromAddress}>`,
          to: recipients.map((r) => r.email),
          subject: data.subject,
          html: this.renderTemplate(data.template, data.variables),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Email send failed:', error);
        return { success: false, error };
      }

      const result = await response.json();
      return { success: true, messageId: result.id };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send vault created notification
   */
  async sendVaultCreated(email: string, vaultId: string): Promise<EmailResult> {
    return this.send({
      template: 'vault_created',
      to: { email },
      subject: TEMPLATE_SUBJECTS.vault_created,
      variables: { vaultId },
    });
  }

  /**
   * Send artifact sealed notification
   */
  async sendArtifactSealed(
    email: string,
    artifactId: string,
    displayName: string
  ): Promise<EmailResult> {
    return this.send({
      template: 'artifact_sealed',
      to: { email },
      subject: TEMPLATE_SUBJECTS.artifact_sealed,
      variables: { artifactId, displayName },
    });
  }

  /**
   * Send artifact expiring warning
   */
  async sendArtifactExpiring(
    email: string,
    artifactId: string,
    displayName: string,
    expiresAt: string,
    hoursRemaining: number
  ): Promise<EmailResult> {
    return this.send({
      template: 'artifact_expiring',
      to: { email },
      subject: `${TEMPLATE_SUBJECTS.artifact_expiring}: ${displayName}`,
      variables: { artifactId, displayName, expiresAt, hoursRemaining },
    });
  }

  /**
   * Send magic link for passwordless login
   */
  async sendMagicLink(email: string, magicLink: string): Promise<EmailResult> {
    return this.send({
      template: 'magic_link',
      to: { email },
      subject: TEMPLATE_SUBJECTS.magic_link,
      variables: { magicLink },
    });
  }

  /**
   * Send attestation request
   */
  async sendAttestationRequest(
    email: string,
    artifactName: string,
    attestationLink: string,
    requesterName: string
  ): Promise<EmailResult> {
    return this.send({
      template: 'attestation_requested',
      to: { email },
      subject: `${TEMPLATE_SUBJECTS.attestation_requested}: ${artifactName}`,
      variables: { artifactName, attestationLink, requesterName },
    });
  }

  // ============================================================================
  // TEMPLATE RENDERING
  // ============================================================================

  private renderTemplate(
    template: EmailTemplate,
    variables: Record<string, string | number | boolean>
  ): string {
    // Base styles
    const styles = `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0A0E17; color: #E5E7EB; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      .header { text-align: center; margin-bottom: 32px; }
      .logo { font-size: 24px; font-weight: bold; color: #00D4FF; }
      .content { background: #111827; border: 1px solid #1F2937; border-radius: 8px; padding: 32px; }
      .button { display: inline-block; background: #00D4FF; color: #0A0E17; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; }
      .code { font-family: monospace; background: #1F2937; padding: 4px 8px; border-radius: 4px; font-size: 14px; }
      .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #6B7280; }
    `;

    const templates: Record<EmailTemplate, string> = {
      vault_created: `
        <div class="content">
          <h1>Welcome to AGA Portal</h1>
          <p>Your account has been created successfully.</p>
          <p><strong>Vault ID:</strong> <span class="code">${variables.vaultId}</span></p>
          <p>You can now start creating Attested Governance Artifacts.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/vault" class="button">Open Your Vault</a></p>
        </div>
      `,
      artifact_sealed: `
        <div class="content">
          <h1>Artifact Sealed</h1>
          <p>Your artifact has been sealed successfully.</p>
          <p><strong>Name:</strong> ${variables.displayName}</p>
          <p><strong>Artifact ID:</strong> <span class="code">${variables.artifactId}</span></p>
          <p>This artifact is now cryptographically sealed and tamper-evident.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/vault/${variables.artifactId}" class="button">View Artifact</a></p>
        </div>
      `,
      artifact_expiring: `
        <div class="content">
          <h1>Artifact Expiration Warning</h1>
          <p>Your artifact is expiring soon.</p>
          <p><strong>Name:</strong> ${variables.displayName}</p>
          <p><strong>Expires:</strong> ${variables.expiresAt}</p>
          <p><strong>Time Remaining:</strong> ${variables.hoursRemaining} hours</p>
          <p>An evidence bundle will be automatically generated before expiration.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/vault/${variables.artifactId}" class="button">View Artifact</a></p>
        </div>
      `,
      artifact_expired: `
        <div class="content">
          <h1>Artifact Expired</h1>
          <p>Your artifact has expired.</p>
          <p><strong>Name:</strong> ${variables.displayName}</p>
          <p>The final evidence bundle has been generated and is available for download.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/vault/${variables.artifactId}" class="button">Download Bundle</a></p>
        </div>
      `,
      artifact_revoked: `
        <div class="content">
          <h1>Artifact Revoked</h1>
          <p>An artifact in your vault has been revoked.</p>
          <p><strong>Name:</strong> ${variables.displayName}</p>
          <p><strong>Artifact ID:</strong> <span class="code">${variables.artifactId}</span></p>
        </div>
      `,
      attestation_requested: `
        <div class="content">
          <h1>Attestation Request</h1>
          <p>${variables.requesterName} has requested your attestation on an artifact.</p>
          <p><strong>Artifact:</strong> ${variables.artifactName}</p>
          <p>Please review the artifact and provide your attestation.</p>
          <p><a href="${variables.attestationLink}" class="button">Review & Attest</a></p>
          <p style="font-size: 12px; color: #6B7280;">This link will expire in 7 days.</p>
        </div>
      `,
      attestation_completed: `
        <div class="content">
          <h1>Attestation Complete</h1>
          <p>The attestation for your artifact has been completed.</p>
          <p><strong>Artifact:</strong> ${variables.artifactName}</p>
          <p><strong>Decision:</strong> ${variables.decision}</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/vault/${variables.artifactId}" class="button">View Details</a></p>
        </div>
      `,
      verification_failed: `
        <div class="content">
          <h1>Verification Alert</h1>
          <p>A verification check has failed for one of your artifacts.</p>
          <p><strong>Artifact:</strong> ${variables.displayName}</p>
          <p><strong>Reason:</strong> ${variables.reason}</p>
          <p>Please investigate this immediately.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/vault/${variables.artifactId}" class="button">View Artifact</a></p>
        </div>
      `,
      magic_link: `
        <div class="content">
          <h1>Sign In to AGA Portal</h1>
          <p>Click the button below to sign in to your account.</p>
          <p><a href="${variables.magicLink}" class="button">Sign In</a></p>
          <p style="font-size: 12px; color: #6B7280;">This link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>${styles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">AGA Portal</div>
            </div>
            ${templates[template]}
            <div class="footer">
              <p>Powered by Attested Governance</p>
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Singleton instance
export const emailService = new EmailService();
