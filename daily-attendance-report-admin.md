🗂️ Daily Attendance Reporting System Implementation (Teacher/Admin Panel)
🎯 Goal:
Implement a new "Filter & Report" system on the Daily Attendance page. This feature allows generating monthly or weekly reports of daily attendance — per single class or multiple classes. Report structure and data vary based on selected period and context.

📌 Modal Flow on “Filter & Report” Button Click:
📍 UI Components:
Button: “Filter & Report” with appropriate icon

Opens a modal with the title:
✅ "Select multiple classes to report"

🧩 Modal Body:
Class selection interface

Show: “Select 1st class” label

Dropdown 1: Levels (from API or project context)

Dropdown 2: Classes (disabled until level is selected)

When a level is selected, fetch classes from backend

Show loading state during fetch

Only allow one class selection

Button: “Add a class”

Disabled by default

Enabled after first class is selected

Prevent selecting already selected classes

Allow adding additional class selectors (same level-class structure)

Button: “Generate reports”

Disabled until at least 1 class is selected

On click, show a radio group:

“Monthly” and “Weekly” (custom styled radio inputs)

Below radios: Button “Proceed”

Redirects to /admin/daily-attendance/reports

📈 Reports Page /admin/daily-attendance/reports:
🔍 Logic:
Calculate attendance for each class by selected period (month/week)

Use frontend calculation based on daily_attendance table

Count statuses:

✅ Counted as present: present, late

❌ Not counted: absent, excused

📊 Render per-class report as table:
Header: Student Full Names, Dates, Individual Attendance %, Class Total %

Repeat this structure for each class

Add export feature:

Button to export each table and overall result as .xlsx

🎨 Attendance Percentage Color Indicator:
Use color indicators based on percentage:

🔴 0% - 50% → Red

🟠 51% - 70% → Orange

🟡 71% - 80% → Yellow

🟢 81%+ → Green

This logic should be reusable across other attendance-based views in the project.

🛢️ Table Reference
daily_attendance Table:
```sql
id uuid PK,
student_id uuid FK -> users(id),
noted_for date,
status: present | excused | absent | late,
class_id uuid FK -> classes(id),
```
...
users Table:
```sql
id uuid PK,
fullName (stored generated): "firstName lastName"
```
...
🧠 Final Notes:
Be minimalist with UI design but smart in usability.

Optimize modal UX: clean structure, disable unusable actions.

Remember: don’t allow duplicate class selections.

Prepare code to be extendable — the same attendance percentage component will be reused later in other parts of the app.

