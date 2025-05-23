# 🧠 Guide: Linking Assignments to Subjects in LMS

## ✅ Goal

Extend existing assignment functionality to connect with subjects via `subject_id`:

- Each assignment now has one subject.
- Each subject can have multiple assignments.
- Backend SQL is already done (`subject_id` foreign key added to `assignments`).

No UI redesign needed — just add the subject connection to existing views and forms.

---

## 📦 1. Data Fetching: Include Subject Info

When loading assignments, include the subject's name:

```ts
const { data, error } = await supabase
  .from('assignments')
  .select(`
    id,
    title,
    duedate,
    subject_id,
    subjects (
      subjectname
    )
  `);
```
This gives you assignment.subjects.subjectname to display in the UI.

✍️ 2. Add Subject Select in Form
When creating/editing an assignment, include a dropdown for subjects.

Step 1: Fetch subjects list
```
const { data: subjects, error } = await supabase
  .from('subjects')
  .select('id, subjectname');
Step 2: Add dropdown (React example)
```
```
<select
  value={form.subject_id}
  onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
>
  <option value="">Select subject</option>
  {subjects?.map((subject) => (
    <option key={subject.id} value={subject.id}>
      {subject.subjectname}
    </option>
  ))}
</select>
```
🧾 3. Display Subject in UI
Where assignments are listed, display subject next to the title:

```
<h3>{assignment.title} <small>({assignment.subjects?.subjectname})</small></h3>
```
This works without any layout changes — just an added label.
🛡️ 4. Who Can Create Assignments (With Subject)
Handled by permissions system:

SuperAdmin, Admin: Always

ModuleLeader & Teacher: Must have create_assignments permission

Permission checks likely already in place — no changes needed unless you're validating on frontend too.

🧪 5. Quick Test Checklist
 Create assignment with a subject

 Edit assignment and change subject

 List assignments and see subject names

 Check database and API return correct subject_id
```
