# LMS Dashboard Setup

This guide explains how to set up the dashboard functionality for the LMS platform.

## Overview

The LMS dashboard provides real-time insights and data visualization for different user roles:

- **Admin Dashboard**: System-wide statistics, user management, and performance overview
- **Teacher Dashboard**: Class management, student performance, and assignment tracking
- **Student Dashboard**: Course progress, assignments, grades, and schedule

## Database Setup

1. Run the dashboard tables creation script in Supabase:

```bash
# Navigate to the SQL folder
cd frontend/sql

# Execute the SQL script in Supabase Studio or via the Supabase CLI
supabase db execute dashboard-tables.sql
```

Or copy the contents of `dashboard-tables.sql` into the Supabase SQL Editor and run it.

## Populating Sample Data

You can populate sample data for testing the dashboard by running the following script:

```sql
-- Sample data for subject_performance
INSERT INTO public.subject_performance (subject_id, subject_name, completion_rate)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Mathematics', 78),
  ('00000000-0000-0000-0000-000000000002', 'Science', 92),
  ('00000000-0000-0000-0000-000000000003', 'Language', 64),
  ('00000000-0000-0000-0000-000000000004', 'History', 85);

-- Sample data for daily_attendance
INSERT INTO public.daily_attendance (day, day_order, attendance_rate, week_start_date)
VALUES 
  ('Monday', 1, 92, '2023-09-04'),
  ('Tuesday', 2, 94, '2023-09-04'),
  ('Wednesday', 3, 90, '2023-09-04'),
  ('Thursday', 4, 88, '2023-09-04'),
  ('Friday', 5, 85, '2023-09-04');

-- Sample data for assessments
INSERT INTO public.assessments (title, date, participation_rate, average_score, created_by)
VALUES 
  ('Midterm Exam', '2023-09-15T00:00:00Z', 95, 82, 'TEACHER_USER_ID'),
  ('Science Quiz', '2023-09-12T00:00:00Z', 97, 78, 'TEACHER_USER_ID'),
  ('Language Test', '2023-09-10T00:00:00Z', 92, 85, 'TEACHER_USER_ID'),
  ('History Assignment', '2023-09-05T00:00:00Z', 90, 79, 'TEACHER_USER_ID');

-- Add more sample data as needed for other tables
```

Replace `TEACHER_USER_ID` with an actual teacher user ID from your system.

## Dashboard Service Integration

The dashboard functionality is implemented using the following files:

- `src/services/dashboardService.ts`: Core service for fetching dashboard data
- Dashboard components in `src/pages/admin`, `src/pages/teacher`, and `src/pages/student`

## Authentication & Authorization

The dashboard relies on proper user authentication and role-based access control:

1. Make sure user authentication is set up correctly
2. Verify that Row Level Security (RLS) policies are in place for all dashboard tables
3. Ensure that each user has the correct role assigned ('admin', 'teacher', or 'student')

## Development Workflow

1. Start the development server:

```bash
npm run dev
```

2. Login with different user roles to test each dashboard
3. Verify that the data is displayed correctly and updates in real-time

## Troubleshooting

If you encounter issues with the dashboard:

1. Check browser console for errors
2. Verify that all required tables exist in the database
3. Ensure that the user has the correct permissions
4. Check the network requests to see if the API calls are successful

## Performance Considerations

For improved dashboard performance:

1. Consider implementing caching for frequently accessed data
2. Use pagination for large datasets
3. Optimize database queries with proper indexing
4. Consider implementing real-time updates with Supabase Realtime 

## Fixing Dashboard Database Errors

If you encounter errors like these in your browser console:

```
Error fetching student assignments: {code: '42703', message: "column assignments.student_id does not exist"}
Error fetching student lessons: {code: '42703', message: "column lessons.student_id does not exist"}
```

These errors occur because the dashboard is trying to query columns that don't exist in your Supabase database.

## Database Schema

Our dashboard is designed to work with the following table structure:

1. **assignments**
   - `id`: UUID primary key
   - `title`: Text
   - `description`: Text (optional)
   - `due_date`: Timestamp
   - `subjectid`: UUID (reference to subjects)
   - `subject`: Text (direct subject name)
   - `status`: Text (pending, completed, etc.)

2. **lessons**
   - `id`: UUID primary key
   - `lessonname`: Text
   - `description`: Text (optional)
   - `videourl`: Text (URL to lesson video)
   - `duration`: Text (e.g., "45 min")
   - `uploadedat`: Timestamp
   - `subjectid`: UUID (reference to subjects)

3. **subjects**
   - `id`: UUID primary key
   - `subjectname`: Text
   - `teacherid`: UUID (reference to users)
   - Other subject-related fields

## How to Fix

### Option 1: Run the Database Setup Script

We've created a script that sets up the correct table structure:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the entire contents of `frontend/sql/initialize-dashboard.sql`
4. Paste it into the SQL Editor and run it

### Option 2: Modify Existing Tables

If you already have tables but with different column names:

1. Run these ALTER TABLE commands to add the missing columns:

```sql
-- For the assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS subjectid UUID REFERENCES public.subjects(id),
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- For the lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS lessonname TEXT,
ADD COLUMN IF NOT EXISTS videourl TEXT,
ADD COLUMN IF NOT EXISTS uploadedat TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subjectid UUID REFERENCES public.subjects(id);
```

## Fallback to Mock Data

If you prefer to use mock data instead of connecting to the database, the dashboard will automatically fall back to mock data when:

1. The tables don't exist
2. The required columns are missing
3. There's any other database error

The mock data provides a complete experience so you can continue development without setting up the database immediately. 