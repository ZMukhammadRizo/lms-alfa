import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import {
	FiCalendar,
	FiCheckCircle,
	FiChevronDown,
	FiClock,
	FiFile,
	FiFileText,
	FiPaperclip,
	FiSearch,
	FiVideo,
} from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import Card from '../../components/common/Card'
import supabase from '../../config/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import {
	Assignment,
	AttachmentFile,
	getAssignmentsForSingleStudent,
	getStudentCourses,
} from '../../services/assignmentService'

// For accessibility - bind modal to app element
// Modal.setAppElement('#root')

// Define Material interface to use in the component
interface Material {
	id: string
	title: string
	description: string
	type: 'video' | 'document' | 'link' | string
	url: string
}

// Extend the Assignment interface to include file_url and submission data
interface ExtendedAssignment extends Assignment {
	file_url?: string | null
	classid?: string
	className?: string
	subjectName?: string // Add subject name field
	submission?: {
		id: string
		fileurl: string[] // Changed from string to string[] to support multiple files
		submittedat: string
		grade?: number | null
		feedback?: string | null
		status?: string | null // Add status field
	} | null
}

const Assignments: React.FC = () => {
	const { t } = useTranslation()
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
	const [showCourseDropdown, setShowCourseDropdown] = useState(false)
	const [activeTab, setActiveTab] = useState('all')
	const [loading, setLoading] = useState(true)

	// State for assignments and courses data from API
	const [assignments, setAssignments] = useState<ExtendedAssignment[]>([])
	const [courses, setCourses] = useState<any[]>([])

	const { user } = useAuth()
	const navigate = useNavigate()
	// const { theme } = useTheme(); // Removed as theme is accessed via props

	// Load assignments and courses from API
	useEffect(() => {
		const fetchData = async () => {
			// Don't try to fetch data if user ID is missing
			if (!user?.id) {
				console.warn('No user ID available. Skipping data fetch.')
				return
			}

			setLoading(true)
			try {
				// Use the real functions to fetch data
				const assignmentsData = await getAssignmentsForSingleStudent(user.id)
				const coursesData = await getStudentCourses(user.id)

				// Create a mapping of subject IDs to names for easy lookup
				const subjectMap = new Map(coursesData.map(course => [course.id, course.name]))

				// Fetch submissions for each assignment
				const assignmentsWithSubmissions = await Promise.all(
					assignmentsData.map(async assignment => {
						try {
							// Check if student has submitted this assignment
							const { data: submissionData, error } = await supabase
								.from('submissions')
								.select('*')
								.eq('assignmentid', assignment.id)
								.eq('studentid', user.id)
								.maybeSingle()

							if (error) throw error

							// Ensure created_at has a valid value
							const created_at =
								assignment.created_at ||
								assignment.updated_at ||
								assignment.due_date ||
								new Date().toISOString()

							// Process submission data to ensure fileurl is an array
							let processedSubmission = null
							if (submissionData) {
								processedSubmission = {
									...submissionData,
									fileurl: Array.isArray(submissionData.fileurl)
										? submissionData.fileurl
										: submissionData.fileurl
										? [submissionData.fileurl]
										: [],
								}
							}

							return {
								...assignment,
								created_at, // Add the fixed created_at
								subjectName: assignment.subject_id
									? subjectMap.get(assignment.subject_id) || t('student.assignments.unknownSubject')
									: t('student.assignments.general'),
								submission: processedSubmission,
							} as ExtendedAssignment
						} catch (error) {
							console.error(`Error fetching submission for assignment ${assignment.id}:`, error)

							// Ensure created_at has a valid value even in error case
							const created_at =
								assignment.created_at ||
								assignment.updated_at ||
								assignment.due_date ||
								new Date().toISOString()

							return {
								...assignment,
								created_at, // Add the fixed created_at
								subjectName: assignment.subject_id
									? subjectMap.get(assignment.subject_id) || t('student.assignments.unknownSubject')
									: t('student.assignments.general'),
							} as ExtendedAssignment
						}
					})
				)

				setAssignments(assignmentsWithSubmissions)
				setCourses(coursesData)
			} catch (error) {
				console.error('Error fetching assignments data:', error)
				toast.error(t('student.assignments.errors.failedToLoad'))
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [user])

	// Format date for display - with error handling
	const formatDate = (dateString: string | null | undefined): string => {
		if (!dateString) return t('student.assignments.dates.notSpecified')

		try {
			const date = new Date(dateString)

			// Check if date is valid
			if (isNaN(date.getTime())) {
				return t('student.assignments.dates.notSpecified')
			}

			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			})
		} catch (error) {
			console.error('Error formatting date:', error)
			return t('student.assignments.dates.notSpecified')
		}
	}

	// Format time for display - with error handling
	const formatTime = (dateString: string | null | undefined): string => {
		if (!dateString) return t('student.assignments.dates.notAvailable')

		try {
			const date = new Date(dateString)

			// Check if date is valid
			if (isNaN(date.getTime())) {
				return t('student.assignments.dates.notAvailable')
			}

			return date.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
			})
		} catch (error) {
			console.error('Error formatting time:', error)
			return t('student.assignments.dates.notAvailable')
		}
	}

	// Get status text
	const getStatusText = (assignment: ExtendedAssignment): string => {
		const { due_date, submission } = assignment

		if (!due_date) {
			return assignment.status
				? assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)
				: t('student.assignments.statuses.unknown')
		}

		// First check submission status - prioritize teacher's status feedback
		if (submission) {
			if (submission.status === 'accepted') {
				return t('student.assignments.statuses.accepted')
			}

			if (submission.status === 'rejected') {
				return t('student.assignments.statuses.rejected')
			}

			// Check if assignment has been resubmitted (more than one file and null status)
			if (submission.status === null && submission.fileurl && submission.fileurl.length > 1) {
				return t('student.assignments.statuses.resubmitted')
			}

			// Then check if graded
			if (submission.grade !== undefined && submission.grade !== null) {
				return t('student.assignments.statuses.completed')
			}

			// Default for any submission without explicit status
			return t('student.assignments.statuses.submitted')
		}

		// Local implementation of getDaysRemaining
		const getLocalDaysRemaining = (dueDateStr: string): number => {
			try {
				const dueDate = new Date(dueDateStr)
				const today = new Date()

				// If dueDate is invalid, return 0
				if (isNaN(dueDate.getTime())) {
					return 0
				}

				// Set time to 00:00:00 for accurate day calculation
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

		// If not submitted, check due date
		const days = getLocalDaysRemaining(due_date)
		if (days <= 3 && days > 0) {
			return t('student.assignments.statuses.dueSoon')
		} else if (days <= 0) {
			return t('student.assignments.statuses.overdue')
		} else if (days <= 7) {
			return t('student.assignments.statuses.inProgress')
		} else {
			return t('student.assignments.statuses.upcoming')
		}
	}

	// Helper function to get status type for colors (language-independent)
	const getStatusType = (assignment: ExtendedAssignment): string => {
		const { due_date, submission } = assignment

		if (!due_date) {
			return assignment.status || 'unknown'
		}

		// First check submission status - prioritize teacher's status feedback
		if (submission) {
			if (submission.status === 'accepted') {
				return 'accepted'
			}

			if (submission.status === 'rejected') {
				return 'rejected'
			}

			// Check if assignment has been resubmitted
			if (submission.status === null && submission.fileurl && submission.fileurl.length > 1) {
				return 'resubmitted'
			}

			// Then check if graded
			if (submission.grade !== undefined && submission.grade !== null) {
				return 'completed'
			}

			// Default for any submission without explicit status
			return 'submitted'
		}

		// If not submitted, check due date
		const getLocalDaysRemaining = (dueDateStr: string): number => {
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

		const days = getLocalDaysRemaining(due_date)
		if (days <= 3 && days > 0) {
			return 'dueSoon'
		} else if (days <= 0) {
			return 'overdue'
		} else if (days <= 7) {
			return 'inProgress'
		} else {
			return 'upcoming'
		}
	}

	// Filter assignments based on search term, selected course, and active tab
	const filteredAssignments = assignments.filter(assignment => {
		const matchesSearch =
			assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(assignment.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())

		const matchesCourse = selectedCourse ? assignment.subject_id === selectedCourse : true

		// Use computed status
		const status = getStatusText(assignment)
		const matchesTab = activeTab === 'all' ? true : activeTab.toLowerCase() === status.toLowerCase()

		return matchesSearch && matchesCourse && matchesTab
	})

	// Handle course selection
	const handleCourseSelect = (courseId: string | null) => {
		setSelectedCourse(courseId)
		setShowCourseDropdown(false)
	}

	// Get course name for dropdown display
	const getCourseName = (courseId: string | null) => {
		if (!courseId) return t('student.assignments.allCourses')
		const course = courses.find(c => c.id === courseId)
		return course ? course.name : t('student.assignments.allCourses')
	}

	// Open modal with assignment details
	const openAssignmentDetails = (assignment: ExtendedAssignment) => {
		navigate(`/student/assignments/${assignment.id}`)
	}

	// Handle file download
	const downloadFile = (file: AttachmentFile) => {
		try {
			// Check if URL exists
			if (!file.url) {
				toast.error(t('student.assignments.errors.fileUrlMissing'))
				return
			}

			// Create a temporary link element
			const link = document.createElement('a')
			link.href = file.url
			link.download = file.name // Set the file name for the download
			link.target = '_blank' // Open in new tab if download doesn't start automatically

			// Append to body, click, and remove
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)

			toast.success(t('student.assignments.messages.downloadingFile', { fileName: file.name }))
		} catch (error) {
			console.error('Error downloading file:', error)
			toast.error(t('student.assignments.errors.downloadFailed'))
		}
	}

	// Add these helper functions at the top level of your component
	const getFileIcon = (fileUrl: string | null | undefined) => {
		if (!fileUrl) return <FiFileText size={20} />

		if (fileUrl.includes('.pdf')) return <FiFile size={20} />
		if (fileUrl.includes('.mp4') || fileUrl.includes('.mov') || fileUrl.includes('.avi'))
			return <FiVideo size={20} />
		if (fileUrl.includes('.doc') || fileUrl.includes('.docx')) return <FiFileText size={20} />

		return <FiFileText size={20} />
	}

	const getFileName = (fileUrl: string | null | undefined) => {
		if (!fileUrl) return t('student.assignments.attachments.document')

		try {
			// Extract filename from URL
			const urlParts = fileUrl.split('/')
			let fileName = urlParts[urlParts.length - 1]

			// Clean up file name (remove query parameters, etc)
			fileName = fileName.split('?')[0]

			// If the file name is still complex or empty, provide a default
			if (!fileName || fileName.length < 3) {
				return t('student.assignments.attachments.document')
			}

			// Try to decode URI components and remove any UUID prefixes
			let decodedName = decodeURIComponent(fileName)

			// Check if it's a UUID pattern followed by underscore or dash and clean it up
			if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[_-]/.test(decodedName)) {
				decodedName = decodedName.replace(
					/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[_-]/,
					''
				)
			}
			// Also clean up if it's just a UUID without a real filename
			else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(decodedName)) {
				return t('student.assignments.attachments.document')
			}

			return decodedName
		} catch (e) {
			return t('student.assignments.attachments.document')
		}
	}

	if (loading) {
		return (
			<LoadingContainer>
				<LoadingSpinner />
				<p>{t('student.assignments.loadingAssignments')}</p>
			</LoadingContainer>
		)
	}

	return (
		<AssignmentsContainer>
			<PageHeader>
				<HeaderContent>
					<PageTitle>{t('student.assignments.title')}</PageTitle>
					<PageDescription>{t('student.assignments.description')}</PageDescription>
				</HeaderContent>
			</PageHeader>

			<FilterSection>
				<SearchBar>
					<SearchIcon>
						<FiSearch size={18} />
					</SearchIcon>
					<SearchInput
						type='text'
						placeholder={t('student.assignments.searchPlaceholder')}
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
					/>
				</SearchBar>

				<FilterControls>
					<CourseDropdown>
						<CourseSelector onClick={() => setShowCourseDropdown(!showCourseDropdown)}>
							<span>{getCourseName(selectedCourse)}</span>
							<FiChevronDown size={16} />
						</CourseSelector>

						{showCourseDropdown && (
							<CourseDropdownMenu>
								<CourseOption
									onClick={() => handleCourseSelect(null)}
									$isSelected={selectedCourse === null}
								>
									{t('student.assignments.allCourses')}
								</CourseOption>
								{courses.map(course => (
									<CourseOption
										key={course.id}
										onClick={() => handleCourseSelect(course.id.toString())}
										$isSelected={selectedCourse === course.id.toString()}
									>
										{course.name}
									</CourseOption>
								))}
							</CourseDropdownMenu>
						)}
					</CourseDropdown>

					<TabsContainer>
						<TabButton $isActive={activeTab === 'all'} onClick={() => setActiveTab('all')}>
							{t('student.assignments.statuses.all')}
						</TabButton>
						<TabButton
							$isActive={activeTab === 'in-progress' || activeTab === 'In Progress'}
							onClick={() => setActiveTab('In Progress')}
						>
							{t('student.assignments.statuses.inProgress')}
						</TabButton>
						<TabButton
							$isActive={activeTab === 'upcoming' || activeTab === 'Upcoming'}
							onClick={() => setActiveTab('Upcoming')}
						>
							{t('student.assignments.statuses.upcoming')}
						</TabButton>
						<TabButton
							$isActive={activeTab === 'submitted' || activeTab === 'Submitted'}
							onClick={() => setActiveTab('Submitted')}
						>
							{t('student.assignments.statuses.submitted')}
						</TabButton>
						<TabButton
							$isActive={activeTab === 'resubmitted' || activeTab === 'Resubmitted'}
							onClick={() => setActiveTab('Resubmitted')}
						>
							{t('student.assignments.statuses.resubmitted')}
						</TabButton>
						<TabButton
							$isActive={activeTab === 'completed' || activeTab === 'Completed'}
							onClick={() => setActiveTab('Completed')}
						>
							{t('student.assignments.statuses.completed')}
						</TabButton>
						<TabButton
							$isActive={activeTab === 'due soon' || activeTab === 'Due Soon'}
							onClick={() => setActiveTab('Due Soon')}
						>
							{t('student.assignments.statuses.dueSoon')}
						</TabButton>
						<TabButton
							$isActive={activeTab === 'overdue' || activeTab === 'Overdue'}
							onClick={() => setActiveTab('Overdue')}
						>
							{t('student.assignments.statuses.overdue')}
						</TabButton>
					</TabsContainer>
				</FilterControls>
			</FilterSection>

			<AssignmentsList>
				{filteredAssignments.map(assignment => (
					<AssignmentCard key={assignment.id} as={motion.div} whileHover={{ y: -4 }}>
						<AssignmentContent>
							<AssignmentHeader>
								<CourseName>
									{assignment.subjectName || assignment.className || t('student.assignments.general')}
								</CourseName>
								<AssignmentStatus $status={getStatusType(assignment)}>
									{getStatusText(assignment)}
								</AssignmentStatus>
							</AssignmentHeader>

							<AssignmentTitle>{assignment.title}</AssignmentTitle>
							<AssignmentDates>
								<DateItem>
									<FiCalendar size={14} />
									{t('student.assignments.dates.assigned')} {formatDate(assignment.created_at)}
								</DateItem>
								<DateItem>
									<FiClock size={14} />
									{t('student.assignments.dates.due')} {formatDate(assignment.due_date)} {t('student.assignments.dates.at')} {formatTime(assignment.due_date)}
								</DateItem>
							</AssignmentDates>

							{assignment.attachments && assignment.attachments.length > 0 && (
								<AttachmentsSection>
									<AttachmentsHeader>
										<FiPaperclip size={14} />
										<span>{t('student.assignments.attachments.count', { count: assignment.attachments.length })}</span>
									</AttachmentsHeader>
									<AttachmentsList>
										{assignment.attachments.map(attachment => (
											<AttachmentItem key={attachment.id}>
												<FiFileText size={14} />
												<AttachmentName>{attachment.name}</AttachmentName>
												<AttachmentSize>{attachment.size}</AttachmentSize>
											</AttachmentItem>
										))}
									</AttachmentsList>
								</AttachmentsSection>
							)}

							{assignment.status === 'completed' ||
							getStatusType(assignment) === 'completed' ||
							getStatusType(assignment) === 'submitted' ||
							getStatusType(assignment) === 'accepted' ||
							getStatusType(assignment) === 'resubmitted' ||
							getStatusType(assignment) === 'rejected' ? (
								<CompletedSection>
									<CompletedHeader>
										<FiCheckCircle
											size={14}
											color={getStatusType(assignment) === 'rejected' ? '#f44336' : '#4caf50'}
										/>
										<span>
											{assignment.submission
												? `${t('student.assignments.dates.submittedOn')} ${formatDate(assignment.submission.submittedat)}`
												: `${t('student.assignments.dates.completedOn')} ${formatDate(
														assignment.submission_date || assignment.updated_at
												  )}`}
										</span>
									</CompletedHeader>
									{assignment.submission?.grade !== undefined &&
										assignment.submission?.grade !== null && (
											<GradeDisplay>
												<GradeLabel>{t('student.assignments.grading.grade')}</GradeLabel>
												<GradeValue $score={assignment.submission.grade}>
													{assignment.submission.grade}/10
												</GradeValue>
											</GradeDisplay>
										)}
									{assignment.submission?.feedback && (
										<FeedbackPreview>
											<FeedbackLabel>{t('student.assignments.grading.feedback')}</FeedbackLabel>
											<FeedbackText>
												{assignment.submission.feedback.length > 50
													? `${assignment.submission.feedback.substring(0, 50)}...`
													: assignment.submission.feedback}
											</FeedbackText>
										</FeedbackPreview>
									)}
								</CompletedSection>
							) : (
								<CompletedSection>
									<CompletedHeader>
										<FiClock size={14} color='#9e9e9e' />
										<span>{t('student.assignments.submission.notSubmittedYet')}</span>
									</CompletedHeader>
									<GradeDisplay>
										<GradeLabel>{t('student.assignments.grading.grade')}</GradeLabel>
										<span style={{ fontSize: '13px', color: '#9e9e9e', fontStyle: 'italic' }}>
											{t('student.assignments.grading.notGradedYet')}
										</span>
									</GradeDisplay>
									<FeedbackPreview>
										<FeedbackLabel>{t('student.assignments.grading.feedback')}</FeedbackLabel>
										<FeedbackText style={{ color: '#9e9e9e', fontStyle: 'italic' }}>
											{t('student.assignments.grading.feedbackPending')}
										</FeedbackText>
									</FeedbackPreview>
								</CompletedSection>
							)}
						</AssignmentContent>

						<AssignmentFooter>
							<ViewDetailsButton>
								<Link to={`/student/assignments/${assignment.id}`}>{t('student.assignments.submission.viewDetails')}</Link>
							</ViewDetailsButton>
						</AssignmentFooter>
					</AssignmentCard>
				))}
			</AssignmentsList>

			{filteredAssignments.length === 0 && (
				<NoAssignmentsMessage>
					<FiFileText size={40} />
					<h3>{t('student.assignments.noAssignments')}</h3>
					<p>{t('student.assignments.tryAdjustingFilters')}</p>
				</NoAssignmentsMessage>
			)}
		</AssignmentsContainer>
	)
}

const AssignmentsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 24px;
`

const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}
`

const HeaderContent = styled.div`
	display: flex;
	flex-direction: column;
`

const PageTitle = styled.h1`
	font-size: 24px;
	font-weight: 700;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
`

const PageDescription = styled.p`
	font-size: 14px;
	color: ${props => props.theme.colors.text.secondary};
	margin: 4px 0 0 0;
`

const FilterSection = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	justify-content: space-between;
	align-items: center;
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: 12px;
	padding: 16px;
	margin-bottom: 24px;
	box-shadow: ${props => props.theme.shadows.sm};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
		align-items: flex-start;
	}
`

const SearchBar = styled.div`
	display: flex;
	align-items: center;
	background-color: ${props => props.theme.colors.background.primary};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 8px;
	padding: 0 12px;
	width: 100%;
	max-width: 320px;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		max-width: 100%;
	}
`

const SearchIcon = styled.div`
	color: ${props => props.theme.colors.text.secondary};
	margin-right: 8px;
`

const SearchInput = styled.input`
	border: none;
	background: transparent;
	height: 40px;
	width: 100%;
	color: ${props => props.theme.colors.text.primary};
	outline: none;
	font-size: 14px;

	&::placeholder {
		color: ${props => props.theme.colors.text.secondary};
	}
`

const FilterControls = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;

	@media (min-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}
`

const CourseDropdown = styled.div`
	position: relative;
	width: 100%;
	max-width: 300px;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		max-width: 100%;
	}
`

const CourseSelector = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	color: ${props => props.theme.colors.text.primary};
	background-color: ${props => props.theme.colors.background.secondary};
	min-width: 180px;
	justify-content: space-between;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
		border-color: ${props => props.theme.colors.primary[300]};
		color: ${props => props.theme.colors.primary[500]};
	}

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		width: 100%;
	}
`

const CourseDropdownMenu = styled.div`
	position: absolute;
	top: calc(100% + 4px);
	left: 0;
	width: 100%;
	background-color: ${props => props.theme.colors.background.primary};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 8px;
	box-shadow: ${props => props.theme.shadows.md};
	z-index: 10;
	max-height: 300px;
	overflow-y: auto;
`

interface CourseOptionProps {
	$isSelected: boolean
}

const CourseOption = styled.div<CourseOptionProps>`
	padding: 8px 12px;
	cursor: pointer;
	font-size: 14px;
	color: ${props =>
		props.$isSelected ? props.theme.colors.primary : props.theme.colors.text.primary};
	background-color: ${props =>
		props.$isSelected ? `${props.theme.colors.primary}10` : 'transparent'};

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}

	&:first-child {
		border-top-left-radius: 8px;
		border-top-right-radius: 8px;
	}

	&:last-child {
		border-bottom-left-radius: 8px;
		border-bottom-right-radius: 8px;
	}
`

const TabsContainer = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	margin-top: 8px;
	overflow-x: auto;
	width: 100%;
	padding-bottom: 4px;

	/* Hide scrollbar but allow scrolling */
	-ms-overflow-style: none; /* IE and Edge */
	scrollbar-width: none; /* Firefox */
	&::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		justify-content: flex-start;
		flex-wrap: nowrap;
		overflow-x: auto;
		padding-bottom: 12px;
	}
`

interface TabButtonProps {
	$isActive: boolean
}

const TabButton = styled.button<TabButtonProps>`
	background-color: ${props => (props.$isActive ? props.theme.colors.primary[500] : 'transparent')};
	color: ${props => (props.$isActive ? 'white' : props.theme.colors.text.secondary)};
	border: 1px solid
		${props =>
			props.$isActive ? props.theme.colors.primary[500] : props.theme.colors.border.light};
	border-radius: 8px;
	padding: 8px 16px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: all 0.2s ease;
	white-space: nowrap;

	&:hover {
		background-color: ${props =>
			props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.background.hover};
		border-color: ${props =>
			props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.primary[300]};
		color: ${props => (props.$isActive ? 'white' : props.theme.colors.primary[500])};
	}
`

const AssignmentsList = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
	gap: 20px;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		grid-template-columns: 1fr;
	}
`

const AssignmentCard = styled(Card)`
	display: flex;
	flex-direction: column;
	padding: 20px;
	gap: 16px;
	border-radius: 12px;
	border: 1px solid ${props => props.theme.colors.border.light};
	transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

	&:hover {
		box-shadow: ${props => props.theme.shadows.md};
	}
`

const AssignmentContent = styled.div`
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	gap: 12px;
`

const AssignmentHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
`

const CourseName = styled.span`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
	font-weight: 500;
	text-transform: uppercase;
`

interface StatusProps {
	$status: 'completed' | 'submitted' | 'inProgress' | 'dueSoon' | 'overdue' | 'upcoming' | 'accepted' | 'rejected' | 'resubmitted' | string
}

const AssignmentStatus = styled.span<StatusProps>`
	padding: 4px 10px;
	border-radius: 12px;
	font-size: 0.75rem;
	font-weight: 600;
	background-color: ${props => {
		switch (props.$status) {
			case 'completed':
				return '#e8f5e9' // Light green
			case 'submitted':
				return '#e1f5fe' // Light blue
			case 'accepted':
				return '#dcfce7' // Light green (success)
			case 'rejected':
				return '#fee2e2' // Light red
			case 'resubmitted':
				return '#e8f7ff' // Light blue (different shade)
			case 'inProgress':
				return '#e3f2fd' // Medium blue
			case 'dueSoon':
				return '#fff3e0' // Orange-ish
			case 'overdue':
				return '#ffebee' // Red-ish
			case 'upcoming':
				return '#fff8e1' // Yellow-ish
			default:
				return '#f5f5f5' // Light gray
		}
	}};
	color: ${props => {
		switch (props.$status) {
			case 'completed':
				return '#4caf50' // Green
			case 'submitted':
				return '#03a9f4' // Blue
			case 'accepted':
				return '#16a34a' // Green (success)
			case 'rejected':
				return '#dc2626' // Red (danger)
			case 'resubmitted':
				return '#0288d1' // Darker blue
			case 'inProgress':
				return '#2196f3' // Medium blue
			case 'dueSoon':
				return '#ff9800' // Orange
			case 'overdue':
				return '#f44336' // Red
			case 'upcoming':
				return '#ffc107' // Amber
			default:
				return '#9e9e9e' // Gray
		}
	}};
`

const AssignmentTitle = styled.h3`
	font-size: 1.1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
	line-height: 1.4;
`

const AssignmentDates = styled.div`
	display: flex;
	gap: 16px;
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-top: auto;
`

const DateItem = styled.span`
	display: flex;
	align-items: center;
	gap: 6px;
`

const AttachmentsSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding-top: 8px;
	border-top: 1px solid ${props => props.theme.colors.border.light};
`

const AttachmentsHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const AttachmentsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`

const AttachmentItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 6px 8px;
	background-color: ${props => props.theme.colors.background.hover};
	border-radius: 6px;
	font-size: 13px;

	&:hover {
		background-color: ${props => props.theme.colors.primary[600]};
	}
`

const AttachmentName = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	color: ${props => props.theme.colors.text.primary};
`

const AttachmentSize = styled.div`
	font-size: 12px;
	color: ${props => props.theme.colors.text.secondary};
`

const CompletedSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding-top: 8px;
	border-top: 1px solid ${props => props.theme.colors.border.light};
`

const CompletedHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	color: ${props => props.theme.colors.text.secondary};
`

const GradeDisplay = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 4px;
`

const GradeLabel = styled.div`
	font-size: 13px;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

interface GradeValueProps {
	$score: number
}

const GradeValue = styled.div<GradeValueProps>`
	font-size: 16px;
	font-weight: 600;
	color: ${props => {
		// Convert percentage to 1-10 scale for consistency
		const score = props.$score
		if (score >= 7) return props.theme.colors.success?.[600] || '#16a34a' // Green
		if (score >= 5) return props.theme.colors.warning?.[600] || '#f59e0b' // Yellow/Orange
		return props.theme.colors.danger?.[600] || '#dc2626' // Red
	}};
	background-color: ${props => {
		// Convert percentage to 1-10 scale for consistency
		const score = props.$score
		if (score >= 7) return props.theme.colors.success?.[100] || '#dcfce7' // Light green
		if (score >= 5) return props.theme.colors.warning?.[100] || '#fef3c7' // Light yellow
		return props.theme.colors.danger?.[100] || '#fee2e2' // Light red
	}};
	padding: 4px 10px;
	border-radius: 20px;
`

const AssignmentFooter = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: auto;
	padding-top: 16px;
`

const ViewDetailsButton = styled.button`
	background-color: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.primary};
	border: 1px solid ${props => props.theme.colors.primary};
	border-radius: 6px;
	padding: 8px 12px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: ${props => `${props.theme.colors.primary}10`};
	}
`

const NoAssignmentsMessage = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 0;
	color: ${props => props.theme.colors.text.secondary};
	text-align: center;

	h3 {
		margin: 16px 0 8px 0;
		font-size: 18px;
		font-weight: 600;
		color: ${props => props.theme.colors.text.primary};
	}

	p {
		margin: 0;
		font-size: 14px;
	}
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
		font-size: 14px;
	}
`

const LoadingSpinner = styled.div`
	border: 4px solid rgba(0, 0, 0, 0.1);
	border-radius: 50%;
	border-top-color: #3f51b5;
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

const FeedbackPreview = styled.div`
	margin-top: 8px;
	padding-top: 8px;
	border-top: 1px dashed ${props => props.theme.colors.border.light};
`

const FeedbackLabel = styled.div`
	font-size: 12px;
	font-weight: 500;
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: 4px;
`

const FeedbackText = styled.div`
	font-size: 13px;
	color: ${props => props.theme.colors.text.primary};
	font-style: italic;
	line-height: 1.4;
`

export default Assignments
