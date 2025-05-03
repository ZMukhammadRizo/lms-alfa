-- Create assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    classid UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active'
);

-- Add RLS policies
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access for all authenticated users"
    ON public.assignments
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow write access only to administrators and teachers
CREATE POLICY "Allow write access for administrators and teachers"
    ON public.assignments
    FOR ALL
    TO authenticated
    USING (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'teacher')); 