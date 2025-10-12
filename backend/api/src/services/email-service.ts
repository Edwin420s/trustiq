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
      const text = this.generateTextVersion(html);

      const mailOptions = {
        from: `"TrustIQ" <${process.env.SMTP_FROM || 'noreply@trustiq.xyz'}>`,
        to: options.to,
        subject: options.subject,
        text,
        html,
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
      welcome: this.getWelcomeTemplate(data),
      trustScoreUpdate: this.getTrustScoreUpdateTemplate(data),
      accountVerified: this.getAccountVerifiedTemplate(data),
      badgeMinted: this.getBadgeMintedTemplate(data),
      securityAlert: this.getSecurityAlertTemplate(data),
    };

    return templates[template] || this.getDefaultTemplate(data);
  }

  private getWelcomeTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0A192F, #00BFFF); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #00BFFF; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to TrustIQ</h1>
            <p>Your decentralized reputation network</p>
          </div>
          <div class="content">
            <h2>Hello ${data.name || 'there'}!</h2>
            <p>Welcome to TrustIQ - where your digital reputation becomes your most valuable asset.</p>
            
            <p>With TrustIQ, you can:</p>
            <ul>
              <li>Build verifiable trust scores across platforms</li>
              <li>Own your reputation data on the blockchain</li>
              <li>Showcase your skills and contributions</li>
              <li>Connect with opportunities that value authenticity</li>
            </ul>

            <p>Get started by connecting your accounts and building your trust profile.</p>
            
            <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
            
            <p>If you have any questions, check out our <a href="${data.helpUrl}">help center</a> or reply to this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 TrustIQ. All rights reserved.</p>
            <p>This email was sent to ${data.email}. If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getTrustScoreUpdateTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0A192F, #00BFFF); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .score { font-size: 48px; font-weight: bold; text-align: center; margin: 20px 0; color: #00BFFF; }
          .change { text-align: center; font-size: 18px; margin-bottom: 20px; }
          .improvement { color: #10B981; }
          .decline { color: #EF4444; }
          .button { display: inline-block; padding: 12px 24px; background: #00BFFF; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Trust Score Updated</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.name || 'there'}!</h2>
            <p>Your TrustIQ score has been updated based on recent activity and verifications.</p>
            
            <div class="score">${data.newScore}</div>
            
            ${data.oldScore ? `
              <div class="change ${data.newScore > data.oldScore ? 'improvement' : 'decline'}">
                ${data.newScore > data.oldScore ? '↑' : '↓'} 
                ${Math.abs(data.newScore - data.oldScore)} points 
                ${data.newScore > data.oldScore ? 'improvement' : 'change'}
              </div>
            ` : ''}

            ${data.insights && data.insights.length > 0 ? `
              <h3>Key Insights:</h3>
              <ul>
                ${data.insights.map((insight: string) => `<li>${insight}</li>`).join('')}
              </ul>
            ` : ''}

            <p>Continue building your reputation by:</p>
            <ul>
              <li>Connecting more verified accounts</li>
              <li>Maintaining consistent activity</li>
              <li>Engaging with your communities</li>
            </ul>

            <a href="${data.dashboardUrl}" class="button">View Detailed Analysis</a>
          </div>
          <div class="footer">
            <p>&copy; 2024 TrustIQ. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getAccountVerifiedTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .verified-badge { text-align: center; font-size: 72px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Verified ✅</h1>
          </div>
          <div class="content">
            <div class="verified-badge">✓</div>
            
            <h2>Great news!</h2>
            <p>Your <strong>${data.provider}</strong> account (<strong>${data.username}</strong>) has been successfully verified and linked to your TrustIQ profile.</p>
            
            <p>This verification helps:</p>
            <ul>
              <li>Increase your trust score authenticity</li>
              <li>Provide verifiable proof of your contributions</li>
              <li>Build a comprehensive digital reputation</li>
            </ul>

            <p>Your trust score may be updated to reflect this new verification.</p>

            <a href="${data.dashboardUrl}" class="button">View Your Updated Profile</a>
            
            <p>Want to improve your score further? Consider connecting additional accounts like GitHub, LinkedIn, or Twitter.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 TrustIQ. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getBadgeMintedTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6, #A855F7); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .badge { text-align: center; font-size: 72px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Badge Minted! 🪙</h1>
          </div>
          <div class="content">
            <div class="badge">🏆</div>
            
            <h2>Congratulations!</h2>
            <p>You've earned a new <strong>${data.badgeType}</strong> Trust Badge on the blockchain!</p>
            
            <p><strong>Transaction Hash:</strong> ${data.transactionHash}</p>
            
            <p>This soulbound NFT represents your verified trust score and is permanently recorded on the Sui blockchain.</p>

            <p>You can:</p>
            <ul>
              <li>Showcase this badge in your digital profiles</li>
              <li>Use it for verifiable credential applications</li>
              <li>Build your decentralized identity portfolio</li>
            </ul>

            <a href="${data.explorerUrl}" class="button">View on Blockchain Explorer</a>
            <a href="${data.dashboardUrl}" class="button" style="background: #6B7280; margin-left: 10px;">View in Dashboard</a>
          </div>
          <div class="footer">
            <p>&copy; 2024 TrustIQ. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getSecurityAlertTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert { background: #FEF2F2; border: 1px solid #FECACA; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #EF4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Security Alert</h1>
          </div>
          <div class="content">
            <div class="alert">
              <h3>⚠️ Security Notice</h3>
              <p>We detected unusual activity on your TrustIQ account.</p>
            </div>
            
            <p><strong>Activity Details:</strong></p>
            <ul>
              <li><strong>Time:</strong> ${data.timestamp}</li>
              <li><strong>Action:</strong> ${data.action}</li>
              <li><strong>Location:</strong> ${data.location || 'Unknown'}</li>
              <li><strong>IP Address:</strong> ${data.ipAddress}</li>
            </ul>

            <p>If this was you, no action is needed.</p>
            <p>If you don't recognize this activity, please secure your account immediately.</p>

            <a href="${data.securityUrl}" class="button">Review Account Security</a>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              For your security, this email was sent to ${data.email}.
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2024 TrustIQ. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getDefaultTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0A192F, #00BFFF); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TrustIQ Notification</h1>
          </div>
          <div class="content">
            ${data.message || '<p>You have a new notification from TrustIQ.</p>'}
          </div>
          <div class="footer">
            <p>&copy; 2024 TrustIQ. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateTextVersion(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('Email service connection failed', error as Error);
      return false;
    }
  }
}

export const emailService = new EmailService();