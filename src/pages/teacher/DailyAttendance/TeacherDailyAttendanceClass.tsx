import { AnimatePresence } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, Grid, List, Search } from 'react-feather'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import AttendanceCalendarModal from '../../../components/common/AttendanceCalendarModal'
import PageHeader from '../../../components/common/PageHeader'
import supabase from '../../../config/supabaseClient'
import { useAuth } from '../../../contexts/AuthContext'

interface Student {
	id: string
	fullName: string
	email: string
}

interface Class {
	id: string
	classname: string
	level_id: string
}

interface Level {
	id: string
	name: string
}

// Define the response structure from Supabase
interface StudentResponse {
	studentid: string
	users: {
		id: string
		fullName: string
		email: string
	}
}

type ViewMode = 'grid' | 'table'

const TeacherDailyAttendanceClass: React.FC = () => {
	const { levelId, classId } = useParams<{ levelId: string; classId: string }>()
	const [students, setStudents] = useState<Student[]>([])
	const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
	const [searchQuery, setSearchQuery] = useState('')
	const [classData, setClassData] = useState<Class | null>(null)
	const [level, setLevel] = useState<Level | null>(null)
	const [loading, setLoading] = useState(true)
	const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [currentQuarter, setCurrentQuarter] = useState<string | null>(null)
	const [viewMode, setViewMode] = useState<ViewMode>('grid')
	const { user } = useAuth()

	useEffect(() => {
		if (levelId && classId && user?.id) {
			verifyTeacherAccess()
		}
	}, [levelId, classId, user])

	useEffect(() => {
		if (searchQuery.trim() === '') {
			setFilteredStudents(students)
		} else {
			const filtered = students.filter(
				student =>
					student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
					student.email.toLowerCase().includes(searchQuery.toLowerCase())
			)
			setFilteredStudents(filtered)
		}
	}, [searchQuery, students])

	const fetchCurrentQuarter = async () => {
		try {
			// Get the current date
			const today = new Date().toISOString().split('T')[0]

			// Find the quarter that includes today's date
			const { data, error } = await supabase
				.from('quarters')
				.select('id')
				.lte('start_date', today)
				.gte('end_date', today)
				.single()

			if (error) {
				console.error('Error fetching current quarter:', error)
			} else if (data) {
				setCurrentQuarter(data.id)
			}
		} catch (error) {
			console.error('Error fetching current quarter:', error)
		}
	}

	const verifyTeacherAccess = async () => {
		try {
			if (!user?.id) {
				throw new Error('User not authenticated')
			}

			// Check if the teacher is assigned to this class
			const { data, error } = await supabase
				.from('classes')
				.select('id')
				.eq('id', classId)
				.eq('teacherid', user.id)
				.single()

			if (error || !data) {
				toast.error('You do not have access to this class')
				return
			}

			// If access is verified, fetch the data
			fetchClassAndStudents()
			fetchCurrentQuarter()
		} catch (error) {
			console.error('Error verifying teacher access:', error)
			toast.error('Failed to verify access')
		}
	}

	const fetchClassAndStudents = async () => {
		try {
			setLoading(true)

			// Fetch class details
			const { data: classData, error: classError } = await supabase
				.from('classes')
				.select('*')
				.eq('id', classId)
				.single()

			if (classError) throw classError

			setClassData(classData)

			// Fetch level details
			const { data: levelData, error: levelError } = await supabase
				.from('levels')
				.select('*')
				.eq('id', levelId)
				.single()

			if (levelError) throw levelError

			setLevel(levelData)

			// Fetch students for this class using the correct table name 'classstudents'
			const { data: studentsData, error: studentsError } = await supabase
				.from('classstudents')
				.select(
					`
          studentid,
          users:studentid (
            id,
            fullName,
            email
          )
        `
				)
				.eq('classid', classId)

			if (studentsError) throw studentsError

			// Transform the data to get a flat list of students
			const students = (studentsData as unknown as StudentResponse[])
				.map(item => ({
					id: item.users.id,
					fullName: item.users.fullName,
					email: item.users.email,
				}))
				.sort((a, b) => a.fullName.localeCompare(b.fullName))

			setStudents(students)
		} catch (error) {
			console.error('Error fetching class and students:', error)
			toast.error('Failed to load students')
		} finally {
			setLoading(false)
		}
	}

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value)
	}

	const handleStudentClick = (student: Student) => {
		setSelectedStudent(student)
		setIsModalOpen(true)
	}

	const handleCloseModal = () => {
		setIsModalOpen(false)
	}

	const toggleViewMode = () => {
		setViewMode(prev => (prev === 'grid' ? 'table' : 'grid'))
	}

	const renderGridView = () => {
		return (
			<StudentGrid>
				{filteredStudents.map(student => (
					<StudentCard key={student.id}>
						<StudentInfo>
							<StudentAvatar>{student.fullName.charAt(0)}</StudentAvatar>
							<StudentDetails>
								<StudentName>{student.fullName}</StudentName>
								<StudentEmail>{student.email}</StudentEmail>
							</StudentDetails>
						</StudentInfo>
						<ActionButton onClick={() => handleStudentClick(student)}>
							<Calendar size={16} />
							<span>Attendance</span>
						</ActionButton>
					</StudentCard>
				))}
			</StudentGrid>
		)
	}

	const renderTableView = () => {
		return (
			<StudentTable>
				<thead>
					<tr>
						<TableHeader>Student</TableHeader>
						<TableHeader>Email</TableHeader>
						<TableHeader>Actions</TableHeader>
					</tr>
				</thead>
				<tbody>
					{filteredStudents.map(student => (
						<TableRow key={student.id}>
							<TableCell>
								<StudentTableInfo>
									<StudentAvatar>{student.fullName.charAt(0)}</StudentAvatar>
									<StudentTableName>{student.fullName}</StudentTableName>
								</StudentTableInfo>
							</TableCell>
							<TableCell>{student.email}</TableCell>
							<TableCell>
								<TableActionButton onClick={() => handleStudentClick(student)}>
									<Calendar size={16} />
									<span>Attendance</span>
								</TableActionButton>
							</TableCell>
						</TableRow>
					))}
				</tbody>
			</StudentTable>
		)
	}

	return (
		<Container>
			<BackLink to={`/teacher/daily-attendance/${levelId}`}>
				<ArrowLeft size={16} />
				<span>Back to Classes</span>
			</BackLink>

			<PageHeader
				title={classData ? `${classData.classname} - Daily Attendance` : 'Daily Attendance'}
				subtitle={level ? `${level.name} - Manage student attendance` : 'Manage student attendance'}
			/>

			{loading ? (
				<LoadingContainer>
					<LoadingSpinner />
					<p>Loading students...</p>
				</LoadingContainer>
			) : students.length === 0 ? (
				<EmptyState>
					<h3>No students found</h3>
					<p>There are no students enrolled in this class.</p>
				</EmptyState>
			) : (
				<TableWrapper>
					<SearchContainer>
						<LeftSection>
							<StudentCount>{students.length} Students</StudentCount>
							<ViewToggle>
								<ViewToggleButton
									isActive={viewMode === 'grid'}
									onClick={() => setViewMode('grid')}
									aria-label='Grid view'
								>
									<Grid size={18} />
								</ViewToggleButton>
								<ViewToggleButton
									isActive={viewMode === 'table'}
									onClick={() => setViewMode('table')}
									aria-label='Table view'
								>
									<List size={18} />
								</ViewToggleButton>
							</ViewToggle>
						</LeftSection>
						<SearchInputWrapper>
							<SearchIcon>
								<Search size={18} />
							</SearchIcon>
							<SearchInput
								type='text'
								placeholder='Search students...'
								value={searchQuery}
								onChange={handleSearchChange}
							/>
						</SearchInputWrapper>
					</SearchContainer>

					{filteredStudents.length === 0 ? (
						<EmptyState>
							<h3>No matching students</h3>
							<p>No students match your search criteria.</p>
						</EmptyState>
					) : viewMode === 'grid' ? (
						renderGridView()
					) : (
						renderTableView()
					)}
				</TableWrapper>
			)}

			<AnimatePresence>
				{isModalOpen && selectedStudent && (
					<AttendanceCalendarModal
						isOpen={isModalOpen}
						onClose={handleCloseModal}
						student={selectedStudent}
						classId={classId || ''}
						teacherId={user?.id}
						quarterId={currentQuarter || undefined}
					/>
				)}
			</AnimatePresence>
		</Container>
	)
}

const Container = styled.div`
	padding: 24px;
	max-width: 1200px;
	margin: 0 auto;
`

const BackLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	color: #0ea5e9;
	text-decoration: none;
	margin-bottom: 16px;
	font-weight: 500;
	transition: opacity 0.2s;

	&:hover {
		opacity: 0.8;
	}
`

const TableWrapper = styled.div`
	margin-top: 24px;
`

const SearchContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
	flex-wrap: wrap;
	gap: 16px;
`

const LeftSection = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
`

const StudentCount = styled.div`
	font-size: 1rem;
	font-weight: 500;
	color: #464646;
`

const ViewToggle = styled.div`
	display: flex;
	background-color: #f1f5f9;
	border-radius: 8px;
	padding: 2px;
`

interface ViewToggleButtonProps {
	isActive: boolean
}

const ViewToggleButton = styled.button<ViewToggleButtonProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border: none;
	border-radius: 6px;
	background-color: ${props => (props.isActive ? 'white' : 'transparent')};
	color: ${props => (props.isActive ? '#0ea5e9' : '#64748b')};
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: ${props => (props.isActive ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none')};

	&:hover {
		color: #0ea5e9;
	}
`

const SearchInputWrapper = styled.div`
	position: relative;
	width: 300px;
`

const SearchIcon = styled.div`
	position: absolute;
	left: 12px;
	top: 50%;
	transform: translateY(-50%);
	color: #464646;
`

const SearchInput = styled.input`
	width: 100%;
	padding: 10px 10px 10px 40px;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
	font-size: 0.9rem;
	background-color: #fff;
	color: #464646;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #0ea5e9;
		box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
	}

	&::placeholder {
		color: #a0aec0;
	}
`

const StudentGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
	gap: 16px;
`

const StudentCard = styled.div`
	background-color: #fff;
	border-radius: 12px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: start;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	transition: all 0.2s ease;
	gap: 28px;
	border-left: 4px solid #0ea5e9;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
`

const StudentInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`

const StudentAvatar = styled.div`
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background-color: #0ea5e9;
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 1.1rem;
`

const StudentDetails = styled.div`
	display: flex;
	flex-direction: column;
`

const StudentName = styled.div`
	font-weight: 500;
	color: #0ea5e9;
	max-width: 180px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const StudentEmail = styled.div`
	font-size: 0.85rem;
	color: #464646;
`

const ActionButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	background-color: #0ea5e9;
	color: #fff;
	border: none;
	border-radius: 8px;
	padding: 8px 16px;
	cursor: pointer;
	transition: all 0.2s;
	font-weight: 500;

	&:hover {
		background-color: #0ea5e9;
		transform: translateY(-2px);
	}

	&:active {
		transform: translateY(0);
	}
`

// Table view components
const StudentTable = styled.table`
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	background-color: white;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`

const TableHeader = styled.th`
	text-align: left;
	padding: 16px;
	font-size: 0.9rem;
	color: #64748b;
	font-weight: 600;
	border-bottom: 1px solid #e2e8f0;
	background-color: #f8fafc;
`

const TableRow = styled.tr`
	transition: background-color 0.2s;

	&:hover {
		background-color: #f1f5f9;
	}

	&:not(:last-child) {
		border-bottom: 1px solid #e2e8f0;
	}
`

const TableCell = styled.td`
	padding: 16px;
	font-size: 0.95rem;
	color: #334155;
	vertical-align: middle;
`

const StudentTableInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`

const StudentTableName = styled.div`
	font-weight: 500;
	color: #0ea5e9;
	max-width: 240px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const TableActionButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	background-color: #0ea5e9;
	color: #fff;
	border: none;
	border-radius: 8px;
	padding: 8px 16px;
	cursor: pointer;
	transition: all 0.2s;
	font-weight: 500;
	font-size: 0.9rem;

	&:hover {
		background-color: #0ea5e9;
		transform: translateY(-2px);
	}

	&:active {
		transform: translateY(0);
	}
`

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px;
	gap: 16px;

	p {
		color: #000;
	}
`

const LoadingSpinner = styled.div`
	width: 40px;
	height: 40px;
	border: 3px solid #e5e7eb;
	border-top: 3px solid #0ea5e9;
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

const EmptyState = styled.div`
	text-align: center;
	padding: 48px;
	color: #464646;
	background-color: #fff;
	border-radius: 12px;
	margin-top: 24px;

	h3 {
		margin: 0 0 8px;
		color: #0ea5e9;
	}
`

export default TeacherDailyAttendanceClass
