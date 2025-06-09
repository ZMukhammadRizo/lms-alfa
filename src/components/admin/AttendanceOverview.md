# AttendanceOverview Component

## Overview
The `AttendanceOverview` component is a responsive dashboard widget that displays today's attendance data in a visual pie chart format. It's designed for the Admin Dashboard and provides real-time attendance statistics fetched from Supabase.

## Features

### 1. **Real-time Data Fetching**
- Connects to Supabase `daily_attendance` table
- Filters by `noted_for = CURRENT_DATE`
- Groups attendance records by status (Present, Absent, Late, Excused)

### 2. **Visual Chart Display**
- Uses Recharts PieChart component
- Color-coded status indicators:
  - **Present**: Green (#10b981)
  - **Absent**: Red (#ef4444)
  - **Late**: Amber/Orange (#f59e0b)
  - **Excused**: Indigo (#6366f1)
- Percentage labels on chart slices
- Legend with colored dots below the chart

### 3. **Navigation Integration**
- "Full Report" button in top-right corner
- Navigates to `/admin/daily-attendance` for detailed view
- Uses React Router for navigation

### 4. **State Management**
- **Loading State**: Shows spinner and loading message
- **Error State**: Displays error message with retry option
- **No Data State**: Shows appropriate message when no data exists
- **Success State**: Displays chart with attendance data

### 5. **Responsive Design**
- Mobile-first approach with breakpoints
- Card-style container with hover effects
- Adjusts chart height and layout for smaller screens

## Usage

```tsx
import AttendanceOverview from '../../components/admin/AttendanceOverview';

// In your dashboard component
<AttendanceOverview />

// With custom styling
<AttendanceOverview className="custom-attendance-widget" />
```

## Integration

### Dashboard Integration
The component is integrated into the Admin Dashboard at `/admin/dashboard`:

```tsx
<DashboardGrid>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.7 }}
    style={{ gridColumn: 'span 2' }}
  >
    <AttendanceOverview />
  </motion.div>
</DashboardGrid>
```

### Database Schema
The component expects the following table structure:

```sql
create table public.daily_attendance (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references users(id) on delete cascade,
  noted_for date not null,
  noted_at timestamptz not null default now(),
  status attendance_status,
  quarter_id uuid references quarters(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  teacher_id uuid references users(id) on delete cascade,
  unique (student_id, noted_for)
);
```

## Dependencies

- **React**: Core functionality
- **styled-components**: Styling and theme integration
- **recharts**: Pie chart visualization
- **react-feather**: Icons (ExternalLink, Loader, AlertCircle)
- **react-router-dom**: Navigation
- **@supabase/supabase-js**: Database connectivity

## Styling

The component uses the project's theme system and follows established design patterns:

- Uses theme colors, spacing, and typography
- Consistent with other admin components
- Responsive breakpoints
- Smooth transitions and hover effects

## Error Handling

- **Network Errors**: Displays user-friendly error message
- **Database Errors**: Shows Supabase error details
- **Empty Data**: Handles gracefully with appropriate messaging
- **Loading States**: Provides visual feedback during data fetching

## Performance Considerations

- Single database query optimized for current date
- Minimal re-renders with proper state management
- Responsive chart that adapts to container size
- Efficient data transformation for chart format

## Future Enhancements

1. **Date Range Selection**: Allow viewing attendance for different dates
2. **Class Filtering**: Filter by specific classes or levels
3. **Export Functionality**: Download attendance data as CSV/PDF
4. **Real-time Updates**: WebSocket integration for live updates
5. **Drill-down**: Click chart segments to see detailed breakdowns 