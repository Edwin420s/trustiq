import { Router } from 'express';
import { auth } from '../middleware/auth';
import { NotificationService } from '../services/notification-service';

const router = Router();
const notificationService = new NotificationService();

router.get('/', auth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const notifications = await notificationService.getUserNotifications(userId, limit);
    const unreadCount = await notificationService.getUnreadCount(userId);

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const notification = await notificationService.markAsRead(id);
    
    // Verify the notification belongs to the user
    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/mark-all-read', auth, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    await notificationService.markAllAsRead(userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const count = await notificationService.getUnreadCount(userId);

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as notificationsRouter };