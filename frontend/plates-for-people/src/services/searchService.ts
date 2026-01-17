import api from './api';
import type {
  NGOSearchResult,
  NGOSearchResponse,
  SearchNGOsRequest,
  NGOProfile,
} from '../types';

export const searchService = {
  // Search nearby NGOs
  async searchNGOs(params: SearchNGOsRequest): Promise<NGOSearchResult[]> {
    const response = await api.get<NGOSearchResponse>('/search/ngos', {
      params: {
        latitude: params.latitude,
        longitude: params.longitude,
        radius: params.radius || params.radius_km,
        donation_date: params.donation_date || params.pickup_date,
        meal_type: params.meal_type,
        min_capacity: params.min_capacity,
      },
    });
    return response.data.ngos;
  },

  // Get NGO by ID (public view)
  async getNGO(id: number): Promise<NGOProfile> {
    const response = await api.get<NGOProfile>(`/ngos/${id}`);
    return response.data;
  },

  // Get all verified NGOs
  async getAllVerifiedNGOs(): Promise<NGOProfile[]> {
    const response = await api.get<NGOProfile[]>('/ngos/verified');
    return response.data;
  },
};
