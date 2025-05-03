import React, { useState, useRef, useEffect, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCalendar, FiClock, FiFilter, FiChevronDown, 
  FiChevronLeft, FiChevronRight, FiInfo, FiBook,
  FiUsers, FiMapPin,  FiUser, FiTarget
} from 'react-icons/fi';
import { fetchParentTimetable, fetchParentChildren, fetchChildrenEnrollments } from '../../services/timetableService';
import { useAuth } from '../../contexts/AuthContext';
import { RingLoader } from 'react-spinners';

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

// Type definitions
interface ClassEvent {
  id: number | string;
  title: string;
  course: string;
  startTime: number; // 24-hour format (e.g., 9 for 9:00 AM)
  endTime: number; // 24-hour format (e.g., 10 for 10:00 AM)
  day: number; // 0-6 for Monday-Sunday
  teacher: string;
  location: string;
  color: string;
  classId?: string;
  childName?: string;
}

interface FilterOptionProps {
  $isActive: boolean;
}

interface Child {
  id: string;
  name: string;
}

// Styled component for the placeholder message
const SelectChildMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%; // Fill the available grid space
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  padding: 2rem;
`;

// Animation Variants
const calendarVariants = {
  hidden: (direction: number) => ({ 
    opacity: 0, 
    x: direction > 0 ? 50 : -50 
  }),
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { type: 'tween', duration: 0.3, ease: 'easeInOut' } 
  },
  exit: (direction: number) => ({ 
    opacity: 0, 
    x: direction < 0 ? 50 : -50, 
    transition: { type: 'tween', duration: 0.3, ease: 'easeInOut' } 
  }),
};

const eventVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { delay: i * 0.03, duration: 0.2 } 
  }),
};

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.1, ease: 'easeIn' } },
};

const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15, ease: 'easeIn' } },
};

const ParentCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCourse, setFilterCourse] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [direction, setDirection] = useState(0); // Use number for animation direction
  const [currentTimePosition, setCurrentTimePosition] = useState<number>(0);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [showChildFilter, setShowChildFilter] = useState(false);

  const [children, setChildren] = useState<Child[]>([]);
  const [classEvents, setClassEvents] = useState<ClassEvent[]>([]);
  const [enrollmentMap, setEnrollmentMap] = useState<Map<string, string[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const parentId = user?.id;
  
  const weekScheduleRef = useRef<HTMLDivElement>(null);
  
  const weekDays = getWeekDays(new Date(currentDate));
  
  const hours = Array.from({ length: 10 }, (_, i) => i + 8);
  
  useEffect(() => {
    const loadData = async () => {
      if (!parentId) {
        setError("Parent ID not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setEnrollmentMap(new Map());

      try {
        const [fetchedChildren, fetchedEnrollments, fetchedEvents] = await Promise.all([
          fetchParentChildren(parentId),
          fetchChildrenEnrollments(parentId),
          fetchParentTimetable(parentId)
        ]);

        setChildren(fetchedChildren || []);
        setEnrollmentMap(fetchedEnrollments || new Map());
        setClassEvents(fetchedEvents || []);

      } catch (err) {
        console.error("Failed to load calendar data:", err);
        setError("Could not load calendar data. Please try again later.");
        setChildren([]);
        setEnrollmentMap(new Map());
        setClassEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
  
    if (parentId) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [parentId]);

  const uniqueCourses = [...new Set(classEvents.map(event => event.course))];
  
  const filteredEvents = useMemo(() => { // Memoize for performance
    // If no child is selected, always return empty array
    if (!selectedChild) {
      return [];
    }

    // Filter all class events based on the selected child and course
    return classEvents.filter(event => {
      const matchesCourse = !filterCourse || event.course === filterCourse;
      
      // Check if the event's class is one the selected child is enrolled in
      const childEnrolledClassIds = enrollmentMap.get(selectedChild) || [];
      const matchesChildClass = event.classId && childEnrolledClassIds.includes(event.classId);
      
      return matchesCourse && matchesChildClass;
    });
  // Update dependencies for useMemo
  }, [selectedChild, classEvents, filterCourse, enrollmentMap]); 
  
  const handlePrevious = () => {
    setDirection(-1); // Set direction for animation
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };
  
  const handleNext = () => {
    setDirection(1); // Set direction for animation
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };
  
  const handleEventClick = (event: ClassEvent) => {
    setSelectedEvent(event);
  };
  
  const handleFilterChange = (course: string | null) => {
    setFilterCourse(course);
    setShowFilters(false);
  };
  
  const handleChildChange = (childId: string | null) => {
    setSelectedChild(childId);
    setShowChildFilter(false);
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
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
  
  const cardVariants = {
    hidden: (custom: number) => ({
      opacity: 0,
      y: direction === 1 ? 20 : -20,
      transition: { delay: custom * 0.05 }
    }),
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.05 }
    }),
    exit: (custom: number) => ({
      opacity: 0,
      y: direction === 1 ? -20 : 20,
      transition: { delay: custom * 0.05 }
    })
  };

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour >= 8 && currentHour <= 17) {
        const minutesSince8AM = (currentHour - 8) * 60 + currentMinute;
        setCurrentTimePosition(minutesSince8AM);
      }
    };
    
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <CalendarContainer
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ControlBar>
        <CalendarTitle>Schedule</CalendarTitle>

        <DateNavigator>
          <NavButton onClick={handlePrevious}>
            <FiChevronLeft />
          </NavButton>
          <CurrentPeriod>
            <span>
              {viewMode === 'week' 
                ? `${formatDate(weekDays[0])} - ${formatDate(weekDays[6])}` 
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </CurrentPeriod>
          <NavButton onClick={handleNext}>
            <FiChevronRight />
          </NavButton>
        </DateNavigator>
        
        <Spacer />

        <ActionControls>
          <FilterContainer>
            <FilterButton onClick={() => setShowChildFilter(!showChildFilter)}>
              <FiUsers />
              <span>{selectedChild ? children.find(c => c.id === selectedChild)?.name : 'All Children'}</span>
              <AnimatedChevron $isOpen={showChildFilter} />
            </FilterButton>
            
            {showChildFilter && (
              <FilterDropdown 
                variants={dropdownVariants}
                initial="hidden" 
                animate="visible" 
                exit="exit"
              >
                <FilterOption 
                  onClick={() => handleChildChange(null)}
                  $isActive={selectedChild === null}
                >
                  All Children
                </FilterOption>
                {children.map((child) => (
                  <FilterOption 
                    key={child.id}
                    onClick={() => handleChildChange(child.id)}
                    $isActive={selectedChild === child.id}
                  >
                    {child.name}
                  </FilterOption>
                ))}
              </FilterDropdown>
            )}
          </FilterContainer>
          
          <FilterContainer>
            <FilterButton onClick={() => setShowFilters(!showFilters)}>
              <FiFilter />
              <span>{filterCourse || 'All Courses'}</span>
              <AnimatedChevron $isOpen={showFilters} />
            </FilterButton>
            
            {showFilters && (
              <FilterDropdown 
                variants={dropdownVariants}
                initial="hidden" 
                animate="visible" 
                exit="exit"
              >
                <FilterOption 
                  onClick={() => handleFilterChange(null)}
                  $isActive={filterCourse === null}
                >
                  All Courses
                </FilterOption>
                {uniqueCourses.map((course, index) => (
                  <FilterOption 
                    key={index}
                    onClick={() => handleFilterChange(course)}
                    $isActive={filterCourse === course}
                  >
                    {course}
                  </FilterOption>
                ))}
              </FilterDropdown>
            )}
          </FilterContainer>

          <TodayButton onClick={handleToday}>
            <FiTarget size={16} />
            <span>Today</span>
          </TodayButton>
        </ActionControls>
      </ControlBar>
      
      {isLoading && (
        <LoadingOverlay>
          <RingLoader color="#4F46E5" size={60} />
        </LoadingOverlay>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!isLoading && !error && (
        // Check if a child is selected BEFORE rendering the grid structure
        selectedChild ? (
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={viewMode + currentDate.toISOString() + selectedChild} 
              variants={calendarVariants}
              custom={direction} 
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ height: '100%', width: '100%' }}
            >
              {viewMode === 'week' ? (
                <WeekScheduleContainer>
                  <TimeAxis>
                    {hours.map((hour) => (
                      <TimeSlot key={hour}>
                        {formatTime(hour)}
                      </TimeSlot>
                    ))}
                  </TimeAxis>
                  
                  <WeekSchedule ref={weekScheduleRef}>
                    <DaysContainer>
                      {weekDays.map((day, dayIndex) => (
                        <DayColumn key={dayIndex} $isToday={isToday(day)}>
                          <DayHeader $isToday={isToday(day)}>
                            <DayName>{formatDay(day)}</DayName>
                            <DayDate>{formatDate(day)}</DayDate>
                          </DayHeader>
                          
                          <DaySchedule>
                            <AnimatePresence>
                              {filteredEvents 
                                .filter(event => event.day === dayIndex)
                                .map((event, index) => (
                                  <ClassEvent 
                                    key={`event-${event.id}`} 
                                    $color={event.color}
                                    style={{ top: `${(event.startTime - 8) * 60}px`, height: `${(event.endTime - event.startTime) * 60}px`, minHeight: '40px' }}
                                    onClick={() => handleEventClick(event)}
                                    variants={eventVariants} 
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden" 
                                    custom={index} 
                                    layout
                                  >
                                    <ClassEventContent>
                                      <ClassEventTitle>{event.title}</ClassEventTitle>
                                      <ClassEventDetail><FiClock size={12} /><span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span></ClassEventDetail>
                                      <ClassEventDetail><FiUser size={12} /><span>{event.teacher}</span></ClassEventDetail>
                                      <ClassEventDetail><FiMapPin size={12} /><span>{event.location}</span></ClassEventDetail>
                                    </ClassEventContent>
                                  </ClassEvent>
                                ))}
                            </AnimatePresence>
                          </DaySchedule>
                        </DayColumn>
                      ))}
                    </DaysContainer>
                  </WeekSchedule>
                </WeekScheduleContainer>
              ) : (
                <MonthViewMessage>
                  <FiInfo size={24} />
                  <p>Month view is currently under development. Please use the Week view for scheduling.</p>
                </MonthViewMessage>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          // Render the message if no child is selected
          <SelectChildMessage>
            Select a child to see their schedule.
          </SelectChildMessage>
        )
      )}
      
      {/* Modal */} 
      <AnimatePresence>
        {selectedEvent && (
          <ModalBackdrop 
             key="backdrop" 
             variants={modalOverlayVariants} 
             initial="hidden" 
             animate="visible" 
             exit="exit" 
             onClick={() => setSelectedEvent(null)} 
          />
        )}
        {selectedEvent && (
          <ModalWrapper key="modal"> 
            <ModalContent 
               variants={modalContentVariants} 
               initial="hidden" 
               animate="visible" 
               exit="exit" 
               onClick={(e) => e.stopPropagation()} 
            >
              <ModalHeader $color={selectedEvent.color}><h3>{selectedEvent.title}</h3><CloseButton onClick={() => setSelectedEvent(null)}>×</CloseButton></ModalHeader>
              <ModalBody>
                <EventDetailGrid>
                  {selectedEvent.childName && (
                    <EventDetail>
                      <EventDetailIcon $color={selectedEvent.color}>
                        <FiUsers size={16} />
                      </EventDetailIcon>
                      <EventDetailContent>
                        <EventDetailLabel>Child</EventDetailLabel>
                        <EventDetailValue>{selectedEvent.childName}</EventDetailValue>
                      </EventDetailContent>
                    </EventDetail>
                  )}
                  
                  <EventDetail>
                    <EventDetailIcon $color={selectedEvent.color}>
                      <FiBook size={16} />
                    </EventDetailIcon>
                    <EventDetailContent>
                      <EventDetailLabel>Course</EventDetailLabel>
                      <EventDetailValue>{selectedEvent.course}</EventDetailValue>
                    </EventDetailContent>
                  </EventDetail>
                  
                  <EventDetail>
                    <EventDetailIcon $color={selectedEvent.color}>
                      <FiClock size={16} />
                    </EventDetailIcon>
                    <EventDetailContent>
                      <EventDetailLabel>Time</EventDetailLabel>
                      <EventDetailValue>{formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}</EventDetailValue>
                    </EventDetailContent>
                  </EventDetail>
                  
                  <EventDetail>
                    <EventDetailIcon $color={selectedEvent.color}>
                      <FiCalendar size={16} />
                    </EventDetailIcon>
                    <EventDetailContent>
                      <EventDetailLabel>Day</EventDetailLabel>
                      <EventDetailValue>{formatDay(weekDays[selectedEvent.day])}</EventDetailValue>
                    </EventDetailContent>
                  </EventDetail>
                  
                  <EventDetail>
                    <EventDetailIcon $color={selectedEvent.color}>
                      <FiUser size={16} />
                    </EventDetailIcon>
                    <EventDetailContent>
                      <EventDetailLabel>Teacher</EventDetailLabel>
                      <EventDetailValue>{selectedEvent.teacher}</EventDetailValue>
                    </EventDetailContent>
                  </EventDetail>
                  
                  <EventDetail>
                    <EventDetailIcon $color={selectedEvent.color}>
                      <FiMapPin size={16} />
                    </EventDetailIcon>
                    <EventDetailContent>
                      <EventDetailLabel>Location</EventDetailLabel>
                      <EventDetailValue>{selectedEvent.location}</EventDetailValue>
                    </EventDetailContent>
                  </EventDetail>
                </EventDetailGrid>
              </ModalBody>
              <ModalFooter><ActionButton variant="outline" onClick={() => setSelectedEvent(null)}>Close</ActionButton></ModalFooter>
            </ModalContent>
           </ModalWrapper>
        )}
      </AnimatePresence>
    </CalendarContainer>
  );
};

// Styled Components
const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background-color: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 1rem; // Add overall padding
`;

const ControlBar = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 0; // Adjust padding
  margin-bottom: 1rem; // Add space below control bar
  flex-wrap: wrap;
  gap: 0.75rem; // Adjust gap
`;

const CalendarTitle = styled.h1`
  font-size: 1.6rem; // Slightly larger title
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
  margin-right: 2rem;
`;

const DateNavigator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem; // Tighter gap for nav buttons
  background-color: transparent; // Remove background
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem; // Slightly larger
  height: 2.25rem;
  border-radius: 6px; // Slightly more rounded
  border: 1px solid transparent; // Transparent border initially
  background-color: ${({ theme }) => theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
    color: ${props => props.theme.colors.text.primary};
    border-color: ${({ theme }) => theme.colors.border.light};
  }
`;

const CurrentPeriod = styled.div`
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
  padding: 0 0.75rem;
  font-size: 1rem; // Slightly larger date display
`;
  
const Spacer = styled.div`
  flex-grow: 1;
`;

const ActionControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem; // Tighter gap for action buttons
`;

const FilterContainer = styled.div`
  position: relative;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem; // Adjust padding
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 8px; // More rounded
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.border.light};
    background-color: ${({ theme }) => theme.colors.background.hover};
  }
  
  svg {
    transition: transform 0.2s ease-in-out;
  }
`;

const FilterDropdown = styled(motion.div)`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 50;
  min-width: 160px;
  overflow: hidden;
`;

const FilterOption = styled.div<FilterOptionProps>`
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
  background-color: ${props => props.$isActive ? props.theme.colors.background.hover : 'transparent'};
  color: ${props => props.$isActive ? props.theme.colors.primary[500] : props.theme.colors.text.primary};
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
`;

const TodayButton = styled(FilterButton)`
  // Optional: Add specific styles if needed
`;

const WeekScheduleContainer = styled.div`
  display: flex;
  height: 100%; // Fill CalendarGridContainer
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.background.primary}; // Match container
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 8px; // Add border radius
`;

const TimeAxis = styled.div`
  display: flex;
  flex-direction: column;
  width: 60px;
  min-width: 60px;
  padding-top: 40px;
  border-right: 1px solid ${props => props.theme.colors.border.light};
  background-color: transparent; // Remove distinct background
  align-self: stretch;
`;

const TimeSlot = styled.div`
  height: 60px;
  padding-right: 8px;
  font-size: 12px;
  color: ${props => props.theme.colors.text.secondary};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const WeekSchedule = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;
`;

const DaysContainer = styled.div`
  display: flex;
  min-width: min-content;
`;

const DayColumn = styled.div<{ $isToday: boolean }>`
  flex: 1;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${props => props.theme.colors.border.light};
  &:last-child { border-right: none; }
`;

const DayHeader = styled.div<{ $isToday: boolean }>`
  height: 45px; // Slightly taller header
  padding: 0 10px;
  text-align: center;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  background-color: transparent; // Remove background
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  ${({ $isToday, theme }) => $isToday && css`
    ${DayName}, ${DayDate} {
      color: ${theme.colors.primary[600]};
      font-weight: 600;
    }
    border-bottom-color: ${theme.colors.primary[300]}; // Highlight border too
  `}
`;

const DayName = styled.div`
  font-weight: 500;
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.primary};
  text-transform: uppercase;
  line-height: 1.2;
`;

const DayDate = styled.div`
  font-size: 0.7rem;
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.2;
`;

const DaySchedule = styled.div`
  position: relative;
  flex-grow: 1; 
  background-image: linear-gradient(to bottom, ${({ theme }) => theme.colors.border.light ?? '#d1d5db'} 1px, transparent 1px);
  background-size: 100% 60px; // Lines repeat every hour (60px)
`;

const ClassEvent = styled(motion.div)<{ $color: string }>`
  position: absolute; 
  left: 5px;
  right: 5px;
  background-color: ${({ $color }) => $color};
  border-radius: 6px; // Slightly more rounded
  padding: 6px 9px;
  overflow: hidden;
  cursor: pointer;
  border: none; // Remove border for flatter look
  box-shadow: 0 1px 3px rgba(0,0,0,0.05); // Subtle shadow
  background-image: linear-gradient(rgba(255,255,255,0.05), rgba(0,0,0,0.05));
  color: white;
  z-index: 10;
  transition: filter 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    filter: brightness(1.05); // Slightly brighten on hover
    transform: translateY(-2px) scale(1.01); // Add scale effect
    box-shadow: 0 4px 8px rgba(0,0,0,0.1); // Larger shadow on hover
  }
`;

const ClassEventContent = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ClassEventTitle = styled.div`
  font-size: 0.8rem; 
  font-weight: 600; 
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: inherit;
  min-height: 1.2em;
`;

const ClassEventDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  margin-bottom: 3px;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: inherit;
  flex-shrink: 0;
  
  svg {
    width: 12px;
    height: 12px;
    opacity: 0.8;
    flex-shrink: 0;
  }
`;

const ChildIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${props => props.theme.colors.primary[500]};
  margin-bottom: 0.5rem;
  background: ${props => props.theme.isDark ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.08)'};
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
  
  svg {
    color: ${props => props.theme.colors.primary[500]};
  }
`;

const MonthViewMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: 0.5rem;
  padding: 3rem;
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
  gap: 1rem;
  
  svg {
    color: ${props => props.theme.colors.primary[400]};
  }
  
  p {
    margin: 0;
    max-width: 30rem;
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
`;

const ModalWrapper = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001; // Above backdrop
  pointer-events: none; // Allow clicks on backdrop initially
`;

const ModalBackdrop = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.5); 
  z-index: 1000;
`;

const ModalContent = styled(motion.div)`
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: 12px; // More rounded
  width: 90%;
  max-width: 480px; // Adjust size
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  pointer-events: auto; // Enable clicks on modal content
`;

interface ModalHeaderProps {
  $color: string;
}

const ModalHeader = styled.div<ModalHeaderProps>`
  background: linear-gradient(to right, ${({ $color }) => $color}, ${({ $color }) => lighten(0.1, $color)}); // Subtle gradient
  color: white;
  padding: 1rem 1.5rem; 
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.6rem;
  width: 2.25rem; height: 2.25rem; // Match NavButton size
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
`;

const EventDetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr; // Single column layout for simplicity
  gap: 1rem;
`;

const EventDetail = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const EventDetailIcon = styled.div<{ $color: string }>`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: ${props => `${props.$color}15`};
  color: ${props => props.$color};
`;

const EventDetailContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const EventDetailLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const EventDetailValue = styled.div`
  font-size: 0.95rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  background-color: ${props => props.theme.colors.background.secondary};
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'outline' }>`
  background-color: ${props => props.variant === 'outline' 
    ? 'transparent' 
    : props.theme.colors.primary[500]};
  color: ${props => props.variant === 'outline' 
    ? props.theme.colors.primary[500] 
    : 'white'};
  border: ${props => props.variant === 'outline' 
    ? `1px solid ${props.theme.colors.primary[500]}` 
    : 'none'};
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.variant === 'outline' 
      ? props.theme.isDark
        ? `rgba(79, 70, 229, 0.2)`
        : props.theme.colors.primary[50] 
      : props.theme.colors.primary[600]};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.isDark ? 'rgba(79, 70, 229, 0.25)' : 'rgba(79, 70, 229, 0.15)'};
  }
`;

const CurrentTimeLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background-color: ${props => props.theme.colors.primary[500]};
  z-index: 5;
  display: flex;
  align-items: center;
`;

const CurrentTimeIndicator = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary[500]};
  position: absolute;
  left: -5px;
  top: -4px;
  box-shadow: 0 0 0 2px ${props => props.theme.isDark ? props.theme.colors.background.secondary : 'white'};
`;

const CurrentTimeLabel = styled.div`
  font-size: 10px;
  background-color: ${props => props.theme.colors.primary[500]};
  color: white;
  padding: 2px 4px;
  border-radius: 4px;
  position: absolute;
  left: 10px;
  top: -14px;
  font-weight: 500;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.danger || '#dc2626'};
  background-color: ${({ theme }) => (theme.colors.danger || '#dc2626') + '1A'};
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  margin: 1rem;
`;

const AnimatedChevron = styled(FiChevronDown)<{ $isOpen: boolean }>`
  transition: transform 0.2s ease-in-out;
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const lighten = (amount: number, color: string): string => {
  try {
    let [r, g, b] = color.match(/\w\w/g)?.map((hex) => parseInt(hex, 16)) || [0,0,0];
    r = Math.min(255, Math.round(r * (1 + amount)));
    g = Math.min(255, Math.round(g * (1 + amount)));
    b = Math.min(255, Math.round(b * (1 + amount)));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  } catch (e) {
    return color; // Return original color on error
  }
};

export default ParentCalendar; 