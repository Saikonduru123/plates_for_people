import api from './api';
import type {
  NGOSearchResult,
  SearchNGOsRequest,
  NGOProfile,
} from '../types';

export const searchService = {
  // Search nearby NGOs
  async searchNGOs(params: SearchNGOsRequest): Promise<NGOSearchResult[]> {
    const response = await api.get<NGOSearchResult[]>('/search/nearby-ngos', {
      params: {
        latitude: params.latitude,
        longitude: params.longitude,
        radius_km: params.radius_km,
        meal_type: params.meal_type,
        pickup_date: params.pickup_date,
        min_capacity: params.min_capacity,
      },
    });
    return response.data;
  },

  // Get NGO by ID (public view)
  async getNGO(id: number): Promise<NGOProfile> {
    const response = await api.get<NGOProfile>(`/search/ngo/${id}`);
    return response.data;
  },

  // Get all verified NGOs
  async getAllVerifiedNGOs(): Promise<NGOProfile[]> {
    const response = await api.get<NGOProfile[]>('/search/verified-ngos');
    return response.data;
  },
};
