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
import StudentSchedule from '../student/StudentSchedule';

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

// Interface for basic child info needed for the dropdown
interface ChildInfo {
  id: string; // Child's user/student ID
  firstName: string;
  lastName: string;
}

// Styled Components for the Parent Calendar Page
const ParentCalendarContainer = styled.div`
  padding: 20px;
  font-family: 'Arial', sans-serif; // Example font
`;

const LoadingText = styled.div`
  text-align: center; padding: 50px; color: #495057; font-size: 1.1em;
`;

const ErrorText = styled.div`
  text-align: center; padding: 50px; color: red; font-size: 1.1em;
`;

const ParentCalendar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [childrenList, setChildrenList] = useState<ChildInfo[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [isLoadingChildren, setIsLoadingChildren] = useState<boolean>(true);
  const [childrenError, setChildrenError] = useState<string | null>(null);

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
      if (!user || !user.id) {
        console.error('No user found');
        setErrorMessage('User authentication required');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setErrorMessage(null);
        
        // Step 1: Fetch the classes that the student is enrolled in
        const { data: enrolledClasses, error: enrolledClassesError } = await supabase
          .from('classstudents')
          .select('classid')
          .eq('studentid', user.id);
          
        if (enrolledClassesError) {
          throw new Error('Failed to fetch enrolled classes: ' + enrolledClassesError.message);
        }
        
        if (!enrolledClasses || enrolledClasses.length === 0) {
          console.log('Student not enrolled in any classes');
          setClassEvents([]);
          setLoading(false);
          return;
        }
        
        // Extract class IDs
        const classIds = enrolledClasses.map(ec => ec.classid);
        console.log('Student is enrolled in classes with IDs:', classIds);
        
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

            let teacherNameToSet = 'Teacher N/A';
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

          const courseName = item.subjects?.subjectname || 'Unknown Course';
          const title = item.title || courseName;
          
          // Get the CORRECT assigned teacher's name from the map
          const assignmentKey = `${item.classId}-${item.subjectId}`;
          const assignmentDetails = teacherAssignments.get(assignmentKey);
          const teacherName = assignmentDetails ? assignmentDetails.name : 'Teacher N/A';
          
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
            location: item.location || 'Unknown Location',
            color
          };
        });
        
        console.log('Formatted schedule events:', formattedEvents);
        setClassEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching student schedule:', error);
        setErrorMessage('Failed to load schedule. Please try again later.');
        toast.error('Failed to load your schedule');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentSchedule();
  }, [user]);
  
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
  
  useEffect(() => {
    const fetchChildren = async () => {
      // Reset states on user change or initial load
      setChildrenList([]);
      setSelectedChildId('');
      setChildrenError(null);
      setIsLoadingChildren(true);

      if (!user?.id) {
        setChildrenError("Please log in to view children's schedules.");
        setIsLoadingChildren(false);
        return;
      }

      try {
        // --- Corrected Logic --- 
        // Fetch children directly from the 'users' table where 'parent_id' matches the logged-in user's ID
        // Adjust column names ('id', 'firstName', 'lastName', 'parent_id') if needed for your 'users' table schema
        const { data: childrenData, error: childrenError } = await supabase
          .from('users') // Query the users table directly
          .select('id, firstName, lastName') // Select the child info needed
          .eq('parent_id', user.id); // Filter by the parent_id column

        if (childrenError) throw childrenError;

        if (!childrenData || childrenData.length === 0) {
          // No error, but no children found linked to this parent
          setChildrenList([]); 
        } else {
          setChildrenList(childrenData);
        }

      } catch (error: any) {
        console.error("Error fetching children:", error);
        setChildrenError("Failed to load children list. Please try again later.");
        setChildrenList([]); // Clear list on error
      } finally {
        setIsLoadingChildren(false);
      }
    };

    fetchChildren();
  }, [user]); // Re-fetch if parent user changes

  const handleChildSelectChange = (selectedOption: any) => {
    setSelectedChildId(selectedOption ? selectedOption.value : '');
  };

  // Update the grid cells JSX:
                  return (
    <ParentCalendarContainer>
      {/* Display loading/error states for children fetching */}
      {isLoadingChildren && <LoadingText>Loading children...</LoadingText>}
      {childrenError && <ErrorText>{childrenError}</ErrorText>}

      {/* Render StudentSchedule only when children loading is done and no error */}
      {!isLoadingChildren && !childrenError && (
        <StudentSchedule
          isParentView={true}
          childrenList={childrenList}
          selectedChildId={selectedChildId}
          onChildChange={handleChildSelectChange}
        />
      )}
    </ParentCalendarContainer>
  );
};

export default ParentCalendar; 