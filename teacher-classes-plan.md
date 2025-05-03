# 🧑‍🏫 Teacher Dashboard Feature Plan

We are building a teacher dashboard.

---

## 🗃️ Database Tables

### `classes` table  
Represents a class managed by a teacher.

- `id`
- `classname`
- `subjectId` → `subjects.id`
- `teacherId` → `users.id` (Teacher)
- `createdBy` → `users.id` (usually same as `teacherId`)
- `createdAt`

---

### `videos` table  
Represents videos connected to a class.

- `id`
- `videourl`
- `classId` → `classes.id`

---

### `users` table  
Contains all users: students and teachers.  
- Use `role = "Student"` or `role = "Teacher"` to distinguish

---

### `classstudents` table  
Connects students to classes (many-to-many).

- `id`
- `classId` → `classes.id`
- `studentId` → `users.id`
- `created_at`

---

## 📄 Pages & Logic

### `/teacher/classes` page

- Fetch all classes where `teacherId = currentUser.id`
- Include:
  - `videos`
  - `students` (via `classstudents` → `users`)
  - `subject` (via `subjectId`)
- Display each class as a **card**
  - Show `classname`, subject, number of students
- Include a **search input** (use `filteredClasses` logic)

---

### `/teacher/classes/:id` page

- Fetch a single class by ID
- Display two responsive sections:
  - **Students list**
    - Student name
    - Remove button
  - **Videos list**
    - Title + Remove button
    - Each video links to its detail page

---

### `/teacher/classes/:classId/videos/:videoId` page

- Display video from `videourl`
- Show title, and maybe a delete/edit button

---

## ✅ Teacher Permissions

Teachers should be able to:

- ✅ Create a new class
- ✅ Assign students to a class (`role = "Student"`)
- ✅ Remove students from a class
- ✅ Update class data (`classname`, `subjectId`, etc.)
- ✅ Upload videos to the class
- ✅ Delete videos
- ✅ Search/filter their own classes

---

## 🧠 Supabase Query Suggestions

- Use:
  ```js
  .select('*, videos(*), classstudents(*, users(*)), subjects(*)')
