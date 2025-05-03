# Fixing Duplicate Component Declarations in Schedule.tsx

## Overview

The Schedule.tsx file has several duplicate styled component declarations causing compilation errors. This document provides step-by-step instructions to fix these issues.

## Problem

Multiple styled-components are declared more than once:

1. `DateNavigationWeek` (lines 198 and 1167)
2. `DateCell` (lines 1272 and 2224)
3. `DayName` (lines 1301 and 2253)
4. `TimeSlot` (lines 1450 and 1937)
5. `DayColumn` (lines 1513 and 2290)
6. `ClassEvent` (lines 1550 and 2326)
7. `ClassEventContent` (lines 1585 and 2350)
8. `NoClassesMessage` (lines 1751 and 2059)

## Solution Strategy

We'll take a two-pronged approach:

1. **Extract components**: Move reusable components to separate files
2. **Rename components**: For components used in different contexts, rename them with contextual suffixes

## Step 1: Fix the DateNavigationWeek Component

1. Create a new file `components/student/ScheduleNavigation.tsx`
2. Move the `DateNavigation` component and related styles there
3. Update imports in `Schedule.tsx`
4. Replace usages of the duplicated component

Example implementation for ScheduleNavigation.tsx:
```tsx
import React from 'react';
import styled from 'styled-components';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface ScheduleNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  dateRangeText: string;
  viewMode: 'day' | 'week' | 'list';
}

const ScheduleNavigation: React.FC<ScheduleNavigationProps> = ({
  onPrevious,
  onNext,
  dateRangeText,
  viewMode
}) => {
  return (
    <DateNavigation>
      <NavButton 
        onClick={onPrevious}
        aria-label="previous"
      >
        <FiChevronLeft size={16} />
        <span>{viewMode === 'week' ? 'Previous Week' : 'Previous Day'}</span>
      </NavButton>
      
      <DateDisplay>
        <CurrentDate>{dateRangeText}</CurrentDate>
      </DateDisplay>
      
      <NavButton 
        onClick={onNext}
        aria-label="next"
      >
        <span>{viewMode === 'week' ? 'Next Week' : 'Next Day'}</span>
        <FiChevronRight size={16} />
      </NavButton>
    </DateNavigation>
  );
};

// Styled components
const DateNavigation = styled.div`...`;
const NavButton = styled.button`...`;
const DateDisplay = styled.div`...`;
const CurrentDate = styled.div`...`;

export default ScheduleNavigation;
```

## Step 2: Rename Duplicate Components in Context-Specific Views

For the remaining duplicates, rename them with suffixes that indicate their specific context:

### In WeekView Component:
```tsx
// Rename DateCell to DateCellWeekView
const DateCellWeekView = styled.div<DateCellProps>`...`;

// Rename DayName to DayNameWeekView 
const DayNameWeekView = styled.div<DayNameProps>`...`;

// Rename DayColumn to DayColumnWeekView
const DayColumnWeekView = styled.div<DayColumnProps>`...`;

// Rename ClassEvent to ClassEventWeekView
const ClassEventWeekView = styled.div<ClassEventProps>`...`;

// Rename ClassEventContent to ClassEventContentWeekView
const ClassEventContentWeekView = styled.div`...`;

// Rename NoClassesMessage to NoClassesMessageWeekView
const NoClassesMessageWeekView = styled.div`...`;
```

### In DayView Component:
```tsx
// Rename TimeSlot to TimeSlotDay
const TimeSlotDay = styled.div`...`;

// Rename NoClassesMessage to NoClassesMessageDay
const NoClassesMessageDay = styled.div`...`;
```

## Step 3: Update Component Usage in Render Functions

Update the JSX in the render functions to use the newly named components:

```tsx
// In WeekView component
return (
  <Card className="week-view-card">
    <WeekViewHeader>
      <TimeColumnHeader />
      {dates.map((date, index) => (
        <DateCellWeekView 
          key={index}
          $isToday={isToday(date)}
          $isSelected={isSelected(date)}
          onClick={() => selectDate(date)}
        >
          <DayNameWeekView $isToday={isToday(date)}>
            {getDayName(date)}
          </DayNameWeekView>
          <DateNumber $isToday={isToday(date)} $isSelected={isSelected(date)}>
            {date.getDate()}
          </DateNumber>
        </DateCellWeekView>
      ))}
    </WeekViewHeader>
    
    {/* Update other components similarly */}
  </Card>
);
```

## Step 4: Test the Changes

Run the tests to verify the fixes:

```
npm test
```

## Conclusion

By following these steps, we've resolved the duplicate component declarations while maintaining the component functionality. This approach:

1. Improves code organization through component extraction
2. Makes components more reusable
3. Clarifies the purpose of each styled component with contextual naming
4. Eliminates compiler errors related to duplicate declarations 