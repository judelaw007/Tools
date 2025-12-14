/**
 * Student View Types
 *
 * Used by admins to preview the platform as different types of students
 */

export type StudentViewMode =
  | 'admin'           // Normal admin view (default)
  | 'no-account'      // Visitor with no account
  | 'no-courses'      // User with MojiTax account but no courses
  | 'with-course';    // User with specific course

export interface StudentViewState {
  mode: StudentViewMode;
  selectedCourseId?: string;
  selectedCourseName?: string;
}

export interface Course {
  id: string;
  title: string;
  type: string;
}
