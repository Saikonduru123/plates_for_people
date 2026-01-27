import React, { useState, useEffect } from 'react';
import { IonIcon, IonBadge, IonPopover, IonList, IonItem, IonLabel, IonButton, IonText, IonSpinner } from '@ionic/react';
import { notificationService } from '../services/notificationService';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './NotificationBell.css';

// Using ionicons v7 - bell icon
const bellIcon =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M427.68 351.43C402 320 383.87 304 383.87 217.35 383.87 138 343.35 109.73 310 96c-4.43-1.82-8.6-6-9.95-10.55C294.2 65.54 277.8 48 256 48s-38.21 17.55-44 37.47c-1.35 4.6-5.52 8.71-9.95 10.53-33.39 13.75-73.87 41.92-73.87 121.35C128.13 304 110 320 84.32 351.43 73.68 364.45 83 384 101.61 384h308.88c18.51 0 27.77-19.61 17.19-32.57zM320 384v16a64 64 0 01-128 0v-16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>';

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  related_entity_type?: string;
  related_entity_id?: number;
}

interface NotificationResponse {
  total: number;
  unread_count: number;
  notifications: Notification[];
}

const NotificationBell: React.FC = () => {
  const [showPopover, setShowPopover] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getUnreadNotifications();
      console.log('Notification API response:', response);
      console.log('Current user role:', user?.role);

      // Check if response is the NotificationResponse format
      if (Array.isArray(response)) {
        console.log('Response is array, length:', response.length);
        setNotifications(response);
        setUnreadCount(response.filter((n) => !n.is_read).length);
      } else {
        console.log('Response is object:', response);
        const typedResponse = response as unknown as NotificationResponse;
        const notificationsList = typedResponse.notifications || [];
        console.log('Notifications list:', notificationsList.length, notificationsList);
        setNotifications(notificationsList);
        setUnreadCount(typedResponse.unread_count || 0);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      // Set empty arrays on error to prevent undefined issues
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    // Listen for custom refresh event
    const handleRefreshNotifications = () => {
      console.log('Refreshing notifications from event');
      fetchNotifications();
    };
    window.addEventListener('refreshNotifications', handleRefreshNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshNotifications', handleRefreshNotifications);
    };
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.is_read) {
        await notificationService.markAsRead(notification.id);
        await fetchNotifications(); // Refresh to update count
      }

      // Navigate to related entity based on type
      const rolePrefix = user?.role === 'donor' ? 'donor' : 'ngo';

      if (notification.notification_type === 'ngo_registration' && user?.role === 'admin') {
        history.push('/admin/ngos/pending');
      } else if (notification.notification_type === 'location_added' && user?.role === 'admin') {
        history.push('/admin/ngos');
      } else if (notification.related_entity_type === 'donation' && notification.related_entity_id) {
        history.push(`/${rolePrefix}/donation/${notification.related_entity_id}`);
      }

      setShowPopover(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleViewAll = () => {
    setShowPopover(false);
    history.push('/notifications');
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'donation_created':
        return '📋';
      case 'donation_confirmed':
        return '✅';
      case 'donation_rejected':
        return '❌';
      case 'donation_completed':
        return '🎉';
      case 'donation_cancelled':
        return '⚠️';
      case 'ngo_verified':
        return '✔️';
      case 'ngo_rejected':
        return '❌';
      case 'ngo_registration':
        return '🏢';
      case 'location_added':
        return '📍';
      default:
        return '🔔';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <div className="notification-bell-container" onClick={() => setShowPopover(true)}>
        <IonIcon icon={bellIcon} className="notification-bell-icon" style={{ fontSize: '26px', color: '#ffc409' }} />
        {unreadCount > 0 && (
          <IonBadge color="danger" className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </IonBadge>
        )}
      </div>

      <IonPopover isOpen={showPopover} onDidDismiss={() => setShowPopover(false)} className="notification-popover">
        <div className="notification-popover-content">
          <div className="notification-header">
            <IonText>
              <h3>Notifications</h3>
            </IonText>
            {unreadCount > 0 && (
              <IonButton fill="clear" size="small" onClick={handleMarkAllRead}>
                Mark all read
              </IonButton>
            )}
          </div>

          {loading ? (
            <div className="notification-loading">
              <IonSpinner />
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <IonText color="medium">
                <p>No new notifications</p>
              </IonText>
            </div>
          ) : (
            <IonList className="notification-list">
              {notifications.slice(0, 5).map((notification) => (
                <IonItem
                  key={notification.id}
                  button
                  onClick={() => handleNotificationClick(notification)}
                  className={!notification.is_read ? 'notification-unread' : ''}>
                  <div className="notification-item-content">
                    <div className="notification-icon">{getNotificationIcon(notification.notification_type)}</div>
                    <div className="notification-text">
                      <IonLabel>
                        <h3>{notification.title}</h3>
                        <p>{notification.message}</p>
                        <p className="notification-time">{formatTime(notification.created_at)}</p>
                      </IonLabel>
                    </div>
                  </div>
                </IonItem>
              ))}
            </IonList>
          )}

          <div className="notification-footer">
            <IonButton expand="block" fill="clear" onClick={handleViewAll}>
              View All Notifications
            </IonButton>
          </div>
        </div>
      </IonPopover>
    </>
  );
};

export default NotificationBell;
