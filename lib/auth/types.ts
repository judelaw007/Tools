// Session cookie name
export const SESSION_COOKIE_NAME = 'mojitax-session';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}
