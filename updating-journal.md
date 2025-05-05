### ✅ Finalized Instruction for Cursor

We are **merging the Attendance and Grades modules into one unified table** in both **Admin** and **Teacher** panels. The core logic is solid — just combine the UI into a **single tab** and display **grades, attendance, and comment features inside each cell** of the student x lesson grid.

---

### 🧩 Per-Cell UI Structure (Each cell = 1 student × 1 lesson)

Display a **horizontal stack of 3 `rounded-full` components** inside each table cell:

### 1. 🎯 **Grade Input**

- `rounded-full` input (default `0`)
- Accepts numbers from 1 to 10
- **Color changes dynamically** based on value:
    - 1–4 → Red
    - 5–7 → Orange
    - 8–10 → Green

### 2. 📆 **Attendance Dropdown**

- `rounded-full` button showing current status icon
- On click → open **dropdown menu** with:
    - Four options:
        - ✅ Present
        - ⏰ Late
        - ❌ Absent
        - 📝 Excused
    - **Each item has an icon on the left and text on the right**
    - Choosing an option updates the `attendance` field in the `scores` table
    - The round button reflects the **selected icon and color**, no text inside button

### 3. 📝 **Comment Button**

- `rounded-full` icon button with ✏️ pencil
- On click → open **modal** with:
    - A `textarea`
    - A **submit button** to PATCH the `comment` column of the matching `scores` row

---

### 📊 `scores` Table Structure

| Column | Type | Description |
| --- | --- | --- |
| `id` | UUID (PK) | Primary key |
| `student_id` | UUID (FK) | References `users.id` |
| `lesson_id` | UUID (FK) | References `lessons.id` |
| `grade` | Integer | From 0 to 10 (editable) |
| `attendance` | Enum | One of: `present`, `absent`, `late`, `excused` |
| `comment` | Text | Teacher's feedback for the lesson |
| `created_at` | Timestamp |  |
| `updated_at` | Timestamp |  |

---

### 🧭 What to Build

- Replace the current separate Grades and Attendance tabs with **one combined view**.
- Render 3 components in each lesson x student cell:
    - 🎯 `grade input`
    - 📆 `attendance dropdown`
    - 📝 `comment modal trigger`
- Everything updates a single `scores` row via PATCH