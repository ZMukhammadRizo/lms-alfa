# Attendance Tracking Implementation

This implementation adds attendance tracking functionality alongside the existing grades module in the teacher section of the application. The approach combines both grades and attendance in a single tabbed interface within the GradesJournal component.

## Overview

- Uses **styled-components** for UI components
- Leverages **Zustand** for state management
- Integrates with **Supabase** for data storage
- Implements a tabbed interface with grades and attendance tabs

## Integration Approach

Rather than having a separate journal page, we've integrated the attendance functionality directly into the existing GradesJournal component in the GradesModule folder. This provides a unified experience where teachers can:

1. Select a class and subject
2. View grades in the first tab
3. View and manage attendance in the second tab
4. Click on a lesson header to select that lesson for attendance tracking

## Files Added/Modified

1. **New Files:**

   - `src/store/attendanceStore.ts` - Zustand store for attendance data management
   - `src/components/teacher/TabContext.tsx` - Context provider for the tabbed interface
   - `src/components/teacher/Tabs.tsx` - Tab components (Tabs, TabList, TabPanels)
   - `src/components/teacher/AttendanceTab.tsx` - Attendance tab content with checkboxes
   - `sql/attendance_table.sql` - SQL for creating the attendance table

2. **Modified Files:**
   - `src/pages/teacher/GradesModule/GradesJournal.tsx` - Updated to include tabbed interface with both grades and attendance
   - `src/pages/teacher/GradesModule/JournalSection.tsx` - Added lesson selection capability
   - `src/pages/teacher/TeacherJournalPage.tsx` - Changed to redirect to the enhanced GradesJournal component

## Database Setup

1. Execute the SQL in `sql/attendance_table.sql` in your Supabase SQL editor to create:
   - The `attendance` table
   - Necessary indexes for performance
   - Row-level security policies

## Implementation Details

### Attendance Store (Zustand)

The store manages:

- Fetching attendance records for a specific lesson
- Updating attendance status with optimistic UI updates
- Loading and error states

### Tabbed Interface

- Uses a React Context for state management
- Provides a clean API with `<Tabs>`, `<TabList>`, and `<TabPanels>` components
- Keeps the current tab state synchronized

### Attendance Tab

The attendance tab displays:

- A list of students in the selected class
- Checkboxes to mark attendance as present/absent
- Synchronizes with the selected lesson from the grades tab

## How It Works

1. The teacher navigates to the grades module
2. They select a class, grade level, and subject
3. In the journal view, the teacher can switch between "Grades" and "Attendance" tabs
4. When the teacher clicks on a lesson header in the grades tab, that lesson is selected for attendance tracking
5. The attendance tab displays checkboxes for each student for the selected lesson
6. Changes to attendance are immediately saved to the database and reflected in the UI

## Future Improvements

1. Add attendance statistics and reporting
2. Implement bulk attendance actions
3. Add visual indications for late students vs. absent
4. Create calendar view for attendance tracking
