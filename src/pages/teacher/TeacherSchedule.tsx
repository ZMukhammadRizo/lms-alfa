import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiClock, FiFilter, FiChevronDown, 
  FiChevronLeft, FiChevronRight, FiArrowUp, FiUser,
  FiMapPin, FiUsers
} from 'react-icons/fi';
import supabase from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

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

const PlaceholderMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px; // Adjust height as needed
  font-size: 16px;
  color: #64748b;
  text-align: center;
  background-color: white;
  border-top: 1px solid #e2e8f0; // Add border to match grid structure
`;

const TeacherSchedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterCourse, setFilterCourse] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [showCourseFilter, setShowCourseFilter] = useState(false);
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [currentTimePos, setCurrentTimePos] = useState<number>(0);
  const [classEvents, setClassEvents] = useState<ClassEvent[]>([]);
  
  // Add state for animation
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Supabase data states
  const [allCourses, setAllCourses] = useState<CourseData[]>([]); // All courses/subjects
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]); // Relationships between classes and subjects
  const [availableCourses, setAvailableCourses] = useState<CourseData[]>([]); // Courses available for selected class
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Get user context
  
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

  // Fetch classes assigned to the current teacher
  useEffect(() => {
    const fetchTeacherClasses = async () => {
      if (!user?.id) {
        setError('Teacher ID not found. Please log in again.');
        setClasses([]);
        console.error("[Debug] User ID not available for fetching teacher classes.");
        return;
      }
      
      console.log(`[Debug] Fetching classes for teacher ID: ${user.id}`);

      try {
        setIsLoading(true);
        setError(null);
        
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('id, classname, teacherid') // Select necessary fields
          .eq('teacherid', user.id); // Filter by logged-in teacher's ID
        
        if (classesError) {
          console.error("[Debug] Supabase error fetching teacher classes:", classesError);
          throw classesError;
        }
        
        if (classesData) {
          const formattedData = classesData.map(item => ({
            id: item.id,
            name: item.classname,
            teacherid: item.teacherid
          }));
          console.log('[Debug] Formatted data from fetchTeacherClasses:', formattedData);
          setClasses(formattedData);
        } else {
          console.log('[Debug] No classes data returned from fetchTeacherClasses.');
          setClasses([]);
        }
      } catch (error: any) {
        console.error('[Debug] Error in fetchTeacherClasses catch block:', error);
        setError('Failed to load assigned classes: ' + error.message);
        setClasses([]); // Clear classes on error
      } finally {
        // Keep isLoading true until timetable data is also loaded if needed
        // setIsLoading(false); 
      }
    };
    
    fetchTeacherClasses();
  }, [user?.id]);

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
    if (!user?.id) {
        console.error("[Debug] Cannot fetch timetable, user ID not available.");
        setError('User not authenticated.');
        setIsLoading(false);
        return;
    }

    console.log(`[Debug] Fetching timetable for teacher ID: ${user.id}`);

    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      
      const { data: timetableData, error: timetableError } = await supabase
        .from('timetable')
        // Use the other foreign key hint: timetable_subjectId_fkey1
        .select('*, subjects!timetable_subjectId_fkey(*), classes(id, classname), users(firstName, lastName)') 
        .eq('teacherId', user.id); 
      
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
      
      const formattedEvents: ClassEvent[] = timetableData.map((item: any, index) => {
         let id = index + 1; 
         if (item.id !== undefined && item.id !== null) {
           const parsedId = parseInt(String(item.id));
           if (!isNaN(parsedId)) {
             id = parsedId;
           }
         }
         const title = item.title || 
                      (item.subjects?.subjectname ? `${item.subjects.subjectname} Class` : 'Untitled Lesson');
         let courseName = 'Unknown Course';
         if (item.subjects?.subjectname) {
           courseName = item.subjects.subjectname;
         } else if (item.subjectid) { 
           // Use the correct variable name 'allCourses' if that's what was used originally
           const subjectMatch = allCourses.find(c => c.id === item.subjectid); 
           if (subjectMatch) {
             courseName = subjectMatch.name;
           }
         }
         let startTime = 9; 
         // Keep original time parsing logic...
         if (item.start_time !== undefined && item.start_time !== null) {
            startTime = typeof item.start_time === 'string' ? parseInt(item.start_time.split(':')[0]) : item.start_time;
         } else if (item.startTime !== undefined && item.startTime !== null) {
            if (typeof item.startTime === 'string' && item.startTime.includes(':')) {
                startTime = parseInt(item.startTime.split(':')[0]);
            } else if (typeof item.startTime === 'number') {
                startTime = item.startTime;
            }
         } 
         // ... keep parsing for endTime, startMinute, endMinute, day, location, teacher, classId, className, students ...
          let endTime = startTime + 1;
         if (item.end_time !== undefined && item.end_time !== null) {
            endTime = typeof item.end_time === 'string' ? parseInt(item.end_time.split(':')[0]) : item.end_time;
         } else if (item.endTime !== undefined && item.endTime !== null) {
            if (typeof item.endTime === 'string' && item.endTime.includes(':')) {
                endTime = parseInt(item.endTime.split(':')[0]);
            } else if (typeof item.endTime === 'number') {
                endTime = item.endTime;
            }
         }
         const startMinute = item.start_minute || item.startMinute || (typeof item.startTime === 'string' && item.startTime.includes(':') ? parseInt(item.startTime.split(':')[1]) : 0);
         const endMinute = item.end_minute || item.endMinute || (typeof item.endTime === 'string' && item.endTime.includes(':') ? parseInt(item.endTime.split(':')[1]) : 0);
         let day = 0; 
         if (item.day !== undefined && item.day !== null) {
           day = item.day;
         } else if (item.dayOfWeek !== undefined && item.dayOfWeek !== null) {
           day = item.dayOfWeek; 
         }
         day = Number.isInteger(day) ? day % 7 : 0;
         const location = item.location || item.room || '';
         const teacher = item.teacher || 
                        (item.users ? `${item.users.firstName} ${item.users.lastName}` : '') ||
                        '';
         const classId = item.classid || item.classId || ''; 
         const className = item.classes?.classname || 'Unknown Class'; 
         const students = item.students || item.student_count || 0;
         const courseObj = allCourses.find(c => c.id === item.subjectid); 
         const color = item.color || 
                      courseObj?.color || 
                      getRandomColor(courseName); 

         return {
           id,
           title,
           subjectid: item.subjectid || '',
           startTime,
           startMinute,
           endTime,
           endMinute,
           day,
           location,
           teacherid: item.teacherid || '',
           students,
           color,
           course: courseName,
           teacher,
           classId,
           className
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
    console.log("[Debug] Classes state used for getUniqueClasses:", classes);
    console.log("[Debug] Class names extracted for dropdown:", classNames);

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
  console.log("[Debug] Final uniqueClasses array for dropdown:", uniqueClasses);
  
  // Filter events - update to correctly check for matching classes
  const filteredEvents = classEvents.filter(event => 
    (filterCourse ? (event.course || '') === filterCourse : true) && 
    (filterClass ? (
      event.className === filterClass || 
      classes.find(c => c.id === event.classId)?.name === filterClass
    ) : true)
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
  
  // Close modal and reset form (Unused, related to modal)
  /*
  const resetForm = () => {
    // setShowScheduleModal(false); // Usage removed
    // setIsEditing(false); // Usage removed
    // setCurrentEventId(null); // Usage removed
    setFormData({
      title: '',
      course: '',
      startTime: '09:00',
      endTime: '10:00',
      day: 0,
      location: '',
      assignedClass: ''
    });
    console.log('Form reset'); // Simplified log
  };
  */
  
  // Handle form submission (Unused)
  /*
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      // console.log('Form submission - isEditing:', isEditing); // Usage removed
      // console.log('Form submission - currentEventId:', currentEventId); // Usage removed
      
      // ... (rest of handleSubmit logic, referencing removed state)
      
    } catch (error: any) {
      console.error('Error in form submission:', error);
      setError('An unexpected error occurred: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };
  */

  // Handle edit lesson (Unused)
  /*
  const handleEditLesson = (event: ClassEvent) => {
     // ... (logic referencing removed state)
    
    // Set editing state - store all necessary data for update (Usages removed)
    // setIsEditing(true);
    // setCurrentEventId(validEventId);
    // setShowScheduleModal(true);
  };
  */
  
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

  return (
    <Container>
      <Header>
        <Title>Weekly Schedule</Title>
        <HeaderControls>
          <Button onClick={scrollToCurrentTime}>
            <FiArrowUp size={14} />
            Current Time
          </Button>
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
            {!filterClass ? (
              <PlaceholderMessage>
                Please select a grade to see their schedule
              </PlaceholderMessage>
            ) : (
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
    </Container>
  );
};

export default TeacherSchedule; 