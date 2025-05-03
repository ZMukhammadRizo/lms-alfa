import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import {
	FiArrowLeft,
	FiClock,
	FiEdit2,
	FiFile,
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
		try {
			// Get lesson to find file URLs
			const { data: lesson, error: fetchError } = await supabase
				.from('lessons')
				.select('fileurls')
				.eq('id', id)
				.single()

			if (fetchError) throw fetchError

			// Delete files from storage if they exist
			if (lesson.fileurls && Array.isArray(lesson.fileurls) && lesson.fileurls.length > 0) {
				for (const fileUrl of lesson.fileurls) {
					const path = fileUrl.replace(
						`${supabase.supabaseUrl}/storage/v1/object/public/additionalLessonFiles/`,
						''
					)
					if (path) {
						const { error: deleteFileError } = await supabase.storage
							.from('additionalLessonFiles')
							.remove([path])

						if (deleteFileError) {
							console.error('Error deleting file:', deleteFileError)
						}
					}
				}
			}

			// Delete lesson
			const { error: deleteError } = await supabase.from('lessons').delete().eq('id', id)

			if (deleteError) throw deleteError

			setLessons(lessons.filter(lesson => lesson.id !== id))
			toast.success('Lesson deleted successfully')
		} catch (error) {
			console.error('Error deleting lesson:', error)
			toast.error('Failed to delete lesson')
		}
	}

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) return

		setUploadingFiles(true)

		try {
			const newUploadedFiles = [...uploadedFiles]

			for (let i = 0; i < files.length; i++) {
				const file = files[i]
				const fileExt = file.name.split('.').pop()
				const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
				const filePath = `${fileName}`

				const { error: uploadError, data } = await supabase.storage
					.from('additionalLessonFiles')
					.upload(filePath, file)

				if (uploadError) throw uploadError

				if (data) {
					const { data: urlData } = supabase.storage
						.from('additionalLessonFiles')
						.getPublicUrl(filePath)

					newUploadedFiles.push({
						name: file.name,
						url: urlData.publicUrl,
					})
				}
			}

			setUploadedFiles(newUploadedFiles)
			toast.success('Files uploaded successfully')
		} catch (error) {
			console.error('Error uploading files:', error)
			toast.error('Failed to upload files')
		} finally {
			setUploadingFiles(false)
		}
	}

	const removeUploadedFile = (index: number) => {
		const newFiles = [...uploadedFiles]
		newFiles.splice(index, 1)
		setUploadedFiles(newFiles)
	}

	const validateForm = () => {
		if (!formData.lessonname.trim()) {
			toast.error('Lesson name is required')
			return false
		}
		return true
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) return

		try {
			const lessonData = {
				lessonname: formData.lessonname,
				description: formData.description,
				videourl: formData.videourl,
				fileurls: uploadedFiles.map(file => file.url),
				duration: formData.duration,
				subjectid: subjectId,
				teacherid: formData.teacherid || user?.id,
			}

			if (currentLesson) {
				// Update existing lesson
				const { error } = await supabase
					.from('lessons')
					.update(lessonData)
					.eq('id', currentLesson.id)

				if (error) throw error

				setLessons(
					lessons.map(lesson =>
						lesson.id === currentLesson.id ? { ...lesson, ...lessonData } : lesson
					)
				)

				toast.success('Lesson updated successfully')
			} else {
				// Create new lesson
				const { data, error } = await supabase
					.from('lessons')
					.insert([lessonData])
					.select()
					.single()

				if (error) throw error

				setLessons([...lessons, data])
				toast.success('Lesson created successfully')
			}

			setShowAddModal(false)
		} catch (error) {
			console.error('Error saving lesson:', error)
			toast.error('Failed to save lesson')
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
											<span>Additional Files</span>
										</FilesHeader>
										<FilesList>
											{lesson.fileurls.map((url, index) => {
												const fileName = url.split('/').pop() || `File ${index + 1}`
												return (
													<FileItem
														key={index}
														href={url}
														target='_blank'
														rel='noopener noreferrer'
													>
														{fileName}
													</FileItem>
												)
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
						<EmptyStateText>No lessons found for this subject</EmptyStateText>
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
								<FormGroup>
									<FormLabel htmlFor='lessonname'>Lesson Name</FormLabel>
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
										placeholder='Enter lesson description'
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
										placeholder='e.g. https://www.youtube.com/embed/abcXYZ'
									/>
									<FormHelp>Enter a YouTube embed URL for the lesson video</FormHelp>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='duration'>Duration</FormLabel>
									<FormInput
										id='duration'
										name='duration'
										value={formData.duration}
										onChange={handleInputChange}
										placeholder='e.g. 45 minutes'
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='teacherid'>Teacher</FormLabel>
									<FormSelect
										id='teacherid'
										name='teacherid'
										value={formData.teacherid}
										onChange={handleInputChange}
									>
										<option value=''>Select a teacher</option>
										{teachers.map(teacher => (
											<option key={teacher.id} value={teacher.id}>
												{teacher.firstName} {teacher.lastName}
											</option>
										))}
									</FormSelect>
								</FormGroup>
								<FormGroup>
									<FormLabel>Additional Files</FormLabel>
									<FileUploadContainer>
										<FileUploadLabel>
											<input
												type='file'
												onChange={handleFileUpload}
												multiple
												disabled={uploadingFiles}
												style={{ display: 'none' }}
											/>
											<UploadButton type='button' disabled={uploadingFiles}>
												<FiUpload />
												<span>{uploadingFiles ? 'Uploading...' : 'Upload Files'}</span>
											</UploadButton>
										</FileUploadLabel>
										{uploadedFiles.length > 0 && (
											<UploadedFilesList>
												{uploadedFiles.map((file, index) => (
													<UploadedFileItem key={index}>
														<UploadedFileName
															href={file.url}
															target='_blank'
															rel='noopener noreferrer'
														>
															{file.name}
														</UploadedFileName>
														<RemoveFileButton
															type='button'
															onClick={() => removeUploadedFile(index)}
														>
															<FiX />
														</RemoveFileButton>
													</UploadedFileItem>
												))}
											</UploadedFilesList>
										)}
									</FileUploadContainer>
								</FormGroup>
								<ButtonContainer>
									<CancelButton type='button' onClick={() => setShowAddModal(false)}>
										Cancel
									</CancelButton>
									<SubmitButton type='submit'>
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
	padding: 1rem;
	background-color: ${props => props.theme.colors.neutral[50]};
	border-radius: 0.5rem;
`

const FilesHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: 0.75rem;
`

const FilesList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`

const FileItem = styled.a`
	display: block;
	color: ${props => props.theme.colors.primary[600]};
	text-decoration: none;
	font-size: 0.9rem;
	padding: 0.5rem;
	border-radius: 0.25rem;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.neutral[100]};
		color: ${props => props.theme.colors.primary[700]};
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

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`

const FormLabel = styled.label`
	display: block;
	font-size: 0.9rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: 0.5rem;
`

const FormInput = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid ${props => props.theme.colors.neutral[300]};
	border-radius: 0.5rem;
	font-size: 1rem;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[500]};
		box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
	}
`

const FormHelp = styled.div`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-top: 0.5rem;
`

const FormTextarea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid ${props => props.theme.colors.neutral[300]};
	border-radius: 0.5rem;
	font-size: 1rem;
	resize: vertical;
	min-height: 100px;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[500]};
		box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
	}
`

const FormSelect = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid ${props => props.theme.colors.neutral[300]};
	border-radius: 0.5rem;
	font-size: 1rem;
	background-color: white;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[500]};
		box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
	}
`

const FileUploadContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`

const FileUploadLabel = styled.label`
	display: block;
`

const UploadButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	background-color: ${props => props.theme.colors.neutral[100]};
	color: ${props => props.theme.colors.text.primary};
	border: 1px dashed ${props => props.theme.colors.neutral[300]};
	border-radius: 0.5rem;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	width: 100%;
	justify-content: center;

	&:hover {
		background-color: ${props => props.theme.colors.neutral[200]};
	}

	&:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
`

const UploadedFilesList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`

const UploadedFileItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.75rem;
	background-color: ${props => props.theme.colors.neutral[50]};
	border-radius: 0.5rem;
`

const UploadedFileName = styled.a`
	color: ${props => props.theme.colors.primary[600]};
	text-decoration: none;
	font-size: 0.9rem;

	&:hover {
		text-decoration: underline;
	}
`

const RemoveFileButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 0.25rem;
	border: none;
	background-color: ${props => props.theme.colors.neutral[200]};
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.danger[100]};
		color: ${props => props.theme.colors.danger[600]};
	}
`

const ButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
	margin-top: 1.5rem;
`

const Button = styled.button`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
`

const CancelButton = styled(Button)`
	background-color: white;
	color: ${props => props.theme.colors.text.primary};
	border: 1px solid ${props => props.theme.colors.neutral[300]};

	&:hover {
		background-color: ${props => props.theme.colors.neutral[100]};
	}
`

const SubmitButton = styled(Button)`
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	border: none;

	&:hover {
		background-color: ${props => props.theme.colors.primary[700]};
	}
`

export default LessonsManagePage
