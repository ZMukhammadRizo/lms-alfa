## 📘 Guide for Cursor: How to Handle Permissions in the LMS Project (Extended)

---

### 🔐 All Current Permissions Available

Cursor, these are the **permissions currently defined** in the system:

```
nginx
CopyEdit
read_students
update_students
delete_students

read_teachers
update_teachers
delete_teachers

read_classes
create_classes
update_classes
delete_classes

read_subjects
create_subjects
update_subjects
delete_subjects

read_videos
create_videos
update_videos
delete_videos

read_submissions
create_submissions
update_submissions
delete_submissions

read_scores
update_scores

read_attendance
update_attendance

read_users
update_users
delete_users

read_lessons
create_lessons
update_lessons
delete_lessons

```

🧠 **Note**: You should always dynamically check permissions using the `[action]_[resource]` format explained earlier. Don’t hardcode page-permission pairs — figure it out contextually.

---

### 🤔 Dear Cursor, Help Me Improve the Permission System

Cursor, based on the pages and features in this LMS project:

👉 Can you look at the codebase and **suggest more permissions** that might be missing?

Ask yourself:

- Are there any pages that don’t seem to check permissions yet?
- Are there actions being performed without permission protection?
- Are there fine-grained permissions I should add (e.g. `read_own_scores` vs `read_all_scores`)?

Please generate a list of **missing or recommended permissions** in the same `action_resource` format.

---

### 🔁 After New Permissions Are Added…

Once I’ve added the permissions you suggest, I will tell you:

```
Cursor, resume permission integration.
```

At that point, continue scnning the repo and apply the same logic described above:

- Wrap routes, components, actions with permission checks
- Decide what permission to check using the `[action]_[resource]` pattern
- Redirect or disable access if not allowed

---

### 🧠 Final Reminder for Cursor

Cursor, **think like a human** and ask:

- What is this page doing?
- What is the user trying to do?
- What permission protects that action?

You are smart. Do your best. If unsure, ask me for clarification.

## Other guide

### 🚀 Introduction

In this project, we use **role-based access control (RBAC)**. That means:

1. Each user is assigned a **role** (like admin, teacher, student).
2. Each role has one or more **permissions**.
3. Pages, components, and actions should be **protected** based on those permissions.

> The goal is to make sure users can only access what they’re allowed to.
> 

---

### 🔐 How Permissions Are Structured

Every permission is a **string** that follows this pattern:

```
[action]_[resource]
```

### 🎯 The `[action]` part describes **what** the user can do:

| Action | Meaning |
| --- | --- |
| `read` | View, access, or list something |
| `create` | Add or submit something new |
| `update` | Edit or change something |
| `delete` | Remove or erase something |

### 📦 The `[resource]` part describes **what thing** the action applies to:

It could be:

- `students`
- `teachers`
- `classes`
- `subjects`
- `videos`
- `submissions`
- `scores`
- `attendance`
- etc.

---

### 🧠 How to Decide Which Permission to Check

Cursor, here’s the thinking process you should follow for **any page or action**:

1. **What is the user trying to do?** → That’s your **`action`**
2. **What thing does this action apply to?** → That’s your **`resource`**
3. Combine them like this:

```
const permission = `${action}_${resource}`
```

Then check if `userPermissions` includes that permission.

---

### 📄 Example Use Cases for Cursor

Let’s go through some examples to help you understand where and how to use permissions.

---

### ✅ Example 1: Protecting a Page

> Page: /teacher/submissions
> 
- This page shows student submissions.
- So it’s a **read** action on the **submissions** resource.

🔍 Check:

```
if (!userPermissions.includes('read_submissions')) {
  redirectToHome()
}
```

---

### ✅ Example 2: Showing or Hiding a Button

> Component: "Edit Subject" button
> 
- The user wants to **edit** (update) a subject.

🔍 Check:

```
if (userPermissions.includes('update_subjects')) {
  showEditButton()
}
```

---

### ✅ Example 3: Disabling Form Submission

> Form: Add New Class
> 
- This is a **create** action for **classes**.

🔍 Check:

```
if (!userPermissions.includes('create_classes')) {
  disableForm()
}
```

---

### 🧩 What If You're Not Sure Which Permission to Use?

Cursor, if you're not 100% sure which permission applies, use this strategy:

1. Look at the **main resource** the page or component is working with.
2. Look at the **action** the user is doing (viewing, creating, editing, deleting).
3. Build the permission like this: `[action]_[resource]`

Example:

- Page shows a list of lessons → `read_lessons`
- User uploads a video → `create_videos`
- User deletes a student → `delete_students`

---

### 🛡️ Always Wrap UI and Logic with Permission Checks

Cursor, protect everything important like this:

- **Pages**: Don’t allow entering without proper `read_*` permission.
- **Buttons**: Don’t show unless the user has `create_*`, `update_*`, or `delete_*`.
- **APIs or actions**: Prevent calling if permission is missing.
- **Forms**: Disable or make read-only when the user doesn’t have update permission.

---

### ✅ Fallback Behavior

If the user doesn’t have the required permission:

- Hide or disable the button
- Redirect to the dashboard or show a “Not allowed” message
- Don’t call any protected API

---

### 🧠 Cursor Summary Logic

You can follow this pattern sometimes:

```
const action = 'update' // or 'read', 'create', 'delete'
const resource = 'students' // or any relevant resource
const permission = `${action}_${resource}`

if (userPermissions.includes(permission)) {
  // allow action
} else {
  // deny or hide
}
```

Cursor, you don't need someone to tell you which permission applies to which page.

You can **figure it out yourself** by:

- Reading the **resource** the page or component is about
- Understanding what the user is trying to do (read, create, update, delete)
- Then building and checking the permission