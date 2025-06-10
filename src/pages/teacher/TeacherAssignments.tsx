import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import {
	FiAlertCircle,
	FiBook,
	FiCalendar,
	FiCheck,
	FiCheckSquare,
	FiChevronDown,
	FiClock,
	FiDownload,
	FiFileText,
	FiFilter,
	FiMail,
	FiPaperclip,
	FiSearch,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import supabase from '../../config/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

// Interface definitions
interface Assignment {
	id: string
	title: string
	instructions?: string
	classid: string
	class_name?: string
	duedate?: string
	createdby:
		| string
		| {
				email?: string
		  }
	creator_email?: string
	submissions_count?: number
	submissions_completed?: number
	average_score?: number
	max_score?: number
	status?: 'draft' | 'published' | 'grading' | 'completed'
	file_url?: Array<{ name: string; url: string }> | string | null
	subject_name?: string
	subject_id?: string
}

interface NewAssignmentFormData {
	title: string
	description: string
	courseId: number
	dueDate: string
	totalPoints: number
	status: 'draft' | 'published'
}

interface SortIconProps {
	$direction: 'asc' | 'desc'
}

interface StatusBadgeProps {
	$status?: 'draft' | 'published' | 'grading' | 'completed'
}

interface Class {
	id: string
	classname: string
	name?: string
}

const TeacherAssignments = () => {
	const { user } = useAuth()
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [searchTerm, setSearchTerm] = useState('')
	const [filter, setFilter] = useState('all')
	const [showFilters, setShowFilters] = useState(false)
	const [selectedCourse, setSelectedCourse] = useState<number | null>(null)
	const [showCourseDropdown, setShowCourseDropdown] = useState(false)
	const [sortBy, setSortBy] = useState<string>('dueDate')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
	const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false)
	const [assignments, setAssignments] = useState<Assignment[]>([])
	const [classes, setClasses] = useState<Class[]>([])
	const [isLoading, setIsLoading] = useState(true)

	// New state for the assignment creation form
	const [formData, setFormData] = useState<NewAssignmentFormData>({
		title: '',
		description: '',
		courseId: 0,
		dueDate: '',
		totalPoints: 100,
		status: 'draft',
	})

	// Form validation state
	const [errors, setErrors] = useState<Partial<Record<keyof NewAssignmentFormData, string>>>({})

	// Get all unique courses from assignment data
	const courses = [
		...new Map(
			assignments.map(item => [item.classid, { id: item.classid, name: item.class_name }])
		).values(),
	]

	// Fetch assignments and classes on component mount
	useEffect(() => {
		if (user) {
			fetchAssignments()
			fetchClasses()
		}
	}, [user])

	// Fetch assignments from Supabase
	const fetchAssignments = async () => {
		if (!user) return

		setIsLoading(true)
		try {
			// First, fetch the subjects assigned to the teacher from the classteachers table
			const { data: teacherSubjectsData, error: teacherSubjectsError } = await supabase
				.from('classteachers')
				.select('classid, subjectid')
				.eq('teacherid', user.id)

			if (teacherSubjectsError) {
				console.error('Error fetching teacher subjects:', teacherSubjectsError)
				throw teacherSubjectsError
			}

			// Extract subject IDs assigned to this teacher
			const subjectIds = teacherSubjectsData?.map(ts => ts.subjectid) || []

			// Extract class IDs this teacher is assigned to
			const classIds = teacherSubjectsData?.map(ts => ts.classid) || []

			// If teacher isn't assigned to any subjects yet, show no assignments
			if (subjectIds.length === 0) {
				console.log('No subjects found for this teacher')
				setAssignments([])
				setClasses([])
				setIsLoading(false)
				toast.info(t('teacherPanel.assignments.noAssignmentsForSubjects'))
				return
			}

			// Fetch the classes that match the classIds from the classteachers table
			const { data: teacherClasses, error: classesError } = await supabase
				.from('classes')
				.select('id, classname')
				.in('id', classIds)

			if (classesError) {
				console.error('Error fetching teacher classes:', classesError)
				throw classesError
			}

			// Fetch the subjects that match the subjectIds
			const { data: subjectsData, error: subjectsError } = await supabase
				.from('subjects')
				.select('id, subjectname')
				.in('id', subjectIds)

			if (subjectsError) {
				console.error('Error fetching subjects:', subjectsError)
				throw subjectsError
			}

			// Create a map of subject IDs to subject names for quick lookup
			const subjectMap = (subjectsData || []).reduce((acc, subject) => {
				acc[subject.id] = subject.subjectname
				return acc
			}, {} as Record<string, string>)

			// Set the classes state
			setClasses(teacherClasses || [])

			// Fetch assignments that belong to the subjects assigned to this teacher
			const { data, error } = await supabase
				.from('assignments')
				.select(
					`
          *,
          createdby(
            email
          )
        `
				)
				.in('subject_id', subjectIds) // Filter to only include assignments for teacher's subjects
				.order('duedate', { ascending: true })

			if (error) throw error

			// Process assignments and fetch related data where needed
			const enhancedAssignments = await Promise.all(
				(data || []).map(async assignment => {
					let className = 'Unknown Class'
					let creatorEmail = 'Unknown'
					let subjectName = 'Unknown Subject'

					// Find class name from the already fetched classes
					const matchingClass = teacherClasses?.find(c => c.id === assignment.classid)
					if (matchingClass) {
						className = matchingClass.classname
					}

					// Find subject name from the subject map
					if (assignment.subject_id && subjectMap[assignment.subject_id]) {
						subjectName = subjectMap[assignment.subject_id]
					}

					// Get creator email from the join result
					if (
						assignment.createdby &&
						typeof assignment.createdby === 'object' &&
						assignment.createdby.email
					) {
						creatorEmail = assignment.createdby.email
					} else if (typeof assignment.createdby === 'string') {
						// If createdby is just an ID string, fetch the user
						try {
							const { data: userData } = await supabase
								.from('users')
								.select('email')
								.eq('id', assignment.createdby)
								.single()

							if (userData) {
								creatorEmail = userData.email
							}
						} catch (e) {
							console.error('Error fetching creator:', e)
						}
					}

					// Add mock data for submission stats (can be replaced with real data later)
					const submissionsCount = Math.floor(Math.random() * 30)
					const submissionsCompleted = Math.floor(Math.random() * submissionsCount)
					const averageScore = Math.floor(Math.random() * 100)
					const maxScore = 100

					return {
						...assignment,
						class_name: className,
						subject_name: subjectName,
						creator_email: creatorEmail,
						submissions_count: assignment.submissions_count || submissionsCount,
						submissions_completed: assignment.submissions_completed || submissionsCompleted,
						average_score: assignment.average_score || averageScore,
						max_score: assignment.max_score || maxScore,
					}
				})
			)

			setAssignments(enhancedAssignments)
		} catch (error) {
			console.error('Error fetching assignments:', error)
			toast.error('Failed to load assignments')
		} finally {
			setIsLoading(false)
		}
	}

	// Fetch available classes
	const fetchClasses = async () => {
		try {
			const { data, error } = await supabase
				.from('classes')
				.select('id, classname')
				.order('classname')

			if (error) throw error
			setClasses(data || [])
		} catch (error) {
			console.error('Error fetching classes:', error)
			toast.error('Failed to load classes')
		}
	}

	// Handle search input change
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	// Handle filter change
	const handleFilterChange = (newFilter: string) => {
		setFilter(newFilter)
		setShowFilters(false)
	}

	// Handle course selection
	const handleCourseSelect = (courseId: number | null) => {
		setSelectedCourse(courseId)
		setShowCourseDropdown(false)
	}

	// Handle sorting
	const handleSort = (column: string) => {
		if (sortBy === column) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
		} else {
			setSortBy(column)
			setSortDirection('asc')
		}
	}

	// Format date for display
	const formatDate = (dateString: string | undefined) => {
		if (!dateString) return 'N/A'

		try {
			const date = new Date(dateString)
			if (isNaN(date.getTime())) {
				return 'N/A'
			}

			// Format with date and time in a more readable format
			const formattedDate = date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			})

			const formattedTime = date.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: true,
			})

			return `${formattedDate} • ${formattedTime}`
		} catch (error) {
			console.error('Error formatting date:', error, 'for value:', dateString)
			return 'N/A'
		}
	}

	// Function to get status text
	const getStatusText = (status: Assignment['status']): string => {
		switch (status) {
			case 'draft':
				return 'Draft'
			case 'published':
				return 'Published'
			case 'grading':
				return 'Needs Grading'
			case 'completed':
				return 'Completed'
			default:
				return 'Unknown'
		}
	}

	// Filter assignments based on search term, selected filter, and course
	const filteredAssignments = assignments.filter(assignment => {
		const matchesSearch =
			assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(assignment.instructions?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
			(assignment.class_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
			(assignment.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

		const matchesFilter =
			filter === 'all' ||
			(filter === 'published' && assignment.status === 'published') ||
			(filter === 'draft' && assignment.status === 'draft') ||
			(filter === 'grading' && assignment.status === 'grading') ||
			(filter === 'completed' && assignment.status === 'completed') ||
			(filter === 'upcoming' &&
				assignment.duedate &&
				new Date(assignment.duedate) > new Date() &&
				assignment.status !== 'completed')

		const matchesCourse =
			!selectedCourse || (selectedCourse && assignment.classid === String(selectedCourse))

		return matchesSearch && matchesFilter && matchesCourse
	})

	// Sort filtered assignments
	const sortedAssignments = [...filteredAssignments].sort((a, b) => {
		let valueA: string | number | Date = ''
		let valueB: string | number | Date = ''

		switch (sortBy) {
			case 'title':
				valueA = a.title
				valueB = b.title
				break
			case 'dueDate':
				valueA = new Date(a.duedate || '')
				valueB = new Date(b.duedate || '')
				break
			case 'course':
				valueA = a.class_name || ''
				valueB = b.class_name || ''
				break
			case 'status':
				valueA = a.status || 'draft'
				valueB = b.status || 'draft'
				break
			case 'subject':
				valueA = a.subject_name || ''
				valueB = b.subject_name || ''
				break
			default:
				valueA = new Date(a.duedate || '')
				valueB = new Date(b.duedate || '')
		}

		// For numeric comparison
		if (typeof valueA === 'string' && typeof valueB === 'string') {
			return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
		} else if (valueA instanceof Date && valueB instanceof Date) {
			return sortDirection === 'asc'
				? valueA.getTime() - valueB.getTime()
				: valueB.getTime() - valueA.getTime()
		} else {
			// Fallback for any other types
			const aStr = String(valueA)
			const bStr = String(valueB)
			return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
		}
	})

	// Handle form change
	const handleFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: name === 'totalPoints' ? parseInt(value) || 0 : value,
		}))

		// Clear error for this field when user makes changes
		if (errors[name as keyof NewAssignmentFormData]) {
			setErrors(prev => ({
				...prev,
				[name]: undefined,
			}))
		}
	}

	// Validate form
	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof NewAssignmentFormData, string>> = {}

		if (!formData.title.trim()) {
			newErrors.title = 'Title is required'
		}

		if (!formData.description.trim()) {
			newErrors.description = 'Description is required'
		}

		if (!formData.courseId) {
			newErrors.courseId = 'Please select a course'
		}

		if (!formData.dueDate) {
			newErrors.dueDate = 'Due date is required'
		} else {
			const selectedDate = new Date(formData.dueDate)
			const today = new Date()
			if (selectedDate < today) {
				newErrors.dueDate = 'Due date cannot be in the past'
			}
		}

		if (formData.totalPoints <= 0) {
			newErrors.totalPoints = 'Points must be greater than 0'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Handle form submission
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		// Validate form
		const formErrors: Partial<Record<keyof NewAssignmentFormData, string>> = {}
		let isValid = true

		if (!formData.title) {
			formErrors.title = 'Title is required'
			isValid = false
		}

		if (!formData.description) {
			formErrors.description = 'Description is required'
			isValid = false
		}

		if (!formData.courseId) {
			formErrors.courseId = 'Course is required'
			isValid = false
		}

		if (!formData.dueDate) {
			formErrors.dueDate = 'Due date is required'
			isValid = false
		}

		if (!isValid) {
			setErrors(formErrors)
			return
		}

		// Clear any existing errors
		setErrors({})

		// Create new assignment (would typically call an API)
		if (user) {
			const newAssignment: Assignment = {
				id: Math.random().toString(), // Generate a random ID
				title: formData.title,
				instructions: formData.description,
				classid: String(formData.courseId),
				class_name: courses.find(c => c.id === String(formData.courseId))?.name || '',
				duedate: formData.dueDate,
				createdby: user.id,
				creator_email: user.email,
				submissions_count: 0,
				submissions_completed: 0,
				average_score: 0,
				max_score: 100,
				status: formData.status,
			}

			// Add to local state (in real app, would add to database)
			setAssignments([newAssignment, ...assignments])
		}

		// Reset form and close modal
		setFormData({
			title: '',
			description: '',
			courseId: 0,
			dueDate: '',
			totalPoints: 100,
			status: 'draft',
		})

		setShowNewAssignmentModal(false)
	}

	return (
		<AssignmentsContainer
			as={motion.div}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			<PageHeader>
				<div>
					<PageTitle>{t('teacherPanel.assignments.title')}</PageTitle>
					<PageDescription>{t('teacherPanel.assignments.description')}</PageDescription>
				</div>

				<HeaderActions>
					<ExportButton>
						<FiDownload />
						<span>{t('teacherPanel.assignments.export')}</span>
					</ExportButton>
				</HeaderActions>
			</PageHeader>

			<SearchFilterBar>
				<SearchBox>
					<SearchIcon>
						<FiSearch />
					</SearchIcon>
					<SearchInput
						type='text'
						placeholder={t('teacherPanel.assignments.searchPlaceholder')}
						value={searchTerm}
						onChange={handleSearchChange}
					/>
				</SearchBox>

				<FilterContainer>
					<FilterButton onClick={() => setShowFilters(!showFilters)}>
						<FiFilter />
						<span>{t('teacherPanel.assignments.filter')}</span>
					</FilterButton>

					{showFilters && (
						<FilterDropdown>
							<FilterOption onClick={() => handleFilterChange('all')} $isActive={filter === 'all'}>
								{t('teacherPanel.assignments.filters.all')}
							</FilterOption>
							<FilterOption
								onClick={() => handleFilterChange('upcoming')}
								$isActive={filter === 'upcoming'}
							>
								{t('teacherPanel.assignments.filters.upcoming')}
							</FilterOption>
							<FilterOption
								onClick={() => handleFilterChange('published')}
								$isActive={filter === 'published'}
							>
								{t('teacherPanel.assignments.filters.published')}
							</FilterOption>
							<FilterOption
								onClick={() => handleFilterChange('grading')}
								$isActive={filter === 'grading'}
							>
								{t('teacherPanel.assignments.filters.grading')}
							</FilterOption>
							<FilterOption
								onClick={() => handleFilterChange('completed')}
								$isActive={filter === 'completed'}
							>
								{t('teacherPanel.assignments.filters.completed')}
							</FilterOption>
							<FilterOption
								onClick={() => handleFilterChange('draft')}
								$isActive={filter === 'draft'}
							>
								{t('teacherPanel.assignments.filters.draft')}
							</FilterOption>
						</FilterDropdown>
					)}
				</FilterContainer>

				<CourseDropdown>
					<CourseButton onClick={() => setShowCourseDropdown(!showCourseDropdown)}>
						<FiBook />
						<span>
							{selectedCourse
								? classes.find(c => c.id === String(selectedCourse))?.classname || t('teacherPanel.assignments.allCourses')
								: t('teacherPanel.assignments.allCourses')}
						</span>
						<FiChevronDown
							style={{
								transform: showCourseDropdown ? 'rotate(180deg)' : 'rotate(0)',
								transition: 'transform 0.2s ease',
							}}
						/>
					</CourseButton>

					{showCourseDropdown && (
						<CourseDropdownMenu>
							<CourseOption
								onClick={() => handleCourseSelect(null)}
								$isActive={selectedCourse === null}
							>
								{t('teacherPanel.assignments.allCourses')}
							</CourseOption>
							{classes.map(course => (
								<CourseOption
									key={course.id}
									onClick={() => handleCourseSelect(Number(course.id))}
									$isActive={selectedCourse !== null && String(selectedCourse) === course.id}
								>
									{course.classname}
								</CourseOption>
							))}
						</CourseDropdownMenu>
					)}
				</CourseDropdown>
			</SearchFilterBar>

			<AssignmentsTable>
				<thead>
					<tr>
						<TableHeader onClick={() => handleSort('title')}>
							<span>{t('teacherPanel.assignments.table.assignment')}</span>
							{sortBy === 'title' && (
								<SortIcon $direction={sortDirection}>
									<FiChevronDown />
								</SortIcon>
							)}
						</TableHeader>
						<TableHeader onClick={() => handleSort('course')}>
							<span>{t('teacherPanel.assignments.table.course')}</span>
							{sortBy === 'course' && (
								<SortIcon $direction={sortDirection}>
									<FiChevronDown />
								</SortIcon>
							)}
						</TableHeader>
						<TableHeader onClick={() => handleSort('subject')}>
							<span>{t('teacherPanel.assignments.table.subject')}</span>
							{sortBy === 'subject' && (
								<SortIcon $direction={sortDirection}>
									<FiChevronDown />
								</SortIcon>
							)}
						</TableHeader>
						<TableHeader onClick={() => handleSort('dueDate')}>
							<span>{t('teacherPanel.assignments.table.dueDate')}</span>
							{sortBy === 'dueDate' && (
								<SortIcon $direction={sortDirection}>
									<FiChevronDown />
								</SortIcon>
							)}
						</TableHeader>
						<TableHeader onClick={() => handleSort('status')}>
							<span>{t('teacherPanel.assignments.table.creator')}</span>
							{sortBy === 'status' && (
								<SortIcon $direction={sortDirection}>
									<FiChevronDown />
								</SortIcon>
							)}
						</TableHeader>
						<TableHeader>{t('teacherPanel.assignments.table.actions')}</TableHeader>
					</tr>
				</thead>
				<tbody>
					{isLoading ? (
						<tr>
							<EmptyCell colSpan={5}>
								<LoadingContainer>
									<LoadingSpinner />
									<p>{t('teacherPanel.assignments.loadingAssignments')}</p>
								</LoadingContainer>
							</EmptyCell>
						</tr>
					) : sortedAssignments.length === 0 ? (
						<tr>
							<EmptyCell colSpan={5}>
								<EmptyState>
									<EmptyStateIcon>
										<FiClock size={40} />
									</EmptyStateIcon>
									<EmptyStateTitle>{t('teacherPanel.assignments.noAssignments')}</EmptyStateTitle>
									<EmptyStateDescription>
										{searchTerm
											? t('teacherPanel.assignments.noMatchingAssignments')
											: t('teacherPanel.assignments.noAssignmentsYet')}
									</EmptyStateDescription>
								</EmptyState>
							</EmptyCell>
						</tr>
					) : (
						sortedAssignments.map(assignment => (
							<TableRow key={assignment.id}>
								<TableCell>
									<AssignmentInfo>
										<DocumentIcon>
											<FiCalendar size={24} color='#4299e1' />
										</DocumentIcon>
										<div>
											<AssignmentTitle>{assignment.title}</AssignmentTitle>
											<AssignmentDescription>{assignment.instructions}</AssignmentDescription>
										</div>
									</AssignmentInfo>
								</TableCell>
								<TableCell>
									<CourseChip>{assignment.class_name}</CourseChip>
								</TableCell>
								<TableCell>
									<CourseChip>{assignment.subject_name}</CourseChip>
								</TableCell>
								<TableCell>
									<DateDisplay>
										<FiCalendar size={16} style={{ marginRight: '8px' }} />
										{formatDate(assignment.duedate)}
									</DateDisplay>
								</TableCell>
								<TableCell>
									<CreatorEmailBadge>
										<FiMail size={16} style={{ marginRight: '4px' }} />
										{assignment.creator_email}
									</CreatorEmailBadge>
								</TableCell>
								<TableCell>
									<ActionButtons>
										{/* View Files Button */}
										<ActionButton
											title='View Uploads'
											variant='secondary'
											onClick={() => {
												if (
													!assignment.file_url ||
													(Array.isArray(assignment.file_url) && assignment.file_url.length === 0)
												) {
													toast.info('No files uploaded for this assignment')
													return
												}
												// Navigate to the assignment files page
												navigate(`/teacher/assignments/files/${assignment.id}`)
											}}
											disabled={
												!assignment.file_url ||
												(Array.isArray(assignment.file_url) && assignment.file_url.length === 0)
											}
											style={{
												opacity:
													!assignment.file_url ||
													(Array.isArray(assignment.file_url) && assignment.file_url.length === 0)
														? 0.5
														: 1,
												position: 'relative',
											}}
										>
											<FiPaperclip />
											{assignment.file_url &&
												((Array.isArray(assignment.file_url) && assignment.file_url.length > 0) ||
													typeof assignment.file_url === 'string') && (
													<FileIndicator>
														<FiCheck size={10} />
													</FileIndicator>
												)}
										</ActionButton>
									</ActionButtons>
								</TableCell>
							</TableRow>
						))
					)}
				</tbody>
			</AssignmentsTable>
		</AssignmentsContainer>
	)
}

// Helper function to get the appropriate icon for status
const getStatusIcon = (status: Assignment['status']) => {
	switch (status) {
		case 'draft':
			return <FiFileText />
		case 'published':
			return <FiAlertCircle />
		case 'grading':
			return <FiClock />
		case 'completed':
			return <FiCheckSquare />
		default:
			return <FiFileText />
	}
}

// Styled Components
const AssignmentsContainer = styled.div`
	padding: 1rem 0;
`

const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
	flex-wrap: wrap;
	gap: 1rem;
`

const PageTitle = styled.h1`
	font-size: 1.75rem;
	font-weight: 600;
	margin: 0;
	color: ${props => props.theme.colors?.text?.primary || '#000'};
`

const PageDescription = styled.p`
	margin: 0.5rem 0 0;
	color: ${props => props.theme.colors?.text?.secondary || '#666'};
`

const HeaderActions = styled.div`
	display: flex;
	gap: 1rem;
`

const ExportButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	background-color: ${props => props.theme.colors?.background?.primary || '#fff'};
	color: ${props => props.theme.colors?.text?.primary || '#000'};
	border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	border-radius: ${props => props.theme.borderRadius?.md || '4px'};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors?.background?.tertiary || '#f5f5f5'};
	}
`

const SearchFilterBar = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	flex-wrap: wrap;
`

const SearchBox = styled.div`
	position: relative;
	flex: 1;
	min-width: 200px;
`

const SearchIcon = styled.div`
	position: absolute;
	left: 1rem;
	top: 50%;
	transform: translateY(-50%);
	color: ${props => props.theme.colors?.text?.tertiary || '#888'};
`

const SearchInput = styled.input`
	width: 100%;
	padding: 0.75rem 1rem 0.75rem 2.5rem;
	border-radius: ${props => props.theme.borderRadius?.md || '4px'};
	border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	background-color: ${props => props.theme.colors?.background?.primary || '#fff'};
	color: ${props => props.theme.colors?.text?.primary || '#000'};
	font-size: 0.875rem;

	&::placeholder {
		color: ${props => props.theme.colors?.text?.tertiary || '#888'};
	}

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors?.primary?.[300] || '#7dd3fc'};
		box-shadow: 0 0 0 2px ${props => props.theme.colors?.primary?.[100] || '#e0f2fe'};
	}
`

const FilterContainer = styled.div`
	position: relative;
`

const FilterButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	background-color: ${props => props.theme.colors?.background?.primary || '#fff'};
	color: ${props => props.theme.colors?.text?.primary || '#000'};
	border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	border-radius: ${props => props.theme.borderRadius?.md || '4px'};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors?.background?.tertiary || '#f5f5f5'};
	}
`

const FilterDropdown = styled.div`
	position: absolute;
	right: 0;
	top: calc(100% + 0.5rem);
	width: 220px;
	background-color: ${props => props.theme.colors?.background?.primary || '#fff'};
	border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	border-radius: ${props => props.theme.borderRadius?.md || '4px'};
	box-shadow: ${props => props.theme.shadows?.md || '0 4px 6px rgba(0, 0, 0, 0.1)'};
	z-index: 10;
	overflow: hidden;
`

const FilterOption = styled.div<{ $isActive: boolean }>`
	padding: 0.75rem 1rem;
	cursor: pointer;
	font-size: 0.875rem;
	background-color: ${props =>
		props.$isActive ? props.theme.colors?.background?.tertiary || '#f0f0f0' : 'transparent'};
	color: ${props =>
		props.$isActive
			? props.theme.colors?.primary?.[500] || '#0ea5e9'
			: props.theme.colors?.text?.primary || '#000'};
	font-weight: ${props => (props.$isActive ? '500' : 'normal')};

	&:hover {
		background-color: ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
	}
`

const CourseDropdown = styled.div`
	position: relative;
`

const CourseButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	background-color: ${props => props.theme.colors?.background?.primary || '#fff'};
	color: ${props => props.theme.colors?.text?.primary || '#000'};
	border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	border-radius: ${props => props.theme.borderRadius?.md || '4px'};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	min-width: 180px;

	&:hover {
		background-color: ${props => props.theme.colors?.background?.tertiary || '#f5f5f5'};
	}

	span {
		flex: 1;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
`

const CourseDropdownMenu = styled.div`
	position: absolute;
	right: 0;
	top: calc(100% + 0.5rem);
	width: 220px;
	max-height: 300px;
	overflow-y: auto;
	background-color: ${props => props.theme.colors?.background?.primary || '#fff'};
	border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	border-radius: ${props => props.theme.borderRadius?.md || '4px'};
	box-shadow: ${props => props.theme.shadows?.md || '0 4px 6px rgba(0, 0, 0, 0.1)'};
	z-index: 10;
`

const CourseOption = styled.div<{ $isActive: boolean }>`
	padding: 0.75rem 1rem;
	cursor: pointer;
	font-size: 0.875rem;
	background-color: ${props =>
		props.$isActive ? props.theme.colors?.background?.tertiary || '#f0f0f0' : 'transparent'};
	color: ${props =>
		props.$isActive
			? props.theme.colors?.primary?.[500] || '#0ea5e9'
			: props.theme.colors?.text?.primary || '#000'};
	font-weight: ${props => (props.$isActive ? '500' : 'normal')};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;

	&:hover {
		background-color: ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
	}
`

const AssignmentsTable = styled.table`
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	background-color: ${props => props.theme.colors?.background?.primary || '#fff'};
	border-radius: ${props => props.theme.borderRadius?.lg || '8px'};
	overflow: hidden;
	box-shadow: ${props => props.theme.shadows?.sm || '0 1px 3px rgba(0, 0, 0, 0.1)'};
`

const TableHeader = styled.th`
	padding: 1rem;
	text-align: left;
	font-weight: 500;
	font-size: 0.875rem;
	color: ${props => props.theme.colors?.text?.secondary || '#666'};
	background-color: ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
	border-bottom: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	position: relative;
	cursor: pointer;
	user-select: none;
	white-space: nowrap;

	&:hover {
		color: ${props => props.theme.colors?.text?.primary || '#000'};
	}

	span {
		display: inline-flex;
		align-items: center;
	}
`

const SortIcon = styled.span<SortIconProps>`
	margin-left: 0.25rem;
	display: inline-flex;
	transform: ${props => (props.$direction === 'desc' ? 'rotate(180deg)' : 'rotate(0)')};
	transition: transform 0.2s ease;
`

const TableRow = styled.tr`
	&:hover {
		background-color: ${props => props.theme.colors?.background?.hover || '#f0f0f0'};
	}

	&:not(:last-child) {
		border-bottom: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	}
`

const TableCell = styled.td`
	padding: 1rem;
	font-size: 0.875rem;
	color: ${props => props.theme.colors?.text?.primary || '#000'};
	vertical-align: middle;
`

const EmptyCell = styled.td`
	padding: 3rem 1rem;
	text-align: center;
`

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 4rem 2rem;
	text-align: center;
`

const EmptyStateIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 80px;
	height: 80px;
	border-radius: 50%;
	background-color: #f0f0f0;
	color: #999;
	margin-bottom: 1.5rem;
`

const EmptyStateTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 500;
	margin: 0 0 0.75rem;
	color: #333;
`

const EmptyStateDescription = styled.p`
	font-size: 0.875rem;
	color: #666;
	margin: 0 0 1.5rem;
	max-width: 400px;
`

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem;
	color: #666;

	p {
		margin-top: 1rem;
	}
`

const LoadingSpinner = styled.div`
	width: 2rem;
	height: 2rem;
	border: 3px solid #f0f0f0;
	border-top: 3px solid #3498db;
	border-radius: 50%;
	animation: spin 1s linear infinite;

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
`

const AssignmentInfo = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`

const DocumentIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: ${props => props.theme.borderRadius?.md || '4px'};
	background-color: ${props => props.theme.colors?.primary?.[50] || '#e0f2fe'};
	color: ${props => props.theme.colors?.primary?.[500] || '#0ea5e9'};
	flex-shrink: 0;
	font-size: 1rem;
`

const AssignmentTitle = styled.div`
	font-weight: 500;
	margin-bottom: 0.25rem;
`

const AssignmentDescription = styled.div`
	font-size: 0.75rem;
	color: ${props => props.theme.colors?.text?.tertiary || '#666'};
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	text-overflow: ellipsis;
`

const CourseChip = styled.div`
	display: inline-block;
	padding: 0.25rem 0.5rem;
	background-color: ${props => props.theme.colors?.primary?.[50] || '#e0f2fe'};
	color: ${props => props.theme.colors?.primary?.[700] || '#0369a1'};
	border-radius: ${props => props.theme.borderRadius?.sm || '4px'};
	font-size: 0.75rem;
	font-weight: 500;
	white-space: nowrap;
	max-width: 150px;
	overflow: hidden;
	text-overflow: ellipsis;
`

const DateDisplay = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	color: ${props => props.theme.colors?.text?.primary || '#000'};
`

const SubmissionInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`

const StatusBadge = styled.div<StatusBadgeProps>`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	border-radius: ${props => props.theme.borderRadius?.sm || '4px'};
	font-size: 0.75rem;
	font-weight: 500;
	background-color: ${props => {
		switch (props.$status) {
			case 'draft':
				return props.theme.colors?.neutral?.[100] || '#f1f5f9'
			case 'published':
				return props.theme.colors?.primary?.[50] || '#e0f2fe'
			case 'grading':
				return props.theme.colors?.warning?.[50] || '#fffbeb'
			case 'completed':
				return props.theme.colors?.success?.[50] || '#f0fdf4'
			default:
				return props.theme.colors?.neutral?.[100] || '#f1f5f9'
		}
	}};
	color: ${props => {
		switch (props.$status) {
			case 'draft':
				return props.theme.colors?.neutral?.[700] || '#334155'
			case 'published':
				return props.theme.colors?.primary?.[700] || '#0369a1'
			case 'grading':
				return props.theme.colors?.warning?.[700] || '#b45309'
			case 'completed':
				return props.theme.colors?.success?.[700] || '#15803d'
			default:
				return props.theme.colors?.neutral?.[700] || '#334155'
		}
	}};

	svg {
		font-size: 0.875rem;
	}
`

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
`

const ActionButton = styled.button<{ variant?: 'danger' | 'primary' | 'secondary' }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	border: none;
	background-color: ${props =>
		props.variant === 'danger'
			? '#FEE2E2'
			: props.variant === 'primary'
			? '#E6F6FF'
			: props.variant === 'secondary'
			? '#F1F5F9'
			: '#F9FAFB'};
	color: ${props =>
		props.variant === 'danger'
			? '#DC2626'
			: props.variant === 'primary'
			? '#0EA5E9'
			: props.variant === 'secondary'
			? '#475569'
			: '#475569'};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props =>
			props.variant === 'danger'
				? '#FCA5A5'
				: props.variant === 'primary'
				? '#BAE6FD'
				: props.variant === 'secondary'
				? '#CBD5E1'
				: '#E2E8F0'};
		transform: translateY(-2px);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
`

// Modal Styled Components
const Modal = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: ${props => props.theme.zIndices?.modal || 1000};
`

const ModalBackdrop = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	cursor: pointer;
`

const ModalContent = styled.div`
	background-color: ${props => props.theme.colors?.background?.primary || '#fff'};
	border-radius: ${props => props.theme.borderRadius?.lg || '8px'};
	box-shadow: ${props => props.theme.shadows?.xl || '0 10px 25px rgba(0, 0, 0, 0.1)'};
	width: 100%;
	max-width: 600px;
	max-height: 90vh;
	overflow-y: auto;
	z-index: 1;
	position: relative;
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.25rem 1.5rem;
	border-bottom: 1px solid ${props => props.theme.colors?.border?.light || '#eee'};
`

const ModalTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0;
	color: ${props => props.theme.colors?.text?.primary || '#000'};
`

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	line-height: 1;
	color: ${props => props.theme.colors?.text?.tertiary || '#888'};
	cursor: pointer;
	padding: 0.25rem;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		color: ${props => props.theme.colors?.text?.primary || '#000'};
	}
`

const ModalBody = styled.div`
	padding: 1.5rem;
`

const ModalFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
	margin-top: 2rem;
`

// Form components
const FormGroup = styled.div`
	margin-bottom: 1.25rem;
	width: 100%;
`

const FormRow = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 0;

	@media (max-width: ${props => props.theme.breakpoints?.md || '768px'}) {
		flex-direction: column;
	}
`

const FormLabel = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: ${props => props.theme.colors?.text?.primary || '#000'};
`

interface FormInputProps {
	$hasError?: boolean
}

const FormInput = styled.input<FormInputProps>`
	width: 100%;
	padding: 0.75rem 1rem;
	border-radius: ${props => props.theme.borderRadius?.md || '4px'};
	border: 1px solid
		${props =>
			props.$hasError
				? props.theme.colors?.danger?.[500] || '#ef4444'
				: props.theme.colors?.border?.light || '#ddd'};
	background-color: ${props => props.theme.colors?.background?.primary || '#fff'};
	color: ${props => props.theme.colors?.text?.primary || '#000'};
	font-size: 0.875rem;

	&:focus {
		outline: none;
		border-color: ${props =>
			props.$hasError
				? props.theme.colors?.danger?.[500] || '#ef4444'
				: props.theme.colors?.primary?.[300] || '#7dd3fc'};
		box-shadow: 0 0 0 2px
			${props =>
				props.$hasError
					? props.theme.colors?.danger?.[100] || '#fee2e2'
					: props.theme.colors?.primary?.[100] || '#e0f2fe'};
	}
`

const FormTextarea = styled.textarea<FormInputProps>`
	width: 100%;
	padding: 0.75rem 1rem;
	border-radius: ${props => props.theme.borderRadius?.md || '4px'};
	border: 1px solid
		${props =>
			props.$hasError
				? props.theme.colors?.danger?.[500] || '#ef4444'
				: props.theme.colors?.border?.light || '#ddd'};
	background-color: ${props => props.theme.colors?.background?.primary || '#fff'};
	color: ${props => props.theme.colors?.text?.primary || '#000'};
	font-size: 0.875rem;
	resize: vertical;
	min-height: 100px;

	&:focus {
		outline: none;
		border-color: ${props =>
			props.$hasError
				? props.theme.colors?.danger?.[500] || '#ef4444'
				: props.theme.colors?.primary?.[300] || '#7dd3fc'};
		box-shadow: 0 0 0 2px
			${props =>
				props.$hasError
					? props.theme.colors?.danger?.[100] || '#fee2e2'
					: props.theme.colors?.primary?.[100] || '#e0f2fe'};
	}
`

const FormSelect = styled.select<FormInputProps>`
	width: 100%;
	padding: 0.75rem 1rem;
	border-radius: ${props => props.theme.borderRadius?.md || '4px'};
	border: 1px solid
		${props =>
			props.$hasError
				? props.theme.colors?.danger?.[500] || '#ef4444'
				: props.theme.colors?.border?.light || '#ddd'};
	background-color: ${props => props.theme.colors?.background?.primary || '#fff'};
	color: ${props => props.theme.colors?.text?.primary || '#000'};
	font-size: 0.875rem;
	appearance: none;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
	background-repeat: no-repeat;
	background-position: right 1rem center;
	padding-right: 2.5rem;

	&:focus {
		outline: none;
		border-color: ${props =>
			props.$hasError
				? props.theme.colors?.danger?.[500] || '#ef4444'
				: props.theme.colors?.primary?.[300] || '#7dd3fc'};
		box-shadow: 0 0 0 2px
			${props =>
				props.$hasError
					? props.theme.colors?.danger?.[100] || '#fee2e2'
					: props.theme.colors?.primary?.[100] || '#e0f2fe'};
	}
`

const FormError = styled.div`
	color: ${props => props.theme.colors?.danger?.[500] || '#ef4444'};
	font-size: 0.75rem;
	margin-top: 0.25rem;
`

const PrimaryButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background-color: ${props => props.theme.colors?.primary?.[500] || '#0ea5e9'};
	color: #fff;
	border: none;
	border-radius: ${props => props.theme.borderRadius?.md || '4px'};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors?.primary?.[600] || '#0284c7'};
	}
`

const SecondaryButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background-color: ${props => props.theme.colors?.background?.primary || '#fff'};
	color: ${props => props.theme.colors?.text?.primary || '#000'};
	border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	border-radius: ${props => props.theme.borderRadius?.md || '4px'};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
	}
`

const CreatorEmailBadge = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	border-radius: ${props => props.theme.borderRadius?.sm || '4px'};
	font-size: 0.75rem;
	font-weight: 500;
	background-color: ${props => props.theme.colors?.primary?.[50] || '#e0f2fe'};
	color: ${props => props.theme.colors?.primary?.[700] || '#0369a1'};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

// Add a CSS spinner for loading state
const Spinner = styled.div`
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	border: 2px solid rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	border-top: 2px solid #fff;
	width: 16px;
	height: 16px;
	animation: spin 1s linear infinite;
`

// Add a file indicator for assignments with uploaded files
const FileIndicator = styled.div`
	position: absolute;
	top: -4px;
	right: -4px;
	background-color: ${props => props.theme.colors?.success?.[500] || '#10b981'};
	color: white;
	border-radius: 50%;
	width: 14px;
	height: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 8px;
`

// Add styled components for file preview
const PreviewContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 300px;
	max-height: 60vh;
	background-color: #f5f5f5;
	overflow: auto;
`

const PreviewImage = styled.img`
	max-width: 100%;
	max-height: 60vh;
	object-fit: contain;
`

const PreviewFrame = styled.iframe`
	width: 100%;
	height: 60vh;
	border: none;
`

const PreviewFallback = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 2rem;
	text-align: center;
	color: ${props => props.theme.colors?.text?.secondary || '#666'};
`

const PreviewLink = styled.a`
	display: inline-block;
	margin-top: 1rem;
	padding: 0.5rem 1rem;
	background-color: ${props => props.theme.colors?.primary?.[500] || '#0ea5e9'};
	color: white;
	border-radius: ${props => props.theme.borderRadius?.md || '4px'};
	text-decoration: none;
	font-weight: 500;

	&:hover {
		background-color: ${props => props.theme.colors?.primary?.[600] || '#0284c7'};
	}
`

const FileNavigation = styled.div`
	display: flex;
	align-items: center;
	flex: 1;
	gap: 1rem;
`

const FileNavButton = styled.button<{ disabled?: boolean }>`
	background-color: ${props =>
		props.disabled
			? props.theme.colors?.background?.tertiary || '#f0f0f0'
			: props.theme.colors?.background?.secondary || '#f8f8f8'};
	color: ${props =>
		props.disabled
			? props.theme.colors?.text?.tertiary || '#999'
			: props.theme.colors?.text?.primary || '#333'};
	border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	border-radius: ${props => props.theme.borderRadius?.sm || '4px'};
	padding: 0.375rem 0.75rem;
	font-size: 0.875rem;
	cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};

	&:hover:not(:disabled) {
		background-color: ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
	}
`

const FileInfo = styled.div`
	flex: 1;
	text-align: center;
	font-size: 0.875rem;
	color: ${props => props.theme.colors?.text?.secondary || '#666'};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	padding: 0 1rem;
`

export default TeacherAssignments
