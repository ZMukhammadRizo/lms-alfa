# Result

Below is a complete, step-by-step guide in clear English. It uses **styled-components** only—no external UI libraries—and ties together Supabase, React, and Zustand.

---

## 1. Supabase: Create the `attendance` table (I’ve done this, so just review it)

Paste and run this entire block **at once** in Supabase’s SQL editor (I’ve done this, so just review it):

```sql
-- 1. Enable UUID generation (once per database)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create attendance table
CREATE TABLE public.attendance (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id   UUID        NOT NULL
               REFERENCES public.lessons(id)
               ON DELETE CASCADE,
  student_id  UUID        NOT NULL
               REFERENCES public.users(id)
               ON DELETE CASCADE,
  present     BOOLEAN     NOT NULL DEFAULT FALSE,
  noted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (lesson_id, student_id)
);

-- 3. (Optional) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_att_lesson  ON public.attendance (lesson_id);
CREATE INDEX IF NOT EXISTS idx_att_student ON public.attendance (student_id);

```

- **`id`**: UUID primary key.
- **`lesson_id`**, **`student_id`**: link to your existing tables.
- **`present`**: true/false attendance flag.
- **`noted_at`**: timestamp of record.
- **`UNIQUE`** prevents duplicates.

---

## 2. Install and configure styled-components

```bash
npm install styled-components @types/styled-components
```

In your app’s entry point (e.g. `index.tsx`), wrap with the default `ThemeProvider` if you plan to theme—otherwise you can import `styled` directly wherever needed.

---

## 3. Zustand store for attendance

```tsx
import create from 'zustand';
import { supabase } from '@/lib/supabaseClient';

export interface Attendance {
  id: string;
  lesson_id: string;
  student_id: string;
  present: boolean;
}

interface AttendanceState {
  attendance: Attendance[];
  loading: boolean;
  error: string | null;
  fetchAttendance: (lessonId: string) => Promise<void>;
  updateAttendance: (lessonId: string, studentId: string, present: boolean) => Promise<void>;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  attendance: [],
  loading: false,
  error: null,

  fetchAttendance: async (lessonId) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from<Attendance>('attendance')
      .select('*')
      .eq('lesson_id', lessonId);

    if (error) {
      set({ error: error.message });
    } else {
      set({ attendance: data ?? [] });
    }
    set({ loading: false });
  },

  updateAttendance: async (lessonId, studentId, present) => {
    const { error } = await supabase
      .from('attendance')
      .upsert(
        { lesson_id: lessonId, student_id: studentId, present },
        { onConflict: ['lesson_id', 'student_id'] }
      );

    if (error) {
      set({ error: error.message });
      return;
    }

    // sync local state
    const filtered = get().attendance.filter(
      a => !(a.lesson_id === lessonId && a.student_id === studentId)
    );
    set({
      attendance: [
        ...filtered,
        { id: '', lesson_id: lessonId, student_id: studentId, present },
      ],
    });
  },
}))
```

---

## 4. Build your own Tabs with styled-components

### 4.1. Tab context and provider

```tsx
import React, { createContext, useContext, useState } from 'react';

type TabContextType = {
  activeIndex: number;
  setActiveIndex: (i: number) => void;
};

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabProvider: React.FC = ({ children }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <TabContext.Provider value={{ activeIndex, setActiveIndex }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTab = () => {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error('useTab must be inside TabProvider');
  return ctx;
}
```

### 4.2. Tabs, TabList, and TabPanels

```tsx
import React from 'react';
import styled from 'styled-components';
import { TabProvider, useTab } from './TabContext';

const TabListWrapper = styled.div`
  display: flex;
  border-bottom: 2px solid #ddd;
  margin-bottom: 1rem;
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 0.75rem 1rem;
  background: ${({ active }) => (active ? '#fff' : '#f5f5f5')};
  border: none;
  border-bottom: ${({ active }) =>
    active ? '3px solid #0070f3' : '3px solid transparent'};
  font-weight: ${({ active }) => (active ? 'bold' : 'normal')};
  cursor: pointer;

  &:hover {
    background: #fff;
  }
`;

const PanelWrapper = styled.div`
  padding: 1rem;
  border: 1px solid #ddd;
  background: #fff;
`;

type TabsProps = {
  tabs: string[];
  children: React.ReactNode[];
};

export const Tabs: React.FC<TabsProps> = ({ tabs, children }) => (
  <TabProvider>
    <TabList labels={tabs} />
    <TabPanels>{children}</TabPanels>
  </TabProvider>
);

const TabList: React.FC<{ labels: string[] }> = ({ labels }) => {
  const { activeIndex, setActiveIndex } = useTab();
  return (
    <TabListWrapper>
      {labels.map((label, i) => (
        <TabButtonkey={i}
          active={i === activeIndex}
          onClick={() => setActiveIndex(i)}
        >
          {label}
        </TabButton>
      ))}
    </TabListWrapper>
  );
};

const TabPanels: React.FC = ({ children }) => {
  const { activeIndex } = useTab();
  return <PanelWrapper>{React.Children.toArray(children)[activeIndex]}</PanelWrapper>;
};
```

---

## 5. AttendanceTab component

```tsx
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { useStudents } from '@/hooks/useStudents';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.5rem;
  background: #f0f0f0;
  border-bottom: 1px solid #ddd;
`;

const Td = styled.td`
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
`;

export const AttendanceTab: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { attendance, loading, error, fetchAttendance, updateAttendance } =
    useAttendanceStore();
  const { students, loading: studentsLoading } = useStudents();

  useEffect(() => {
    if (lessonId) fetchAttendance(lessonId);
  }, [lessonId, fetchAttendance]);

  if (loading || studentsLoading) return <p>Loading…</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <><h2>Attendance for Lesson {lessonId}</h2>
      <Table>
        <thead>
          <tr>
            <Th>Student</Th>
            <Th style={{ textAlign: 'center' }}>Present</Th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => {
            const record = attendance.find(a => a.student_id === student.id);
            return (
              <tr key={student.id}>
                <Td>{student.full_name}</Td>
                <Td style={{ textAlign: 'center' }}>
                  <inputtype="checkbox"
                    checked={record?.present ?? false}
                    onChange={e =>
                      updateAttendance(lessonId!, student.id, e.target.checked)
                    }
                  />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
};
```

---

## 6. JournalPage: Combine Grades and Attendance

```tsx
import React from 'react';
import { Tabs } from './Tabs';
import { GradesTab } from './GradesTab';
import { AttendanceTab } from './AttendanceTab';

export const JournalPage: React.FC = () => (
  <Tabs tabs={['Grades', 'Attendance']}>
    <GradesTab />
    <AttendanceTab />
  </Tabs>
);
```

---

### Recap for Cursor

1. **Supabase**: run the full SQL block to create `attendance`.
2. **Install** styled-components.
3. **Implement** the Zustand store as shown.
4. **Build** your own Tabs with `TabContext`, `Tabs`, `TabList`, `TabPanels`.
5. **Create** `AttendanceTab` with a styled table and checkbox inputs.
6. **Assemble** everything in `JournalPage`.

All styling comes from **styled-components**—no Headless UI or other frameworks. Feel free to tweak colors, spacing, and fonts directly in your styled definitions.