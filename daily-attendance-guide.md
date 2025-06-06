🧠 Cursor Context — LMS Daily Attendance Module
Hey Cursor 👋, here’s an important update about our LMS project that’s already fully functional. Please take this as a strict context for extending the existing system without modifying or breaking other parts of the project. You already know the flow and schema of the project well.

We're now implementing a Daily Attendance system for both Admin and Teacher panels, alongside our current lesson-based attendance (used in the unified journal).

✅ Objective
Add a daily-based attendance system to both Admin and Teacher panels while keeping the current lesson-based attendance system untouched.

🧱 Schema-Level Implementation
We will add a new table called daily_attendance with a structure very similar to attendance, but with slight changes:

daily_attendance Table Structure:
```sql
create table public.daily_attendance (
  id uuid not null default extensions.uuid_generate_v4 (),
  student_id uuid not null,
  noted_for date not null,
  noted_at timestamp with time zone not null default now(),
  status public.attendance_status null,
  quarter_id uuid null,
  class_id uuid null,
  teacher_id uuid null,
  constraint daily_attendance_pkey primary key (id),
  constraint unique_daily_record unique (student_id, noted_for),
  constraint daily_attendance_class_id_fkey foreign KEY (class_id) references classes (id) on update CASCADE on delete CASCADE,
  constraint daily_attendance_quarter_id_fkey foreign KEY (quarter_id) references quarters (id) on update CASCADE on delete CASCADE,
  constraint daily_attendance_student_id_fkey foreign KEY (student_id) references users (id) on delete CASCADE,
  constraint daily_attendance_teacher_id_fkey foreign KEY (teacher_id) references users (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;
```
✨ No lesson_id is present here — this is not lesson-based.

🖥️ Admin Panel UI Flow
Sidebar:
Add a link: Daily Attendance → /admin/daily-attendance

Page: /admin/daily-attendance
Show Levels as cards

Name

Class count

Student count

Page: /admin/daily-attendance/:levelId
Show Classes under that level as cards

Class name

Student count

Page: /admin/daily-attendance/:levelId/classes/:classId
Show Students in table format (sorted by name)

Click on a student → open Calendar Modal (full month view)

Can navigate months

Styled appealingly with project colors

In Modal:
For each student:

Fetch daily_attendance records via student_id

Map noted_for → day cells in the calendar

Status (present, late, absent, excused) → represented by colors (reuse from UnifiedJournal in Grades module)

Empty cell:

Click → select status → create new row in daily_attendance

Filled cell:

Click → select new status → update that row

Show loading + success toast or visual feedback on save/update

🔐 Access Control
Admin: Full CRUD on all daily_attendance

Teacher: Limited CRUD only for their assigned classes and subjects (re-use current role & permission system logic)

📌 Final Notes
Do not touch or change the current attendance system (attendance + lessons)

Be adaptive to the existing data structure and design flow

Match UX with existing Grades module where possible

Follow the Supabase schema structure given above

Add transitions, feedback, and icons where appropriate