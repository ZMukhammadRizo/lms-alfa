import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiSearch, FiPlus, FiCalendar, FiClock, FiChevronDown, FiCheck, FiX, FiAlertCircle, FiEdit, FiTrash, FiUsers, FiUploadCloud, FiMail, FiPaperclip, FiDownload, FiFileText, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import supabase, { supabaseAdmin } from '../../config/supabaseClient';
import { toast } from 'react-toastify';

// Interface for Assignment from the database
interface Assignment {
  id: string;
  title: string;
  content: string;
  description?: string;
  instructions?: string;
  classid: string;
  class_name?: string;
  duedate?: string;
  createdat: string;
  createdby?: {
    email?: string;
  };
  creator_email?: string;
  created_at?: string;
  status?: 'Published' | 'Draft' | 'Completed' | 'Grading';
  submissions_count?: number;
  submissions_completed?: number;
  average_score?: number;
  max_score?: number;
  classes?: { classname: string }[] | { classname: string };
  file_url?: string;
}

// Interface for Class
interface Class {
  id: string;
  classname: string;
}

// Interface for User
interface User {
  id: string;
  email: string;
  full_name?: string;
}

// Interface for form data
interface AssignmentFormData {
  title: string;
  content: string;
  classid: string;
  assigned_date: string;
}

// Status tags configuration
const StatusTags = {
  Published: { color: '#e3f2fd', textColor: '#0288d1', icon: FiClock },
  Completed: { color: '#e8f5e9', textColor: '#388e3c', icon: FiCheck },
  Grading: { color: '#fff8e1', textColor: '#ffa000', icon: FiAlertCircle },
  Draft: { color: '#f5f5f5', textColor: '#616161', icon: FiEdit }
};

// New component for Creator Email Badge
const CreatorEmailBadge: React.FC<{ email: string }> = ({ email }) => {
  return (
    <StyledEmailBadge>
      <FiMail style={{ marginRight: '6px' }} />
      {email}
    </StyledEmailBadge>
  );
};

const AdminAssignments: React.FC = () => {
  // State variables
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    content: '',
    classid: '',
    assigned_date: new Date().toISOString().split('T')[0],
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AssignmentFormData, string>>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [editFormData, setEditFormData] = useState<AssignmentFormData>({
    title: '',
    content: '',
    classid: '',
    assigned_date: new Date().toISOString().split('T')[0],
  });
  
  // Add state for file uploads
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [hasUploadedFiles, setHasUploadedFiles] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentAssignmentRef = useRef<string | null>(null);
  
  // Add state for file preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<string[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [previewTitle, setPreviewTitle] = useState('');

  // Fetch assignments and classes
  useEffect(() => {
    fetchAssignments();
    fetchClasses();
  }, []);

  // Fetch assignments from Supabase
  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      // Get information about the assignments table columns
      try {
        console.log("Checking assignments table structure...");
        const { data: tableInfo, error: tableError } = await supabase
          .from('assignments')
          .select('*')
          .limit(1);
          
        if (tableError) {
          console.error('Error fetching table structure:', tableError);
        } else if (tableInfo && tableInfo.length > 0) {
          console.log('Available columns in assignments table:', Object.keys(tableInfo[0]));
        } else {
          console.log('No data found in assignments table to check structure');
        }
      } catch (tableCheckError) {
        console.error('Error during table structure check:', tableCheckError);
      }

      // Fetch all assignments with joined user data
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          createdby:users(email)
        `)
        .order('createdat', { ascending: false });

      // Log the response data and error for debugging
      console.log('Supabase assignments response data:', data);
      if (error) {
        console.error('Supabase assignments query error:', error);
        throw error;
      }

      // If no data is returned, log a message
      if (!data || data.length === 0) {
        console.log('No assignments found in the database');
        setAssignments([]);
        setIsLoading(false);
        return;
      }

      // Process assignments and fetch related data where needed
      console.log('Processing assignments:', data.length, 'items found');
      try {
        const enhancedAssignments = await Promise.all((data || []).map(async (assignment, index) => {
          console.log(`Processing assignment ${index}:`, assignment);
          let className = 'Unknown Class';
          let creatorEmail = 'Unknown';

          // Fetch class information
          if (assignment.classid) {
            try {
              const { data: classData } = await supabase
                .from('classes')
                .select('classname')
                .eq('id', assignment.classid)
                .single();
              
              if (classData) {
                className = classData.classname;
              }
            } catch (e) {
              console.error('Error fetching class:', e);
            }
          }

          // Get creator email from the join result
          if (assignment.createdby && assignment.createdby.email) {
            creatorEmail = assignment.createdby.email;
          } else if (typeof assignment.createdby === 'string') {
            // If createdby is just an ID string, fetch the user
            try {
              const { data: userData } = await supabase
                .from('users')
                .select('email')
                .eq('id', assignment.createdby)
                .single();
              
              if (userData) {
                creatorEmail = userData.email;
              }
            } catch (e) {
              console.error('Error fetching creator:', e);
            }
          }

          // Add mock data for submission stats (can be replaced with real data later)
          const submissionsCount = Math.floor(Math.random() * 30);
          const submissionsCompleted = Math.floor(Math.random() * submissionsCount);
          const averageScore = Math.floor(Math.random() * 100);
          const maxScore = 100;

          // Update hasUploadedFiles state if this assignment has files
          if (assignment.file_url) {
            setHasUploadedFiles(prev => ({ ...prev, [assignment.id]: true }));
          }

          return {
            ...assignment,
            description: assignment.instructions || assignment.content || '',
            class_name: className,
            creator_email: creatorEmail,
            submissions_count: assignment.submissions_count || submissionsCount,
            submissions_completed: assignment.submissions_completed || submissionsCompleted,
            average_score: assignment.average_score || averageScore,
            max_score: assignment.max_score || maxScore
          };
        }));

        setAssignments(enhancedAssignments);
      } catch (error) {
        console.error('Error processing assignments:', error);
        toast.error('Failed to process assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available classes
  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, classname')
        .order('classname');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when field is updated
    if (formErrors[name as keyof AssignmentFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof AssignmentFormData, string>> = {};
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    }

    if (!formData.content.trim()) {
      errors.content = 'Description is required';
      isValid = false;
    }

    if (!formData.classid) {
      errors.classid = 'Class is required';
      isValid = false;
    }

    if (!formData.assigned_date) {
      errors.assigned_date = 'Assignment date is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Get the current user from Supabase auth
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Authentication error:', authError);
        toast.error(`Authentication error: ${authError.message}`);
        return;
      }
      
      if (!authData.user) {
        console.error('No authenticated user found');
        toast.error('Authentication error: No user found. Please sign in again.');
        return;
      }
      
      // Format assigned_date to ISO string for duedate field
      let dueDate;
      try {
        // The datetime-local input returns a string in the format "YYYY-MM-DDThh:mm"
        // We need to ensure it's a proper ISO string
        const dateTimeValue = formData.assigned_date;
        const date = new Date(dateTimeValue);
        
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format');
        }
        
        dueDate = date.toISOString();
        console.log('Formatted duedate for submission:', dueDate);
      } catch (dateError) {
        console.error('Date formatting error:', dateError);
        toast.error('Invalid date format. Please select a valid date and time.');
        return;
      }
      
      // Get information about the assignments table columns
      try {
        console.log("Checking assignments table structure...");
        const { data: tableInfo, error: tableError } = await supabase
          .from('assignments')
          .select('*')
          .limit(1);
          
        if (tableError) {
          console.error('Error fetching table structure:', tableError);
        } else if (tableInfo && tableInfo.length > 0) {
          console.log('Available columns in assignments table:', Object.keys(tableInfo[0]));
        } else {
          console.log('No data found in assignments table to check structure');
        }
      } catch (tableCheckError) {
        console.error('Error during table structure check:', tableCheckError);
      }
      
      // Fix: Use 'instructions' instead of 'content' based on the error message
      const submissionData = {
        title: formData.title,
        instructions: formData.content, // Map form content to instructions field
        classid: formData.classid,
        duedate: dueDate,
        createdby: authData.user.id
      };

      console.log('Submitting assignment data:', submissionData);
      console.log('User ID being used for createdby:', authData.user.id);

      // Insert new assignment with verbose error handling
      const { data, error } = await supabase
        .from('assignments')
        .insert([submissionData])
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        toast.error(`Failed to add assignment: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        console.error('No data returned from insert operation');
        toast.error('Assignment was not created properly. Please try again.');
        return;
      }

      console.log('Inserted assignment data:', data[0]);

      // Find the class name for the new assignment
      const classObj = classes.find(c => c.id === formData.classid);
      
      // Map the database fields to the display fields
      const assignmentForDisplay = {
        ...data[0],
        description: data[0].instructions, // Use instructions for description
        class_name: classObj?.classname || 'Unknown Class',
        creator_email: authData.user.email || 'Current User' // Use email for display
      };
      
      // Add the new assignment to the state
      setAssignments(prev => [
        assignmentForDisplay,
        ...prev
      ]);

      // Reset form and close modal
      setFormData({
        title: '',
        content: '',
        classid: '',
        assigned_date: new Date().toISOString().split('T')[0],
      });
      setShowModal(false);
      toast.success('Assignment added successfully!');
      
    } catch (error) {
      console.error('Error adding assignment:', error);
      let errorMessage = 'Failed to add assignment';
      if (error instanceof Error) {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      toast.error(errorMessage);
    }
  };

  // Handle edit button click
  const handleEditClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setEditFormData({
      title: assignment.title,
      content: assignment.instructions || assignment.content,
      classid: assignment.classid,
      assigned_date: assignment.duedate ? new Date(assignment.duedate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setShowEditModal(true);
  };

  // Handle edit form changes
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAssignment) return;

    try {
      // Format assigned_date to ISO string for duedate field
      let dueDate;
      try {
        dueDate = new Date(editFormData.assigned_date).toISOString();
        console.log('Formatted duedate for update:', dueDate);
      } catch (dateError) {
        console.error('Date formatting error:', dateError);
        toast.error('Invalid date format. Please select a valid date.');
        return;
      }
      
      // Format the update data with correct column names
      const updateData = {
        title: editFormData.title,
        instructions: editFormData.content, // Map form content to instructions field
        classid: editFormData.classid,
        duedate: dueDate
      };

      console.log('Updating assignment data:', updateData);
      console.log('Assignment ID being updated:', selectedAssignment.id);

      // Update assignment with better error handling
      const { data, error } = await supabase
        .from('assignments')
        .update(updateData)
        .eq('id', selectedAssignment.id)
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        toast.error(`Failed to update assignment: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        console.error('No data returned from update operation');
        toast.error('Assignment was not updated properly. Please try again.');
        return;
      }

      console.log('Updated assignment data:', data[0]);

      // Find the class name for the updated assignment
      const classObj = classes.find(c => c.id === editFormData.classid);
      
      // Update assignments state
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === selectedAssignment.id 
            ? {
                ...assignment,
                ...data[0],
                description: data[0].instructions, // Use instructions for description
                class_name: classObj?.classname || assignment.class_name || 'Unknown Class',
              }
            : assignment
        )
      );

      // Close modal
      setShowEditModal(false);
      setSelectedAssignment(null);
      toast.success('Assignment updated successfully!');
    } catch (error) {
      console.error('Error updating assignment:', error);
      let errorMessage = 'Failed to update assignment';
      if (error instanceof Error) {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      toast.error(errorMessage);
    }
  };

  // Handle delete button click
  const handleDeleteClick = async (assignment: Assignment) => {
    // Show confirmation before deleting
    if (window.confirm(`Are you sure you want to delete the assignment "${assignment.title}"?`)) {
      try {
        console.log('Attempting to delete assignment with ID:', assignment.id);
        
        const { error } = await supabase
          .from('assignments')
          .delete()
          .eq('id', assignment.id);

        if (error) {
          console.error('Supabase error details:', error);
          
          // Show the specific error message from Supabase
          const errorMessage = error.message || 'Unknown database error';
          const errorDetails = error.details || '';
          const errorCode = error.code || '';
          
          console.error(`Error code: ${errorCode}, Message: ${errorMessage}, Details: ${errorDetails}`);
          
          toast.error(`Failed to delete assignment: ${errorMessage}`);
          return;
        }

        // Update assignments state
        setAssignments(prev => prev.filter(a => a.id !== assignment.id));
        
        toast.success(`Assignment "${assignment.title}" deleted successfully!`);
        console.log('Assignment deleted successfully');
      } catch (error) {
        console.error('Error deleting assignment:', error);
        
        // More detailed error reporting
        let errorMessage = 'Failed to delete assignment';
        if (error instanceof Error) {
          errorMessage = `${errorMessage}: ${error.message}`;
          console.error('Error stack:', error.stack);
        }
        
        toast.error(errorMessage);
      }
    } else {
      console.log('Deletion cancelled by user');
      toast.info('Deletion cancelled');
    }
  };

  // Filter assignments based on search term
  const filteredAssignments = assignments.filter(assignment => 
    (assignment.title && assignment.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (assignment.class_name && assignment.class_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (assignment.content && assignment.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (assignment.description && assignment.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format date for display with time
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    
    try {
      console.log('Formatting date and time:', dateString);
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date value:', dateString);
        return 'N/A';
      }
      
      // Format with date and time in a more readable format
      const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
      
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      return `${formattedDate} • ${formattedTime}`;
    } catch (error) {
      console.error('Error formatting date:', error, 'for value:', dateString);
      return 'N/A';
    }
  };

  // Add file upload functions
  
  // Function to handle file upload
  const handleFileUpload = async (assignmentId: string, files: FileList) => {
    if (!files || files.length === 0) {
      console.log('No files selected for upload');
      return;
    }

    console.log(`Starting upload process for ${files.length} file(s) for assignment ${assignmentId}`);
    
    // Set uploading state for this assignment
    setUploading(prev => ({ ...prev, [assignmentId]: true }));

    try {
      // Check if assignment already has files
      let existingUrls: string[] = [];
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('file_url')
        .eq('id', assignmentId)
        .single();
        
      if (!assignmentError && assignmentData && assignmentData.file_url) {
        // Parse existing file URLs
        existingUrls = assignmentData.file_url.split(',').filter((url: string) => url.trim() !== '');
        console.log('Existing file URLs:', existingUrls);
      }
      
      const fileUrls: string[] = [...existingUrls]; // Start with existing URLs
      
      // Check if the lms bucket exists first
      try {
        const { data: buckets, error: bucketListError } = await supabaseAdmin.storage
          .listBuckets();
          
        if (bucketListError) {
          console.error('Error listing buckets:', bucketListError);
          throw bucketListError;
        }
        
        const lmsBucketExists = buckets.some(bucket => bucket.name === 'lms');
        console.log('Does lms bucket exist?', lmsBucketExists);
        
        if (!lmsBucketExists) {
          console.log('LMS bucket does not exist, attempting to create it...');
          const { data, error } = await supabaseAdmin.storage.createBucket('lms', {
            public: true,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
          });
          
          if (error) {
            console.error('Failed to create lms bucket:', error);
            throw new Error(`Failed to create storage bucket: ${error.message}`);
          }
          
          console.log('Created lms bucket successfully:', data);
        }
      } catch (bucketCheckError) {
        console.error('Error during bucket check:', bucketCheckError);
        toast.error('Storage system error. Please contact administrator.');
        setUploading(prev => ({ ...prev, [assignmentId]: false }));
        return;
      }

      // Create assignments folder if it doesn't exist
      const assignmentsFolder = 'assignments/';
      try {
        const { data: folderCheck } = await supabaseAdmin.storage
          .from('lms')
          .list(assignmentsFolder);
        
        console.log('Assignments folder check:', folderCheck);
      } catch (folderError) {
        console.log('Assignments folder might not exist, will be created automatically');
      }

      // Upload each file to Supabase storage
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Preparing to upload file: ${file.name}, size: ${file.size}, type: ${file.type}`);
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${assignmentId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        // Use assignments folder inside lms bucket
        const filePath = `assignments/${fileName}`;

        console.log(`Generated file path: ${filePath} in bucket 'lms'`);

        // Upload to Supabase Storage in the lms bucket
        console.log('Uploading file to Supabase storage in lms bucket...');
        const { data, error } = await supabaseAdmin.storage
          .from('lms')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (error) {
          console.error('Error during upload:', error);
          console.error('Error details:', error.message, error.stack);
          throw error;
        }

        console.log('File uploaded successfully, data:', data);

        // Get public URL from the lms bucket
        const { data: urlData } = supabaseAdmin.storage
          .from('lms')
          .getPublicUrl(filePath);

        if (urlData) {
          console.log('Generated public URL:', urlData.publicUrl);
          fileUrls.push(urlData.publicUrl);
        } else {
          console.error('Failed to generate public URL for uploaded file');
        }
      }

      // Join URLs with comma if multiple files
      const fileUrl = fileUrls.join(',');
      console.log('Final file URLs to save:', fileUrl);

      // Update the assignment's file_url in the database
      console.log('Updating assignment record with file URLs...');
      const { data: updateData, error: updateError } = await supabase
        .from('assignments')
        .update({ file_url: fileUrl })
        .eq('id', assignmentId)
        .select();

      if (updateError) {
        console.error('Error updating assignment record:', updateError);
        throw updateError;
      }

      console.log('Assignment record updated successfully:', updateData);

      // Update local state to show the file has been uploaded
      setHasUploadedFiles(prev => ({ ...prev, [assignmentId]: true }));

      // Success message
      toast.success(`${files.length} file(s) uploaded successfully!`);

      // Refresh assignments to get the updated data
      fetchAssignments();

    } catch (error) {
      console.error('Error in file upload process:', error);
      if (error instanceof Error) {
        toast.error(`Upload failed: ${error.message}`);
      } else {
        toast.error('Failed to upload files');
      }
    } finally {
      // Reset uploading state
      setUploading(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  // Helper function to trigger file input click
  const openFileSelector = (assignmentId: string) => {
    console.log('Opening file selector for assignment ID:', assignmentId);
    currentAssignmentRef.current = assignmentId;
    
    // Ensure file input exists
    if (!fileInputRef.current) {
      console.error('File input reference is not available');
      toast.error('Could not open file selector. Please try again.');
      return;
    }
    
    // Trigger click with a small delay to ensure state is updated
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 50);
  };

  // Handle file selection
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File selection triggered:', e);
    const files = e.target.files;
    const assignmentId = currentAssignmentRef.current;
    
    // Clear the input right away to allow re-selection of the same file
    if (fileInputRef.current) {
      // Store the files in a variable before clearing the input
      const selectedFiles = files ? Array.from(files) : null;
      fileInputRef.current.value = '';
      
      if (!assignmentId) {
        console.error('No assignment ID set for file upload');
        toast.error('Error: Unable to determine which assignment to upload files for');
        return;
      }
      
      if (!selectedFiles || selectedFiles.length === 0) {
        console.log('No files selected');
        toast.info('No files were selected for upload');
        return;
      }
      
      console.log(`Processing ${selectedFiles.length} files for assignment ${assignmentId}`);
      
      // Check for file size limits
      let totalSize = 0;
      let oversizedFiles: string[] = [];
      
      for (const file of selectedFiles) {
        totalSize += file.size;
        
        // Check individual file size (20MB limit)
        if (file.size > 20 * 1024 * 1024) {
          oversizedFiles.push(file.name);
        }
      }
      
      // Check if any individual files are too large
      if (oversizedFiles.length > 0) {
        console.error('Some files exceed size limit:', oversizedFiles);
        toast.error(`Some files are too large (max 20MB per file): ${oversizedFiles.join(', ')}`);
        return;
      }
      
      // Check total upload size (50MB limit)
      if (totalSize > 50 * 1024 * 1024) {
        console.error('Total upload size exceeds limit:', totalSize);
        toast.error('Total upload size exceeds 50MB limit. Please select fewer files.');
        return;
      }
      
      // Convert FileList to regular array and create a new FileList-like object
      const transferList = new DataTransfer();
      for (const file of selectedFiles) {
        transferList.items.add(file);
      }
      
      // Proceed with upload
      handleFileUpload(assignmentId, transferList.files);
    } else {
      console.error('File input reference lost');
      toast.error('Upload failed: Could not process selected files');
    }
  };

  // Function to open file preview modal
  const openFilePreview = (assignment: Assignment) => {
    if (!assignment.file_url) {
      console.log('No files to preview for this assignment');
      toast.info('No files have been uploaded for this assignment');
      return;
    }
    
    console.log('Opening file preview for URLs:', assignment.file_url);
    const files = assignment.file_url.split(',').filter((url: string) => url.trim() !== '');
    
    // Validate URLs
    if (files.length === 0 || !files[0].trim()) {
      console.error('Invalid file URLs:', files);
      toast.error('Unable to preview files: Invalid URLs');
      return;
    }
    
    setPreviewFiles(files);
    setCurrentFileIndex(0);
    setPreviewTitle(assignment.title || 'File Preview');
    setShowPreviewModal(true);
  };

  // Function to determine file type
  const getFileType = (url: string): 'image' | 'pdf' | 'other' => {
    try {
      if (!url) return 'other';
      
      // Extract file extension
      const ext = url.split('.').pop()?.toLowerCase();
      console.log('File extension detected:', ext);
      
      if (!ext) return 'other';
      
      // Check image types
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
        return 'image';
      }
      
      // Check PDF
      if (ext === 'pdf') {
        return 'pdf';
      }
      
      // Default to other
      return 'other';
    } catch (error) {
      console.error('Error determining file type:', error);
      return 'other';
    }
  };

  // Function to navigate between files in preview
  const navigatePreview = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentFileIndex < previewFiles.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
    } else if (direction === 'prev' && currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
    }
  };

  return (
    <PageContainer>
      <Header>
        <TitleSection>
          <Title>Assignments</Title>
          <Description>Manage all assignments across classes</Description>
        </TitleSection>
        <ActionSection>
          <SearchContainer>
            <SearchIcon>
              <FiSearch size={18} />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </SearchContainer>
          <AddButton onClick={() => setShowModal(true)}>
            <FiPlus size={20} />
            <span>Add Assignment</span>
          </AddButton>
        </ActionSection>
      </Header>

      <ContentSection>
        {isLoading ? (
          <LoadingContainer>
            <LoadingSpinner />
            <p>Loading assignments...</p>
          </LoadingContainer>
        ) : filteredAssignments.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon>
              <FiClock size={40} />
            </EmptyStateIcon>
            <EmptyStateTitle>No Assignments Found</EmptyStateTitle>
            <EmptyStateDescription>
              {searchTerm ? 'No assignments match your search criteria.' : 'Start by adding a new assignment.'}
            </EmptyStateDescription>
            {!searchTerm && (
              <AddButton onClick={() => setShowModal(true)}>
                <FiPlus size={20} />
                <span>Add Assignment</span>
              </AddButton>
            )}
          </EmptyState>
        ) : (
          <AssignmentsTable>
            <TableHead>
              <TableRow>
                <TableHeader>Assignment</TableHeader>
                <TableHeader>Course</TableHeader>
                <TableHeader style={{ cursor: 'pointer' }}>
                  Due Date <FiChevronDown size={16} style={{ verticalAlign: 'middle' }} />
                </TableHeader>
                <TableHeader>Creator Email</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssignments.map((assignment) => {
                return (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <AssignmentInfo>
                        <DocumentIcon>
                          <FiCalendar size={24} color="#4299e1" />
                        </DocumentIcon>
                        <div>
                          <AssignmentTitle>{assignment.title}</AssignmentTitle>
                          <AssignmentDescription>{assignment.description}</AssignmentDescription>
                        </div>
                      </AssignmentInfo>
                    </TableCell>
                    <TableCell>
                      <CourseTag>{assignment.class_name}</CourseTag>
                    </TableCell>
                    <TableCell>
                      <DateDisplay>
                        <FiCalendar size={16} style={{ marginRight: '8px' }} />
                        {formatDate(assignment.duedate)}
                      </DateDisplay>
                    </TableCell>
                    <TableCell>
                      <CreatorEmailBadge email={assignment.creator_email || 'Unknown'} />
                    </TableCell>
                    <TableCell>
                      <ActionButtons>
                        <ActionButton title="Edit" onClick={() => handleEditClick(assignment)}>
                          <FiEdit size={18} />
                        </ActionButton>
                        <ActionButton 
                          title="Delete" 
                          variant="danger" 
                          onClick={() => handleDeleteClick(assignment)}
                        >
                          <FiTrash size={18} />
                        </ActionButton>
                        <ActionButton 
                          title="View Uploads" 
                          variant="secondary"
                          onClick={() => {
                            if (!assignment.file_url) {
                              toast.info('No files uploaded for this assignment');
                              return;
                            }
                            // Navigate to the assignment files page
                            window.location.href = `/admin/assignments/files/${assignment.id}`;
                          }}
                          disabled={!assignment.file_url}
                          style={{ 
                            opacity: !assignment.file_url ? 0.5 : 1 
                          }}
                        >
                          <FiPaperclip />
                        </ActionButton>
                        <ActionButton
                          title="Upload Files"
                          variant="primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openFileSelector(assignment.id);
                          }}
                          disabled={uploading[assignment.id]}
                          style={{
                            opacity: uploading[assignment.id] ? 0.7 : 1,
                            position: 'relative'
                          }}
                        >
                          {uploading[assignment.id] ? (
                            <Spinner />
                          ) : (
                            <>
                              <FiUploadCloud />
                              {(hasUploadedFiles[assignment.id] || assignment.file_url) && (
                                <FileIndicator>
                                  <FiPaperclip size={10} />
                                </FileIndicator>
                              )}
                            </>
                          )}
                        </ActionButton>
                      </ActionButtons>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </AssignmentsTable>
        )}
      </ContentSection>

      {/* Add Assignment Modal */}
      {showModal && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ModalContent
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <ModalHeader>
              <ModalTitle>Add New Assignment</ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>
                <FiX size={24} />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Enter assignment title"
                  />
                  {formErrors.title && <ErrorMessage>{formErrors.title}</ErrorMessage>}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="content">Description</Label>
                  <TextArea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleFormChange}
                    placeholder="Enter assignment description"
                    rows={3}
                  />
                  {formErrors.content && <ErrorMessage>{formErrors.content}</ErrorMessage>}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="classid">Class</Label>
                  <Select
                    id="classid"
                    name="classid"
                    value={formData.classid}
                    onChange={handleFormChange}
                  >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.classname}
                      </option>
                    ))}
                  </Select>
                  {formErrors.classid && <ErrorMessage>{formErrors.classid}</ErrorMessage>}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="assigned_date">Due Date & Time</Label>
                  <Input
                    type="datetime-local"
                    id="assigned_date"
                    name="assigned_date"
                    value={formData.assigned_date}
                    onChange={handleFormChange}
                  />
                  {formErrors.assigned_date && <ErrorMessage>{formErrors.assigned_date}</ErrorMessage>}
                </FormGroup>

                <ButtonGroup>
                  <CancelButton type="button" onClick={() => setShowModal(false)}>
                    Cancel
                  </CancelButton>
                  <SubmitButton type="submit">
                    <FiCheck size={18} />
                    <span>Add Assignment</span>
                  </SubmitButton>
                </ButtonGroup>
              </Form>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && selectedAssignment && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ModalContent
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <ModalHeader>
              <ModalTitle>Edit Assignment</ModalTitle>
              <CloseButton onClick={() => setShowEditModal(false)}>
                <FiX size={24} />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <Form onSubmit={handleEditSubmit}>
                <FormGroup>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    type="text"
                    id="edit-title"
                    name="title"
                    value={editFormData.title}
                    onChange={handleEditFormChange}
                    placeholder="Enter assignment title"
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="edit-content">Description</Label>
                  <TextArea
                    id="edit-content"
                    name="content"
                    value={editFormData.content}
                    onChange={handleEditFormChange}
                    placeholder="Enter assignment description"
                    rows={3}
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="edit-classid">Class</Label>
                  <Select
                    id="edit-classid"
                    name="classid"
                    value={editFormData.classid}
                    onChange={handleEditFormChange}
                  >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.classname}
                      </option>
                    ))}
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="edit-assigned_date">Due Date & Time</Label>
                  <Input
                    type="datetime-local"
                    id="edit-assigned_date"
                    name="assigned_date"
                    value={editFormData.assigned_date}
                    onChange={handleEditFormChange}
                  />
                </FormGroup>

                <ButtonGroup>
                  <CancelButton type="button" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </CancelButton>
                  <SubmitButton type="submit">
                    <FiCheck size={18} />
                    <span>Save Changes</span>
                  </SubmitButton>
                </ButtonGroup>
              </Form>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Hidden file input - now with multiple attribute */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelection}
        multiple
      />

      {/* File Preview Modal */}
      {showPreviewModal && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <PreviewModalContent>
            <ModalHeader>
              <div>
                <ModalTitle>{previewTitle}</ModalTitle>
                <FileCounter>
                  File {currentFileIndex + 1} of {previewFiles.length}
                </FileCounter>
              </div>
              <PreviewControls>
                <NavigationButton 
                  onClick={() => navigatePreview('prev')}
                  disabled={currentFileIndex === 0}
                >
                  <FiChevronLeft size={24} />
                </NavigationButton>
                <NavigationButton 
                  onClick={() => navigatePreview('next')}
                  disabled={currentFileIndex === previewFiles.length - 1}
                >
                  <FiChevronRight size={24} />
                </NavigationButton>
                <CloseButton onClick={() => setShowPreviewModal(false)}>
                  <FiX size={24} />
                </CloseButton>
              </PreviewControls>
            </ModalHeader>
            <PreviewContainer>
              {previewFiles.length > 0 && (() => {
                const currentFile = previewFiles[currentFileIndex];
                const fileType = getFileType(currentFile);
                
                switch (fileType) {
                  case 'image':
                    return <img src={currentFile} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />;
                  case 'pdf':
                    return (
                      <iframe 
                        src={currentFile} 
                        title="PDF preview" 
                        width="100%" 
                        height="100%" 
                        style={{ border: 'none', minHeight: '80vh' }}
                      />
                    );
                  default:
                    return (
                      <UnsupportedPreview>
                        <FiFileText size={64} />
                        <p>This file type cannot be previewed</p>
                        <DownloadButton 
                          as="a" 
                          href={currentFile} 
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FiDownload size={16} />
                          <span>Download File</span>
                        </DownloadButton>
                      </UnsupportedPreview>
                    );
                }
              })()}
            </PreviewContainer>
          </PreviewModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const TitleSection = styled.div`
  margin-right: 1rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: ${props => props.theme.colors?.text?.primary || '#333'};
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.colors?.text?.secondary || '#666'};
  margin: 0;
`;

const ActionSection = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  width: 300px;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors?.text?.tertiary || '#999'};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.625rem 0.75rem 0.625rem 2.5rem;
  font-size: 0.875rem;
  border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
  border-radius: 0.5rem;
  outline: none;
  
  &:focus {
    border-color: ${props => props.theme.colors?.primary[500] || '#3498db'};
    box-shadow: 0 0 0 2px ${props => props.theme.colors?.primary[100] || 'rgba(52, 152, 219, 0.2)'};
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background-color: ${props => props.theme.colors?.primary[500] || '#3498db'};
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors?.primary[600] || '#2980b9'};
  }
`;

const ContentSection = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: ${props => props.theme.colors?.text?.secondary || '#666'};
  
  p {
    margin-top: 1rem;
  }
`;

const LoadingSpinner = styled.div`
  width: 2rem;
  height: 2rem;
  border: 3px solid ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
  border-top: 3px solid ${props => props.theme.colors?.primary[500] || '#3498db'};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
`;

const EmptyStateIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
  color: ${props => props.theme.colors?.text?.tertiary || '#999'};
  margin-bottom: 1.5rem;
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 500;
  margin: 0 0 0.75rem;
  color: ${props => props.theme.colors?.text?.primary || '#333'};
`;

const EmptyStateDescription = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.colors?.text?.secondary || '#666'};
  margin: 0 0 1.5rem;
  max-width: 400px;
`;

const AssignmentsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background-color: ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.colors?.border?.light || '#E2E8F0'};
  }
  
  &:hover {
    background-color: ${props => props.theme.colors?.background?.hover || '#F7FAFC'};
  }
`;

const TableHeader = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  color: ${props => props.theme.colors?.text?.secondary || '#4A5568'};
  background-color: #F8F9FA;
  border-bottom: 2px solid #E2E8F0;
`;

const TableCell = styled.td`
  padding: 1rem;
  font-size: 0.875rem;
  color: ${props => props.theme.colors?.text?.primary || '#333'};
  vertical-align: middle;
`;

const AssignmentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const DocumentIcon = styled.div`
  width: 40px;
  height: 40px;
  background-color: #ebf8ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AssignmentTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: #2d3748;
`;

const AssignmentDescription = styled.p`
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: #718096;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 300px;
`;

const CourseTag = styled.span`
  display: inline-block;
  background-color: #ebf8ff;
  color: #3182ce;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
`;

const DateDisplay = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  color: #4a5568;
  font-size: 0.875rem;
`;

const StyledEmailBadge = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f0f7ff;
  color: #2271b1;
  font-size: 0.85rem;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Modal Components
const ModalOverlay = styled(motion.div)`
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
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background-color: white;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors?.text?.primary || '#333'};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.colors?.text?.tertiary || '#999'};
  transition: color 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors?.text?.secondary || '#666'};
  }
`;

const ModalBody = styled.div`
  padding: 1.25rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors?.text?.primary || '#333'};
`;

const Input = styled.input`
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
  border-radius: 0.375rem;
  outline: none;
  
  &:focus {
    border-color: ${props => props.theme.colors?.primary[500] || '#3498db'};
    box-shadow: 0 0 0 2px ${props => props.theme.colors?.primary[100] || 'rgba(52, 152, 219, 0.2)'};
  }
`;

const TextArea = styled.textarea`
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
  border-radius: 0.375rem;
  resize: vertical;
  min-height: 80px;
  outline: none;
  
  &:focus {
    border-color: ${props => props.theme.colors?.primary[500] || '#3498db'};
    box-shadow: 0 0 0 2px ${props => props.theme.colors?.primary[100] || 'rgba(52, 152, 219, 0.2)'};
  }
`;

const Select = styled.select`
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
  border-radius: 0.375rem;
  background-color: white;
  outline: none;
  
  &:focus {
    border-color: ${props => props.theme.colors?.primary[500] || '#3498db'};
    box-shadow: 0 0 0 2px ${props => props.theme.colors?.primary[100] || 'rgba(52, 152, 219, 0.2)'};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const CancelButton = styled.button`
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors?.text?.primary || '#333'};
  background-color: white;
  border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background-color: ${props => props.theme.colors?.primary[500] || '#3498db'};
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors?.primary[600] || '#2980b9'};
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors?.danger[500] || '#e74c3c'};
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &::before {
    content: "•";
    color: inherit;
  }
`;

// Action buttons
const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ variant?: 'danger' | 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background-color: ${props => 
    props.variant === 'danger' ? '#FEE2E2' :
    props.variant === 'primary' ? '#E6F6FF' :
    props.variant === 'secondary' ? '#F1F5F9' : 
    '#F9FAFB'
  };
  color: ${props => 
    props.variant === 'danger' ? '#DC2626' :
    props.variant === 'primary' ? '#0EA5E9' :
    props.variant === 'secondary' ? '#475569' :
    '#718096'
  };
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => 
      props.variant === 'danger' ? '#FCA5A5' :
      props.variant === 'primary' ? '#BAE6FD' :
      props.variant === 'secondary' ? '#CBD5E1' :
      '#E2E8F0'
    };
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

// Add a CSS spinner for loading state
const Spinner = styled.div`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 2px solid #fff;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
`;

// Add a file indicator for assignments with uploaded files
const FileIndicator = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #10b981;
  color: white;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
`;

// Add styled components for file preview
const PreviewContainer = styled.div`
  padding: 20px;
  overflow: auto;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f7fafc;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
`;

const PreviewFrame = styled.iframe`
  width: 100%;
  height: 60vh;
  border: none;
`;

const PreviewFallback = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #666;
`;

const PreviewLink = styled.a`
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: #0ea5e9;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
  
  &:hover {
    background-color: #0284c7;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
  }
`;

const PreviewNote = styled.div`
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #666;
  font-style: italic;
  max-width: 400px;
  text-align: center;
`;

const FileNavigation = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  gap: 1rem;
`;

const FileNavButton = styled.button<{ disabled?: boolean }>`
  background-color: ${props => props.disabled 
    ? '#f0f0f0'
    : '#f8f8f8'};
  color: ${props => props.disabled 
    ? '#999'
    : '#333'};
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  
  &:hover:not(:disabled) {
    background-color: #f0f0f0;
  }
`;

const FileInfo = styled.div`
  flex: 1;
  text-align: center;
  font-size: 0.875rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 1rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
`;

const SecondaryButton = styled.button`
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors?.text?.primary || '#333'};
  background-color: white;
  border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

// Add Modal component at the beginning of styled components section
const Modal = styled.div`
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

const FileCounter = styled.div`
  font-size: 14px;
  color: #718096;
  margin-top: 4px;
`;

const PreviewModalContent = styled(motion.div)`
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
`;

const UnsupportedPreview = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #4a5568;
  text-align: center;
  
  svg {
    margin-bottom: 16px;
    color: #3182ce;
  }
  
  p {
    margin-bottom: 24px;
  }
`;

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #3182ce;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2c5282;
  }
`;

const PreviewControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavigationButton = styled.button<{ disabled?: boolean }>`
  background-color: ${props => props.disabled ? '#e2e8f0' : '#edf2f7'};
  color: ${props => props.disabled ? '#a0aec0' : '#4a5568'};
  border: none;
  border-radius: 4px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.disabled ? '#e2e8f0' : '#e2e8f0'};
  }
`;

export default AdminAssignments;