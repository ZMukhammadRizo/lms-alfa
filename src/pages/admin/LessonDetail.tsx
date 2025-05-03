import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiEdit, FiSave, FiX, FiUpload, FiFile, FiTrash, FiPaperclip, FiDownload } from 'react-icons/fi';
import supabase, { supabaseAdmin } from '../../config/supabaseClient';

// Define lesson interface
interface Lesson {
  id: string;
  lessonname: string;
  description: string;
  uploadedat: string;
  videourl: string;
  fileurls?: string[];
  subjectid: {
    id: string;
    name: string;
  } | string;
  [key: string]: any;
}

// Utility function to fetch a lesson
const fetchLesson = async (id: string) => {
  try {
    console.log("Fetching lesson with ID:", id);
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching lesson:", error);
      throw error;
    }
    
    return { data, error: null };
  } catch (err) {
    console.error("Exception in fetchLesson:", err);
    return { data: null, error: err };
  }
};

// Utility function to update a lesson
const updateLesson = async (id: string, updates: Partial<Lesson>) => {
  try {
    console.log("Updating lesson with ID:", id, "Updates:", updates);
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error("Error updating lesson:", error);
      throw error;
    }
    
    return { data, error: null };
  } catch (err) {
    console.error("Exception in updateLesson:", err);
    return { data: null, error: err };
  }
};

// Helper function to generate proper embed URL
const getEmbedUrl = (url: string): string => {
  console.log("Processing video URL:", url);
  if (!url) {
    console.error("Empty URL provided");
    return '';
  }

  try {
    // Handle YouTube URLs
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // Extract video ID
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        // Format: https://www.youtube.com/watch?v=VIDEO_ID
        const urlParams = new URL(url).searchParams;
        videoId = urlParams.get('v') || '';
      } else if (url.includes('youtu.be/')) {
        // Format: https://youtu.be/VIDEO_ID
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (url.includes('youtube.com/embed/')) {
        // Format: https://www.youtube.com/embed/VIDEO_ID
        videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
      }
      
      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        console.log("Generated YouTube embed URL:", embedUrl);
        return embedUrl;
      }
    }
    
    // Handle Vimeo URLs
    if (url.includes('vimeo.com')) {
      // Extract video ID
      const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
      if (vimeoId) {
        const embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
        console.log("Generated Vimeo embed URL:", embedUrl);
        return embedUrl;
      }
    }
    
    // If it's already an embed URL, return as is
    if (url.includes('/embed/')) {
      console.log("URL already appears to be an embed URL");
      return url;
    }
    
    // If no specific handler, return the URL as is
    console.log("No specific handler for this URL, returning as is");
    return url;
  } catch (error) {
    console.error("Error processing video URL:", error);
    return url; // Return original URL on error
  }
};

// Styled components
const PageContainer = styled(motion.div)`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  color: ${props => props.theme.colors.primary[600]};
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(79, 70, 229, 0.05);
  }
`;

const Title = styled.h1`
  font-size: 1.75rem;
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
`;

const ContentContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  
  @media (min-width: 768px) {
    grid-template-columns: 2fr 1fr;
  }
`;

const VideoSection = styled.div`
  background-color: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const VideoContainer = styled.div`
  position: relative;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  width: 100%;
  background-color: #000;
`;

const Video = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
`;

const NoVideoContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #111;
  color: #fff;
  gap: 1rem;
`;

const InfoSection = styled.div`
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const InfoSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme.colors.primary[50]};
  color: ${props => props.theme.colors.primary[600]};
  border: none;
  border-radius: 0.375rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary[100]};
  }
`;

const DescriptionText = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const VideoUrlContainer = styled.div`
  margin-top: 1.5rem;
`;

const VideoUrlLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.5rem;
`;

const VideoUrl = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.875rem;
  word-break: break-all;
  padding: 0.75rem;
  background-color: ${props => props.theme.colors.background.secondary || '#f9fafb'};
  border-radius: 0.375rem;
  border: 1px solid ${props => props.theme.colors.border.light || '#e5e7eb'};
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

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${props => props.theme.colors.primary[600]};
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary[700]};
  }
`;

const CancelButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const MetadataContainer = styled.div`
  margin-top: 1.5rem;
  border-top: 1px solid ${props => props.theme.colors.border.light || '#e5e7eb'};
  padding-top: 1.5rem;
`;

const MetadataItem = styled.div`
  display: flex;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const MetadataLabel = styled.span`
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
  min-width: 100px;
`;

const MetadataValue = styled.span`
  color: ${props => props.theme.colors.text.secondary};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: ${props => props.theme.colors.text.secondary};
`;

const ErrorContainer = styled.div`
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
`;

const SuccessMessage = styled(motion.div)`
  background-color: #d1fae5;
  color: #065f46;
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
`;

const FileUploadSection = styled.div`
  grid-column: 1 / -1;
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-top: 1.5rem;
`;

const SectionDivider = styled.div`
  height: 1px;
  background-color: ${props => props.theme.colors.border.light || '#e5e7eb'};
  margin: 1.5rem 0;
`;

const UploadButtonContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1rem;
`;

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${props => props.theme.colors.primary[600]};
  color: white;
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.primary[700]};
  }
`;

const UploadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.875rem;
`;

const UploadProgressBar = styled.div<{ $progress: number }>`
  height: 0.25rem;
  width: 100%;
  background-color: ${props => props.theme.colors.border.light || '#e5e7eb'};
  border-radius: 0.125rem;
  margin-top: 0.5rem;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.$progress}%;
    background-color: ${props => props.theme.colors.primary[500]};
    transition: width 0.3s ease;
  }
`;

const FilePreviewContainer = styled.div`
  margin-top: 1.5rem;
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: ${props => props.theme.colors.background.secondary || '#f9fafb'};
  border-radius: 0.5rem;
  border: 1px solid ${props => props.theme.colors.border.light || '#e5e7eb'};
`;

const FileIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
  background-color: ${props => props.theme.colors.primary[100]};
  color: ${props => props.theme.colors.primary[600]};
  border-radius: 0.375rem;
`;

const FileDetails = styled.div`
  flex: 1;
  margin-left: 1rem;
  overflow: hidden;
`;

const FileName = styled.div`
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSize = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.secondary};
  margin-top: 0.25rem;
`;

const FileActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: 1rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  background-color: transparent;
  color: ${props => props.theme.colors.text.secondary};
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.primary[50]};
    color: ${props => props.theme.colors.primary[600]};
  }

  &.delete:hover {
    background-color: #fee2e2;
    color: #dc2626;
  }
`;

const EmptyFilesMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  border: 2px dashed ${props => props.theme.colors.border.light || '#e5e7eb'};
  border-radius: 0.5rem;
  margin-top: 1rem;

  svg {
    font-size: 2rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
`;

const LessonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State variables
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    lessonname: '',
    description: '',
    videourl: ''
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Add new state for file uploads
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; size?: string }[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date available';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Format file size function
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Extract filename from URL
  const getFileNameFromUrl = (url: string): string => {
    try {
      const pathname = new URL(url).pathname;
      const fileName = pathname.split('/').pop() || 'file';
      return decodeURIComponent(fileName);
    } catch (error) {
      return url.split('/').pop() || 'file';
    }
  };
  
  // Load lesson data
  useEffect(() => {
    const loadLesson = async () => {
      console.log("LessonDetail component mounted, id:", id);
      console.log("Location state:", location.state);
      
      if (!id) {
        setError("No lesson ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // First try to use lesson from state if available
        if (location.state && location.state.lesson) {
          console.log("Using lesson from location state:", location.state.lesson);
          const lessonFromState = location.state.lesson;
          console.log("Video URL from state:", lessonFromState.videourl);
          
          setLesson(lessonFromState);
          setFormData({
            lessonname: lessonFromState.lessonname || '',
            description: lessonFromState.description || '',
            videourl: lessonFromState.videourl || ''
          });

          // Initialize uploaded files from lesson data
          if (lessonFromState.fileurls && Array.isArray(lessonFromState.fileurls)) {
            const files = lessonFromState.fileurls.map((url: string) => ({
              name: getFileNameFromUrl(url),
              url: url
            }));
            setUploadedFiles(files);
          }

          setLoading(false);
          return;
        }
        
        // Otherwise fetch from the database
        console.log("Fetching lesson data from database");
        const { data, error } = await fetchLesson(id);
        
        if (error) {
          console.error("Failed to load lesson data:", error);
          setError("Failed to load lesson data");
          setLoading(false);
          return;
        }
        
        if (data) {
          console.log("Lesson loaded from database:", data);
          console.log("Video URL from database:", data.videourl);
          
          setLesson(data);
          setFormData({
            lessonname: data.lessonname || '',
            description: data.description || '',
            videourl: data.videourl || ''
          });

          // Initialize uploaded files from lesson data
          if (data.fileurls && Array.isArray(data.fileurls)) {
            const files = data.fileurls.map((url: string) => ({
              name: getFileNameFromUrl(url),
              url: url
            }));
            setUploadedFiles(files);
          }
        } else {
          console.error("No lesson data found");
          setError("Lesson not found");
        }
      } catch (err: any) {
        console.error("Error loading lesson:", err);
        setError(err.message || "An error occurred while loading the lesson");
      } finally {
        setLoading(false);
      }
    };
    
    loadLesson();
  }, [id, location.state]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !lesson) {
      setError("No lesson data available to update");
      return;
    }
    
    try {
      setLoading(true);
      
      // Get the current user to include in the update
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      // Include the user ID in the update for RLS policies
      const updateData = {
        ...formData,
        updated_by: userData.user?.id,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await updateLesson(id, updateData);
      
      if (error) {
        throw error;
      }
      
      if (data && data[0]) {
        setLesson(data[0]);
        setSuccessMessage("Lesson updated successfully");
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
      
      setEditMode(false);
    } catch (err: any) {
      console.error("Error updating lesson:", err);
      setError(err.message || "Failed to update lesson");
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel edit mode
  const handleCancel = () => {
    // Reset form data to current lesson values
    if (lesson) {
      setFormData({
        lessonname: lesson.lessonname || '',
        description: lesson.description || '',
        videourl: lesson.videourl || ''
      });
    }
    
    setEditMode(false);
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !lesson) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newUploadedFiles = [...uploadedFiles];
      let processedFiles = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Simulate progress updates (in a real implementation, this would use the Supabase upload progress callback)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const increment = Math.random() * 10;
            return Math.min(prev + increment, 90); // Cap at 90% until complete
          });
        }, 300);

        const { error: uploadError, data } = await supabaseAdmin.storage
          .from('lms')
          .upload(filePath, file);

        clearInterval(progressInterval);

        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          throw uploadError;
        }

        if (data) {
          const { data: urlData } = supabaseAdmin.storage
            .from('lms')
            .getPublicUrl(filePath);

          newUploadedFiles.push({
            name: file.name,
            url: urlData.publicUrl,
            size: formatFileSize(file.size)
          });
        }

        processedFiles++;
        setUploadProgress((processedFiles / files.length) * 100);
      }

      setUploadedFiles(newUploadedFiles);
      setUploadProgress(100);

      // Update lesson with new file URLs
      const fileUrls = newUploadedFiles.map(file => file.url);
      const { error: updateError } = await supabaseAdmin
        .from('lessons')
        .update({ fileurls: fileUrls })
        .eq('id', lesson.id);

      if (updateError) throw updateError;

      // Update local lesson state
      setLesson(prev => {
        if (!prev) return null;
        return { ...prev, fileurls: fileUrls };
      });

      setSuccessMessage("Files uploaded successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error in file upload:", err);
      setError(err.message || "Failed to upload files");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (indexToDelete: number) => {
    if (!lesson) return;
    
    try {
      // Make a copy of current files
      const updatedFiles = [...uploadedFiles];
      
      // Get the URL of the file to delete from storage
      const fileUrl = updatedFiles[indexToDelete].url;
      
      // Extract path from URL - get everything after the bucket name in the URL
      const urlParts = fileUrl.split('lms/');
      const path = urlParts.length > 1 ? urlParts[1] : '';
      
      // Remove from storage if it's our own file
      if (path) {
        const { error: deleteFileError } = await supabaseAdmin.storage
          .from('lms')
          .remove([path]);

        if (deleteFileError) {
          console.error('Error deleting file from storage:', deleteFileError);
        }
      }
      
      // Remove from our list
      updatedFiles.splice(indexToDelete, 1);
      setUploadedFiles(updatedFiles);
      
      // Update Supabase
      const fileUrls = updatedFiles.map(file => file.url);
      const { error: updateError } = await supabaseAdmin
        .from('lessons')
        .update({ fileurls: fileUrls })
        .eq('id', lesson.id);

      if (updateError) throw updateError;
      
      // Update local lesson state
      setLesson(prev => {
        if (!prev) return null;
        return { ...prev, fileurls: fileUrls };
      });
      
      setSuccessMessage("File deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error deleting file:", err);
      setError(err.message || "Failed to delete file");
    }
  };

  // Handle file download
  const handleDownloadFile = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <BackButton onClick={() => navigate(-1)}>
          <FiArrowLeft />
          Back to Lessons
        </BackButton>
        {lesson && <Title>{editMode ? 'Edit Lesson' : lesson.lessonname}</Title>}
      </Header>
      
      {error && (
        <ErrorContainer>
          <strong>Error:</strong> {error}
        </ErrorContainer>
      )}
      
      {successMessage && (
        <SuccessMessage
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {successMessage}
        </SuccessMessage>
      )}
      
      {loading ? (
        <LoadingContainer>Loading lesson...</LoadingContainer>
      ) : lesson ? (
        <ContentContainer>
          <VideoSection>
            <VideoContainer>
              {editMode || !lesson.videourl ? (
                <NoVideoContainer>
                  {editMode ? (
                    <div>Edit the video URL below to update the video</div>
                  ) : (
                    <>
                      <div>No video available for this lesson</div>
                      <EditButton onClick={() => setEditMode(true)}>
                        <FiEdit />
                      </EditButton>
                    </>
                  )}
                </NoVideoContainer>
              ) : (
                <Video 
                  key={lesson.videourl} 
                  title={lesson.lessonname}
                  src={getEmbedUrl(lesson.videourl)}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </VideoContainer>
          </VideoSection>
          
          <InfoSection>
            {editMode ? (
              <form onSubmit={handleSubmit}>
                <SectionTitle>Edit Lesson Details</SectionTitle>
                
                <FormGroup>
                  <FormLabel htmlFor="lessonname">Lesson Name</FormLabel>
                  <FormInput
                    id="lessonname"
                    name="lessonname"
                    value={formData.lessonname}
                    onChange={handleInputChange}
                    placeholder="Enter lesson name"
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <FormTextarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter lesson description"
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <FormLabel htmlFor="videourl">Video URL</FormLabel>
                  <FormInput
                    id="videourl"
                    name="videourl"
                    value={formData.videourl}
                    onChange={handleInputChange}
                    placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                  />
                </FormGroup>
                
                <ButtonContainer>
                  <CancelButton type="button" onClick={handleCancel}>
                    <FiX />
                    Cancel
                  </CancelButton>
                  <SaveButton type="submit" disabled={loading}>
                    <FiSave />
                    Save Changes
                  </SaveButton>
                </ButtonContainer>
              </form>
            ) : (
              <>
                <InfoSectionHeader>
                  <SectionTitle>Lesson Details</SectionTitle>
                  <EditButton onClick={() => setEditMode(true)}>
                    <FiEdit />
                  </EditButton>
                </InfoSectionHeader>
                
                <DescriptionText>
                  {lesson.description || 'No description available'}
                </DescriptionText>
                
                {lesson.videourl && (
                  <VideoUrlContainer>
                    <VideoUrlLabel>Video URL</VideoUrlLabel>
                    <VideoUrl>{lesson.videourl}</VideoUrl>
                  </VideoUrlContainer>
                )}
                
                <MetadataContainer>
                  <MetadataItem>
                    <MetadataLabel>Uploaded:</MetadataLabel>
                    <MetadataValue>{formatDate(lesson.uploadedat)}</MetadataValue>
                  </MetadataItem>
                  <MetadataItem>
                    <MetadataLabel>Lesson ID:</MetadataLabel>
                    <MetadataValue>{lesson.id}</MetadataValue>
                  </MetadataItem>
                </MetadataContainer>
              </>
            )}
          </InfoSection>
        </ContentContainer>
      ) : (
        <div>Lesson not found</div>
      )}
      
      {!loading && lesson && (
        <FileUploadSection>
          <SectionTitle>Additional Materials</SectionTitle>
          <SectionDivider />
          
          {/* File upload controls */}
          <UploadButtonContainer>
            <FileInput 
              type="file" 
              id="file-upload" 
              multiple 
              onChange={handleFileUpload} 
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
            />
            <FileInputLabel htmlFor="file-upload" title="Upload files (PDF, DOCX, images, etc.)">
              <FiUpload /> 
              Upload Files
            </FileInputLabel>
            
            {isUploading && (
              <UploadingIndicator>
                <span>Uploading... {Math.round(uploadProgress)}%</span>
                <UploadProgressBar $progress={uploadProgress} />
              </UploadingIndicator>
            )}
          </UploadButtonContainer>
          
          {/* File preview */}
          <FilePreviewContainer>
            {uploadedFiles.length > 0 ? (
              <FileList>
                {uploadedFiles.map((file, index) => (
                  <FileItem key={index}>
                    <FileIcon>
                      <FiFile />
                    </FileIcon>
                    <FileDetails>
                      <FileName>{file.name}</FileName>
                      {file.size && <FileSize>{file.size}</FileSize>}
                    </FileDetails>
                    <FileActions>
                      <ActionButton 
                        title="Download file"
                        onClick={() => handleDownloadFile(file.url, file.name)}
                      >
                        <FiDownload />
                      </ActionButton>
                      <ActionButton 
                        className="delete"
                        title="Delete file"
                        onClick={() => handleDeleteFile(index)}
                      >
                        <FiTrash />
                      </ActionButton>
                    </FileActions>
                  </FileItem>
                ))}
              </FileList>
            ) : (
              <EmptyFilesMessage>
                <FiPaperclip />
                <div>No additional files uploaded yet</div>
                <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Upload PDF documents, images, or other materials related to this lesson
                </div>
              </EmptyFilesMessage>
            )}
          </FilePreviewContainer>
        </FileUploadSection>
      )}
    </PageContainer>
  );
};

export default LessonDetail; 