// API Configuration
// Set these environment variables for production deployment

export const API_CONFIG = {
  // Spring Boot Backend (handles auth, sessions, schedules, messages, WebSocket)
  SPRING_BOOT_URL: import.meta.env.VITE_SPRING_API_URL || 'http://localhost:8080/api',
  
  // Flask ML Backend (handles emotion analysis, chat analysis, session summaries)
  FLASK_URL: import.meta.env.VITE_FLASK_API_URL || 'http://localhost:5000/api',
  
  // WebSocket URL for real-time features
  WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080/ws',
  
  // Toggle between mock data and real backends
  // In production: set VITE_USE_MOCK=false in environment
  USE_MOCK: import.meta.env.VITE_USE_MOCK !== 'false',
};

// Storage key for JWT token
const AUTH_TOKEN_KEY = 'mindcarex_auth_token';

// Helper to get auth token for API calls
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

// Helper to set auth token
export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

// Common headers for Spring Boot API calls (with JWT auth)
export const getSpringHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Common headers for Flask API calls
export const getFlaskHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
});

// Helper to handle API responses with auth errors
export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 401) {
    // Token expired or invalid - clear auth state
    setAuthToken(null);
    localStorage.removeItem('mindcarex_auth_user');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
};
