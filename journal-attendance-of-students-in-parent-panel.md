🧠 1. Core Logic Explanation (For Cursor)
🧩 Main Concept
Parents should see their own children’s grades and attendance in a read-only way using data from:

scores (for grades)

attendance (for attendance, now with a status enum)

The users table (to determine the parent-child relationship)

👪 How Parent-Child Connection Works
Each user can have a parent_id (which refers to another user in the same table). So:

A parent has multiple children where users.parent_id = parent.id.

We query the children of the logged-in parent using this relation.

📊 Grades Flow
To show a child’s grades:

Get all children (users.parent_id = parent.id)

For each child, find all scores

Each score is tied to:

A lesson → has subjectid

A subject (via the lesson)

A quarter (quarter info for filtering if needed)

📅 Attendance Flow
To show attendance:

Again, get the children

For each child, fetch from the attendance table

Each record gives:

lesson_id

status: one of present, late, excused, absent

Use lesson_id to display lesson name + subject

⚙️ 2. Step-by-Step Instructions for Cursor
✅ Step 1: Create Zustand Store
Create a Zustand store useParentStudentStore that holds:

children: User[]

scores: ScoreWithLessonAndSubject[]

attendance: AttendanceWithLesson[]

loading: boolean

Also include fetchChildren, fetchScores, and fetchAttendance functions.

✅ Step 2: Fetch Children of the Logged-in Parent
Use Supabase users table:

sql
Copy
Edit
select * from users where parent_id = {parentId}
✅ Step 3: Fetch Grades (Scores)
Use this query logic:

sql
Copy
Edit
select
  scores.*,
  lessons.lessonname,
  lessons.subjectid,
  subjects.subjectname,
  quarters.name as quarter_name
from scores
join lessons on scores.lesson_id = lessons.id
join subjects on lessons.subjectid = subjects.id
join quarters on scores.quarter_id = quarters.id
where scores.student_id in ({childrenIds})
✅ Step 4: Fetch Attendance
Use this updated logic with the new status enum:

sql
Copy
Edit
select
  attendance.*,
  lessons.lessonname,
  subjects.subjectname
from attendance
join lessons on attendance.lesson_id = lessons.id
join subjects on lessons.subjectid = subjects.id
where attendance.student_id in ({childrenIds})
🧱 3. Zustand Store Setup (Code Snippets)
Types (define first):
ts
Copy
Edit
type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
}

interface Score {
  id: string;
  score: number;
  quarter_id: string;
  lesson_id: string;
  student_id: string;
  lessonname: string;
  subjectname: string;
  quarter_name: string;
}

interface Attendance {
  id: string;
  student_id: string;
  lesson_id: string;
  status: AttendanceStatus;
  noted_at: string;
  lessonname: string;
  subjectname: string;
}
Zustand Store (skeleton):
ts
Copy
Edit
import { create } from 'zustand';

export const useParentStudentStore = create((set) => ({
  children: [],
  scores: [],
  attendance: [],
  loading: false,

  fetchChildren: async (parentId: string) => {
    set({ loading: true });
    const { data: children } = await supabase
      .from('users')
      .select('id, firstName, lastName')
      .eq('parent_id', parentId);
    set({ children, loading: false });
  },

  fetchScores: async (childIds: string[]) => {
    const { data: scores } = await supabase
      .from('scores')
      .select(`
        *,
        lessons (
          lessonname,
          subjectid,
          subjects ( subjectname )
        ),
        quarters ( name )
      `)
      .in('student_id', childIds);
    set({ scores });
  },

  fetchAttendance: async (childIds: string[]) => {
    const { data: attendance } = await supabase
      .from('attendance')
      .select(`
        *,
        lessons (
          lessonname,
          subjectid,
          subjects ( subjectname )
        )
      `)
      .in('student_id', childIds);
    set({ attendance });
  },
}));
🧷 4. UI Integration Notes for Cursor
Do not allow editing scores or attendance for parent accounts.

Simply show:

Subject Name, Lesson, Quarter, and Score in Grades table

Subject Name, Lesson, and Attendance Status in Attendance table

Make sure all action buttons are disabled or hidden on these pages.