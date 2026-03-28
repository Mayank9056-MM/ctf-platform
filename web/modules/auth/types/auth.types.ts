// Request Types

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  avatar?: File;
};

export type OAuthCallbackInput = {
  provider: "google" | "github";
  token: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordInput = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// Response Types

export type AuthUser = {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  avatar?: {
    url: string;
    publicId: string;
  };
  role: "user" | "admin" | "superadmin";
  isVerified: boolean;
  isBanned: boolean;
  score: number;
  country?: string;
  teamId?: string;
  providers: { provider: string; providerId: string }[];
  createdAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  statusCode: number;
  data: AuthUser;

  message: string;
};

export type RegisterResponse = {
  statusCode: number;
  data: AuthUser;
  message: string;
};

export type MeResponse = {
  statusCode: number;
  data: AuthUser;
  message: string;
};

// Zustand Store Types

export type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
};

export type AuthActions = {
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: () => void;
  logout: () => void;
};

export type AuthStore = AuthState & AuthActions;
