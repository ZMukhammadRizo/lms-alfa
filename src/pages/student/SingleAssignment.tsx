import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
	FiCalendar,
	FiCheckCircle,
	FiClock,
	FiDownload,
	FiFile,
	FiFileText,
	FiUpload,
	FiX,
} from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import supabase from '../../config/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { Assignment } from '../../services/assignmentService'

interface ExtendedAssignment extends Assignment {
	file_url?: Array<{ name: string; url: string }> | null
	classid?: string
	className?: string
	subjectName?: string
}

interface SubmissionData {
	id?: string
	fileurl: string[]
	submittedat: string
	grade?: number | null
	feedback?: string | null
	status?: string | null
	attempt_count?: number
}

const SingleAssignment: React.FC = () => {
	const { t } = useTranslation()
	const { assignmentId } = useParams<{ assignmentId: string }>()
	const navigate = useNavigate()
	const { user } = useAuth()	

	const [assignment, setAssignment] = useState<ExtendedAssignment | null>(null)
	const [loading, setLoading] = useState(true)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [uploading, setUploading] = useState(false)
	const [existingSubmission, setExistingSubmission] = useState<SubmissionData | null>(null)
	const [uploadProgress, setUploadProgress] = useState(0)

	// Fetch assignment data
	const fetchAssignmentData = async () => {
		if (!assignmentId) {
			toast.error(t('student.assignments.errors.missingAssignmentId', { defaultValue: 'Missing assignment ID' }))
			navigate('/student/assignments')
			return
		}

		try {
			setLoading(true)

			// Fetch assignment details
			const { data: assignmentData, error: assignmentError } = await supabase
				.from('assignments')
				.select(
					`
          *,
          class:classid (
            classname
          ),
          subject:subject_id (
            subjectname
          )
        `
				)
				.eq('id', assignmentId)
				.single()

			if (assignmentError) throw assignmentError

			if (!assignmentData) {
				toast.error(t('student.assignments.errors.assignmentNotFound', { defaultValue: 'Assignment not found' }))
				navigate('/student/assignments')
				return
			}

			// Calculate status
			let calculatedStatus = assignmentData.status || 'pending'
			const dueDate = new Date(assignmentData.duedate)
			const today = new Date()

			if (dueDate < today && calculatedStatus !== 'completed') calculatedStatus = 'overdue'
			if (getDaysRemaining(assignmentData.duedate) > 7 && calculatedStatus === 'pending')
				calculatedStatus = 'upcoming'

			// Format assignment data
			const formattedAssignment: ExtendedAssignment = {
				id: assignmentData.id,
				title: assignmentData.title,
				description: assignmentData.description || '',
				due_date: assignmentData.duedate,
				subject: assignmentData.subject || 'General',
				subject_id: assignmentData.subject_id,
				status: calculatedStatus,
				created_at:
					assignmentData.created_at ||
					assignmentData.updated_at ||
					assignmentData.duedate ||
					new Date().toISOString(),
				updated_at: assignmentData.updated_at,
				file_url: assignmentData.file_url || null,
				classid: assignmentData.classid,
				className: assignmentData.class?.classname || 'Unknown Class',
				subjectName: assignmentData.subject?.subjectname || 'Unknown Subject',
			}

			setAssignment(formattedAssignment)

			// Check for existing submission - only if user is available
			if (user?.id) {
				const { data: submissionData, error: submissionError } = await supabase
					.from('submissions')
					.select('*')
					.eq('assignmentid', assignmentId)
					.eq('studentid', user.id)
					.maybeSingle()

				if (submissionError) throw submissionError

				if (submissionData && submissionData.fileurl) {
					setExistingSubmission({
						id: submissionData.id,
						fileurl: Array.isArray(submissionData.fileurl)
							? submissionData.fileurl
							: [submissionData.fileurl],
						submittedat: submissionData.submittedat,
						grade: submissionData.grade,
						feedback: submissionData.feedback,
						status: submissionData.status,
						attempt_count: submissionData.attempt_count || 1,
					})
				}
			}
		} catch (error) {
			console.error('Error fetching assignment:', error)
			toast.error('Failed to load assignment details')
		} finally {
			setLoading(false)
		}
	}

	// Load data when dependencies change
	useEffect(() => {
		fetchAssignmentData()
	}, [assignmentId, user?.id])

	// Format date for display
	const formatDate = (dateString: string | null | undefined): string => {
		if (!dateString) return 'Not specified'

		try {
			const date = new Date(dateString)

			if (isNaN(date.getTime())) {
				return 'Not specified'
			}

			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			})
		} catch (error) {
			console.error('Error formatting date:', error)
			return 'Not specified'
		}
	}

	// Format time for display
	const formatTime = (dateString: string | null | undefined): string => {
		if (!dateString) return 'Not specified'

		try {
			const date = new Date(dateString)

			if (isNaN(date.getTime())) {
				return 'Not specified'
			}

			return date.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
			})
		} catch (error) {
			console.error('Error formatting time:', error)
			return 'Not specified'
		}
	}

	// File icon helper
	const getFileIcon = (fileUrl: string | null | undefined) => {
		if (!fileUrl) return <FiFileText size={20} />

		if (fileUrl.includes('.pdf')) return <FiFile size={20} />
		if (fileUrl.includes('.mp4') || fileUrl.includes('.mov') || fileUrl.includes('.avi'))
			return <FiFile size={20} />
		if (fileUrl.includes('.doc') || fileUrl.includes('.docx')) return <FiFileText size={20} />

		return <FiFileText size={20} />
	}

	// Get filename from URL
	const getFileName = (fileUrl: string | null | undefined): string => {
		if (!fileUrl) return 'Assignment Document'

		try {
			const urlParts = fileUrl.split('/')
			let fileName = urlParts[urlParts.length - 1]

			fileName = fileName.split('?')[0]

			if (!fileName || fileName.length < 3) {
				return 'Assignment Document'
			}

			let decodedName = decodeURIComponent(fileName)

			if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[_-]/.test(decodedName)) {
				decodedName = decodedName.replace(
					/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[_-]/,
					''
				)
			} else if (
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(decodedName)
			) {
				return 'Assignment Document'
			}

			return decodedName
		} catch (e) {
			return 'Assignment Document'
		}
	}

	// Dropzone configuration
	const onDrop = useCallback((acceptedFiles: File[]) => {
		if (acceptedFiles.length > 0) {
			setSelectedFile(acceptedFiles[0])
		}
	}, [])

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		maxFiles: 1,
		maxSize: 25 * 1024 * 1024, // 25 MB max
		accept: {
			'application/pdf': ['.pdf'],
			'application/msword': ['.doc'],
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
			'application/vnd.ms-excel': ['.xls'],
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
			'application/vnd.ms-powerpoint': ['.ppt'],
			'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
			'text/plain': ['.txt'],
			'image/jpeg': ['.jpg', '.jpeg'],
			'image/png': ['.png'],
		},
	})

	// Remove selected file
	const handleRemoveFile = () => {
		setSelectedFile(null)
	}

	// Upload file to Supabase
	const uploadSubmissionFile = async (file: File, assignmentId: string, studentId: string) => {
		const originalName = file.name
		const nameWithoutExt = originalName.split('.').slice(0, -1).join('.')
		const extension = originalName.split('.').pop()

		// Remove all non-alphanumeric characters (keep letters, numbers, underscores)
		const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9_]/g, '')

		// Limit to first 5 characters
		const shortenedName = sanitized.slice(0, 5)

		// Construct the final file name and path
		const finalFileName = `${shortenedName}.${extension}`
		const path = `submissions/${studentId}-${assignmentId}-${finalFileName}`

		try {
			// Start progress indication
			setUploadProgress(10)

			// Show progress increasing during upload
			const progressInterval = setInterval(() => {
				setUploadProgress(prev => {
					if (prev >= 90) {
						clearInterval(progressInterval)
						return 90
					}
					return prev + 5
				})
			}, 300)

			// Use Supabase SDK directly - this is the recommended way
			const { data, error } = await supabase.storage.from('lms').upload(path, file, {
				upsert: true,
				cacheControl: '3600',
			})

			// Clear the progress interval
			clearInterval(progressInterval)

			if (error) throw error

			// Set to 100% when complete
			setUploadProgress(100)

			// Get the public URL
			const { data: urlData } = supabase.storage.from('lms').getPublicUrl(path)

			return urlData.publicUrl
		} catch (error) {
			// Reset progress on error
			setUploadProgress(0)
			throw error
		}
	}

	// Submit assignment to database - Create or update a row in the submissions table
	const submitAssignment = async (
		assignmentId: string,
		studentId: string,
		fileUrl: string[] | null = null
	) => {
		try {
			// Check if there's an existing submission
			const { data: existing } = await supabase
				.from('submissions')
				.select('id, fileurl, attempt_count')
				.eq('assignmentid', assignmentId)
				.eq('studentid', studentId)
				.maybeSingle()

			if (existing) {
				// Check if the student has already submitted twice
				if (existing.attempt_count && existing.attempt_count >= 2) {
					throw new Error(
						'You have reached the maximum number of submission attempts for this assignment'
					)
				}

				// If record exists, update it
				// Combine existing files with new file if they exist
				const updatedFileUrls = fileUrl
					? Array.isArray(existing.fileurl)
						? [...(existing.fileurl || []).filter(url => url !== null), ...fileUrl]
						: [existing.fileurl, ...fileUrl].filter(url => url !== null)
					: Array.isArray(existing.fileurl)
					? existing.fileurl.filter(url => url !== null)
					: existing.fileurl

				// Increment attempt count if this is a resubmission
				const newAttemptCount = (existing.attempt_count || 1) + 1

				const { error: updateError } = await supabase
					.from('submissions')
					.update({
						fileurl: updatedFileUrls,
						submittedat: new Date().toISOString(),
						attempt_count: newAttemptCount,
					})
					.eq('id', existing.id)

				if (updateError) throw updateError
				return existing.id
			} else {
				// If no record exists, create a new one
				const { data: newRow, error: insertError } = await supabase
					.from('submissions')
					.insert({
						assignmentid: assignmentId,
						studentid: studentId,
						fileurl: fileUrl,
						submittedat: new Date().toISOString(),
						classid: assignment?.classid,
						attempt_count: 1,
					})
					.select('id')
					.single()

				if (insertError) throw insertError
				return newRow.id
			}
		} catch (error) {
			console.error('Error managing submission record:', error)
			throw error
		}
	}

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!selectedFile || !user?.id || !assignmentId) {
			toast.error('Please select a file to upload')
			return
		}

		try {
			setUploading(true)
			setUploadProgress(0)

			// 1. Create submission record first (without fileUrl)
			const submissionId = await submitAssignment(assignmentId, user.id, null)

			// 2. Upload file to Supabase Storage
			const fileUrl = await uploadSubmissionFile(selectedFile, assignmentId, user.id)

			// 3. Update submission record with the file URL (as an array)
			await submitAssignment(assignmentId, user.id, [fileUrl])

			// 4. If this is a resubmission, explicitly set the status to null
			if (existingSubmission) {
				await supabase
					.from('submissions')
					.update({
						status: null,
					})
					.eq('id', submissionId)
			}

			// 5. Update UI
			setExistingSubmission({
				id: submissionId,
				fileurl: existingSubmission ? [...existingSubmission.fileurl, fileUrl] : [fileUrl],
				submittedat: new Date().toISOString(),
				status: null,
				attempt_count: existingSubmission ? (existingSubmission.attempt_count || 1) + 1 : 1,
			})

			setSelectedFile(null)
			toast.success('Assignment submitted successfully!')

			// Reload assignment data to reflect updated status
			fetchAssignmentData()
		} catch (error: any) {
			console.error('Error submitting assignment:', error)

			// Handle Supabase errors which have a specific format
			let errorMessage = 'Failed to submit assignment'

			if (error?.message) {
				errorMessage = error.message
			} else if (error?.error_description) {
				errorMessage = error.error_description
			}

			toast.error(errorMessage)
			setUploadProgress(0)
		} finally {
			setUploading(false)
		}
	}

	// Download existing submission
	const downloadSubmission = (fileUrl?: string) => {
		if (!fileUrl && (!existingSubmission?.fileurl || existingSubmission.fileurl.length === 0))
			return

		// Make sure urlToDownload is defined and not undefined
		const urlToDownload =
			fileUrl ||
			(existingSubmission?.fileurl && existingSubmission.fileurl.length > 0
				? existingSubmission.fileurl[0]
				: '')

		// Only proceed if we have a valid URL
		if (!urlToDownload) return

		const link = document.createElement('a')
		link.href = urlToDownload
		link.target = '_blank'
		link.download = getFileName(urlToDownload)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	// Helper function to get days remaining
	const getDaysRemaining = (dueDateStr: string): number => {
		try {
			const dueDate = new Date(dueDateStr)
			const today = new Date()

			if (isNaN(dueDate.getTime())) {
				return 0
			}

			today.setHours(0, 0, 0, 0)
			dueDate.setHours(0, 0, 0, 0)

			const differenceMs = dueDate.getTime() - today.getTime()
			const differenceDays = Math.ceil(differenceMs / (1000 * 3600 * 24))

			return differenceDays
		} catch (error) {
			console.error('Error calculating days remaining:', error)
			return 0
		}
	}

	// Get status text
	const getStatusText = (status: string, dueDate: string | undefined): string => {
		if (!dueDate) return status.charAt(0).toUpperCase() + status.slice(1)

		// First check if the submission has an explicit status from teacher
		if (existingSubmission) {
			if (existingSubmission.status === 'accepted') {
				return 'Accepted'
			}

			if (existingSubmission.status === 'rejected') {
				return 'Rejected'
			}

			// Check if assignment has been resubmitted (more than one file and null status)
			if (
				existingSubmission.status === null &&
				existingSubmission.fileurl &&
				existingSubmission.fileurl.length > 1
			) {
				return 'Resubmitted'
			}

			// Check if assignment has been submitted and graded
			if (existingSubmission.grade !== undefined && existingSubmission.grade !== null) {
				return 'Completed'
			}

			// Default for any submission without explicit status
			return 'Submitted'
		}

		// If not submitted, check due date
		const days = getDaysRemaining(dueDate)
		if (days <= 3 && days > 0) {
			return 'Due Soon'
		} else if (days <= 0) {
			return 'Overdue'
		} else if (days <= 7) {
			return 'In Progress'
		} else {
			return 'Upcoming'
		}
	}

	if (loading) {
		return (
			<LoadingContainer>
				<LoadingSpinner />
				<p>{t('loadingAssignmentDetails')}</p>
			</LoadingContainer>
		)
	}

	if (!assignment) {
		return (
			<Container>
				<ErrorMessage>
					<h2>{t('assignmentNotFound')}</h2>
					<p>{t('assignmentNotFoundDescription')}</p>
					<BackButton onClick={() => navigate('/student/assignments')}>
						{t('backToAssignments')}
					</BackButton>
				</ErrorMessage>
			</Container>
		)
	}

	return (
		<Container>
			<PageHeader>
				<PageTitle>{t('assignmentDetails')}</PageTitle>
				<BackButton onClick={() => navigate('/student/assignments')}>
					{t('backToAssignments')}
				</BackButton>
			</PageHeader>

			<AssignmentCard>
				<AssignmentHeader>
					<div>
						<AssignmentTitle>{assignment.title}</AssignmentTitle>
						<CourseInfo>
							<ClassBadge>{assignment.className}</ClassBadge>
							{assignment.subjectName && <SubjectBadge>{assignment.subjectName}</SubjectBadge>}
							<StatusBadge
								$status={getStatusText(assignment.status || 'Unknown', assignment.due_date)}
							>
								{getStatusText(assignment.status || 'Unknown', assignment.due_date)}
							</StatusBadge>
						</CourseInfo>
					</div>
				</AssignmentHeader>

				<Section>
					<SectionTitle>{t('description')}</SectionTitle>
					<Description>{assignment.description}</Description>
				</Section>

				<Section>
					<SectionTitle>{t('dueDates')}</SectionTitle>
					<DueDateInfo>
						<DateItem>
							<FiCalendar size={16} />
							<span>{t('assigned')}: {formatDate(assignment.created_at)}</span>
						</DateItem>
						<DateItem>
							<FiClock size={16} />
							<span>
								{t('due')}: {formatDate(assignment.due_date)} at {formatTime(assignment.due_date)}
							</span>
						</DateItem>
					</DueDateInfo>
				</Section>

				{assignment &&
				assignment.file_url &&
				Array.isArray(assignment.file_url) &&
				assignment.file_url.length > 0 ? (
					<Section>
						<SectionTitle>{t('assignmentMaterials')}</SectionTitle>
						{assignment.file_url.map((file, index) => (
							<MaterialItem key={index}>
								<MaterialIcon>{getFileIcon(file.url)}</MaterialIcon>
								<MaterialInfo>
									<MaterialName>{file.name}</MaterialName>
									<MaterialMeta>{t('assignmentMaterialFromTeacher')}</MaterialMeta>
								</MaterialInfo>
								<MaterialActions>
									<ActionButton
										onClick={() => {
											if (file.url) {
												window.open(file.url, '_blank')
											}
										}}
									>
										{t('view')}
									</ActionButton>
									<ActionButton
										onClick={() => {
											if (file.url) {
												const link = document.createElement('a')
												link.href = file.url
												link.download = file.name
												link.target = '_blank'
												document.body.appendChild(link)
												link.click()
												document.body.removeChild(link)
											}
										}}
									>
										<FiDownload size={16} />
										<span>{t('download')}</span>
									</ActionButton>
								</MaterialActions>
							</MaterialItem>
						))}
					</Section>
				) : assignment && assignment.file_url && typeof assignment.file_url === 'string' ? (
					// Legacy support for old string format
					<Section>
						<SectionTitle>{t('assignmentMaterials')}</SectionTitle>
						<MaterialItem>
							<MaterialIcon>{getFileIcon(assignment.file_url as string)}</MaterialIcon>
							<MaterialInfo>
								<MaterialName>{getFileName(assignment.file_url as string)}</MaterialName>
								<MaterialMeta>{t('assignmentMaterialFromTeacher')}</MaterialMeta>
							</MaterialInfo>
							<MaterialActions>
								<ActionButton
									onClick={() => {
										if (typeof assignment.file_url === 'string') {
											window.open(assignment.file_url, '_blank')
										}
									}}
								>
									{t('view')}
								</ActionButton>
								<ActionButton
									onClick={() => {
										if (typeof assignment.file_url === 'string') {
											const link = document.createElement('a')
											link.href = assignment.file_url
											link.download = getFileName(assignment.file_url)
											link.target = '_blank'
											document.body.appendChild(link)
											link.click()
											document.body.removeChild(link)
										}
									}}
								>
									<FiDownload size={16} />
									<span>{t('download')}</span>
								</ActionButton>
							</MaterialActions>
						</MaterialItem>
					</Section>
				) : null}

				<Section>
					<SectionTitle>{t('yourSubmission')}</SectionTitle>

					{existingSubmission ? (
						<ExistingSubmission>
							<SubmissionHeader>
								<div>
									<FiCheckCircle
										size={16}
										color={existingSubmission.status === 'rejected' ? '#dc2626' : '#4caf50'}
									/>
									<span>
										{t('submittedOn')} {formatDate(existingSubmission.submittedat)} at{' '}
										{formatTime(existingSubmission.submittedat)}
									</span>
								</div>
							</SubmissionHeader>

							{/* Display all submitted files */}
							{existingSubmission.fileurl && existingSubmission.fileurl.length > 0 && (
								<>
									{existingSubmission.fileurl.map((url, index) => (
										<ExistingFilePreview key={index}>
											<FileIcon>{getFileIcon(url)}</FileIcon>
											<FileDetails>
												<FileName>{getFileName(url)}</FileName>
												<FileInfo>
													{existingSubmission.status === 'rejected'
														? t('submissionRejectedDescription')
														: existingSubmission.status === 'accepted'
														? t('submissionAcceptedDescription')
														: t('submissionUnderReviewDescription')}
												</FileInfo>
											</FileDetails>
											<DownloadButton onClick={() => downloadSubmission(url)}>
												<FiDownload size={16} />
												<span>{t('download')}</span>
											</DownloadButton>
										</ExistingFilePreview>
									))}
								</>
							)}

							{/* Always show grade and feedback when available */}
							{(existingSubmission.grade !== undefined && existingSubmission.grade !== null) ||
							existingSubmission.feedback ? (
								<GradeFeedbackContainer>
									{existingSubmission.grade !== undefined && existingSubmission.grade !== null && (
										<GradeContainer>
											<GradeLabel>{t('grade')}:</GradeLabel>
											<GradeValue>{existingSubmission.grade}/10</GradeValue>
										</GradeContainer>
									)}

									{existingSubmission.feedback && (
										<FeedbackContainer>
											<FeedbackLabel>{t('teacherFeedback')}:</FeedbackLabel>
											<FeedbackContent>{existingSubmission.feedback}</FeedbackContent>
										</FeedbackContainer>
									)}
								</GradeFeedbackContainer>
							) : null}

							{existingSubmission && (
								<SubmissionAttemptsInfo>
									<AttemptsLabel>{t('submissionAttempts')}:</AttemptsLabel>
									<AttemptsCount $attempts={existingSubmission.attempt_count || 1}>
										{existingSubmission.attempt_count || 1}/2
										{existingSubmission.attempt_count && existingSubmission.attempt_count >= 2 && (
											<MaxAttemptsReached>
												{t('maxAttemptsReached')}
											</MaxAttemptsReached>
										)}
									</AttemptsCount>
								</SubmissionAttemptsInfo>
							)}
						</ExistingSubmission>
					) : (
						<ExistingSubmission>
							<SubmissionHeader>
								<div>
									<FiClock size={16} color='#9e9e9e' />
									<span>{t('notSubmittedYet')}</span>
								</div>
							</SubmissionHeader>

							<ExistingFilePreview>
								<FileIcon style={{ backgroundColor: '#f3f4f6', color: '#9e9e9e' }}>
									<FiFileText size={20} />
								</FileIcon>
								<FileDetails>
									<FileName>{t('noFilesUploaded')}</FileName>
									<FileInfo>{t('useFormBelowToSubmitAssignment')}</FileInfo>
								</FileDetails>
							</ExistingFilePreview>

							<GradeFeedbackContainer>
								<GradeContainer>
									<GradeLabel>{t('grade')}:</GradeLabel>
									<span style={{ fontSize: '14px', color: '#9e9e9e', fontStyle: 'italic' }}>
										{t('notGradedYet')}
									</span>
								</GradeContainer>

								<FeedbackContainer>
									<FeedbackLabel>{t('teacherFeedback')}:</FeedbackLabel>
									<FeedbackContent style={{ color: '#9e9e9e', fontStyle: 'italic' }}>
										{t('feedbackProvidedAfterSubmission')}
									</FeedbackContent>
								</FeedbackContainer>
							</GradeFeedbackContainer>
						</ExistingSubmission>
					)}

					{assignment.status !== 'completed' &&
						(!existingSubmission ||
							(existingSubmission.status === 'rejected' &&
								(!existingSubmission.attempt_count || existingSubmission.attempt_count < 2))) && (
							<SubmissionForm onSubmit={handleSubmit}>
								<DropzoneContainer {...getRootProps()} $isDragActive={isDragActive}>
									<input {...getInputProps()} />
									{selectedFile ? (
										<SelectedFilePreview>
											<FilePreviewIcon>{getFileIcon(selectedFile.name)}</FilePreviewIcon>
											<FilePreviewDetails>
												<FilePreviewName>{selectedFile.name}</FilePreviewName>
												<FilePreviewSize>
													{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
												</FilePreviewSize>
											</FilePreviewDetails>
											<RemoveFileButton
												type='button'
												onClick={e => {
													e.stopPropagation()
													handleRemoveFile()
												}}
											>
												<FiX size={18} />
											</RemoveFileButton>
										</SelectedFilePreview>
									) : (
										<DropzoneContent>
											<FiUpload size={32} />
											<DropzoneText>
												{isDragActive
													? t('dropTheFileHere')
													: t('dragAndDropAFileHereOrClickToSelectAFile')}
											</DropzoneText>
											<DropzoneSupportedText>
												{t('supportedFileTypes')}: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG
											</DropzoneSupportedText>
										</DropzoneContent>
									)}
								</DropzoneContainer>

								{uploading && (
									<ProgressContainer>
										<ProgressBar $progress={uploadProgress} />
										<ProgressText>{uploadProgress}% {t('uploaded')}</ProgressText>
									</ProgressContainer>
								)}

								<SubmitButtonContainer>
									<SubmitButton type='submit' disabled={!selectedFile || uploading}>
										{uploading
											? `${t('uploading')} ${uploadProgress}%`
											: existingSubmission
											? t('resubmitAssignment')
											: t('submitAssignment')}
									</SubmitButton>
								</SubmitButtonContainer>
							</SubmissionForm>
						)}

					{existingSubmission && existingSubmission.status !== 'rejected' && (
						<PendingReviewMessage>
							{existingSubmission.status === 'accepted'
								? t('submissionAcceptedDescription')
								: t('submissionUnderReviewDescription')}
						</PendingReviewMessage>
					)}

					{existingSubmission &&
						existingSubmission.status === 'rejected' &&
						existingSubmission.attempt_count &&
						existingSubmission.attempt_count >= 2 && (
							<MaxAttemptsMessage>
								{t('submissionRejectedMaxAttemptsMessage')}
							</MaxAttemptsMessage>
						)}
				</Section>
			</AssignmentCard>
		</Container>
	)
}

// Styled Components
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 24px;
`

const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
`

const PageTitle = styled.h1`
	font-size: 24px;
	font-weight: 700;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
`

const BackButton = styled.button`
	background-color: transparent;
	color: ${props => props.theme.colors.primary || '#4F46E5'};
	border: 1px solid ${props => props.theme.colors.primary || '#4F46E5'};
	border-radius: 8px;
	padding: 8px 16px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: ${props => `${props.theme.colors.primary || '#4F46E5'}10`};
	}
`

const AssignmentCard = styled.div`
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: 12px;
	border: 1px solid ${props => props.theme.colors.border.light};
	padding: 24px;
	box-shadow: ${props => props.theme.shadows.sm};
`

const AssignmentHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 24px;
	padding-bottom: 16px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const CourseName = styled.div`
	font-size: 14px;
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: 8px;
	text-transform: uppercase;
	font-weight: 500;
`

const AssignmentTitle = styled.h2`
	font-size: 24px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
	margin-bottom: 10px;
`

interface StatusProps {
	$status: 'Completed' | 'Submitted' | 'In Progress' | 'Due Soon' | 'Overdue' | 'Upcoming' | string
}

const AssignmentStatus = styled.span<StatusProps>`
	padding: 4px 10px;
	border-radius: 12px;
	font-size: 0.75rem;
	font-weight: 600;
	background-color: ${props => {
		switch (props.$status) {
			case 'Completed':
				return '#e8f5e9' // Light green
			case 'Submitted':
				return '#e1f5fe' // Light blue
			case 'In Progress':
				return '#e3f2fd' // Medium blue
			case 'Due Soon':
				return '#fff3e0' // Orange-ish
			case 'Overdue':
				return '#ffebee' // Red-ish
			case 'Upcoming':
				return '#fff8e1' // Yellow-ish
			default:
				return '#f5f5f5' // Light gray
		}
	}};
	color: ${props => {
		switch (props.$status) {
			case 'Completed':
				return '#16a34a' // Green
			case 'Submitted':
				return '#03a9f4' // Blue
			case 'In Progress':
				return '#03a9f4' // Medium blue
			case 'Due Soon':
				return '#ff9800' // Orange
			case 'Overdue':
				return '#f44336' // Red
			case 'Upcoming':
				return '#ffc107' // Amber
			default:
				return '#9e9e9e' // Gray
		}
	}};
`

const Section = styled.section`
	margin-bottom: 32px;
`

const SectionTitle = styled.h3`
	font-size: 18px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0 0 16px 0;
`

const Description = styled.p`
	font-size: 16px;
	line-height: 1.6;
	color: ${props => props.theme.colors.text.secondary};
	white-space: pre-wrap;
`

const DueDateInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`

const DateItem = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 15px;
	color: ${props => props.theme.colors.text.secondary};
`

const MaterialItem = styled.div`
	display: flex;
	align-items: center;
	padding: 16px;
	background-color: ${props => props.theme.colors.background.secondary || '#f9fafb'};
	border-radius: 8px;
	margin-bottom: 10px;
`

const MaterialIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border-radius: 8px;
	background-color: ${props => `${props.theme.colors.primary || '#4F46E5'}20`};
	color: ${props => props.theme.colors.primary || '#4F46E5'};
	margin-right: 16px;
`

const MaterialInfo = styled.div`
	flex: 1;
`

const MaterialName = styled.div`
	font-size: 16px;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: 4px;
`

const MaterialMeta = styled.div`
	font-size: 14px;
	color: ${props => props.theme.colors.text.secondary};
`

const MaterialActions = styled.div`
	display: flex;
	gap: 8px;
`

const ActionButton = styled.button`
	display: flex;
	align-items: center;
	gap: 6px;
	background-color: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.primary || '#4F46E5'};
	border: 1px solid ${props => props.theme.colors.primary || '#4F46E5'};
	border-radius: 6px;
	padding: 8px 12px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: ${props => `${props.theme.colors.primary || '#4F46E5'}10`};
	}
`

const SubmissionForm = styled.form`
	margin-top: 24px;
`

interface DropzoneProps {
	$isDragActive: boolean
}

const DropzoneContainer = styled.div<DropzoneProps>`
	border: 2px dashed
		${props =>
			props.$isDragActive
				? props.theme.colors.primary || '#4F46E5'
				: props.theme.colors.border.light};
	border-radius: 8px;
	padding: 24px;
	cursor: pointer;
	transition: all 0.2s;
	background-color: ${props =>
		props.$isDragActive
			? `${props.theme.colors.primary || '#4F46E5'}10`
			: props.theme.colors.background.secondary || '#f9fafb'};

	&:hover {
		border-color: ${props => props.theme.colors.primary || '#4F46E5'};
		background-color: ${props => `${props.theme.colors.primary || '#4F46E5'}10`};
	}
`

const DropzoneContent = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	color: ${props => props.theme.colors.text.secondary};
`

const DropzoneText = styled.p`
	font-size: 16px;
	text-align: center;
	margin: 0;
`

const DropzoneSupportedText = styled.p`
	font-size: 14px;
	text-align: center;
	margin: 0;
	color: ${props => props.theme.colors.text.tertiary || '#6b7280'};
`

const SelectedFilePreview = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 8px;
`

const FilePreviewIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 8px;
	background-color: ${props => `${props.theme.colors.primary || '#4F46E5'}20`};
	color: ${props => props.theme.colors.primary || '#4F46E5'};
`

const FilePreviewDetails = styled.div`
	flex: 1;
`

const FilePreviewName = styled.div`
	font-size: 15px;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 300px;
`

const FilePreviewSize = styled.div`
	font-size: 13px;
	color: ${props => props.theme.colors.text.secondary};
`

const RemoveFileButton = styled.button`
	background-color: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.text.secondary};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 50%;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		color: ${props => props.theme.colors.danger?.[500] || '#ef4444'};
		border-color: ${props => props.theme.colors.danger?.[500] || '#ef4444'};
	}
`

const SubmitButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
	margin-top: 24px;
`

const SubmitButton = styled.button`
	background-color: ${props => props.theme.colors.primary?.[700] || '#4F46E5'};
	color: white;
	border: none;
	border-radius: 8px;
	padding: 12px 24px;
	font-size: 16px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover:not(:disabled) {
		background-color: ${props => props.theme.colors.primary?.[900] || '#4338CA'};
	}

	&:disabled {
		background-color: ${props => props.theme.colors.neutral?.[400] || '#9ca3af'};
		cursor: not-allowed;
	}
`

const ExistingSubmission = styled.div`
	margin-bottom: 24px;
`

const SubmissionHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;

	div {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 15px;
		color: ${props => props.theme.colors.text.secondary};
	}
`

const DownloadButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	background-color: transparent;
	color: ${props => props.theme.colors.primary || '#4F46E5'};
	border: 1px solid ${props => props.theme.colors.primary || '#4F46E5'};
	border-radius: 6px;
	padding: 8px 12px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: ${props => `${props.theme.colors.primary || '#4F46E5'}10`};
	}
`

const ExistingFilePreview = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 16px;
	background-color: ${props => props.theme.colors.background.secondary || '#f9fafb'};
	border-radius: 8px;
`

const FileIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 8px;
	background-color: ${props => `${props.theme.colors.success?.[500] || '#4caf50'}20`};
	color: ${props => props.theme.colors.success?.[500] || '#4caf50'};
`

const FileDetails = styled.div`
	flex: 1;
`

const FileName = styled.div`
	font-size: 15px;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: 4px;
`

const FileInfo = styled.div`
	font-size: 14px;
	color: ${props => props.theme.colors.text.secondary};
`

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 0;
	color: ${props => props.theme.colors.text.secondary};
	text-align: center;

	p {
		margin: 16px 0 0 0;
		font-size: 16px;
	}
`

const LoadingSpinner = styled.div`
	border: 4px solid rgba(0, 0, 0, 0.1);
	border-radius: 50%;
	border-top-color: ${props => props.theme.colors.primary || '#4F46E5'};
	width: 40px;
	height: 40px;
	animation: spin 1s linear infinite;
	margin-bottom: 16px;

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
`

const ErrorMessage = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40px;
	text-align: center;

	h2 {
		margin: 0 0 16px 0;
		font-size: 20px;
		color: ${props => props.theme.colors.text.primary};
	}

	p {
		margin: 0 0 24px 0;
		font-size: 16px;
		color: ${props => props.theme.colors.text.secondary};
	}
`

const ProgressContainer = styled.div`
	margin-top: 16px;
	width: 100%;
	position: relative;
`

const ProgressText = styled.div`
	font-size: 14px;
	color: ${props => props.theme.colors.text.secondary};
	margin-top: 8px;
	text-align: center;
	font-weight: 500;
`

interface ProgressBarProps {
	$progress: number
}

const ProgressBar = styled.div<ProgressBarProps>`
	width: 100%;
	height: 10px;
	background-color: ${props => props.theme.colors.background.secondary || '#f3f4f6'};
	border-radius: 6px;
	overflow: hidden;
	position: relative;
	box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);

	&::after {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		width: ${props => `${props.$progress}%`};
		background-color: ${props => props.theme.colors.primary || '#4F46E5'};
		background-image: linear-gradient(
			45deg,
			rgba(255, 255, 255, 0.15) 25%,
			transparent 25%,
			transparent 50%,
			rgba(255, 255, 255, 0.15) 50%,
			rgba(255, 255, 255, 0.15) 75%,
			transparent 75%,
			transparent
		);
		background-size: 1rem 1rem;
		animation: progress-bar-stripes 1s linear infinite;
		transition: width 0.3s ease;
	}

	@keyframes progress-bar-stripes {
		from {
			background-position: 1rem 0;
		}
		to {
			background-position: 0 0;
		}
	}
`

const GradeFeedbackContainer = styled.div`
	margin-top: 16px;
	padding: 16px;
	background-color: ${props => props.theme.colors.background.secondary || '#f9fafb'};
	border-radius: 8px;
	margin-top: 16px;
`

const GradeContainer = styled.div`
	display: flex;
	align-items: center;
	margin-bottom: 12px;
`

const GradeLabel = styled.span`
	font-size: 15px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin-right: 8px;
`

const GradeValue = styled.span`
	font-size: 16px;
	font-weight: 700;
	color: ${props => {
		const grade = props.children ? parseInt(props.children.toString()) : 0
		if (grade >= 7) return props.theme.colors.success?.[600] || '#16a34a'
		if (grade >= 5) return props.theme.colors.warning?.[600] || '#f59e0b'
		return props.theme.colors.danger?.[600] || '#dc2626'
	}};
	background-color: ${props => {
		const grade = props.children ? parseInt(props.children.toString()) : 0
		if (grade >= 7) return props.theme.colors.success?.[100] || '#dcfce7'
		if (grade >= 5) return props.theme.colors.warning?.[100] || '#fef3c7'
		return props.theme.colors.danger?.[100] || '#fee2e2'
	}};
	padding: 4px 10px;
	border-radius: 20px;
`

const FeedbackContainer = styled.div``

const FeedbackLabel = styled.div`
	font-size: 15px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: 8px;
`

const FeedbackContent = styled.div`
	font-size: 15px;
	line-height: 1.5;
	color: ${props => props.theme.colors.text.secondary};
	white-space: pre-wrap;
	padding: 12px;
	background-color: white;
	border-radius: 6px;
	border: 1px solid ${props => props.theme.colors.border.light};
`

const SubjectBadge = styled.span`
	background-color: ${props => props.theme.colors.info?.[50] || '#e0f2fe'};
	color: ${props => props.theme.colors.info?.[600] || '#0284c7'};
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
	display: inline-flex;
	align-items: center;
	margin-right: 8px;
`

const CourseInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`

const ClassBadge = styled.span`
	background-color: ${props => props.theme.colors.info?.[50] || '#e0f2fe'};
	color: ${props => props.theme.colors.info?.[600] || '#0284c7'};
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
	display: inline-flex;
	align-items: center;
	margin-right: 8px;
`

const StatusBadge = styled.span<StatusProps>`
	padding: 4px 10px;
	border-radius: 12px;
	font-size: 0.75rem;
	font-weight: 600;
	background-color: ${props => {
		switch (props.$status) {
			case 'Completed':
				return '#e8f5e9' // Light green
			case 'Submitted':
				return '#e1f5fe' // Light blue
			case 'Accepted':
				return props.theme.colors.success?.[100] || '#dcfce7' // Brighter light green
			case 'Rejected':
				return props.theme.colors.danger?.[100] || '#fee2e2' // Brighter light red
			case 'Resubmitted':
				return '#e8f7ff' // Light blue (different shade)
			case 'In Progress':
				return '#e3f2fd' // Medium blue
			case 'Due Soon':
				return '#fff3e0' // Orange-ish
			case 'Overdue':
				return '#ffebee' // Red-ish
			case 'Upcoming':
				return '#fff8e1' // Yellow-ish
			default:
				return '#f5f5f5' // Light gray
		}
	}};
	color: ${props => {
		switch (props.$status) {
			case 'Completed':
				return '#16a34a' // Green
			case 'Submitted':
				return '#03a9f4' // Blue
			case 'Accepted':
				return props.theme.colors.success?.[700] || '#15803d' // Darker green for better contrast
			case 'Rejected':
				return props.theme.colors.danger?.[700] || '#b91c1c' // Darker red for better contrast
			case 'Resubmitted':
				return '#0288d1' // Darker blue
			case 'In Progress':
				return '#03a9f4' // Medium blue
			case 'Due Soon':
				return '#ff9800' // Orange
			case 'Overdue':
				return '#f44336' // Red
			case 'Upcoming':
				return '#ffc107' // Amber
			default:
				return '#9e9e9e' // Gray
		}
	}};
`

const SubmissionStatus = styled.div<{ $status: string }>`
	margin-top: 12px;
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	text-align: center;

	${props => {
		const status = props.$status?.toLowerCase()
		switch (status) {
			case 'accepted':
				return `
					background-color: ${props.theme.colors.success?.[50] || '#dcfce7'};
					color: ${props.theme.colors.success?.[600] || '#16a34a'};
					border: 1px solid ${props.theme.colors.success?.[300] || '#86efac'};
				`
			case 'rejected':
				return `
					background-color: ${props.theme.colors.danger?.[50] || '#fee2e2'};
					color: ${props.theme.colors.danger?.[600] || '#dc2626'};
					border: 1px solid ${props.theme.colors.danger?.[300] || '#fca5a5'};
				`
			default:
				return `
					background-color: ${props.theme.colors.warning?.[50] || '#fef3c7'};
					color: ${props.theme.colors.warning?.[600] || '#f59e0b'};
					border: 1px solid ${props.theme.colors.warning?.[300] || '#fcd34d'};
				`
		}
	}}
`

const PendingReviewMessage = styled.div`
	margin-top: 24px;
	padding: 16px;
	background-color: ${props => props.theme.colors.info?.[50] || '#e0f2fe'};
	color: ${props => props.theme.colors.info?.[600] || '#0284c7'};
	border-radius: 6px;
	font-size: 14px;
	line-height: 1.5;
	text-align: center;
`

const SubmissionAttemptsInfo = styled.div`
	display: flex;
	align-items: center;
	margin-top: 16px;
	padding: 12px 16px;
	background-color: ${props => props.theme.colors.background.secondary || '#f9fafb'};
	border-radius: 8px;
`

const AttemptsLabel = styled.span`
	font-size: 14px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin-right: 8px;
`

interface AttemptsCountProps {
	$attempts: number
}

const AttemptsCount = styled.span<AttemptsCountProps>`
	font-size: 14px;
	font-weight: 700;
	color: ${props => {
		return props.$attempts >= 2
			? props.theme.colors.danger?.[600] || '#dc2626'
			: props.theme.colors.text.primary
	}};
`

const MaxAttemptsReached = styled.span`
	margin-left: 8px;
	font-size: 14px;
	font-weight: 500;
	color: ${props => props.theme.colors.danger?.[600] || '#dc2626'};
`

const MaxAttemptsMessage = styled.div`
	margin-top: 24px;
	padding: 16px;
	background-color: ${props => props.theme.colors.danger?.[50] || '#fee2e2'};
	color: ${props => props.theme.colors.danger?.[600] || '#dc2626'};
	border-radius: 6px;
	font-size: 14px;
	line-height: 1.5;
	text-align: center;
`

export default SingleAssignment
