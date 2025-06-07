🧑‍🎓 Student Panel – Daily Attendance
Sidebar:

Add a "Daily Attendance" link to the student’s sidebar.

Page (/student/daily-attendance):

Show a read-only calendar that displays daily attendance records for the logged-in student.

Use the same status colors and design as the admin’s calendar.

Fetch from the daily_attendance table by filtering with the student’s own student_id.

Dashboard:

Add a "Daily Attendance" section that shows the student’s last 3 attendance entries.

Sort by noted_for descending.

Use the same card-like layout style as other dashboard sections.

👨‍👩‍👧 Parent Panel – Daily Attendance
Sidebar:

Add a "Daily Attendance" link to the parent’s sidebar.

Page (/parent/daily-attendance):

Show a read-only calendar.

First, fetch the parent’s children.

Add a select dropdown at the top to choose which child’s attendance to view.

When a child is selected, load and display only that child’s attendance on the calendar.

Do not mix multiple children’s attendance into one calendar.

Reuse the same design and colors as the admin’s calendar.

Dashboard:

Add a "Daily Attendance" section.

Show the last 3 attendance entries across all children.

Order by noted_for descending.

It doesn't matter which child appears on top; just show the most recent 3 records total.

📌 Reference – daily_attendance Table Structure
```sql
create table public.daily_attendance (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references users(id) on delete cascade,
  noted_for date not null,
  noted_at timestamptz not null default now(),
  status attendance_status,
  quarter_id uuid references quarters(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  teacher_id uuid references users(id) on delete cascade,
  unique (student_id, noted_for)
);
```
🧠 Important Notes:

No need to change anything in admin or teacher implementation — we’re just extending the existing logic for student and parent views.

Everything is read-only on student/parent side — no edits allowed.

Stick to existing styles and colors for visual consistency.