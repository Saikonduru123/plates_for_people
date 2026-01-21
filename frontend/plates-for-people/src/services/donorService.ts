import api from './api';
import type { DonorProfile, DonorDashboard } from '../types';

export const donorService = {
  // Get donor profile
  async getProfile(): Promise<DonorProfile> {
    const response = await api.get<DonorProfile>('/donors/profile');
    return response.data;
  },

  // Update donor profile
  async updateProfile(data: {
    organization_name?: string;
    contact_person?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  }): Promise<DonorProfile> {
    const response = await api.put<DonorProfile>('/donors/profile', data);
    return response.data;
  },

  // Get donor dashboard
  async getDashboard(): Promise<DonorDashboard> {
    const response = await api.get<DonorDashboard>('/donors/dashboard');
    return response.data;
  },
};
