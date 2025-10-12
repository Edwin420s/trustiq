import nodemailer from 'nodemailer';
import { env } from '@trustiq/shared-config';
import { logger } from './logger-service';

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const html = this.renderTemplate(options.template, options.data);

      const mailOptions = {
        from: `TrustIQ <${process.env.SMTP_FROM || 'noreply@trustiq.xyz'}>`,
        to: options.to,
        subject: options.subject,
        html: html,
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email', error as Error, {
        to: options.to,
        subject: options.subject,
      });
      
      return false;
    }
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    const templates: Record<string, string> = {
      welcome: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to TrustIQ! 🚀</h1>
                </div>
                <div class="content">
                    <h2>Hello ${data.name || 'there'},</h2>
                    <p>Welcome to TrustIQ - your decentralized reputation network. We're excited to have you on board!</p>
                    
                    <p>With TrustIQ, you can:</p>
                    <ul>
                        <li>Build a verifiable digital reputation</li>
                        <li>Connect your GitHub, LinkedIn, and other accounts</li>
                        <li>Earn trust scores based on your real contributions</li>
                        <li>Mint on-chain reputation badges</li>
                    </ul>

                    <p>Get started by connecting your first account and building your trust profile.</p>
                    
                    <a href="${data.appUrl}" class="button">Get Started</a>
                    
                    <p>If you have any questions, feel free to reach out to our support team.</p>
                    
                    <p>Best regards,<br>The TrustIQ Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 TrustIQ. All rights reserved.</p>
                    <p><a href="${data.unsubscribeUrl}">Unsubscribe</a> from these emails.</p>
                </div>
            </div>
        </body>
        </html>
      `,

      trustScoreUpdate: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .score { font-size: 48px; font-weight: bold; text-align: center; margin: 20px 0; color: #667eea; }
                .improvement { color: #10b981; }
                .decline { color: #ef4444; }
                .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Trust Score Updated 📊</h1>
                </div>
                <div class="content">
                    <h2>Hello ${data.name || 'there'},</h2>
                    <p>Your TrustIQ score has been updated!</p>
                    
                    <div class="score">
                        ${data.newScore}
                        ${data.oldScore ? `
                            <span class="${data.newScore > data.oldScore ? 'improvement' : 'decline'}">
                                (${data.newScore > data.oldScore ? '+' : ''}${data.newScore - data.oldScore})
                            </span>
                        ` : ''}
                    </div>

                    ${data.breakdown ? `
                        <h3>Score Breakdown:</h3>
                        <ul>
                            <li>Consistency: ${data.breakdown.consistency}</li>
                            <li>Skill Depth: ${data.breakdown.skillDepth}</li>
                            <li>Peer Validation: ${data.breakdown.peerValidation}</li>
                            <li>Engagement Quality: ${data.breakdown.engagementQuality}</li>
                        </ul>
                    ` : ''}

                    ${data.insights && data.insights.length > 0 ? `
                        <h3>Insights:</h3>
                        <ul>
                            ${data.insights.map((insight: string) => `<li>${insight}</li>`).join('')}
                        </ul>
                    ` : ''}

                    <a href="${data.profileUrl}" class="button">View Your Profile</a>
                    
                    <p>Keep building your reputation by maintaining consistent activity and connecting more verified accounts.</p>
                    
                    <p>Best regards,<br>The TrustIQ Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 TrustIQ. All rights reserved.</p>
                    <p><a href="${data.unsubscribeUrl}">Unsubscribe</a> from score update emails.</p>
                </div>
            </div>
        </body>
        </html>
      `,

      accountVerified: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .verified-badge { text-align: center; font-size: 24px; color: #10b981; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Account Verified ✅</h1>
                </div>
                <div class="content">
                    <h2>Great news, ${data.name || 'there'}!</h2>
                    
                    <div class="verified-badge">
                        ✅ Your ${data.provider} account has been successfully verified!
                    </div>

                    <p>Your ${data.provider} account <strong>@${data.username}</strong> is now connected to your TrustIQ profile and contributing to your trust score.</p>

                    <p>What's next?</p>
                    <ul>
                        <li>Your trust score will be recalculated with the new data</li>
                        <li>Continue building your reputation by staying active</li>
                        <li>Consider connecting additional accounts for a more comprehensive profile</li>
                    </ul>

                    <a href="${data.profileUrl}" class="button">View Updated Profile</a>
                    
                    <p>If you didn't request this verification, please contact our support team immediately.</p>
                    
                    <p>Best regards,<br>The TrustIQ Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 TrustIQ. All rights reserved.</p>
                    <p><a href="${data.unsubscribeUrl}">Unsubscribe</a> from verification emails.</p>
                </div>
            </div>
        </body>
        </html>
      `,

      securityAlert: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Security Alert 🚨</h1>
                </div>
                <div class="content">
                    <h2>Important Security Notice</h2>
                    
                    <div class="alert">
                        <h3>${data.alertType}</h3>
                        <p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
                        <p><strong>Details:</strong> ${data.description}</p>
                    </div>

                    <p>If this was you, you can safely ignore this email.</p>
                    <p>If you don't recognize this activity, please take immediate action to secure your account.</p>

                    <a href="${data.securityUrl}" class="button">Review Security Settings</a>
                    
                    <p>For your security, we recommend:</p>
                    <ul>
                        <li>Changing your password if you suspect unauthorized access</li>
                        <li>Enabling two-factor authentication if available</li>
                        <li>Reviewing your recent account activity</li>
                    </ul>
                    
                    <p>Best regards,<br>The TrustIQ Security Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 TrustIQ. All rights reserved.</p>
                    <p>This is an important security notification and cannot be unsubscribed.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    let html = templates[template] || templates.welcome;

    // Replace template variables
    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`\\$\\{${key}\\}`, 'g');
      html = html.replace(placeholder, data[key]);
    });

    return html;
  }

  // Specific email methods
  async sendWelcomeEmail(userEmail: string, userName: string, appUrl: string): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to TrustIQ - Build Your Digital Reputation',
      template: 'welcome',
      data: {
        name: userName,
        appUrl: appUrl,
        unsubscribeUrl: `${appUrl}/preferences/notifications`,
      },
    });
  }

  async sendTrustScoreUpdate(
    userEmail: string, 
    userName: string, 
    oldScore: number, 
    newScore: number,
    breakdown: any,
    insights: string[],
    profileUrl: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: `Your TrustIQ Score is Now ${newScore}`,
      template: 'trustScoreUpdate',
      data: {
        name: userName,
        oldScore,
        newScore,
        breakdown,
        insights,
        profileUrl,
        unsubscribeUrl: `${profileUrl}/preferences/notifications`,
      },
    });
  }

  async sendAccountVerified(
    userEmail: string,
    userName: string,
    provider: string,
    username: string,
    profileUrl: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: `Your ${provider} Account is Now Verified`,
      template: 'accountVerified',
      data: {
        name: userName,
        provider,
        username,
        profileUrl,
        unsubscribeUrl: `${profileUrl}/preferences/notifications`,
      },
    });
  }

  async sendSecurityAlert(
    userEmail: string,
    alertType: string,
    description: string,
    securityUrl: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: `Security Alert: ${alertType}`,
      template: 'securityAlert',
      data: {
        alertType,
        description,
        timestamp: new Date().toISOString(),
        securityUrl,
      },
    });
  }

  async verifyEmailConfiguration(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service configuration verified');
      return true;
    } catch (error) {
      logger.error('Email service configuration failed', error as Error);
      return false;
    }
  }
}

export const emailService = new EmailService();