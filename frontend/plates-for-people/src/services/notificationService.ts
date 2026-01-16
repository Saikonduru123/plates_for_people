import api from './api';
import type { Notification } from '../types';

export const notificationService = {
  // Get all notifications for current user
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/notifications/');
    return response.data;
  },

  // Get unread notifications
  async getUnreadNotifications(): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/notifications/unread');
    return response.data;
  },

  // Mark notification as read
  async markAsRead(id: number): Promise<Notification> {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/notifications/mark-all-read');
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
