# Prompt for a feature of submissions on assignments in student panel

## ✅ Cursor Task: Add Assignment Details Page with File Upload for Student Submissions

### 🏗️ Goal

Refactor the assignment modal into a **dedicated page** where students can upload their submission files. Files must be uploaded to **Supabase Storage** (`lms` bucket, inside the `submissions/` folder) and stored in the `submissions` table.

---

### 🗂️ 1. Move Assignment Details to a New Page

- Current file: `\src\pages\student\Assignments.tsx`
- Replace the **"View Details"** modal logic with a **link to a new page**:
    
    ```
    /student/assignments/SingleAssignment.tsx
    ```
    
- The new page’s URL should be like this:
    
    ```
    /student/assignments/[assignmentId]
    ```
    

### ✅ On the New Page:

- Fetch the assignment by `assignmentId` using Supabase client
- Display:
    - Title
    - Description
    - Due date
    - Any attached files (optional)
    - Student's existing submission (if any)

---

### 📤 2. Add File Upload UI and Submission Logic

Use **Styled Components** for the UI.

### 🖼️ UI Elements:

- File input (with drag & drop support is a bonus)
- 📁 File preview name or icon
- ✅ Button: **Submit Assignment**
- ❌ Button: **Remove File**
- If already submitted:
    - Show file download link
    - Allow re-upload (overwrite existing)

### 🧠 Logic Summary:

- Upload to Supabase Storage:
    - Bucket: `lms`
    - Path:
        
        ```
        swift
        CopyEdit
        submissions/{studentId}/{assignmentId}/{filename}
        
        ```
        
- After upload:
    - Insert or update the `submissions` table with:
        - `assignmentid`
        - `studentid`
        - `fileurl`
        - `submittedat` (auto by default)

---

### 🧩 3. Supabase Upload and Submission Code Snippets

### Upload File to Supabase:

```tsx
const uploadSubmissionFile = async (file: File, assignmentId: string, studentId: string) => {
  const path = `submissions/${studentId}/${assignmentId}/${file.name}`;

  const { data, error } = await supabase.storage
    .from("lms")
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("lms")
    .getPublicUrl(path);

  return urlData.publicUrl;
};
```

### Submit Record to `submissions` Table:

```tsx
const submitAssignment = async (assignmentId: string, studentId: string, fileUrl: string) => {
  const { data: existing } = await supabase
    .from("submissions")
    .select("id")
    .eq("assignmentid", assignmentId)
    .eq("studentid", studentId)
    .maybeSingle();

  if (existing) {
    await supabase.from("submissions").update({
      fileurl: fileUrl,
      submittedat: new Date()
    }).eq("id", existing.id);
  } else {
    await supabase.from("submissions").insert({
      assignmentid: assignmentId,
      studentid: studentId,
      fileurl: fileUrl
    });
  }
};
```

---

### 🧼 Optional Features:

- Show a toast or message on success/failure
- Disable submit button until a file is selected
- Validate file type or size before upload
- Support delete submission (optional, if allowed)


### 🧠 Current submissions table:

```sql
create table public.submissions (
  id uuid not null default gen_random_uuid (),
  assignmentid uuid null,
  studentid uuid null,
  fileurl text not null,
  submittedat timestamp without time zone null default now(),
  grade integer null,
  feedback text null,
  constraint submissions_pkey primary key (id),
  constraint submissions_assignmentid_fkey foreign KEY (assignmentid) references assignments (id) on delete CASCADE,
  constraint submissions_studentid_fkey foreign KEY (studentid) references users (id) on delete CASCADE
) TABLESPACE pg_default;
```