/**
 * Email Service
 *
 * Sends emails using Resend (recommended) or falls back to console logging in development.
 *
 * Required environment variable:
 * - RESEND_API_KEY: Your Resend API key (get one at resend.com)
 *
 * Optional:
 * - EMAIL_FROM: Sender email address (default: noreply@mojitax.co.uk)
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Send an email using Resend API
 */
async function sendWithResend(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const fromEmail = process.env.EMAIL_FROM || 'MojiTax <noreply@mojitax.co.uk>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return {
        success: false,
        error: data.message || 'Failed to send email'
      };
    }

    return {
      success: true,
      messageId: data.id
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: 'Failed to send email'
    };
  }
}

/**
 * Development fallback - logs email to console
 */
function sendWithConsole(params: SendEmailParams): SendEmailResult {
  console.log('\n========== EMAIL (Dev Mode) ==========');
  console.log(`To: ${params.to}`);
  console.log(`Subject: ${params.subject}`);
  console.log('Body:', params.text || params.html);
  console.log('=======================================\n');

  return {
    success: true,
    messageId: 'dev-' + Date.now()
  };
}

/**
 * Send an email
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  // In development without Resend key, log to console
  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'development') {
    return sendWithConsole(params);
  }

  return sendWithResend(params);
}

/**
 * Send verification code email
 */
export async function sendVerificationCodeEmail(
  email: string,
  code: string
): Promise<SendEmailResult> {
  const subject = `${code} is your MojiTax verification code`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a365d; margin: 0; font-size: 24px;">MojiTax Tools</h1>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center;">
        <h2 style="color: #1a365d; margin: 0 0 10px 0; font-size: 20px;">Your Verification Code</h2>
        <p style="color: #64748b; margin: 0 0 20px 0;">Enter this code to access your tools:</p>

        <div style="background: #ffffff; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a365d;">${code}</span>
        </div>

        <p style="color: #94a3b8; font-size: 14px; margin: 20px 0 0 0;">
          This code expires in 5 minutes.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          If you didn't request this code, you can safely ignore this email.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">
          © ${new Date().getFullYear()} MojiTax. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `Your MojiTax verification code is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`;

  return sendEmail({
    to: email,
    subject,
    html,
    text
  });
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY || process.env.NODE_ENV === 'development';
}
