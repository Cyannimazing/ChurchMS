import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '@/lib/axios';
import { getEcho } from '@/lib/echo';

// Helper function to update favicon badge
const updateFaviconBadge = (count) => {
  if (count > 0) {
    document.title = `(${count}) ChurchMS`;
  } else {
    document.title = 'ChurchMS';
  }
};

// Request notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

// Lazy-init a reusable audio element for notification sounds
const getNotificationAudio = () => {
  if (typeof window === 'undefined') return null;
  if (!window.__notifAudio) {
    try {
      const a = new Audio('/notification-sound.mp3');
      a.preload = 'auto';
      window.__notifAudio = a;
    } catch (e) {
      console.log('Audio init failed:', e);
    }
  }
  return window.__notifAudio || null;
};

const playNotificationSound = () => {
  const a = getNotificationAudio();
  if (!a) return;
  try {
    a.currentTime = 0;
    const p = a.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch (e) {
    // Ignore autoplay restrictions; will succeed after first user gesture
  }
};

export const useNotifications = (user, options = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  // Track last fetched notification ids and unread count to detect new ones during polling
  const prevIdsRef = useRef(new Set());
  const prevUnreadRef = useRef(0);
  const { churchId: optChurchId = null, churchname: optChurchname = null, suppressFavicon = false } = options || {};
  const maybeUpdateFavicon = (count) => {
    if (!suppressFavicon) updateFaviconBadge(count);
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axios.get('/api/notifications/unread-count');
      const count = response.data.count || 0;
      setUnreadCount(count);
      maybeUpdateFavicon(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      // Refetch unread count from server to ensure accuracy
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [fetchUnreadCount]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      updateFaviconBadge(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      // Refetch unread count from server to ensure accuracy
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [fetchUnreadCount]);

  // Setup Echo listeners
  useEffect(() => {
    if (!user) return;

    // Request notification permission on mount
    requestNotificationPermission();

    fetchNotifications();
    fetchUnreadCount();

    // Polling fallback every 10s to keep list and count in sync across tabs
    const intervalId = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 10000);

    // Refresh when tab becomes visible/focused
    const handleVisibility = () => { if (document.visibilityState === 'visible') { fetchNotifications(); fetchUnreadCount(); } };
    const handleFocus = () => { fetchNotifications(); fetchUnreadCount(); };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    const echo = getEcho();
    if (!echo) return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };

    // Listen for new notifications on user's private channel
    const userChannel = echo.private(`user.${user.id}`);
    
    userChannel.listen('.notification.created', (data) => {
      console.log('New notification received:', data);
      setNotifications((prev) => {
        // Deduplicate by id
        if (prev.some(n => n.id === data.notification.id)) return prev;
        return [data.notification, ...prev];
      });
      setUnreadCount((prev) => {
        const newCount = prev + 1;
        maybeUpdateFavicon(newCount);
        return newCount;
      });
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(data.notification.title, {
          body: data.notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'appointment-notification',
          requireInteraction: false,
        });
        
        // Play notification sound
        playNotificationSound();
        
        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      } else {
        // Try to play sound even if notification permission not granted
        playNotificationSound();
      }
    });

    userChannel.listen('.notification.read', (data) => {
      console.log('Notification marked as read:', data);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === data.notification_id
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount((prev) => {
        const newCount = Math.max(0, prev - 1);
        maybeUpdateFavicon(newCount);
        return newCount;
      });
    });

    userChannel.listen('.notification.read_all', (data) => {
      console.log('All notifications marked as read:', data);
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      maybeUpdateFavicon(0);
    });

    userChannel.listen('.notification.deleted', (data) => {
      console.log('Notification deleted:', data);
      setNotifications((prev) => {
        const deletedNotif = prev.find(n => n.id === data.notification_id);
        if (deletedNotif && !deletedNotif.is_read) {
          setUnreadCount((prevCount) => {
            const newCount = Math.max(0, prevCount - 1);
            maybeUpdateFavicon(newCount);
            return newCount;
          });
        }
        return prev.filter((notif) => notif.id !== data.notification_id);
      });
    });

    // If user is church staff/owner, also listen to church channel
    // Resolve churchId: staff -> user.church.ChurchID; owner -> from options or churches list using churchname
    let resolvedChurchId = null;
    if (user.church?.ChurchID) {
      resolvedChurchId = user.church.ChurchID;
    } else if (optChurchId) {
      resolvedChurchId = optChurchId;
    } else if (optChurchname && Array.isArray(user.churches)) {
      // Match using lowercase slug comparison (e.g., "holy-trinity-church" matches "Holy Trinity Church")
      const slug = (s) => s?.toLowerCase().replace(/\s+/g, '-');
      const match = user.churches.find(c => slug(c.ChurchName) === optChurchname.toLowerCase());
      if (match) resolvedChurchId = match.ChurchID;
    }

    console.log('[useNotifications] Resolved church ID:', resolvedChurchId);
    console.log('[useNotifications] User church:', user.church?.ChurchID);
    console.log('[useNotifications] Opt churchname:', optChurchname);
    console.log('[useNotifications] User churches:', user.churches);
    
    if (resolvedChurchId) {
      const churchChannel = echo.private(`church.${resolvedChurchId}`);
      console.log('[useNotifications] Subscribed to church channel:', `church.${resolvedChurchId}`);
      
      // NOTE: Do NOT push into notifications here to avoid duplicates.
      // Church channel is used for other real-time features (e.g., appointment lists),
      // but notifications for users always come through user.{id} -> notification.created.
      churchChannel.listen('.appointment.created', (data) => {
        console.log('[useNotifications] Church channel appointment.created received (ignored for notifications)');
      });
    } else {
      console.log('[useNotifications] No church ID resolved, not listening to church channel');
    }

    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      if (userChannel) {
        userChannel.stopListening('.notification.created');
        userChannel.stopListening('.notification.read');
        userChannel.stopListening('.notification.read_all');
        userChannel.stopListening('.notification.deleted');
      }
      try {
        if (resolvedChurchId) {
          const ch = echo.private(`church.${resolvedChurchId}`);
          ch.stopListening('.appointment.created');
        }
      } catch (_) {}
    };
  }, [user, fetchNotifications, fetchUnreadCount, optChurchId, optChurchname]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
