/**
 * API Configuration
 * Centralizes the base URL for API calls across the application
 */

// Use relative URL in production, absolute URL in development
// In production, the frontend is served by the backend from the same origin
// We check for localhost to determine if we should use the absolute URL for development
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname === '[::1]'
);

export const API_BASE_URL = isLocalhost 
  ? 'http://localhost:3001' 
  : '';

export const API_PREFIX = '/api';

/**
 * Returns the full API URL for a given path
 * @param path The path to the API endpoint (starting with /)
 * @returns The full URL
 */
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

/**
 * Returns the full URL for a static file (e.g. from /uploads)
 * @param path The path to the static file (starting with /)
 * @returns The full URL
 */
export const getStaticUrl = (path: string): string => {
  if (!path) return '';
  // If path is already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

