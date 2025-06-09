import React, { useEffect, useState, ChangeEvent } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import supabase from '../../config/supabaseClient'
import { FiArrowLeft, FiDownload, FiFileText, FiVideo, FiUpload, FiTrash2, FiCalendar } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

// Interfaces
interface LessonDetails {
  id: string
  lessonname: string
  description?: string
  uploadedat: string
  duration?: string
  videourl?: string
  fileurls?: string[] | null // Primary file URLs array
  subjectid: string
}

// Styled Components
const Container = styled.div`
  padding: clamp(1.5rem, 4vw, 3rem);
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background.primary};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: 1rem;
  }
`

const Header = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-direction: column;
`

const StyledBackButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 0;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    color: ${props => props.theme.colors.primary[500]};
  }
`

const Title = styled.h1`
  font-size: clamp(1.8rem, 5vw, 2.2rem);
  font-weight: 700;
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
`

const ContentContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: clamp(1.5rem, 4vw, 2.5rem);
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.light};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: 1.5rem;
  }
`

const Section = styled.section`
  margin-bottom: 2.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  margin: 0 0 1.25rem 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  padding-bottom: 0.75rem;
`

const VideoContainer = styled.div`
  position: relative;
  padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
  height: 0;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background-color: #000;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
`

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.7;
  white-space: pre-wrap;
  font-size: 1rem;
`

const FilesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const FileItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background-color: ${({ theme }) => theme.colors.background.primary};
  transition: background-color 0.2s ease;

  &:hover {
      background-color: ${({ theme }) => theme.colors.background.hover};
  }
`

const FileInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-grow: 1;
    overflow: hidden;
`

const FileName = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  svg {
    color: ${({ theme }) => theme.colors.primary[500]};
    flex-shrink: 0;
    margin-right: 0.5rem;
  }
`

const FileActions = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
`

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${({ theme }) => theme.colors.primary[500]};
  color: white;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[600]};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }

  &.delete {
    background-color: ${({ theme }) => theme.colors.danger[500]};
    &:hover {
        background-color: ${({ theme }) => theme.colors.danger[600]};
    }
  }

  &.upload {
      background-color: ${({ theme }) => theme.colors.success[500]};
      &:hover {
          background-color: ${({ theme }) => theme.colors.success[600]};
      }
      &:disabled {
          // Using placeholder grays as theme.colors.disabled and theme.colors.neutral seem unavailable
          background-color: #e0e0e0; // Light gray background
          color: #757575; // Darker gray text
          cursor: not-allowed;
          box-shadow: none;
      }
  }

  svg {
    font-size: 1rem;
  }
`

// Define DownloadButton as styled.a with ActionButton styles
const DownloadButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  text-decoration: none;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[600]};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }

  svg {
    font-size: 1rem;
  }
`

const UploadSection = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`

const FileInputLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.secondary};
  border: 1px dashed ${({ theme }) => theme.colors.border.light};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    color: ${({ theme }) => theme.colors.primary[500]};
  }
`

const FileInput = styled.input`
  display: none;
`

const SelectedFileName = styled.span`
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-style: italic;
`

const EmptyState = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
  padding: 1rem 0;
  text-align: center;
`

const LoadingState = styled.div`
  padding: 4rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.1rem;
`

// Helper Functions
const getFileNameFromUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split('/');
    const encodedFileName = pathSegments[pathSegments.length - 1];
    // Decode only the filename part, handle errors
    try {
        // Basic heuristic: if it looks like a UUID, return generic name, else try decode
        if (encodedFileName.length > 30 && encodedFileName.includes('-')) {
             const originalNameGuess = url.split('/').pop()?.split('-').slice(-1)[0];
             return originalNameGuess ? decodeURIComponent(originalNameGuess) : 'file';
        }
        return decodeURIComponent(encodedFileName);
    } catch (decodeError) {
        console.warn("Could not decode filename:", encodedFileName, decodeError);
        return encodedFileName;
    }
  } catch (error) {
    console.error("Error parsing URL for filename:", error);
    const segments = url.split('/');
    return segments[segments.length - 1] || 'file';
  }
};

// Updated to use 'lesson_files' path prefix
const getFileStoragePathFromUrl = (url: string): string | null => {
    try {
        const urlObject = new URL(url);
        const pathSegments = urlObject.pathname.split('/');
        // IMPORTANT: Adjust if your bucket/path structure is different
        // Assumes URL like: .../public/lms/lesson_files/some_unique_name.ext
        const bucketNameIndex = pathSegments.findIndex(segment => segment === 'lms'); // Your bucket
        if (bucketNameIndex > -1 && pathSegments.length > bucketNameIndex + 1) {
            // Needs to return 'lesson_files/some_unique_name.ext'
             const filePath = pathSegments.slice(bucketNameIndex + 1).join('/');
             // Ensure it starts with 'lesson_files/'
             if (filePath.startsWith('lesson_files/')) {
                 return filePath;
             }
        }
        console.warn("Could not extract storage path starting with 'lesson_files/' from URL:", url);
        return null;
    } catch (error) {
        console.error("Error parsing URL for storage path:", error);
        return null;
    }
};

const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
  } catch (e) {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
  return null;
}

const TeacherLessonDetails = () => {
  const { t } = useTranslation()
  const { classId, subjectId, lessonId } = useParams<{ classId: string; subjectId: string; lessonId: string }>()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<LessonDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetchLessonData = async () => {
      setLoading(true);
      try {
        if (!lessonId) {
            toast.error(t('teacher.subjects.lessonIdMissing'));
            setLoading(false);
            return;
        }

        // Fetch lesson details, ensuring fileurls is selected
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*') // Often selects all columns by default, but explicitly ensure fileurls is included if needed
          .eq('id', lessonId)
          .single();

        console.log("Fetched lessonData:", lessonData);

        if (lessonError) throw lessonError;
        if (lessonData) {
          // --- PARSE fileurls --- 
          let parsedFileUrls: string[] = [];
          if (lessonData.fileurls) {
              if (typeof lessonData.fileurls === 'string') {
                  try {
                      // Attempt to parse if it's a string
                      const parsed = JSON.parse(lessonData.fileurls);
                      // Ensure the parsed result is an array of strings
                      if (Array.isArray(parsed) && parsed.every((item: string) => typeof item === 'string')) {
                          parsedFileUrls = parsed;
                      } else {
                          console.warn("Parsed fileurls is not an array of strings:", parsed);
                          // Decide how to handle invalid format - empty array or try other parsing?
                          parsedFileUrls = []; 
                      }
                  } catch (parseError) {
                      console.error("Failed to parse fileurls JSON string:", parseError);
                      parsedFileUrls = []; // Default to empty on parse error
                  }
              } else if (Array.isArray(lessonData.fileurls) && lessonData.fileurls.every((item: string) => typeof item === 'string')) {
                  // It's already an array of strings
                  parsedFileUrls = lessonData.fileurls;
              } else {
                  console.warn("fileurls column has unexpected type or content:", lessonData.fileurls);
                  parsedFileUrls = []; // Default to empty for unexpected types/content
              }
          }
          // Set the lesson state with the correctly parsed/validated fileurls
          setLesson({ ...lessonData, fileurls: parsedFileUrls });
          console.log("Parsed fileurls set in lesson state:", parsedFileUrls);
          // --- END PARSE --- 
        } else {
             throw new Error(t('teacher.subjects.lessonNotFound'));
        }

      } catch (error: any) {
        console.error('Error fetching lesson data:', error);
        toast.error(error.message || t('teacher.subjects.loadingLessonDetails'));
        setLesson(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [lessonId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  // Renamed and Rewritten function to handle primary file uploads
  const handleUploadPrimaryFile = async () => {
    if (!selectedFile || !lessonId || !lesson) {
      toast.error(t('teacher.subjects.selectFileToUpload'));
      return;
    }

    setUploading(true);
    const fileExtension = selectedFile.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}${fileExtension ? '.' + fileExtension : ''}`;
    // Using a new suggested path prefix 'lesson_files'
    const filePath = `lesson_files/${lessonId}/${uniqueFileName}`;

    try {
      // 1. Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lms') // Your bucket
        .upload(filePath, selectedFile, { upsert: false });

      if (uploadError) throw uploadError;

      // 2. Get URL
      const { data: urlData } = supabase.storage
        .from('lms')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        await supabase.storage.from('lms').remove([filePath]); // Cleanup attempt
        throw new Error(t('teacher.subjects.couldNotGetPublicUrl'));
      }
      const newFileUrl = urlData.publicUrl;

      // 3. Prepare updated fileurls array
      const currentUrls = lesson.fileurls || [];
      const updatedUrlsArray = [...currentUrls, newFileUrl]; // Append the new URL string

      // 4. Update the lessons table's fileurls column
      const { error: dbError } = await supabase
        .from('lessons')
        .update({ fileurls: updatedUrlsArray }) // Update fileurls column
        .eq('id', lessonId);

      if (dbError) {
        await supabase.storage.from('lms').remove([filePath]); // Cleanup attempt
        throw dbError;
      }

      // 5. Update local state
      setLesson(prevLesson => prevLesson ? { ...prevLesson, fileurls: updatedUrlsArray } : null);

      toast.success(t('teacher.subjects.fileUploadedSuccessfully'));
      setSelectedFile(null);
      const fileInput = document.getElementById('primary-file-upload') as HTMLInputElement; // Changed ID
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error("Error uploading primary file:", error);
      toast.error(error?.message || t('teacher.subjects.failedToUploadFile'));
    } finally {
      setUploading(false);
    }
  };

  // Renamed and Rewritten function to delete primary files
  const handleDeletePrimaryFile = async (fileUrlToDelete: string) => {
     if (!window.confirm(t('teacher.subjects.confirmDeleteFile')) || !lesson || !lesson.fileurls) {
         return;
     }

     // Derive storage path using the new helper function logic
     const filePath = getFileStoragePathFromUrl(fileUrlToDelete);
     if (!filePath) {
         toast.error(t('teacher.subjects.couldNotDetermineFilePath'));
         return;
     }

     // Filter out the file URL to be deleted
     const updatedUrlsArray = lesson.fileurls.filter(url => url !== fileUrlToDelete);

     try {
        // 1. Update the lessons table first
        const { error: dbError } = await supabase
            .from('lessons')
            .update({ fileurls: updatedUrlsArray }) // Update fileurls column
            .eq('id', lesson.id);

        if (dbError) throw dbError;

         // 2. If DB update successful, delete from storage
         const { error: storageError } = await supabase.storage
             .from('lms') // Your bucket
             .remove([filePath]); // Pass the derived path

         if (storageError) {
             console.error("Error deleting file from storage (DB record updated):", storageError);
             toast(t('teacher.subjects.fileRemovedButStorageError'));
         } else {
             toast.success(t('teacher.subjects.fileDeletedSuccessfully'));
         }

        // 3. Update local state
        setLesson(prevLesson => prevLesson ? { ...prevLesson, fileurls: updatedUrlsArray } : null);

     } catch (error: any) {
         console.error("Error deleting primary file:", error);
         toast.error(error.message || t('teacher.subjects.failedToDeleteFile'));
     }
 };

  const videoId = lesson?.videourl ? getYouTubeVideoId(lesson.videourl) : null
  const backLink = `/teacher/classes/${classId}/subjects/${subjectId}`

  const handleBackClick = () => {
      navigate(backLink)
  }

  if (loading) {
    return (
      <Container>
        <LoadingState>{t('teacher.subjects.loadingLessonDetails')}</LoadingState>
      </Container>
    )
  }

  if (!lesson) {
    return (
      <Container>
          <Header>
              <StyledBackButton onClick={handleBackClick}>
                  <FiArrowLeft /> {t('common.back')}
              </StyledBackButton>
          </Header>
          <EmptyState>{t('teacher.subjects.lessonNotFound')}</EmptyState>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
         <StyledBackButton onClick={handleBackClick}>
             <FiArrowLeft /> {t('common.back')}
         </StyledBackButton>
         <Title>{lesson.lessonname}</Title>
      </Header>

      <ContentContainer>
        {videoId && (
          <Section>
            <SectionTitle><FiVideo /> {t('common.video')}</SectionTitle>
            <VideoContainer>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </VideoContainer>
          </Section>
        )}

        {lesson.description && (
          <Section>
            <SectionTitle><FiFileText /> {t('common.description')}</SectionTitle>
            <Description>{lesson.description}</Description>
          </Section>
        )}

        <Section>
            <SectionTitle><FiDownload /> {t('common.files')}</SectionTitle>
            <FilesList>
                {lesson.fileurls && lesson.fileurls.length > 0 ? (
                    lesson.fileurls.map((url, index) => (
                        <FileItem key={url + index}>
                            <FileInfo>
                                <FiFileText />
                                <FileName>{getFileNameFromUrl(url)}</FileName>
                            </FileInfo>
                            <FileActions>
                                <DownloadButton href={url} target="_blank" download={getFileNameFromUrl(url)} >
                                    <FiDownload /> {t('common.downloadFile')}
                                </DownloadButton>
                                <ActionButton
                                    className="delete"
                                    onClick={() => handleDeletePrimaryFile(url)}
                                >
                                    <FiTrash2 /> {t('common.deleteFile')}
                                </ActionButton>
                            </FileActions>
                        </FileItem>
                    ))
                ) : (
                    <EmptyState>{t('teacher.subjects.noFilesAttached')}</EmptyState>
                )}
            </FilesList>

            <UploadSection>
                <FileInputLabel htmlFor="primary-file-upload">
                    <FiUpload /> {t('common.chooseFile')}
                </FileInputLabel>
                <FileInput
                    type="file"
                    id="primary-file-upload"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
                {selectedFile && <SelectedFileName>{selectedFile.name}</SelectedFileName>}
                <ActionButton
                    className="upload"
                    onClick={handleUploadPrimaryFile}
                    disabled={!selectedFile || uploading}
                >
                    <FiUpload /> {uploading ? t('teacher.subjects.uploading') : t('common.uploadFile')}
                </ActionButton>
            </UploadSection>
        </Section>

      </ContentContainer>
    </Container>
  )
}

export default TeacherLessonDetails 