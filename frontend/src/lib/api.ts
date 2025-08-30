import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import type { 
  APIResponse, 
  LoginRequest, 
  RegisterRequest, 
  TokenPair, 
  UserProfile, 
  TokenInfo, 
  RefreshRequest 
} from '../types';

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<TokenPair> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const tokens = this.getStoredTokens();
        if (tokens?.access_token) {
          config.headers.Authorization = `Bearer ${tokens.access_token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.handleTokenRefresh();
            const tokens = this.getStoredTokens();
            if (tokens?.access_token) {
              originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
            }
            
            return this.client(originalRequest);
          } catch (refreshError: any) {
            const errorMessage = refreshError.response?.data?.error || refreshError.message || '';
            
            if (errorMessage.includes('revoked') || errorMessage.includes('security')) {
              this.clearTokens();
              window.dispatchEvent(new CustomEvent('tokenRevoked', { 
                detail: { reason: 'Token revoked by server', error: errorMessage } 
              }));
            } else {
              this.clearTokens();
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async handleTokenRefresh(): Promise<TokenPair> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const tokens = this.getStoredTokens();
    if (!tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    this.refreshTokenPromise = this.refreshTokens({ refresh_token: tokens.refresh_token });
    
    try {
      const newTokens = await this.refreshTokenPromise;
      this.storeTokens(newTokens);
      return newTokens;
    } catch (error: any) {
      this.clearTokens();
      window.dispatchEvent(new CustomEvent('tokenRevoked', { 
        detail: { error: error.message } 
      }));
      
      throw error;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  private getStoredTokens(): TokenPair | null {
    try {
      const tokens = localStorage.getItem('auth_tokens');
      return tokens ? JSON.parse(tokens) : null;
    } catch {
      return null;
    }
  }

  private storeTokens(tokens: TokenPair): void {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }

  private clearTokens(): void {
    localStorage.removeItem('auth_tokens');
  }

  public isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  public isTokenExpiringSoon(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const fiveMinutes = 5 * 60;
      return decoded.exp < (currentTime + fiveMinutes);
    } catch {
      return true;
    }
  }

  async register(userData: RegisterRequest): Promise<APIResponse<{ user: any }>> {
    const response: AxiosResponse<APIResponse<{ user: any }>> = await this.client.post('/auth/register', userData);
    return response.data;
  }

  async login(credentials: LoginRequest): Promise<TokenPair> {
    const response: AxiosResponse<APIResponse<TokenPair>> = await this.client.post('/auth/login', credentials);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Login failed');
    }

    const tokens = response.data.data!;
    this.storeTokens(tokens);
    return tokens;
  }

  async refreshTokens(refreshData: RefreshRequest): Promise<TokenPair> {
    const response: AxiosResponse<APIResponse<TokenPair>> = await this.client.post('/auth/refresh', refreshData);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Token refresh failed');
    }

    return response.data.data!;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  async getProfile(): Promise<UserProfile> {
    const response: AxiosResponse<APIResponse<UserProfile>> = await this.client.get('/profile');
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get profile');
    }

    return response.data.data!;
  }

  async getTokenInfo(refreshToken?: string): Promise<TokenInfo> {
    const params = refreshToken ? { refresh_token: refreshToken } : {};
    const response: AxiosResponse<APIResponse<TokenInfo>> = await this.client.get('/debug/token-info', { params });
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get token info');
    }

    return response.data.data!;
  }

  async testProtectedEndpoint(): Promise<any> {
    const response: AxiosResponse<APIResponse<any>> = await this.client.get('/protected');
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to access protected endpoint');
    }

    return response.data.data!;
  }

  async healthCheck(): Promise<any> {
    const response: AxiosResponse<APIResponse<any>> = await this.client.get('/health');
    return response.data;
  }

  async manualRefresh(): Promise<TokenPair> {
    const tokens = this.getStoredTokens();
    if (!tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const newTokens = await this.refreshTokens({ refresh_token: tokens.refresh_token });
    this.storeTokens(newTokens);
    return newTokens;
  }

  async simulateTokenTheft(refreshToken: string): Promise<any> {
    const response: AxiosResponse<APIResponse<any>> = await this.client.post('/security/simulate-theft', {
      refresh_token: refreshToken
    });
    return response.data;
  }

  async getTokenStatus(refreshToken: string): Promise<any> {
    const response: AxiosResponse<APIResponse<any>> = await this.client.get(`/security/token-status?refresh_token=${refreshToken}`);
    return response.data;
  }

  async generateQRCode(): Promise<any> {
    const response: AxiosResponse<APIResponse<any>> = await this.client.post('/qr/generate');
    return response.data;
  }

  async validateQRCode(qrData: string): Promise<any> {
    const response: AxiosResponse<APIResponse<any>> = await this.client.post('/qr/validate', {
      qr_data: qrData
    });
    return response.data;
  }

  async getDatabaseView(): Promise<any> {
    const response: AxiosResponse<APIResponse<any>> = await this.client.get('/admin/database');
    return response.data;
  }
}

export const api = new ApiClient();
