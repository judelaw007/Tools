export type UserRole = 'user' | 'admin';

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

// Dev users for testing - will be replaced with real Supabase auth
export const DEV_USERS: Record<string, User> = {
  user: {
    id: 'dev-user-1',
    email: 'user@mojitax.co.uk',
    name: 'Demo User',
    role: 'user',
  },
  admin: {
    id: 'dev-admin-1',
    email: 'admin@mojitax.co.uk',
    name: 'Admin User',
    role: 'admin',
  },
};
