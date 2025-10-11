import { prisma } from '../lib/prisma';

export interface Notification {
  userId: string;
  type: 'trust_score_update' | 'account_verified' | 'badge_minted' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
}

export class NotificationService {
  async createNotification(notification: Omit<Notification, 'read'>) {
    return await prisma.notification.create({
      data: {
        ...notification,
        read: false,
      },
    });
  }

  async getUserNotifications(userId: string, limit: number = 50) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(notificationId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async sendTrustScoreNotification(userId: string, oldScore: number, newScore: number) {
    const title = 'Trust Score Updated';
    const message = `Your trust score changed from ${oldScore} to ${newScore}`;
    
    return this.createNotification({
      userId,
      type: 'trust_score_update',
      title,
      message,
      data: { oldScore, newScore },
    });
  }

  async sendAccountVerifiedNotification(userId: string, provider: string) {
    const title = 'Account Verified';
    const message = `Your ${provider} account has been successfully verified`;
    
    return this.createNotification({
      userId,
      type: 'account_verified',
      title,
      message,
      data: { provider },
    });
  }

  async sendBadgeMintedNotification(userId: string, badgeType: string) {
    const title = 'Badge Minted';
    const message = `Your ${badgeType} trust badge has been minted on-chain`;
    
    return this.createNotification({
      userId,
      type: 'badge_minted',
      title,
      message,
      data: { badgeType },
    });
  }
}