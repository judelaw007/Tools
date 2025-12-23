-- Add learning_hours column to skill_category_courses table
-- This stores the estimated learning hours for each course (admin-configured)

ALTER TABLE skill_category_courses
ADD COLUMN IF NOT EXISTS learning_hours DECIMAL(5,1) DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN skill_category_courses.learning_hours IS
  'Estimated learning hours for this course (e.g., 15.5 hours). Admin-configured per course.';
