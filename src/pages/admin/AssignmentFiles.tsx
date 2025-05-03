import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiDownload, FiFileText, FiImage, FiPaperclip, FiFile, FiChevronLeft, FiChevronRight, FiExternalLink } from 'react-icons/fi';
import supabase from '../../config/supabaseClient';
import { toast } from 'react-toastify';

// Interface for Assignment
interface Assignment {
  id: string;
  title: string;
  description?: string;
  class_name?: string;
  file_url?: string;
  creator_email?: string;
  duedate?: string;
}

// Component for displaying assignment files
const AssignmentFiles: React.FC = () => {
  // Get assignment ID from URL
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State variables
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  
  // Fetch assignment data on component mount
  useEffect(() => {
    fetchAssignment();
  }, [id]);
  
  // Function to fetch assignment data
  const fetchAssignment = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // Fetch assignment data
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          createdby:users(email)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        let className = 'Unknown Class';
        let creatorEmail = 'Unknown';
        
        // Get creator email from the join result
        if (data.createdby && data.createdby.email) {
          creatorEmail = data.createdby.email;
        }
        
        // Fetch class name if needed
        if (data.classid) {
          try {
            const { data: classData } = await supabase
              .from('classes')
              .select('classname')
              .eq('id', data.classid)
              .single();
            
            if (classData) {
              className = classData.classname;
            }
          } catch (e) {
            console.error('Error fetching class:', e);
          }
        }
        
        // Set assignment data
        const enhancedAssignment = {
          ...data,
          description: data.instructions || data.content || '',
          class_name: className,
          creator_email: creatorEmail,
        };
        
        setAssignment(enhancedAssignment);
        
        // Process file URLs
        if (data.file_url) {
          const fileUrls = data.file_url.split(',').filter((url: string) => url.trim() !== '');
          setFiles(fileUrls);
          
          // Set first file as active if available
          if (fileUrls.length > 0) {
            setActiveFile(fileUrls[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast.error('Failed to load assignment data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to determine file type
  const getFileType = (url: string): 'image' | 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'text' | 'other' => {
    try {
      if (!url) return 'other';
      
      // Extract file extension
      const ext = url.split('.').pop()?.toLowerCase() || '';
      
      // Image files
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
        return 'image';
      }
      
      // PDF files
      if (ext === 'pdf') {
        return 'pdf';
      }
      
      // Document files
      if (['doc', 'docx', 'rtf', 'odt'].includes(ext)) {
        return 'document';
      }
      
      // Spreadsheet files
      if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
        return 'spreadsheet';
      }
      
      // Presentation files
      if (['ppt', 'pptx', 'odp'].includes(ext)) {
        return 'presentation';
      }
      
      // Text files
      if (['txt', 'md'].includes(ext)) {
        return 'text';
      }
      
      // Default to other
      return 'other';
    } catch (error) {
      console.error('Error determining file type:', error);
      return 'other';
    }
  };
  
  // Function to get file icon
  const getFileIcon = (url: string) => {
    const fileType = getFileType(url);
    
    switch (fileType) {
      case 'image':
        return <FiImage size={24} />;
      case 'pdf':
        return <FiFileText size={24} />;
      case 'document':
      case 'spreadsheet':
      case 'presentation':
      case 'text':
        return <FiFileText size={24} />;
      default:
        return <FiFile size={24} />;
    }
  };
  
  // Function to get file name from URL
  const getFileName = (url: string): string => {
    try {
      // Extract filename from URL
      const parts = url.split('/');
      const fullName = parts[parts.length - 1];
      
      // Clean up any query parameters and decode URI components
      return decodeURIComponent(fullName.split('?')[0]);
    } catch (error) {
      console.error('Error extracting filename:', error);
      return 'Unknown File';
    }
  };
  
  // Function to render file preview
  const renderFilePreview = () => {
    if (!activeFile) return null;
    
    const fileType = getFileType(activeFile);
    
    switch (fileType) {
      case 'image':
        return (
          <PreviewContainer>
            <PreviewImage src={activeFile} alt="File preview" />
          </PreviewContainer>
        );
      case 'pdf':
        return (
          <PreviewContainer>
            <iframe 
              src={activeFile} 
              title="PDF document" 
              width="100%" 
              height="100%" 
              style={{ border: 'none' }} 
            />
          </PreviewContainer>
        );
      case 'document':
      case 'spreadsheet':
      case 'presentation':
      case 'text':
        // For office documents, provide a download link or embed if possible
        return (
          <PreviewContainer>
            <UnsupportedPreviewContainer>
              <FileIconLarge>{getFileIcon(activeFile)}</FileIconLarge>
              <p>This file type cannot be previewed directly.</p>
              <PreviewActionButtons>
                <StyledButton 
                  as="a" 
                  href={activeFile} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <FiExternalLink style={{ marginRight: '8px' }} />
                  Open in new tab
                </StyledButton>
                <StyledButton 
                  as="a" 
                  href={activeFile} 
                  download={getFileName(activeFile)}
                >
                  <FiDownload style={{ marginRight: '8px' }} />
                  Download
                </StyledButton>
              </PreviewActionButtons>
            </UnsupportedPreviewContainer>
          </PreviewContainer>
        );
      default:
        // For unsupported files, show download option
        return (
          <PreviewContainer>
            <UnsupportedPreviewContainer>
              <FileIconLarge>{getFileIcon(activeFile)}</FileIconLarge>
              <p>This file type cannot be previewed.</p>
              <PreviewActionButtons>
                <StyledButton 
                  as="a" 
                  href={activeFile} 
                  download={getFileName(activeFile)}
                >
                  <FiDownload style={{ marginRight: '8px' }} />
                  Download
                </StyledButton>
              </PreviewActionButtons>
            </UnsupportedPreviewContainer>
          </PreviewContainer>
        );
    }
  };
  
  // Navigate to next or previous file
  const navigateFile = (direction: 'next' | 'prev') => {
    if (!activeFile || files.length <= 1) return;
    
    const currentIndex = files.indexOf(activeFile);
    
    if (direction === 'next' && currentIndex < files.length - 1) {
      setActiveFile(files[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setActiveFile(files[currentIndex - 1]);
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    navigate('/admin/assignments');
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={handleBack}>
          <FiArrowLeft size={20} />
          <span>Back to Assignments</span>
        </BackButton>
        <Title>{assignment?.title || 'Assignment Files'}</Title>
      </Header>
      
      {isLoading ? (
        <LoadingContainer>
          <div>Loading assignment files...</div>
        </LoadingContainer>
      ) : (
        <ContentContainer>
          {files.length === 0 ? (
            <NoFilesMessage>
              <FiPaperclip size={32} />
              <p>No files are attached to this assignment.</p>
              <BackButton onClick={handleBack}>
                Return to Assignments
              </BackButton>
            </NoFilesMessage>
          ) : (
            <>
              <SidePanel>
                <AssignmentInfo>
                  <InfoItem>
                    <Label>Assignment</Label>
                    <Value>{assignment?.title}</Value>
                  </InfoItem>
                  {assignment?.class_name && (
                    <InfoItem>
                      <Label>Class</Label>
                      <Value>{assignment.class_name}</Value>
                    </InfoItem>
                  )}
                  {assignment?.duedate && (
                    <InfoItem>
                      <Label>Due Date</Label>
                      <Value>{formatDate(assignment.duedate)}</Value>
                    </InfoItem>
                  )}
                  {assignment?.creator_email && (
                    <InfoItem>
                      <Label>Created By</Label>
                      <Value>{assignment.creator_email}</Value>
                    </InfoItem>
                  )}
                </AssignmentInfo>
                
                <FilesContainer>
                  <FilesHeader>Files ({files.length})</FilesHeader>
                  <FilesList>
                    {files.map((file, index) => (
                      <FileItem 
                        key={index}
                        isActive={file === activeFile}
                        onClick={() => setActiveFile(file)}
                      >
                        <FileIcon>{getFileIcon(file)}</FileIcon>
                        <FileName>{getFileName(file)}</FileName>
                      </FileItem>
                    ))}
                  </FilesList>
                </FilesContainer>
              </SidePanel>
              
              <PreviewPanel>
                {activeFile && (
                  <>
                    <PreviewHeader>
                      <div>
                        <PreviewTitle>{getFileName(activeFile)}</PreviewTitle>
                      </div>
                      <PreviewActions>
                        <NavigationButton 
                          disabled={files.indexOf(activeFile!) <= 0}
                          onClick={() => navigateFile('prev')}
                        >
                          <FiChevronLeft size={20} />
                        </NavigationButton>
                        <FileCounter>
                          {files.indexOf(activeFile) + 1} / {files.length}
                        </FileCounter>
                        <NavigationButton 
                          disabled={files.indexOf(activeFile!) >= files.length - 1}
                          onClick={() => navigateFile('next')}
                        >
                          <FiChevronRight size={20} />
                        </NavigationButton>
                        <DownloadButton 
                          as="a"
                          href={activeFile} 
                          download={getFileName(activeFile)}
                        >
                          <FiDownload size={18} />
                          <span>Download</span>
                        </DownloadButton>
                      </PreviewActions>
                    </PreviewHeader>
                    {renderFilePreview()}
                  </>
                )}
              </PreviewPanel>
            </>
          )}
        </ContentContainer>
      )}
    </Container>
  );
};

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  gap: 16px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary[500]};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 0;
  gap: 8px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SidePanel = styled.div`
  width: 320px;
  border-right: 1px solid ${props => props.theme.colors.border.light};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: ${props => props.theme.colors.background.secondary};
  
  @media (max-width: 768px) {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid ${props => props.theme.colors.border.light};
    max-height: 300px;
  }
`;

const AssignmentInfo = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
`;

const InfoItem = styled.div`
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 4px;
`;

const Value = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary};
`;

const FilesContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const FilesHeader = styled.div`
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.secondary};
  background-color: ${props => props.theme.colors.background.tertiary};
`;

const FilesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
`;

const FileItem = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  border-left: 3px solid ${props => props.isActive ? props.theme.colors.primary[500] : 'transparent'};
  background-color: ${props => props.isActive ? props.theme.colors.background.tertiary : 'transparent'};
  
  &:hover {
    background-color: ${props => props.isActive ? props.theme.colors.background.tertiary : props.theme.colors.background.hover};
  }
`;

const FileIcon = styled.div`
  margin-right: 12px;
  color: ${props => props.theme.colors.text.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FileName = styled.div`
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PreviewPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: ${props => props.theme.colors.background.secondary};
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.secondary};
`;

const PreviewTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
`;

const PreviewActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavigationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 4px;
  color: ${props => props.theme.colors.text.primary};
  width: 32px;
  height: 32px;
  cursor: pointer;
  
  &:disabled {
    color: ${props => props.theme.colors.text.tertiary};
    cursor: not-allowed;
  }
  
  &:not(:disabled):hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
`;

const FileCounter = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.text.secondary};
  padding: 0 8px;
`;

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background-color: ${props => props.theme.colors.primary[500]};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary[600]};
  }
`;

const PreviewContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: auto;
  background-color: ${props => props.theme.colors.background.tertiary};
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const UnsupportedPreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  p {
    margin: 16px 0;
    color: ${props => props.theme.colors.text.secondary};
  }
`;

const FileIconLarge = styled.div`
  font-size: 48px;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 16px;
  
  svg {
    width: 48px;
    height: 48px;
  }
`;

const PreviewActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

const StyledButton = styled.button`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.dark};
  border-radius: 4px;
  color: ${props => props.theme.colors.text.primary};
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 32px;
  font-size: 16px;
  color: ${props => props.theme.colors.text.secondary};
`;

const NoFilesMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 32px;
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  
  svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  p {
    margin-bottom: 24px;
    font-size: 16px;
  }
`;

export default AssignmentFiles; 