-- Create the scores table to store grades, attendance, and comments in one place
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  grade INTEGER CHECK (grade >= 0 AND grade <= 10),
  attendance VARCHAR(10) CHECK (attendance IN ('present', 'absent', 'late', 'excused')) DEFAULT 'present',
  comment TEXT,
  quarter_id UUID REFERENCES quarters(id),
  teacher_id UUID REFERENCES users(id), -- Store the teacher who gave the score
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Each student can have only one score entry per lesson
  UNIQUE (student_id, lesson_id)
);

-- Create an index to speed up queries on student_id
CREATE INDEX IF NOT EXISTS idx_scores_student_id ON scores(student_id);

-- Create an index to speed up queries on lesson_id
CREATE INDEX IF NOT EXISTS idx_scores_lesson_id ON scores(lesson_id);

-- Create an index to speed up queries on quarter_id
CREATE INDEX IF NOT EXISTS idx_scores_quarter_id ON scores(quarter_id);

-- Create an index to speed up queries on teacher_id
CREATE INDEX IF NOT EXISTS idx_scores_teacher_id ON scores(teacher_id);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists to avoid errors
DROP TRIGGER IF EXISTS update_scores_updated_at_trigger ON scores;

-- Attach the trigger to the scores table
CREATE TRIGGER update_scores_updated_at_trigger
BEFORE UPDATE ON scores
FOR EACH ROW
EXECUTE FUNCTION update_scores_updated_at();

-- Update existing data from attendance and grade tables (if they exist)
-- This would be implemented based on the existing schema
-- Example (commenting out to avoid potential data loss):
/*
INSERT INTO scores (student_id, lesson_id, grade, attendance, quarter_id)
SELECT
  a.student_id,
  a.lesson_id,
  g.score AS grade,
  a.status AS attendance,
  g.quarter_id
FROM
  attendance a
LEFT JOIN
  grades g ON a.student_id = g.student_id AND a.lesson_id = g.lesson_id
WHERE
  NOT EXISTS (
    SELECT 1 FROM scores s
    WHERE s.student_id = a.student_id AND s.lesson_id = a.lesson_id
  );
*/

-- Comment explaining how to handle potential data migration
/*
Note for migration:
1. Before running this script, make sure to backup the 'attendance' and 'grades' tables.
2. After creating the 'scores' table, you'll need to migrate existing data.
3. Verify the data integrity after migration before removing the old tables.
4. If needed, create views that simulate the old tables for backward compatibility.
*/