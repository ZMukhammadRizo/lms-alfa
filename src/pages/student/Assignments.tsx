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
									? subjectMap.get(assignment.subject_id) || 'Unknown Subject'
									: 'General',
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
									? subjectMap.get(assignment.subject_id) || 'Unknown Subject'
									: 'General',
							} as ExtendedAssignment
						}
					})
				)

				setAssignments(assignmentsWithSubmissions)
				setCourses(coursesData)
			} catch (error) {
				console.error('Error fetching assignments data:', error)
				toast.error('Failed to load assignments. Please try again later.')
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [user])

	// Format date for display - with error handling
	const formatDate = (dateString: string | null | undefined): string => {
		if (!dateString) return 'Not specified'

		try {
			const date = new Date(dateString)

			// Check if date is valid
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

	// Format time for display - with error handling
	const formatTime = (dateString: string | null | undefined): string => {
		if (!dateString) return 'N/A'

		try {
			const date = new Date(dateString)

			// Check if date is valid
			if (isNaN(date.getTime())) {
				return 'N/A'
			}

			return date.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
			})
		} catch (error) {
			console.error('Error formatting time:', error)
			return 'N/A'
		}
	}

	// Get status text
	const getStatusText = (assignment: ExtendedAssignment): string => {
		const { due_date, submission } = assignment

		if (!due_date) {
			return assignment.status
				? assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)
				: 'Unknown'
		}

		// First check submission status - prioritize teacher's status feedback
		if (submission) {
			if (submission.status === 'accepted') {
				return 'Accepted'
			}

			if (submission.status === 'rejected') {
				return 'Rejected'
			}

			// Check if assignment has been resubmitted (more than one file and null status)
			if (submission.status === null && submission.fileurl && submission.fileurl.length > 1) {
				return 'Resubmitted'
			}

			// Then check if graded
			if (submission.grade !== undefined && submission.grade !== null) {
				return 'Completed'
			}

			// Default for any submission without explicit status
			return 'Submitted'
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
			return 'Due Soon'
		} else if (days <= 0) {
			return 'Overdue'
		} else if (days <= 7) {
			return 'In Progress'
		} else {
			return 'Upcoming'
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
		if (!courseId) return 'All Courses'
		const course = courses.find(c => c.id === courseId)
		return course ? course.name : 'All Courses'
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
				toast.error('File URL is missing. Cannot download the file.')
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

			toast.success(`Downloading file: ${file.name}`)
		} catch (error) {
			console.error('Error downloading file:', error)
			toast.error('Failed to download file. Please try again.')
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
		if (!fileUrl) return 'Assignment Document'

		try {
			// Extract filename from URL
			const urlParts = fileUrl.split('/')
			let fileName = urlParts[urlParts.length - 1]

			// Clean up file name (remove query parameters, etc)
			fileName = fileName.split('?')[0]

			// If the file name is still complex or empty, provide a default
			if (!fileName || fileName.length < 3) {
				return 'Assignment Document'
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
				return 'Assignment Document'
			}

			return decodedName
		} catch (e) {
			return 'Assignment Document'
		}
	}

	if (loading) {
		return (
			<LoadingContainer>
				<LoadingSpinner />
				<p>Loading assignments...</p>
			</LoadingContainer>
		)
	}

	return (
		<AssignmentsContainer>
			<PageHeader>
				<HeaderContent>
					<PageTitle>Assignments</PageTitle>
					<PageDescription>View and manage your course assignments</PageDescription>
				</HeaderContent>
			</PageHeader>

			<FilterSection>
				<SearchBar>
					<SearchIcon>
						<FiSearch size={18} />
					</SearchIcon>
					<SearchInput
						type='text'
						placeholder='Search assignments...'
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
									All Courses
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
							All
						</TabButton>
						<TabButton
							$isActive={activeTab === 'in-progress' || activeTab === 'In Progress'}
							onClick={() => setActiveTab('In Progress')}
						>
							In Progress
						</TabButton>
						<TabButton
							$isActive={activeTab === 'upcoming' || activeTab === 'Upcoming'}
							onClick={() => setActiveTab('Upcoming')}
						>
							Upcoming
						</TabButton>
						<TabButton
							$isActive={activeTab === 'submitted' || activeTab === 'Submitted'}
							onClick={() => setActiveTab('Submitted')}
						>
							Submitted
						</TabButton>
						<TabButton
							$isActive={activeTab === 'resubmitted' || activeTab === 'Resubmitted'}
							onClick={() => setActiveTab('Resubmitted')}
						>
							Resubmitted
						</TabButton>
						<TabButton
							$isActive={activeTab === 'completed' || activeTab === 'Completed'}
							onClick={() => setActiveTab('Completed')}
						>
							Completed
						</TabButton>
						<TabButton
							$isActive={activeTab === 'due soon' || activeTab === 'Due Soon'}
							onClick={() => setActiveTab('Due Soon')}
						>
							Due Soon
						</TabButton>
						<TabButton
							$isActive={activeTab === 'overdue' || activeTab === 'Overdue'}
							onClick={() => setActiveTab('Overdue')}
						>
							Overdue
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
									{assignment.subjectName || assignment.className || 'General'}
								</CourseName>
								<AssignmentStatus $status={getStatusText(assignment)}>
									{getStatusText(assignment)}
								</AssignmentStatus>
							</AssignmentHeader>

							<AssignmentTitle>{assignment.title}</AssignmentTitle>
							<AssignmentDates>
								<DateItem>
									<FiCalendar size={14} />
									Assigned: {formatDate(assignment.created_at)}
								</DateItem>
								<DateItem>
									<FiClock size={14} />
									Due: {formatDate(assignment.due_date)} at {formatTime(assignment.due_date)}
								</DateItem>
							</AssignmentDates>

							{assignment.attachments && assignment.attachments.length > 0 && (
								<AttachmentsSection>
									<AttachmentsHeader>
										<FiPaperclip size={14} />
										<span>Attachments ({assignment.attachments.length})</span>
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
							getStatusText(assignment) === 'Completed' ||
							getStatusText(assignment) === 'Submitted' ||
							getStatusText(assignment) === 'Accepted' ||
							getStatusText(assignment) === 'Resubmitted' ||
							getStatusText(assignment) === 'Rejected' ? (
								<CompletedSection>
									<CompletedHeader>
										<FiCheckCircle
											size={14}
											color={getStatusText(assignment) === 'Rejected' ? '#f44336' : '#4caf50'}
										/>
										<span>
											{assignment.submission
												? `Submitted on ${formatDate(assignment.submission.submittedat)}`
												: `Completed on ${formatDate(
														assignment.submission_date || assignment.updated_at
												  )}`}
										</span>
									</CompletedHeader>
									{assignment.submission?.grade !== undefined &&
										assignment.submission?.grade !== null && (
											<GradeDisplay>
												<GradeLabel>Grade:</GradeLabel>
												<GradeValue $score={assignment.submission.grade}>
													{assignment.submission.grade}/10
												</GradeValue>
											</GradeDisplay>
										)}
									{assignment.submission?.feedback && (
										<FeedbackPreview>
											<FeedbackLabel>Feedback:</FeedbackLabel>
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
										<span>Not submitted yet</span>
									</CompletedHeader>
									<GradeDisplay>
										<GradeLabel>Grade:</GradeLabel>
										<span style={{ fontSize: '13px', color: '#9e9e9e', fontStyle: 'italic' }}>
											Not graded yet
										</span>
									</GradeDisplay>
									<FeedbackPreview>
										<FeedbackLabel>Feedback:</FeedbackLabel>
										<FeedbackText style={{ color: '#9e9e9e', fontStyle: 'italic' }}>
											Feedback will be provided after submission
										</FeedbackText>
									</FeedbackPreview>
								</CompletedSection>
							)}
						</AssignmentContent>

						<AssignmentFooter>
							<ViewDetailsButton>
								<Link to={`/student/assignments/${assignment.id}`}>View Details</Link>
							</ViewDetailsButton>
						</AssignmentFooter>
					</AssignmentCard>
				))}
			</AssignmentsList>

			{filteredAssignments.length === 0 && (
				<NoAssignmentsMessage>
					<FiFileText size={40} />
					<h3>No assignments found</h3>
					<p>Try adjusting your search or filters to find assignments</p>
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
			case 'Accepted':
				return '#dcfce7' // Light green (success)
			case 'Rejected':
				return '#fee2e2' // Light red
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
				return '#4caf50' // Green
			case 'Submitted':
				return '#03a9f4' // Blue
			case 'Accepted':
				return '#16a34a' // Green (success)
			case 'Rejected':
				return '#dc2626' // Red (danger)
			case 'Resubmitted':
				return '#0288d1' // Darker blue
			case 'In Progress':
				return '#2196f3' // Medium blue
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
