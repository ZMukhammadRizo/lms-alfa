import React, { useState, useRef, useEffect, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCalendar, FiClock, FiChevronDown, 
  FiChevronLeft, FiChevronRight, FiInfo, FiBook,
  FiUsers, FiMapPin, FiTarget, FiX, FiUser
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { fetchAllTimetableEvents } from '../../services/teacherService'; // Import the new service
import { RingLoader } from 'react-spinners';

// --- Reusing Helper functions from ParentCalendar --- 
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

const formatTime = (decimalHour: number): string => {
    const hour = Math.floor(decimalHour);
    const minutes = Math.round((decimalHour - hour) * 60);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    // Only show minutes if they are not 00
    return `${formattedHour}${minutes > 0 ? `:${formattedMinutes}` : ''} ${ampm}`;
};

const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// --- New Color Generation Helpers ---

// Predefined color palette (adjust as needed)
const colorPalette = [
  '#4F46E5', // Indigo
  '#0D9488', // Teal
  '#DB2777', // Pink
  '#D97706', // Amber
  '#6D28D9', // Violet
  '#16A34A', // Green
  '#DC2626', // Red
  '#0EA5E9', // Sky Blue
  '#EA580C', // Orange
  '#65A30D', // Lime
];

// Simple hash function for strings
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Function to get a color from the palette based on a string
const getColorFromPalette = (str: string, palette: string[]): string => {
  if (!str || palette.length === 0) {
    return palette[0] || '#4F46E5'; // Default or fallback
  }
  const hash = hashCode(str);
  const index = hash % palette.length;
  return palette[index];
};

// Helper function to determine if a hex color is light or dark
const isLightColor = (hexColor: string): boolean => {
  if (!hexColor || !hexColor.startsWith('#')) return false; // Default to dark text if invalid
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Formula for perceived brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150; // Threshold for considering color light (adjust as needed)
};

// Type definitions (Updated)
interface ClassEvent {
  id: number | string;
  title: string; // Subject Name
  course: string; // Subject Name (Same as title)
  startTime: number; // Decimal hour format
  endTime: number; // Decimal hour format
  day: number; // 0-6 for Monday-Sunday
  teacher: string; 
  location: string;
  color: string; // Original color from DB (might be unused now but keep for data structure)
  classId?: string;
  className?: string; // Added from service
  generatedColor?: string; // Color generated from palette
}

// Interface for filter dropdown options
interface FilterOptionProps {
  $isActive: boolean;
}

// --- Reusing Animation Variants from ParentCalendar --- 
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

// --- TeacherSchedule Component --- 
const TeacherSchedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [direction, setDirection] = useState(0); // Use number for animation direction
  const [classEvents, setClassEvents] = useState<ClassEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter States
  const [filterSubject, setFilterSubject] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [showSubjectFilter, setShowSubjectFilter] = useState(false);
  const [showClassFilter, setShowClassFilter] = useState(false);
  
  const { user } = useAuth(); // Get user from context
  const teacherId = user?.id;
  
  const weekScheduleRef = useRef<HTMLDivElement>(null); // For potential scrolling
  
  const weekDays = getWeekDays(new Date(currentDate));
  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM
  
  // Fetch data when teacherId changes
  useEffect(() => {
    const loadData = async () => {
      if (!teacherId) {
        setError("User not logged in.");
        setIsLoading(false);
        setClassEvents([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
      try {
        const fetchedEvents = await fetchAllTimetableEvents();
        setClassEvents(fetchedEvents || []);
    } catch (err) {
        console.error("Failed to load master schedule data:", err);
        setError("Could not load schedule data. Please try again later.");
        setClassEvents([]);
    } finally {
      setIsLoading(false);
    }
    };
    
    loadData();
  }, [teacherId]);

  // Get unique subjects and classes for filters
  const uniqueSubjects = useMemo(() => 
    [...new Set(classEvents.map(event => event.course))].sort()
  , [classEvents]);

  const uniqueClasses = useMemo(() => 
    [...new Set(classEvents.map(event => event.className).filter(Boolean) as string[])].sort()
  , [classEvents]);

  // Apply filters - Return empty if no class is selected
  const filteredEvents = useMemo(() => {
    // If "All Classes" (or initial state) is selected, show nothing yet.
    if (!filterClass) {
      return [];
    }
    // Otherwise, filter by selected class and subject
    return classEvents.filter(event => {
      const subjectMatch = !filterSubject || event.course === filterSubject;
      const classMatch = event.className === filterClass; // filterClass is guaranteed non-null here
      return subjectMatch && classMatch;
    });
  }, [classEvents, filterSubject, filterClass]); 
  
  const handlePrevious = () => {
    setDirection(-1); 
    const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };
  
  const handleNext = () => {
    setDirection(1); 
    const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };
  
  const handleEventClick = (event: ClassEvent) => {
    // Calculate the generated color for this specific event
    const generatedColor = getColorFromPalette(event.course, colorPalette);
    // Set the state with the original event data PLUS the generated color
    setSelectedEvent({ ...event, generatedColor });
  };
  
  // Filter handlers
  const handleSubjectFilterChange = (subject: string | null) => {
    setFilterSubject(subject);
    setShowSubjectFilter(false);
  };

  const handleClassFilterChange = (className: string | null) => {
    setFilterClass(className);
    setShowClassFilter(false);
  };

  const handleToday = () => {
    setDirection(currentDate > new Date() ? -1 : 1); // Set direction based on current vs today
    setCurrentDate(new Date());
  };
  
  return (
    <CalendarContainer
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ControlBar>
        <CalendarTitle>My Schedule</CalendarTitle>

        <DateNavigator>
          <NavButton onClick={handlePrevious}>
            <FiChevronLeft />
          </NavButton>
          <CurrentPeriod>
            <span>{formatDate(weekDays[0])} - {formatDate(weekDays[6])}</span>
          </CurrentPeriod>
          <NavButton onClick={handleNext}>
            <FiChevronRight />
          </NavButton>
        </DateNavigator>
        
        <Spacer />

        <ActionControls>
           {/* Subject Filter */}
           <FilterContainer>
             <FilterButton onClick={() => setShowSubjectFilter(!showSubjectFilter)}>
               <FiBook size={16} /> 
               <span>{filterSubject || 'All Subjects'}</span>
               <AnimatedChevron $isOpen={showSubjectFilter} />
             </FilterButton>
             <AnimatePresence>
               {showSubjectFilter && (
                 <FilterDropdown 
                   variants={dropdownVariants}
                   initial="hidden" 
                   animate="visible" 
                   exit="exit"
                   onClick={() => setShowSubjectFilter(false)} // Close on option click
                 >
          <FilterOption 
                     onClick={() => handleSubjectFilterChange(null)}
                     $isActive={filterSubject === null}
          >
                     All Subjects
          </FilterOption>
                   {uniqueSubjects.map((subject) => (
            <FilterOption 
                       key={subject}
                       onClick={() => handleSubjectFilterChange(subject)}
                       $isActive={filterSubject === subject}
                     >
                       {subject}
            </FilterOption>
          ))}
        </FilterDropdown>
      )}
             </AnimatePresence>
           </FilterContainer>

           {/* Class/Section Filter */}
           <FilterContainer>
             <FilterButton onClick={() => setShowClassFilter(!showClassFilter)}>
               <FiUsers size={16} /> 
               <span>{filterClass || 'All Classes'}</span>
               <AnimatedChevron $isOpen={showClassFilter} />
             </FilterButton>
             <AnimatePresence>
               {showClassFilter && (
                 <FilterDropdown 
                   variants={dropdownVariants}
                   initial="hidden" 
                   animate="visible" 
                   exit="exit"
                   onClick={() => setShowClassFilter(false)} // Close on option click
                 >
          <FilterOption 
                     onClick={() => handleClassFilterChange(null)}
                     $isActive={filterClass === null}
          >
            All Classes
          </FilterOption>
                   {uniqueClasses.map((className) => (
            <FilterOption 
                       key={className}
                       onClick={() => handleClassFilterChange(className)}
                       $isActive={filterClass === className}
                     >
                       {className}
            </FilterOption>
          ))}
        </FilterDropdown>
      )}
             </AnimatePresence>
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
        // Conditionally render placeholder or schedule
        !filterClass ? (
          <SelectClassMessage>
            <FiInfo size={24} />
            Please select a class to see the schedule.
          </SelectClassMessage>
        ) : (
          <>
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentDate.toISOString() + filterClass} // Add filterClass to key for re-animation on filter change
                variants={calendarVariants}
                custom={direction} 
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ height: 'calc(100% - 5rem)', width: '100%' }} // Adjust height accounting for control bar
              >
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
                                .filter(event => event.day === dayIndex) // Filter events for the current day column
                                .map((event, index) => (
                                  <ClassEventComponent 
                                      key={`event-${event.id}`}
                                    $eventColor={event.generatedColor || event.color}
                                      style={{
                                      top: `${(event.startTime - hours[0]) * 60}px`, 
                                      height: `${(event.endTime - event.startTime) * 60}px`, 
                                      minHeight: '40px'
                                    }}
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
                                      <ClassEventDetail><FiMapPin size={12} /><span>{event.location}</span></ClassEventDetail>
                                      <ClassEventDetail><FiUser size={12} /><span>{event.teacher}</span></ClassEventDetail>
                                    </ClassEventContent>
                                  </ClassEventComponent>
                                ))}
                            </AnimatePresence>
                          </DaySchedule>
                        </DayColumn>
                      ))}
                  </DaysContainer>
                </WeekSchedule>
          </WeekScheduleContainer>
              </motion.div>
            </AnimatePresence>
          </>
        )
      )}
      
      {/* --- Reusing Modal from ParentCalendar --- */}
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
            <ModalContentComponent
               variants={modalContentVariants} 
               initial="hidden" 
               animate="visible" 
               exit="exit" 
               onClick={(e) => e.stopPropagation()} 
            >
              <ModalHeaderComponent $color={selectedEvent.generatedColor || selectedEvent.color}><h3>{selectedEvent.title}</h3><ModalCloseButton onClick={() => setSelectedEvent(null)}><FiX size={20}/></ModalCloseButton></ModalHeaderComponent>
              <ModalBodyComponent>
                <EventDetailGrid>
                  <EventDetail>
                    <EventDetailIcon $color={selectedEvent.generatedColor || selectedEvent.color}>
                      <FiBook size={16} />
                    </EventDetailIcon>
                    <EventDetailContent>
                      <EventDetailLabel>Course</EventDetailLabel>
                      <EventDetailValue>{selectedEvent.course}</EventDetailValue>
                    </EventDetailContent>
                  </EventDetail>
                  
                  <EventDetail>
                    <EventDetailIcon $color={selectedEvent.generatedColor || selectedEvent.color}>
                      <FiClock size={16} />
                    </EventDetailIcon>
                    <EventDetailContent>
                      <EventDetailLabel>Time</EventDetailLabel>
                      <EventDetailValue>{formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}</EventDetailValue>
                    </EventDetailContent>
                  </EventDetail>
                  
                  <EventDetail>
                    <EventDetailIcon $color={selectedEvent.generatedColor || selectedEvent.color}>
                <FiCalendar size={16} />
                    </EventDetailIcon>
                    <EventDetailContent>
                      <EventDetailLabel>Day</EventDetailLabel>
                      <EventDetailValue>{formatDay(weekDays[selectedEvent.day])}</EventDetailValue>
                    </EventDetailContent>
                  </EventDetail>
                                    
                  <EventDetail>
                    <EventDetailIcon $color={selectedEvent.generatedColor || selectedEvent.color}>
                      <FiUser size={16} />
                    </EventDetailIcon>
                    <EventDetailContent>
                      <EventDetailLabel>Teacher</EventDetailLabel>
                      <EventDetailValue>{selectedEvent.teacher}</EventDetailValue>
                    </EventDetailContent>
                  </EventDetail>
                  
                  <EventDetail>
                    <EventDetailIcon $color={selectedEvent.generatedColor || selectedEvent.color}>
                  <FiMapPin size={16} />
                    </EventDetailIcon>
                    <EventDetailContent>
                      <EventDetailLabel>Location</EventDetailLabel>
                      <EventDetailValue>{selectedEvent.location}</EventDetailValue>
                    </EventDetailContent>
                  </EventDetail>
                  
                  {selectedEvent.className && (
                     <EventDetail>
                       <EventDetailIcon $color={selectedEvent.generatedColor || selectedEvent.color}>
                  <FiUsers size={16} />
                       </EventDetailIcon>
                       <EventDetailContent>
                         <EventDetailLabel>Class</EventDetailLabel>
                         <EventDetailValue>{selectedEvent.className}</EventDetailValue>
                       </EventDetailContent>
                     </EventDetail>
                  )}
                </EventDetailGrid>
              </ModalBodyComponent>
              <ModalFooterComponent><ActionButton variant="outline" onClick={() => setSelectedEvent(null)}>Close</ActionButton></ModalFooterComponent>
            </ModalContentComponent>
           </ModalWrapper>
        )}
      </AnimatePresence>
    </CalendarContainer>
  );
};

// --- Reusing Styled Components from ParentCalendar (adaptations might be needed) ---
const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px); // Adjust based on header height
  background-color: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 1rem;
`;

const ControlBar = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const CalendarTitle = styled.h1`
  font-size: 1.6rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
  margin-right: 2rem;
`;

const DateNavigator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 6px;
  border: 1px solid transparent;
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
  font-size: 1rem;
`;
  
const Spacer = styled.div`
  flex-grow: 1;
`;

const ActionControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// Base Button style for filters/today
const BaseButton = styled.button` 
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 8px;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.border.light};
    background-color: ${({ theme }) => theme.colors.background.hover};
  }
`;

const TodayButton = styled(BaseButton)`
  // Inherits styles, can add specifics if needed
`;

const WeekScheduleContainer = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 8px;
`;

const TimeAxis = styled.div`
  display: flex;
  flex-direction: column;
  width: 60px;
  min-width: 60px;
  padding-top: 45px; // Match DayHeader height
  border-right: 1px solid ${props => props.theme.colors.border.light};
  align-self: stretch;
`;

const TimeSlot = styled.div`
  height: 60px; // Represents 1 hour
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
  min-width: 140px; // Ensure minimum width for readability
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${props => props.theme.colors.border.light};
  &:last-child { border-right: none; }
`;

const DayHeader = styled.div<{ $isToday: boolean }>`
  height: 45px;
  padding: 0 10px;
  text-align: center;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${({ theme }) => theme.colors.background.secondary}; // Slight background
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  ${({ $isToday, theme }) => $isToday && css`
    background-color: ${theme.colors.primary[50]};
    ${DayName}, ${DayDate} {
      color: ${theme.colors.primary[600]};
      font-weight: 600;
    }
    border-bottom-color: ${theme.colors.primary[300]};
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

// Renamed to avoid conflict
const ClassEventComponent = styled(motion.div)<{ $eventColor: string }>`
  position: absolute; 
  left: 5px;
  right: 5px;
  background-color: ${({ $eventColor }) => $eventColor};
  border-radius: 6px;
  padding: 6px 9px;
  overflow: hidden;
  cursor: pointer;
  border: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  color: ${({ $eventColor }) => isLightColor($eventColor) ? '#1f2937' : 'white'};
  z-index: 10;
  transition: filter 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  
  &:hover {
    filter: brightness(1.05);
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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
    transition: opacity 0.2s;
  }

  &:hover {
    opacity: 1;
  }
`;

// --- Reusing Modal Styled Components from ParentCalendar --- 
const ModalWrapper = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  pointer-events: none;
`;

const ModalBackdrop = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.5); 
  z-index: 1000;
`;

// Renamed to avoid conflict
const ModalContentComponent = styled(motion.div)` 
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  pointer-events: auto;
`;

interface ModalHeaderProps {
  $color: string;
}

// Renamed to avoid conflict
const ModalHeaderComponent = styled.div<ModalHeaderProps>` 
  background: ${({ $color }) => $color || '#4F46E5'}; // Use solid color, remove gradient
  color: ${({ $color }) => isLightColor($color) ? '#1f2937' : 'white'};
  padding: 1rem 1.5rem; 
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }
`;

// Renamed from ParentCalendar's CloseButton
const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  opacity: 0.8;
  font-size: 1.6rem;
  width: 2.25rem; height: 2.25rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
`;

// Renamed to avoid conflict
const ModalBodyComponent = styled.div` 
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
`;

const EventDetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr; 
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

// Renamed to avoid conflict
const ModalFooterComponent = styled.div` 
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
      ? props.theme.colors.primary?.[50]
      : props.theme.colors.primary[600]};
    // Remove hover transform/shadow for simplicity for now
  }
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
  color: ${({ theme }) => theme.colors.danger?.[600] || '#dc2626'};
  background-color: ${({ theme }) => theme.colors.danger?.[100] || '#fee2e2'};
    padding: 1rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.danger?.[200] || '#fecaca'};
  text-align: center;
  margin: 1rem;
`;

// Helper for modal header gradient
const lighten = (amount: number, color: string): string => {
  try {
    if (!color || !color.startsWith('#')) return color; // Basic check
    let [r, g, b] = color.match(/\w\w/g)?.map((hex) => parseInt(hex, 16)) || [79, 70, 229]; // Default to primary color
    r = Math.min(255, Math.round(r * (1 + amount)));
    g = Math.min(255, Math.round(g * (1 + amount)));
    b = Math.min(255, Math.round(b * (1 + amount)));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  } catch (e) {
    console.error("Color lighten error:", e);
    return color; // Return original color on error
  }
};

// Filter specific styles (reusing some from ParentCalendar)
const FilterContainer = styled.div`
  position: relative;
`;

const FilterButton = styled(BaseButton)` // Extend BaseButton
  min-width: 150px; // Give filters some minimum width
  justify-content: space-between; // Space out text and chevron
  
  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
      flex-grow: 1;
      text-align: left;
      margin: 0 0.5rem; 
  }
`;

const AnimatedChevron = styled(FiChevronDown)<{ $isOpen: boolean }>`
  transition: transform 0.2s ease-in-out;
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  flex-shrink: 0;
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
  min-width: 100%; // Match button width
  max-height: 300px;
  overflow-y: auto;
`;

const FilterOption = styled.div<FilterOptionProps>`
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
  background-color: ${props => props.$isActive ? props.theme.colors.background.hover : 'transparent'};
  color: ${props => props.$isActive ? props.theme.colors.primary[500] : props.theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
`;

const dropdownVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// Placeholder message style
const SelectClassMessage = styled.div`
    display: flex;
    flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100% - 5rem); // Fill available space below control bar
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  padding: 2rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  gap: 1rem;

  svg {
      color: ${({ theme }) => theme.colors.primary[400]};
  }
`;

export default TeacherSchedule; 