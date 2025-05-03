-- This script creates the assignments table and populates it with sample data
-- Run this directly in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the assignments table if it exists (careful in production)
DROP TABLE IF EXISTS public.assignments CASCADE;

-- Create assignments table
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

-- Function to insert sample assignments for a student
CREATE OR REPLACE FUNCTION insert_sample_assignments(student_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Delete any existing assignments for this student
  DELETE FROM public.assignments WHERE student_id = student_uuid;
  
  -- Insert sample assignments
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
      'Quadratic Equations Problem Set', 
      'Complete the problem set on quadratic equations including word problems and applications. [attachment: Problem_Set.pdf]', 
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
      'Physics Lab Report: Forces and Motion', 
      'Write a lab report based on the experiments conducted on forces and motion. Include all data tables and analysis. [attachment: Lab_Instructions.pdf] [attachment: Data_Collection_Template.xlsx]', 
      (NOW() + interval '10 days'), 
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
      'Macbeth Character Analysis Essay', 
      'Write a 1500-word essay analyzing the character development of Macbeth throughout the play. [attachment: Essay_Guidelines.pdf]', 
      (NOW() - interval '2 days'), 
      student_uuid, 
      'English Literature', 
      'overdue',
      (NOW() - interval '15 days'),
      (NOW() - interval '15 days'),
      NULL,
      NULL,
      false
    ),
    (
      'Chemical Reactions Worksheet', 
      'Complete the worksheet on balancing chemical equations and identifying reaction types. [attachment: Chemical_Reactions_Worksheet.pdf]', 
      (NOW() + interval '3 days'), 
      student_uuid, 
      'Chemistry', 
      'in-progress',
      (NOW() - interval '7 days'),
      (NOW() - interval '2 days'),
      NULL,
      NULL,
      false
    ),
    (
      'World War II Research Project', 
      'Research and create a presentation on a specific aspect of World War II. Topics must be approved by the teacher. [attachment: Research_Project_Guidelines.pdf]', 
      (NOW() + interval '20 days'), 
      student_uuid, 
      'World History', 
      'upcoming',
      (NOW() - interval '5 days'),
      (NOW() - interval '5 days'),
      NULL,
      NULL,
      false
    ),
    (
      'Python Programming Assignment', 
      'Create a Python program that implements the specified algorithms and data structures. [attachment: Programming_Assignment_Details.pdf] [attachment: Starter_Code.zip]', 
      (NOW() + interval '8 days'), 
      student_uuid, 
      'Computer Science', 
      'in-progress',
      (NOW() - interval '10 days'),
      (NOW() - interval '3 days'),
      NULL,
      NULL,
      false
    ),
    (
      'Linear Algebra Quiz', 
      'Complete the online quiz on linear algebra concepts including matrices and determinants. [attachment: Study_Guide.pdf]', 
      (NOW() - interval '7 days'), 
      student_uuid, 
      'Mathematics', 
      'completed',
      (NOW() - interval '14 days'),
      (NOW() - interval '8 days'),
      (NOW() - interval '7 days'),
      88,
      true
    ),
    (
      'Energy Conservation Analysis', 
      'Analyze the given scenarios and apply energy conservation principles to solve the problems. [attachment: Energy_Problems.pdf]', 
      (NOW() + interval '15 days'), 
      student_uuid, 
      'Physics', 
      'upcoming',
      (NOW() - interval '2 days'),
      (NOW() - interval '2 days'),
      NULL,
      NULL,
      false
    );
END;
$$ LANGUAGE plpgsql;

-- To run this function to populate data for a specific user, use:
-- SELECT insert_sample_assignments('your-user-uuid-here');

-- Example usage (replace with your actual user ID):
-- SELECT insert_sample_assignments('1eb67259-6461-4b59-ad9e-8db82f3adf94'); 