import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import {
	FiArrowLeft,
	FiClock,
	FiEdit2,
	FiFile,
	FiFileText,
	FiPlus,
	FiSearch,
	FiTrash2,
	FiUpload,
	FiVideo,
	FiX,
} from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import supabase from '../../config/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

// Interface definitions
interface Subject {
	id: string
	subjectname: string
	code: string
	description: string
	status: 'active' | 'inactive'
}

interface Lesson {
	id: string
	lessonname: string
	description: string
	videourl: string
	fileurls: string[]
	duration: string
	subjectid: string
	teacherid: string
}

interface Teacher {
	id: string
	firstName: string
	lastName: string
}

// Helper Functions need to be defined or imported if not already present in this file
// Assuming getFileNameFromUrl is defined similar to TeacherLessonDetails.tsx
const getFileNameFromUrl = (url: string): string => {
	try {
		const parsedUrl = new URL(url);
		const pathSegments = parsedUrl.pathname.split('/');
		const encodedFileName = pathSegments[pathSegments.length - 1];
		try {
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

// Add definitions for missing styled components
const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const FormLabel = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.secondary};
`;

const FormInput = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid ${props => props.theme.colors.neutral[300]};
	border-radius: 0.5rem;
	font-size: 1rem;
	box-sizing: border-box; // Ensure padding doesn't increase size

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[400]};
		box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
	}
`;

const FormTextarea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid ${props => props.theme.colors.neutral[300]};
	border-radius: 0.5rem;
	font-size: 1rem;
	min-height: 80px;
	box-sizing: border-box;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[400]};
		box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
	}
`;

const FormSelect = styled.select`
    width: 100%;
    padding: 0.75rem;
    border: 1px solid ${props => props.theme.colors.neutral[300]};
    border-radius: 0.5rem;
    font-size: 1rem;
    background-color: white;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: ${props => props.theme.colors.primary[400]};
        box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
    }
`;

const FormHelp = styled.p`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-top: 0.5rem;
`;

const FileUploadContainer = styled.div`
	margin-top: 1rem;
`;

const FileUploadLabel = styled.label`
	display: inline-block; // Changed from flex to inline-block for button
	cursor: pointer;
`;

const UploadButton = styled.button`
	display: inline-flex; // Use inline-flex
	align-items: center;
	gap: 0.5rem;
	padding: 0.6rem 1rem;
	background-color: ${props => props.theme.colors.neutral[100]};
	color: ${props => props.theme.colors.text.secondary};
	border: 1px solid ${props => props.theme.colors.neutral[300]};
	border-radius: 0.5rem;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background-color: ${props => props.theme.colors.neutral[200]};
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const UploadedFilesList = styled.div`
	margin-top: 1rem;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const UploadedFileItem = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.5rem 0.75rem;
	background-color: ${props => props.theme.colors.neutral[50]};
	border-radius: 0.375rem;
`;

const UploadedFileName = styled.a`
	color: ${props => props.theme.colors.primary[600]};
	text-decoration: none;
	font-size: 0.9rem;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin-right: 0.5rem; // Add margin to prevent overlap with button

	&:hover {
		text-decoration: underline;
	}
`;

const RemoveFileButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	border: none;
	background-color: transparent;
	color: ${props => props.theme.colors.neutral[500]};
	cursor: pointer;
	flex-shrink: 0; // Prevent button from shrinking

	&:hover {
		background-color: ${props => props.theme.colors.neutral[100]};
		color: ${props => props.theme.colors.error[600]};
	}
`;

const ButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
	margin-top: 2rem;
	padding-top: 1.5rem;
	border-top: 1px solid ${props => props.theme.colors.neutral[200]};
`;

const CancelButton = styled.button`
	padding: 0.75rem 1.25rem;
	background-color: white;
	color: ${props => props.theme.colors.text.secondary};
	border: 1px solid ${props => props.theme.colors.neutral[300]};
	border-radius: 0.5rem;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.neutral[50]};
	}
`;

const SubmitButton = styled.button`
	padding: 0.75rem 1.25rem;
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.primary[700]};
	}
`;

// Function to extract storage path from URL
const getStoragePathFromUrl = (url: string, bucketName: string): string | null => {
	try {
		const urlObject = new URL(url);
		const pathSegments = urlObject.pathname.split('/');
		// Find the segment matching the bucket name
		const bucketIndex = pathSegments.findIndex(segment => segment === bucketName);
		if (bucketIndex > -1 && pathSegments.length > bucketIndex + 1) {
			// Join the segments *after* the bucket name
			const storagePath = pathSegments.slice(bucketIndex + 1).join('/');
			return decodeURIComponent(storagePath); // Decode potential URI encoding
		}
		console.warn(`Could not extract path after bucket "${bucketName}" from URL: ${url}`);
		return null;
	} catch (e) {
		console.error(`Error parsing URL for storage path: ${url}`, e);
		return null;
	}
};

const LessonsManagePage: React.FC = () => {
	const { subjectId } = useParams<{ subjectId: string }>()
	const navigate = useNavigate()
	const { user } = useAuth()
	const [subject, setSubject] = useState<Subject | null>(null)
	const [lessons, setLessons] = useState<Lesson[]>([])
	const [teachers, setTeachers] = useState<Teacher[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [showAddModal, setShowAddModal] = useState(false)
	const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
	const [uploadingFiles, setUploadingFiles] = useState(false)
	const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([])

	const [formData, setFormData] = useState({
		lessonname: '',
		description: '',
		videourl: '',
		duration: '',
		teacherid: '',
	})

	// Check if user is a module leader
	useEffect(() => {
		const checkModuleLeader = async () => {
			if (!user) {
				navigate('/login')
				return
			}

			// Check if user is a module leader
			if (!user.isModuleLeader) {
				toast.error('You do not have permission to access this page')
				navigate('/admin/dashboard')
			}
		}

		checkModuleLeader()
	}, [user, navigate])

	// Fetch subject, lessons, and teachers
	useEffect(() => {
		if (!subjectId) {
			toast.error('Subject ID is missing.')
			navigate('/admin/subjects')
			return
		}

		const fetchData = async () => {
			setIsLoading(true)
			try {
				// Fetch subject
				const { data: subjectData, error: subjectError } = await supabase
					.from('subjects')
					.select('*')
					.eq('id', subjectId)
					.single()

				if (subjectError) throw subjectError

				setSubject(subjectData)

				// Fetch lessons for this subject
				const { data: lessonsData, error: lessonsError } = await supabase
					.from('lessons')
					.select('*')
					.eq('subjectid', subjectId)
					.order('lessonname', { ascending: true })

				if (lessonsError) throw lessonsError

				setLessons(lessonsData || [])

				// Fetch teachers
				const { data: teachersData, error: teachersError } = await supabase
					.from('users')
					.select('id, firstName, lastName')
					.eq('role', 'Teacher')
					.order('lastName', { ascending: true })

				if (teachersError) throw teachersError

				setTeachers(teachersData || [])
			} catch (error) {
				console.error('Error fetching data:', error)
				toast.error('Failed to load necessary data')
			} finally {
				setIsLoading(false)
			}
		}

		fetchData()
	}, [subjectId, navigate])

	// Filter lessons based on search term
	const filteredLessons = lessons.filter(lesson =>
		lesson.lessonname.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		setFormData({ ...formData, [name]: value })
	}

	const handleAddLesson = () => {
		setCurrentLesson(null)
		setUploadedFiles([])
		setFormData({
			lessonname: '',
			description: '',
			videourl: '',
			duration: '',
			teacherid: user?.role === 'Teacher' ? user.id : '',
		})
		setShowAddModal(true)
	}

	const handleEditLesson = (lesson: Lesson) => {
		setCurrentLesson(lesson)
		setFormData({
			lessonname: lesson.lessonname,
			description: lesson.description,
			videourl: lesson.videourl || '',
			duration: lesson.duration || '',
			teacherid: lesson.teacherid || '',
		})

		// Set uploaded files from lesson.fileurls
		if (lesson.fileurls && Array.isArray(lesson.fileurls)) {
			const files = lesson.fileurls.map((url, index) => {
				const fileName = url.split('/').pop() || `file-${index}`
				return { name: fileName, url }
			})
			setUploadedFiles(files)
		} else {
			setUploadedFiles([])
		}

		setShowAddModal(true)
	}

	const handleDeleteLesson = async (id: string) => {
		if (!window.confirm('Are you sure you want to delete this lesson and its associated files?')) {
			return;
		}

		try {
			// Get lesson details to find file URLs
			const { data: lessonToDelete, error: fetchError } = await supabase
				.from('lessons')
				.select('fileurls')
				.eq('id', id)
				.single()

			if (fetchError) {
				console.error('Error fetching lesson details for deletion:', fetchError)
				throw new Error('Could not fetch lesson details before deleting.')
			}

			// Delete files from storage if they exist
			if (lessonToDelete.fileurls && Array.isArray(lessonToDelete.fileurls) && lessonToDelete.fileurls.length > 0) {
				const bucketName = 'additionalLessonFiles'; // Ensure this bucket name is correct
				const pathsToRemove: string[] = [];

				for (const fileUrl of lessonToDelete.fileurls) {
					const storagePath = getStoragePathFromUrl(fileUrl, bucketName);
					if (storagePath) {
						pathsToRemove.push(storagePath);
					} else {
						console.warn(`Could not determine storage path for deletion: ${fileUrl}`);
						// Optionally notify user or skip deletion for this file
					}
				}

				if (pathsToRemove.length > 0) {
					console.log('Attempting to delete files from storage:', pathsToRemove);
					const { error: deleteFilesError } = await supabase.storage
						.from(bucketName)
						.remove(pathsToRemove);

					if (deleteFilesError) {
						console.error('Error deleting files from storage:', deleteFilesError);
						// Decide if you want to stop the lesson deletion or just warn
						toast.warn("Failed to delete some associated files from storage. Please check manually.");
					} else {
						console.log('Successfully deleted files from storage:', pathsToRemove);
					}
				}
			} else {
				console.log('No files associated with this lesson to delete from storage.');
			}

			// Delete the lesson record from the database
			const { error: deleteLessonError } = await supabase
				.from('lessons')
				.delete()
				.eq('id', id);

			if (deleteLessonError) {
				console.error('Error deleting lesson record:', deleteLessonError);
				throw deleteLessonError; // Throw error to be caught below
			}

			// Update local state
			setLessons(lessons.filter(lesson => lesson.id !== id));
			toast.success('Lesson and associated files deleted successfully');

		} catch (error) {
			console.error('Error in handleDeleteLesson:', error);
			toast.error(`Failed to delete lesson: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) return

		setUploadingFiles(true)
		const bucketName = 'additionalLessonFiles'; // Ensure this is correct
		const currentFiles = [...uploadedFiles]; // Get current files in modal state

		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i]
				const fileExt = file.name.split('.').pop()
				// Use a more robust unique naming convention if needed
				const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
				const filePath = `${uniqueFileName}` // Path within the bucket

				console.log(`Uploading file ${file.name} as ${filePath} to bucket ${bucketName}`);

				const { error: uploadError, data } = await supabase.storage
					.from(bucketName)
					.upload(filePath, file)

				if (uploadError) {
					console.error(`Error uploading file ${file.name}:`, uploadError);
					throw uploadError; // Throw to be caught below
				}

				if (data) {
					// Get public URL
					const { data: urlData } = supabase.storage
						.from(bucketName)
						.getPublicUrl(filePath)

					if (urlData?.publicUrl) {
						console.log(`File ${file.name} uploaded successfully. URL: ${urlData.publicUrl}`);
						// Add the newly uploaded file to the modal state
						currentFiles.push({
							name: file.name, // Keep original name for display
							url: urlData.publicUrl,
						})
					} else {
						console.warn(`File ${file.name} uploaded but could not get public URL.`);
					}
				}
			}

			setUploadedFiles(currentFiles); // Update state with all files (old + new)
			toast.success(`${files.length} file(s) uploaded successfully`);
		} catch (error) {
			console.error('Error during file upload process:', error);
			toast.error(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setUploadingFiles(false)
			// Clear the file input value to allow re-uploading the same file if needed
            if (e.target) {
                e.target.value = '';
            }
		}
	}

	const removeUploadedFile = (indexToRemove: number) => {
		setUploadedFiles(currentFiles => currentFiles.filter((_, index) => index !== indexToRemove));
	}

	const validateForm = () => {
		if (!formData.lessonname.trim()) {
			toast.error('Lesson name is required')
			return false
		}
		// Add more validation if needed (e.g., teacher selection)
		if (!formData.teacherid) {
			toast.error('Please select a teacher for the lesson.');
			return false;
		}
		return true
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) return

		// Ensure subjectId is available (should be guaranteed by useEffect check)
		if (!subjectId) {
			toast.error("Cannot save lesson: Subject ID is missing.");
			return;
		}

		// Prepare lesson data payload
		const finalFileUrls = uploadedFiles.map(file => file.url);
		const lessonDataPayload = {
			lessonname: formData.lessonname,
			description: formData.description,
			videourl: formData.videourl || null, // Use null if empty
			fileurls: finalFileUrls, // Use the current state of uploadedFiles
			duration: formData.duration || null, // Use null if empty
			subjectid: subjectId, // Now guaranteed to be string
			teacherid: formData.teacherid, // Also guaranteed by validation
		};

		try {
			if (currentLesson) {
				// ----- UPDATE existing lesson -----
				console.log('Updating lesson:', currentLesson.id, lessonDataPayload);

				// 1. Identify files to delete from storage
				const originalUrls = currentLesson.fileurls || [];
				const urlsToDelete = originalUrls.filter(url => !finalFileUrls.includes(url));
				const bucketName = 'additionalLessonFiles';
				const pathsToDelete = urlsToDelete
					.map(url => getStoragePathFromUrl(url, bucketName))
					.filter((path): path is string => path !== null); // Filter out null paths

				if (pathsToDelete.length > 0) {
					console.log('Deleting files removed during edit:', pathsToDelete);
					const { error: deleteFilesError } = await supabase.storage
						.from(bucketName)
						.remove(pathsToDelete);
					if (deleteFilesError) {
						console.error("Error removing files from storage during update:", deleteFilesError);
						toast.warn("Could not remove some old files from storage. Please check manually.");
						// Continue with update despite storage error? Or stop? For now, continue.
					}
				}

				// 2. Update lesson record in database
				const { data: updatedLesson, error: updateError } = await supabase
					.from('lessons')
					.update(lessonDataPayload)
					.eq('id', currentLesson.id)
					.select() // Select the updated record
					.single()

				if (updateError) throw updateError;

				// 3. Update local state
                if (updatedLesson) {
				    setLessons(lessons.map(lesson =>
					    lesson.id === currentLesson.id ? updatedLesson : lesson
				    ));
                } else {
                    // Fallback if select() fails or returns null, update optimistically
                    setLessons(lessons.map(lesson =>
					    lesson.id === currentLesson.id ? { ...lesson, ...lessonDataPayload, id: lesson.id } : lesson
				    ));
                }

				toast.success('Lesson updated successfully');

			} else {
				// ----- CREATE new lesson -----
				console.log('Creating new lesson:', lessonDataPayload);

				const { data: newLesson, error: insertError } = await supabase
					.from('lessons')
					.insert([lessonDataPayload])
					.select()
					.single();

				if (insertError) throw insertError;

				if (newLesson) {
					setLessons([...lessons, newLesson]); // Add the new lesson to local state
				} else {
                    console.warn("New lesson created but couldn't retrieve the full record.");
                    // May need to refetch or update optimistically
                }
				toast.success('Lesson created successfully');
			}

			setShowAddModal(false); // Close modal on success
			setCurrentLesson(null); // Reset current lesson state
			setUploadedFiles([]); // Clear modal file state

		} catch (error) {
			console.error('Error saving lesson:', error);
			toast.error(`Failed to save lesson: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	if (isLoading) {
		return (
			<PageContainer>
				<LoadingMessage>Loading lessons...</LoadingMessage>
			</PageContainer>
		)
	}

	return (
		<PageContainer
			as={motion.div}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			<PageHeader>
				<HeaderLeft>
					<BackButton onClick={() => navigate('/admin/subjects')}>
						<FiArrowLeft />
						<span>Back to Subjects</span>
					</BackButton>
					{subject && (
						<div>
							<PageTitle>
								Lessons for {subject.subjectname} <SubjectCode>{subject.code}</SubjectCode>
							</PageTitle>
							<PageDescription>{subject.description}</PageDescription>
						</div>
					)}
				</HeaderLeft>
				<AddButton onClick={handleAddLesson}>
					<FiPlus />
					<span>Add Lesson</span>
				</AddButton>
			</PageHeader>

			<SearchContainer>
				<SearchIconWrapper>
					<FiSearch />
				</SearchIconWrapper>
				<SearchInput
					type='text'
					placeholder='Search lessons...'
					value={searchTerm}
					onChange={handleSearchChange}
				/>
			</SearchContainer>

			<LessonsList>
				{filteredLessons.length > 0 ? (
					filteredLessons.map(lesson => (
						<LessonCard key={lesson.id}>
							<LessonHeader>
								<LessonTitle>{lesson.lessonname}</LessonTitle>
								{lesson.duration && (
									<LessonDuration>
										<FiClock />
										<span>{lesson.duration}</span>
									</LessonDuration>
								)}
							</LessonHeader>

							{lesson.description && <LessonDescription>{lesson.description}</LessonDescription>}

							<LessonContent>
								{lesson.videourl && (
									<VideoContainer>
										<VideoIcon>
											<FiVideo />
										</VideoIcon>
										<span>Video lecture available</span>
									</VideoContainer>
								)}

								{lesson.fileurls && lesson.fileurls.length > 0 && (
									<FilesContainer>
										<FilesHeader>
											<FiFile />
											<span>Files ({lesson.fileurls.length})</span>
										</FilesHeader>
										<FilesList>
											{lesson.fileurls.map((url, index) => {
												const fileName = getFileNameFromUrl(url) || `file-${index}`;
												return (
													<FileItem
														key={url + index}
														href={url}
														target='_blank'
														rel='noopener noreferrer'
														title={fileName}
													>
														<FiFileText size={16} style={{ marginRight: '8px', flexShrink: 0 }} />
														<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
															{fileName}
														</span>
													</FileItem>
												);
											})}
										</FilesList>
									</FilesContainer>
								)}
							</LessonContent>

							<LessonActions>
								<ActionButton title='Edit lesson' onClick={() => handleEditLesson(lesson)}>
									<FiEdit2 />
								</ActionButton>
								<ActionButton title='Delete lesson' onClick={() => handleDeleteLesson(lesson.id)}>
									<FiTrash2 />
								</ActionButton>
							</LessonActions>
						</LessonCard>
					))
				) : (
					<EmptyState>
						<EmptyStateText>
							{searchTerm ? 'No lessons match your search.' : 'No lessons found for this subject.'}
						</EmptyStateText>
						<AddLessonButton onClick={handleAddLesson}>
							<FiPlus />
							<span>Add First Lesson</span>
						</AddLessonButton>
					</EmptyState>
				)}
			</LessonsList>

			{/* Add/Edit Lesson Modal */}
			{showAddModal && (
				<ModalOverlay>
					<ModalContent
						as={motion.div}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
					>
						<ModalHeader>
							<ModalTitle>{currentLesson ? 'Edit Lesson' : 'Add New Lesson'}</ModalTitle>
							<CloseButton onClick={() => setShowAddModal(false)}>
								<FiX />
							</CloseButton>
						</ModalHeader>
						<ModalBody>
							<form onSubmit={handleSubmit}>
								{/* Form Inputs */}
								<FormGroup>
									<FormLabel htmlFor='lessonname'>Lesson Name *</FormLabel>
									<FormInput
										id='lessonname'
										name='lessonname'
										value={formData.lessonname}
										onChange={handleInputChange}
										placeholder='Enter lesson name'
										required
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='description'>Description</FormLabel>
									<FormTextarea
										id='description'
										name='description'
										value={formData.description}
										onChange={handleInputChange}
										placeholder='Enter lesson description (optional)'
										rows={3}
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='videourl'>Video URL (YouTube Embed)</FormLabel>
									<FormInput
										id='videourl'
										name='videourl'
										value={formData.videourl}
										onChange={handleInputChange}
										placeholder='e.g., https://www.youtube.com/embed/your_video_id'
									/>
									<FormHelp>Paste the embed URL from YouTube (optional)</FormHelp>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='duration'>Duration</FormLabel>
									<FormInput
										id='duration'
										name='duration'
										value={formData.duration}
										onChange={handleInputChange}
										placeholder='e.g., 45 minutes (optional)'
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='teacherid'>Teacher *</FormLabel>
									<FormSelect
										id='teacherid'
										name='teacherid'
										value={formData.teacherid}
										onChange={handleInputChange}
										required // Make teacher selection mandatory
									>
										<option value='' disabled={formData.teacherid !== ''}>
                                            -- Select a teacher --
                                        </option>
										{teachers.map(teacher => (
											<option key={teacher.id} value={teacher.id}>
												{teacher.firstName} {teacher.lastName}
											</option>
										))}
									</FormSelect>
								</FormGroup>

								{/* File Upload Section */}
								<FormGroup>
									<FormLabel>Additional Files</FormLabel>
									<FileUploadContainer>
										<FileUploadLabel htmlFor='lesson-file-upload'> {/* Link label to input */}
											<input
												id='lesson-file-upload' // Add id for label linking
												type='file'
												onChange={handleFileUpload}
												multiple
												disabled={uploadingFiles}
												style={{ display: 'none' }}
											/>
											<UploadButton type='button' disabled={uploadingFiles} onClick={() => document.getElementById('lesson-file-upload')?.click()}> {/* Trigger input click */}
												<FiUpload />
												<span>{uploadingFiles ? 'Uploading...' : 'Upload Files'}</span>
											</UploadButton>
										</FileUploadLabel>
										{/* Display Uploaded Files */}
										{uploadedFiles.length > 0 && (
											<UploadedFilesList>
												{uploadedFiles.map((file, index) => (
													<UploadedFileItem key={index}>
														<UploadedFileName
															href={file.url}
															target='_blank'
															rel='noopener noreferrer'
															title={file.name} // Show original name on hover
														>
															{file.name} {/* Display original name */}
														</UploadedFileName>
														<RemoveFileButton
															type='button'
															onClick={() => removeUploadedFile(index)}
															title="Remove this file" // Add title
															disabled={uploadingFiles} // Disable remove while uploading
														>
															<FiX />
														</RemoveFileButton>
													</UploadedFileItem>
												))}
											</UploadedFilesList>
										)}
                                        <FormHelp>Upload PDFs, documents, images, etc.</FormHelp>
									</FileUploadContainer>
								</FormGroup>

								{/* Action Buttons */}
								<ButtonContainer>
									<CancelButton type='button' onClick={() => setShowAddModal(false)}>
										Cancel
									</CancelButton>
									<SubmitButton type='submit' disabled={uploadingFiles}> {/* Disable submit while uploading */}
										{currentLesson ? 'Update Lesson' : 'Create Lesson'}
									</SubmitButton>
								</ButtonContainer>
							</form>
						</ModalBody>
					</ModalContent>
				</ModalOverlay>
			)}
		</PageContainer>
	)
}

// Styled Components
const PageContainer = styled.div`
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
`

const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 2rem;

	@media (max-width: 768px) {
		flex-direction: column;
		gap: 1rem;
	}
`

const HeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`

const BackButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background: none;
	border: none;
	color: ${props => props.theme.colors.primary[600]};
	font-size: 0.9rem;
	font-weight: 500;
	padding: 0;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		color: ${props => props.theme.colors.primary[700]};
	}
`

const PageTitle = styled.h1`
	font-size: 1.75rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0 0 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`

const SubjectCode = styled.span`
	font-size: 1rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.secondary};
	background-color: ${props => props.theme.colors.neutral[100]};
	padding: 0.25rem 0.75rem;
	border-radius: 0.25rem;
`

const PageDescription = styled.p`
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
	margin: 0;
`

const AddButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.primary[700]};
	}
`

const SearchContainer = styled.div`
	position: relative;
	margin-bottom: 2rem;
	max-width: 500px;
`

const SearchIconWrapper = styled.div`
	position: absolute;
	left: 1rem;
	top: 50%;
	transform: translateY(-50%);
	color: ${props => props.theme.colors.neutral[400]};
`

const SearchInput = styled.input`
	width: 100%;
	padding: 0.75rem 1rem 0.75rem 2.5rem;
	border: 1px solid ${props => props.theme.colors.neutral[300]};
	border-radius: 0.5rem;
	font-size: 1rem;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[400]};
		box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
	}
`

const LessonsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
`

const LessonCard = styled.div`
	background-color: white;
	border-radius: 0.75rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	padding: 1.5rem;
	transition: all 0.2s ease;

	&:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
`

const LessonHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.75rem;

	@media (max-width: 576px) {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}
`

const LessonTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
`

const LessonDuration = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.secondary};
	background-color: ${props => props.theme.colors.neutral[100]};
	padding: 0.25rem 0.75rem;
	border-radius: 0.25rem;
`

const LessonDescription = styled.p`
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.secondary};
	margin: 0 0 1.5rem;
`

const LessonContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-bottom: 1.5rem;
`

const VideoContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 1rem;
	background-color: ${props => props.theme.colors.primary[50]};
	border-radius: 0.5rem;
	color: ${props => props.theme.colors.primary[800]};
`

const VideoIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${props => props.theme.colors.primary[600]};

	svg {
		width: 1.5rem;
		height: 1.5rem;
	}
`

const FilesContainer = styled.div`
	margin-top: 1rem;
	padding-top: 1rem;
	border-top: 1px solid ${({ theme }) => theme.colors.border.light};
`

const FilesHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.9rem;
	font-weight: 500;
	color: ${({ theme }) => theme.colors.text.secondary};
	margin-bottom: 0.75rem;
`

const FilesList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`

const FileItem = styled.a`
	display: flex;
	align-items: center;
	padding: 0.5rem 0.75rem;
	margin-bottom: 0.5rem;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	background-color: ${({ theme }) => theme.colors.background.tertiary};
	color: ${({ theme }) => theme.colors.text.secondary};
	text-decoration: none;
	transition: background-color 0.2s ease, color 0.2s ease;
	overflow: hidden;

	&:hover {
		background-color: ${({ theme }) => theme.colors.background.hover};
		color: ${({ theme }) => theme.colors.primary[500]};
	}

	&:last-child {
		margin-bottom: 0;
	}
`

const LessonActions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
`

const ActionButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 0.5rem;
	border: 1px solid ${props => props.theme.colors.neutral[200]};
	background-color: white;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.neutral[100]};
		color: ${props => props.theme.colors.primary[600]};
	}
`

const EmptyState = styled.div`
	padding: 3rem;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: 1.5rem;
	background-color: white;
	border-radius: 0.75rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

const EmptyStateText = styled.p`
	font-size: 1.1rem;
	color: ${props => props.theme.colors.text.secondary};
	margin: 0;
`

const AddLessonButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.primary[700]};
	}
`

const LoadingMessage = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 300px;
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
`

const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
	padding: 1rem;
`

const ModalContent = styled.div`
	background-color: white;
	border-radius: 0.75rem;
	width: 100%;
	max-width: 600px;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem;
	border-bottom: 1px solid ${props => props.theme.colors.neutral[200]};
`

const ModalTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
`

const CloseButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 0.5rem;
	border: none;
	background-color: transparent;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.neutral[100]};
		color: ${props => props.theme.colors.text.primary};
	}
`

const ModalBody = styled.div`
	padding: 1.5rem;
`

export default LessonsManagePage;