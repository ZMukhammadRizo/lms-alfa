-- Script to check and fix assignments table structure
-- Run this in Supabase SQL Editor to fix column naming issues

-- First check if the assignments table exists
DO $$
DECLARE
    table_exists BOOLEAN;
    due_date_exists BOOLEAN;
    duedate_exists BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'assignments'
    ) INTO table_exists;

    IF NOT table_exists THEN
        -- Create the table with the correct column name
        CREATE TABLE public.assignments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            description TEXT,
            duedate TIMESTAMP WITH TIME ZONE NOT NULL,  -- Note: using duedate (no underscore)
            subjectid UUID,
            subject TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            student_id UUID REFERENCES auth.users(id),
            grade INTEGER,
            submission_date TIMESTAMP WITH TIME ZONE,
            feedback_provided BOOLEAN DEFAULT false
        );

        -- Enable Row Level Security
        ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

        -- Create policy for students to view their assignments
        CREATE POLICY "Students can view their own assignments"
            ON public.assignments
            FOR SELECT
            TO authenticated
            USING (auth.uid() = student_id);

        -- Create policy for students to submit their assignments
        CREATE POLICY "Students can update their own assignments"
            ON public.assignments
            FOR UPDATE
            TO authenticated
            USING (auth.uid() = student_id);

        RAISE NOTICE 'Created assignments table with correct column name (duedate)';
    ELSE
        -- Check if due_date column exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'assignments' 
            AND column_name = 'due_date'
        ) INTO due_date_exists;

        -- Check if duedate column exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'assignments' 
            AND column_name = 'duedate'
        ) INTO duedate_exists;

        -- If due_date exists but duedate doesn't, rename column
        IF due_date_exists AND NOT duedate_exists THEN
            ALTER TABLE public.assignments RENAME COLUMN due_date TO duedate;
            RAISE NOTICE 'Renamed column due_date to duedate in assignments table';
        -- If duedate doesn't exist, add it
        ELSIF NOT duedate_exists THEN
            ALTER TABLE public.assignments ADD COLUMN duedate TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Added duedate column to assignments table';
        ELSE
            RAISE NOTICE 'duedate column already exists in assignments table';
        END IF;
    END IF;
END $$;

-- Make sure other required columns exist
ALTER TABLE public.assignments 
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS grade INTEGER,
  ADD COLUMN IF NOT EXISTS submission_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS feedback_provided BOOLEAN DEFAULT false;

-- Add or update RLS policies
DO $$
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Students can view their own assignments" ON public.assignments;
  DROP POLICY IF EXISTS "Students can update their own assignments" ON public.assignments;

  -- Create policies
  CREATE POLICY "Students can view their own assignments"
    ON public.assignments
    FOR SELECT
    TO authenticated
    USING (auth.uid() = student_id);

  CREATE POLICY "Students can update their own assignments"
    ON public.assignments
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = student_id);
END $$;

-- Insert sample data if needed (replace with your user ID)
-- SELECT insert_sample_assignments('your-user-uuid-here'); 