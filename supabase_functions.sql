-- Supabase SQL Function for Grade Reports

-- 1. Get Teacher Levels
CREATE OR REPLACE FUNCTION public.get_teacher_levels(
  teacher_uuid UUID
)
RETURNS TABLE (
  "levelId" UUID,
  "levelName" TEXT,
  "classCount" INT,
  "studentCount" INT,
  "subjectCount" INT
)
LANGUAGE SQL
AS $$
  SELECT
    l.id AS "levelId",
    l.name AS "levelName",
    COUNT(DISTINCT c.id) AS "classCount",
    COUNT(DISTINCT cs.studentid) AS "studentCount",
    COUNT(DISTINCT csub.subjectid) AS "subjectCount"
  FROM classes c
    JOIN levels l ON c.level_id = l.id
    LEFT JOIN classstudents cs ON cs.classid = c.id
    LEFT JOIN classsubjects csub ON csub.classid = c.id
  WHERE c.teacherid = teacher_uuid
  GROUP BY l.id, l.name;
$$;

-- 2. Get Level Classes (with optional level_id filter)
CREATE OR REPLACE FUNCTION public.get_level_classes(
  teacher_uuid UUID,
  lvl_id UUID = NULL
)
RETURNS TABLE (
  "levelId" UUID,
  "classId" UUID,
  "classname" TEXT,
  "studentCount" INT,
  "subjectCount" INT
)
LANGUAGE SQL
AS $$
  SELECT
    c.level_id AS "levelId",
    c.id AS "classId",
    c.classname,
    COUNT(DISTINCT cs.studentid) AS "studentCount",
    COUNT(DISTINCT csub.subjectid) AS "subjectCount"
  FROM classes c
    LEFT JOIN classstudents cs ON cs.classid = c.id
    LEFT JOIN classsubjects csub ON csub.classid = c.id
  WHERE c.teacherid = teacher_uuid
    AND (lvl_id IS NULL OR c.level_id = lvl_id)
  GROUP BY c.id, c.classname, c.level_id;
$$;

-- 3. Get Teacher Classes (without level grouping)
CREATE OR REPLACE FUNCTION public.get_teacher_classes(
  teacher_uuid UUID
)
RETURNS TABLE (
  "classId" UUID,
  "classname" TEXT,
  "levelId" UUID,
  "levelName" TEXT,
  "studentCount" INT,
  "subjectCount" INT
)
LANGUAGE SQL
AS $$
  SELECT
    c.id AS "classId",
    c.classname,
    l.id AS "levelId",
    l.name AS "levelName",
    COUNT(DISTINCT cs.studentid) AS "studentCount",
    COUNT(DISTINCT csub.subjectid) AS "subjectCount"
  FROM classes c
    JOIN levels l ON c.level_id = l.id
    LEFT JOIN classstudents cs ON cs.classid = c.id
    LEFT JOIN classsubjects csub ON csub.classid = c.id
  WHERE c.teacherid = teacher_uuid
  GROUP BY c.id, c.classname, l.id, l.name;
$$;