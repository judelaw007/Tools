import { NextRequest, NextResponse } from 'next/server';
import { learnworlds } from '@/lib/learnworlds';
import { createVerificationCode, getCodeExpirySeconds } from '@/lib/auth/verification-codes';
import { sendVerificationCodeEmail, isEmailConfigured } from '@/lib/email';

/**
 * POST /api/auth/send-code
 *
 * Sends a verification code to the user's email.
 *
 * Flow:
 * 1. Validate email format
 * 2. Verify user exists in LearnWorlds (mojitax.co.uk)
 * 3. Generate verification code
 * 4. Send code via email
 * 5. Return success with masked email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email service is configured
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      );
    }

    // Verify user exists in LearnWorlds
    console.log('Looking up user in LearnWorlds:', normalizedEmail);
    let lwUser;
    try {
      lwUser = await learnworlds.getUserByEmail(normalizedEmail);
    } catch (lwError) {
      console.error('LearnWorlds API error:', lwError);
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable',
          message: 'Unable to verify your account. Please try again later.',
        },
        { status: 503 }
      );
    }

    if (!lwUser) {
      console.log('User not found in LearnWorlds:', normalizedEmail);
      return NextResponse.json(
        {
          error: 'Account not found',
          message: 'No MojiTax account found for this email. Please ensure you have an account at mojitax.co.uk.',
        },
        { status: 404 }
      );
    }

    console.log('User found in LearnWorlds:', lwUser.id);

    // Create verification code
    const codeResult = createVerificationCode(normalizedEmail);

    if (!codeResult.success || !codeResult.code) {
      return NextResponse.json(
        {
          error: codeResult.error || 'Failed to create verification code',
          retryAfter: codeResult.retryAfter,
        },
        { status: 429 }
      );
    }

    // Send verification email
    const emailResult = await sendVerificationCodeEmail(normalizedEmail, codeResult.code);

    if (!emailResult.success) {
      console.error('Email send failed:', emailResult.error);
      return NextResponse.json(
        {
          error: 'Failed to send verification email',
          message: emailResult.error || 'Please try again in a few moments.',
        },
        { status: 500 }
      );
    }

    // Mask email for display (u***@example.com)
    const [localPart, domain] = normalizedEmail.split('@');
    const maskedLocal = localPart.length > 2
      ? localPart[0] + '***' + localPart[localPart.length - 1]
      : localPart[0] + '***';
    const maskedEmail = `${maskedLocal}@${domain}`;

    return NextResponse.json({
      success: true,
      maskedEmail,
      expiresIn: getCodeExpirySeconds(),
      message: `Verification code sent to ${maskedEmail}`,
    });

  } catch (error) {
    console.error('Send code error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's a LearnWorlds API error
    if (error instanceof Error && error.message.includes('LearnWorlds')) {
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable',
          message: 'Unable to verify your account. Please try again later.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to send verification code',
        message: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
