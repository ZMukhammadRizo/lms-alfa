import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, FileText, Grid, List, Search } from 'react-feather'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import * as XLSX from 'xlsx'
import AttendanceCalendarModal from '../../../components/common/AttendanceCalendarModal'
import PageHeader from '../../../components/common/PageHeader'
import supabase from '../../../config/supabaseClient'
import { useAuth } from '../../../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

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

// Define period type for export
type ExportPeriod = 'weekly' | 'monthly' | null

const TeacherDailyAttendanceClass: React.FC = () => {
	const { t } = useTranslation()
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
	const [isExportModalOpen, setIsExportModalOpen] = useState(false)
	const [exportPeriod, setExportPeriod] = useState<ExportPeriod>(null)
	const [exportLoading, setExportLoading] = useState(false)
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
				toast.error(t('dailyAttendance.noClassesAvailable'))
				return
			}

			// If access is verified, fetch the data
			fetchClassAndStudents()
			fetchCurrentQuarter()
		} catch (error) {
			console.error('Error verifying teacher access:', error)
			toast.error(t('errors.loadingFailed'))
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
			toast.error(t('dailyAttendance.loadingStudents'))
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

	const handleExportClick = () => {
		setExportPeriod(null)
		setIsExportModalOpen(true)
	}

	const handleExportClose = () => {
		setIsExportModalOpen(false)
	}

	const handleExportData = async (period: ExportPeriod) => {
		if (!period || !classId || !classData) return

		try {
			setExportLoading(true)
			setExportPeriod(period)

			// Calculate date range based on selected period
			const today = new Date()
			let startDate: Date
			let endDate: Date

			if (period === 'monthly') {
				// Get the first day of the current month
				startDate = new Date(today.getFullYear(), today.getMonth(), 1)
				// Get the last day of the current month
				endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
			} else {
				// Get the first day of the current week (Monday)
				const day = today.getDay()
				const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
				startDate = new Date(today.setDate(diff))
				// Get the last day of the current week (Sunday)
				endDate = new Date(startDate)
				endDate.setDate(startDate.getDate() + 6)
			}

			const formattedStartDate = startDate.toISOString().split('T')[0]
			const formattedEndDate = endDate.toISOString().split('T')[0]

			// First, ensure we have all students in the class
			const studentsInClass = [...students]

			// Fetch attendance data for all students in this class for the selected period
			const { data: attendanceData, error: attendanceError } = await supabase
				.from('daily_attendance')
				.select(
					`
					id,
					student_id,
					noted_for,
					status,
					users:student_id (
						fullName
					)
				`
				)
				.eq('class_id', classId)
				.gte('noted_for', formattedStartDate)
				.lte('noted_for', formattedEndDate)
				.order('noted_for', { ascending: true })

			if (attendanceError) throw attendanceError

			// Transform data for export
			const groupedByStudent: Record<string, any> = {}

			// Get all dates in the range
			const allDates: string[] = []
			const currentDate = new Date(startDate)
			while (currentDate <= endDate) {
				// Skip weekends (Saturday = 6, Sunday = 0)
				const day = currentDate.getDay()
				if (day !== 0 && day !== 6) {
					allDates.push(currentDate.toISOString().split('T')[0])
				}
				currentDate.setDate(currentDate.getDate() + 1)
			}

			// Initialize all students with empty attendance records
			studentsInClass.forEach(student => {
				groupedByStudent[student.id] = {
					studentId: student.id,
					studentName: student.fullName,
					attendance: {},
				}
			})

			// Add attendance data for students who have records
			attendanceData?.forEach(record => {
				const studentId = record.student_id

				if (groupedByStudent[studentId]) {
					groupedByStudent[studentId].attendance[record.noted_for] = record.status
				}
			})

			// Create export data
			const exportData = Object.values(groupedByStudent).map((studentData: any) => {
				const row: Record<string, any> = {
					'Student Name': studentData.studentName,
				}

				// Add attendance status for each date
				allDates.forEach(date => {
					const formattedDate = new Date(date).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
					})
					row[formattedDate] = studentData.attendance[date] || 'Absent'
				})

				// Calculate attendance percentage - consider N/A (now "Absent") as absent
				const totalDays = allDates.length
				const presentDays = Object.values(studentData.attendance).filter(
					(status: any) => status === 'present' || status === 'late'
				).length

				const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
				row['Attendance %'] = `${percentage}%`

				return row
			})

			// Create worksheet
			const ws = XLSX.utils.json_to_sheet(exportData)
			const wb = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(wb, ws, 'Attendance')

			// Generate filename
			const periodText = period === 'monthly' ? 'Monthly' : 'Weekly'
			const dateRange = `${new Date(formattedStartDate).toLocaleDateString()} to ${new Date(
				formattedEndDate
			).toLocaleDateString()}`
			const filename = `${classData.classname}_${periodText}_Attendance_${dateRange.replace(
				/\//g,
				'-'
			)}.xlsx`

			// Export to file
			XLSX.writeFile(wb, filename)

			toast.success(`${periodText} attendance data exported successfully`)
			setIsExportModalOpen(false)
		} catch (error) {
			console.error('Error exporting attendance data:', error)
			toast.error('Failed to export attendance data')
		} finally {
			setExportLoading(false)
		}
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
							<span>{t('dailyAttendance.attendance')}</span>
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
						<TableHeader>{t('userProfile.fullName')}</TableHeader>
						<TableHeader>{t('dailyAttendance.email')}</TableHeader>
						<TableHeader>{t('dailyAttendance.actions')}</TableHeader>
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
									<span>{t('dailyAttendance.attendance')}</span>
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
				<span>{t('dailyAttendance.backToClasses')}</span>
			</BackLink>

			<PageHeader
				title={classData ? `${classData.classname} - ${t('dailyAttendance.title')}` : t('dailyAttendance.title')}
				subtitle={level ? `${level.name} - ${t('dailyAttendance.manageAttendance')}` : t('dailyAttendance.manageAttendance')}
			/>

			{loading ? (
				<LoadingContainer>
					<LoadingSpinner />
					<p>{t('dailyAttendance.loadingStudents')}</p>
				</LoadingContainer>
			) : students.length === 0 ? (
				<EmptyState>
					<h3>{t('dailyAttendance.noStudentsFound')}</h3>
					<p>{t('dailyAttendance.noStudentsEnrolled')}</p>
				</EmptyState>
			) : (
				<TableWrapper>
					<SearchContainer>
						<LeftSection>
							<StudentCount>{students.length} {t('dailyAttendance.students')}</StudentCount>
							<ViewToggle>
								<ViewToggleButton
									isActive={viewMode === 'grid'}
									onClick={() => setViewMode('grid')}
									aria-label={t('dailyAttendance.gridView')}
								>
									<Grid size={18} />
								</ViewToggleButton>
								<ViewToggleButton
									isActive={viewMode === 'table'}
									onClick={() => setViewMode('table')}
									aria-label={t('dailyAttendance.tableView')}
								>
									<List size={18} />
								</ViewToggleButton>
							</ViewToggle>
						</LeftSection>
						<ActionContainer>
							<ExportButton onClick={handleExportClick}>
								<FileText size={16} />
								<span>{t('dailyAttendance.exportAttendance')}</span>
							</ExportButton>
							<SearchInputWrapper>
								<SearchIcon>
									<Search size={18} />
								</SearchIcon>
								<SearchInput
									type='text'
									placeholder={t('dailyAttendance.searchStudents')}
									value={searchQuery}
									onChange={handleSearchChange}
								/>
							</SearchInputWrapper>
						</ActionContainer>
					</SearchContainer>

					{filteredStudents.length === 0 ? (
						<EmptyState>
							<h3>{t('dailyAttendance.noMatchingStudents')}</h3>
							<p>{t('dailyAttendance.noStudentsMatchSearch')}</p>
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

				{isExportModalOpen && (
					<ExportModal
						isOpen={isExportModalOpen}
						onClose={handleExportClose}
						onExport={handleExportData}
						loading={exportLoading}
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

const ActionContainer = styled.div`
	display: flex;
	gap: 16px;
	align-items: center;
`

const ExportButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	background-color: #0ea5e9;
	color: white;
	border: none;
	border-radius: 8px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: #0284c7;
	}
`

// Export Period Selection Modal
interface ExportModalProps {
	isOpen: boolean
	onClose: () => void
	onExport: (period: ExportPeriod) => void
	loading: boolean
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, loading }) => {
	const [selectedPeriod, setSelectedPeriod] = useState<ExportPeriod>(null)

	const handlePeriodSelect = (period: ExportPeriod) => {
		setSelectedPeriod(period)
	}

	const handleExport = () => {
		if (selectedPeriod) {
			onExport(selectedPeriod)
		}
	}

	if (!isOpen) return null

	return (
		<ModalOverlay
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onClose}
		>
			<ModalContent
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				onClick={e => e.stopPropagation()}
			>
				<ModalHeader>
					<h3>{t('dailyAttendance.exportAttendanceData')}</h3>
					<CloseButton onClick={onClose}>
						<ArrowLeft size={20} />
					</CloseButton>
				</ModalHeader>

				<ModalBody>
					<p>{t('dailyAttendance.selectPeriodForExport')}</p>

					<RadioGroup>
						<RadioOption>
							<RadioInput
								type='radio'
								id='weekly'
								name='exportPeriod'
								checked={selectedPeriod === 'weekly'}
								onChange={() => handlePeriodSelect('weekly')}
							/>
							<RadioLabel htmlFor='weekly'>
								<RadioButton />
								{t('dailyAttendance.weekly')}
							</RadioLabel>
						</RadioOption>
						<RadioOption>
							<RadioInput
								type='radio'
								id='monthly'
								name='exportPeriod'
								checked={selectedPeriod === 'monthly'}
								onChange={() => handlePeriodSelect('monthly')}
							/>
							<RadioLabel htmlFor='monthly'>
								<RadioButton />
								{t('dailyAttendance.monthly')}
							</RadioLabel>
						</RadioOption>
					</RadioGroup>
				</ModalBody>

				<ModalFooter>
					<CancelButton onClick={onClose} disabled={loading}>
						{t('dailyAttendance.cancel')}
					</CancelButton>
					<ExportActionButton onClick={handleExport} disabled={!selectedPeriod || loading}>
						{loading ? t('dailyAttendance.exporting') : t('dailyAttendance.export')}
					</ExportActionButton>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	)
}

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
	padding: 20px;
	backdrop-filter: blur(2px);
`

const ModalContent = styled(motion.div)`
	background-color: #fff;
	border-radius: 12px;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
	width: 100%;
	max-width: 500px;
	overflow-y: auto;
	z-index: 1001;
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 20px;
	border-bottom: 1px solid #e5e7eb;

	h3 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 600;
	}
`

const ModalBody = styled.div`
	padding: 20px;

	p {
		margin-top: 0;
		margin-bottom: 16px;
		color: #4b5563;
	}
`

const ModalFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 20px;
	border-top: 1px solid #e5e7eb;
`

const RadioGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	margin: 20px 0;
`

const RadioOption = styled.div`
	display: flex;
	align-items: center;
`

const RadioInput = styled.input`
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
`

const RadioLabel = styled.label`
	display: flex;
	align-items: center;
	font-size: 1rem;
	color: #4b5563;
	cursor: pointer;

	${RadioInput}:checked + & {
		color: #111827;
		font-weight: 500;
	}
`

const RadioButton = styled.span`
	position: relative;
	display: inline-block;
	width: 20px;
	height: 20px;
	margin-right: 10px;
	border-radius: 50%;
	border: 2px solid #d1d5db;
	transition: all 0.2s;

	&::after {
		content: '';
		position: absolute;
		display: none;
		top: 4px;
		left: 4px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: #0ea5e9;
	}

	${RadioInput}:checked + ${RadioLabel} & {
		border-color: #0ea5e9;

		&::after {
			display: block;
		}
	}
`

const CloseButton = styled.button`
	background: none;
	border: none;
	color: #6b7280;
	cursor: pointer;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;

	&:hover {
		background-color: #f3f4f6;
		color: #111827;
	}
`

const CancelButton = styled.button`
	padding: 8px 16px;
	background: none;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	color: #4b5563;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover:not(:disabled) {
		background-color: #f3f4f6;
		border-color: #9ca3af;
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`

const ExportActionButton = styled.button`
	padding: 8px 16px;
	background-color: #0ea5e9;
	border: none;
	border-radius: 6px;
	color: white;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover:not(:disabled) {
		background-color: #0284c7;
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`

export default TeacherDailyAttendanceClass
