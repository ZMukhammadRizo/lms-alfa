import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiClock, FiFilter, FiChevronDown, 
  FiChevronLeft, FiChevronRight, FiArrowUp, FiUser,
  FiMapPin, FiEdit, FiPlus, FiX, FiUsers
} from 'react-icons/fi';
import supabase from '../../config/supabaseClient';

// Helper functions
const getWeekDays = (date: Date): Date[] => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  
  const monday = new Date(date.setDate(diff));
  const days = [new Date(monday)];
  
  for (let i = 1; i < 7; i++) {  // Changed to 7 days (Mon-Sun) for full week
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

const formatTime = (hour: number, minute: number = 0): string => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minute === 0 ? '00' : minute} ${ampm}`;
};

// Type definitions
interface ClassEvent {
  id: number;
  title: string;
  subjectid: string;
  startTime: number; // 24-hour format (e.g., 9 for 9:00 AM)
  startMinute?: number; // Optional minute (e.g., 30 for 9:30)
  endTime: number; // 24-hour format (e.g., 10 for 10:00 AM)
  endMinute?: number; // Optional minute (e.g., 30 for 10:30)
  day: number; // 0-6 for Monday-Sunday
  teacherid?: string;
  students?: number;
  location?: string;
  color: string;
  // Add these for backward compatibility with existing code
  course?: string; // For display purposes
  teacher?: string; // For display purposes
  classId?: string; // Store the class ID from the database
  className?: string; // Store the class name for display
}

// Define global variable types
declare global {
  interface Window {
    actualIdFieldName?: string;
    lastEditedEvent?: ClassEvent;
    lastDeletedEventId?: number;
  }
}

interface FilterOptionProps {
  $isActive: boolean;
}

// Adding interfaces for form data
interface ScheduleFormData {
  title: string;
  course: string;
  startTime: string;
  endTime: string;
  day: number;
  location: string;
  assignedClass: string;
}

// Update interfaces to match the relationship between classes and subjects
interface ClassSubject {
  classid: boolean;
  subjectId: string | undefined;
  id: string;
  classId?: string;
  subjectid?: string; // Some DBs may use subjectid instead of subject_id
  subject_name?: string;
  subjectname?: string; // Add this for consistency
  className?: string;  // Add this property
  classname?: string;   // Add this property
}

// Adding interfaces for the Supabase data
interface CourseData {
  id: string;
  name: string;
  color: string;
}

interface ClassData {
  id: string;
  name: string;
  teacherid?: string;
}

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 20px;
  font-family: 'Inter', sans-serif;
  background-color: #f8fafc;
  min-height: calc(100vh - 60px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;
  
const Title = styled.h2`
    font-size: 24px;
    font-weight: 600;
  color: #1e293b;
    margin: 0;
`;

const HeaderControls = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  
  &:hover {
    background-color: #f8fafc;
  }
  
  svg {
    color: #6b7280;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #3b82f6;
  color: white;
  border: none;
  
  &:hover {
    background-color: #2563eb;
  }
  
  svg {
    color: white;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
`;

const DateNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: white;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f7fafc;
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    cursor: default;
    opacity: 0.5;
    transform: none;
    box-shadow: none;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const FilterDropdown = styled.div`
  position: relative;
  min-width: 120px;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    background: #f7fafc;
  }
  
  svg {
    color: #718096;
  }
`;

const DropdownContent = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

const DropdownItem = styled.div<FilterOptionProps>`
  padding: 8px 12px;
  cursor: pointer;
  background: ${props => props.$isActive ? '#edf2f7' : 'transparent'};
  
  &:hover {
    background: #f7fafc;
  }
`;

const TimetableContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative; /* Ensure position relative here */
`;

const TimetableHeader = styled.div`
  display: grid;
  grid-template-columns: 70px repeat(7, 1fr); // 7 days + time column
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
`;

const HeaderCell = styled.div`
  padding: 14px 8px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  border-right: 1px solid #e2e8f0;
  margin: 0 4px;
  
  &:last-child {
    border-right: none;
  }
`;

const DayHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const DayName = styled.div`
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
`;

const DayDate = styled.div`
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
  font-weight: normal;
`;

const TimetableBody = styled.div`
  display: grid;
  grid-template-columns: 70px repeat(7, 1fr); // 7 days + time column
  overflow-y: auto;
  max-height: calc(100vh - 250px);
`;

const TimeColumn = styled.div`
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  min-width: 70px;
`;

const TimeSlot = styled.div`
  height: 80px; // Increased height for better spacing
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  text-align: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DayColumn = styled.div<{ $isToday: boolean }>`
  position: relative;
  border-right: 1px solid #e2e8f0;
  background: ${props => props.$isToday ? '#f0f9ff' : 'white'};
  margin: 0 4px;
  
  &:last-child {
    border-right: none;
  }
`;

const HourRow = styled.div`
  height: 80px; // Increased height to match TimeSlot
  border-bottom: 1px solid #e2e8f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ClassCard = styled.div<{ $top: number, $height: number, $color: string }>`
  position: absolute;
  top: ${props => props.$top}px;
  left: 5px;
  right: 5px;
  height: ${props => props.$height}px;
  background-color: ${props => {
    // Convert the hex color to RGB and create a lighter fully opaque pastel version
    const hex = props.$color.replace('#', '');
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
  
  /* Show action buttons only on hover */
  .action-buttons {
    display: none;
  }
  
  &:hover .action-buttons {
    display: flex;
  }
`;

const ClassTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

const ClassDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
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

const CurrentTimeIndicator = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: #ef4444;
  z-index: 3;
  
  &::before {
    content: '';
    position: absolute;
    left: 68px;
    top: -4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
  }
`;

const ColorLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 15px;
  padding: 15px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
`;

const LegendTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
`;

const LegendItems = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ColorCircle = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$color};
`;

const LegendText = styled.div`
  font-size: 12px;
  color: #64748b;
`;

const TimeLabel = styled.div`
  display: flex;
  flex-direction: column;
`;

const TimePart = styled.span`
  line-height: 1.2;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  
  &:hover {
    color: #334155;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
`;

const CancelButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  
  &:hover {
    background: #f7fafc;
  }
`;

const SubmitButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #3b82f6;
  font-size: 14px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  
  &:hover {
    background: #2563eb;
  }
`;

// Add loading spinner styled component
const LoadingSpinner = styled.div`
  display: inline-block;
  width: 30px;
  height: 30px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
  margin: 0 auto;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ActionButtons = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  z-index: 2;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: white;
    color: #3b82f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  &.delete-btn:hover {
    color: #ef4444;
  }
`;

// Create styled component for success message
const SuccessMessage = styled.div`
  color: #10b981;
  margin-bottom: 15px;
  text-align: center;
  padding: 12px;
  background: #ecfdf5;
  border-radius: 4px;
  border: 1px solid #a7f3d0;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const AnimatedContainer = styled.div<{ $isAnimating: boolean, $direction: 'left' | 'right' | null }>`
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  transform: ${props => props.$isAnimating 
    ? `translateX(${props.$direction === 'left' ? '-3%' : '3%'}) scale(0.98)` 
    : 'translateX(0) scale(1)'};
  opacity: ${props => props.$isAnimating ? 0.7 : 1};
  will-change: transform, opacity;
  position: relative;
  min-height: 300px; /* Ensure min-height to prevent layout shifts */
`;

const AnimatedDateRange = styled.div<{ $isAnimating: boolean, $direction: 'left' | 'right' | null }>`
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  transform: ${props => props.$isAnimating 
    ? `translateX(${props.$direction === 'left' ? '-8px' : '8px'})`
    : 'translateX(0)'};
  opacity: ${props => props.$isAnimating ? 0.5 : 1};
  font-weight: 500;
  position: relative;
  min-width: 120px;
  text-align: center;
  display: inline-block;
`;

// Add fade-in animation for initial load
const FadeIn = styled.div`
  animation: fadeIn 0.6s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Placeholder message component
const PlaceholderMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px; // Adjust height as needed
  font-size: 16px;
  color: #64748b;
  text-align: center;
  background-color: white;
  border-top: 1px solid #e2e8f0;
`;

const Timetables: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterCourse, setFilterCourse] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [filterTeacher, setFilterTeacher] = useState<string | null>(null);
  const [showCourseFilter, setShowCourseFilter] = useState(false);
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [showTeacherFilter, setShowTeacherFilter] = useState(false);
  const [currentTimePos, setCurrentTimePos] = useState<number>(0);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [classEvents, setClassEvents] = useState<ClassEvent[]>([]);
  const [nextId, setNextId] = useState(9); // Starting ID after our existing mock data
  
  // Add state for animation
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Add state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Supabase data states
  const [allCourses, setAllCourses] = useState<CourseData[]>([]); // All courses/subjects
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]); // Relationships between classes and subjects
  const [availableCourses, setAvailableCourses] = useState<CourseData[]>([]); // Courses available for selected class
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    course: '',
    startTime: '09:00',
    endTime: '10:00',
    day: 0,
    location: '',
    assignedClass: ''
  });
  
  const timetableRef = useRef<HTMLDivElement>(null);
  
  // Generate week days based on current date
  const weekDays = getWeekDays(currentDate);
  
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
  
  // Create course colors object
  const courseColors = allCourses.reduce((acc: Record<string, string>, course: CourseData) => ({
    ...acc,
    [course.name]: course.color
  }), {
    // Fallback colors in case data isn't loaded yet
    "Algebra": "#4F46E5",
    "Physics": "#0EA5E9",
    "Chemistry": "#10B981",
    "Biology": "#F59E0B",
    "Geometry": "#8B5CF6"
  });

  // Fetch all subjects from Supabase
  useEffect(() => {
    const fetchSubjectsAndRelationships = async () => {
      try {
        setIsLoading(true);
        
        // First get the classsubjects data to find the relationships
        const { data: relationshipsData, error: relationshipsError } = await supabase
          .from('classsubjects')
          .select('*');
        
        if (relationshipsError) {
          throw relationshipsError;
        }
        
        if (relationshipsData) {
          console.log('Raw classsubjects data:', relationshipsData);
          
          // Store relationships for later filtering
          setClassSubjects(relationshipsData);
          
          // Next, get the subjects data to find details about each subject
          const { data: subjectsData, error: subjectsError } = await supabase
            .from('subjects')
            .select('*');
          
          if (subjectsError) {
            console.warn('Error fetching subjects, will try to extract from relationships:', subjectsError);
            
            // If we can't get subjects directly, extract from relationships
            const extractedSubjects = new Map();
            
            relationshipsData.forEach(item => {
              const subjectId = item.subjectId || item.subjectid;
              
              if (subjectId) {
                // Use either provided name or generate a placeholder
                const subjectName = item.subject_name || item.subjectname || `Subject ${subjectId}`;
                
                if (!extractedSubjects.has(subjectId)) {
                  extractedSubjects.set(subjectId, {
                    id: subjectId,
                    name: subjectName, // Use the extracted name
                    color: getRandomColor(subjectName)
                  });
                }
              }
            });
            
            const formattedSubjects = Array.from(extractedSubjects.values());
            console.log('Extracted subjects from relationships:', formattedSubjects);
            setAllCourses(formattedSubjects);
            
          } else if (subjectsData && subjectsData.length > 0) {
            // We successfully got subjects data
            console.log('Subjects data:', subjectsData);
            
            const formattedSubjects = subjectsData.map(subject => {
              // Extract name from various possible fields
              const subjectName = subject.name || subject.subjectname || subject.subject_name || `Subject ${subject.id}`;
              
              return {
                id: subject.id,
                name: subjectName, // Use the standardized name
                color: subject.color || getRandomColor(subjectName)
              };
            });
            
            console.log('Formatted subjects:', formattedSubjects);
            setAllCourses(formattedSubjects);
            
          } else {
            // No subjects found, use default
            console.warn('No subjects found in database');
            setAllCourses([]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load subjects. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubjectsAndRelationships();
  }, []);
  
  // Fetch classes from Supabase
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        setError(null); // Clear previous errors
        
        // Simplify query to just get basic class data first
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('id, classname, teacherid');
        
        if (classesError) {
          console.error('Error fetching classes:', classesError);
          setError('Failed to load classes. Please try again later.');
          setIsLoading(false);
          return;
        }
        
        if (classesData && classesData.length > 0) {
          console.log('Successfully retrieved classes data:', classesData);
          
          // Ensure we're mapping the data correctly based on actual column names
          const formattedData = classesData.map(item => {
            return {
              id: item.id,
              name: item.classname,
              teacherid: item.teacherid
            };
          });
          
          console.log('Formatted classes data:', formattedData);
          setClasses(formattedData);
        } else {
          console.log('No classes data returned');
          setClasses([]);
        }
      } catch (error) {
        console.error('Error in fetchClasses function:', error);
        setError('Failed to load classes. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClasses();
  }, []);

  // Update available courses when a class is selected
  useEffect(() => {
    if (formData.assignedClass && classSubjects.length > 0) {
      console.log('Current form data:', formData);
      console.log('All class subjects data:', classSubjects);
      console.log('All courses:', allCourses);
      console.log('All classes:', classes);
      
      // Find the class ID for the selected class name
      const selectedClass = classes.find(c => c.name === formData.assignedClass);
      
      if (selectedClass) {
        console.log('Selected class:', selectedClass);
        
        // Get all possible ways the class ID might be stored
        const classId = selectedClass.id;
        const className = selectedClass.name;
        
        console.log(`Looking for class with ID ${classId} or name ${className}`);
        
        // Find all relationships for this class
        const subjectsForClass = classSubjects.filter(cs => {
          // Check every possible way the class could be referenced
          const classIdMatch = 
            (cs.classId && String(cs.classId) === String(classId)) || 
            (cs.classid && String(cs.classid) === String(classId));
          
          // Also check for class name matches
          const classNameMatch = 
            (cs.className === className) || 
            (cs.classname === className);
          
          const isMatch = classIdMatch || classNameMatch;
          
          if (isMatch) {
            console.log(`Found matching class relationship:`, cs);
          }
          
          return isMatch;
        });
        
        if (subjectsForClass.length === 0) {
          console.warn(`No subjects found for class ${className}`);
          setAvailableCourses([]);
        } else {
          console.log('Subjects for this class:', subjectsForClass);
          
          // Get all subject IDs for this class
          const subjectIds = subjectsForClass.map(cs => cs.subjectId || cs.subjectid).filter(Boolean);
          console.log('Subject IDs for this class:', subjectIds);
          
          // Find matching courses
          const filteredCourses = allCourses.filter(course => 
            subjectIds.includes(course.id)
          );
          
          console.log('Filtered courses for this class:', filteredCourses);
          
          // If no matching courses but we have subject IDs, create placeholder courses
          if (filteredCourses.length === 0 && subjectIds.length > 0) {
            console.log('Creating placeholder courses from subject IDs');
            
            const placeholderCourses = subjectIds
              .filter(id => id !== undefined) // Filter out undefined IDs
              .map(id => {
                // Try to find subject name in the relationship data
                const relationship = subjectsForClass.find(
                  cs => (cs.subjectId === id || cs.subjectid === id)
                );
                
                const name = relationship?.subject_name || 
                           relationship?.subjectname || 
                           `Subject ${id}`;
                
                return {
                  id: id!, // Non-null assertion since we filtered out undefined values
                  name,
                  color: getRandomColor(name)
                };
              });
            
            console.log('Created placeholder courses:', placeholderCourses);
            setAvailableCourses(placeholderCourses as CourseData[]);
          } else {
            setAvailableCourses(filteredCourses);
          }
        }
        
        // Reset course selection
        setFormData(prev => ({
          ...prev,
          course: ''
        }));
      }
    }
  }, [formData.assignedClass, classSubjects, allCourses, classes]);

  // Fetch timetable data from Supabase
  const fetchTimetableData = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      
      const { data: timetableData, error: timetableError } = await supabase
        .from('timetable')
        .select('*, subjects:subjects!timetable_subjectId_fkey(id, subjectname), classes(id, classname), users(firstName, lastName)'); // Specify relationship
      
      if (timetableError) {
        console.error('Error fetching timetable:', timetableError);
        setError('Failed to load schedule. Please try again later.');
        setIsLoading(false);
        return;
      }
      
      if (!timetableData || timetableData.length === 0) {
        console.log('No timetable data found, using empty schedule');
        setClassEvents([]);
        setIsLoading(false);
        return;
      }
      
      console.log('Raw timetable data:', timetableData);
      
      // Inspect the first record to see the actual database column names
      if (timetableData.length > 0) {
        console.log('Database schema column names:');
        const firstRecord = timetableData[0];
        Object.keys(firstRecord).forEach(key => {
          console.log(`- ${key}: ${typeof firstRecord[key]} = ${JSON.stringify(firstRecord[key])}`);
        });
      }
      
      // Convert timetable data to ClassEvent format, ensuring all IDs are valid numbers
      const formattedEvents: ClassEvent[] = timetableData.map((item: any, index) => {
        // Extract or default the values we need
        // Always use the index+1 as a fallback ID to ensure we have a valid number
        let id = index + 1; // Default fallback ID 
        
        // Try to use the database ID if it's valid
        if (item.id !== undefined && item.id !== null) {
          const parsedId = parseInt(String(item.id));
          if (!isNaN(parsedId)) {
            id = parsedId;
          }
        }
        
        // Get title from direct field or use subject name as fallback
        const title = item.title || 
                     (item.subjects?.subjectname ? `${item.subjects.subjectname} Class` : 'Untitled Lesson');
        
        // Get course name from either related subject or find it from our allCourses list using subject ID
        let courseName = 'Unknown Course';
        
        if (item.subjects?.subjectname) {
          courseName = item.subjects.subjectname;
        } else if (item.subjectId) {
          // Try to find the subject name from our list of all courses
          const subjectMatch = allCourses.find(c => c.id === item.subjectId);
          if (subjectMatch) {
            courseName = subjectMatch.name;
          }
        }
        
        // Parse time values from various possible field formats
        let startTime = 9; // Default to 9 AM
        
        if (item.start_time !== undefined && item.start_time !== null) {
          startTime = typeof item.start_time === 'string' ? parseInt(item.start_time) : item.start_time;
        } else if (item.startTime !== undefined && item.startTime !== null) {
          // Handle time object format (HH:MM:SS)
          if (typeof item.startTime === 'string' && item.startTime.includes(':')) {
            startTime = parseInt(item.startTime.split(':')[0]);
          } else if (typeof item.startTime === 'object' && item.startTime.hours !== undefined) {
            startTime = item.startTime.hours;
          }
        }
        
        let endTime = startTime + 1; // Default to 1 hour length
        
        if (item.end_time !== undefined && item.end_time !== null) {
          endTime = typeof item.end_time === 'string' ? parseInt(item.end_time) : item.end_time;
        } else if (item.endTime !== undefined && item.endTime !== null) {
          // Handle time object format (HH:MM:SS)
          if (typeof item.endTime === 'string' && item.endTime.includes(':')) {
            endTime = parseInt(item.endTime.split(':')[0]);
          } else if (typeof item.endTime === 'object' && item.endTime.hours !== undefined) {
            endTime = item.endTime.hours;
          }
        }
        
        // Parse minutes if available
        const startMinute = item.start_minute || item.startMinute || 0;
        const endMinute = item.end_minute || item.endMinute || 0;
        
        // Parse day value (0-6 for Monday-Sunday)
        let day = 0; // Default to Monday
        if (item.day !== undefined && item.day !== null) {
          if (typeof item.day === 'string') {
            day = parseInt(item.day);
          } else if (typeof item.day === 'object' && (item.day instanceof Date || 'getDate' in item.day)) {
            // Get day of week from Date (0 = Sunday, 1 = Monday)
            try {
              const dateObj = item.day instanceof Date ? item.day : new Date(item.day);
              day = dateObj.getDay();
              if (day === 0) day = 6; // Convert Sunday from 0 to 6
              else day -= 1; // Shift other days down by 1
            } catch (e) {
              console.error('Error parsing date object:', e);
              day = 0; // Default to Monday on error
            }
          } else {
            day = typeof item.day === 'number' ? item.day : 0;
          }
          
          // Ensure day is between 0-6
          day = day % 7;
        }
        
        // Other fields
        const location = item.location || item.room || '';
        
        // Get teacher info from either direct field or relationship
        const teacher = item.teacher || 
                       (item.users ? `${item.users.firstName} ${item.users.lastName}` : '') ||
                       '';
        
        // Store class info separately - keep className for UI purposes
        const classId = item.classId || item.class_id || '';
        // Get className from the classes relation if available
        const className = item.classes?.classname || '';
        
        const students = item.students || item.student_count || 0;
        
        // Find course color or generate one
        const courseObj = allCourses.find(c => c.name === courseName);
        const color = item.color || 
                     courseObj?.color || 
                     courseColors[courseName as keyof typeof courseColors] || 
                     getRandomColor(courseName);
        
        return {
          id,  // Use our validated ID
          title,
          subjectid: item.subjectId || '',
          startTime,
          startMinute,
          endTime,
          endMinute,
          day,
          location,
          teacherid: item.teacherId || '',
          students,
          color,
          // Add these for display purposes
          course: courseName,
          teacher,
          classId,
          className // Only for UI display
        };
      });
      
      console.log('Formatted timetable events:', formattedEvents);
      setClassEvents(formattedEvents);
      
    } catch (error) {
      console.error('Error processing timetable data:', error);
      setError('Failed to process schedule data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with data from Supabase timetable
  useEffect(() => {
    // Only fetch timetable data if we have course data loaded
    if (allCourses.length > 0) {
      fetchTimetableData();
    }
  }, [allCourses]); // Depend on allCourses to ensure we have course data for colors
  
  // Ensure we include predefined classes if they're not already in the database
  useEffect(() => {
    // Add default grade-section classes if not already in the database
    const defaultClasses = ['10A', '10B', '11A', '11B', '12A', '12B'];
    const existingClassNames = classes.map(c => c.name);
    
    // Combine database classes with default classes for the filter
    const missingClasses = defaultClasses.filter(c => !existingClassNames.includes(c));
    
    if (missingClasses.length > 0) {
      console.log('Adding missing default classes to the filter options:', missingClasses);
    }
  }, [classes]);

  // Get unique classes and sort them by grade then section
  const getUniqueClasses = () => {
    // Only use classes from the database
    const classNames = classes.map(c => c.name).filter(Boolean);

    // Sort by grade then section
    return classNames.sort((a, b) => {
      // Extract numeric part or default to 0
      const gradeAMatch = a.match(/\d+/);
      const gradeBMatch = b.match(/\d+/);
      
      const gradeA = gradeAMatch ? parseInt(gradeAMatch[0], 10) : 0;
      const gradeB = gradeBMatch ? parseInt(gradeBMatch[0], 10) : 0;
      
      if (gradeA !== gradeB) return gradeA - gradeB;
      return a.localeCompare(b);
    });
  };
  
  // Get unique courses and teachers
  const uniqueCourses = [...new Set(classEvents.map((event: ClassEvent) => event.course || ''))];
  const uniqueClasses = getUniqueClasses();
  const uniqueTeachers = [...new Set(classEvents.map((event: ClassEvent) => event.teacher || event.teacherid || '').filter(Boolean))];
  
  // Filter events - update to correctly check for matching classes
  const filteredEvents = classEvents.filter(event => 
    (filterCourse ? (event.course || '') === filterCourse : true) && 
    (filterClass ? (
      // For class filtering, we check two things:
      // 1. The class name stored in our local state (for UI purposes)
      // 2. Find the class name using the classId (what's stored in the database)
      event.className === filterClass || 
      classes.find(c => c.id === event.classId)?.name === filterClass
    ) : true) &&
    (filterTeacher ? (event.teacher || event.teacherid || '') === filterTeacher : true)
  );
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Available classes for assignment 
  const availableClasses = ['10A', '10B', '11A', '11B', '12A', '12B'];
  
  // Function to calculate date for a given day of week (0-6)
  const calculateDateForDay = (dayOfWeek: number): string => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    
    // Convert to our format where 0 = Monday
    const currentDayConverted = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    
    // Calculate days to add
    let daysToAdd = dayOfWeek - currentDayConverted;
    
    // If the day is earlier in the week, move to next week
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }
    
    // Create the date
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    
    // Format as YYYY-MM-DD
    return targetDate.toISOString().split('T')[0];
  };
  
  // Close modal and reset form
  const resetForm = () => {
    setShowScheduleModal(false);
    setIsEditing(false);
    setCurrentEventId(null);
    setFormData({
      title: '',
      course: '',
      startTime: '09:00',
      endTime: '10:00',
      day: 0,
      location: '',
      assignedClass: ''
    });
    console.log('Form reset, currentEventId is now:', null);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      setSuccessMessage(null); // Clear success message
      
      console.log('Form submission - isEditing:', isEditing);
      console.log('Form submission - currentEventId:', currentEventId);
      
      // Parse form data
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);
      
      // Find the course color and ID from our course list
      const selectedCourse = availableCourses.find(course => course.name === formData.course);
      const courseColor = selectedCourse?.color || getRandomColor(formData.course);
      
      // Get class info
      const selectedClass = classes.find(c => c.name === formData.assignedClass);
      
      if (!selectedClass) {
        setError('Please select a valid class');
        setIsLoading(false);
        return;
      }
      
      console.log('Selected class details:', selectedClass);
      console.log('Selected course details:', selectedCourse);
      
      // Validate UUIDs
      console.log('Validating IDs:');
      console.log('- Class ID:', selectedClass.id, 'type:', typeof selectedClass.id);
      console.log('- Class teacher ID:', selectedClass.teacherid, 'type:', typeof selectedClass.teacherid);
      console.log('- Subject ID:', selectedCourse?.id, 'type:', typeof selectedCourse?.id);
      
      // Check if we have a valid subject ID
      if (!selectedCourse?.id) {
        setError('Please select a valid course/subject');
        setIsLoading(false);
        return;
      }
      
      // Create common record structure
      const newLessonRecord = {
        title: formData.title,
        subjectId: selectedCourse?.id || null, 
        start_time: startHour,
        start_minute: startMinute || 0,
        end_time: endHour,
        end_minute: endMinute || 0,
        day: Number(formData.day),
        location: formData.location,
        teacherId: selectedClass.teacherid ? String(selectedClass.teacherid) : null,
        color: courseColor,
        classId: selectedClass.id ? String(selectedClass.id) : null,
        day_date: calculateDateForDay(Number(formData.day))
      };
      
      // If editing, update the existing record
      if (isEditing && currentEventId !== null && !isNaN(Number(currentEventId))) {
        try {
          console.log('Trying to update lesson with ID:', currentEventId);
          
          // Get the event from our state to ensure we have all IDs
          const currentEvent = classEvents.find(ev => ev.id === currentEventId);
          if (!currentEvent) {
            console.error('Cannot find current event in state');
            setError('Error updating: Cannot find the lesson in the current view');
            setIsLoading(false);
            return;
          }
          
          console.log('Found current event to update:', currentEvent);
      
          // We'll try multiple ways to identify the record to update
          let updateSuccess = false;
          let updateError = null;
          
          // First attempt: Try direct update by id
          try {
            console.log('Attempt 1: Updating by numeric ID');
            const { error } = await supabase
        .from('timetable')
              .update(newLessonRecord)
              .eq('id', currentEventId);
              
            if (!error) {
              console.log('Successfully updated by numeric ID');
              updateSuccess = true;
            } else {
              updateError = error;
              console.log('Failed to update by numeric ID:', error);
            }
          } catch (e) {
            console.error('Error in first update attempt:', e);
          }
          
          // Second attempt: Try using subjectId
          if (!updateSuccess && currentEvent.subjectid) {
            try {
              console.log('Attempt 2: Updating by subjectId:', currentEvent.subjectid);
              const { error } = await supabase
                .from('timetable')
                .update(newLessonRecord)
                .eq('subjectId', currentEvent.subjectid);
                
              if (!error) {
                console.log('Successfully updated by subjectId');
                updateSuccess = true;
              } else {
                updateError = error;
                console.log('Failed to update by subjectId:', error);
              }
            } catch (e) {
              console.error('Error in second update attempt:', e);
            }
          }
          
          // Third attempt: Search for the record by properties and update
          if (!updateSuccess) {
            try {
              console.log('Attempt 3: Searching for record to update by properties');
              const { data: matchingRecords, error: searchError } = await supabase
                .from('timetable')
                .select('*')
                .eq('title', currentEvent.title)
                .eq('day', currentEvent.day);
                
              if (searchError) {
                console.error('Error searching for records:', searchError);
              } else if (matchingRecords && matchingRecords.length > 0) {
                console.log('Found matching records:', matchingRecords);
                
                // Try to update each matching record
                for (const record of matchingRecords) {
                  const { error } = await supabase
                    .from('timetable')
                    .update(newLessonRecord)
                    .eq('id', record.id);
                    
                  if (!error) {
                    console.log('Successfully updated matching record:', record.id);
                    updateSuccess = true;
                    break;
                  } else {
                    console.log('Failed to update matching record:', error);
                  }
                }
              } else {
                console.log('No matching records found by properties');
              }
            } catch (e) {
              console.error('Error in third update attempt:', e);
            }
          }
          
          // Last resort: Delete old record and create new one
          if (!updateSuccess) {
            console.log('All update attempts failed, trying delete + create approach');
            
            // First try to delete the old record in multiple ways
            let deleteSuccess = false;
            
            // Try by ID
            try {
              console.log('Attempting to delete old record by ID:', currentEventId);
              const { error } = await supabase
                .from('timetable')
                .delete()
                .eq('id', currentEventId);
                
              if (!error) {
                console.log('Successfully deleted old record by ID');
                deleteSuccess = true;
              } else {
                console.log('Failed to delete by ID:', error);
              }
            } catch (e) {
              console.error('Error deleting by ID:', e);
            }
            
            // Try by subjectId
            if (!deleteSuccess && currentEvent.subjectid) {
              try {
                console.log('Attempting to delete old record by subjectId:', currentEvent.subjectid);
                const { error } = await supabase
                  .from('timetable')
                  .delete()
                  .eq('subjectId', currentEvent.subjectid);
                  
                if (!error) {
                  console.log('Successfully deleted old record by subjectId');
                  deleteSuccess = true;
                } else {
                  console.log('Failed to delete by subjectId:', error);
                }
              } catch (e) {
                console.error('Error deleting by subjectId:', e);
              }
            }
            
            // Now create a new record
            console.log('Creating new record as replacement');
            const { data: newRecordData, error: createError } = await supabase
              .from('timetable')
              .insert(newLessonRecord)
        .select();
      
            if (createError) {
              console.error('Failed to create replacement record:', createError);
              setError('Could not update lesson: ' + createError.message);
              setIsLoading(false);
        return;
      }
      
            if (newRecordData && newRecordData.length > 0) {
              console.log('Successfully created replacement record:', newRecordData[0]);
              updateSuccess = true;
            }
          }
          
          if (!updateSuccess) {
            console.error('All update methods failed');
            setError('Failed to update lesson after multiple attempts' + 
                     (updateError ? ': ' + updateError.message : ''));
            setIsLoading(false);
            return;
          }
          
          // Update the UI state
          console.log('Update successful, updating UI');
          setClassEvents(prev => {
            return prev.map(event => {
              if (event.id === currentEventId) {
                // Store className in our local state but not in DB
                return {
                  ...event,
                  title: formData.title,
                  course: formData.course,
                  startTime: parseInt(formData.startTime.split(':')[0], 10),
                  startMinute: parseInt(formData.startTime.split(':')[1], 10),
                  endTime: parseInt(formData.endTime.split(':')[0], 10),
                  endMinute: parseInt(formData.endTime.split(':')[1], 10),
                  day: Number(formData.day),
                  location: formData.location,
                  classId: selectedClass.id,
                  className: selectedClass.name, // Keep for UI only
                  teacher: selectedClass.teacherid ? 'Teacher ID: ' + selectedClass.teacherid : '',
                  color: selectedCourse?.color || getRandomColor(formData.course)
                };
              }
              return event;
            });
          });
      
          // Set success message and refresh data
          setSuccessMessage('Lesson updated successfully!');
          setTimeout(() => setSuccessMessage(null), 5000);
          
          // Reset the form
          resetForm();
          
          // Refresh data from the server after a brief delay
          setTimeout(() => {
      fetchTimetableData();
          }, 1000);
          
          return;
        } catch (err) {
          console.error('Exception during update process:', err);
          setError('An unexpected error occurred during update: ' + String(err));
          setIsLoading(false);
          return;
        }
      }
      
      // If not editing, create a new record
      if (!isEditing) {
        try {
          console.log('Creating new lesson record:', newLessonRecord);
          
          // Create new record
          const createResult = await supabase
            .from('timetable')
            .insert(newLessonRecord)
            .select();
            
          if (createResult.error) {
            console.error('Error creating new lesson:', createResult.error);
            throw new Error(`Failed to create new lesson: ${createResult.error.message}`);
          }
          
          console.log('Successfully created new record:', createResult.data);
          
          // Explicitly type check the data
          if (createResult.data && Array.isArray(createResult.data) && createResult.data.length > 0) {
            // Now update local state with the new record data
            const newRecordData: any = createResult.data[0];
            
            // Base event with common properties
            const baseEventData = {
              title: formData.title,
              startTime: startHour,
              startMinute: startMinute || 0,
              endTime: endHour,
              endMinute: endMinute || 0,
              day: Number(formData.day),
              location: formData.location,
              color: courseColor,
              course: formData.course,
              className: selectedClass.name, // Store in our local state but not in DB
              teacher: selectedClass.teacherid ? 'Teacher ID: ' + selectedClass.teacherid : ''
            };
            
            // Create new event with the new database ID
            let newId: number; 
            if (typeof newRecordData.id === 'string') {
              try {
                newId = parseInt(newRecordData.id, 10);
              } catch (e) {
                console.error('Could not parse ID as number, using random ID');
                newId = Math.floor(Math.random() * 10000); // Fallback
              }
            } else if (typeof newRecordData.id === 'number') {
              newId = newRecordData.id;
            } else {
              newId = Math.floor(Math.random() * 10000); // Fallback
            }
            
            const newEvent: ClassEvent = {
              ...baseEventData,
              id: newId,
              // Use any available ID format
              subjectid: (newRecordData.subjectId || newRecordData.subject_id || selectedCourse?.id || '').toString(),
              teacherid: (newRecordData.teacherId || newRecordData.teacher_id || selectedClass?.teacherid || '').toString(),
              classId: (newRecordData.classId || newRecordData.class_id || selectedClass?.id || '').toString()
            };
            
            // Add the new event to the array
            setClassEvents(prev => [...prev, newEvent]);
            
            setSuccessMessage('Lesson scheduled successfully!');
            
            // Clear success message after 5 seconds
            setTimeout(() => {
              setSuccessMessage(null);
            }, 5000);
            
            resetForm();
          } else {
            // Fallback: refresh the data from the server
            console.log('No data returned from insert, refreshing data from server');
            await fetchTimetableData();
            setSuccessMessage('Lesson scheduled successfully!');
            resetForm();
          }
        } catch (err) {
          console.error('Exception during create process:', err);
          setError('An unexpected error occurred: ' + String(err));
        } finally {
          setIsLoading(false);
        }
        
        return; // Stop execution here
      }
    } catch (error: any) {
      console.error('Error in form submission:', error);
      setError('An unexpected error occurred: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle previous week with improved animation
  const handlePrevious = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSlideDirection('right');
    
    // First phase - animate out
    setTimeout(() => {
      // Second phase - update data
    const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
      
      // Third phase - animate in
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 250);
  };
  
  // Handle next week with improved animation
  const handleNext = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSlideDirection('left');
    
    // First phase - animate out
    setTimeout(() => {
      // Second phase - update data
    const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
      
      // Third phase - animate in  
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 250);
  };
  
  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  // Update current time indicator
    const updateCurrentTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
    if (currentHour >= 8 && currentHour < 17) {
      const hourOffset = currentHour - 8;
      const minuteOffset = currentMinute / 60;
      setCurrentTimePos((hourOffset + minuteOffset) * 80); // Multiplied by row height
    }
  };
  
  // Scroll to current time
  const scrollToCurrentTime = () => {
    if (timetableRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      
      if (currentHour >= 8 && currentHour < 17) {
        const hourOffset = currentHour - 8;
        timetableRef.current.scrollTop = hourOffset * 80 - 120; // Center it in the view
      }
    }
  };
  
  useEffect(() => {
    updateCurrentTime();
    const intervalId = setInterval(updateCurrentTime, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    scrollToCurrentTime();
  }, []);
  
  // Format date range for header
  const formatDateRange = () => {
    const startDate = formatDate(weekDays[0]);
    const endDate = formatDate(weekDays[6]);
    return `${startDate} - ${endDate}`;
  };

  // Form component sections for the modal
  const renderForm = () => (
    <Form onSubmit={handleSubmit}>
      <FormGroup>
        <Label htmlFor="assignedClass">Assign Class <span style={{ color: 'red' }}>*</span></Label>
        <Select 
          id="assignedClass" 
          name="assignedClass" 
          value={formData.assignedClass} 
          onChange={handleInputChange}
          required
        >
          <option value="">Select class</option>
          {isLoading ? (
            <option value="" disabled>Loading classes...</option>
          ) : classes.length > 0 ? (
            classes.map((classItem) => (
              <option key={classItem.id} value={classItem.name}>{classItem.name}</option>
            ))
          ) : (
            <option value="" disabled>No classes available</option>
          )}
        </Select>
      </FormGroup>
      
      {formData.assignedClass && (
        <>
          <FormGroup>
            <Label htmlFor="title">Lesson Title <span style={{ color: 'red' }}>*</span></Label>
            <Input 
              type="text" 
              id="title" 
              name="title" 
              value={formData.title} 
              onChange={handleInputChange}
              required 
              placeholder="Enter lesson title"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="course">Course <span style={{ color: 'red' }}>*</span></Label>
            <Select 
              id="course" 
              name="course" 
              value={formData.course} 
              onChange={handleInputChange}
              required
            >
              <option value="">Select course</option>
              {isLoading ? (
                <option value="" disabled>Loading courses...</option>
              ) : availableCourses.length > 0 ? (
                availableCourses.map((course) => {
                  // Make sure we're using the most reliable name property
                  const displayName = course.name || `Subject ${course.id}`;
                  return (
                    <option key={course.id} value={displayName}>{displayName}</option>
                  );
                })
              ) : (
                <option value="" disabled>No courses available for this class</option>
              )}
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="day">Day <span style={{ color: 'red' }}>*</span></Label>
            <Select 
              id="day" 
              name="day" 
              value={formData.day} 
              onChange={handleInputChange}
              required
            >
              <option value="0">Monday</option>
              <option value="1">Tuesday</option>
              <option value="2">Wednesday</option>
              <option value="3">Thursday</option>
              <option value="4">Friday</option>
              <option value="5">Saturday</option>
              <option value="6">Sunday</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="startTime">Start Time <span style={{ color: 'red' }}>*</span></Label>
            <Input 
              type="time" 
              id="startTime" 
              name="startTime" 
              value={formData.startTime} 
              onChange={handleInputChange}
              required 
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="endTime">End Time <span style={{ color: 'red' }}>*</span></Label>
            <Input 
              type="time" 
              id="endTime" 
              name="endTime" 
              value={formData.endTime} 
              onChange={handleInputChange}
              required 
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="location">Location</Label>
            <Input 
              type="text" 
              id="location" 
              name="location" 
              value={formData.location} 
              onChange={handleInputChange}
              placeholder="Enter location (e.g. Room 101)" 
            />
          </FormGroup>
        </>
      )}
      
      {/* Show form-specific errors only */}
      {error && error.includes('save') && (
        <div style={{ 
          color: '#ef4444', 
          marginBottom: '15px', 
          padding: '8px', 
          background: '#fef2f2', 
          borderRadius: '4px',
          border: '1px solid #fee2e2',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
      
      <ButtonGroup>
        <CancelButton type="button" onClick={resetForm}>
          Cancel
        </CancelButton>
        <SubmitButton type="submit" disabled={isLoading || !formData.assignedClass}>
          {isLoading ? 'Saving...' : 'Schedule Lesson'}
        </SubmitButton>
      </ButtonGroup>
    </Form>
  );

  // Add a refreshClasses method for manual refreshing
  const refreshClasses = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      
      // Simple query to get class data
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, classname, teacherid');
      
      if (classesError) {
        console.error('Error refreshing classes:', classesError);
        setError('Failed to refresh classes. Please try again later.');
        return;
      }
      
      if (classesData && classesData.length > 0) {
        console.log('Successfully refreshed classes data:', classesData);
        
        const formattedData = classesData.map(item => ({
          id: item.id,
          name: item.classname,
          teacherid: item.teacherid
        }));
        
        setClasses(formattedData);
        setError(null); // Clear error on success
      } else {
        console.log('No classes found during refresh');
        setClasses([]);
      }
    } catch (error) {
      console.error('Error in refreshClasses function:', error);
      setError('Failed to refresh classes. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit lesson
  const handleEditLesson = (event: ClassEvent) => {
    console.log('Editing lesson with ID:', event.id);
    console.log('Full event data:', event);
    
    // Store the ENTIRE event for reference in case we need it for the update
    localStorage.setItem('lastEditedLesson', JSON.stringify(event));
    
    // Try to find the class match based on either className or classId
    let classItem = classes.find(c => c.name === event.className);
    
    // If not found by name, try by ID
    if (!classItem && event.classId) {
      classItem = classes.find(c => c.id === event.classId);
    }
    
    console.log('Found class for this lesson:', classItem);
    
    // Convert numbers to padded strings
    const startHourStr = event.startTime.toString().padStart(2, '0');
    const startMinStr = (event.startMinute || 0).toString().padStart(2, '0');
    const endHourStr = event.endTime.toString().padStart(2, '0');
    const endMinStr = (event.endMinute || 0).toString().padStart(2, '0');
    
    // Set form data with event values
    setFormData({
      title: event.title,
      course: event.course || '',
      startTime: `${startHourStr}:${startMinStr}`,
      endTime: `${endHourStr}:${endMinStr}`,
      day: event.day,
      location: event.location || '',
      assignedClass: classItem?.name || event.className || ''
    });
    
    // Ensure the event id is a valid number
    let validEventId: number;
    if (typeof event.id === 'string') {
      // Try to parse it as a number
      const parsedId = parseInt(event.id, 10);
      if (isNaN(parsedId)) {
        console.error('Invalid event ID (string that cannot be parsed to number):', event.id);
        setError('Cannot edit: Invalid lesson ID format');
        return;
      }
      validEventId = parsedId;
    } else if (typeof event.id === 'number') {
      validEventId = event.id;
    } else {
      console.error('Invalid event ID (not a string or number):', event.id);
      setError('Cannot edit: Invalid lesson ID type');
      return;
    }
    
    // Set editing state - store all necessary data for update
    setIsEditing(true);
    setCurrentEventId(validEventId);
    setShowScheduleModal(true);
  };
  
  // Handle opening the delete confirmation modal
  const openDeleteConfirmation = (id: number) => {
    console.log('Opening delete confirmation for lesson ID:', id);
    // Ensure we have a valid numeric ID
    if (id === undefined || id === null) {
      console.error('Invalid lesson ID for deletion:', id);
      setError('Cannot delete: Invalid lesson ID');
      return;
    }
    
    // Store ID both ways to be extra safe
    window.lastDeletedEventId = id;
    setEventToDelete(id);
    setShowDeleteConfirm(true);
  };
  
  // Handle delete lesson
  const handleDeleteLesson = async () => {
    // Try to get the ID from multiple sources to ensure we have it
    let id = eventToDelete;
    
    // If state doesn't have it, try the window variable
    if (id === null && window.lastDeletedEventId) {
      id = window.lastDeletedEventId;
      console.log('Using backup ID from window:', id);
    }
    
    if (id === null || id === undefined || isNaN(Number(id))) {
      console.error('Invalid event ID found for deletion:', id);
      setError('Cannot delete: Invalid lesson ID');
      setShowDeleteConfirm(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Deleting lesson with ID:', id);
      
      // Find the full event object to get the proper database ID
      const eventToRemove = classEvents.find(event => event.id === id);
      
      if (!eventToRemove) {
        console.error('Could not find event with ID:', id);
        setError('Could not find the lesson to delete');
        return;
      }
      
      console.log('Found event to delete:', eventToRemove);
      
      // Try multiple deletion strategies
      let deleteSuccess = false;
      
      // Attempt 1: Try with the numeric ID
      try {
        const { error: error1 } = await supabase
          .from('timetable')
          .delete()
          .eq('id', id);
          
        if (!error1) {
          console.log('Successfully deleted with numeric ID');
          deleteSuccess = true;
        } else {
          console.log('First deletion attempt failed:', error1);
        }
      } catch (e) {
        console.error('Error in first deletion attempt:', e);
      }
      
      // Attempt 2: Try with the subjectid if it exists and first attempt failed
      if (!deleteSuccess && eventToRemove.subjectid) {
        try {
          const { error: error2 } = await supabase
            .from('timetable')
            .delete()
            .eq('subjectId', eventToRemove.subjectid);
            
          if (!error2) {
            console.log('Successfully deleted with subjectId');
            deleteSuccess = true;
          } else {
            console.log('Second deletion attempt failed:', error2);
          }
        } catch (e) {
          console.error('Error in second deletion attempt:', e);
        }
      }
      
      // Attempt 3: Last resort - try with string conversion of the ID
      if (!deleteSuccess) {
        try {
          const { error: error3 } = await supabase
            .from('timetable')
            .delete()
            .eq('id', String(id));
            
          if (!error3) {
            console.log('Successfully deleted with string ID');
            deleteSuccess = true;
          } else {
            console.log('Third deletion attempt failed:', error3);
            setError('Failed to delete lesson: ' + error3.message);
            return;
          }
        } catch (e) {
          console.error('Error in third deletion attempt:', e);
          setError('Failed to delete lesson after multiple attempts');
          return;
        }
      }
      
      if (!deleteSuccess) {
        setError('Failed to delete lesson after trying multiple methods');
        return;
      }
      
      console.log('Successfully deleted lesson from database');
      
      // Remove from local state
      setClassEvents(prev => {
        const updatedEvents = prev.filter(event => event.id !== id);
        console.log('Updated events after deletion:', updatedEvents);
        return updatedEvents;
      });
      
      setShowDeleteConfirm(false);
      setEventToDelete(null);
      window.lastDeletedEventId = undefined;
      
      // Show success message
      setSuccessMessage('Lesson deleted successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      // Force refresh data from database to ensure UI is in sync
      setTimeout(() => {
        fetchTimetableData();
      }, 1000);
      
    } catch (error: any) {
      console.error('Error in delete operation:', error);
      setError('An unexpected error occurred: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>Weekly Schedule</Title>
        <HeaderControls>
          <Button onClick={scrollToCurrentTime}>
            <FiArrowUp size={14} />
            Current Time
          </Button>
          <PrimaryButton onClick={() => setShowScheduleModal(true)}>
            <FiPlus size={14} />
            Schedule Lesson
          </PrimaryButton>
        </HeaderControls>
      </Header>
      
      <FilterContainer>
        <DateNavigation>
          <NavButton 
            onClick={handlePrevious} 
            disabled={isAnimating}
          >
            <FiChevronLeft />
          </NavButton>
          <AnimatedDateRange $isAnimating={isAnimating} $direction={slideDirection}>
            {formatDateRange()}
          </AnimatedDateRange>
          <NavButton 
            onClick={handleNext} 
            disabled={isAnimating}
          >
            <FiChevronRight />
          </NavButton>
        </DateNavigation>
        
        <FilterGroup>
              <FilterDropdown>
            <FilterButton onClick={() => setShowCourseFilter(!showCourseFilter)}>
              <FiFilter size={14} />
              {filterCourse || "All Courses"}
              <FiChevronDown size={14} />
            </FilterButton>
            {showCourseFilter && (
              <DropdownContent>
                <DropdownItem 
                  $isActive={filterCourse === null}
                  onClick={() => {
                    setFilterCourse(null);
                    setShowCourseFilter(false);
                  }}
                >
                  All Courses
                </DropdownItem>
                {uniqueCourses.map((course, index) => (
                  <DropdownItem 
                    key={index}
                    $isActive={filterCourse === course}
                    onClick={() => {
                      setFilterCourse(course);
                      setShowCourseFilter(false);
                    }}
                  >
                    {course}
                  </DropdownItem>
                ))}
              </DropdownContent>
            )}
          </FilterDropdown>

          <FilterDropdown>
            <FilterButton onClick={() => setShowClassFilter(!showClassFilter)}>
              <FiUsers size={14} />
              {filterClass || "All Grade Sections"}
              <FiChevronDown size={14} />
            </FilterButton>
            {showClassFilter && (
              <DropdownContent>
                <DropdownItem 
                  $isActive={filterClass === null}
                  onClick={() => {
                    setFilterClass(null);
                    setShowClassFilter(false);
                  }}
                >
                  All Grade Sections
                </DropdownItem>
                {isLoading ? (
                  <DropdownItem $isActive={false}>
                    Loading classes...
                  </DropdownItem>
                ) : uniqueClasses.length > 0 ? (
                  uniqueClasses.map((className, index) => (
                    <DropdownItem 
                      key={index}
                      $isActive={filterClass === className}
                      onClick={() => {
                        setFilterClass(className);
                        setShowClassFilter(false);
                      }}
                    >
                      {className}
                    </DropdownItem>
                  ))
                ) : (
                  <DropdownItem $isActive={false}>
                    No classes available
                  </DropdownItem>
                )}
              </DropdownContent>
            )}
          </FilterDropdown>
        </FilterGroup>
          </FilterContainer>
          
      {/* Display success message if there's one */}
      {successMessage && (
        <SuccessMessage>
          <div>✅ {successMessage}</div>
        </SuccessMessage>
      )}
          
      {/* Display error message if there's an error */}
      {error && (
        <div style={{ 
          color: '#ef4444', 
          marginBottom: '15px', 
          textAlign: 'center', 
          padding: '12px', 
          background: '#fef2f2', 
          borderRadius: '4px',
          border: '1px solid #fee2e2',
          fontWeight: '500',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ marginBottom: '5px' }}>⚠️ {error}</div>
          {error.includes('classes') && (
            <button 
              onClick={refreshClasses} 
              style={{
                padding: '6px 12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                marginTop: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Try Again
            </button>
          )}
        </div>
      )}
      
      <FadeIn>
      <TimetableContainer>
          {isLoading && (
            <LoadingOverlay>
              <LoadingSpinner />
              <div style={{ marginTop: '10px', color: '#3b82f6', fontWeight: 500 }}>Loading schedule...</div>
            </LoadingOverlay>
          )}
          
          <AnimatedContainer $isAnimating={isAnimating} $direction={slideDirection}>
        <TimetableHeader>
          <HeaderCell></HeaderCell>
          {weekDays.map((day, index) => {
            const dayName = formatDay(day);
            const monthName = day.toLocaleDateString('en-US', { month: 'short' });
            const dayNum = day.getDate();
            
            return (
              <HeaderCell key={index}>
                <DayHeader>
                  <DayName>{dayName}</DayName>
                  <DayDate>
                    {monthName} {dayNum}
                  </DayDate>
                </DayHeader>
              </HeaderCell>
            );
          })}
        </TimetableHeader>
        
        {/* Conditional Rendering: Show placeholder or timetable body */}
        {!filterClass && (
          <PlaceholderMessage>
            Select a Grade Section to view their schedule
          </PlaceholderMessage>
        )}
        
        {filterClass && (
          <TimetableBody ref={timetableRef}>
            <TimeColumn>
              {hours.map(hour => (
                  <TimeSlot key={hour}>
                  <TimeLabel>
                    <TimePart>{hour % 12 || 12}:00</TimePart>
                    <TimePart>{hour >= 12 ? 'PM' : 'AM'}</TimePart>
                  </TimeLabel>
                  </TimeSlot>
                ))}
            </TimeColumn>
            
            {weekDays.map((day, dayIndex) => (
              <DayColumn key={dayIndex} $isToday={isToday(day)}>
                {hours.map(hour => (
                  <HourRow key={hour} />
                ))}
                
                {/* Current time indicator */}
                {isToday(day) && (
                  <CurrentTimeIndicator style={{ top: `${currentTimePos}px` }} />
                )}
                
                {/* Class events */}
                {filteredEvents
                  .filter(event => event.day === dayIndex)
                  .map(event => {
                    const startMinute = event.startMinute || 0;
                    const endMinute = event.endMinute || 0;
                    
                    const top = ((event.startTime - 8) + (startMinute / 60)) * 80;
                    const height = ((event.endTime - event.startTime) * 60 - startMinute + endMinute) / 60 * 80;
                    
                    const startTimeFormatted = formatTime(event.startTime, startMinute);
                    const endTimeFormatted = formatTime(event.endTime, endMinute);
                    
                    return (
                      <ClassCard 
                        key={event.id}
                        $top={top}
                        $height={height}
                        $color={event.color}
                      >
                            <ActionButtons className="action-buttons">
                              <ActionButton 
                                title="Edit lesson"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click event
                                  handleEditLesson(event);
                                }}
                              >
                                <FiEdit size={14} />
                              </ActionButton>
                              <ActionButton 
                                className="delete-btn"
                                title="Delete lesson"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click event
                                  console.log('Delete button clicked for event:', event);
                                  console.log('Event ID to delete:', event.id, 'Type:', typeof event.id);
                                  
                                  // Get alternative identifiers in case ID is NaN
                                  const title = event.title || '';
                                  const startTime = event.startTime || 0;
                                  const day = event.day;
                                  
                                  // First check if we have a proper ID
                                  if (typeof event.id === 'number' && !isNaN(event.id)) {
                                    console.log('Using numeric ID for deletion:', event.id);
                                    openDeleteConfirmation(event.id);
                                    return;
                                  }
                                  
                                  console.log('Event ID is invalid, searching for matching event in state...');
                                  
                                  // Try to find a matching event in our classEvents array by properties
                                  const matchingEvents = classEvents.filter(e => 
                                    e.title === title && 
                                    e.startTime === startTime && 
                                    e.day === day
                                  );
                                  
                                  console.log('Found matching events:', matchingEvents);
                                  
                                  if (matchingEvents.length === 1) {
                                    // We found exactly one match, use its ID
                                    const matchId = matchingEvents[0].id;
                                    console.log('Found exactly one matching event, using ID:', matchId);
                                    
                                    if (typeof matchId === 'number' && !isNaN(matchId)) {
                                      openDeleteConfirmation(matchId);
                                    } else {
                                      setError('Cannot delete: Found event has invalid ID');
                                    }
                                  } else if (matchingEvents.length > 1) {
                                    // Multiple matches found, this is unusual but we'll use the first valid ID
                                    console.log('Found multiple matching events, using first valid ID');
                                    
                                    const validEvent = matchingEvents.find(e => typeof e.id === 'number' && !isNaN(e.id));
                                    
                                    if (validEvent) {
                                      openDeleteConfirmation(validEvent.id);
                                    } else {
                                      setError('Cannot delete: All matching events have invalid IDs');
                                    }
                                  } else {
                                    // No matches found, show an error
                                    console.error('No matching events found for deletion');
                                    setError('Cannot delete: No matching lesson found');
                                  }
                                }}
                              >
                                <FiX size={14} />
                              </ActionButton>
                            </ActionButtons>
                            
                        <ClassTitle>{event.title}</ClassTitle>
                        <ClassDetails>
                          <ClassIcon><FiClock size={12} /></ClassIcon>
                          {startTimeFormatted} - {endTimeFormatted}
                        </ClassDetails>
                        {event.location && (
                          <ClassDetails>
                            <ClassIcon><FiMapPin size={12} /></ClassIcon>
                            {event.location}
                          </ClassDetails>
                        )}
                            {event.className && (
                              <ClassDetails>
                                <ClassIcon><FiUsers size={12} /></ClassIcon>
                                Class: {event.className}
                          </ClassDetails>
                        )}
                        {event.teacher && (
                          <ClassDetails>
                            <ClassIcon><FiUser size={12} /></ClassIcon>
                                Teacher: {event.teacher}
                          </ClassDetails>
                        )}
                      </ClassCard>
                    );
                  })
                }
              </DayColumn>
            ))}
          </TimetableBody>
        )}
        {/* End Conditional Rendering */}
          </AnimatedContainer>
      </TimetableContainer>
      </FadeIn>
      
      {/* Schedule Lesson Modal */}
      {showScheduleModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>{isEditing ? 'Edit Lesson' : 'Schedule New Lesson'}</ModalTitle>
              <CloseButton onClick={resetForm}>
                <FiX size={20} />
              </CloseButton>
            </ModalHeader>
            
            {renderForm()}
          </ModalContent>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal>
          <ModalContent style={{ maxWidth: '400px' }}>
            <ModalHeader>
              <ModalTitle>Delete Lesson</ModalTitle>
              <CloseButton onClick={() => {
                setShowDeleteConfirm(false);
                setEventToDelete(null);
              }}>
                <FiX size={20} />
              </CloseButton>
            </ModalHeader>
            
            <div style={{ marginBottom: '20px' }}>
              Are you sure you want to delete this lesson? This action cannot be undone.
            </div>
            
            <ButtonGroup>
              <CancelButton onClick={() => {
                setShowDeleteConfirm(false);
                setEventToDelete(null);
              }}>
                Cancel
              </CancelButton>
              <SubmitButton 
                style={{ backgroundColor: '#ef4444', color: 'white' }}
                onClick={handleDeleteLesson}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Lesson'}
              </SubmitButton>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default Timetables; 