/**
 * Email HTML Templates
 * Centralized email templates for consistency and maintainability
 */

interface EmailStyles {
  body: string;
  container: string;
  header: string;
  content: string;
  otpCode: string;
  button: string;
  footer: string;
  warning: string;
  code: string;
  features: string;
  featureItem: string;
}

const styles: EmailStyles = {
  body: 'font-family: Arial, sans-serif; line-height: 1.6; color: #333;',
  container: 'max-width: 600px; margin: 0 auto; padding: 20px;',
  header:
    'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;',
  content: 'background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;',
  otpCode:
    'background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; color: #667eea;',
  button:
    'display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;',
  footer: 'text-align: center; margin-top: 20px; color: #666; font-size: 12px;',
  warning: 'background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0;',
  code: 'background: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 10px 0;',
  features: 'background: white; padding: 20px; border-radius: 5px; margin: 20px 0;',
  featureItem:
    'margin: 15px 0; padding-left: 25px; position: relative; &:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }',
};

const baseTemplate = (title: string, content: string): string => `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body { ${styles.body} }
        .container { ${styles.container} }
        .header { ${styles.header} }
        .content { ${styles.content} }
        .otp-code { ${styles.otpCode} }
        .button { ${styles.button} }
        .button:hover { background: #5568d3; }
        .footer { ${styles.footer} }
        .warning { ${styles.warning} }
        .code { ${styles.code} }
        .features { ${styles.features} }
        .feature-item { ${styles.featureItem.replace('&:before', '')} }
        .feature-item:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HireSphere. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
`;

export const verificationEmailTemplate = (otp: string): string =>
  baseTemplate(
    'Welcome to HireSphere!',
    `
    <h2>Verify Your Email Address</h2>
    <p>Thank you for signing up! Please use the following One-Time Password (OTP) to verify your email address:</p>
    
    <div class="otp-code">${otp}</div>
    
    <p>This code will expire in <strong>10 minutes</strong>.</p>
    
    <div class="warning">
      <strong>⚠️ Security Notice:</strong> If you didn't request this verification, please ignore this email.
    </div>
    
    <p>Best regards,<br>The HireSphere Team</p>
  `,
  );

export const passwordResetEmailTemplate = (resetUrl: string): string =>
  baseTemplate(
    'Password Reset Request',
    `
    <h2>Reset Your Password</h2>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    
    <p>Or copy and paste this link into your browser:</p>
    <div class="code">${resetUrl}</div>
    
    <p>This link will expire in <strong>15 minutes</strong>.</p>
    
    <div class="warning">
      <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
    </div>
    
    <p>Best regards,<br>The HireSphere Team</p>
  `,
  );

export const welcomeEmailTemplate = (firstName: string, dashboardUrl: string): string =>
  baseTemplate(
    '🎉 Welcome to HireSphere!',
    `
    <h2>Hi ${firstName},</h2>
    <p>Welcome aboard! We're thrilled to have you join HireSphere - your gateway to amazing career opportunities.</p>
    
    <div class="features">
      <h3>What you can do with HireSphere:</h3>
      <div class="feature-item">Build and manage professional resumes</div>
      <div class="feature-item">Apply to thousands of job opportunities</div>
      <div class="feature-item">Practice with AI-powered mock interviews</div>
      <div class="feature-item">Track your application progress</div>
      <div class="feature-item">Get personalized job recommendations</div>
    </div>
    
    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
    </div>
    
    <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
    
    <p>Happy job hunting!<br>The HireSphere Team</p>
  `,
  );

export const applicationSubmittedTemplate = (
  candidateName: string,
  jobTitle: string,
  companyName: string,
): string =>
  baseTemplate(
    'Application Submitted Successfully',
    `
    <h2>Hi ${candidateName},</h2>
    <p>Thank you for applying to <strong>${jobTitle}</strong> at <strong>${companyName}</strong>!</p>
    
    <p>Your application has been successfully submitted and is currently under review by our hiring team.</p>
    
    <div class="warning" style="background: #d1ecf1; border-left: 4px solid #0c5460;">
      <strong>📋 What's Next?</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Our team will review your application within 3-5 business days</li>
        <li>You'll receive an email notification about your application status</li>
        <li>Keep your profile and resume updated for best results</li>
      </ul>
    </div>
    
    <p>We appreciate your interest in joining our team!</p>
    
    <p>Best regards,<br>The HireSphere Team</p>
  `,
  );

export const applicationStatusUpdateTemplate = (
  candidateName: string,
  jobTitle: string,
  status: string,
  message?: string,
): string =>
  baseTemplate(
    'Application Status Update',
    `
    <h2>Hi ${candidateName},</h2>
    <p>We have an update regarding your application for <strong>${jobTitle}</strong>.</p>
    
    <div style="background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
      <strong>Status:</strong> <span style="color: #2196F3; font-weight: bold;">${status}</span>
    </div>
    
    ${message ? `<p>${message}</p>` : ''}
    
    <p>Thank you for your patience throughout this process.</p>
    
    <p>Best regards,<br>The HireSphere Team</p>
  `,
  );
