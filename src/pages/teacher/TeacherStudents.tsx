import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import {
	FiSearch,
	FiFilter,
	FiDownload,
	FiMail,
	FiChevronDown,
	FiUsers,
	FiCheckCircle,
	FiXCircle,
	FiEdit,
	FiEye,
	FiBook,
	FiArrowLeft,
	FiChevronRight,
	FiUser,
	FiMapPin,
	FiPlusCircle,
	FiX,
} from 'react-icons/fi'
import {
	IoSchool,
	IoPersonCircle,
	IoCalendar,
	IoCheckmarkDone,
	IoStatsChart,
} from 'react-icons/io5'
import { useAuth } from '../../contexts/AuthContext'
import supabase from '../../config/supabaseClient'

// Safe theme access helper function
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const getThemeValue = (path: string[], fallback: string) => (props: any) => {
//   try {
//     let value = props.theme;
//     for (const key of path) {
//       value = value[key];
//       if (value === undefined) return fallback;
//     }
//     return value;
//   } catch (e) {
//     return fallback;
//   }
// };

interface Student {
	id: string
	firstName: string
	lastName: string
	email: string
	role: string
}

interface Class {
	id: string
	classname: string
	teacherid?: string | null
	room?: string | null
	gradeNumber: number
	studentCount?: number
}

interface GradeLevel {
	id: number
	name: string
	sections: Class[]
	sectionsCount: number
}

// Add new interfaces for class students
interface ClassStudent {
	id: string
	studentid: string
	classid: string
	assignedat?: string
}

// Create a combined type for displaying students with their assigned date
interface StudentWithAssignedDate extends Student {
	assignedat?: string
}

// Add proper interface definitions for styled components
interface FilterOptionProps {
	$isActive: boolean
}

interface SortIconProps {
	$direction: 'asc' | 'desc'
}

interface AttendanceProps {
	$value: number
}

interface PerformanceIndicatorProps {
	$value: number
}

interface StatusBadgeProps {
	$status: 'active' | 'inactive'
}

interface GradeCardHeaderProps {
	$performance?: number
}

// Modal styled components
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
	z-index: 100;
	padding: 1rem;
`

const StudentModal = styled.div`
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: ${props => props.theme.borderRadius.lg};
	width: 100%;
	max-width: 800px;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
	overflow: hidden;
`

const ModalHeader = styled.div`
	padding: 1.5rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const ModalTitle = styled.h2`
	margin: 0;
	font-size: 1.25rem;
	color: ${props => props.theme.colors.text.primary};
	font-weight: 600;
`

const CloseButton = styled.button`
	background: none;
	border: none;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	padding: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.background.secondary};
		color: ${props => props.theme.colors.text.primary};
	}
`

const ModalBody = styled.div`
	padding: 1.5rem;
	overflow-y: auto;
	flex: 1;
`

const ModalFooter = styled.div`
	padding: 1rem 1.5rem;
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
	border-top: 1px solid ${props => props.theme.colors.border.light};
	background-color: ${props => props.theme.colors.background.secondary};
`

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 1rem;
	padding: 3rem 0;
	color: ${props => props.theme.colors.text.secondary};
`

const StudentTable = styled.table`
	width: 100%;
	border-collapse: collapse;

	th,
	td {
		padding: 0.75rem 1rem;
		text-align: left;
		border-bottom: 1px solid ${props => props.theme.colors.border.light};
	}

	th {
		font-weight: 600;
		color: ${props => props.theme.colors.text.secondary};
		background-color: ${props => props.theme.colors.background.secondary};
		position: sticky;
		top: 0;
	}

	tr:hover td {
		background-color: ${props => props.theme.colors.background.hover};
	}
`

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
`

const ActionIconButton = styled.button`
	background: none;
	border: none;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.background.secondary};
		color: ${props => props.theme.colors.primary[500]};
	}
`

const Button = styled.button<{ primary?: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	background-color: ${props =>
		props.primary ? props.theme.colors.primary[500] : props.theme.colors.background.primary};
	color: ${props => (props.primary ? 'white' : props.theme.colors.text.primary)};
	border: 1px solid ${props => (props.primary ? 'transparent' : props.theme.colors.border.light)};
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props =>
			props.primary ? props.theme.colors.primary[600] : props.theme.colors.background.tertiary};
		transform: translateY(-2px);
	}
`

const ActionButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	font-weight: 500;
	border-radius: ${props => props.theme.borderRadius.md};
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

	&:hover {
		background-color: ${props => props.theme.colors.primary[600]};
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}
`

const TeacherStudents: React.FC = () => {
	const { user } = useAuth()
	const [searchTerm, setSearchTerm] = useState('')
	const [filter, setFilter] = useState('all')
	const [showFilters, setShowFilters] = useState(false)
	const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
	const [showCourseDropdown, setShowCourseDropdown] = useState(false)
	const [sortBy, setSortBy] = useState<string>('name')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
	const [view, setView] = useState<'grades' | 'sections' | 'students'>('grades')
	const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | null>(null)
	const [selectedClass, setSelectedClass] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([])
	const [classes, setClasses] = useState<Class[]>([])
	const [showStudentModal, setShowStudentModal] = useState(false)
	const [students, setStudents] = useState<StudentWithAssignedDate[]>([])

	// Log user information on mount
	useEffect(() => {
		console.log('TeacherStudents component mounted with user:', user)
	}, [user])

	// Extract grade number from class name (e.g., "10A" -> 10, "Grade 11B" -> 11)
	const extractGradeNumber = (className: string): number => {
		const matches = className.match(/\d+/)
		if (matches && matches.length > 0) {
			return parseInt(matches[0], 10)
		}
		return 0 // Default if no number found
	}

	// Fetch classes from Supabase and group by grade level
	useEffect(() => {
		const fetchClasses = async () => {
			// Skip if no user is logged in
			if (!user?.id) {
				console.log('No user logged in, skipping class fetch')
				setIsLoading(false)
				setClasses([])
				return
			}

			setIsLoading(true)
			try {
				console.log('Fetching classes for teacher:', user.id)

				// Fetch classes using the requested query
				const { data: teacherClasses, error } = await supabase
					.from('classes')
					.select('*')
					.eq('teacherid', user.id)

				if (error) {
					console.error('Error fetching classes:', error)
					setIsLoading(false)
					return
				}

				console.log('Classes for current teacher:', teacherClasses)

				if (teacherClasses && teacherClasses.length > 0) {
					// Fetch student count for each class
					const classesWithStudentCounts = await Promise.all(
						teacherClasses.map(async cls => {
							const { count, error } = await supabase
								.from('users')
								.select('*', { count: 'exact', head: true })
								.eq('class_id', cls.id)

							if (error) {
								console.error(`Error fetching student count for class ${cls.id}:`, error)
								return { ...cls, studentCount: 0 }
							}

							return { ...cls, studentCount: count || 0 }
						})
					)

					setClasses(classesWithStudentCounts)

					// Group classes by grade number
					const gradesMap = new Map<number, GradeLevel>()

					classesWithStudentCounts.forEach(cls => {
						const gradeNumber = extractGradeNumber(cls.classname)

						// Skip invalid grade numbers
						if (gradeNumber === 0) {
							console.warn(`Class ${cls.classname} has invalid grade number, skipping.`)
							return
						}

						if (!gradesMap.has(gradeNumber)) {
							gradesMap.set(gradeNumber, {
								id: gradeNumber,
								name: `Grade ${gradeNumber}`,
								sections: [],
								sectionsCount: 0,
							})
						}

						const grade = gradesMap.get(gradeNumber)
						if (grade) {
							grade.sections.push(cls)
							grade.sectionsCount = grade.sections.length
						}
					})

					// Convert map to array and sort by grade level
					const gradesList = Array.from(gradesMap.values()).sort((a, b) => a.id - b.id)
					console.log('Processed grade levels:', gradesList)
					setGradeLevels(gradesList)
				} else {
					console.log('No classes found for this teacher.')
					setClasses([])
					setGradeLevels([])
				}
			} catch (error) {
				console.error('Error processing classes:', error)
				setClasses([])
				setGradeLevels([])
			} finally {
				setIsLoading(false)
			}
		}

		fetchClasses()
	}, [user?.id])

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	const handleFilterChange = (newFilter: string) => {
		setFilter(newFilter)
		setShowFilters(false)
	}

	const handleCourseSelect = (course: string | null) => {
		setSelectedCourse(course)
		setShowCourseDropdown(false)
	}

	const handleSort = (column: string) => {
		if (sortBy === column) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
		} else {
			setSortBy(column)
			setSortDirection('asc')
		}
	}

	const handleGradeLevelSelect = (level: number) => {
		setSelectedGradeLevel(level)
		setView('sections')
	}

	const handleClassSelect = (classId: string) => {
		setSelectedClass(classId)
		fetchClassStudents(classId)
		setShowStudentModal(true)
	}

	const navigateBack = () => {
		if (view === 'sections') {
			setView('grades')
			setSelectedGradeLevel(null)
		} else if (view === 'students') {
			setView('sections')
			setSelectedClass(null)
		}
	}

	// Filter grade levels based on search term
	const filteredGradeLevels = gradeLevels.filter(gradeLevel =>
		gradeLevel.name.toLowerCase().includes(searchTerm.toLowerCase())
	)

	// Update the fetchClassStudents function to handle more field name variations
	const fetchClassStudents = async (classId: string) => {
		setIsLoading(true)
		try {
			console.log('Fetching students for class ID:', classId)

			// First, check the structure of the classstudents table to understand fields
			const { data: tableInfo, error: tableError } = await supabase
				.from('classstudents')
				.select('*')
				.limit(1)

			if (tableError) {
				console.error('Error getting table structure:', tableError)
			} else {
				console.log('Table structure sample:', tableInfo)
				if (tableInfo && tableInfo.length > 0) {
					console.log('Field names in classstudents table:', Object.keys(tableInfo[0]))
				}
			}

			// Check both possible field name formats for classid
			let classIdField = 'classid'
			if (
				tableInfo &&
				tableInfo.length > 0 &&
				!('classid' in tableInfo[0]) &&
				'class_id' in tableInfo[0]
			) {
				classIdField = 'class_id'
				console.log('Using class_id instead of classid for query')
			}

			// Step 1: Get all data from classstudents table for the selected class
			const { data: classstudents, error: classStudentsError } = await supabase
				.from('classstudents')
				.select('*')
				.eq(classIdField, classId)

			if (classStudentsError) {
				console.error('Error fetching class students:', classStudentsError)
				setStudents([])
				setIsLoading(false)
				return
			}

			console.log('Class students raw data:', classstudents)
			console.log('Number of students found:', classstudents?.length || 0)

			// If no students found, set empty array and return
			if (!classstudents || classstudents.length === 0) {
				console.log('No students found for this class')
				setStudents([])
				setIsLoading(false)
				return
			}

			// Inspect the first record to identify actual field names
			const firstRecord = classstudents[0]
			console.log('First record from classstudents:', firstRecord)
			console.log('Available fields:', Object.keys(firstRecord))

			// Check various field name possibilities
			let studentIdField = ''
			let assignedDateField = ''

			// Check for student ID field variations
			if ('studentid' in firstRecord) studentIdField = 'studentid'
			else if ('student_id' in firstRecord) studentIdField = 'student_id'
			else if ('userId' in firstRecord) studentIdField = 'userId'
			else if ('user_id' in firstRecord) studentIdField = 'user_id'

			// Check for assigned date field variations
			if ('assignedat' in firstRecord) assignedDateField = 'assignedat'
			else if ('assigned_at' in firstRecord) assignedDateField = 'assigned_at'
			else if ('date_assigned' in firstRecord) assignedDateField = 'date_assigned'
			else if ('created_at' in firstRecord) assignedDateField = 'created_at'
			else if ('createdat' in firstRecord) assignedDateField = 'createdat'
			else if ('assignment_date' in firstRecord) assignedDateField = 'assignment_date'
			else if ('assignmentDate' in firstRecord) assignedDateField = 'assignmentDate'

			console.log(
				`Using fields: studentIdField=${studentIdField}, assignedDateField=${assignedDateField}`
			)

			if (!studentIdField) {
				console.error('Could not find student ID field in classstudents table')
				console.log('Available fields were:', Object.keys(firstRecord))
				setStudents([])
				setIsLoading(false)
				return
			}

			// Create a map of studentid to assignedat
			const assignedDatesMap = new Map()
			classstudents.forEach(student => {
				const studentId = student[studentIdField]
				const assignedDate = assignedDateField ? student[assignedDateField] : null

				console.log(`Mapping: Student ID ${studentId} to date ${assignedDate}`)
				assignedDatesMap.set(studentId, assignedDate)
			})

			console.log('AssignedDates map created with keys:', [...assignedDatesMap.keys()])

			// Step 2: Get the student details from users table
			const studentIds = classstudents.map(s => s[studentIdField])
			console.log('Fetching user details for student IDs:', studentIds)

			const { data: students, error: studentsError } = await supabase
				.from('users')
				.select('*')
				.in('id', studentIds)

			if (studentsError) {
				console.error('Error fetching student details:', studentsError)
				setStudents([])
				setIsLoading(false)
				return
			}

			console.log('Student details fetched:', students)
			console.log('Number of students fetched from users table:', students?.length || 0)

			// Combine student details with assigned dates
			const studentsWithAssignedDates =
				students?.map(student => {
					const assignedDate = assignedDatesMap.get(student.id)
					console.log(`Mapping student ${student.id} to assigned date: ${assignedDate}`)
					return {
						...student,
						assignedat: assignedDate,
					}
				}) || []

			console.log('Final student data with assigned dates:', studentsWithAssignedDates)
			setStudents(studentsWithAssignedDates)
		} catch (error) {
			console.error('Error in fetchClassStudents:', error)
			setStudents([])
		} finally {
			setIsLoading(false)
		}
	}

	// Update the formatDate function to include time information
	const formatDate = (dateString?: string) => {
		if (!dateString) {
			console.log('No date string provided to formatDate')
			return 'N/A'
		}

		console.log('Formatting date string:', dateString)

		try {
			const date = new Date(dateString)
			// Check if date is valid
			if (isNaN(date.getTime())) {
				console.warn('Invalid date created from string:', dateString)
				return 'Invalid date'
			}

			// Format with date and time (May 1, 2025, 09:13 PM)
			const formatted =
				date.toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
				}) +
				', ' +
				date.toLocaleTimeString('en-US', {
					hour: '2-digit',
					minute: '2-digit',
					hour12: true,
				})

			console.log('Formatted date with time:', formatted)
			return formatted
		} catch (error) {
			console.error('Error formatting date:', error)
			return 'Invalid date'
		}
	}

	// Add function to close modal
	const closeStudentModal = () => {
		setShowStudentModal(false)
	}

	// Render grade levels view
	const renderGradeLevelsView = () => {
		return (
			<>
				<PageHeader>
					<div>
						<PageTitle>Classes</PageTitle>
						<PageDescription>View classes by grade level</PageDescription>
					</div>

					<HeaderActions>
						<ExportButton>
							<FiDownload />
							<span>Export Data</span>
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
							placeholder='Search grade levels...'
							value={searchTerm}
							onChange={handleSearchChange}
						/>
					</SearchBox>
				</SearchFilterBar>

				{isLoading ? (
					<LoadingState>Loading grade levels...</LoadingState>
				) : (
					<ClassesGrid>
						{filteredGradeLevels.length === 0 ? (
							<EmptyStateCard>
								<FiUsers size={24} />
								<p>No classes found for your account</p>
								<p className='sub-message'>
									You are not assigned as a teacher to any classes. Please contact the administrator
									if this is incorrect.
								</p>
							</EmptyStateCard>
						) : (
							filteredGradeLevels.map((gradeLevel, index) => (
								<GradeCard
									key={gradeLevel.id}
									as={motion.div}
									whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)' }}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3, delay: index * 0.05 }}
									onClick={() => handleGradeLevelSelect(gradeLevel.id)}
								>
									<GradeCardHeader>
										<GradeIcon>
											<IoSchool />
										</GradeIcon>
										<GradeContent>
											<GradeTitle>{gradeLevel.name}</GradeTitle>
											<GradeStats>
												{gradeLevel.sectionsCount} section
												{gradeLevel.sectionsCount !== 1 ? 's' : ''}
											</GradeStats>
										</GradeContent>
									</GradeCardHeader>

									<GradeCardFooter>
										<ViewButton>
											<span>View Sections</span>
											<FiChevronRight />
										</ViewButton>
									</GradeCardFooter>
								</GradeCard>
							))
						)}
					</ClassesGrid>
				)}
			</>
		)
	}

	// Render sections view for a specific grade level
	const renderSectionsView = () => {
		if (!selectedGradeLevel) return null

		const gradeLevel = gradeLevels.find(g => g.id === selectedGradeLevel)
		if (!gradeLevel) return null

		// Filter sections by search term
		const filteredSections = gradeLevel.sections.filter(cls =>
			cls.classname.toLowerCase().includes(searchTerm.toLowerCase())
		)

		return (
			<>
				<PageHeader>
					<div>
						<BackButton onClick={navigateBack}>
							<FiArrowLeft />
							<span>Back to Grade Levels</span>
						</BackButton>
						<PageTitle>{gradeLevel.name} Sections</PageTitle>
						<PageDescription>
							{gradeLevel.sections.length} sections in {gradeLevel.name}
						</PageDescription>
					</div>

					<HeaderActions>
						<ExportButton>
							<FiDownload />
							<span>Export Data</span>
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
							placeholder='Search sections...'
							value={searchTerm}
							onChange={handleSearchChange}
						/>
					</SearchBox>
				</SearchFilterBar>

				<ClassesGrid>
					{filteredSections.length === 0 ? (
						<EmptyStateCard>
							<FiUsers size={24} />
							<p>No sections found</p>
						</EmptyStateCard>
					) : (
						filteredSections.map((classItem, index) => (
							<SectionCard
								key={classItem.id}
								as={motion.div}
								whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)' }}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: index * 0.1 }}
							>
								<SectionCardHeader>
									<SectionBadge>{classItem.classname}</SectionBadge>
									<SectionInfo>
										<SectionStats>
											<StatsItem>
												<FiUsers size={14} />
												<span>Students: {classItem.studentCount || 0}</span>
											</StatsItem>
											{classItem.room && (
												<StatsItem>
													<FiMapPin size={14} />
													<span>{classItem.room}</span>
												</StatsItem>
											)}
										</SectionStats>
									</SectionInfo>
								</SectionCardHeader>
								<SectionCardFooter>
									<ViewButton onClick={() => handleClassSelect(classItem.id)}>
										<span>View Students</span>
										<FiChevronRight />
									</ViewButton>
								</SectionCardFooter>
							</SectionCard>
						))
					)}
				</ClassesGrid>
			</>
		)
	}

	// Render students view for a specific class
	const renderStudentsView = () => {
		if (!selectedClass) return null

		const classDetails = classes.find(cls => cls.id === selectedClass)
		if (!classDetails) return null

		return (
			<>
				<PageHeader>
					<div>
						<BackButton onClick={navigateBack}>
							<FiArrowLeft />
							<span>Back to Sections</span>
						</BackButton>
						<PageTitle>Students in {classDetails.classname}</PageTitle>
						<PageDescription>Manage students in this class</PageDescription>
					</div>

					<HeaderActions>
						<ExportButton>
							<FiDownload />
							<span>Export Data</span>
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
							placeholder='Search students...'
							value={searchTerm}
							onChange={handleSearchChange}
						/>
					</SearchBox>
				</SearchFilterBar>

				{isLoading ? (
					<LoadingState>Loading students...</LoadingState>
				) : (
					<EmptyStateCard>
						<FiUsers size={24} />
						<p>Student management has been moved to the Class Details page</p>
						<ActionButton
							onClick={() => (window.location.href = `/teacher/classes/${selectedClass}`)}
						>
							Go to Class Details
						</ActionButton>
					</EmptyStateCard>
				)}
			</>
		)
	}

	// Render student modal
	const renderStudentModal = () => {
		if (!selectedClass || !showStudentModal) return null

		const classDetails = classes.find(cls => cls.id === selectedClass)
		if (!classDetails) return null

		return (
			<ModalOverlay
				as={motion.div}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
			>
				<StudentModal
					as={motion.div}
					initial={{ y: 50, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 50, opacity: 0 }}
				>
					<ModalHeader>
						<ModalTitle>Students in {classDetails.classname}</ModalTitle>
						<CloseButton onClick={closeStudentModal}>
							<FiX size={20} />
						</CloseButton>
					</ModalHeader>

					<ModalBody>
						<SearchBox style={{ marginBottom: '1rem' }}>
							<SearchIcon>
								<FiSearch />
							</SearchIcon>
							<SearchInput
								type='text'
								placeholder='Search students...'
								value={searchTerm}
								onChange={handleSearchChange}
							/>
						</SearchBox>

						{isLoading ? (
							<LoadingState>Loading students...</LoadingState>
						) : students.length === 0 ? (
							<EmptyState>
								<FiUsers size={24} />
								<p>No students enrolled in this class</p>
							</EmptyState>
						) : (
							<StudentTable>
								<thead>
									<tr>
										<th>Name</th>
										<th>Email</th>
										<th>Assigned Date</th>
									</tr>
								</thead>
								<tbody>
									{students
										.filter(
											student =>
												`${student.firstName} ${student.lastName}`
													.toLowerCase()
													.includes(searchTerm.toLowerCase()) ||
												(student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
										)
										.map(student => (
											<tr key={student.id}>
												<td>{`${student.firstName} ${student.lastName}`}</td>
												<td>{student.email || 'No email'}</td>
												<td>{formatDate(student.assignedat)}</td>
											</tr>
										))}
								</tbody>
							</StudentTable>
						)}
					</ModalBody>

					<ModalFooter>
						<Button onClick={closeStudentModal}>Close</Button>
					</ModalFooter>
				</StudentModal>
			</ModalOverlay>
		)
	}

	return (
		<StudentsContainer
			as={motion.div}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			{view === 'grades' && renderGradeLevelsView()}
			{view === 'sections' && renderSectionsView()}
			{view === 'students' && renderStudentsView()}

			<AnimatePresence>{showStudentModal && renderStudentModal()}</AnimatePresence>
		</StudentsContainer>
	)
}

const StudentsContainer = styled.div`
	padding: 1.5rem;
	max-width: 1600px;
	margin: 0 auto;

	@media (max-width: 768px) {
		padding: 1rem 0.75rem;
	}
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
	font-size: 2rem;
	font-weight: 700;
	margin: 0;
	color: ${props => props.theme.colors.text.primary};
	background: linear-gradient(
		to right,
		${props => props.theme.colors.primary[600]},
		${props => props.theme.colors.primary[400]}
	);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	letter-spacing: -0.02em;
`

const PageDescription = styled.p`
	margin: 0.5rem 0 0;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.95rem;
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
	background-color: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.text.primary};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
	}
`

const SearchFilterBar = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	flex-wrap: wrap;
	position: sticky;
	top: 0;
	z-index: 10;
	background-color: ${props => props.theme.colors.background.secondary};
	padding: 1rem;
	border-radius: ${props => props.theme.borderRadius.lg};
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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
	color: ${props => props.theme.colors.text.tertiary};
`

const SearchInput = styled.input`
	width: 100%;
	padding: 0.75rem 1rem 0.75rem 2.5rem;
	border-radius: ${props => props.theme.borderRadius.md};
	border: 1px solid ${props => props.theme.colors.border.light};
	background-color: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.875rem;
	transition: all 0.2s ease;

	&::placeholder {
		color: ${props => props.theme.colors.text.tertiary};
	}

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[300]};
		box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
	}
`

const LoadingState = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 200px;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 1rem;
`

const EmptyStateCard = styled.div`
	grid-column: 1 / -1;
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: ${props => props.theme.borderRadius.lg};
	padding: 3rem 1.5rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 1rem;
	color: ${props => props.theme.colors.text.secondary};
	box-shadow: ${props => props.theme.shadows.sm};
	border: 1px dashed ${props => props.theme.colors.border.light};

	p {
		margin: 0;
		font-size: 1rem;
	}

	.sub-message {
		font-size: 0.875rem;
		color: ${props => props.theme.colors.text.tertiary};
		text-align: center;
		max-width: 400px;
	}
`

const BackButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background: none;
	border: none;
	color: ${props => props.theme.colors.primary[500]};
	font-size: 0.875rem;
	font-weight: 500;
	padding: 0.5rem 0;
	margin-bottom: 0.5rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		color: ${props => props.theme.colors.primary[600]};
		transform: translateX(-2px);
	}

	svg {
		transition: transform 0.2s ease;
	}

	&:hover svg {
		transform: translateX(-2px);
	}
`

// ClassesGrid for displaying class cards
const ClassesGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 1.5rem;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`

const GradeCard = styled.div`
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: ${props => props.theme.borderRadius.lg};
	overflow: hidden;
	transition: all 0.3s ease-in-out;
	height: 100%;
	display: flex;
	flex-direction: column;
	position: relative;
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
	border: 1px solid ${props => props.theme.colors.border.light};
	cursor: pointer;

	&:hover {
		transform: translateY(-5px);
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
		border-color: ${props => props.theme.colors.primary[300]};
	}
`

const GradeCardHeader = styled.div`
	background: linear-gradient(
		to right,
		${props => props.theme.colors.primary[600]},
		${props => props.theme.colors.primary[400]}
	);
	padding: 1.5rem;
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	color: white;
`

const GradeIcon = styled.div`
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background-color: rgba(255, 255, 255, 0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.5rem;
	color: white;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`

const GradeContent = styled.div`
	flex: 1;
`

const GradeTitle = styled.h3`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: white;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

const GradeStats = styled.div`
	margin-top: 0.5rem;
	font-size: 0.875rem;
	opacity: 0.9;
`

const GradeCardFooter = styled.div`
	padding: 1rem 1.5rem;
	display: flex;
	justify-content: flex-end;
	align-items: center;
	border-top: 1px solid ${props => props.theme.colors.border.light};
	background-color: ${props => props.theme.colors.background.secondary};
`

const ViewButton = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.6rem 1rem;
	background-color: ${props => props.theme.colors.primary[50]};
	color: ${props => props.theme.colors.primary[600]};
	border: none;
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 0.875rem;
	font-weight: 500;
	transition: all 0.2s ease;
	cursor: pointer;

	&:hover {
		background-color: ${props => props.theme.colors.primary[100]};
		transform: translateX(2px);
	}

	svg {
		transition: transform 0.2s ease;
	}

	&:hover svg {
		transform: translateX(2px);
	}
`

const SectionCard = styled.div`
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: ${props => props.theme.borderRadius.lg};
	overflow: hidden;
	transition: all 0.3s ease-in-out;
	height: 100%;
	display: flex;
	flex-direction: column;
	position: relative;
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
	border: 1px solid ${props => props.theme.colors.border.light};

	&:hover {
		transform: translateY(-5px);
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
		border-color: ${props => props.theme.colors.primary[300]};
	}
`

const SectionCardHeader = styled.div`
	background: linear-gradient(
		to right,
		${props => props.theme.colors.background.light},
		${props => props.theme.colors.background.lighter}
	);
	padding: 1.5rem;
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`

const SectionBadge = styled.div`
	display: inline-flex;
	padding: 0.5rem 1rem;
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	font-weight: 600;
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 1.1rem;
	align-self: flex-start;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`

const SectionInfo = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 0.5rem;
`

const SectionStats = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	width: 100%;
	margin-top: 0.5rem;
`

const StatsItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};

	svg {
		color: ${props => props.theme.colors.primary[400]};
	}
`

const SectionCardFooter = styled.div`
	padding: 1rem 1.5rem;
	display: flex;
	justify-content: flex-end;
	align-items: center;
	border-top: 1px solid ${props => props.theme.colors.border.light};
	background-color: ${props => props.theme.colors.background.secondary};
`

export default TeacherStudents
