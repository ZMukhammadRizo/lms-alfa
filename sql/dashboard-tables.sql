-- Dashboard Tables Creation Script
-- This script creates all the necessary tables for the LMS dashboard functionality

-- Activities table for tracking user actions
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  additional_data JSONB
);

-- Subject performance tracking
CREATE TABLE IF NOT EXISTS public.subject_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  completion_rate INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student performance tracking
CREATE TABLE IF NOT EXISTS public.student_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments tracking
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  participation_rate INTEGER NOT NULL,
  average_score INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily attendance data
CREATE TABLE IF NOT EXISTS public.daily_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day TEXT NOT NULL,
  day_order INTEGER NOT NULL,
  attendance_rate INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments for students
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active'
);

-- Student to assignment mapping
CREATE TABLE IF NOT EXISTS public.student_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, assignment_id)
);

-- Assignment submissions
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  content TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'submitted',
  grade INTEGER,
  feedback TEXT,
  graded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  graded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(assignment_id, student_id)
);

-- Student course enrollment and progress
CREATE TABLE IF NOT EXISTS public.student_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  next_class TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Student grades
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  score INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lessons/schedule
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  room TEXT,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student lesson mapping
CREATE TABLE IF NOT EXISTS public.student_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- RLS Policies
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.activities 
  FOR SELECT 
  TO authenticated 
  USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.activities 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

ALTER TABLE public.subject_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.subject_performance 
  FOR SELECT 
  TO authenticated 
  USING (true);
CREATE POLICY "Allow update for admin and teacher users" ON public.subject_performance 
  FOR UPDATE 
  TO authenticated 
  USING (auth.jwt() ->> 'role' IN ('admin', 'teacher'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'teacher'));

ALTER TABLE public.student_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.student_performance 
  FOR SELECT 
  TO authenticated 
  USING (true);
CREATE POLICY "Allow update for admin and teacher users" ON public.student_performance 
  FOR UPDATE 
  TO authenticated 
  USING (auth.jwt() ->> 'role' IN ('admin', 'teacher'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'teacher'));

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.assessments 
  FOR SELECT 
  TO authenticated 
  USING (true);
CREATE POLICY "Allow insert and update for admin and teacher users" ON public.assessments 
  FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'role' IN ('admin', 'teacher'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'teacher'));

ALTER TABLE public.daily_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.daily_attendance 
  FOR SELECT 
  TO authenticated 
  USING (true);
CREATE POLICY "Allow update for admin and teacher users" ON public.daily_attendance 
  FOR UPDATE 
  TO authenticated 
  USING (auth.jwt() ->> 'role' IN ('admin', 'teacher'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'teacher'));

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.assignments 
  FOR SELECT 
  TO authenticated 
  USING (true);
CREATE POLICY "Allow insert and update for admin and teacher users" ON public.assignments 
  FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'role' IN ('admin', 'teacher'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'teacher'));

ALTER TABLE public.student_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.student_assignments 
  FOR SELECT 
  TO authenticated 
  USING (true);
CREATE POLICY "Allow insert and update for admin and teacher users" ON public.student_assignments 
  FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'role' IN ('admin', 'teacher'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'teacher'));

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.assignment_submissions 
  FOR SELECT 
  TO authenticated 
  USING (true);
CREATE POLICY "Allow students to submit their own assignments" ON public.assignment_submissions 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Allow update for admin and teacher users" ON public.assignment_submissions 
  FOR UPDATE 
  TO authenticated 
  USING (auth.jwt() ->> 'role' IN ('admin', 'teacher'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'teacher'));

ALTER TABLE public.student_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.student_courses 
  FOR SELECT 
  TO authenticated 
  USING (true);
CREATE POLICY "Allow insert and update for admin and teacher users" ON public.student_courses 
  FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'role' IN ('admin', 'teacher'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'teacher'));

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.grades 
  FOR SELECT 
  TO authenticated 
  USING (true);
CREATE POLICY "Allow insert and update for admin and teacher users" ON public.grades 
  FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'role' IN ('admin', 'teacher'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'teacher'));

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.lessons 
  FOR SELECT 
  TO authenticated 
  USING (true);
CREATE POLICY "Allow insert and update for admin and teacher users" ON public.lessons 
  FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'role' IN ('admin', 'teacher'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'teacher'));

ALTER TABLE public.student_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for authenticated users" ON public.student_lessons 
  FOR SELECT 
  TO authenticated 
  USING (true);
CREATE POLICY "Allow insert and update for admin and teacher users" ON public.student_lessons 
  FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'role' IN ('admin', 'teacher'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'teacher')); 