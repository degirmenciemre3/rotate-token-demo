export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
  last_login?: string;
}

export interface TokenDetails {
  token: string;
  expires_at: string;
  is_valid: boolean;
  claims?: {
    user_id: string;
    username: string;
    email: string;
    exp: number;
    iat: number;
    iss: string;
    sub: string;
    jti: string;
  };
  type: string;
}

export interface TokenInfo {
  access_token?: TokenDetails;
  refresh_token?: TokenDetails;
  token_rotation_enabled: boolean;
  token_family?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface AuthState {
  user: User | null;
  tokens: TokenPair | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}
