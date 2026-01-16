import api from './api';
import type {
  NGOProfile,
  NGODashboard,
  NGOLocation,
  NGOLocationCapacity,
  CreateLocationFormData,
  SetCapacityFormData,
} from '../types';

export const ngoService = {
  // Get NGO profile
  async getProfile(): Promise<NGOProfile> {
    const response = await api.get<NGOProfile>('/ngos/profile');
    return response.data;
  },

  // Update NGO profile
  async updateProfile(data: {
    organization_name?: string;
    phone_number?: string;
    address?: string;
    description?: string;
  }): Promise<NGOProfile> {
    const response = await api.put<NGOProfile>('/ngos/profile', data);
    return response.data;
  },

  // Get NGO dashboard
  async getDashboard(): Promise<NGODashboard> {
    const response = await api.get<NGODashboard>('/ngos/dashboard');
    return response.data;
  },

  // Location Management
  async getLocations(): Promise<NGOLocation[]> {
    const response = await api.get<NGOLocation[]>('/ngo-locations/');
    return response.data;
  },

  async getLocation(id: number): Promise<NGOLocation> {
    const response = await api.get<NGOLocation>(`/ngo-locations/${id}`);
    return response.data;
  },

  async createLocation(data: CreateLocationFormData): Promise<NGOLocation> {
    const response = await api.post<NGOLocation>('/ngo-locations/', data);
    return response.data;
  },

  async updateLocation(id: number, data: Partial<CreateLocationFormData>): Promise<NGOLocation> {
    const response = await api.put<NGOLocation>(`/ngo-locations/${id}`, data);
    return response.data;
  },

  async deleteLocation(id: number): Promise<void> {
    await api.delete(`/ngo-locations/${id}`);
  },

  // Capacity Management
  async getCapacity(locationId: number, date: string): Promise<NGOLocationCapacity> {
    const response = await api.get<NGOLocationCapacity>(
      `/ngo-locations/${locationId}/capacity/${date}`
    );
    return response.data;
  },

  async getCapacityRange(
    locationId: number,
    startDate: string,
    endDate: string
  ): Promise<NGOLocationCapacity[]> {
    const response = await api.get<NGOLocationCapacity[]>(
      `/ngo-locations/${locationId}/capacity/range`,
      { params: { start_date: startDate, end_date: endDate } }
    );
    return response.data;
  },

  async setCapacity(locationId: number, data: SetCapacityFormData): Promise<NGOLocationCapacity> {
    const response = await api.post<NGOLocationCapacity>(
      `/ngo-locations/${locationId}/capacity`,
      data
    );
    return response.data;
  },

  async updateCapacity(
    locationId: number,
    date: string,
    data: Partial<SetCapacityFormData>
  ): Promise<NGOLocationCapacity> {
    const response = await api.put<NGOLocationCapacity>(
      `/ngo-locations/${locationId}/capacity/${date}`,
      data
    );
    return response.data;
  },
};
