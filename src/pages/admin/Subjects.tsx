import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiBook, FiEdit2, FiPlusCircle, FiX, FiChevronRight, FiChevronLeft, FiPlay, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import supabase, { supabaseAdmin } from '../../config/supabaseClient';
import { toast } from 'react-toastify';
import AssignSubjectModal from '../../components/AssignSubjectModal';

// Define type for level data
interface Level {
  id: string;
  name: string;
  [key: string]: any; // For any other properties
}

// Define type for subject data
interface Subject {
  id: string;
  subjectname: string;
  code: string;
  description: string;
  status: string;
  [key: string]: any; // For any other properties
}

// Define type for lesson data
interface Lesson {
  id: string;
  lessonname: string;
  description: string;
  uploadedat: string;
  videourl: string;
  subjectid: {
  id: string;
  name: string;
  };
  [key: string]: any; // For any other properties
}

// Utility functions for database operations
const fetchLevels = async () => {
  const { data, error } = await supabase
    .from('levels')
    .select('*');

  if (error) {
    throw error;
  }

  return { data, error };
};

const fetchSubjects = async () => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*');

  if (error) {
    throw error;
  }

  return { data, error };
};

const fetchLessons = async () => {
  console.log("Fetching lessons from Supabase...");

  try {
    // First try the nested select approach
    try {
  const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          lessonname,
          description,
          uploadedat,
          videourl,
          subjectid (id, name)
        `);

      console.log("Lessons fetch response (nested select):", { data, error });

      if (!error && data && data.length > 0) {
        return { data, error };
      }
    } catch (innerErr) {
      console.warn("Nested select failed, trying simple select:", innerErr);
    }

    // If nested select failed, try a simple select
    const { data, error } = await supabase
      .from('lessons')
      .select('id, lessonname, description, uploadedat, videourl, subjectid');

    console.log("Lessons fetch response (simple select):", { data, error });

  if (error) {
      console.error("Error fetching lessons:", error);
    throw error;
  }

    return { data: data || [], error };
  } catch (err) {
    console.error("Exception in fetchLessons:", err);
    throw err;
  }
};

const addSubject = async (subject: Omit<Subject, 'id'>) => {
  const { data, error } = await supabase
    .from('subjects')
    .insert([subject])
    .select();

  if (error) {
    throw error;
  }

  return { data, error };
};

const updateSubject = async (id: string, updates: Partial<Subject>) => {
  const { data, error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    throw error;
  }

  return { data, error };
};

// Add a new utility function for lesson operations
const addLesson = async (lesson: Omit<Lesson, 'id'>) => {
  const { data, error } = await supabase
    .from('lessons')
    .insert([lesson])
    .select();

  if (error) {
    throw error;
  }

  return { data, error };
};

// Styled Components
const SubjectsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[6]};
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${props => props.theme.spacing[4]};
  }
`;

const PageTitle = styled.h1`
  margin: 0;
  margin-bottom: ${props => props.theme.spacing[1]};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.8rem;
`;

const PageDescription = styled.p`
  margin: 0;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
`;

const AssignSubjectButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #059669;
  }

  & > svg {
    font-size: 18px;
  }
`;

const AddSubjectButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
  background-color: ${props => props.theme.colors.primary[600]};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[4]}`};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all ${props => props.theme.transition.fast};

  &:hover {
    background-color: ${props => props.theme.colors.primary[700]};
  }

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    justify-content: center;
  }
`;

// Class buttons container
const ClassButtonsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
  margin-bottom: 2.5rem;
  padding: 1rem;
  background: rgba(250, 250, 253, 0.7);
  border-radius: 1.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(240, 240, 250, 0.9);

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    gap: 0.75rem;
    justify-content: center;
    padding: 0.75rem;
  }
`;

// Class button with styled-components for active state
const ClassButton = styled.button<{ $isActive?: boolean }>`
  padding: 0.8rem 1.7rem;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 1.05rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: ${props => props.$isActive
    ? props.theme.colors.primary[600]
    : 'rgba(250, 250, 255, 0.95)'};
  color: ${props => props.$isActive ? 'white' : 'rgba(55, 65, 81, 1)'};
  border: none;
  cursor: pointer;
  box-shadow: ${props => props.$isActive
    ? '0 4px 14px rgba(79, 70, 229, 0.25)'
    : '0 2px 6px rgba(0, 0, 0, 0.06)'};
  position: relative;
  overflow: hidden;
  letter-spacing: 0.01em;
  min-width: 115px;

  &::before {
    content: '';
  position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom right,
      rgba(255, 255, 255, 0.1),
      rgba(255, 255, 255, 0)
    );
    z-index: 1;
    opacity: ${props => props.$isActive ? 1 : 0};
    transition: opacity 0.3s ease;
  }

  &:hover {
    background-color: ${props => props.$isActive
      ? props.theme.colors.primary[500]
      : 'rgba(245, 245, 255, 1)'};
    transform: translateY(-2px);
    box-shadow: ${props => props.$isActive
      ? '0 6px 20px rgba(79, 70, 229, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.08)'};
  }

  &:active {
    transform: translateY(0);
    box-shadow: ${props => props.$isActive
      ? '0 3px 10px rgba(79, 70, 229, 0.2)'
      : '0 1px 4px rgba(0, 0, 0, 0.05)'};
  }

  &:focus {
    outline: none;
    box-shadow: ${props => props.$isActive
      ? `0 0 0 2px white, 0 0 0 4px ${props.theme.colors.primary[300]}`
      : `0 0 0 2px white, 0 0 0 4px ${props.theme.colors.primary[200]}`};
  }

  @media (max-width: 640px) {
    font-size: 0.95rem;
    padding: 0.7rem 1.1rem;
    border-radius: 0.85rem;
    min-width: 100px;
  }
`;

// Loading state component
const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  font-size: 1rem;
  color: ${props => props.theme.colors.text.secondary};
`;

// Error message component
const ErrorMessage = styled.div`
  color: #e53e3e;
  padding: 1rem;
  background-color: #fff5f5;
  border-radius: 0.375rem;
  margin-top: 1rem;
`;

// Subject list styles
const SubjectsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const SubjectCard = styled.div`
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
`;

const SubjectName = styled.h3`
  margin: 0;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.25rem;
`;

const SubjectCode = styled.p`
  margin: 0;
  margin-bottom: 0.75rem;
  color: ${props => props.theme.colors.primary[600]};
  font-size: 0.875rem;
  font-weight: 600;
`;

const SubjectDescription = styled.p`
  margin: 0;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.875rem;
  line-height: 1.5;
`;

const SubjectFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
`;

const SubjectStatus = styled.span<{ $active?: boolean }>`
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => props.$active ? '#e6f7ed' : '#f9e9e9'};
  color: ${props => props.$active ? '#0c6b39' : '#b91c1c'};
`;

const SubjectActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #e5e7eb;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const DeleteButton = styled(EditButton)`
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;

  &:hover {
    background-color: #fecaca;
    transform: translateY(-1px);
  }
`;

// Modal styles
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  color: ${props => props.theme.colors.text.primary};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.colors.text.secondary};
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f3f4f6;
    color: #ef4444;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.875rem;
  font-weight: 500;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.primary};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[400]};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.primary};
  transition: all 0.2s ease;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[400]};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.primary};
  transition: all 0.2s ease;
  background-color: white;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[400]};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
  }
`;

const FormButton = styled.button`
  background-color: ${props => props.theme.colors.primary[600]};
  color: white;
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.primary[700]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FormButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const CancelButton = styled.button`
  background-color: white;
  color: ${props => props.theme.colors.text.primary};
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid #d1d5db;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const NoSubjectsMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme.colors.text.secondary};
`;

// Adding new styled component for the choose subject message
const ChooseSubjectMessage = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  background-color: #f9fafb;
  border-radius: 0.75rem;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
  border: 1px dashed #e5e7eb;
  margin-top: 1rem;
`;

// Adding new components for lessons
const LessonsContainer = styled.div`
  margin-top: 2rem;
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const LessonsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const LessonsTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  color: ${props => props.theme.colors.text.primary};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary[600]};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;

  &:hover {
    background-color: rgba(79, 70, 229, 0.05);
  }
`;

const LessonsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// Updating lesson components
const LessonItem = styled.div`
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  background-color: white;
  position: relative;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: ${props => props.theme.colors.primary[300]};
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
`;

const LessonTitle = styled.h3`
  margin: 0;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
  color: ${props => props.theme.colors.text.primary};
`;

const LessonDescription = styled.p`
  margin: 0;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.6;
  flex-grow: 1;
`;

const LessonDate = styled.span`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.tertiary || props.theme.colors.text.secondary};
  background-color: #f9fafb;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
`;

const WatchButton = styled.button<{ $hasVideo?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: ${props => props.$hasVideo
    ? props.theme.colors.primary[600]
    : '#6366f1'};
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;

  &:hover {
    background-color: ${props => props.$hasVideo
      ? props.theme.colors.primary[700]
      : '#4f46e5'};
    transform: translateY(-1px);
  }

  &:active {
      transform: translateY(0);
    }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LessonActionsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

// Add a styled button for adding lessons
const AddLessonButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
  background-color: ${props => props.theme.colors.primary[600]};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[4]}`};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all ${props => props.theme.transition.fast};
  margin-bottom: 1.5rem;

  &:hover {
    background-color: ${props => props.theme.colors.primary[700]};
  }
`;

// Define loadLessons function outside useEffect for reusability
const loadLessons = async (
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>,
  setFilteredLessons: React.Dispatch<React.SetStateAction<Lesson[]>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  selectedSubject: Subject | null // Pass selectedSubject to filter correctly
) => {
  try {
    setLoading(true);
    console.log("Loading lessons...");

    const { data, error } = await fetchLessons();

    if (error) {
      console.error("Error in loadLessons:", error);
      throw error;
    }

    // Log the raw data
    console.log("Raw lessons data:", data);

    if (data && data.length > 0) {
      console.log(`Successfully loaded ${data.length} lessons`);
      setLessons(data);

      // Filtering if a subject is selected
      if (selectedSubject) {
        console.log("Filtering lessons for selected subject:", selectedSubject.id);

        const filtered = data.filter(lesson => {
          // Handle both string and object cases for subjectid
          const subjectId = typeof lesson.subjectid === 'object'
                            ? lesson.subjectid?.id
                            : lesson.subjectid;
          // console.log("Lesson:", lesson.id, "subjectid raw:", lesson.subjectid, "extracted ID:", subjectId); // More detailed log if needed
          return subjectId === selectedSubject.id;
        });

        console.log(`Found ${filtered.length} lessons for subject ${selectedSubject.id}`);
        setFilteredLessons(filtered);
      } else {
        console.log("No subject selected, not filtering lessons");
        setFilteredLessons([]); // Clear filtered if no subject selected
      }
    } else {
      console.log("No lessons data returned or empty array");
      setLessons([]);
      setFilteredLessons([]);
    }

    setError(null);
  } catch (err: any) {
    console.error("Error loading lessons:", err);
    setError(err.message || "Failed to load lessons");
    setLessons([]);
    setFilteredLessons([]);
  } finally {
    setLoading(false);
  }
};

const Subjects: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [levels, setLevels] = useState<Level[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState<boolean>(false);
  const [lessonFormData, setLessonFormData] = useState({
    lessonname: '',
    description: '',
    videourl: ''
  });
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Omit<Subject, 'id'>>({
    subjectname: '',
    code: '',
    description: '',
    status: 'active'
  });

  // Add a new state for video upload modal
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [currentVideoLesson, setCurrentVideoLesson] = useState<Lesson | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');

  // State for managing current lesson for edit/delete
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLessonEditModalOpen, setIsLessonEditModalOpen] = useState<boolean>(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);

  // State for delete subject confirmation modal
  const [showDeleteSubjectModal, setShowDeleteSubjectModal] = useState<boolean>(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);

  // Fetch levels from Supabase
  useEffect(() => {
    const loadLevels = async () => {
      try {
        setLoading(true);
        const { data, error } = await fetchLevels();

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          // Sort levels by name (converted to number for proper sorting)
          const sortedLevels = [...data].sort((a, b) => Number(a.name) - Number(b.name));
          setLevels(sortedLevels);
        } else {
          // If no data is returned, use fallback values
          console.log("No levels data returned from Supabase, using fallback values");
          setLevels(Array.from({ length: 11 }, (_, i) => ({
            id: String(i+1),
            name: String(i+1)
          })));
        }
        setError(null);
      } catch (err: any) {
        console.error("Error fetching level data:", err);
        setError(err.message || "Failed to load class levels");
        // Use fallback values in case of error
        setLevels(Array.from({ length: 11 }, (_, i) => ({
          id: String(i+1),
          name: String(i+1)
        })));
      } finally {
        setLoading(false);
      }
    };

    loadLevels();
  }, []); // Empty dependency array ensures this only runs once on mount

  // Fetch subjects from Supabase
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true);
        const { data, error } = await fetchSubjects();

        if (error) {
          throw error;
        }

        if (data) {
          setSubjects(data);

          // Initial filtering if a level is already selected
          if (selectedLevel) {
            const classCode = selectedLevel.padStart(2, '0');
            const filtered = data.filter(subject => subject.code.endsWith(classCode));
            setFilteredSubjects(filtered);
          } else {
            setFilteredSubjects(data);
          }
        }

        setError(null);
      } catch (err: any) {
        console.error("Error fetching subject data:", err);
        setError(err.message || "Failed to load subjects");
        setSubjects([]);
        setFilteredSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []); // Empty dependency array ensures this only runs once on mount

  // Fetch lessons from Supabase
  useEffect(() => {
    // Call the standalone loadLessons function, passing the required state and setters
    loadLessons(setLessons, setFilteredLessons, setError, setLoading, selectedSubject);
  }, [selectedSubject]); // Re-run when selectedSubject changes

  // Handle level selection and filter subjects
  const handleLevelSelect = (level: string) => {
    if (selectedLevel === level) {
      setSelectedLevel(null);
      setFilteredSubjects(subjects);
    } else {
      setSelectedLevel(level);
      const classCode = level.padStart(2, '0');
      const filtered = subjects.filter(subject => subject.code.endsWith(classCode));
      setFilteredSubjects(filtered);
    }

    // Clear subject selection when changing level
    setSelectedSubject(null);
    setFilteredLessons([]);
  };

  // Handle subject selection and filter lessons
  const handleSubjectSelect = (subject: Subject) => {
    console.log("Subject selected:", subject.id, subject.subjectname);
    setSelectedSubject(subject);

    console.log("Total lessons available:", lessons.length);

    // Enhanced filtering with detailed logging
    const filtered = lessons.filter(lesson => {
      // Log each lesson for debugging
      console.log("Checking lesson:", lesson.id, "subjectid:", lesson.subjectid);

      // Check different possible formats of subjectid
      if (!lesson.subjectid) {
        console.log(`Lesson ${lesson.id} has no subjectid property`);
        return false;
      }

      // Case 1: subjectid is a string (direct ID value)
      if (typeof lesson.subjectid === 'string') {
        console.log(`Lesson ${lesson.id} has subjectid as string:`, lesson.subjectid);
        return lesson.subjectid === subject.id;
      }

      // Case 2: subjectid is an object with id property
      if (typeof lesson.subjectid === 'object' && lesson.subjectid !== null) {
        // Check if it has an id property
        if (lesson.subjectid.id) {
          const isMatch = lesson.subjectid.id === subject.id;
          console.log(`Lesson ${lesson.id} subject match by id: ${isMatch}`);
          return isMatch;
        }

        // Check if the object itself is the ID (sometimes Supabase returns like this)
        if (Object.keys(lesson.subjectid).length === 0) {
          const isMatch = JSON.stringify(lesson.subjectid) === subject.id;
          console.log(`Lesson ${lesson.id} subject match by object: ${isMatch}`);
          return isMatch;
        }
      }

      console.log(`Lesson ${lesson.id} has unrecognized subjectid format`);
      return false;
    });

    console.log(`Found ${filtered.length} lessons for subject ${subject.id}`);
    setFilteredLessons(filtered);
  };

  // Handle going back from lessons view to subjects view
  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setFilteredLessons([]);
  };

  // Handle opening the modal for creating a new subject
  const handleAddSubject = () => {
    setCurrentSubject(null);
    setFormData({
      subjectname: '',
      code: '',
      description: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  // Handle opening the modal for editing an existing subject
  const handleEditSubject = (subject: Subject) => {
    setCurrentSubject(subject);
    setFormData({
      subjectname: subject.subjectname,
      code: subject.code,
      description: subject.description,
      status: subject.status
    });
    setIsModalOpen(true);
  };

  // Placeholder for delete subject functionality
  const handleDeleteSubject = async (subjectId: string) => {
    setSubjectToDelete(subjectId);
    setShowDeleteSubjectModal(true);
  };

  // Function to handle the actual deletion after confirmation
  const confirmDeleteSubject = async () => {
    if (!subjectToDelete) return;

    try {
      setLoading(true);

      // 1. Check if the subject is referenced in the timetable
      console.log(`Checking direct subject timetable references for subject: ${subjectToDelete}`);
      const { data: timetableReferences, error: checkError } = await supabase
        .from('timetable')
        .select('id') // Select any column just to see if a row exists
        .limit(1)     // Only need to know if at least one exists
        .eq('subjectId', subjectToDelete);

      if (checkError) {
        console.error('Error checking direct subject timetable references:', checkError);
        throw new Error('Could not verify subject usage. Please try again.');
      }

      console.log(`Timetable reference check returned: ${timetableReferences ? timetableReferences.length : 0} results.`);

      if (timetableReferences && timetableReferences.length > 0) {
        // Subject is referenced, prevent deletion
        toast.error('Cannot delete subject: It is currently used in the timetable. Please remove it from the schedule first.');
        // Close the modal without deleting
        setShowDeleteSubjectModal(false);
        setSubjectToDelete(null);
        setLoading(false);
        return;
      }

      // Check 2: Check if associated classes are in the timetable
      console.log(`Checking associated classes for subject: ${subjectToDelete}`);
      const { data: associatedLinks, error: linkError } = await supabase
        .from('classsubjects')
        .select('classid')
        .eq('subjectid', subjectToDelete); // subjectid is likely correct here based on schema

      if (linkError) {
        console.error('Error fetching class-subject links:', linkError);
        throw new Error('Could not check class associations.');
      }

      if (associatedLinks && associatedLinks.length > 0) {
        const associatedClassIds = associatedLinks.map(link => link.classid).filter(id => id != null); // Get non-null class IDs
        console.log('Associated Class IDs:', associatedClassIds);

        if (associatedClassIds.length > 0) {
          const { data: classTimetableRefs, error: classCheckError } = await supabase
            .from('timetable')
            .select('id') // Check for any entry
            .in('classId', associatedClassIds) // Use classId (camelCase) as likely in timetable
            .limit(1); // We only need to know if at least one exists

          if (classCheckError) {
            console.error('Error checking class timetable references:', classCheckError);
            throw new Error('Could not check class timetable references.');
          }

          console.log(`Class timetable reference check returned: ${classTimetableRefs ? classTimetableRefs.length : 0} results.`);

          if (classTimetableRefs && classTimetableRefs.length > 0) {
            // An associated class is in the timetable, block subject deletion
            toast.error('Cannot delete subject: A class associated with this subject is still scheduled. Please remove related timetable entries first.');
            setShowDeleteSubjectModal(false);
            setSubjectToDelete(null);
            setLoading(false);
            return;
          }
        }
      }

      // 2. Proceed with deletion if no references found
      console.log("No timetable references found. Proceeding with deletion...");
      const { error: deleteError } = await supabase.from('subjects').delete().eq('id', subjectToDelete);

      if (deleteError) {
        // Handle potential errors during the actual delete (other than FK violation)
        throw deleteError;
      }

      // 3. Update state and notify user on successful deletion
      setSubjects(prev => prev.filter(s => s.id !== subjectToDelete));
      setFilteredSubjects(prev => prev.filter(s => s.id !== subjectToDelete));
      toast.success('Subject deleted successfully');

    } catch (err: any) {
      console.error('Error deleting subject:', err);
      toast.error(err.message || 'Failed to delete subject');
      setError(err.message || 'Failed to delete subject'); // Optionally set error state
    } finally {
      setLoading(false);
      // Close the modal and reset state (only if deletion wasn't stopped early)
      if (showDeleteSubjectModal) { // Check if modal is still technically open
        setShowDeleteSubjectModal(false);
        setSubjectToDelete(null);
      }
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (currentSubject) {
        // Update existing subject
        const { data, error } = await updateSubject(currentSubject.id, formData);

        if (error) {
          throw error;
        }

        // Update local state
        if (data && data[0]) {
          // Create a new updated subject with the returned data
          const updatedSubject = data[0];

          // Update both the main subjects array and filtered subjects array
          setSubjects(prev =>
            prev.map(subject => subject.id === currentSubject.id ? updatedSubject : subject)
          );

          // Update filtered subjects separately to ensure view is updated
          setFilteredSubjects(prev =>
            prev.map(subject => subject.id === currentSubject.id ? updatedSubject : subject)
          );

          // If the updated subject is the selected subject, update that too
          if (selectedSubject && selectedSubject.id === currentSubject.id) {
            setSelectedSubject(updatedSubject);
          }
        }
      } else {
        // Add new subject
        const { data, error } = await addSubject(formData);

        if (error) {
          throw error;
        }

        // Update local state
        if (data && data[0]) {
          const newSubject = data[0];

          // Update the main subjects array
          setSubjects(prev => [...prev, newSubject]);

          // Update filtered subjects if necessary
          if (selectedLevel) {
            const classCode = selectedLevel.padStart(2, '0');

            if (newSubject.code.endsWith(classCode)) {
              setFilteredSubjects(prev => [...prev, newSubject]);
            }
          } else {
            // If no level is selected, add to filtered subjects too
            setFilteredSubjects(prev => [...prev, newSubject]);
          }
        }
      }

      // Close modal
      setIsModalOpen(false);
      setCurrentSubject(null);
      setFormData({
        subjectname: '',
        code: '',
        description: '',
        status: 'active'
      });

    } catch (err: any) {
      console.error("Error submitting subject:", err);
      setError(err.message || "Failed to save subject");
    } finally {
      setLoading(false);
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Add a manual debugging function
  const debugLessonsData = () => {
    console.log("--- DEBUG: CURRENT LESSONS DATA ---");
    console.log("Total lessons:", lessons.length);
    console.log("Selected subject:", selectedSubject);
    console.log("Filtered lessons:", filteredLessons.length);

    // Analyze the structure of the data
    if (lessons.length > 0) {
      const firstLesson = lessons[0];
      console.log("First lesson structure:", firstLesson);
      console.log("subjectid type:", typeof firstLesson.subjectid);

      if (firstLesson.subjectid && typeof firstLesson.subjectid === 'object') {
        console.log("subjectid keys:", Object.keys(firstLesson.subjectid));
      }
    }

    // List all unique subjectid values
    const subjectIdTypes = new Set();
    const subjectIds = new Set();

    lessons.forEach(lesson => {
      subjectIdTypes.add(typeof lesson.subjectid);

      if (typeof lesson.subjectid === 'string') {
        subjectIds.add(lesson.subjectid);
      } else if (lesson.subjectid && lesson.subjectid.id) {
        subjectIds.add(lesson.subjectid.id);
      }
    });

    console.log("All subjectid types:", [...subjectIdTypes]);
    console.log("All unique subject IDs:", [...subjectIds]);
    console.log("--- END DEBUG ---");

    // Try to match lessons manually
    if (selectedSubject) {
      console.log("Manually checking for matches with subject ID:", selectedSubject.id);
      const manualMatches = lessons.filter(lesson => {
        let match = false;

        if (typeof lesson.subjectid === 'string' && lesson.subjectid === selectedSubject.id) {
          match = true;
        } else if (lesson.subjectid && lesson.subjectid.id === selectedSubject.id) {
          match = true;
        }

        if (match) {
          console.log("MATCH FOUND:", lesson);
        }

        return match;
      });

      console.log(`Manually found ${manualMatches.length} matching lessons`);
    }
  };

  // Handle opening the add lesson modal
  const handleAddLesson = () => {
    setLessonFormData({
      lessonname: '',
      description: '',
      videourl: ''
    });
    setIsLessonModalOpen(true);
  };

  // Handle lesson form input changes
  const handleLessonInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLessonFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle lesson form submission
  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubject) {
      setError("No subject selected. Cannot add lesson.");
      return;
    }

    try {
      setLoading(true);

      // First, fetch the current user to get a valid teacherid
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!userData || !userData.user || !userData.user.id) {
        throw new Error("Unable to determine current user. Please login again.");
      }

      // Prepare the lesson data with the selected subject ID and teacherid
      const newLessonData = {
        ...lessonFormData,
        subjectid: selectedSubject.id,
        uploadedat: new Date().toISOString(),
        teacherid: userData.user.id // Set a valid teacherid from the current user
      };

      console.log("Adding new lesson:", newLessonData);

      // Add the new lesson
      const { data, error } = await addLesson(newLessonData);

      if (error) {
        throw error;
      }

      console.log("Lesson added successfully:", data);

      if (data && data[0]) {
        // Update the lessons list with the new lesson
        const newLesson = data[0];
        setLessons(prev => [...prev, newLesson]);
        setFilteredLessons(prev => [...prev, newLesson]);
      }

      // Close the modal
      setIsLessonModalOpen(false);
      setLessonFormData({
        lessonname: '',
        description: '',
        videourl: ''
      });

      setError(null);
    } catch (err: any) {
      console.error("Error adding lesson:", err);
      setError(err.message || "Failed to add lesson");
    } finally {
      setLoading(false);
    }
  };

  // Navigate to the lesson detail page
  const handleWatchVideo = (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Navigating to lesson detail:", lesson.id);
    console.log("Lesson data being passed:", lesson);

    // Ensure videourl is not empty before navigating
    if (!lesson.videourl) {
      toast.error("This lesson doesn't have a video to watch");
      return;
    }

    // Navigate to the detail page with the lesson data
    navigate(`/admin/lessons/${lesson.id}`, {
      state: {
        lesson: {
          ...lesson,
          // Ensure all required fields are included and properly formatted
          id: lesson.id,
          lessonname: lesson.lessonname || 'Untitled Lesson',
          description: lesson.description || '',
          videourl: lesson.videourl || '',
          uploadedat: lesson.uploadedat || new Date().toISOString(),
          subjectid: typeof lesson.subjectid === 'object' ? lesson.subjectid : { id: lesson.subjectid }
        }
      }
    });
  };

  // Add a new function to handle the video upload button click
  const handleUploadVideo = (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentVideoLesson(lesson);
    setVideoUrl(''); // Reset video URL input
    setShowVideoModal(true);
  };

  // Add a new function to save the video URL to Supabase
  const handleSaveVideoUrl = async () => {
    if (!currentVideoLesson) return;

    try {
      setLoading(true);

      // Update the lesson in Supabase
      const { error } = await supabase
        .from('lessons')
        .update({ videourl: videoUrl })
        .eq('id', currentVideoLesson.id);

      if (error) throw error;

      // Update the lessons in state
      setLessons(prevLessons =>
        prevLessons.map(lesson =>
          lesson.id === currentVideoLesson.id
            ? { ...lesson, videourl: videoUrl }
            : lesson
        )
      );

      // Update filtered lessons
      setFilteredLessons(prevLessons =>
        prevLessons.map(lesson =>
          lesson.id === currentVideoLesson.id
            ? { ...lesson, videourl: videoUrl }
            : lesson
        )
      );

      setShowVideoModal(false);
      toast.success('Video URL saved successfully');
    } catch (error) {
      console.error('Error saving video URL:', error);
      toast.error('Failed to save video URL');
    } finally {
      setLoading(false);
    }
  };

  // Handle lesson edit
  const handleEditLesson = (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other click handlers
    setCurrentLesson(lesson);
    setLessonFormData({
      lessonname: lesson.lessonname || '',
      description: lesson.description || '',
      videourl: lesson.videourl || ''
    });
    setIsLessonEditModalOpen(true);
  };

  // Handle lesson edit form submission
  const handleLessonEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentLesson) {
      setError("No lesson selected for update.");
      return;
    }

    try {
      setLoading(true);

      // First, fetch the current user to get a valid teacherid
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!userData || !userData.user || !userData.user.id) {
        throw new Error("Unable to determine current user. Please login again.");
      }

      // Prepare the lesson data with the updated values - remove updated_at and updated_by fields
      const updatedLessonData = {
        ...lessonFormData,
        teacherid: userData.user.id // Keep teacher ID for tracking
      };

      console.log("Updating lesson:", updatedLessonData);

      // Update the lesson
      const { data, error } = await supabaseAdmin
        .from('lessons')
        .update(updatedLessonData)
        .eq('id', currentLesson.id)
        .select();

      if (error) {
        throw error;
      }

      console.log("Lesson updated successfully:", data);

      if (data && data[0]) {
        // Update the lessons lists with the updated lesson
        const updatedLesson = data[0];
        setLessons(prev =>
          prev.map(l => l.id === updatedLesson.id ? updatedLesson : l)
        );
        setFilteredLessons(prev =>
          prev.map(l => l.id === updatedLesson.id ? updatedLesson : l)
        );

        toast.success("Lesson updated successfully!");
      }

      // Close the modal
      setIsLessonEditModalOpen(false);
      setCurrentLesson(null);

    } catch (err: any) {
      console.error("Error updating lesson:", err);
      setError(err.message || "Failed to update lesson");
      toast.error("Failed to update lesson");
    } finally {
      setLoading(false);
    }
  };

  // Handle showing delete confirmation
  const handleShowDeleteConfirmation = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other click handlers
    setLessonToDelete(lessonId);
    setShowDeleteConfirmation(true);
  };

  // Handle lesson deletion
  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;

    setLoading(true);
    try {
      await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonToDelete);

      toast.success('Lesson deleted successfully');

      // Reload lessons by calling the standalone function
      await loadLessons(setLessons, setFilteredLessons, setError, setLoading, selectedSubject);

      // Close the modal
      setShowDeleteConfirmation(false);
      setLessonToDelete(null);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the assign subject modal
  const handleOpenAssignModal = () => {
    setShowAssignModal(true);
  };

  // Handle the actual assignment process
  const handleAssignSubjectToGrade = async (grade: string, subjectIds: string[]): Promise<boolean> => {
    setLoading(true); // Indicate loading start
    try {
      if (!subjectIds.length) {
        toast.error("No subjects selected for assignment");
        return false;
      }

      // 1. Fetch the level ID for the selected grade number
      const { data: levelData, error: levelError } = await supabase
        .from('levels')
        .select('id')
        .eq('name', grade) // Match the grade number in the 'name' column
        .single();

      if (levelError || !levelData) {
        console.error('Error fetching level ID for grade:', grade, levelError);
        toast.error(`Could not find level information for Grade ${grade}.`);
        return false;
      }
      const levelId = levelData.id;
      console.log(`Found level ID ${levelId} for Grade ${grade}`);

      // 2. Find all class sections for the fetched level ID
      // const pattern = `${grade}%`; // REMOVED incorrect pattern matching
      // console.log(`Searching for classes with pattern: ${pattern}`);

      const { data: sections, error: sectionsError } = await supabase
        .from('classes')
        .select('id, classname') // Only select necessary fields
        // .like('classname', pattern); // REMOVED incorrect like query
        .eq('level_id', levelId); // Use the correct level_id

      if (sectionsError) {
        console.error('Error fetching class sections:', sectionsError);
        toast.error('Failed to fetch class sections for the level');
        return false;
      }

      if (!sections || sections.length === 0) {
        toast.info(`No class sections found for Grade ${grade} (Level ID: ${levelId}). No subjects assigned.`);
        // Consider this a success in the sense that the operation completed without error
        // return false;
        return true; // Or true, depending on desired user feedback
      }

      console.log(`Found ${sections.length} sections for level ID ${levelId}:`, sections.map(s => s.classname));

      let successCount = 0;
      let errorCount = 0;
      let alreadyAssignedCount = 0;
      let totalRelationshipsAttempted = 0;

      // Process each subject ID
      for (const subjectId of subjectIds) {
        // For each section found for the correct level, create a relationship object
        const relationships = sections.map(section => ({
          classid: section.id,
          subjectid: subjectId,
        }));

        totalRelationshipsAttempted += relationships.length;

        // Upsert relationships for the current subject across all found sections
        // This is more efficient than checking each one individually
        const { error: upsertError, count: upsertCount } = await supabase
          .from('classsubjects')
          .upsert(relationships, {
            onConflict: 'classid,subjectid', // Specify conflict columns
            ignoreDuplicates: true // Important: prevents errors if relationship exists
          });

        if (upsertError) {
          console.error(`Error upserting relationships for subject ${subjectId}:`, upsertError);
          errorCount += relationships.length; // Assume all failed for this subject on error
        } else {
          // upsertCount is the number of rows inserted or updated.
          // If ignoreDuplicates=true, it only counts INSERTED rows.
          // If a relationship already existed, it's ignored and NOT counted.
          const insertedCount = upsertCount || 0;
          successCount += insertedCount;
          alreadyAssignedCount += (relationships.length - insertedCount);
          console.log(`Subject ${subjectId}: Inserted ${insertedCount}, Ignored ${relationships.length - insertedCount}`);
        }

        // Old logic removed for efficiency:
        // // Check for existing relationships to avoid duplicates
        // for (const rel of relationships) {
        //   // ... check logic ...
        //   // Insert the new relationship
        //   // ... insert logic ...
        // }
      }

      // const totalAttempted = successCount + errorCount + alreadyAssignedCount; // Incorrect calculation before

      console.log(`Assignment Summary: Total Attempted=${totalRelationshipsAttempted}, Success=${successCount}, Errors=${errorCount}, Already Existed/Ignored=${alreadyAssignedCount}`);

      if (errorCount > 0 && successCount > 0) {
        toast.warning(`Assigned ${successCount} new subject relationships with ${errorCount} errors. ${alreadyAssignedCount} were already present.`);
      } else if (errorCount > 0 && successCount === 0) {
        toast.error(`Failed to assign subjects. Encountered ${errorCount} errors.`);
      } else if (successCount === 0 && alreadyAssignedCount > 0) {
        toast.info(`All selected subjects were already assigned to Grade ${grade} sections.`);
      } else if (successCount > 0) {
        toast.success(`Successfully assigned subjects to ${successCount} section(s) of Grade ${grade}. ${alreadyAssignedCount} relationships already existed.`);
      } else {
        // This case might occur if no sections were found initially, or only errors occurred.
        // The specific messages above should cover most scenarios.
        toast.info("Subject assignment process completed.");
      }

      // Return true if there were no errors, or if some successes occurred despite errors
      return errorCount === 0 || successCount > 0;

    } catch (error) {
      console.error('Error assigning subjects to grade:', error);
      toast.error('An unexpected error occurred during subject assignment');
      return false;
    } finally {
      setLoading(false); // Indicate loading end
    }
  };

  return (
    <SubjectsContainer
      as={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader>
        <div>
          <PageTitle>{t('subjectManagement.title')}</PageTitle> 
          <PageDescription>{t('subjectManagement.description')}</PageDescription>
        </div>

        <ActionButtonsContainer>
          <AssignSubjectButton onClick={handleOpenAssignModal}>
            <FiBook />
            <span>{t('subjectManagement.assignToGrade')}</span>
          </AssignSubjectButton>
        <AddSubjectButton onClick={handleAddSubject}>
          <FiPlusCircle />
          <span>{t('subjectManagement.addNewSubject')}</span>
        </AddSubjectButton>
        </ActionButtonsContainer>
      </PageHeader>

      {/* Class level buttons */}
      <ClassButtonsContainer>
        {loading && !levels.length ? (
          <LoadingIndicator>{t('subjectManagement.loadingLevels')}</LoadingIndicator>
        ) : levels && levels.length > 0 ? (
          levels.map((level) => (
            <ClassButton
              key={level.id}
              $isActive={selectedLevel === level.name}
              onClick={() => handleLevelSelect(level.name)}
            >
              {level.name} {t('subjectManagement.class')}
            </ClassButton>
          ))
        ) : (
          // Fallback if levels are empty or there was an error
          Array.from({ length: 11 }, (_, i) => i + 1).map((level) => (
            <ClassButton
              key={level}
              $isActive={selectedLevel === String(level)}
              onClick={() => handleLevelSelect(String(level))}
            >
              {level} {t('subjectManagement.class')}
            </ClassButton>
          ))
        )}
      </ClassButtonsContainer>

      {/* Display error if there was a problem fetching data */}
      {error && (
        <ErrorMessage>
          Error: {error}
        </ErrorMessage>
      )}

      {/* Conditional rendering for subjects or lessons */}
      {selectedSubject ? (
        // Show lessons for the selected subject
        <LessonsContainer>
          <LessonsHeader>
            <LessonsTitle>{t('subjectManagement.lessonsFor', { subjectName: selectedSubject.subjectname })}</LessonsTitle>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <BackButton onClick={handleBackToSubjects}>
                <FiChevronLeft />
                {t('subjectManagement.backToSubjects')}
              </BackButton>
            </div>
          </LessonsHeader>

          {/* Add Lesson Button */}
          <AddLessonButton onClick={handleAddLesson}>
            <FiPlus />
            <span>{t('subjectManagement.addLesson')}</span>
          </AddLessonButton>

          {loading ? (
            <LoadingIndicator>{t('subjectManagement.loadingLessons')}</LoadingIndicator>
          ) : filteredLessons.length > 0 ? (
            <LessonsList>
              {filteredLessons.map(lesson => (
                <LessonItem key={lesson.id}>
                  <LessonDate>
                    {lesson.uploadedat ? formatDate(lesson.uploadedat) : t('subjectManagement.noDateAvailable')}
                  </LessonDate>
                  <LessonTitle>
                    {lesson.lessonname || t('subjectManagement.untitledLesson')}
                  </LessonTitle>
                  <LessonDescription>
                    {lesson.description || t('subjectManagement.noDescriptionAvailable')}
                  </LessonDescription>
                  <LessonActionsContainer>
                    <WatchButton
                      onClick={(e) => lesson.videourl
                        ? handleWatchVideo(lesson, e)
                        : handleUploadVideo(lesson, e)
                      }
                      $hasVideo={!!lesson.videourl}
                    >
                      <FiPlay />
                      {lesson.videourl ? t('subjectManagement.watchVideo') : t('subjectManagement.uploadVideo')}
                    </WatchButton>
                    <EditButton
                      onClick={(e) => handleEditLesson(lesson, e)}
                    >
                    <FiEdit2 />
                      {t('subjectManagement.edit')}
                    </EditButton>
                    <DeleteButton
                      onClick={(e) => handleShowDeleteConfirmation(lesson.id, e)}
                    >
                    <FiTrash2 />
                      {t('subjectManagement.delete')}
                    </DeleteButton>
                  </LessonActionsContainer>
                </LessonItem>
              ))}
            </LessonsList>
          ) : (
            <NoSubjectsMessage>
              {t('subjectManagement.noLessonsFound', { subjectName: selectedSubject.subjectname })}
              <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                {t('subjectManagement.clickAddLesson')}
              </div>
            </NoSubjectsMessage>
          )}
        </LessonsContainer>
      ) : (
        // Show subjects or choose subject message
        <>
          {/* Subjects list */}
          {loading && selectedLevel ? (
            <LoadingIndicator>{t('subjectManagement.loadingSubjects')}</LoadingIndicator>
          ) : selectedLevel ? (
            // Show subjects only if a class is selected
            filteredSubjects.length > 0 ? (
              <SubjectsList>
                {filteredSubjects.map(subject => (
                  <SubjectCard
                    key={subject.id}
                    onClick={() => handleSubjectSelect(subject)}
                    style={{ cursor: 'pointer' }}
                  >
                    <SubjectName>{subject.subjectname}</SubjectName>
                    <SubjectCode>{t('subjectManagement.code')}: {subject.code}</SubjectCode>
                    <SubjectDescription>{subject.description}</SubjectDescription>
                    <SubjectFooter>
                      <SubjectStatus $active={subject.status === 'active'}>
                        {subject.status === 'active' ? t('subjectManagement.active') : t('subjectManagement.inactive')}
                      </SubjectStatus>
                      <SubjectActions>
                      <EditButton
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the card click
                          handleEditSubject(subject);
                        }}
                      >
                        <FiEdit2 />
                      </EditButton>
                        <DeleteButton
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the card click
                            handleDeleteSubject(subject.id);
                          }}
                        >
                          <FiTrash2 />
                        </DeleteButton>
                      </SubjectActions>
                    </SubjectFooter>
                  </SubjectCard>
                ))}
              </SubjectsList>
            ) : (
              <NoSubjectsMessage>
                {t('subjectManagement.noSubjectsFound', { level: selectedLevel })}
              </NoSubjectsMessage>
            )
          ) : (
            // Show choose subject message when no class is selected
            <ChooseSubjectMessage>
              {t('subjectManagement.chooseSubject')}
            </ChooseSubjectMessage>
              )}
            </>
          )}

      {/* Subject Form Modal */}
      {isModalOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ModalContent
            initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
          >
            <ModalHeader>
              <ModalTitle>
                {currentSubject ? t('subjectManagement.editSubject') : t('subjectManagement.addNewSubject')}
              </ModalTitle>
              <CloseButton onClick={() => setIsModalOpen(false)}>
                <FiX size={20} />
              </CloseButton>
            </ModalHeader>

            <form onSubmit={handleSubmit}>
              <FormGroup>
                <FormLabel htmlFor="subjectname">{t('subjectManagement.subjectName')}</FormLabel>
                <FormInput
                  id="subjectname"
                  name="subjectname"
                  value={formData.subjectname}
                  onChange={handleInputChange}
                  placeholder={t('subjectManagement.enterSubjectName')}
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="code">{t('subjectManagement.code')}</FormLabel>
                <FormInput
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder={t('subjectManagement.enterCode')}
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="description">{t('subjectManagement.description')}</FormLabel>
                <FormTextarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t('subjectManagement.enterDescription')}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="status">{t('subjectManagement.status')}</FormLabel>
                <FormSelect
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="active">{t('subjectManagement.active')}</option>
                  <option value="inactive">{t('subjectManagement.inactive')}</option>
                </FormSelect>
              </FormGroup>

              <FormButtonContainer>
                <CancelButton type="button" onClick={() => setIsModalOpen(false)}>
                  {t('subjectManagement.cancel')}
                </CancelButton>
                <FormButton type="submit" disabled={loading}>
                  {currentSubject ? t('subjectManagement.updateSubject') : t('subjectManagement.addSubject')}
                </FormButton>
              </FormButtonContainer>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Lesson Form Modal for Adding New Lessons */}
      {isLessonModalOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ModalContent
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ModalHeader>
              <ModalTitle>
                {t('subjectManagement.addNewLesson')}
              </ModalTitle>
              <CloseButton onClick={() => setIsLessonModalOpen(false)}>
                <FiX size={20} />
              </CloseButton>
            </ModalHeader>

            <form onSubmit={handleLessonSubmit}>
              <FormGroup>
                <FormLabel htmlFor="lessonname">{t('subjectManagement.lessonName')}</FormLabel>
                <FormInput
                  id="lessonname"
                  name="lessonname"
                  value={lessonFormData.lessonname}
                  onChange={handleLessonInputChange}
                  placeholder={t('subjectManagement.enterLessonName')}
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="description">{t('subjectManagement.description')}</FormLabel>
                <FormTextarea
                  id="description"
                  name="description"
                  value={lessonFormData.description}
                  onChange={handleLessonInputChange}
                  placeholder={t('subjectManagement.enterLessonDescription')}
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="videourl">{t('subjectManagement.videoUrlOptional')}</FormLabel>
                <FormInput
                  id="videourl"
                  name="videourl"
                  value={lessonFormData.videourl}
                  onChange={handleLessonInputChange}
                  placeholder={t('subjectManagement.enterVideoUrl')}
                />
              </FormGroup>

              <FormButtonContainer>
                <CancelButton type="button" onClick={() => setIsLessonModalOpen(false)}>
                  {t('subjectManagement.cancel')}
                </CancelButton>
                <FormButton type="submit" disabled={loading}>
                  {t('subjectManagement.addLesson')}
                </FormButton>
              </FormButtonContainer>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Lesson Edit Modal */}
      {isLessonEditModalOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ModalContent
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ModalHeader>
              <ModalTitle>
                {t('subjectManagement.editLesson')}
              </ModalTitle>
              <CloseButton onClick={() => setIsLessonEditModalOpen(false)}>
                <FiX size={20} />
              </CloseButton>
            </ModalHeader>

            <form onSubmit={handleLessonEditSubmit}>
              <FormGroup>
                <FormLabel htmlFor="edit-lessonname">{t('subjectManagement.lessonName')}</FormLabel>
                <FormInput
                  id="edit-lessonname"
                  name="lessonname"
                  value={lessonFormData.lessonname}
                  onChange={handleLessonInputChange}
                  placeholder={t('subjectManagement.enterLessonName')}
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="edit-description">{t('subjectManagement.description')}</FormLabel>
                <FormTextarea
                  id="edit-description"
                  name="description"
                  value={lessonFormData.description}
                  onChange={handleLessonInputChange}
                  placeholder={t('subjectManagement.enterLessonDescription')}
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="edit-videourl">{t('subjectManagement.videoUrl')}</FormLabel>
                <FormInput
                  id="edit-videourl"
                  name="videourl"
                  value={lessonFormData.videourl}
                  onChange={handleLessonInputChange}
                  placeholder={t('subjectManagement.enterVideoUrl')}
                />
              </FormGroup>

              <FormButtonContainer>
                <CancelButton type="button" onClick={() => setIsLessonEditModalOpen(false)}>
                  {t('subjectManagement.cancel')}
                </CancelButton>
                <FormButton type="submit" disabled={loading}>
                  {t('subjectManagement.updateLesson')}
                </FormButton>
              </FormButtonContainer>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ModalContent
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '400px' }}
          >
            <ModalHeader>
              <ModalTitle>
                {t('subjectManagement.confirmDeletion')}
              </ModalTitle>
              <CloseButton onClick={() => setShowDeleteConfirmation(false)}>
                <FiX size={20} />
              </CloseButton>
            </ModalHeader>

            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <p style={{ marginBottom: '1.5rem' }}>
                {t('subjectManagement.deleteLessonConfirm')}
              </p>

              <FormButtonContainer>
                <CancelButton type="button" onClick={() => setShowDeleteConfirmation(false)}>
                  {t('subjectManagement.cancel')}
                </CancelButton>
                <DeleteButton
                  onClick={handleDeleteLesson}
                  style={{ width: 'auto' }}
                  disabled={loading}
                >
                  <FiTrash2 />
                  {t('subjectManagement.yesDelete')}
                </DeleteButton>
              </FormButtonContainer>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Video URL Modal */}
      {showVideoModal && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ModalContent
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ModalHeader>
              <ModalTitle>
                {t('subjectManagement.addVideoUrl')}
              </ModalTitle>
              <CloseButton onClick={() => setShowVideoModal(false)}>
                <FiX size={20} />
              </CloseButton>
            </ModalHeader>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveVideoUrl();
            }}>
              <FormGroup>
                <FormLabel htmlFor="videourl">{t('subjectManagement.videoUrl')}</FormLabel>
                <FormInput
                  id="videourl"
                  name="videourl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder={t('subjectManagement.enterYouTubeUrl')}
                  required
                />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                  {t('subjectManagement.supportedFormats')}
                </div>
              </FormGroup>

              <FormButtonContainer>
                <CancelButton type="button" onClick={() => setShowVideoModal(false)}>
                  {t('subjectManagement.cancel')}
                </CancelButton>
                <FormButton type="submit" disabled={loading || !videoUrl.trim()}>
                  {t('subjectManagement.saveVideoUrl')}
                </FormButton>
              </FormButtonContainer>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Assign Subject Modal */}
      <AssignSubjectModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignSubjectToGrade}
      />

      {/* Delete Subject Confirmation Modal */}
      {showDeleteSubjectModal && (
        <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ModalContent
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '450px' }}
          >
            <ModalHeader>
              <ModalTitle>{t('subjectManagement.confirmSubjectDeletion')}</ModalTitle>
              <CloseButton onClick={() => setShowDeleteSubjectModal(false)}>
                <FiX size={20} />
              </CloseButton>
            </ModalHeader>
            <div style={{ padding: '1rem 0.5rem' }}>
              <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                {t('subjectManagement.deleteSubjectConfirm')}
                <br />
                <strong>{t('subjectManagement.deleteSubjectWarning')}</strong>
              </p>
              <FormButtonContainer>
                <CancelButton
                  type="button"
                  onClick={() => {
                    setShowDeleteSubjectModal(false);
                    setSubjectToDelete(null);
                  }}
                >
                  {t('subjectManagement.cancel')}
                </CancelButton>
                <DeleteButton
                  onClick={confirmDeleteSubject}
                  style={{ width: 'auto' }} // Adjust width if needed
                  disabled={loading} // Disable if loading state is active
                >
                  <FiTrash2 />
                  {t('subjectManagement.yesDeleteSubject')}
                </DeleteButton>
              </FormButtonContainer>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

    </SubjectsContainer>
  );
};

export default Subjects;