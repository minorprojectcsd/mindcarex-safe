import api from '@/lib/api';
import { UserRole } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  role: UserRole;
  userId?: string;
  email?: string;
  name?: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    const { token, role } = response.data;
    
    // Store token, role, and userId in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    if (response.data.userId) {
      localStorage.setItem('userId', response.data.userId);
    }
    
    return response.data;
  },

  async register(data: RegisterRequest): Promise<void> {
    await api.post('/api/auth/register', data);
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('mindcarex_auth_user');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getRole(): UserRole | null {
    return localStorage.getItem('role') as UserRole | null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};
