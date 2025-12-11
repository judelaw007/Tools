// LearnWorlds API Types

export interface LearnWorldsConfig {
  schoolUrl: string;
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
}

// User from LearnWorlds API
export interface LearnWorldsUser {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  role?: string;
  created_at?: string;
  last_login?: string;
  is_admin?: boolean;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
}

// Course/Product from LearnWorlds
export interface LearnWorldsProduct {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  currency?: string;
  thumbnail?: string;
  type: 'course' | 'bundle' | 'subscription';
  created_at?: string;
  updated_at?: string;
  is_published?: boolean;
}

// User enrollment in a product
export interface LearnWorldsEnrollment {
  id: string;
  user_id: string;
  product_id: string;
  product_title?: string;
  product_type?: string;
  enrolled_at: string;
  expires_at?: string;
  progress?: number;
  completed?: boolean;
  completed_at?: string;
}

// API Response wrapper
export interface LearnWorldsApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    per_page?: number;
    total_count?: number;
    total_pages?: number;
  };
}

// SSO Token payload
export interface SSOTokenPayload {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  exp: number;
  iat: number;
}

// Access check result
export interface AccessCheckResult {
  hasAccess: boolean;
  reason: 'admin' | 'enrolled' | 'no_enrollment' | 'not_authenticated';
  enrolledCourses?: LearnWorldsEnrollment[];
  requiredCourses?: { id: string; name: string; url?: string }[];
}
