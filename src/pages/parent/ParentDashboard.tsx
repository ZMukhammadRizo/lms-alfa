import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import {
	FiBarChart2,
	FiCalendar,
	FiChevronRight,
	FiClipboard,
	FiRefreshCw,
	FiUser,
} from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import StatCard from '../../components/admin/StatCard'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabaseClient'
import {
	useParentAttendance,
	useParentChildren,
	useParentScores,
	useParentStudentStore,
} from '../../store/parentStudentStore'

interface Child {
	id: string
	firstName: string
	lastName: string
}

interface Assignment {
	id: string
	subject: string
	title: string
	dueDate: string
	status: string
}

interface Grade {
	id: string
	subject: string
	title: string
	grade: string
	score: string
	date: string
}

interface Event {
	id: string
	title: string
	date: string
	time: string
}

const ParentDashboard: React.FC = () => {
	const { user } = useAuth()
	const navigate = useNavigate()
	const { fetchChildren, fetchScores, fetchAttendance, loading, error } = useParentStudentStore()
	const children = useParentChildren()
	const scores = useParentScores()
	const attendance = useParentAttendance()

	const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [assignments, setAssignments] = useState<Assignment[]>([])
	const [recentGrades, setRecentGrades] = useState<Grade[]>([])
	const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
	const [overallStats, setOverallStats] = useState({
		grade: 'N/A',
		gradeValue: 0,
		attendance: '0%',
		attendanceValue: 0,
		pendingAssignments: 0,
	})

	// Load initial data
	useEffect(() => {
		const loadParentData = async () => {
			try {
				// Get current user
				const {
					data: { user },
				} = await supabase.auth.getUser()

				if (!user) {
					navigate('/auth/login')
					return
				}

				// Load children data
				await fetchChildren(user.id)
			} catch (err) {
				console.error('Error loading parent data:', err)
			}
		}

		loadParentData()
	}, [fetchChildren, navigate])

	// Set default selected student when children are loaded
	useEffect(() => {
		if (children.length > 0 && !selectedStudent) {
			setSelectedStudent(children[0].id)
		}
	}, [children, selectedStudent])

	// Fetch scores and attendance when children are loaded
	useEffect(() => {
		if (children.length > 0) {
			const childrenIds = children.map(child => child.id)
			fetchScores(childrenIds)
			fetchAttendance(childrenIds)
		}
	}, [children, fetchScores, fetchAttendance])

	// Calculate stats when selected student changes or data updates
	useEffect(() => {
		if (!selectedStudent) return

		// Calculate overall grade
		const studentScores = scores.filter(score => score.student_id === selectedStudent)
		let totalScore = 0
		studentScores.forEach(score => {
			totalScore += score.score
		})
		const averageScore = studentScores.length > 0 ? totalScore / studentScores.length : 0
		const gradeLetter = calculateGradeLetter(averageScore)

		// Calculate attendance percentage
		const studentAttendance = attendance.filter(record => record.student_id === selectedStudent)
		let presentCount = 0
		studentAttendance.forEach(record => {
			if (record.status?.toLowerCase() === 'present') {
				presentCount++
			}
		})
		const attendancePercentage =
			studentAttendance.length > 0 ? Math.round((presentCount / studentAttendance.length) * 100) : 0

		// For now, set pending assignments to a placeholder value
		// In a real app, you would fetch this from an assignments table
		const pendingAssignments = Math.floor(Math.random() * 5)

		setOverallStats({
			grade: gradeLetter,
			gradeValue: averageScore,
			attendance: `${attendancePercentage}%`,
			attendanceValue: attendancePercentage,
			pendingAssignments,
		})

		// Create recent grades from actual scores
		const formattedGrades = studentScores.slice(0, 3).map(score => ({
			id: score.id,
			subject: score.lessons.subjects.subjectname,
			title: score.lessons.lessonname,
			grade: calculateGradeLetter(score.score),
			score: `${score.score}/10`,
			date: formatDate(score.created_at),
		}))

		setRecentGrades(formattedGrades)

		// Set assignments to empty array instead of mock data
		setAssignments([])

		// For demo purposes, create placeholder events
		// In a real app, you would fetch these from their respective tables
		setUpcomingEvents([
			{ id: '1', title: 'Parent-Teacher Meeting', date: 'May 15, 2023', time: '4:00 PM' },
			{ id: '2', title: 'School Science Fair', date: 'May 20, 2023', time: 'All Day' },
			{ id: '3', title: 'End of Term Exam', date: 'June 10, 2023', time: '9:00 AM' },
		])
	}, [selectedStudent, scores, attendance])

	// Calculate letter grade from numerical score (1-10 scale)
	const calculateGradeLetter = (score: number) => {
		if (score >= 9) return 'A'
		if (score >= 8) return 'B+'
		if (score >= 7) return 'B'
		if (score >= 6) return 'C+'
		if (score >= 5) return 'C'
		if (score >= 4) return 'D+'
		if (score >= 3) return 'D'
		return 'F'
	}

	// Format date string for display
	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		const now = new Date()
		const diffTime = Math.abs(now.getTime() - date.getTime())
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

		if (diffDays <= 1) return 'Today'
		if (diffDays <= 2) return 'Yesterday'
		if (diffDays <= 7) return `${diffDays} days ago`
		return date.toLocaleDateString()
	}

	const handleRefresh = async () => {
		if (!selectedStudent || isRefreshing) return

		setIsRefreshing(true)

		try {
			// Refetch all data
			const childrenIds = children.map(child => child.id)
			await fetchScores(childrenIds)
			await fetchAttendance(childrenIds)
		} catch (error) {
			console.error('Error refreshing data:', error)
		} finally {
			setIsRefreshing(false)
		}
	}

	const handleStudentChange = (studentId: string) => {
		setSelectedStudent(studentId)
	}

	// Get selected student's full name
	const getSelectedChildName = () => {
		if (!selectedStudent) return ''
		const child = children.find(c => c.id === selectedStudent)
		return child ? `${child.firstName} ${child.lastName}` : ''
	}

	// Get first letter of selected student's name for avatar
	const getSelectedChildInitial = () => {
		if (!selectedStudent) return ''
		const child = children.find(c => c.id === selectedStudent)
		return child ? child.firstName.charAt(0) : ''
	}

	// Get selected student's grade level
	const getSelectedChildGrade = () => {
		// In a real app, you would get this from the class info
		return '10th Grade' // Placeholder
	}

	return (
		<DashboardContainer
			as={motion.div}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			<DashboardHeader>
				<div>
					<DashboardTitle>Parent Dashboard</DashboardTitle>
					<WelcomeMessage>Welcome back, {user?.fullName || 'Parent'}!</WelcomeMessage>
				</div>

				<HeaderControls>
					<StudentButtonsContainer>
						{children.map(child => (
							<StudentButton
								key={child.id}
								$isActive={selectedStudent === child.id}
								onClick={() => handleStudentChange(child.id)}
							>
								{child.firstName} {child.lastName}
							</StudentButton>
						))}
					</StudentButtonsContainer>

					
				</HeaderControls>
			</DashboardHeader>

			{children.length === 0 && !loading && (
				<EmptyState>No children found. Please contact the school administrator.</EmptyState>
			)}

			{/* Loading or Error States */}
			{loading && <LoadingState>Loading dashboard data...</LoadingState>}
			{error && <ErrorMessage>Error loading data: {error}</ErrorMessage>}

			{!loading && !error && selectedStudent && children.length > 0 && (
				<>
					{/* Stats Overview */}
					<StatsGrid>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<StatCard
								importantTextColor={
									overallStats.gradeValue >= 7
										? '#22c55e'
										: overallStats.gradeValue >= 5
										? '#f59e0b'
										: '#ef4444'
								}
								title='Overall Grade'
								value={overallStats.grade}
								change={`${overallStats.gradeValue.toFixed(1)}/10`}
								icon={<FiBarChart2 />}
								color={
									overallStats.gradeValue >= 7
										? 'green'
										: overallStats.gradeValue >= 5
										? 'yellow'
										: 'red'
								}
							/>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: 0.1 }}
						>
							<StatCard
								importantTextColor={
									overallStats.attendanceValue >= 90
										? '#22c55e'
										: overallStats.attendanceValue >= 80
										? '#3b82f6'
										: overallStats.attendanceValue >= 70
										? '#f59e0b'
										: '#ef4444'
								}
								title='Attendance'
								value={overallStats.attendance}
								change={
									overallStats.attendanceValue >= 90
										? 'Excellent'
										: overallStats.attendanceValue >= 80
										? 'Good'
										: overallStats.attendanceValue >= 70
										? 'Needs improvement'
										: 'Critical'
								}
								icon={<FiUser />}
								color={
									overallStats.attendanceValue >= 90
										? 'green'
										: overallStats.attendanceValue >= 80
										? 'primary'
										: overallStats.attendanceValue >= 70
										? 'yellow'
										: 'red'
								}
							/>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: 0.2 }}
						>
							<StatCard
								importantTextColor={
									overallStats.pendingAssignments === 0
										? '#22c55e'
										: overallStats.pendingAssignments <= 2
										? '#f59e0b'
										: '#ef4444'
								}
								title='Pending Assignments'
								value={overallStats.pendingAssignments}
								change={
									overallStats.pendingAssignments === 0
										? 'All completed'
										: overallStats.pendingAssignments <= 2
										? 'Almost there'
										: 'Action required'
								}
								icon={<FiClipboard />}
								color={
									overallStats.pendingAssignments === 0
										? 'primary'
										: overallStats.pendingAssignments <= 2
										? 'yellow'
										: 'red'
								}
							/>
						</motion.div>
					</StatsGrid>

					{/* Main Content Grid */}
					<DashboardGrid>
						{/* Child Overview */}
						<GridItem
							as={motion.div}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: 0.3 }}
						>
							<SectionHeader>
								<SectionTitle>Child Overview</SectionTitle>
								<ViewAllButton as={Link} to='/parent/students'>
									View Details <FiChevronRight />
								</ViewAllButton>
							</SectionHeader>
							<OverviewCard>
								<StudentProfile>
									<StudentAvatar>{getSelectedChildInitial()}</StudentAvatar>
									<StudentDetails>
										<StudentName>{getSelectedChildName()}</StudentName>
										<StudentGrade>{getSelectedChildGrade()}</StudentGrade>
									</StudentDetails>
									<PerformanceBadge
										$status={
											overallStats.gradeValue >= 7
												? 'good'
												: overallStats.gradeValue >= 5
												? 'average'
												: 'poor'
										}
									>
										{overallStats.gradeValue >= 7
											? 'Good Standing'
											: overallStats.gradeValue >= 5
											? 'Average Standing'
											: 'Needs Attention'}
									</PerformanceBadge>
								</StudentProfile>
								<ProgressSection>
									<ProgressItem>
										<ProgressLabel>Overall Performance</ProgressLabel>
										<ProgressBar>
											<ProgressFill
												$percentage={overallStats.gradeValue * 10}
												$color={
													overallStats.gradeValue >= 7
														? '#22c55e'
														: overallStats.gradeValue >= 5
														? '#f59e0b'
														: '#ef4444'
												}
											/>
										</ProgressBar>
										<ProgressValue $value={overallStats.gradeValue * 10} $type='grade'>
											{(overallStats.gradeValue * 10).toFixed(0)}%
										</ProgressValue>
									</ProgressItem>
									<ProgressItem>
										<ProgressLabel>Attendance</ProgressLabel>
										<ProgressBar>
											<ProgressFill
												$percentage={overallStats.attendanceValue}
												$color={
													overallStats.attendanceValue >= 90
														? '#22c55e'
														: overallStats.attendanceValue >= 80
														? '#3b82f6'
														: overallStats.attendanceValue >= 70
														? '#f59e0b'
														: '#ef4444'
												}
											/>
										</ProgressBar>
										<ProgressValue $value={overallStats.attendanceValue} $type='attendance'>
											{overallStats.attendanceValue}%
										</ProgressValue>
									</ProgressItem>
								</ProgressSection>
							</OverviewCard>
						</GridItem>

						{/* Upcoming Assignments */}
						<GridItem
							as={motion.div}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: 0.4 }}
						>
							<SectionHeader>
								<SectionTitle>Upcoming Assignments</SectionTitle>
								<ViewAllButton as={Link} to='/parent/assignments'>
									View All <FiClipboard />
								</ViewAllButton>
							</SectionHeader>
							<AssignmentsCard>
								{assignments.length === 0 ? (
									<EmptyState>No upcoming assignments found for this student</EmptyState>
								) : (
									assignments.map(assignment => (
										<AssignmentItem key={assignment.id}>
											<AssignmentHeader>
												<AssignmentSubject>{assignment.subject}</AssignmentSubject>
												<AssignmentDue $dueDate={assignment.dueDate}>
													Due: {assignment.dueDate}
												</AssignmentDue>
											</AssignmentHeader>
											<AssignmentTitle>{assignment.title}</AssignmentTitle>
											<AssignmentStatus $status={assignment.status}>
												{assignment.status}
											</AssignmentStatus>
										</AssignmentItem>
									))
								)}
							</AssignmentsCard>
						</GridItem>

						{/* Recent Grades */}
						<GridItem
							as={motion.div}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: 0.5 }}
						>
							<SectionHeader>
								<SectionTitle>Recent Grades</SectionTitle>
								<ViewAllButton as={Link} to={`/parent/grades?student=${selectedStudent || ''}`}>
									View All <FiBarChart2 />
								</ViewAllButton>
							</SectionHeader>
							<GradesCard>
								{recentGrades.length === 0 ? (
									<EmptyState>No grades available</EmptyState>
								) : (
									recentGrades.map(grade => (
										<GradeItem key={grade.id}>
											<GradeHeader>
												<GradeSubject>{grade.subject}</GradeSubject>
												<GradeDate>{grade.date}</GradeDate>
											</GradeHeader>
											<GradeTitle>{grade.title}</GradeTitle>
											<GradeFooter>
												<GradeScore $grade={grade.grade}>{grade.score}</GradeScore>
												<GradeLetter $grade={grade.grade}>{grade.grade}</GradeLetter>
											</GradeFooter>
										</GradeItem>
									))
								)}
							</GradesCard>
						</GridItem>

					</DashboardGrid>
				</>
			)}
		</DashboardContainer>
	)
}

// Styled Components
const DashboardContainer = styled.div`
	padding: 24px;
`

const DashboardHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 24px;
	margin-bottom: 32px;
	padding-bottom: 16px;
	border-bottom: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};

	@media (max-width: 992px) {
		flex-direction: column;
		gap: 20px;
	}
`

const DashboardTitle = styled.h1`
	font-size: 1.75rem;
	font-weight: 600;
	margin: 0 0 8px 0;
	color: ${props => props.theme?.colors?.text?.primary || '#000'};
	display: flex;
	align-items: center;
	gap: 12px;

	&::before {
		content: '';
		width: 4px;
		height: 24px;
		background-color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
		border-radius: 4px;
		display: inline-block;
	}
`

const WelcomeMessage = styled.p`
	margin: 0;
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	font-size: 1rem;
	padding-left: 16px;
`

const HeaderControls = styled.div`
	display: flex;
	gap: 16px;
	align-items: center;

	@media (max-width: 992px) {
		width: 100%;
		flex-wrap: wrap;
	}

	@media (max-width: 768px) {
		gap: 12px;
	}
`

const StudentButtonsContainer = styled.div`
	display: flex;
	background-color: ${props => props.theme?.colors?.background?.light || '#f5f5f5'};
	border-radius: 8px;
	overflow: hidden;
	border: 1px solid ${props => props.theme?.colors?.border?.light || '#eaeaea'};
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

	@media (max-width: 768px) {
		max-width: 360px;
		flex: 1;
		justify-content: center;
	}
`

const TimePeriodSelector = styled.div`
	display: flex;
	background-color: ${props => props.theme?.colors?.background?.light || '#f5f5f5'};
	border-radius: 8px;
	overflow: hidden;
	border: 1px solid ${props => props.theme?.colors?.border?.light || '#eaeaea'};
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

	@media (max-width: 768px) {
		flex: 1;
		max-width: 360px;
		justify-content: center;
	}
`

interface ActiveButtonProps {
	$isActive: boolean
}

const TimePeriodButton = styled.button<ActiveButtonProps>`
	background: ${props =>
		props.$isActive ? props.theme?.colors?.primary?.[500] || '#1890ff' : 'transparent'};
	color: ${props => (props.$isActive ? '#fff' : props.theme?.colors?.text?.secondary || '#666')};
	border: none;
	padding: 8px 16px;
	font-size: 14px;
	font-weight: ${props => (props.$isActive ? '500' : '400')};
	cursor: pointer;
	transition: all 0.2s ease;
	position: relative;

	&:hover {
		background: ${props =>
			props.$isActive
				? props.theme?.colors?.primary?.[600] || '#096dd9'
				: props.theme?.colors?.background?.tertiary || '#eee'};
	}

	&:after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 2px;
		background-color: ${props => (props.$isActive ? '#fff' : 'transparent')};
		opacity: ${props => (props.$isActive ? 0.7 : 0)};
		transition: opacity 0.2s ease;
	}
`

const StudentButton = styled.button<ActiveButtonProps>`
	background: ${props =>
		props.$isActive ? props.theme?.colors?.primary?.[500] || '#1890ff' : 'transparent'};
	color: ${props => (props.$isActive ? '#fff' : props.theme?.colors?.text?.secondary || '#666')};
	border: none;
	padding: 8px 16px;
	font-size: 14px;
	font-weight: ${props => (props.$isActive ? '500' : '400')};
	cursor: pointer;
	transition: all 0.2s ease;
	position: relative;
	flex: 1;

	&:hover {
		background: ${props =>
			props.$isActive
				? props.theme?.colors?.primary?.[600] || '#096dd9'
				: props.theme?.colors?.background?.tertiary || '#eee'};
	}

	&:after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 2px;
		background-color: ${props => (props.$isActive ? '#fff' : 'transparent')};
		opacity: ${props => (props.$isActive ? 0.7 : 0)};
		transition: opacity 0.2s ease;
	}
`

const RefreshButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	background-color: ${props => props.theme?.colors?.background?.light || '#f5f5f5'};
	border: 1px solid ${props => props.theme?.colors?.border?.light || '#eaeaea'};
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	padding: 8px 16px;
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: all 0.2s ease;
	height: 40px;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

	&:hover {
		background-color: ${props => props.theme?.colors?.background?.tertiary || '#eee'};
		color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	svg {
		font-size: 16px;
	}

	@media (max-width: 768px) {
		min-width: 80px;
		justify-content: center;
	}
`

const StatsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 24px;
	margin-bottom: 32px;

	@media (max-width: 1200px) {
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}

	@media (max-width: 576px) {
		grid-template-columns: 1fr;
		gap: 16px;
	}
`

const DashboardGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 24px;

	@media (max-width: 1200px) {
		gap: 20px;
	}

	@media (max-width: 992px) {
		grid-template-columns: 1fr;
		gap: 20px;
	}

	@media (max-width: 576px) {
		gap: 16px;
	}
`

const GridItem = styled.div`
	background-color: ${props => props.theme?.colors?.neutral?.[50] || '#fff'};
	border-radius: 12px;
	box-shadow: ${props => props.theme?.shadows?.sm || '0 2px 8px rgba(0, 0, 0, 0.05)'};
	border: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};
	overflow: hidden;
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		box-shadow: ${props => props.theme?.shadows?.md || '0 4px 12px rgba(0, 0, 0, 0.1)'};
		transform: translateY(-2px);
	}
`

const SectionHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 20px;
	border-bottom: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};
	background-color: ${props => props.theme?.colors?.background?.light || '#f9f9f9'};
`

const SectionTitle = styled.h3`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: ${props => props.theme?.colors?.text?.primary || '#000'};
	display: flex;
	align-items: center;
	gap: 8px;

	&::before {
		content: '';
		width: 3px;
		height: 16px;
		background-color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
		border-radius: 3px;
		display: inline-block;
	}
`

const ViewAllButton = styled(Link)`
	background: transparent;
	border: none;
	color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	padding: 4px 8px;
	text-decoration: none;
	border-radius: 4px;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme?.colors?.primary?.[50] || '#e6f7ff'};
	}

	svg {
		font-size: 1rem;
	}
`

const OverviewCard = styled.div`
	padding: 20px;
`

const StudentProfile = styled.div`
	display: flex;
	align-items: center;
	padding: 12px;
	margin-bottom: 20px;
	background-color: ${props => props.theme?.colors?.background?.light || '#f9f9f9'};
	border-radius: 8px;
	border: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};
`

const StudentAvatar = styled.div`
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background-color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 18px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const StudentDetails = styled.div`
	flex: 1;
`

const StudentName = styled.h4`
	margin: 0 0 4px 0;
	font-size: 1.25rem;
	font-weight: 600;
`

const StudentGrade = styled.p`
	margin: 0;
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	font-size: 0.875rem;
`

const PerformanceBadge = styled.div<{ $status: string }>`
	padding: 6px 12px;
	background-color: ${props => {
		switch (props.$status) {
			case 'good':
				return props.theme?.colors?.success?.[50] || '#f0fdf4'
			case 'average':
				return props.theme?.colors?.warning?.[50] || '#fff7e6'
			case 'poor':
				return props.theme?.colors?.danger?.[50] || '#fff1f0'
			default:
				return props.theme?.colors?.success?.[50] || '#f6ffed'
		}
	}};
	color: ${props => {
		switch (props.$status) {
			case 'good':
				return props.theme?.colors?.success?.[600] || '#52c41a'
			case 'average':
				return props.theme?.colors?.warning?.[600] || '#d48806'
			case 'poor':
				return props.theme?.colors?.danger?.[600] || '#f5222d'
			default:
				return props.theme?.colors?.success?.[600] || '#52c41a'
		}
	}};
	border-radius: 16px;
	font-size: 12px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	border: 1px solid
		${props => {
			switch (props.$status) {
				case 'good':
					return props.theme?.colors?.success?.[100] || '#dcfce7'
				case 'average':
					return props.theme?.colors?.warning?.[100] || '#fef3c7'
				case 'poor':
					return props.theme?.colors?.danger?.[100] || '#fef2f2'
				default:
					return props.theme?.colors?.success?.[100] || '#dcfce7'
			}
		}};
`

const ProgressSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`

const ProgressItem = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`

const ProgressLabel = styled.span`
	width: 160px;
	flex-shrink: 0;
	font-size: 0.875rem;
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
`

const ProgressBar = styled.div`
	height: 8px;
	background-color: ${props => props.theme?.colors?.background?.light || '#f5f5f5'};
	border-radius: 4px;
	overflow: hidden;
	flex: 1;
	box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
	border: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};
`

interface ProgressFillProps {
	$percentage: number
	$color: string
}

const ProgressFill = styled.div<ProgressFillProps>`
	height: 100%;
	width: ${props => props.$percentage}%;
	background-color: ${props => props.$color};
	border-radius: 4px;
`

interface ProgressValueProps {
	$value: number
	$type: 'grade' | 'attendance' | 'assignments'
}

const ProgressValue = styled.span<ProgressValueProps>`
	width: 40px;
	font-size: 0.875rem;
	text-align: right;
	font-weight: 500;
	color: ${props => {
		if (props.$type === 'grade') {
			if (props.$value >= 70) return props.theme?.colors?.success?.[600] || '#22c55e'
			if (props.$value >= 50) return props.theme?.colors?.warning?.[600] || '#f59e0b'
			return props.theme?.colors?.danger?.[600] || '#ef4444'
		}
		if (props.$type === 'attendance') {
			if (props.$value >= 90) return props.theme?.colors?.success?.[600] || '#22c55e'
			if (props.$value >= 80) return props.theme?.colors?.primary?.[600] || '#3b82f6'
			if (props.$value >= 70) return props.theme?.colors?.warning?.[600] || '#f59e0b'
			return props.theme?.colors?.danger?.[600] || '#ef4444'
		}
		if (props.$type === 'assignments') {
			if (props.$value === 100) return props.theme?.colors?.primary?.[600] || '#3b82f6'
			if (props.$value >= 60) return props.theme?.colors?.warning?.[600] || '#f59e0b'
			return props.theme?.colors?.danger?.[600] || '#ef4444'
		}
		return props.theme?.colors?.text?.primary || '#000'
	}};
`

const AssignmentsCard = styled.div`
	padding: 0 20px;
`

const AssignmentItem = styled.div`
	padding: 16px 0;
	border-bottom: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};

	&:last-child {
		border-bottom: none;
	}
`

const AssignmentHeader = styled.div`
	display: flex;
	justify-content: space-between;
	margin-bottom: 8px;
`

const AssignmentSubject = styled.span`
	font-size: 0.875rem;
	color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
	font-weight: 500;
`

const AssignmentDue = styled.span<{ $dueDate: string }>`
	font-size: 0.75rem;
	font-weight: ${props => (props.$dueDate.includes('Tomorrow') ? '600' : '400')};
	color: ${props => {
		if (props.$dueDate.includes('Tomorrow')) return props.theme?.colors?.danger?.[600] || '#ef4444'
		if (props.$dueDate.includes('2 days')) return props.theme?.colors?.warning?.[600] || '#f59e0b'
		return props.theme?.colors?.text?.secondary || '#666'
	}};
`

const AssignmentTitle = styled.h4`
	margin: 0 0 8px 0;
	font-size: 1rem;
	font-weight: 500;
`

interface StatusProps {
	$status: string
}

const AssignmentStatus = styled.span<StatusProps>`
	display: inline-block;
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 500;
	background-color: ${props => {
		switch (props.$status) {
			case 'Pending':
				return props.theme?.colors?.warning?.[50] || '#fff7e6'
			case 'In Progress':
				return props.theme?.colors?.primary?.[50] || '#e6f7ff'
			case 'Not Started':
				return props.theme?.colors?.danger?.[50] || '#fff1f0'
			case 'Completed':
				return props.theme?.colors?.success?.[50] || '#f6ffed'
			default:
				return props.theme?.colors?.success?.[50] || '#f6ffed'
		}
	}};
	color: ${props => {
		switch (props.$status) {
			case 'Pending':
				return props.theme?.colors?.warning?.[600] || '#d48806'
			case 'In Progress':
				return props.theme?.colors?.primary?.[600] || '#1890ff'
			case 'Not Started':
				return props.theme?.colors?.danger?.[600] || '#f5222d'
			case 'Completed':
				return props.theme?.colors?.success?.[600] || '#52c41a'
			default:
				return props.theme?.colors?.success?.[600] || '#52c41a'
		}
	}};
	border: 1px solid
		${props => {
			switch (props.$status) {
				case 'Pending':
					return props.theme?.colors?.warning?.[100] || '#fef3c7'
				case 'In Progress':
					return props.theme?.colors?.primary?.[100] || '#e6f7ff'
				case 'Not Started':
					return props.theme?.colors?.danger?.[100] || '#fff1f0'
				case 'Completed':
					return props.theme?.colors?.success?.[100] || '#f6ffed'
				default:
					return props.theme?.colors?.success?.[100] || '#f6ffed'
			}
		}};
`

const GradesCard = styled.div`
	padding: 0 20px;
`

const GradeItem = styled.div`
	padding: 16px 0;
	border-bottom: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};

	&:last-child {
		border-bottom: none;
	}
`

const GradeHeader = styled.div`
	display: flex;
	justify-content: space-between;
	margin-bottom: 8px;
`

const GradeSubject = styled.span`
	font-size: 0.875rem;
	color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
	font-weight: 600;
`

const GradeDate = styled.span`
	font-size: 0.75rem;
	color: ${props => props.theme?.colors?.text?.tertiary || '#999'};
	font-style: italic;
`

const GradeTitle = styled.h4`
	margin: 0 0 8px 0;
	font-size: 1rem;
	font-weight: 500;
`

const GradeFooter = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`

const GradeScore = styled.span<{ $grade: string }>`
	font-size: 0.875rem;
	font-weight: 500;
	color: ${props => {
		if (props.$grade === 'A') return props.theme?.colors?.success?.[600] || '#22c55e'
		if (props.$grade === 'B+' || props.$grade === 'B')
			return props.theme?.colors?.primary?.[600] || '#3b82f6'
		if (props.$grade === 'C+' || props.$grade === 'C')
			return props.theme?.colors?.warning?.[600] || '#f59e0b'
		if (props.$grade === 'D+' || props.$grade === 'D')
			return props.theme?.colors?.warning?.[700] || '#b45309'
		return props.theme?.colors?.danger?.[600] || '#ef4444'
	}};
`

interface GradeProps {
	$grade: string
}

const GradeLetter = styled.span<GradeProps>`
	display: inline-block;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 0.875rem;
	background-color: ${props => {
		if (props.$grade === 'A') return props.theme?.colors?.success?.[50] || '#f0fdf4'
		if (props.$grade === 'B+' || props.$grade === 'B')
			return props.theme?.colors?.primary?.[50] || '#e6f7ff'
		if (props.$grade === 'C+' || props.$grade === 'C')
			return props.theme?.colors?.warning?.[50] || '#fff7e6'
		if (props.$grade === 'D+' || props.$grade === 'D')
			return props.theme?.colors?.warning?.[100] || '#fef3c7'
		return props.theme?.colors?.danger?.[50] || '#fff1f0'
	}};
	color: ${props => {
		if (props.$grade === 'A') return props.theme?.colors?.success?.[600] || '#16a34a'
		if (props.$grade === 'B+' || props.$grade === 'B')
			return props.theme?.colors?.primary?.[600] || '#1890ff'
		if (props.$grade === 'C+' || props.$grade === 'C')
			return props.theme?.colors?.warning?.[600] || '#d48806'
		if (props.$grade === 'D+' || props.$grade === 'D')
			return props.theme?.colors?.warning?.[700] || '#b45309'
		return props.theme?.colors?.danger?.[600] || '#f5222d'
	}};
`

const EventsCard = styled.div`
	padding: 0 20px;
`

const EventItem = styled.div`
	padding: 16px 0;
	border-bottom: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};
	display: flex;
	align-items: center;
	gap: 16px;

	&:last-child {
		border-bottom: none;
	}
`

const EventDate = styled.div`
	display: flex;
	gap: 12px;
`

const EventIcon = styled.div`
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background-color: ${props => props.theme?.colors?.primary?.[50] || '#e6f7ff'};
	color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20px;
`

const EventDateTime = styled.div`
	font-size: 0.875rem;
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
`

const EventTime = styled.div`
	font-size: 0.75rem;
	margin-top: 4px;
`

const EventTitle = styled.h4`
	margin: 0;
	font-size: 1rem;
	font-weight: 500;
	flex: 1;
	color: ${props => props.theme?.colors?.text?.primary || '#000'};

	&:hover {
		color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
	}
`

// Adding these new components for error and loading states
const LoadingState = styled.div`
	padding: 32px;
	text-align: center;
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	font-size: 1rem;
	background-color: ${props => props.theme?.colors?.background?.secondary || '#f9f9f9'};
	border-radius: 12px;
	margin: 24px 0;
`

const ErrorMessage = styled.div`
	padding: 16px;
	background-color: ${props => props.theme?.colors?.danger?.[50] || '#fff1f0'};
	border: 1px solid ${props => props.theme?.colors?.danger?.[200] || '#ffccc7'};
	border-radius: 8px;
	color: ${props => props.theme?.colors?.danger?.[700] || '#cf1322'};
	margin: 24px 0;
	font-size: 1rem;
`

const EmptyState = styled.div`
	padding: 32px;
	text-align: center;
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	font-style: italic;
`

export default ParentDashboard
