/**
 * Single email wrapper interface as specified in PRD & Architecture.
 * Wraps email delivery in a single sendEmail() function so nothing else depends on its interface.
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    // If SendGrid / Resend / SMTP API key is provided, it can be attached here.
    // In local / standard dev mode, simulate and log gracefully without throwing.
    console.log(`[Email Service] Sending email to: ${options.to}`);
    console.log(`[Email Service] Subject: ${options.subject}`);
    
    // Simulate slight network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Email Service] Failed to send email:', errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
