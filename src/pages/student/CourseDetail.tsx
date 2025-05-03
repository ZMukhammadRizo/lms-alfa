import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiArrowLeft, FiBook, FiCalendar, FiFileText, 
  FiUser, FiVideo, FiDownload, FiInfo, FiX, FiChevronRight 
} from 'react-icons/fi';
import supabase from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

// Interface definitions
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
  uploadedat: string;
  subjectid: string;
  fileurls?: string[] | string | null;
  videourl?: string | null;
}

interface Subject {
  id: string;
  subjectname: string;
  code: string | null;
  description: string | null;
  status: string;
  createdat: string;
  teacher?: {
    firstName: string;
    lastName: string;
  } | null;
}

// TODO: Move these helpers to a shared util file if needed elsewhere
const parseFileUrls = (fileUrls: any): Material[] => {
  if (!fileUrls) return [];
  let urlsToParse = fileUrls;
  if (typeof fileUrls === 'string') {
    try {
      urlsToParse = JSON.parse(fileUrls);
    } catch (e) {
      console.error("Failed to parse fileUrls string:", e);
      return [];
    }
  }
  if (!Array.isArray(urlsToParse)) {
    console.error("fileUrls is not an array after potential parsing:", urlsToParse);
    return [];
  }
  return urlsToParse.map((url, index) => {
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

const getFileTypeFromUrl = (url: string): string => {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  if (['mp4', 'webm', 'mov'].includes(extension)) return 'video';
  if (['pdf'].includes(extension)) return 'pdf';
  if (['doc', 'docx'].includes(extension)) return 'document';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';
  return 'other';
};

const getMaterialIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'video': return <FiVideo />;
    case 'pdf': case 'document': case 'image': default: return <FiFileText />;
  }
};

// Lesson Modal Component
interface LessonModalProps {
  lesson: Lesson;
  onClose: () => void;
}

// Add a function to convert YouTube URLs to embed URLs
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

const LessonModal: React.FC<LessonModalProps> = ({ lesson, onClose }) => {
  // Parse materials if needed
  const materials = lesson.fileurls ? parseFileUrls(lesson.fileurls) : [];

  useEffect(() => {
    // Optional: Add logic to disable body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()} as={motion.div} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}>
        <ModalHeader>
          <h2>{lesson.lessonname}</h2>
          <CloseButton onClick={onClose}><FiX /></CloseButton>
        </ModalHeader>
        <ModalBody>
          {lesson.description && (
            <ModalSection>
              <h3>Description</h3>
              <p>{lesson.description}</p>
            </ModalSection>
          )}
          {lesson.videourl && (
            <ModalSection>
              <h3>Video</h3>
              <ModalVideoContainer>
                <iframe 
                  src={getEmbedUrl(lesson.videourl)} 
                  title={lesson.lessonname}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </ModalVideoContainer>
            </ModalSection>
          )}
          {materials.length > 0 && (
            <ModalSection>
              <h3>Materials</h3>
              <ModalMaterialsList>
                {materials.map((material, index) => (
                  <MaterialItem key={`modal-material-${index}`}>
                    <IconWrapper>{getMaterialIcon(material.type)}</IconWrapper>
                    <div>
                      <MaterialName>{material.name}</MaterialName>
                      <MaterialType>{material.type}</MaterialType>
                    </div>
                    <DownloadButton as="a" href={material.url} target="_blank" download>
                      <FiDownload />
                    </DownloadButton>
                  </MaterialItem>
                ))}
              </ModalMaterialsList>
            </ModalSection>
          )}
          {materials.length === 0 && !lesson.videourl && !lesson.description && (
            <CenteredContainer style={{ padding: '32px 0' }}>
              <IconWrapper><FiBook size={40} /></IconWrapper>
              <h2>No Content Available</h2>
              <p>This lesson currently has no description, video, or materials.</p>
            </CenteredContainer>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [activeTab, setActiveTab] = useState<string>('lessons');
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  
  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId || !user) {
        setError('Missing course ID or user not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Fetch the subject details (without joining users directly)
        const { data: subjectData, error: subjectError } = await supabase
          .from('subjects')
          .select('*') // Select all subject fields
          .eq('id', courseId)
          .single();

        if (subjectError) {
          console.error('Error fetching subject:', subjectError);
          throw new Error('Failed to fetch course details');
        }

        if (!subjectData) {
          throw new Error('Course not found');
        }

        let teacherInfo: { firstName: string; lastName: string } | null = null;

        // Step 2: If subject has a teacherid, fetch teacher details
        if (subjectData.teacherid) {
          const { data: teacherData, error: teacherError } = await supabase
            .from('users')
            .select('firstName, lastName')
            .eq('id', subjectData.teacherid)
            .single();

          if (teacherError) {
            // Log error but don't block loading the subject
            console.error('Error fetching teacher details:', teacherError); 
          } else if (teacherData) {
            teacherInfo = {
              firstName: teacherData.firstName,
              lastName: teacherData.lastName,
            };
          }
        }

        // Format the subject data with potentially fetched teacher info
        const formattedSubject: Subject = {
          id: subjectData.id,
          subjectname: subjectData.subjectname,
          code: subjectData.code,
          description: subjectData.description,
          status: subjectData.status,
          createdat: subjectData.createdat,
          teacher: teacherInfo, // Assign fetched teacher info
        };

        setSubject(formattedSubject);

        // Step 3: Fetch ONLY lesson list (no need for materials here anymore)
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, lessonname, uploadedat, description, subjectid, fileurls, videourl') // Add fileurls and other important fields
          .eq('subjectid', courseId)
          .order('uploadedat', { ascending: true }); // Order lessons logically (e.g., ascending)

        if (lessonsError) {
          console.error('Error fetching lessons:', lessonsError);
          // Don't throw error here, maybe the course just has no lessons yet
          setLessons([]);
        } else {
           // Explicitly cast to the simplified Lesson type for this component
           // Add any additional processing needed for the lesson data
           const processedLessons = lessonsData?.map(lesson => ({
             ...lesson,
             // Add any transformations needed
           })) || [];
           
           setLessons(processedLessons as Lesson[]); 
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error in fetchCourseDetails:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setIsLoading(false);
        toast.error('Failed to load course details');
      }
    };
    
    fetchCourseDetails();
  }, [courseId, user]);

  // Get a deterministic color based on subject ID
  const getSubjectColor = (id: string) => {
    const colors = [
      'primary', 'warning', 'danger', 'success', 'purple', 'teal', 'indigo'
    ];
    
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };
  
  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLesson(null);
  };
  
  // Render loading state
  if (isLoading) {
  return (
      <CenteredContainer>
        <Spinner />
        <p>Loading course details...</p>
      </CenteredContainer>
    );
  }

  // Render error state
  if (error || !subject) {
    return (
      <CenteredContainer>
        <IconWrapper><FiX size={40} /></IconWrapper>
        <h2>Failed to Load Course</h2>
        <p>{error || 'Course could not be loaded. Please try again.'}</p>
        <BackButton to="/student/courses">
              <FiArrowLeft />
          Back to Courses
            </BackButton>
      </CenteredContainer>
    );
  }

  // Determine subject color for UI
  const color = getSubjectColor(subject.id);

  return (
    <PageContainer
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <BackButton to="/student/courses">
        <FiArrowLeft />
        Back to Courses
      </BackButton>
      
      {/* Course Header with Color */}
      <CourseHeader $color={color}>
        <h1>{subject.subjectname}</h1>
        <p>{subject.code || 'No Code'}</p>
        
        {subject.teacher && (
          <TeacherInfo>
                <FiUser />
            <span>{`${subject.teacher.firstName} ${subject.teacher.lastName}`}</span>
          </TeacherInfo>
        )}
      </CourseHeader>
      
      {/* Tab Navigation */}
      <TabsContainer>
            <TabButton 
          $isActive={activeTab === 'lessons'} 
          onClick={() => setActiveTab('lessons')}
            >
              <FiBook />
          Lessons
          {lessons.length > 0 && <TabCount>{lessons.length}</TabCount>}
            </TabButton>
      </TabsContainer>
      
      {/* Tab Content */}
          <TabContent>
        {activeTab === 'lessons' && (
          <div>
            {lessons.length === 0 ? (
              <CenteredContainer>
                <IconWrapper><FiBook size={40} /></IconWrapper>
                <h2>No Lessons Yet</h2>
                <p>This course doesn't have any lessons assigned yet.</p>
              </CenteredContainer>
            ) : (
                  <LessonsList>
                {lessons.map((lesson) => {
                  console.log('Rendering link for lesson:', lesson.id, lesson);
                  return (
                    <LessonButtonCard key={lesson.id} onClick={() => handleLessonClick(lesson)}>
                      <IconWrapper><FiBook /></IconWrapper>
                      <LessonInfoContainer>
                        <h3>{lesson.lessonname}</h3>
                        {lesson.description && <LessonShortDescription>{lesson.description}</LessonShortDescription>}
                        <LessonDate>
                          <FiCalendar />
                          <span>{new Date(lesson.uploadedat).toLocaleDateString()}</span>
                        </LessonDate>
                      </LessonInfoContainer>
                      <FiChevronRight size={20} />
                    </LessonButtonCard>
                  );
                })}
                  </LessonsList>
            )}
          </div>
        )}
      </TabContent>
      
      {/* Modal Rendering */}
      {isModalOpen && selectedLesson && (
        <LessonModal lesson={selectedLesson} onClose={closeModal} />
      )}
      
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  max-width: 1200px;
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
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 16px;
  text-decoration: none;
  
  &:hover {
    color: ${props => props.theme.colors.primary[500]};
  }
`;

interface ColorProps {
  $color: string;
}

const CourseHeader = styled.div<ColorProps>`
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  background: ${props => {
    switch(props.$color) {
      case 'primary': return props.theme.colors.primary[500];
      case 'warning': return props.theme.colors.warning[500];
      case 'danger': return props.theme.colors.danger[500];
      case 'success': return props.theme.colors.success[500];
      case 'purple': return '#8B5CF6';
      case 'teal': return '#14B8A6';
      case 'indigo': return '#6366F1';
      default: return props.theme.colors.primary[500];
    }
  }};
  color: white;
  
  h1 {
    margin: 0 0 8px;
  font-size: 24px;
  }
  
  p {
    margin: 0 0 8px;
    opacity: 0.9;
  }
`;

const TeacherInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  
  svg {
    opacity: 0.8;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  padding-bottom: 4px;
`;

interface TabButtonProps {
  $isActive: boolean;
}

const TabButton = styled.button<TabButtonProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${props => props.$isActive ? props.theme.colors.primary[50] : 'transparent'};
  color: ${props => props.$isActive ? props.theme.colors.primary[500] : props.theme.colors.text.secondary};
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${props => props.$isActive ? '600' : '400'};
  cursor: pointer;
  
  &:hover {
    background: ${props => props.$isActive ? props.theme.colors.primary[50] : props.theme.colors.background.hover};
  }
`;

const TabCount = styled.span`
  background: ${props => props.theme.colors.primary[100]};
  color: ${props => props.theme.colors.primary[600]};
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
`;

const TabContent = styled.div`
  padding: 16px 0;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  margin: 24px 0 16px;
  color: ${props => props.theme.colors.text.primary};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatBox = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: ${props => props.theme.colors.background.light};
  border-radius: 12px;
`;

const StatIconWrapper = styled.div<ColorProps>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch(props.$color) {
      case 'primary': return props.theme.colors.primary[100];
      case 'warning': return props.theme.colors.warning[100];
      case 'danger': return props.theme.colors.danger[100];
      case 'success': return props.theme.colors.success[100];
      case 'purple': return '#F3E8FF';
      default: return props.theme.colors.primary[100];
    }
  }};
  color: ${props => {
    switch(props.$color) {
      case 'primary': return props.theme.colors.primary[500];
      case 'warning': return props.theme.colors.warning[500];
      case 'danger': return props.theme.colors.danger[500];
      case 'success': return props.theme.colors.success[500];
      case 'purple': return '#7E22CE';
      default: return props.theme.colors.primary[500];
    }
  }};
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background.light};
  color: ${props => props.theme.colors.text.secondary};
`;

const LessonsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const LessonButtonCard = styled.button`
  display: flex;
  width: 100%; // Make button take full width of container
  align-items: center;
  gap: 16px;
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 12px;
  padding: 16px 20px;
  background: ${props => props.theme.colors.background.primary};
  text-decoration: none;
  color: inherit;
  cursor: pointer; // Add cursor pointer
  text-align: left; // Align text to the left
  transition: background-color 0.2s ease, box-shadow 0.2s ease; 
  
  &:hover {
    background: ${props => props.theme.colors.background.hover};
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }

  svg:last-child {
     margin-left: auto; 
     color: ${props => props.theme.colors.text.tertiary};
   }
`;

const LessonInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1; 
  min-width: 0; 

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const LessonShortDescription = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LessonDate = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.theme.colors.text.tertiary};
  font-size: 12px;
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

// --- Modal Specific Styled Components ---

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

const ModalContent = styled(motion.div)`
  background: ${props => props.theme.colors.background.primary};
  border-radius: 12px;
  padding: 24px 32px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  
  h2 {
    margin: 0;
    font-size: 20px;
    color: ${props => props.theme.colors.text.primary};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;

const ModalBody = styled.div`
  // Add styles if needed
`;

const ModalSection = styled.div`
  margin-bottom: 24px;
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 12px;
    color: ${props => props.theme.colors.text.primary};
  }
  
  p {
    font-size: 14px;
    color: ${props => props.theme.colors.text.secondary};
    line-height: 1.6;
  }
`;

const ModalVideoContainer = styled.div`
  position: relative;
  padding-bottom: 56.25%; // 16:9 aspect ratio
  height: 0;
  margin: 16px 0;
  
  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ModalMaterialsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

// Reusing MaterialItem, IconWrapper, MaterialName, MaterialType, DownloadButton from LessonDetail (or potentially define them here if they differ)
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

const MaterialName = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary};
  word-break: break-word;
`;

const MaterialType = styled.div`
  color: ${props => props.theme.colors.text.secondary};
    font-size: 12px;
  text-transform: uppercase;
  margin-top: 2px;
`;

// Add DownloadButton definition if not already present
const DownloadButton = styled.button`
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 8px;
  background: ${props => props.theme.colors.primary[500]};
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: auto;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.primary[600]};
  }
`;

export default CourseDetail; 