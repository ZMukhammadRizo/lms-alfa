-- Initialize Dashboard Tables
-- This script creates the minimally required tables for the dashboard to function
-- and populates them with sample data

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create basic assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  duedate TIMESTAMP WITH TIME ZONE NOT NULL,
  subjectid UUID REFERENCES public.subjects(id),
  subject TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  student_id UUID REFERENCES auth.users(id),
  grade INTEGER,
  submission_date TIMESTAMP WITH TIME ZONE,
  feedback_provided BOOLEAN DEFAULT false
);

-- Create basic grades table
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  score INTEGER NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student courses table
CREATE TABLE IF NOT EXISTS public.student_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  next_class TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lessonname TEXT NOT NULL,
  description TEXT,
  videourl TEXT,
  duration TEXT DEFAULT '45 min',
  uploadedat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subjectid UUID REFERENCES public.subjects(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own assignments" ON public.assignments 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = student_id);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own grades" ON public.grades 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = student_id);

ALTER TABLE public.student_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own courses" ON public.student_courses 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = student_id);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own lessons" ON public.lessons 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = student_id);

-- Insert sample data function
CREATE OR REPLACE FUNCTION insert_sample_dashboard_data(student_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Sample assignments
  INSERT INTO public.assignments (
    title, 
    description, 
    duedate, 
    student_id, 
    subject, 
    status, 
    created_at,
    updated_at,
    submission_date,
    grade,
    feedback_provided
  )
  VALUES 
    (
      'Math Quiz: Algebra Basics', 
      'Complete all questions in the algebra worksheet [attachment: Algebra_Basics.pdf]', 
      (NOW() + interval '5 days'), 
      student_uuid, 
      'Mathematics', 
      'pending',
      (NOW() - interval '5 days'),
      (NOW() - interval '5 days'),
      NULL,
      NULL,
      false
    ),
    (
      'Physics Lab Report', 
      'Write a report on the pendulum experiment [attachment: Lab_Instructions.pdf] [attachment: Data_Template.xlsx]', 
      (NOW() + interval '7 days'), 
      student_uuid, 
      'Physics', 
      'in-progress',
      (NOW() - interval '7 days'),
      (NOW() - interval '2 days'),
      NULL,
      NULL,
      false
    ),
    (
      'Literature Essay', 
      'Write a 1000-word essay on Shakespeare [attachment: Essay_Guidelines.pdf]', 
      (NOW() + interval '10 days'), 
      student_uuid, 
      'English', 
      'in-progress',
      (NOW() - interval '3 days'),
      (NOW() - interval '1 day'),
      NULL,
      NULL,
      false
    ),
    (
      'Chemistry Quiz', 
      'Complete the quiz on chemical bonds and reactions', 
      (NOW() - interval '2 days'), 
      student_uuid, 
      'Chemistry', 
      'completed',
      (NOW() - interval '10 days'),
      (NOW() - interval '2 days'),
      (NOW() - interval '2 days'),
      92,
      true
    ),
    (
      'History Research Paper', 
      'Research and write a 5-page paper on a historical event of your choice [attachment: Research_Guidelines.pdf]', 
      (NOW() - interval '5 days'), 
      student_uuid, 
      'History', 
      'overdue',
      (NOW() - interval '15 days'),
      (NOW() - interval '15 days'),
      NULL,
      NULL,
      false
    );

  -- Sample grades
  INSERT INTO public.grades (title, score, student_id, subject, date)
  VALUES 
    ('Chemistry Test', 92, student_uuid, 'Chemistry', (NOW() - interval '10 days')),
    ('History Essay', 88, student_uuid, 'History', (NOW() - interval '15 days')),
    ('Biology Quiz', 95, student_uuid, 'Biology', (NOW() - interval '20 days'));

  -- Sample courses
  INSERT INTO public.student_courses (student_id, course_name, teacher_name, progress, next_class)
  VALUES 
    (student_uuid, 'Mathematics', 'Dr. Smith', 75, 'Tomorrow, 9:00 AM'),
    (student_uuid, 'Physics', 'Prof. Johnson', 60, 'Thursday, 11:30 AM'),
    (student_uuid, 'English Literature', 'Mrs. Davis', 85, 'Wednesday, 1:00 PM');

  -- Sample lessons
  INSERT INTO public.lessons (title, subject, date, duration_minutes, room, student_id)
  VALUES 
    ('Introduction to Calculus', 'Mathematics', (NOW() + interval '1 day'), 60, 'Room 101', student_uuid),
    ('Wave Mechanics', 'Physics', (NOW() + interval '2 days'), 60, 'Lab 3', student_uuid);
END;
$$ LANGUAGE plpgsql;

-- To use the function, run:
-- SELECT insert_sample_dashboard_data('1eb67259-6461-4b59-ad9e-8db82f3adf94'); -- Replace with your actual user ID 