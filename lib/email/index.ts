/**
 * Email Service
 *
 * Sends emails using SendGrid or falls back to console logging in development.
 *
 * Required environment variable:
 * - SENDGRID_API_KEY: Your SendGrid API key
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
 * Send an email using SendGrid API
 */
async function sendWithSendGrid(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    console.error('SENDGRID_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const fromEmail = process.env.EMAIL_FROM || 'noreply@mojitax.co.uk';
  const fromName = process.env.EMAIL_FROM_NAME || 'MojiTax';

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: params.to }],
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: params.subject,
        content: [
          ...(params.text ? [{ type: 'text/plain', value: params.text }] : []),
          { type: 'text/html', value: params.html },
        ],
      }),
    });

    // SendGrid returns 202 Accepted on success with no body
    if (response.status === 202) {
      const messageId = response.headers.get('x-message-id') || `sg-${Date.now()}`;
      return {
        success: true,
        messageId,
      };
    }

    // Handle errors
    let errorMessage = 'Failed to send email';
    try {
      const data = await response.json();
      console.error('SendGrid API error:', data);
      if (data.errors && data.errors.length > 0) {
        errorMessage = data.errors[0].message || errorMessage;
      }
    } catch {
      console.error('SendGrid API error: Status', response.status);
    }

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: 'Failed to send email',
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
    messageId: 'dev-' + Date.now(),
  };
}

/**
 * Send an email
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  // In development without SendGrid key, log to console
  if (!process.env.SENDGRID_API_KEY && process.env.NODE_ENV === 'development') {
    return sendWithConsole(params);
  }

  return sendWithSendGrid(params);
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
    text,
  });
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.SENDGRID_API_KEY || process.env.NODE_ENV === 'development';
}
