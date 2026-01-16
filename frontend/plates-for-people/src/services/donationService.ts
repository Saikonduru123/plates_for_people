import api from './api';
import type {
  Donation,
  CreateDonationRequest,
  UpdateDonationStatusRequest,
} from '../types';

export const donationService = {
  // Create donation request
  async createDonation(data: CreateDonationRequest): Promise<Donation> {
    const response = await api.post<Donation>('/donations/', data);
    return response.data;
  },

  // Get donation by ID
  async getDonation(id: number): Promise<Donation> {
    const response = await api.get<Donation>(`/donations/${id}`);
    return response.data;
  },

  // Get donor's donations
  async getMyDonations(): Promise<Donation[]> {
    const response = await api.get<Donation[]>('/donations/my-donations');
    return response.data;
  },

  // Get NGO's donation requests
  async getNGORequests(): Promise<Donation[]> {
    const response = await api.get<Donation[]>('/donations/ngo-requests');
    return response.data;
  },

  // Update donation status (NGO)
  async updateDonationStatus(
    id: number,
    data: UpdateDonationStatusRequest
  ): Promise<Donation> {
    const response = await api.patch<Donation>(`/donations/${id}/status`, data);
    return response.data;
  },

  // Complete donation (Donor)
  async completeDonation(id: number): Promise<Donation> {
    const response = await api.post<Donation>(`/donations/${id}/complete`);
    return response.data;
  },

  // Cancel donation (Donor)
  async cancelDonation(id: number): Promise<Donation> {
    const response = await api.post<Donation>(`/donations/${id}/cancel`);
    return response.data;
  },

  // Delete donation (Admin only)
  async deleteDonation(id: number): Promise<void> {
    await api.delete(`/donations/${id}`);
  },
};
