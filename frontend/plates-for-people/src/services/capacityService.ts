/**
 * Capacity Service - Frontend API for meal-type capacity management
 * Handles communication with backend capacity endpoints
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export interface MealTypeCapacity {
  location_id: number;
  date: string;
  meal_type: MealType;
  capacity: number;
  is_manual: boolean;
  available: number;
  confirmed: number;
  notes?: string;
}

export interface SetCapacityRequest {
  location_id: number;
  date: string;
  meal_type: MealType;
  capacity: number;
  notes?: string;
}

export interface ManualCapacityOverride {
  id: number;
  date: string;
  meal_type: MealType;
  capacity: number;
  notes?: string;
  created_at: string;
}

/**
 * Get capacity for a specific location, date, and meal type
 */
export const getCapacity = async (
  locationId: number,
  date: string,
  mealType?: MealType,
  token?: string,
): Promise<MealTypeCapacity | MealTypeCapacity[]> => {
  const params: any = { target_date: date };
  if (mealType) {
    params.meal_type = mealType;
  }

  const response = await axios.get(`${API_BASE_URL}/ngos/locations/${locationId}/capacity`, {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return response.data;
};

/**
 * Get capacity for all meal types on a specific date
 */
export const getDayCapacity = async (locationId: number, date: string, token?: string): Promise<MealTypeCapacity[]> => {
  const response = await axios.get(`${API_BASE_URL}/ngos/locations/${locationId}/capacity`, {
    params: { target_date: date },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return response.data;
};

/**
 * Set manual capacity override for a specific date and meal type
 */
export const setCapacity = async (locationId: number, data: Omit<SetCapacityRequest, 'location_id'>, token: string): Promise<any> => {
  const response = await axios.post(
    `${API_BASE_URL}/ngos/locations/${locationId}/capacity`,
    { ...data, location_id: locationId },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
};

/**
 * Delete manual capacity override (revert to default)
 */
export const deleteCapacity = async (locationId: number, date: string, mealType: MealType, token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/ngos/locations/${locationId}/capacity`, {
    params: { target_date: date, meal_type: mealType },
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * List all manual capacity overrides for a location
 */
export const listManualCapacities = async (locationId: number, token: string): Promise<ManualCapacityOverride[]> => {
  const response = await axios.get(`${API_BASE_URL}/ngos/locations/${locationId}/capacity/manual`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};

/**
 * Helper: Format meal type for display
 */
export const formatMealType = (mealType: MealType): string => {
  const labels: Record<MealType, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    snacks: 'Snacks',
    dinner: 'Dinner',
  };
  return labels[mealType] || mealType;
};

/**
 * Helper: Get meal type icon
 */
export const getMealTypeIcon = (mealType: MealType): string => {
  const icons: Record<MealType, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    snacks: '🥤',
    dinner: '🌙',
  };
  return icons[mealType] || '🍽️';
};

/**
 * Helper: Get all meal types
 */
export const getAllMealTypes = (): MealType[] => {
  return ['breakfast', 'lunch', 'snacks', 'dinner'];
};

export default {
  getCapacity,
  getDayCapacity,
  setCapacity,
  deleteCapacity,
  listManualCapacities,
  formatMealType,
  getMealTypeIcon,
  getAllMealTypes,
};
