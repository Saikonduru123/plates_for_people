import api from './api';
import type {
  Rating,
  CreateRatingRequest,
  NGORatingSummary,
} from '../types';

export const ratingService = {
  // Create rating
  async createRating(data: CreateRatingRequest): Promise<Rating> {
    const response = await api.post<Rating>('/ratings/', data);
    return response.data;
  },

  // Get my ratings
  async getMyRatings(): Promise<Rating[]> {
    const response = await api.get<Rating[]>('/ratings/my-ratings');
    return response.data;
  },

  // Get NGO rating summary
  async getNGORatingSummary(ngoId: number): Promise<NGORatingSummary> {
    const response = await api.get<NGORatingSummary>(`/ratings/ngo/${ngoId}`);
    return response.data;
  },

  // Get NGO average rating
  async getNGOAverageRating(ngoId: number): Promise<{ average_rating: number; total_ratings: number }> {
    const response = await api.get<{ average_rating: number; total_ratings: number }>(
      `/ratings/ngo/${ngoId}/average`
    );
    return response.data;
  },

  // Get rating for specific donation
  async getDonationRating(donationId: number): Promise<Rating> {
    const response = await api.get<Rating>(`/ratings/donation/${donationId}`);
    return response.data;
  },

  // Delete rating
  async deleteRating(id: number): Promise<void> {
    await api.delete(`/ratings/${id}`);
  },
};
