/**
 * LearnWorlds API Client
 *
 * Handles all communication with the LearnWorlds API including:
 * - Authentication (OAuth2)
 * - User management
 * - Course/Product enrollment checking
 *
 * API Documentation: https://www.learnworlds.dev/docs/api
 */

import {
  LearnWorldsConfig,
  LearnWorldsUser,
  LearnWorldsProduct,
  LearnWorldsEnrollment,
  LearnWorldsApiResponse,
} from './types';

class LearnWorldsClient {
  private config: LearnWorldsConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      schoolUrl: process.env.LEARNWORLDS_SCHOOL_URL || '',
      apiUrl: process.env.LEARNWORLDS_API_URL || '',
      clientId: process.env.LEARNWORLDS_CLIENT_ID || '',
      clientSecret: process.env.LEARNWORLDS_CLIENT_SECRET || '',
      accessToken: process.env.LEARNWORLDS_ACCESS_TOKEN || '',
    };

    // LearnWorlds API base URL - typically the school's API endpoint
    this.baseUrl = this.config.apiUrl.replace(/\/$/, '');
  }

  /**
   * Make an authenticated request to the LearnWorlds API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
      'Lw-Client': this.config.clientId,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `LearnWorlds API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  // ============================================
  // USER METHODS
  // ============================================

  /**
   * Get a user by their email address
   */
  async getUserByEmail(email: string): Promise<LearnWorldsUser | null> {
    try {
      const response = await this.request<LearnWorldsApiResponse<LearnWorldsUser[]>>(
        `/v2/users?email=${encodeURIComponent(email)}`
      );
      return response.data?.[0] || null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  /**
   * Get a user by their LearnWorlds ID
   */
  async getUserById(userId: string): Promise<LearnWorldsUser | null> {
    try {
      const response = await this.request<LearnWorldsUser>(
        `/v2/users/${userId}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  /**
   * Create or update a user in LearnWorlds
   */
  async upsertUser(userData: {
    email: string;
    first_name?: string;
    last_name?: string;
    password?: string;
  }): Promise<LearnWorldsUser | null> {
    try {
      // First check if user exists
      const existingUser = await this.getUserByEmail(userData.email);

      if (existingUser) {
        // Update existing user
        const response = await this.request<LearnWorldsUser>(
          `/v2/users/${existingUser.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(userData),
          }
        );
        return response;
      } else {
        // Create new user
        const response = await this.request<LearnWorldsUser>(
          `/v2/users`,
          {
            method: 'POST',
            body: JSON.stringify(userData),
          }
        );
        return response;
      }
    } catch (error) {
      console.error('Error upserting user:', error);
      return null;
    }
  }

  // ============================================
  // PRODUCT/COURSE METHODS
  // ============================================

  /**
   * Get all products (courses, bundles, subscriptions)
   */
  async getProducts(): Promise<LearnWorldsProduct[]> {
    try {
      const response = await this.request<LearnWorldsApiResponse<LearnWorldsProduct[]>>(
        '/v2/products'
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  /**
   * Get a specific product by ID
   */
  async getProductById(productId: string): Promise<LearnWorldsProduct | null> {
    try {
      const response = await this.request<LearnWorldsProduct>(
        `/v2/products/${productId}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  // ============================================
  // ENROLLMENT METHODS
  // ============================================

  /**
   * Get all enrollments for a user
   * This is the key method for access control
   */
  async getUserEnrollments(userId: string): Promise<LearnWorldsEnrollment[]> {
    try {
      const response = await this.request<LearnWorldsApiResponse<LearnWorldsEnrollment[]>>(
        `/v2/users/${userId}/products`
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user enrollments:', error);
      return [];
    }
  }

  /**
   * Get enrollments by email (convenience method)
   */
  async getUserEnrollmentsByEmail(email: string): Promise<LearnWorldsEnrollment[]> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return [];
    }
    return this.getUserEnrollments(user.id);
  }

  /**
   * Check if a user is enrolled in a specific product
   */
  async isUserEnrolled(userId: string, productId: string): Promise<boolean> {
    const enrollments = await this.getUserEnrollments(userId);
    return enrollments.some(
      (enrollment) => enrollment.product_id === productId
    );
  }

  /**
   * Check if user is enrolled in ANY of the given products
   */
  async isUserEnrolledInAny(
    userId: string,
    productIds: string[]
  ): Promise<{ enrolled: boolean; matchingProducts: string[] }> {
    const enrollments = await this.getUserEnrollments(userId);
    const enrolledProductIds = enrollments.map((e) => e.product_id);
    const matchingProducts = productIds.filter((id) =>
      enrolledProductIds.includes(id)
    );
    return {
      enrolled: matchingProducts.length > 0,
      matchingProducts,
    };
  }

  /**
   * Enroll a user in a product (for admin use)
   */
  async enrollUser(
    userId: string,
    productId: string
  ): Promise<LearnWorldsEnrollment | null> {
    try {
      const response = await this.request<LearnWorldsEnrollment>(
        `/v2/users/${userId}/products/${productId}`,
        {
          method: 'POST',
        }
      );
      return response;
    } catch (error) {
      console.error('Error enrolling user:', error);
      return null;
    }
  }

  // ============================================
  // SSO METHODS
  // ============================================

  /**
   * Generate SSO login URL for LearnWorlds
   * This redirects the user to LearnWorlds for authentication
   */
  generateSSOLoginUrl(returnUrl?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/learnworlds/callback`,
      response_type: 'code',
      ...(returnUrl && { state: returnUrl }),
    });

    return `${this.config.schoolUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token (OAuth2 flow)
   */
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    user?: LearnWorldsUser;
  } | null> {
    try {
      const response = await fetch(`${this.config.schoolUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/learnworlds/callback`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return null;
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.getProducts();
      return { success: true, message: 'LearnWorlds API connection successful' };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get configuration status (for debugging)
   */
  getConfigStatus(): {
    configured: boolean;
    missing: string[];
  } {
    const missing: string[] = [];

    if (!this.config.schoolUrl) missing.push('LEARNWORLDS_SCHOOL_URL');
    if (!this.config.apiUrl) missing.push('LEARNWORLDS_API_URL');
    if (!this.config.clientId) missing.push('LEARNWORLDS_CLIENT_ID');
    if (!this.config.clientSecret) missing.push('LEARNWORLDS_CLIENT_SECRET');
    if (!this.config.accessToken) missing.push('LEARNWORLDS_ACCESS_TOKEN');

    return {
      configured: missing.length === 0,
      missing,
    };
  }
}

// Export singleton instance
export const learnworlds = new LearnWorldsClient();

// Export class for testing
export { LearnWorldsClient };
