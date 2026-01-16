export const config = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  APP_NAME: 'Plates for People',
  VERSION: '1.0.0',
  DEFAULT_RADIUS_KM: 10,
  MAX_RADIUS_KM: 50,
  ITEMS_PER_PAGE: 20,
  TOAST_DURATION: 3000,
};

export default config;
