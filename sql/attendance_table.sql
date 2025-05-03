-- Enable UUID generation (once per database)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create attendance table
CREATE TABLE public.attendance (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id   UUID        NOT NULL
               REFERENCES public.lessons(id)
               ON DELETE CASCADE,
  student_id  UUID        NOT NULL
               REFERENCES public.users(id)
               ON DELETE CASCADE,
  present     BOOLEAN     NOT NULL DEFAULT FALSE,
  noted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (lesson_id, student_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_att_lesson ON public.attendance (lesson_id);
CREATE INDEX IF NOT EXISTS idx_att_student ON public.attendance (student_id);

-- RLS policies
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Policy to allow teachers to read attendance for their classes
CREATE POLICY "Teachers can read attendance" ON public.attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.class_teachers ct ON l.class_id = ct.class_id
      WHERE l.id = attendance.lesson_id
      AND ct.teacher_id = auth.uid()
    )
  );

-- Policy to allow teachers to insert/update attendance for their classes
CREATE POLICY "Teachers can insert/update attendance" ON public.attendance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.class_teachers ct ON l.class_id = ct.class_id
      WHERE l.id = attendance.lesson_id
      AND ct.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update attendance" ON public.attendance
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.class_teachers ct ON l.class_id = ct.class_id
      WHERE l.id = attendance.lesson_id
      AND ct.teacher_id = auth.uid()
    )
  );

-- Allow students to view their own attendance
CREATE POLICY "Students can view their own attendance" ON public.attendance
  FOR SELECT
  USING (student_id = auth.uid());

-- Allow admins full access
CREATE POLICY "Admins have full access to attendance" ON public.attendance
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );