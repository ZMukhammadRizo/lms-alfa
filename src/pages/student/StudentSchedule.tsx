import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCalendar, FiClock, FiFilter, FiChevronDown, 
  FiChevronLeft, FiChevronRight, FiInfo, FiBook,
  FiUsers, FiMapPin, FiArrowUp, FiUser
} from 'react-icons/fi';
import useDraggableScroll from 'use-draggable-scroll';
import supabase from '../../config/supabaseClient';
import { useUser } from '../../hooks/useUser';
import { toast } from 'react-toastify';
import { useTheme } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { startOfWeek } from 'date-fns';
import Select, { StylesConfig } from 'react-select';
import { useTranslation } from 'react-i18next';

// Helper functions
const getWeekDays = (date: Date): Date[] => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  
  const monday = new Date(date.setDate(diff));
  const days = [new Date(monday)];
  
  for (let i = 1; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    days.push(next);
  }
  
  return days;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDay = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const formatTime = (hour: number): string => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:00 ${ampm}`;
};

// Format time with minutes
const formatTimeWithMinutes = (hour: number, minute: number): string => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
};

// Type definitions
interface ClassEvent {
  id: number;
  title: string;
  course: string;
  startTime: number; // 24-hour format (e.g., 9 for 9:00 AM)
  endTime: number; // 24-hour format (e.g., 10 for 10:00 AM)
  startMinute: number; // Minutes (0-59)
  endMinute: number; // Minutes (0-59)
  day: number; // 0-6 for Monday-Sunday
  teacher: string;
  location: string;
  color: string;
}

// Default empty event for initial state
const emptyEvent: ClassEvent = {
  id: 0,
  title: '',
  course: '',
  startTime: 0,
  endTime: 0,
  startMinute: 0,
  endMinute: 0,
  day: 0,
  teacher: '',
  location: '',
  color: ''
};

interface FilterOptionProps {
  $isActive: boolean;
}

const ClassEventCard = styled.div<{ $top: number, $height: number, $color: string }>`
  position: absolute;
  top: ${props => props.$top}px;
  left: 5px;
  right: 5px;
  height: ${props => props.$height}px;
  background-color: ${props => {
    // Convert the hex color to RGB and create a lighter fully opaque pastel version
    const colorString = props.$color || '#CCCCCC'; // Default to gray if props.$color is undefined/null
    const hex = colorString.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Mix with white to create pastel
    const pastelR = Math.floor(r + (255 - r) * 0.8);
    const pastelG = Math.floor(g + (255 - g) * 0.8);
    const pastelB = Math.floor(b + (255 - b) * 0.8);
    return `rgb(${pastelR}, ${pastelG}, ${pastelB})`;
  }};
  border-left: 4px solid ${props => props.$color};
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  z-index: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }
  
`;

// Interface for child info (can be reused or imported if defined elsewhere)
interface ChildInfoForSelect {
  id: string; 
  firstName: string;
  lastName: string;
}

// Props for StudentSchedule component
interface StudentScheduleProps {
  // studentId?: string; // REMOVED - Replaced by selectedChildId for parent view
  
  // Props for Parent View
  isParentView?: boolean; // Flag to indicate parent context
  childrenList?: ChildInfoForSelect[]; // List of parent's children
  selectedChildId?: string; // The ID selected by the parent
  onChildChange?: (selectedOption: any) => void; // Handler for selection change (react-select format)
}

const StudentSchedule: React.FC<StudentScheduleProps> = ({ 
  isParentView = false, 
  childrenList = [], 
  selectedChildId, 
  onChildChange 
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const { t } = useTranslation();
  const [courseFeedback, setCourseFeedback] = useState<string>("");

  // State variables
  const [loading, setLoading] = useState<boolean>(true);
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ClassEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent>(emptyEvent);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [filterCourse, setFilterCourse] = useState<string | null>(null);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [initialLoad, setInitialLoad] = useState(true);
  const [currentTimePosition, setCurrentTimePosition] = useState<number>(0);
  const [classEvents, setClassEvents] = useState<ClassEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const weekScheduleRef = useRef<HTMLDivElement>(null);
  const { onMouseDown } = useDraggableScroll(weekScheduleRef);
  
  // Generate week days from current date
  const weekDays = getWeekDays(new Date(currentDate));
  
  // Hours range (8 AM to 5 PM)
  const hours = Array.from({ length: 10 }, (_, i) => i + 8);
  
  // Function to generate a random color based on string
  const getRandomColor = (str: string) => {
    // Simple hash function to generate a color based on a string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert to hexadecimal and ensure it's a valid color
    const color = '#' + ((hash & 0x00FFFFFF).toString(16).padStart(6, '0'));
    return color;
  };
  
  // Set initial load to false after component mounts
  useEffect(() => {
    setInitialLoad(false);
  }, []);
  
  // Fetch student's enrolled classes and timetable data
  useEffect(() => {
    const fetchStudentSchedule = async () => {
      // Determine target ID: selectedChildId if parent view, otherwise logged-in user
      const targetStudentId = isParentView ? selectedChildId : user?.id;

      // If parent view and no child is selected yet, don't fetch, clear events
      if (isParentView && !targetStudentId) {
        setClassEvents([]);
        setLoading(false); 
        setErrorMessage(null); // Clear any previous error
        return; 
      }

      if (!targetStudentId) {
        console.error('No target student ID found');
        setErrorMessage(t('parent.calendar.cannotLoadSchedule'));
        setClassEvents([]); // Clear events if no ID
        setLoading(false);
        return;
      }

      console.log(`Fetching schedule for student ID: ${targetStudentId}`);

      try {
        setLoading(true);
        setErrorMessage(null);
        
        // Step 1: Fetch enrolled classes (using targetStudentId)
        const { data: enrolledClasses, error: enrolledClassesError } = await supabase
          .from('classstudents')
          .select('classid')
          .eq('studentid', targetStudentId);
          
        if (enrolledClassesError) {
          throw new Error('Failed to fetch enrolled classes: ' + enrolledClassesError.message);
        }
        
        if (!enrolledClasses || enrolledClasses.length === 0) {
          console.log('Student not enrolled in any classes');
          setClassEvents([]); // Clear events
          setLoading(false);
          return;
        }
        
        const classIds = enrolledClasses.map(ec => ec.classid);
        
        // Step 2: Fetch timetable entries for these classes
        // Select the necessary fields including foreign keys for subsequent joins
        const { data: timetableData, error: timetableError } = await supabase
          .from('timetable')
          .select(`
            id, title, start_time, end_time, start_minute, end_minute, day, location,
            classId, subjectId,
            subjects ( id, subjectname )
          `)
          .in('classId', classIds);
          
        if (timetableError) {
          throw new Error('Failed to fetch timetable: ' + timetableError.message);
        }
        
        if (!timetableData || timetableData.length === 0) {
          console.log('No schedule found for enrolled classes');
          setClassEvents([]);
          setLoading(false);
          return;
        }

        // Step 2.5: Fetch assigned teachers for the relevant class/subject pairs
        const classSubjectPairs = timetableData
          .map(item => ({ classId: item.classId, subjectId: item.subjectId }))
          .filter(pair => pair.classId && pair.subjectId)
          .reduce((acc, pair) => {
            const key = `${pair.classId}-${pair.subjectId}`;
            if (!acc.has(key)) {
              acc.set(key, pair);
            }
            return acc;
          }, new Map());

        const teacherAssignments = new Map<string, { name: string, id: string | undefined }>();

        if (classSubjectPairs.size > 0) {
          const fetchPromises = Array.from(classSubjectPairs.values()).map(async pair => {
            const { data: assignment, error } = await supabase
              .from('classteachers')
              .select('teacherid, users ( firstName, lastName )') 
              .eq('classid', pair.classId)
              .eq('subjectid', pair.subjectId)
              .maybeSingle();

            let teacherNameToSet = t('parent.calendar.teacherNA');
            let assignedIdFromDb: string | undefined = undefined;

            if (!error && assignment) {
              assignedIdFromDb = assignment.teacherid;
              if (assignment.users) {
                const userData = assignment.users;
                let fullName = '';
                // Handle potential array or object for user data
                if (Array.isArray(userData) && userData.length > 0) {
                  const userObject = userData[0];
                  if (userObject && typeof userObject === 'object') {
                    fullName = `${userObject.firstName || ''} ${userObject.lastName || ''}`.trim();
                  }
                } else if (typeof userData === 'object' && userData !== null) {
                  fullName = `${(userData as any).firstName || ''} ${(userData as any).lastName || ''}`.trim();
                }
                if (fullName) {
                  teacherNameToSet = fullName;
                }
              }
            } // We don't need an else if(error) here, default is already N/A
            
            teacherAssignments.set(`${pair.classId}-${pair.subjectId}`, { name: teacherNameToSet, id: assignedIdFromDb });
          });
          await Promise.all(fetchPromises);
        }
        
        // Step 3: Format the timetable data for display, using assigned teachers
        const formattedEvents: ClassEvent[] = timetableData.map((item: any, index) => {
          let startTime = 9; // Default
          let endTime = 10; // Default
          let startMinute = 0; // Default
          let endMinute = 0; // Default
          
          if (item.start_time !== undefined && item.start_time !== null) {
            const parsedStart = parseInt(String(item.start_time));
            if (!isNaN(parsedStart) && parsedStart >= 0 && parsedStart <= 23) startTime = parsedStart;
          }
          if (item.end_time !== undefined && item.end_time !== null) {
            const parsedEnd = parseInt(String(item.end_time));
            if (!isNaN(parsedEnd) && parsedEnd >= 0 && parsedEnd <= 23) endTime = parsedEnd;
          }
          if (item.start_minute !== undefined && item.start_minute !== null) {
            const parsedStartMinute = parseInt(String(item.start_minute));
            if (!isNaN(parsedStartMinute) && parsedStartMinute >= 0 && parsedStartMinute <= 59) startMinute = parsedStartMinute;
          }
          if (item.end_minute !== undefined && item.end_minute !== null) {
            const parsedEndMinute = parseInt(String(item.end_minute));
            if (!isNaN(parsedEndMinute) && parsedEndMinute >= 0 && parsedEndMinute <= 59) endMinute = parsedEndMinute;
          }

          const courseName = item.subjects?.subjectname || t('parent.calendar.unknownCourse');
          const title = item.title || courseName;
          
          // Get the CORRECT assigned teacher's name from the map
          const assignmentKey = `${item.classId}-${item.subjectId}`;
          const assignmentDetails = teacherAssignments.get(assignmentKey);
          const teacherName = assignmentDetails ? assignmentDetails.name : t('parent.calendar.teacherNA');
          
          // Generate color based on course name for consistency (using existing logic)
          const color = getRandomColor(courseName);
          
          return {
            id: index + 1, // Use index as fallback ID (consider if item.id exists and is usable)
            title,
            course: courseName,
            startTime,
            endTime,
            startMinute,
            endMinute,
            day: item.day !== undefined && item.day !== null ? parseInt(String(item.day)) : 0,
            teacher: teacherName, // Use the correctly assigned teacher name
            location: item.location || t('parent.calendar.unknownLocation'),
            color
          };
        });
        
        console.log('Formatted schedule events:', formattedEvents);
        setClassEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching student schedule:', error);
        setErrorMessage(t('parent.calendar.failedToLoadSchedule'));
        setClassEvents([]); // Clear events on error
        toast.error(t('parent.calendar.failedToLoadSchedule'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentSchedule();
  }, [user, selectedChildId, isParentView, t]);
  
  // Get all unique courses
  const uniqueCourses = [...new Set(classEvents.map(event => event.course))];
  
  // Update filteredEvents when classEvents or filterCourse changes
  useEffect(() => {
  // Filter class events by course if filter is applied
    const events = filterCourse
    ? classEvents.filter(event => event.course === filterCourse)
    : classEvents;
    
    setFilteredEvents(events);
  }, [classEvents, filterCourse]);
  
  // Handle previous week/month
  const handlePrevious = () => {
    setDirection('prev');
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };
  
  // Handle next week/month
  const handleNext = () => {
    setDirection('next');
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };
  
  // Handle event click
  const handleEventClick = (event: ClassEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };
  
  // Handle filter change
  const handleFilterChange = (course: string | null) => {
    setFilterCourse(course);
    setShowFilters(false);
  };
  
  // Scroll to current time
  const scrollToCurrentTime = () => {
    if (weekScheduleRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour >= 8 && currentHour <= 17) {
        const minutesSince8AM = (currentHour - 8) * 60 + currentMinute;
        weekScheduleRef.current.scrollTop = minutesSince8AM - 60;
      }
    }
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  // Animation variants for smooth transitions
  const cardVariants = {
    hidden: (custom: number) => ({
      opacity: 0,
      y: direction === 'next' ? 20 : -20,
      transition: { delay: custom * 0.05 }
    }),
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.05 }
    }),
    exit: (custom: number) => ({
      opacity: 0,
      y: direction === 'next' ? -20 : 20,
      transition: { delay: custom * 0.05 }
    })
  };

  // Add current time indicator
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      if (hour >= 8 && hour < 18) {
        // Calculate the position based on the time since 8:00 AM
        // Using the same calculation as for events
        const hourOffset = 8; // Grid starts at 8 AM
        const pixelsPerHour = 80; // Each hour is 80px in height
        
        // Calculate decimal time (e.g., 9:30 = 9.5)
        const timeDecimal = hour + (minute / 60);
        
        // Calculate the position - add 1px offset to align with grid lines
        const position = ((timeDecimal - hourOffset) * pixelsPerHour) + 1;
        setCurrentTimePosition(position);
      }
    };
    
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 30000); // Update every 30 seconds for smoother updates
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    scrollToCurrentTime();
  }, [filteredEvents]);
  
  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Reset selected event after animation completes
    setTimeout(() => {
      setSelectedEvent(emptyEvent);
    }, 300);
  };
  
  // Add event positioning effect
  useEffect(() => {
    // Function to position events correctly
    const positionEvents = () => {
      const eventElements = document.querySelectorAll('.schedule-event');
      const gridElement = weekScheduleRef.current;
      
      if (!gridElement || !eventElements.length) return;
      
      const timeColumnWidth = 80; // Width of the time column
      const availableWidth = gridElement.clientWidth - timeColumnWidth;
      const columnWidth = availableWidth / 7; // 7 days
      
      eventElements.forEach((element, index) => {
        const htmlElement = element as HTMLElement;
        const event = filteredEvents[index];
        if (!event) return;
        
        const dayIndex = event.day;
        const hourOffset = 8; // Grid starts at 8 AM
        const pixelsPerHour = 80; // Height per hour in pixels
        const headerHeight = 60; // Height of the header row
        
        // Calculate exact decimal hours for start and end time
        const startTimeDecimal = event.startTime + (event.startMinute / 60);
        const endTimeDecimal = event.endTime + (event.endMinute / 60);
        
        // Calculate duration
        const durationHours = endTimeDecimal - startTimeDecimal;
        
        // Calculate top position
        const topPosition = headerHeight + ((startTimeDecimal - hourOffset) * pixelsPerHour);
        
        // Calculate height with minimum value
        const height = Math.max(durationHours * pixelsPerHour, 30);
        
        // Calculate left position
        const leftPosition = timeColumnWidth + (dayIndex * columnWidth);
        
        // Apply styles
        htmlElement.style.top = `${topPosition}px`;
        htmlElement.style.height = `${height}px`;
        htmlElement.style.left = `${leftPosition}px`;
        htmlElement.style.width = `${columnWidth - 10}px`; // Subtract padding
      });
    };
    
    // Position events when component mounts or filtered events change
    setTimeout(positionEvents, 100); // Slight delay to ensure the DOM is ready
    
    // Also reposition when window resizes
    window.addEventListener('resize', positionEvents);
    
    return () => {
      window.removeEventListener('resize', positionEvents);
    };
  }, [filteredEvents]);
  
  // Prepare options for react-select
  const childOptions = childrenList.map(child => ({
    value: child.id,
    label: `${child.firstName} ${child.lastName}`
  }));

  const selectedChildOption = childOptions.find(option => option.value === selectedChildId);

  // Custom styles for react-select
  const customSelectStyles: StylesConfig<any, false> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: theme.colors.background.secondary,
      borderColor: state.isFocused ? theme.colors.primary[500] : theme.colors.border.light,
      borderRadius: '0.375rem', // 6px
      padding: '0.25rem 0.5rem', // Adjusted padding for better spacing
      boxShadow: state.isFocused ? `0 0 0 1px ${theme.colors.primary[500]}` : 'none',
      '&:hover': {
        borderColor: theme.colors.primary[300],
      },
      minHeight: '38px', // Ensure consistent height
      height: '38px',
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: '38px',
      padding: '0 6px'
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px',
      color: theme.colors.text.primary,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: theme.colors.text.primary,
    }),
    placeholder: (provided) => ({
      ...provided,
      color: theme.colors.text.secondary,
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: theme.colors.background.primary,
      borderRadius: '0.375rem',
      boxShadow: theme.isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
      marginTop: '4px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? theme.colors.primary[500]
        : state.isFocused
        ? theme.colors.background.hover
        : 'transparent',
      color: state.isSelected ? 'white' : theme.colors.text.primary,
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: theme.colors.primary[600],
      },
    }),
    indicatorSeparator: () => ({
      display: 'none', // Hide the vertical line separator
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: '8px',
      color: theme.colors.text.secondary,
      '&:hover': {
        color: theme.colors.primary[500],
      },
    }),
  };

  return (
    <Container>
      <Header>
        {/* Always show Title */} 
        <HeaderLeft>
             <Title>{t('parent.calendar.schedule')}</Title>
        </HeaderLeft>
        
        <HeaderCenter>
          <DateNavButton onClick={handlePrevious}><FiChevronLeft /></DateNavButton>
          <CurrentDate>{formatDateRange(viewMode, currentDate)}</CurrentDate>
          <DateNavButton onClick={handleNext}><FiChevronRight /></DateNavButton>
        </HeaderCenter>
        
        <HeaderRight>
          {/* Conditionally render Child Selector OR Course Filter */} 
          {isParentView ? (
             <div style={{ minWidth: '250px' }}> {/* Wrapper for select */} 
               <Select
                 options={childOptions}
                 value={selectedChildOption}
                 onChange={onChildChange}
                 placeholder={t('parent.calendar.selectChildPlaceholder')}
                 isClearable={false} 
                 styles={customSelectStyles} // Apply custom styles here
               />
             </div>
           ) : (
             <FilterContainer> {/* Existing Course Filter */} 
               <FilterButton onClick={() => setShowFilters(!showFilters)}>
                 <FiFilter />
                 <span>{t('parent.calendar.filterBySubject')}</span>
                 <FiChevronDown />
               </FilterButton>
               {showFilters && (
                 <FilterDropdown>
                   <FilterOption 
                     onClick={() => handleFilterChange(null)}
                     $isActive={filterCourse === null}
                   >
                     {t('parent.calendar.allSubjects')}
                   </FilterOption>
                   {uniqueCourses.map(course => (
                     <FilterOption 
                       key={course} 
                       onClick={() => handleFilterChange(course)}
                       $isActive={filterCourse === course}
                     >
                       {course}
                     </FilterOption>
                   ))}
                 </FilterDropdown>
               )}
             </FilterContainer>
           )}
          
          <TodayButton onClick={() => { setCurrentDate(new Date()); scrollToCurrentTime(); }}>
            <FiCalendar />
            <span>{t('parent.calendar.today')}</span>
          </TodayButton>
        </HeaderRight>
      </Header>
      
      {loading ? (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>{t('parent.calendar.loadingYourSchedule')}</LoadingText>
        </LoadingContainer>
      ) : errorMessage ? (
        <ErrorContainer>
          <ErrorIcon>!</ErrorIcon>
          <ErrorMessage>{errorMessage}</ErrorMessage>
          <ErrorAction onClick={() => window.location.reload()}>
            {t('parent.calendar.tryAgain')}
          </ErrorAction>
        </ErrorContainer>
      ) : (isParentView && !selectedChildId) ? ( // Parent view, no child selected
            <PlaceholderMessage>{t('parent.calendar.pleaseSelectChild')}</PlaceholderMessage>
         ) 
       : filteredEvents.length === 0 ? ( // No events for selected child or student
            <EmptyStateContainer>
              <EmptyStateIcon>
                <FiCalendar size={40} />
              </EmptyStateIcon>
              <EmptyStateTitle>{t('parent.calendar.noScheduleFoundTitle')}</EmptyStateTitle>
              <EmptyStateMessage>
                {filterCourse 
                  ? t('parent.calendar.noScheduleForSubject', { subject: filterCourse })
                  : t('parent.calendar.noScheduledLessons')}
              </EmptyStateMessage>
            </EmptyStateContainer>
         ) 
       : viewMode === 'week' ? (
            <WeekSchedule ref={weekScheduleRef}>
              {/* Corner header cell */}
              <CornerHeaderCell></CornerHeaderCell>
              
              {/* Day header cells */}
              {weekDays.map((date, i) => (
                <HeaderCell key={i}>
                  <DayName>{formatDay(date)}</DayName>
                  <DayDate>{formatDate(date)}</DayDate>
                </HeaderCell>
              ))}
              
              {/* Time rows with cells */}
              {hours.map(hour => (
                <React.Fragment key={hour}>
                  {/* Time cell */}
                  <TimeCell>
                    {formatTime(hour)}
                  </TimeCell>
                  
                  {/* Day cells for this hour */}
                  {weekDays.map((date, dayIndex) => {
                    const isCurrentDay = isToday(date);
                    // Check if current time falls within this hour
                    const now = new Date();
                    const currentHour = now.getHours();
                    const showTimeIndicator = isCurrentDay && currentHour === hour;
                    
                      return (
                      <DayCell 
                          key={dayIndex}
                          $isToday={isCurrentDay}
                        >
                        {/* Current time indicator */}
                        {showTimeIndicator && (
                          <CurrentTimeIndicator 
                                      style={{
                                top: `${(now.getMinutes() / 60) * 100}%` 
                              }}
                            >
                              <CurrentTimeDot />
                            </CurrentTimeIndicator>
                        )}
                      </DayCell>
                    );
                  })}
                </React.Fragment>
              ))}
              
              {/* Overlay the events - absolute positioning on top of the grid */}
              {filteredEvents.map((event, index) => {
                // Calculate top and height
                const pixelsPerHour = 80; // Height of one hour slot in pixels
                const gridStartHour = 8;  // The hour at which your schedule grid starts (e.g., 8 AM)

                const topPosition = ((event.startTime - gridStartHour) + ((event.startMinute || 0) / 60)) * pixelsPerHour;
                
                const durationInMinutes = ((event.endTime * 60 + (event.endMinute || 0)) - (event.startTime * 60 + (event.startMinute || 0)));
                const heightValue = Math.max((durationInMinutes / 60) * pixelsPerHour, 30); // Ensure a minimum height (e.g., 30px)

                return (
                  <ClassEventCard 
                    key={event.id}
                    className="schedule-event"
                    $top={topPosition}
                    $height={heightValue}
                    $color={event.color}
                    onClick={() => handleEventClick(event)}
                  >
                    <EventTitle>{event.title}</EventTitle>
                    <EventDetail>
                      <FiClock />
                      <span>
                        {formatTimeWithMinutes(event.startTime, event.startMinute || 0)} - {formatTimeWithMinutes(event.endTime, event.endMinute || 0)}
                      </span>
                    </EventDetail>
                    {event.teacher && (
                      <EventDetail>
                        <FiUser />
                        <span>{event.teacher}</span>
                      </EventDetail>
                    )}
                    {event.location && (
                      <EventDetail>
                        <FiMapPin />
                        <span>{event.location}</span>
                      </EventDetail>
                    )}
                  </ClassEventCard>
                );
              })}
            </WeekSchedule>
         ) : (
            <MonthCalendar>
              {/* Month view implementation */}
              <div className="month-placeholder">{t('parent.calendar.monthViewComingSoon')}</div>
            </MonthCalendar>
         )}
      
      <ScrollTopButton onClick={() => {
        if (weekScheduleRef.current) {
          weekScheduleRef.current.scrollTop = 0;
        }
      }}>
        <FiArrowUp />
      </ScrollTopButton>
      
      {isModalOpen && (
        <EventDetailsModal>
          <ModalContent>
            <ModalHeader $color={selectedEvent.color}>
              <ModalTitle>{selectedEvent.title}</ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                ×
              </CloseButton>
            </ModalHeader>
            
            <ModalBody>
              <ModalDetail>
                <DetailIcon><FiBook /></DetailIcon>
                <DetailText>
                  <h4>{t('parent.calendar.subject')}</h4>
                  <p>{selectedEvent.course}</p>
                </DetailText>
              </ModalDetail>
              
              <ModalDetail>
                <DetailIcon><FiClock /></DetailIcon>
                <DetailText>
                  <h4>{t('parent.calendar.time')}</h4>
                  <p>{formatTimeWithMinutes(selectedEvent.startTime, selectedEvent.startMinute)} - {formatTimeWithMinutes(selectedEvent.endTime, selectedEvent.endMinute)}</p>
                </DetailText>
              </ModalDetail>
              
              <ModalDetail>
                <DetailIcon><FiUser /></DetailIcon>
                <DetailText>
                  <h4>{t('parent.calendar.teacher')}</h4>
                  <p>{selectedEvent.teacher}</p>
                </DetailText>
              </ModalDetail>
              
              <ModalDetail>
                <DetailIcon><FiMapPin /></DetailIcon>
                <DetailText>
                  <h4>{t('parent.calendar.location')}</h4>
                  <p>{selectedEvent.location}</p>
                </DetailText>
              </ModalDetail>    
              <AdditionalInfo>
                <DetailIcon><FiInfo /></DetailIcon>
                <DetailText>
                  <h4>{t('parent.calendar.additionalInformation')}</h4>
                  <p>{t('parent.calendar.bringRequiredMaterials')}</p>
                </DetailText>
              </AdditionalInfo>
            </ModalBody>
          </ModalContent>
        </EventDetailsModal>
      )}
    </Container>
  );
};

// Style helpers
const formatDateRange = (viewMode: 'week' | 'month', date: Date): string => {
  if (viewMode === 'week') {
    const weekdays = getWeekDays(new Date(date));
    const start = weekdays[0];
    const end = weekdays[weekdays.length - 1];
    
    const startFormat = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFormat = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${startFormat} - ${endFormat}`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
};

// Add these new styled components for loading and error states
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: ${props => props.theme.colors.primary};
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  font-size: 16px;
  color: ${props => props.theme.colors.text};
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
  padding: 0 20px;
  text-align: center;
`;

const ErrorIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.danger[500]};
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 16px;
`;

const ErrorMessage = styled.p`
  font-size: 16px;
  color: ${props => props.theme.colors.text};
  margin-bottom: 16px;
`;

const ErrorAction = styled.button`
  padding: 8px 16px;
  background-color: ${props => props.theme.colors.primary[500]};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary[600]};
  }
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
  padding: 0 20px;
  text-align: center;
`;

const EmptyStateIcon = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 16px;
`;

const EmptyStateTitle = styled.h3`
  font-size: 20px;
  color: ${props => props.theme.colors.text};
  margin-bottom: 8px;
`;

const EmptyStateMessage = styled.p`
  font-size: 16px;
  color: ${props => props.theme.colors.text.secondary};
  max-width: 400px;
`;

const PlaceholderMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 18px;
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  padding: 20px;
`;

// Styled Components
const Container = styled.div`
  padding: 1rem 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  background: ${props => props.theme.isDark 
    ? `linear-gradient(to right, rgba(79, 70, 229, 0.08), rgba(79, 70, 229, 0.12))` 
    : `linear-gradient(to right, rgba(79, 70, 229, 0.02), rgba(79, 70, 229, 0.05))`};
  border-radius: 16px;
  border: 1px solid ${props => props.theme.colors.border.light};
  padding: 1.5rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
`;

const ViewToggle = styled.div`
  display: flex;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: 0.5rem;
  overflow: hidden;
`;

const ViewOption = styled.button<FilterOptionProps>`
  padding: 0.5rem 1rem;
  border: none;
  background-color: ${props => props.$isActive ? props.theme.colors.primary[500] : 'transparent'};
  color: ${props => props.$isActive ? 'white' : props.theme.colors.text.primary};
  font-weight: ${props => props.$isActive ? 600 : 400};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => 
      props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.background.hover};
  }
`;

const HeaderCenter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DateNavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  border: none;
  background-color: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
`;

const CurrentDate = styled.div`
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const FilterContainer = styled.div`
  position: relative;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem; // Increased padding
  background-color: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.light}; // Changed from .medium to .light
  border-radius: 0.5rem; // Slightly more rounded
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.875rem;
  font-weight: 500; // Slightly bolder text
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
    border-color: ${props => props.theme.colors.primary[300]}; // Highlight border on hover
  }
  
  svg {
    color: ${props => props.theme.colors.text.secondary};
    transition: transform 0.2s ease; // For potential icon rotation
  }
`;

const FilterDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px); // Increased spacing from button
  right: 0;
  margin-top: 0.5rem;
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: 0.5rem; // Consistent with button
  box-shadow: ${props => props.theme.isDark ? '0 6px 15px rgba(0, 0, 0, 0.35)' : '0 6px 15px rgba(0, 0, 0, 0.12)'}; // Enhanced shadow
  z-index: 10;
  min-width: 14rem; // Increased min-width
  padding: 0.5rem 0; // Padding for items
  overflow: hidden;
`;

const FilterOption = styled.div<FilterOptionProps>`
  padding: 0.85rem 1.25rem; // Increased padding
  cursor: pointer;
  transition: all 0.2s ease, color 0.2s ease; // Added color transition
  background-color: ${props => props.$isActive ? props.theme.colors.primary[500] : 'transparent'};
  color: ${props => props.$isActive ? 'white' : props.theme.colors.text.primary};
  font-weight: ${props => props.$isActive ? 500 : 400};
  display: flex; // For potential icon alignment
  align-items: center; // For potential icon alignment
  
  &:hover {
    background-color: ${props => props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.background.hover};
    color: ${props => props.$isActive ? 'white' : props.theme.colors.text.primary};
  }
`;

const TodayButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ${props => props.theme.colors.background.secondary};
  border: none;
  border-radius: 0.375rem;
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
`;

const WeekSchedule = styled.div`
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  background-color: ${props => props.theme.colors.background.primary};
  overflow: auto;
  height: calc(100vh - 250px);
  position: relative;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x pan-y;
  scrollbar-width: thin;
  
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.isDark ? props.theme.colors.background.tertiary : 'rgba(226, 232, 240, 0.4)'};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.isDark ? 'rgba(79, 70, 229, 0.5)' : 'rgba(79, 70, 229, 0.3)'};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.isDark ? 'rgba(79, 70, 229, 0.7)' : 'rgba(79, 70, 229, 0.5)'};
  }
`;

const TimeCell = styled.div`
  padding: 10px;
  border-right: 1px solid ${props => props.theme.colors.border.light};
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.secondary};
  font-weight: 500;
  height: 80px; // Fixed height for each time slot
  position: sticky;
  left: 0;
  background: ${props => props.theme.isDark 
    ? props.theme.colors.background.secondary 
    : `linear-gradient(to bottom, #ffffff, #f9f9ff)`};
  z-index: 2;
`;

const HeaderCell = styled.div`
  padding: 10px;
  border-right: 1px solid ${props => props.theme.colors.border.light};
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  text-align: center;
  position: sticky;
  top: 0;
  background: ${props => props.theme.isDark 
    ? `linear-gradient(to bottom,  rgb(220, 219, 238),  rgb(220, 219, 238))` 
    : `linear-gradient(to bottom,  rgb(220, 219, 238),  rgb(220, 219, 238))`};
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 60px;
  
  &:last-child {
    border-right: none;
  }
`;

const CornerHeaderCell = styled(HeaderCell)`
  border-right: 1px solid ${props => props.theme.colors.border.light};
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  z-index: 4;
  background: ${props => props.theme.isDark 
    ? props.theme.colors.background.secondary 
    : `linear-gradient(to bottom, #ffffff, #f9f9ff)`};
`;

const DayCell = styled.div<{ $isToday: boolean }>`
  border-right: 1px solid ${props => props.theme.colors.border.light};
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  height: 80px;
  background: ${props => props.$isToday 
    ? (props.theme.isDark 
      ? `linear-gradient(to bottom, rgba(79, 70, 229, 0.05), rgba(79, 70, 229, 0.08))` 
      : `linear-gradient(to bottom, rgba(79, 70, 229, 0.01), rgba(79, 70, 229, 0.03))`)
    : 'transparent'};
  position: relative;
  
  &:last-child {
    border-right: none;
  }
`;

const EventTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

const EventDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: black;
  margin-bottom: 8px;
  padding: 2px 0;
`;

const ClassIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  width: 16px;
  min-width: 16px;
`;

const MonthCalendar = styled.div`
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px ${props => props.theme.isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
  padding: 1.5rem;
  border: 1px solid ${props => props.theme.colors.border.light};
`;

const ScrollTopButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary[500]};
  color: white;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 100;
  
  &:hover {
    transform: translateY(-2px);
    background-color: ${props => props.theme.colors.primary[600]};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const EventDetailsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.5);
  
  /* Add animation */
  animation: fadeIn 0.2s ease-out;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  
  /* Add animation */
  animation: slideUp 0.3s ease-out;
  
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0.8; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const ModalHeader = styled.div<{ $color: string }>`
  background-color: ${props => props.$color};
  color: white;
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2rem;
  width: 2rem;
  border-radius: 9999px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
`;

const ModalDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  
  &:last-of-type {
    border-bottom: none;
  }
`;

const DetailIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.primary[500]};
  font-size: 18px;
`;

const DetailText = styled.div`
  flex: 1;
  
  h4 {
    font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
    margin: 0 0 4px 0;
    font-weight: 500;
  }

  p {
    font-size: 1rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
    margin: 0;
  }
`;

const AdditionalInfo = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: 8px;
  padding: 1rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0;
`;

const CurrentTimeIndicator = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  z-index: 10;
  height: 2px;
  background-color: ${props => props.theme.colors.primary[500]};
  display: flex;
  align-items: center;
`;

const CurrentTimeDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary[500]};
  margin-left: 4px;
  box-shadow: 0 0 0 2px white;
`;

const DayName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const DayDate = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.secondary};
`;

export default StudentSchedule; 