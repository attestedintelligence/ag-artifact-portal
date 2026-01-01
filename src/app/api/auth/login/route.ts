/**
 * Magic Link Login API Route
 * Per AGA Build Guide - Auth Flow
 *
 * Sends magic link to email for passwordless login.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import { v4 as uuid } from 'uuid';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================================
// HELPERS
// ============================================================================

function generateVaultId(): string {
  const digits = () =>
    Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
  const middle = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `${digits()}-${middle}-${digits()}`;
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================================
// POST /api/auth/login - Send magic link
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Create new user with vault ID
      user = await prisma.user.create({
        data: {
          id: uuid(),
          email: normalizedEmail,
          vaultId: generateVaultId(),
          tier: 'FREE',
        },
      });
    }

    // Create magic link token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.magicLinkToken.create({
      data: {
        id: uuid(),
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Build magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://attestedintelligence.com';
    const magicLink = `${baseUrl}/api/auth/verify?token=${token}`;

    // Send email via Resend
    const fromEmail = process.env.EMAIL_FROM || 'noreply@attestedintelligence.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Attested Intelligence';

    try {
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: normalizedEmail,
        subject: 'Your Secure Login Link - Attested Intelligence',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #0A0E17; font-size: 24px; margin: 0;">Attested Intelligence</h1>
              <p style="color: #666; font-size: 14px; margin-top: 8px;">Sovereign Vault</p>
            </div>

            <div style="background: linear-gradient(135deg, #0A0E17 0%, #1a1f2e 100%); border-radius: 12px; padding: 32px; text-align: center;">
              <h2 style="color: #fff; font-size: 20px; margin: 0 0 16px 0;">Sign in to your Vault</h2>
              <p style="color: #aaa; font-size: 14px; margin: 0 0 24px 0;">Click the button below to securely access your account.</p>
              <a href="${magicLink}" style="display: inline-block; background: #00D4FF; color: #0A0E17; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px;">
                Sign In Securely
              </a>
            </div>

            <div style="margin-top: 32px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                This link expires in 15 minutes. If you didn't request this email, you can safely ignore it.
              </p>
            </div>

            <div style="margin-top: 32px; text-align: center;">
              <p style="color: #999; font-size: 11px; margin: 0;">
                Attested Intelligence - The Integrity Layer for Autonomous Defense
              </p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the request, user was created but email failed
    }

    console.log(`Magic link generated for ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
