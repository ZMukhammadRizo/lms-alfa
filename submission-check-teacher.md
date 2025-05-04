# Prompt for submission checking in teacher panel

# 🎯 The goal is to create a new `/teacher/submissions` page where teachers can view all assignment submissions made by their students. This page should allow teachers to filter submissions by class and quarter, search by student name, and see each submission as a card showing basic info like student name, assignment title, class, and submission date. Teachers can click on a submission to view full details, and from there, they can grade it on a scale of 1–10 and leave feedback.

### 🧠 **Database Relationships Summary**

### 📘 `assignments`

- `id` — primary key
- `classid` → references `classes(id)`
- `quarter_id` → references `quarters(id)`
- `createdby` → references `users(id)` (teacher who created it)

### 📘 `submissions`

- `assignmentid` → references `assignments(id)`
- `studentid` → references `users(id)` (student)
- Has: `fileurl`, `grade`, `feedback`, `submittedat`

### 🧠 Relationships:

- A **teacher** creates assignments for **classes** and **quarters**
- Students submit **submissions** to those assignments
- Each submission is linked to:
    - the **student**
    - the **assignment**, which links to a class and quarter

---

### ✅ **/teacher/submissions Page Specs**

### 🔍 Filters:

- ✅ By **class**
- ✅ By **quarter**

### 📄 Each Submission Card:

- Student full name
- Assignment title
- Class name
- Quarter name
- File (link to fileurl)
- SubmittedAt date
- Grade (1–10), if given
- Feedback, if given

### 🔧 Clicking on a card:

- Opens full detail view
- Teacher can:
    - Add/update grade (1–10)
    - Add/update feedback

---

### 🧪 Supabase Query Example

Use `select()` with nested joins to include assignment, class, quarter, and student.

```tsx

const { data, error } = await supabase
  .from('submissions')
  .select(`
    id,
    fileurl,
    submittedat,
    grade,
    feedback,
    assignment:assignmentid (
      id,
      title,
      classid,
      quarter_id,
      classes ( id, name ),
      quarters ( id, name ),
      createdby
    ),
    student:studentid (
      id,
      fullname
    )
  `)
  .eq('assignment.createdby', currentTeacherId)
  .match({
    'assignment.classid': selectedClassId,
    'assignment.quarter_id': selectedQuarterId,
  })

```

> 🔁 Replace selectedClassId and selectedQuarterId dynamically in the frontend based on user input.
> 

---

### 🧑‍🎨 UI Flow

1. **Dropdown 1**: Filter by Class (get teacher’s classes)
2. **Dropdown 2**: Filter by Quarter (get quarters teacher is teaching in)
3. **Search Input**: Optional, filter `student.fullname ILIKE %query%`
4. **Cards**: Show filtered submissions
5. **Detail View (Modal or Route)**: Edit feedback + grade