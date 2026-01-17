import api from './api';
import type {
  Donation,
  CreateDonationRequest,
  UpdateDonationStatusRequest,
} from '../types';

export const donationService = {
  // Create donation request
  async createDonation(data: CreateDonationRequest): Promise<Donation> {
    const response = await api.post<Donation>('/donations/requests', data);
    return response.data;
  },

  // Get donation by ID
  async getDonation(id: number): Promise<Donation> {
    const response = await api.get<Donation>(`/donations/requests/${id}`);
    return response.data;
  },

  // Get donor's donations
  async getMyDonations(): Promise<Donation[]> {
    const response = await api.get<Donation[]>('/donations/requests/my-donations');
    return response.data;
  },

  // Get NGO's donation requests
  async getNGORequests(): Promise<Donation[]> {
    const response = await api.get<Donation[]>('/donations/requests/ngo-requests');
    return response.data;
  },

  // Confirm donation (NGO)
  async confirmDonation(id: number): Promise<Donation> {
    const response = await api.post<Donation>(`/donations/requests/${id}/confirm`);
    return response.data;
  },

  // Reject donation (NGO)
  async rejectDonation(id: number, rejection_reason: string): Promise<Donation> {
    const response = await api.post<Donation>(`/donations/requests/${id}/reject`, null, {
      params: { rejection_reason }
    });
    return response.data;
  },

  // Update donation status (NGO)
  async updateDonationStatus(
    id: number,
    data: UpdateDonationStatusRequest
  ): Promise<Donation> {
    const response = await api.patch<Donation>(`/donations/requests/${id}/status`, data);
    return response.data;
  },

  // Complete donation (Donor)
  async completeDonation(id: number): Promise<Donation> {
    const response = await api.post<Donation>(`/donations/requests/${id}/complete`);
    return response.data;
  },

  // Cancel donation (Donor)
  async cancelDonation(id: number): Promise<Donation> {
    const response = await api.post<Donation>(`/donations/requests/${id}/cancel`);
    return response.data;
  },

  // Delete donation (Admin only)
  async deleteDonation(id: number): Promise<void> {
    await api.delete(`/donations/requests/${id}`);
  },
};
