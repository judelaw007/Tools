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
  LearnWorldsCourseProgress,
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
   *
   * Note: LearnWorlds API /v2/users?email=xxx doesn't filter correctly,
   * so we need to paginate through all users and find the match.
   */
  async getUserByEmail(email: string): Promise<LearnWorldsUser | null> {
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Looking up user in LearnWorlds: ${normalizedEmail}`);

    try {
      // First try the direct email query (in case it works for some schools)
      const directResponse = await this.request<LearnWorldsApiResponse<LearnWorldsUser[]>>(
        `/v2/users?email=${encodeURIComponent(normalizedEmail)}`
      );

      const directUser = directResponse.data?.find(
        (u: LearnWorldsUser) => u.email?.toLowerCase() === normalizedEmail
      );

      if (directUser) {
        console.log(`Found user via direct query: ${directUser.email}`);
        return directUser;
      }

      // If direct query didn't work, search through paginated results
      console.log(`Direct query failed, searching through all users...`);
      let page = 1;
      const itemsPerPage = 50;
      let hasMore = true;

      while (hasMore) {
        const response = await this.request<LearnWorldsApiResponse<LearnWorldsUser[]>>(
          `/v2/users?page=${page}&items_per_page=${itemsPerPage}`
        );

        const users = response.data || [];

        // Find user with matching email
        const matchingUser = users.find(
          (u: LearnWorldsUser) => u.email?.toLowerCase() === normalizedEmail
        );

        if (matchingUser) {
          console.log(`Found user on page ${page}: ${matchingUser.email}`);
          return matchingUser;
        }

        // Check if there are more pages
        if (users.length < itemsPerPage) {
          hasMore = false;
        } else {
          page++;
          // Safety limit to prevent infinite loops
          if (page > 100) {
            console.warn('Reached page limit (100) searching for user');
            hasMore = false;
          }
        }
      }

      console.log(`User not found in LearnWorlds: ${normalizedEmail}`);
      return null;
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
   * Get all courses from LearnWorlds (handles pagination)
   */
  async getCourses(): Promise<LearnWorldsProduct[]> {
    try {
      const allCourses: LearnWorldsProduct[] = [];
      let page = 1;
      const itemsPerPage = 50; // Max items per page
      let hasMore = true;

      while (hasMore) {
        const response = await this.request<LearnWorldsApiResponse<LearnWorldsProduct[]>>(
          `/v2/courses?page=${page}&items_per_page=${itemsPerPage}`
        );

        const courses = response.data || [];
        allCourses.push(...courses);

        // If we got fewer items than requested, we've reached the end
        if (courses.length < itemsPerPage) {
          hasMore = false;
        } else {
          page++;
        }
      }

      return allCourses;
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  }

  /**
   * Get all bundles from LearnWorlds (handles pagination)
   */
  async getBundles(): Promise<LearnWorldsProduct[]> {
    try {
      const allBundles: LearnWorldsProduct[] = [];
      let page = 1;
      const itemsPerPage = 50;
      let hasMore = true;

      while (hasMore) {
        const response = await this.request<LearnWorldsApiResponse<LearnWorldsProduct[]>>(
          `/v2/bundles?page=${page}&items_per_page=${itemsPerPage}`
        );

        const bundles = response.data || [];
        // Mark type explicitly
        bundles.forEach(b => b.type = 'bundle');
        allBundles.push(...bundles);

        if (bundles.length < itemsPerPage) {
          hasMore = false;
        } else {
          page++;
        }
      }

      return allBundles;
    } catch (error) {
      console.error('Error fetching bundles:', error);
      return [];
    }
  }

  /**
   * Get all subscriptions from LearnWorlds (handles pagination)
   */
  async getSubscriptions(): Promise<LearnWorldsProduct[]> {
    try {
      const allSubscriptions: LearnWorldsProduct[] = [];
      let page = 1;
      const itemsPerPage = 50;
      let hasMore = true;

      while (hasMore) {
        const response = await this.request<LearnWorldsApiResponse<LearnWorldsProduct[]>>(
          `/v2/subscriptions?page=${page}&items_per_page=${itemsPerPage}`
        );

        const subscriptions = response.data || [];
        // Mark type explicitly
        subscriptions.forEach(s => s.type = 'subscription');
        allSubscriptions.push(...subscriptions);

        if (subscriptions.length < itemsPerPage) {
          hasMore = false;
        } else {
          page++;
        }
      }

      return allSubscriptions;
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  }

  /**
   * Get all products (courses, bundles, AND subscriptions)
   * Use this for admin allocation pages to show all available products
   */
  async getAllProducts(): Promise<LearnWorldsProduct[]> {
    try {
      const [courses, bundles, subscriptions] = await Promise.all([
        this.getCourses(),
        this.getBundles(),
        this.getSubscriptions(),
      ]);

      // Mark course type explicitly
      courses.forEach(c => c.type = 'course');

      return [...courses, ...bundles, ...subscriptions];
    } catch (error) {
      console.error('Error fetching all products:', error);
      return [];
    }
  }

  /**
   * @deprecated Use getAllProducts() for all product types, or getCourses() for courses only
   */
  async getProducts(): Promise<LearnWorldsProduct[]> {
    return this.getCourses();
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
  // ENROLLMENT & ACCESS METHODS
  // ============================================

  /**
   * Get all enrollments for a user (products they own/purchased)
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
   * Get all COURSES a user has access to
   *
   * This is the KEY method for tool access control.
   * Returns course IDs the user can access regardless of HOW they got access:
   * - Direct course purchase
   * - Bundle that includes the course
   * - Subscription that grants access to the course
   *
   * LearnWorlds /v2/users/{id}/courses returns all accessible courses
   */
  async getUserCourseAccess(userId: string): Promise<string[]> {
    try {
      // This endpoint returns all courses the user has access to
      // Response structure: { data: [{ course: { id, title }, created, expires }] }
      const response = await this.request<LearnWorldsApiResponse<Array<{
        course: { id: string; title?: string };
        created?: number;
        expires?: number | null;
      }>>>(
        `/v2/users/${userId}/courses`
      );

      const courses = response.data || [];
      // Extract course ID from nested structure: data[].course.id
      return courses.map((c) => c.course?.id).filter((id): id is string => !!id);
    } catch (error) {
      console.error('Error fetching user course access:', error);
      // Fallback: extract course IDs from enrollments if endpoint fails
      const enrollments = await this.getUserEnrollments(userId);
      return enrollments
        .filter((e) => e.product_type === 'course')
        .map((e) => e.product_id);
    }
  }

  /**
   * Get course access by email (convenience method)
   */
  async getUserCourseAccessByEmail(email: string): Promise<string[]> {
    const user = await this.getUserByEmail(email);
    if (!user) return [];
    return this.getUserCourseAccess(user.id);
  }

  /**
   * Get detailed course progress for a user
   * Returns completion status, progress percentage, and completion date
   *
   * LearnWorlds API /v2/users/{id}/courses returns:
   * - course.id, course.title
   * - progress (0-100)
   * - completed (boolean)
   * - completed_date (timestamp)
   * - created (enrollment timestamp)
   */
  async getUserCourseProgress(userId: string): Promise<LearnWorldsCourseProgress[]> {
    try {
      const response = await this.request<LearnWorldsApiResponse<Array<{
        course: { id: string; title?: string };
        progress?: number;
        completed?: boolean;
        completed_date?: number; // Unix timestamp
        created?: number; // Enrollment timestamp
        // Additional fields that might exist
        score?: number;
        pct_completed?: number;
        is_completed?: boolean;
      }>>>(
        `/v2/users/${userId}/courses`
      );

      const courses = response.data || [];

      // Log raw response for debugging
      console.log(`LearnWorlds API raw course data for user ${userId}:`, JSON.stringify(courses, null, 2));

      return courses.map((c) => {
        // Check multiple possible fields for completion status
        const isCompleted = c.completed === true || c.is_completed === true || c.pct_completed === 100;

        console.log(`Course ${c.course?.id}: completed=${c.completed}, is_completed=${c.is_completed}, pct_completed=${c.pct_completed}, progress=${c.progress}, score=${c.score}`);

        return {
          courseId: c.course?.id || '',
          courseTitle: c.course?.title || 'Unknown Course',
          progress: c.score || c.pct_completed || c.progress || 0, // Use score if available
          completed: isCompleted,
          completedAt: c.completed_date
            ? new Date(c.completed_date * 1000).toISOString()
            : null,
          enrolledAt: c.created
            ? new Date(c.created * 1000).toISOString()
            : new Date().toISOString(),
        };
      }).filter((c) => c.courseId); // Filter out any with empty courseId
    } catch (error) {
      console.error('Error fetching user course progress:', error);
      return [];
    }
  }

  /**
   * Get course progress by email (convenience method)
   */
  async getUserCourseProgressByEmail(email: string): Promise<LearnWorldsCourseProgress[]> {
    const user = await this.getUserByEmail(email);
    if (!user) return [];
    return this.getUserCourseProgress(user.id);
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
