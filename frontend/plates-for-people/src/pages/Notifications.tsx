import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  IonIcon,
  IonBadge,
  IonModal,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  RefresherEventDetail,
} from '@ionic/react';
import { trashOutline, checkmarkDone, locationOutline } from 'ionicons/icons';
import { notificationService } from '../services/notificationService';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Notifications.css';

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

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const history = useHistory();
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = (await notificationService.getNotifications()) as unknown as NotificationResponse;
      setNotifications(response.notifications || []);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchNotifications();
    event.detail.complete();
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.is_read) {
        await notificationService.markAsRead(notification.id);
        await fetchNotifications();
      }

      // Show detail modal for location added notifications (admin only)
      if (user?.role === 'admin' && notification.notification_type === 'location_added') {
        setSelectedNotification(notification);
        setShowDetailModal(true);
        return;
      }

      // Navigate to related entity based on role and notification type
      if (user?.role === 'admin') {
        // Admin NGO registration notification
        if (notification.notification_type === 'ngo_registration') {
          history.push('/admin/verify-ngos');
        }
        // Admin location added notification - stays on notifications page to show details
        // Already on the notifications page, so no navigation needed
      } else {
        // Donor/NGO notifications
        const rolePrefix = user?.role === 'donor' ? 'donor' : 'ngo';
        if (notification.related_entity_type === 'donation' && notification.related_entity_id) {
          history.push(`/${rolePrefix}/donation/${notification.related_entity_id}`);
        }
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      await fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearRead = async () => {
    try {
      const readNotifications = notifications.filter((n) => n.is_read);
      for (const notification of readNotifications) {
        await notificationService.deleteNotification(notification.id);
      }
      await fetchNotifications();
    } catch (error) {
      console.error('Error clearing read notifications:', error);
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

  const filteredNotifications = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/donor/dashboard" />
          </IonButtons>
          <IonTitle>Notifications</IonTitle>
          <IonButtons slot="end">
            {unreadCount > 0 && (
              <IonButton onClick={handleMarkAllRead}>
                <IonIcon slot="icon-only" icon={checkmarkDone} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={filter} onIonChange={(e) => setFilter(e.detail.value as 'all' | 'unread')}>
            <IonSegmentButton value="all">
              <IonLabel>All ({notifications.length})</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="unread">
              <IonLabel>Unread {unreadCount > 0 && `(${unreadCount})`}</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <div className="notifications-loading">
            <IonSpinner />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            <IonText color="medium">
              <h2>📭</h2>
              <p>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
            </IonText>
          </div>
        ) : (
          <>
            <IonList>
              {filteredNotifications.map((notification) => (
                <IonItem
                  key={notification.id}
                  button
                  onClick={() => handleNotificationClick(notification)}
                  className={!notification.is_read ? 'notification-item-unread' : ''}>
                  <div className="notification-item-wrapper">
                    <div className="notification-item-icon">{getNotificationIcon(notification.notification_type)}</div>
                    <div className="notification-item-content">
                      <IonLabel>
                        <h2>{notification.title}</h2>
                        <p>{notification.message}</p>
                        <p className="notification-item-time">{formatTime(notification.created_at)}</p>
                      </IonLabel>
                      {!notification.is_read && (
                        <IonBadge color="primary" className="notification-item-badge">
                          New
                        </IonBadge>
                      )}
                    </div>
                    <IonButton fill="clear" color="danger" size="small" onClick={(e) => handleDeleteNotification(notification.id, e)}>
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonButton>
                  </div>
                </IonItem>
              ))}
            </IonList>

            {notifications.some((n) => n.is_read) && (
              <div className="notifications-actions">
                <IonButton expand="block" fill="outline" color="medium" onClick={handleClearRead}>
                  Clear Read Notifications
                </IonButton>
              </div>
            )}
          </>
        )}
      </IonContent>

      {/* Location Details Modal */}
      <IonModal isOpen={showDetailModal} onDidDismiss={() => setShowDetailModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setShowDetailModal(false)}>Close</IonButton>
            </IonButtons>
            <IonTitle>Location Added</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {selectedNotification && (
            <div style={{ padding: '16px' }}>
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={locationOutline} /> {selectedNotification.title}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p style={{ fontSize: '16px', marginBottom: '16px' }}>{selectedNotification.message}</p>
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ color: '#a0aec0', fontSize: '14px' }}>Received {new Date(selectedNotification.created_at).toLocaleString()}</p>
                  </div>
                  <IonButton
                    expand="block"
                    color="primary"
                    onClick={() => {
                      setShowDetailModal(false);
                      // Navigate to admin users page
                      history.push('/admin/users');
                    }}
                    style={{ marginTop: '24px' }}>
                    View NGO Profile
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Notifications;
