import api from './api';
import type { Notification } from '../types';

export const notificationService = {
  // Get all notifications for current user
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/notifications/');
    return response.data;
  },

  // Get unread notifications
  async getUnreadNotifications(): Promise<any> {
    const response = await api.get('/notifications/unread');
    return response.data;
  },

  // Mark notification as read
  async markAsRead(id: number): Promise<{ message: string; notification_id: number }> {
    const response = await api.put<{ message: string; notification_id: number }>(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ message: string; count: number }> {
    const response = await api.put<{ message: string; count: number }>('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  async deleteNotification(id: number): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  // Get unread count
  async getUnreadCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.data;
  },
};
