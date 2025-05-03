# LMS Assignments Setup

This guide explains how to set up and connect the assignments page to Supabase.

## Overview

The assignments page displays all assignments for students, allowing them to:

- View assignment details and due dates
- Filter assignments by course and status
- Search assignments by title/description
- Submit assignments
- View grades and feedback for completed assignments

## Database Setup

### Option 1: Quick Fix for Column Name Issues (Recommended)

If you're seeing errors like `column assignments.due_date does not exist` or similar:

1. Open the Supabase SQL Editor
2. Copy the contents of `frontend/sql/fix-assignments-table.sql`
3. Paste it into the SQL Editor and click "Run"
4. This will:
   - Create the assignments table if it doesn't exist
   - Rename `due_date` to `duedate` if needed
   - Add any missing columns
   - Set up proper RLS policies

### Option 2: Complete Setup

For the best experience with sample data:

1. Open the Supabase SQL Editor
2. Copy the contents of `frontend/sql/create-assignments.sql`
3. Paste it into the SQL Editor and click "Run"
4. At the bottom of the script, uncomment and modify the last line to include your user ID:
   ```sql
   SELECT insert_sample_assignments('your-user-uuid-here');
   ```
5. Run the script again with just this line to populate data for your specific user

### Option 3: Using initialize-dashboard.sql

If you've already run the dashboard initialization script, the assignments table should exist but may have limited sample data:

1. Open the Supabase SQL Editor
2. Run the following SQL to add the missing columns if needed:
   ```sql
   ALTER TABLE public.assignments 
   ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES auth.users(id),
   ADD COLUMN IF NOT EXISTS grade INTEGER,
   ADD COLUMN IF NOT EXISTS submission_date TIMESTAMP WITH TIME ZONE,
   ADD COLUMN IF NOT EXISTS feedback_provided BOOLEAN DEFAULT false;
   ```

## How It Works

### Data Flow

1. `assignmentService.ts` contains all functions for interacting with the assignments table
2. The Assignments component fetches data using `getStudentAssignments()`
3. If the table doesn't exist, it falls back to mock data automatically
4. Attachments are extracted from the description using a regex pattern `[attachment: filename.pdf]`

### Column Name Note

Our code uses `due_date` (with underscore) in the JavaScript interface, but the database column is `duedate` (without underscore). The service handles this conversion automatically.

### Status Calculation

Assignment status is calculated based on:
- The `status` field in the database
- The current date compared to the due date
- Status can be: 'pending', 'in-progress', 'completed', 'overdue', or 'upcoming'

## Troubleshooting

### Error: column assignments.due_date does not exist

This indicates a column name mismatch. Run the fix-assignments-table.sql script to resolve it.

### Error: Could not find a relationship between 'subjects' and 'teacherid'

This happens because the relationship between subjects and teachers is not properly set up in the database schema. The code has been updated to handle this.

## Further Development

To enhance the assignments page:

1. Create an actual attachments table to store files properly
2. Implement file upload functionality with Supabase Storage
3. Create a submissions table to track student submissions
4. Implement a grading system for teachers
5. Add proper foreign key relationships between subjects and teachers 