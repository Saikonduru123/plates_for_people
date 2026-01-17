import api from './api';
import type {
  AdminDashboard,
  NGOProfile,
  User,
  Donation,
} from '../types';

export const adminService = {
  // Get admin dashboard stats
  async getDashboard(): Promise<AdminDashboard> {
    const response = await api.get<AdminDashboard>('/admin/dashboard');
    return response.data;
  },

  // NGO Verification
  async getPendingNGOs(): Promise<NGOProfile[]> {
    const response = await api.get<NGOProfile[]>('/admin/ngos/pending');
    return response.data;
  },

  async approveNGO(ngoId: number): Promise<NGOProfile> {
    const response = await api.post<NGOProfile>(`/admin/ngos/${ngoId}/approve`);
    return response.data;
  },

  async rejectNGO(ngoId: number, reason: string): Promise<NGOProfile> {
    const response = await api.post<NGOProfile>(`/admin/ngos/${ngoId}/reject`, { reason });
    return response.data;
  },

  // User Management
  async getAllUsers(role?: string): Promise<User[]> {
    const params = role ? { role } : {};
    const response = await api.get<User[]>('/admin/users', { params });
    return response.data;
  },

  async deactivateUser(userId: number): Promise<User> {
    const response = await api.post<User>(`/admin/users/${userId}/deactivate`);
    return response.data;
  },

  async activateUser(userId: number): Promise<User> {
    const response = await api.post<User>(`/admin/users/${userId}/activate`);
    return response.data;
  },

  // Donations
  async getAllDonations(): Promise<Donation[]> {
    const response = await api.get<Donation[]>('/admin/donations');
    return response.data;
  },

  // Reports
  async getSystemReport(startDate: string, endDate: string): Promise<any> {
    const response = await api.get('/admin/reports/system', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },
};
