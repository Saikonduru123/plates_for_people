import type { DonationStatus, MealType, NotificationType, UserRole } from '../types';

// Get color for donation status
export const getStatusColor = (
  status: DonationStatus
): 'success' | 'warning' | 'danger' | 'primary' | 'medium' => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'confirmed':
      return 'primary';
    case 'pending':
      return 'warning';
    case 'rejected':
    case 'cancelled':
      return 'danger';
    default:
      return 'medium';
  }
};

// Get display text for status
export const getStatusText = (status: DonationStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Confirmed';
    case 'rejected':
      return 'Rejected';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

// Get display text for meal type
export const getMealTypeText = (mealType: MealType): string => {
  switch (mealType) {
    case 'breakfast':
      return 'Breakfast';
    case 'lunch':
      return 'Lunch';
    case 'dinner':
      return 'Dinner';
    case 'snacks':
      return 'Snacks';
    default:
      return mealType;
  }
};

// Get icon for meal type
export const getMealTypeIcon = (mealType: MealType): string => {
  switch (mealType) {
    case 'breakfast':
      return 'cafe-outline';
    case 'lunch':
      return 'restaurant-outline';
    case 'dinner':
      return 'moon-outline';
    case 'snacks':
      return 'pizza-outline';
    default:
      return 'fast-food-outline';
  }
};

// Get display text for user role
export const getRoleText = (role: UserRole): string => {
  switch (role) {
    case 'donor':
      return 'Donor';
    case 'ngo':
      return 'NGO';
    case 'admin':
      return 'Admin';
    default:
      return role;
  }
};

// Get icon for notification type
export const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'donation_created':
      return 'add-circle-outline';
    case 'donation_confirmed':
      return 'checkmark-circle-outline';
    case 'donation_rejected':
      return 'close-circle-outline';
    case 'donation_completed':
      return 'checkmark-done-circle-outline';
    case 'donation_cancelled':
      return 'ban-outline';
    case 'ngo_verified':
      return 'shield-checkmark-outline';
    case 'ngo_rejected':
      return 'shield-outline';
    case 'rating_received':
      return 'star-outline';
    default:
      return 'notifications-outline';
  }
};

// Get color for notification type
export const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case 'donation_confirmed':
    case 'donation_completed':
    case 'ngo_verified':
      return 'success';
    case 'donation_rejected':
    case 'donation_cancelled':
    case 'ngo_rejected':
      return 'danger';
    case 'donation_created':
    case 'rating_received':
      return 'primary';
    default:
      return 'medium';
  }
};

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as Indian phone number (e.g., +91 98765 43210)
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  return phone;
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Calculate distance in readable format
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

// Format rating for display
export const formatRating = (rating: number | null): string => {
  if (rating === null) return 'No ratings';
  return rating.toFixed(1);
};

// Get star icons for rating
export const getStarIcons = (rating: number): ('star' | 'star-half' | 'star-outline')[] => {
  const stars: ('star' | 'star-half' | 'star-outline')[] = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < fullStars; i++) {
    stars.push('star');
  }
  
  if (hasHalfStar) {
    stars.push('star-half');
  }
  
  const emptyStars = 5 - stars.length;
  for (let i = 0; i < emptyStars; i++) {
    stars.push('star-outline');
  }
  
  return stars;
};
