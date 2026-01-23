import api from './api';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';

export const authService = {
  // Login
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      email: data.email,
      password: data.password,
    });
    return response.data;
  },

  // Register Donor
  async registerDonor(data: RegisterRequest): Promise<AuthResponse> {
    const requestBody = {
      user_data: {
        email: data.email,
        password: data.password,
        role: 'donor',
      },
      profile_data: {
        organization_name: data.full_name,
        contact_person: data.full_name,
        phone: data.phone_number || '+1234567890',
        address_line1: 'Not provided',
        address_line2: null,
        city: 'Not provided',
        state: 'Not provided',
        zip_code: '000000',
        country: 'India',
        latitude: 19.076,
        longitude: 72.8777,
      },
    };
    const response = await api.post<AuthResponse>('/auth/register/donor', requestBody);
    return response.data;
  },

  // Register NGO
  async registerNGO(
    data: RegisterRequest & {
      organization_name: string;
      registration_number: string;
      address: string;
      description?: string;
    },
  ): Promise<AuthResponse> {
    const requestBody = {
      user_data: {
        email: data.email,
        password: data.password,
        role: 'ngo',
      },
      profile_data: {
        organization_name: data.organization_name,
        registration_number: data.registration_number,
        contact_person: data.full_name,
        phone: data.phone_number,
        verification_document_url: null,
      },
    };
    const response = await api.post<AuthResponse>('/auth/register/ngo', requestBody);
    return response.data;
  },

  // Get current user
  async me(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    const response = await api.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  // Logout (client-side only)
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};
