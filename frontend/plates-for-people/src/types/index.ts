// User and Authentication Types
export type UserRole = 'donor' | 'ngo' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Donor Types
export interface DonorProfile {
  id: number;
  user_id: number;
  organization_name: string;
  contact_person: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface DonorDashboard {
  total_donations: number;
  pending_donations: number;
  completed_donations: number;
  cancelled_donations: number;
  average_rating: number;
  total_meals_donated: number;
}

// NGO Types
export type NGOVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface NGOProfile {
  id: number;
  user_id: number;
  organization_name: string;
  registration_number: string;
  contact_person: string;
  phone: string;
  verification_document_url: string | null;
  verification_status: NGOVerificationStatus;
  verified_at: string | null;
  rejection_reason: string | null;
  default_breakfast_capacity?: number;
  default_lunch_capacity?: number;
  default_snacks_capacity?: number;
  default_dinner_capacity?: number;
}

export interface NGOLocation {
  id: number;
  ngo_id: number;
  location_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  contact_person?: string | null;
  contact_phone?: string | null;
  operating_hours?: string | null;
  is_active: boolean;
  default_breakfast_capacity?: number;
  default_lunch_capacity?: number;
  default_snacks_capacity?: number;
  default_dinner_capacity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface NGOLocationCapacity {
  id: number;
  location_id: number;
  date: string;
  max_capacity: number;
  current_bookings: number;
  available_capacity: number;
  notes: string | null;
}

export interface NGODashboard {
  total_requests: number;
  pending_requests: number;
  completed_requests: number;
  average_rating: number | null;
  total_plates_received: number;
  recent_requests: Donation[];
  total_donations_received?: number;
  pending_donations?: number;
  completed_donations?: number;
  total_meals_received?: number;
  recent_donations?: Donation[];
}

// Donation Types
export type DonationStatus = 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface Donation {
  id: number;
  donor_id: number;
  donor_name?: string | null;
  ngo_location_id: number;
  food_type: string;
  quantity_plates: number;
  meal_type: MealType;
  donation_date: string;
  pickup_time_start: string;
  pickup_time_end: string;
  description: string | null;
  special_instructions: string | null;
  status: DonationStatus;
  rejection_reason: string | null;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  ngo_name?: string | null;
  location_name?: string | null;
}

export interface CreateDonationRequest {
  ngo_location_id: number;
  food_type: string;
  quantity_plates: number;
  meal_type: MealType;
  donation_date: string;
  pickup_time_start: string;
  pickup_time_end: string;
  description?: string;
  special_instructions?: string;
}

export interface UpdateDonationStatusRequest {
  status: DonationStatus;
  rejection_reason?: string;
}

// Search Types
export interface SearchNGOsRequest {
  latitude: number;
  longitude: number;
  radius?: number;
  radius_km?: number;
  meal_type?: MealType;
  donation_date?: string;
  pickup_date?: string;
  min_capacity?: number;
}

export interface NGOSearchResult {
  ngo_id: number;
  ngo_name: string;
  location_id: number;
  location_name: string;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  distance_km: number;
  available_capacity: number | null;
  average_rating: number | null;
  total_ratings: number;
  contact: {
    person: string;
    phone: string;
  };
}

export interface NGOSearchResponse {
  total: number;
  search_params: {
    latitude: number;
    longitude: number;
    radius_km: number;
    date: string | null;
    meal_type: string | null;
    min_capacity: number | null;
  };
  ngos: NGOSearchResult[];
}

// Rating Types
export interface Rating {
  id: number;
  donation_id: number;
  donor_id: number;
  ngo_id: number;
  rating: number;
  feedback: string | null;
  created_at: string;
  donation: Donation;
}

export interface CreateRatingRequest {
  donation_id: number;
  rating: number;
  feedback?: string;
}

export interface NGORatingSummary {
  ngo_id: number;
  ngo_name: string;
  average_rating: number;
  total_ratings: number;
  rating_distribution: {
    [key: string]: number;
  };
  recent_ratings?: Rating[];
}

// Notification Types
export type NotificationType =
  | 'donation_created'
  | 'donation_confirmed'
  | 'donation_rejected'
  | 'donation_completed'
  | 'donation_cancelled'
  | 'ngo_verified'
  | 'ngo_rejected'
  | 'rating_received';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  related_id: number | null;
  is_read: boolean;
  created_at: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
}

export interface NGORegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  organization_name: string;
  registration_number: string;
  phone_number: string;
  address: string;
  description?: string;
}

export interface CreateDonationFormData {
  ngo_location_id: number;
  food_type: string;
  quantity_plates: number;
  meal_type: MealType;
  donation_date: string;
  pickup_time_start: string;
  pickup_time_end: string;
  description?: string;
  special_instructions?: string;
}

export interface CreateLocationFormData {
  location_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  contact_person: string;
  contact_phone: string;
  operating_hours?: string;
  default_breakfast_capacity?: number;
  default_lunch_capacity?: number;
  default_snacks_capacity?: number;
  default_dinner_capacity?: number;
}

export interface SetCapacityFormData {
  date: string;
  max_capacity: number;
  notes?: string;
}

// Admin Types
export interface AdminDashboard {
  pending_verifications: number;
  verified_ngos: number;
  rejected_ngos: number;
  total_users: number;
  active_users: number;
  total_donations: number;
  completed_donations: number;
  // Computed properties for frontend
  total_donors?: number;
  total_ngos?: number;
}

// Utility Types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ToastMessage {
  message: string;
  color: 'success' | 'danger' | 'warning' | 'primary';
  duration?: number;
}
