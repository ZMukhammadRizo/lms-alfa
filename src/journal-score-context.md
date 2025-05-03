# Prompt for completing the journal

Xo’p. Menimcha kecha LMS projectimning strukturasi haqida ancha muncha narsalarni bilib olding. Endi menda faqatgina jurnal sahifasi qoldi. Ustozning panelida ustoz o’ziga biriktirilgan sinflarni ko’radigan sahifadagi ma’lumotlarning hammasi mock data orqali qilingan, Supabase hali integratsiya qilinmagan.

Xo’p. Ustoz panelida “grades” nomli sahifa bor. Shu sahifaga kirilgan payt ustozga biriktirilgan sinflarning darajalari chiqib kelishi kerak. Bundan tashqari, har bir darajada nechta sinf borligi, umumiy nechta o’quvchi borligi va hamma darajalarda umumiy nechta fan borligini cardda ko’rsatishi kerak. Masalan ustozga 10B, 10C, 2B, 2C sinflari biriktirilgan bo’lsa, ustozning “grades” sahifasiga kirganda shular chiqishi kerak:

- 10, 2 ta sinf, 20 ta o’quvchi, 4 ta fan
- 2, 2 ta sinf, 20 ta o’quvchi, 4 ta fan

Keyin har bitta darajani ustiga bosganda, shu darajadagi “category” lar alohida sahifada chiqib kelishi kerak, albatta agar shu ustozga biriktirilgan bo’lsa. Masalan, 10 ni ustiga bosdik va alohida sahifada shular chiqadi:

- 10B, 10 ta o’quvchi, 2 ta fan
- 10C, 10 ta o’quvchi, 2 ta fan

10B va 10C sinfning nomi (classname), o’zi aslida.

Keyin 10B va 10C lar ham alohida sahifaga o’tadigan link bo’lishi kerak va ular alohida sahifaga o’tganda shu sinfga biriktirilgan fanlar chiqib kelsin. Shu har bitta fanning nomi, ichida nechta “lessons” borligini chiqarsin. Keyin shu fanlarning o’zi ham alohida sahifaga o’tadigan link bo’lishi kerak. Ya’ni har bir fanning jurnaliga. Jurnal bizda o’quvchilarning shu fanga doir bo’lgan har bitta lessondan nechi baho (scores) olganini chiqarib berishi kerak bo’ladi va ustoz ham har bitta lessonga o’quvchilarga baho qo’ya olishi va qo’ygan bahosini o’zgartirishi kerak.

Hozir senga yangilangan Supabase tableimni tashlayman va tushunmagan savollaring bo’lsa so’ra, javob beraman.

## The prompt that GPT generated:

# 📚 “Grades” Feature: Comprehensive Guide for Cursor

> Reminder: All new pages must use our existing design system—same tokens, components, layout, spacing, typography, colors, and interactions—so they look indistinguishable from the Home/Classes/Subjects pages.

---

## 🔗 1. Routes & Parameters (Use UUIDs!)

| Page                 | Path Pattern                           | Params                                                    |
| -------------------- | -------------------------------------- | --------------------------------------------------------- |
| **Grades Dashboard** | `/grades`                              | _(none)_                                                  |
| **Level Detail**     | `/grades/:levelId`                     | `levelId: string` _(UUID of levels.id)_                   |
| **Class Subjects**   | `/grades/:levelId/:classId`            | `levelId: string`, `classId: string`                      |
| **Subject Journal**  | `/grades/:levelId/:classId/:subjectId` | `levelId: string`, `classId: string`, `subjectId: string` |

> Why IDs?
>
> - **Uniqueness:** avoids collisions (e.g. two levels both named “10”)
> - **Stability:** names may change, IDs never do
> - **Alignment** with all other pages (Classes use `classId`)

---

## 🧬 2. TypeScript Types

```
ts
CopyEdit
// 2.1 Grades Dashboard Card (per-level)
export interface GradeLevelOverview {
  levelId: string;      // UUID → levels.id
  levelName: string;    // e.g. "10"
  classCount: number;
  studentCount: number;
  subjectCount: number;
}

// 2.2 Level Detail Card (per-class)
export interface LevelCategoryOverview {
  levelId: string;      // levels.id
  classId: string;      // classes.id
  classname: string;    // e.g. "10B"
  studentCount: number;
  subjectCount: number;
}

// 2.3 Class Subjects List Item
export interface ClassSubjectOverview {
  classId: string;      // classes.id
  subjectId: string;    // subjects.id
  subjectName: string;
  lessonCount: number;
}

// 2.4 Journal Data
export interface LessonInfo {
  id: string;           // lessons.id
  lessonName: string;
}
export interface StudentInfo {
  id: string;           // users.id
  fullName: string;
}
export interface ScoreRecord {
  studentId: string;    // users.id
  lessonId: string;     // lessons.id
  score: number | null;
}
export interface JournalTable {
  lessons: LessonInfo[];
  students: StudentInfo[];
  scores: ScoreRecord[];
}

```

---

## 🛰️ 3. Supabase Queries & RPCs

### 3.1 Grades Dashboard: `get_teacher_levels`

```sql
sql
CopyEdit
create or replace function public.get_teacher_levels(
  teacher_uuid uuid
) returns table (
  levelId uuid,
  levelName text,
  classCount int,
  studentCount int,
  subjectCount int
) language sql as $$
  select
    l.id           as levelId,
    l.name         as levelName,
    count(distinct c.id)            as classCount,
    sum(c.student_count)            as studentCount,
    count(distinct cs.subjectid)    as subjectCount
  from classes c
    join levels l        on c.level_id = l.id
    join classsubjects cs on cs.classid  = c.id
  where c.teacherid = $1
  group by l.id, l.name;
$$;

```

**Fetch in TS:**

```
ts
CopyEdit
const { data: levels, error } = await supabase
  .rpc<GradeLevelOverview>('get_teacher_levels', { teacher_uuid: auth.user()?.id });

```

---

### 3.2 Level Detail: `get_level_classes`

```sql
sql
CopyEdit
create or replace function public.get_level_classes(
  teacher_uuid uuid,
  lvl_id uuid
) returns table (
  classId uuid,
  classname text,
  studentCount int,
  subjectCount int
) language sql as $$
  select
    c.id            as classId,
    c.classname,
    c.student_count as studentCount,
    count(distinct cs.subjectid) as subjectCount
  from classes c
    join classsubjects cs on cs.classid = c.id
  where c.teacherid = $1
    and c.level_id  = $2
  group by c.id, c.classname, c.student_count;
$$;

```

**Fetch in TS:**

```
ts
CopyEdit
const { data: classes, error } = await supabase
  .rpc<LevelCategoryOverview>('get_level_classes', {
    teacher_uuid: auth.user()?.id,
    lvl_id: levelId
  });

```

---

### 3.3 Class Subjects (per-class)

```
ts
CopyEdit
const { data: subjects, error } = await supabase
  .from<ClassSubjectOverview>('classsubjects')
  .select(`
    subjectid,
    subjects(subjectname),
    lessons!inner(subjectid)  -- join lessons table
  `)
  .eq('classid', classId)
  .group('subjectid, subjects.subjectname');

```

- **Then** compute `lessonCount` by grouping `lessons` per `subjectid`.

_(Alternatively, wrap in an RPC to return `lessonCount` directly.)_

---

### 3.4 Subject Journal Matrix

1. **Fetch lessons** for this `subjectId`:

   ```
   ts
   CopyEdit
   const { data: lessons } = await supabase
     .from<LessonInfo>('lessons')
     .select('id, lessonname as lessonName')
     .eq('subjectid', subjectId)
     .order('uploadedat', { ascending: true });

   ```

2. **Fetch students** enrolled in `classId`:

   ```
   ts
   CopyEdit
   const { data: enrollments } = await supabase
     .from('classstudents')
     .select('studentid, users(firstName, lastName)')
     .eq('classid', classId);

   const students: StudentInfo[] = enrollments.map(e => ({
     id: e.studentid,
     fullName: `${e.users.firstName} ${e.users.lastName}`
   }));

   ```

3. **Fetch scores** for the selected `quarterId`:

   ```
   ts
   CopyEdit
   const { data: scores } = await supabase
     .from<ScoreRecord>('scores')
     .select('student_id as studentId, lesson_id as lessonId, score')
     .eq('quarter_id', quarterId)
     .in('lesson_id', lessons.map(l => l.id));

   ```

4. **Compose** your `JournalTable`:

   ```
   ts
   CopyEdit
   const table: JournalTable = { lessons, students, scores };

   ```

5. **Upsert on edit**:

   ```
   ts
   CopyEdit
   await supabase
     .from('scores')
     .upsert({
       student_id: studentId,
       lesson_id: lessonId,
       quarter_id: quarterId,
       teacher_id: auth.user()?.id,
       score: newScore
     }, { onConflict: ['student_id','lesson_id','quarter_id'] });

   ```

---

## 🎨 4. UI & Component Guidelines

Use our **shared** components—no custom styling outside the theme.

### 4.1 Grades Dashboard (`/grades`)

```jsx
jsx
CopyEdit
<Flex gap="4" wrap>
  {levels.map(l => (
    <Card key={l.levelId} onClick={() => go(`/grades/${l.levelId}`)}>
      <CardHeader>Grade {l.levelName}</CardHeader>
      <CardBody>
        <Stat label="Classes" value={l.classCount} />
        <Stat label="Students" value={l.studentCount} />
        <Stat label="Subjects" value={l.subjectCount} />
      </CardBody>
    </Card>
  ))}
</Flex>

```

---

### 4.2 Level Detail (`/grades/:levelId`)

```jsx
jsx
CopyEdit
<Breadcrumb>
  <Crumb href="/grades">Grades</Crumb>
  <Crumb active>Grade {levelName}</Crumb>
</Breadcrumb>

<Flex gap="4" wrap>
  {classes.map(c => (
    <Card key={c.classId} onClick={() => go(`/grades/${levelId}/${c.classId}`)}>
      <CardHeader>{c.classname}</CardHeader>
      <CardBody>
        <Stat label="Students" value={c.studentCount} />
        <Stat label="Subjects" value={c.subjectCount} />
      </CardBody>
    </Card>
  ))}
</Flex>

```

---

### 4.3 Class Subjects (`/grades/:levelId/:classId`)

```jsx
jsx
CopyEdit
<Breadcrumb>
  <Crumb href="/grades">Grades</Crumb>
  <Crumb href={`/grades/${levelId}`}>Grade {levelName}</Crumb>
  <Crumb active>{classname}</Crumb>
</Breadcrumb>

<List divided>
  {subjects.map(s => (
    <ListItem key={s.subjectId}>
      <Link to={`/grades/${levelId}/${classId}/${s.subjectId}`}>
        <Text>{s.subjectName}</Text>
        <Badge>{s.lessonCount} lessons</Badge>
      </Link>
    </ListItem>
  ))}
</List>

```

---

### 4.4 Subject Journal (`/grades/:levelId/:classId/:subjectId`)

```jsx
jsx
CopyEdit
<Breadcrumb>
  <Crumb href="/grades">Grades</Crumb>
  <Crumb href={`/grades/${levelId}`}>Grade {levelName}</Crumb>
  <Crumb href={`/grades/${levelId}/${classId}`}>{classname}</Crumb>
  <Crumb active>{subjectName}</Crumb>
</Breadcrumb>

<Table>
  <Thead>
    <Tr>
      <Th>Student</Th>
      {table.lessons.map(l => <Th key={l.id}>{l.lessonName}</Th>)}
    </Tr>
  </Thead>
  <Tbody>
    {table.students.map(student => (
      <Tr key={student.id}>
        <Td>{student.fullName}</Td>
        {table.lessons.map(l => {
          const rec = table.scores.find(s => s.studentId === student.id && s.lessonId === l.id);
          return (
            <Td key={l.id}>
              <InputNumbervalue={rec?.score ?? ''}
                onChange={val => handleCellChange(student.id, l.id, val)}
                min={0} max={100}
              />
            </Td>
          );
        })}
      </Tr>
    ))}
  </Tbody>
</Table>

<Button onClick={saveAllScores}>Save All</Button>

```

- **`handleCellChange`**: update local state
- **`saveAllScores`**: batch upserts

---

## ⚙️ 5. Edge-Cases & RLS

- **Null safety:** Inputs default to blank if no `score` record exists.
- **Validation:** Enforce 0–100 or your school’s scale.
- **RLS Policies:**
  ```sql
  sql
  CopyEdit
  -- Only teacher can read/write their own classes & scores
  create policy "Teacher sees own classes" on public.classes for select
    using (teacherid = auth.uid());
  create policy "Teacher manages scores" on public.scores for insert, update
    with check (teacher_id = auth.uid());

  ```
- **Error handling:** Show toast on upsert conflict or network failure.
