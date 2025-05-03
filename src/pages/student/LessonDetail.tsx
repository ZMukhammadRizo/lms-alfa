import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion, wrap, px, color } from 'framer-motion';
import { 
  FiArrowLeft, FiBook, FiCalendar, FiFileText, 
  FiVideo, FiDownload, FiX, FiClock, FiFile, FiAlertCircle
} from 'react-icons/fi';
import supabase from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

// Interface definitions (copied from CourseDetail for now, might need adjustment)
interface Material {
  id: string;
  name: string;
  type: string;
  url: string;
}

interface Lesson {
  id: string;
  lessonname: string;
  description: string | null;
  videourl: string | null;
  uploadedat: string;
  materials: Material[];
  fileurls: string[] | string | null; // Add fileurls property with possible types
  subjectid: string; // Added subjectid to link back
  subjects: { // To get subject name for breadcrumb/title
      subjectname: string;
  } | null;
}

// Styled Components
const PageContainer = styled.div`
  max-width: 900px; /* Adjusted max-width for lesson content */
  margin: 0 auto;
  padding: 24px;
`;

const CenteredContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
  text-align: center;
  
  h2 {
    margin: 16px 0 8px;
  }
  
  p {
    color: ${props => props.theme.colors.text.secondary};
    margin-bottom: 24px;
  }
`;

const BackButton = styled(Link)`
  display: inline-flex; /* Changed to inline-flex */
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 16px;
  text-decoration: none;
  padding: 8px 12px; /* Added padding */
  border-radius: 8px; /* Added border-radius */
  transition: background-color 0.2s ease; /* Added transition */
  
  &:hover {
    color: ${props => props.theme.colors.primary[500]};
    background-color: ${props => props.theme.colors.background.hover}; /* Added hover effect */
  }
`;

const Breadcrumb = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 24px;
  
  span {
    margin: 0 4px;
  }
`;

const BreadcrumbLink = styled(Link)`
 color: ${props => props.theme.colors.text.secondary};
 text-decoration: none;
 &:hover {
   color: ${props => props.theme.colors.primary[500]};
   text-decoration: underline;
 }
`;

const LessonHeader = styled.div`
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};

  h1 {
    margin: 0 0 8px;
    font-size: 28px; /* Larger title for lesson */
    color: ${props => props.theme.colors.text.primary};
  }
`;

const LessonDate = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 14px;
`;

const Description = styled.p`
 font-size: 16px; /* Slightly larger description */
 line-height: 1.7;
 color: ${props => props.theme.colors.text.primary};
 margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 20px; /* Slightly larger section title */
  margin: 32px 0 16px;
  color: ${props => props.theme.colors.text.primary};
  padding-bottom: 8px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
`;

const VideoContainer = styled.div`
  position: relative;
  padding-bottom: 56.25%; // 16:9 aspect ratio
  height: 0;
  margin: 24px 0 32px; /* Added margin bottom */
  
  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Added subtle shadow */
  }
`;

const MaterialsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
`;

const MaterialItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: ${props => props.theme.colors.background.light};
  border-radius: 8px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  min-width: 40px; /* Ensure icon wrapper maintains size */
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background.light}; /* Changed background */
  color: ${props => props.theme.colors.text.secondary};
`;

const MaterialName = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary}; /* Ensure text color */
  word-break: break-word; /* Allow long names to wrap */
`;

const MaterialType = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 12px;
  text-transform: uppercase; /* Added uppercase */
  margin-top: 2px; /* Added margin */
`;

const DownloadButton = styled.button`
  width: 36px;
  height: 36px;
  min-width: 36px; /* Ensure button maintains size */
  border-radius: 8px;
  background: ${props => props.theme.colors.primary[500]};
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: auto;
  transition: background-color 0.2s ease; /* Added transition */
  
  &:hover {
    background: ${props => props.theme.colors.primary[600]};
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${props => props.theme.colors.background.light};
  border-top: 3px solid ${props => props.theme.colors.primary[500]};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background-color: ${props => props.theme.colors.danger[50]};
  color: ${props => props.theme.colors.danger[500]};
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 500;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
`;

const BackToLessonsButton = styled(Link)`
  display: inline-flex;
  align-items: center;  
  gap: 8px;
  font-size: 14px;
  color: ${props => props.theme.colors.primary[500]};
  margin-bottom: 16px;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
`;

// Helper function to parse file URLs into materials
const parseFileUrls = (fileUrls: string[] | null): Material[] => {
  if (!fileUrls) return [];
  
  if (!Array.isArray(fileUrls)) {
    // Try to parse if it's a JSON string
    try {
      if (typeof fileUrls === 'string') {
        const parsed = JSON.parse(fileUrls);
        if (Array.isArray(parsed)) {
          fileUrls = parsed;
        } else {
          return [];
        }
      } else {
        return [];
      }
    } catch (e) {
      console.error('Failed to parse fileUrls:', e);
      return [];
    }
  }
  
  return fileUrls.map((url, index) => {
    const fileName = url.split('/').pop() || `File ${index + 1}`;
    const fileType = getFileTypeFromUrl(url);
    
    return {
      id: `file-${index}`,
      name: fileName,
      type: fileType,
      url: url
    };
  });
};

// Helper function to determine file type from URL
const getFileTypeFromUrl = (url: string): string => {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  
  if (['mp4', 'webm', 'mov'].includes(extension)) return 'video';
  if (['pdf'].includes(extension)) return 'pdf';
  if (['doc', 'docx'].includes(extension)) return 'document';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';
  
  return 'other';
};

// Helper function to render the appropriate icon for a material type
const getMaterialIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'video':
      return <FiVideo />;
    case 'pdf':
    case 'document':
    case 'image':
    default:
      return <FiFileText />;
  }
};

// Add the getEmbedUrl function before the LessonDetail component
const getEmbedUrl = (url: string | null): string => {
  if (!url) return '';
  
  // If it's already an embed URL, return it
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  // Convert youtube.com/watch?v=VIDEO_ID to youtube.com/embed/VIDEO_ID
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // Convert youtu.be/VIDEO_ID to youtube.com/embed/VIDEO_ID
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // If it's not a recognizable YouTube URL, return as is
  return url;
};

const LessonDetail: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const location = useLocation();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Extract lesson ID and state
  const extractedLessonId = lessonId || location.pathname.split('/').pop();
  const locationState = location.state as { lessonData?: any } | null;
  const stateLessonId = locationState?.lessonData?.id;

  useEffect(() => {
    // If we have lesson data in the state, use it directly
    if (locationState?.lessonData) {
      const stateLesson = locationState.lessonData;
      
      // We still need to fetch the subject name and file URLs
      const fetchAdditionalData = async () => {
        try {
          setIsLoading(true);
          
          // Fetch subject info
          const { data: subjectData, error: subjectError } = await supabase
            .from('subjects')
            .select('subjectname')
            .eq('id', stateLesson.subjectid)
            .single();
            
          if (subjectError) {
            console.error('Error fetching subject:', subjectError);
          }
          
          // Format lesson from state with subjects info
          const formattedLesson: Lesson = {
            ...stateLesson,
            materials: stateLesson.fileurls ? parseFileUrls(stateLesson.fileurls) : [],
            subjects: subjectData ? { subjectname: subjectData.subjectname } : null
          };
          
          setLesson(formattedLesson);
          setIsLoading(false);
        } catch (error) {
          console.error('Error in fetchAdditionalData:', error);
          setError(error instanceof Error ? error.message : 'An unknown error occurred');
          setIsLoading(false);
        }
      };
      
      fetchAdditionalData();
      return;
    }
    
    const fetchLessonDetails = async () => {
      // Use the extracted ID as a fallback or ID from state
      const effectiveLessonId = lessonId || stateLessonId || extractedLessonId;
      
      if (!effectiveLessonId || effectiveLessonId === 'lesson') {
        setError('Missing lesson ID');
        setIsLoading(false);
        toast.error('No lesson ID provided');
        return;
      }

      if (!user) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch the lesson details, including subject name for context
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*, subjects(subjectname)') // Fetch subject name
          .eq('id', effectiveLessonId)
          .single();

        if (lessonError) {
          console.error('Error fetching lesson:', lessonError);
          throw new Error('Failed to fetch lesson details');
        }

        if (!lessonData) {
          throw new Error('Lesson not found');
        }
        
        // Format the lesson data
        const formattedLesson: Lesson = {
          ...lessonData,
          materials: lessonData.fileurls ? parseFileUrls(lessonData.fileurls) : [],
          subjects: lessonData.subjects // Assign the fetched subject data
        };
        
        setLesson(formattedLesson);
        setIsLoading(false);

      } catch (error) {
        console.error('Error in fetchLessonDetails:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setIsLoading(false);
        toast.error('Failed to load lesson details');
      }
    };

    fetchLessonDetails();
  }, [lessonId, extractedLessonId, stateLessonId, locationState, user, navigate, location]);

  // Render loading state
  if (isLoading) {
    return (
      <CenteredContainer>
        <Spinner />
        <p>Loading lesson details...</p>
      </CenteredContainer>
    );
  }

  // Render error state
  if (error || !lesson) {
    return (
      <CenteredContainer>
        <IconWrapper><FiX size={40} /></IconWrapper>
        <h2>Failed to Load Lesson</h2>
        {error && (
          <ErrorMessage>
            Error: {error}
          </ErrorMessage>
        )}
        <p>The lesson you're trying to view could not be loaded. Please try again or go back to your courses.</p>
        <ButtonsContainer>
          <BackButton to="/student/courses">
            <FiArrowLeft />
            Back to Courses
          </BackButton>
          {lesson?.subjectid && (
            <BackButton to={`/student/course/${lesson.subjectid}`}>
              <FiArrowLeft />
              Back to Course
            </BackButton>
          )}
        </ButtonsContainer>
      </CenteredContainer>
    );
  }

  return (
    <PageContainer
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <BackToLessonsButton to={`/student/course/${lesson.subjectid}`}>
        <FiArrowLeft />
        Back to Lessons
      </BackToLessonsButton>

      <Breadcrumb>
        <BreadcrumbLink to={`/student/course/${lesson.subjectid}`}>
          {lesson.subjects?.subjectname || 'Course'} 
        </BreadcrumbLink>
        <span> / </span>
        <span>{lesson.lessonname}</span>
      </Breadcrumb>

      <LessonHeader>
        <h1>{lesson.lessonname}</h1>
        <LessonDate>
          <FiCalendar />
          <span>{new Date(lesson.uploadedat).toLocaleDateString()}</span>
        </LessonDate>
      </LessonHeader>
      
      {lesson.description && (
        <Description>{lesson.description}</Description>
      )}
      
      {lesson.videourl && (
        <VideoContainer>
          <iframe 
            src={getEmbedUrl(lesson.videourl)} 
            title={lesson.lessonname}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </VideoContainer>
      )}
      
      {lesson.materials.length > 0 && (
        <div>
          <SectionTitle>Materials</SectionTitle>
          <MaterialsList>
            {lesson.materials.map((material, index) => (
              <MaterialItem key={`${lesson.id}-material-${index}`}>
                <IconWrapper>
                  {getMaterialIcon(material.type)}
                </IconWrapper>
                <div>
                  <MaterialName>{material.name}</MaterialName>
                  <MaterialType>{material.type}</MaterialType>
                </div>
                <DownloadButton as="a" href={material.url} target="_blank" download>
                  <FiDownload />
                </DownloadButton>
              </MaterialItem>
            ))}
          </MaterialsList>
        </div>
      )}

      {!lesson.fileurls && !lesson.videourl && !lesson.description && (
        <CenteredContainer>
          <IconWrapper><FiBook size={40} /></IconWrapper>
          <h2>No Content Available</h2>
          <p>This lesson currently has no description, video, or materials.</p>
        </CenteredContainer>
      )}
    </PageContainer>
  );
};

export default LessonDetail; 