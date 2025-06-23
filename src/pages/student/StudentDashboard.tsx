import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiAward, FiBook, FiCalendar, FiCheckSquare, FiClock, FiFileText } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import supabase from '../../config/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import {
	CourseInfo as FetchedCourseInfo,
	getStudentAssignmentCount,
	getStudentAssignments,
	getStudentCourses,
	getStudentRecentGrades,
	getStudentTodaySchedule,
	RecentGrade,
	ScheduleEntry,
	StudentAssignment,
} from '../../services/dashboardService'

// Define simplified Stat type for the top cards
interface DashboardStatCard {
	id: number
	title: string
	value: string
	icon: JSX.Element
	color: string
}

// Define attendance record interface
interface DailyAttendance {
	id: string
	student_id: string
	noted_for: string
	status: string
	noted_at: string
	quarter_id?: string
	class_id?: string
	teacher_id?: string
}

const StudentDashboard: React.FC = () => {
	const { user } = useAuth()
	const { t } = useTranslation()
	const [isLoading, setIsLoading] = useState(true)

	// State for dashboard data
	const [assignments, setAssignments] = useState<StudentAssignment[]>([])
	const [grades, setGrades] = useState<RecentGrade[]>([])
	const [courses, setCourses] = useState<FetchedCourseInfo[]>([])
	const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
	const [courseCount, setCourseCount] = useState<number>(0)
	const [assignmentCount, setAssignmentCount] = useState<number>(0)
	const [recentAttendance, setRecentAttendance] = useState<DailyAttendance[]>([])
	const [loadingAttendance, setLoadingAttendance] = useState(true)

	// Fetch dashboard data
	useEffect(() => {
		const fetchDashboardData = async () => {
			if (!user?.id) {
				setIsLoading(false)
				console.log('User ID not available, cannot fetch data.')
				// Optionally set mock data or show an error message
				return
			}
			setIsLoading(true)
			try {
				// Fetch all dashboard data in parallel
				const [assignmentsData, scheduleData, gradesData, coursesData, fetchedAssignmentCount] =
					await Promise.all([
						getStudentAssignments(user.id),
						getStudentTodaySchedule(user.id),
						getStudentRecentGrades(user.id),
						getStudentCourses(user.id),
						getStudentAssignmentCount(user.id),
					])

				setAssignments(assignmentsData)
				setSchedule(scheduleData)
				setGrades(gradesData)
				setCourses(coursesData)
				setCourseCount(coursesData.length)
				setAssignmentCount(fetchedAssignmentCount)
			} catch (error) {
				console.error('Error fetching dashboard data:', error)
				// Reset state or show error messages
				setAssignments([])
				setSchedule([])
				setGrades([])
				setCourses([])
				setCourseCount(0)
				setAssignmentCount(0)
			} finally {
				setIsLoading(false)
			}
		}

		fetchDashboardData()
	}, [user])

	// Fetch recent attendance data
	useEffect(() => {
		const fetchRecentAttendance = async () => {
			if (!user?.id) return

			setLoadingAttendance(true)

			try {
				const { data, error } = await supabase
					.from('daily_attendance')
					.select('*')
					.eq('student_id', user.id)
					.order('noted_for', { ascending: false })
					.limit(3)

				if (error) {
					console.error('Error fetching attendance data:', error)
				} else {
					setRecentAttendance(data || [])
				}
			} catch (error) {
				console.error('Error in fetchRecentAttendance:', error)
				setRecentAttendance([])
			} finally {
				setLoadingAttendance(false)
			}
		}

		fetchRecentAttendance()
	}, [user])

	// Convert stats to the format needed for display
	const dashboardStats: DashboardStatCard[] = [
		{ id: 1, title: t('studentPanel.dashboard.statsCards.subjects'), value: courseCount.toString(), icon: <FiBook />, color: 'primary' },
		{
			id: 2,
			title: t('studentPanel.navigation.assignments'),
			value: assignmentCount.toString(),
			icon: <FiFileText />,
			color: 'yellow',
		},
	]

	// Helper function to get status color
	const getStatusColor = (status: string): string => {
		if (!status) return 'var(--color-text-secondary)'

		switch (status.toLowerCase()) {
			case 'present':
				return 'var(--color-success)'
			case 'late':
				return 'var(--color-warning)'
			case 'excused':
				return 'var(--color-primary)'
			case 'absent':
				return 'var(--color-danger)'
			default:
				return 'var(--color-text-secondary)'
		}
	}

	// Format date for display
	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
		})
	}

	// Show loading state
	if (isLoading) {
		return (
			<LoadingContainer>
				<div>{t('studentPanel.dashboard.loading.dashboardData')}</div>
			</LoadingContainer>
		)
	}

	return (
		<DashboardContainer
			as={motion.div}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			<WelcomeSection>
				<WelcomeMessage>
					<motion.h1
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.1 }}
					>
						{t('studentPanel.dashboard.welcomeBack')}, {user?.fullName || t('common.student')}
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.2 }}
					>
						{t('studentPanel.dashboard.academicProgress')}
					</motion.p>
				</WelcomeMessage>
			</WelcomeSection>

			{/* Stats Overview */}
			<StatsGrid>
				{dashboardStats.map((stat, index) => (
					<motion.div
						key={stat.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: index * 0.1 }}
					>
						<StatCard>
							<StatIconContainer $color={stat.color}>{stat.icon}</StatIconContainer>
							<StatContent>
								<StatValue>{stat.value}</StatValue>
								<StatTitle>{stat.title}</StatTitle>
							</StatContent>
						</StatCard>
					</motion.div>
				))}
			</StatsGrid>

			{/* Main Content Grid */}
			<DashboardGrid>
				{/* Upcoming Assignments */}
				<GridItem
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.3 }}
				>
					<SectionHeader>
						<SectionTitle>
							<FiFileText />
							<span>{t('studentPanel.dashboard.sections.upcomingAssignments')}</span>
						</SectionTitle>
						<ViewAllButton as={Link} to='/student/assignments'>
							{t('studentPanel.common.viewAll')}
						</ViewAllButton>
					</SectionHeader>
					<ContentCard>
						{assignments.length > 0 ? (
							assignments.map((assignment, index) => (
								<AssignmentItem
									key={assignment.id}
									as={motion.div}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3, delay: 0.1 * index }}
								>
									<AssignmentHeader>
										<SubjectBadge $subject={assignment.subject}>{assignment.subject}</SubjectBadge>
										<AssignmentStatus $status={assignment.status}>
											{assignment.status === 'pending'
												? t('studentPanel.assignments.status.pending')
												: assignment.status === 'in-progress'
												? t('studentPanel.assignments.status.inProgress')
												: assignment.status === 'completed'
												? t('studentPanel.assignments.status.completed')
												: assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
										</AssignmentStatus>
									</AssignmentHeader>
									<AssignmentTitle>{assignment.title}</AssignmentTitle>
									<AssignmentDueDate>
										<FiClock size={14} />
										<span>
											{t('studentPanel.assignments.assignmentCard.dueDate')}:{' '}
											{new Date(assignment.dueDate).toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric',
												year: 'numeric',
											})}
										</span>
									</AssignmentDueDate>
								</AssignmentItem>
							))
						) : (
							<EmptyState>{t('studentPanel.dashboard.emptyStates.noPendingAssignments')}</EmptyState>
						)}
					</ContentCard>
				</GridItem>

				{/* Daily Attendance Section */}
				<GridItem
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.4 }}
				>
					<SectionHeader>
						<SectionTitle>
							<FiCheckSquare />
							<span>{t('studentPanel.dashboard.sections.dailyAttendance')}</span>
						</SectionTitle>
						<ViewAllButton as={Link} to='/student/daily-attendance'>
							{t('studentPanel.common.viewAll')}
						</ViewAllButton>
					</SectionHeader>
					<ContentCard>
						{loadingAttendance ? (
							<LoadingState>{t('studentPanel.dashboard.loading.attendance')}</LoadingState>
						) : recentAttendance.length > 0 ? (
							recentAttendance.map((record, index) => (
								<AttendanceItem
									key={record.id}
									as={motion.div}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3, delay: 0.1 * index }}
								>
									<AttendanceDate>{formatDate(record.noted_for)}</AttendanceDate>
									<AttendanceStatus $status={record.status}>
										{record.status.charAt(0).toUpperCase() + record.status.slice(1)}
									</AttendanceStatus>
								</AttendanceItem>
							))
						) : (
							<EmptyState>{t('studentPanel.dashboard.emptyStates.noAttendanceRecords')}</EmptyState>
						)}
					</ContentCard>
				</GridItem>

				{/* Today's Schedule */}
				<GridItem
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.5 }}
				>
					<SectionHeader>
						<SectionTitle>
							<FiCalendar />
							<span>{t('studentPanel.dashboard.sections.todaySchedule')}</span>
						</SectionTitle>
						<ViewAllButton as={Link} to='/student/schedule'>
							{t('studentPanel.common.viewAll')}
						</ViewAllButton>
					</SectionHeader>
					<ContentCard>
						{schedule.length > 0 ? (
							schedule.map((entry, index) => (
								<ScheduleItem
									key={entry.id}
									as={motion.div}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3, delay: 0.1 * index }}
								>
									<ScheduleTime>
										<TimeIcon>
											<FiClock />
										</TimeIcon>
										<TimeText>
											{entry.startTime} - {entry.endTime}
										</TimeText>
									</ScheduleTime>
									<ScheduleDetails>
										<LessonTitle>{entry.title}</LessonTitle>
										<LessonDetails>{entry.location || t('common.notAvailable')}</LessonDetails>
									</ScheduleDetails>
								</ScheduleItem>
							))
						) : (
							<EmptyState>{t('studentPanel.dashboard.emptyStates.noUpcomingClasses')}</EmptyState>
						)}
					</ContentCard>
				</GridItem>

				{/* Recent Grades */}
				<GridItem
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.6 }}
				>
					<SectionHeader>
						<SectionTitle>
							<FiAward />
							<span>{t('studentPanel.dashboard.sections.recentGrades')}</span>
						</SectionTitle>
						<ViewAllButton>{t('studentPanel.common.viewAll')}</ViewAllButton>
					</SectionHeader>
					<ContentCard>
						{grades.length > 0 ? (
							grades.map((grade, index) => (
								<GradeItem
									key={grade.id}
									as={motion.div}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3, delay: 0.1 * index }}
								>
									<GradeHeader>
										<GradeSubject>{grade.subjectName}</GradeSubject>
										<GradeDate>
											{new Date(grade.date).toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric',
											})}
										</GradeDate>
									</GradeHeader>
									<GradeTitle>{grade.lessonName}</GradeTitle>
									<GradeValue $grade={grade.score}>{grade.score}</GradeValue>
								</GradeItem>
							))
						) : (
							<EmptyState>{t('studentPanel.dashboard.emptyStates.noRecentGrades')}</EmptyState>
						)}
					</ContentCard>
				</GridItem>

				{/* Courses */}
				<GridItem
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.7 }}
				>
					<SectionHeader>
						<SectionTitle>
							<FiBook />
							<span>{t('studentPanel.navigation.courses')}</span>
						</SectionTitle>
						<ViewAllButton as={Link} to='/student/courses'>
							{t('studentPanel.common.viewAll')}
						</ViewAllButton>
					</SectionHeader>
					<ContentCard>
						{courses.length > 0 ? (
							courses.map((course, index) => (
								<CourseItem
									key={course.id}
									as={motion.div}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3, delay: 0.1 * index }}
								>
									<CourseTitle>{course.name}</CourseTitle>
									<CourseDetails></CourseDetails>
								</CourseItem>
							))
						) : (
							<EmptyState>{t('studentPanel.courses.emptyStates.noCourses')}</EmptyState>
						)}
					</ContentCard>
				</GridItem>
			</DashboardGrid>
		</DashboardContainer>
	)
}

// Add a new styled component for loading and empty states
const LoadingContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 70vh;
	font-size: 1.2rem;
	color: ${props => props.theme.colors.text};
`

const EmptyState = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100px;
	color: ${props => props.theme.colors.text.secondary};
	font-style: italic;
`

interface SubjectBadgeProps {
	$subject: string
}

interface StatusProps {
	$status: string
}

interface GradeValueProps {
	$grade: number
}

interface StatIconProps {
	$color: string
}

const DashboardContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 24px;
`

const WelcomeSection = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	padding-top: 16px;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
	}
`

const WelcomeMessage = styled.div`
	h1 {
		font-size: 24px;
		font-weight: 700;
		color: ${props => props.theme.colors.text.primary};
		margin: 0;
	}

	p {
		font-size: 14px;
		color: ${props => props.theme.colors.text.secondary};
		margin: 4px 0 0 0;
	}
`

const StatsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 20px;

	@media (max-width: ${props => props.theme.breakpoints.lg}) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		grid-template-columns: 1fr;
	}
`

const StatCard = styled.div`
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: 12px;
	padding: 24px;
	display: flex;
	align-items: center;
	gap: 16px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	border: 1px solid ${props => props.theme.colors.border.light};
	transition: all 0.3s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}
`

const StatIconContainer = styled.div<StatIconProps>`
	width: 48px;
	height: 48px;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20px;

	${props => {
		switch (props.$color) {
			case 'primary':
				return `
          background-color: ${props.theme.colors.primary[50]};
          color: ${props.theme.colors.primary[500]};
        `
			case 'green':
				return `
          background-color: ${props.theme.colors.success[50]};
          color: ${props.theme.colors.success[500]};
        `
			case 'yellow':
				return `
          background-color: ${props.theme.colors.warning[50]};
          color: ${props.theme.colors.warning[500]};
        `
			case 'purple':
				return `
          background-color: ${props.theme.colors.info?.[50] || '#f0e7ff'};
          color: ${props.theme.colors.info?.[500] || '#6941c6'};
        `
			default:
				return `
          background-color: ${props.theme.colors.primary[50]};
          color: ${props.theme.colors.primary[500]};
        `
		}
	}}
`

const StatContent = styled.div`
	display: flex;
	flex-direction: column;
`

const StatValue = styled.div`
	font-size: 24px;
	font-weight: 700;
	color: ${props => props.theme.colors.text.primary};
`

const StatTitle = styled.div`
	font-size: 14px;
	color: ${props => props.theme.colors.text.secondary};
`

const DashboardGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 32px;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		grid-template-columns: 1fr;
	}
`

const GridItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`

const SectionHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`

const SectionTitle = styled.h2`
	font-size: 16px;
	font-weight: 600;
	margin: 0;
	color: ${props => props.theme.colors.text.primary};
	display: flex;
	align-items: center;
	gap: 8px;

	svg {
		color: ${props => props.theme.colors.primary[500]};
	}
`

const ViewAllButton = styled.button`
	background: transparent;
	border: none;
	color: ${props => props.theme.colors.primary[500]};
	font-size: 14px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;

	&:hover {
		text-decoration: underline;
	}
`

const ContentCard = styled.div`
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: 12px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
	border: 1px solid ${props => props.theme.colors.border.light};
	height: 100%;
`

const AssignmentItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px;
	border-radius: 8px;
	background-color: ${props => props.theme.colors.background.secondary};
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: ${props => props.theme.shadows?.md || '0 4px 12px rgba(0, 0, 0, 0.1)'};
	}
`

const AssignmentHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`

const SubjectBadge = styled.div<SubjectBadgeProps>`
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;

	${props => {
		switch (props.$subject) {
			case 'Mathematics':
				return `
          background-color: ${props.theme.colors.primary[50]};
          color: ${props.theme.colors.primary[500]};
        `
			case 'Physics':
				return `
          background-color: ${props.theme.colors.warning[50]};
          color: ${props.theme.colors.warning[500]};
        `
			case 'English':
				return `
          background-color: ${props.theme.colors.success[50]};
          color: ${props.theme.colors.success[500]};
        `
			case 'Chemistry':
				return `
          background-color: #e9f9fd;
          color: #0ea5e9;
        `
			case 'Biology':
				return `
          background-color: #edf7ed;
          color: #16a34a;
        `
			case 'History':
				return `
          background-color: #f0e7ff;
          color: #6941c6;
        `
			default:
				return `
          background-color: ${props.theme.colors.primary[50]};
          color: ${props.theme.colors.primary[500]};
        `
		}
	}}
`

const AssignmentStatus = styled.div<StatusProps>`
	font-size: 12px;
	font-weight: 500;
	padding: 4px 8px;
	border-radius: 4px;

	${props => {
		switch (props.$status) {
			case 'pending':
				return `
          background-color: ${props.theme.colors.warning[50]};
          color: ${props.theme.colors.warning[500]};
        `
			case 'in-progress':
				return `
          background-color: ${props.theme.colors.primary[50]};
          color: ${props.theme.colors.primary[500]};
        `
			case 'completed':
				return `
          background-color: ${props.theme.colors.success[50]};
          color: ${props.theme.colors.success[500]};
        `
			case 'Upcoming':
				return `
          background-color: ${props.theme.colors.info?.[50] || props.theme.colors.primary[50]};
          color: ${props.theme.colors.info?.[500] || props.theme.colors.primary[500]};
        `
			default:
				return `
          background-color: ${
						props.theme.colors.neutral?.[50] || props.theme.colors.background.secondary
					};
          color: ${props.theme.colors.text.secondary};
        `
		}
	}}
`

const AssignmentTitle = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const AssignmentDueDate = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: ${props => props.theme.colors.text.secondary};
`

const GradeItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px;
	border-radius: 8px;
	background-color: ${props => props.theme.colors.background.secondary};
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: ${props => props.theme.shadows?.md || '0 4px 12px rgba(0, 0, 0, 0.1)'};
	}
`

const GradeHeader = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`

const GradeSubject = styled.div`
	font-size: 12px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const GradeDate = styled.div`
	font-size: 12px;
	color: ${props => props.theme.colors.text.secondary};
`

const GradeTitle = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const GradeValue = styled.div<GradeValueProps>`
	padding: 6px 10px;
	border-radius: 8px;
	font-size: 14px;
	font-weight: 600;

	${props => {
		const score = props.$grade
		if (score >= 9) {
			// A (9-10)
			return `
        background-color: ${props.theme.colors.success[50]};
        color: ${props.theme.colors.success[500]};
      `
		} else if (score >= 8) {
			// B (8-8.9)
			return `
        background-color: ${props.theme.colors.primary[50]};
        color: ${props.theme.colors.primary[500]};
      `
		} else if (score >= 7) {
			// C (7-7.9)
			return `
        background-color: ${props.theme.colors.warning[50]};
        color: ${props.theme.colors.warning[500]};
      `
		} else if (score >= 6) {
			// D (6-6.9) - Using info or another distinct color
			return `
        background-color: ${props.theme.colors.info?.[50] || '#e0f2fe'};
        color: ${props.theme.colors.info?.[500] || '#0ea5e9'};
      `
		} else {
			// F (Below 6)
			return `
        background-color: ${props.theme.colors.danger[50]};
        color: ${props.theme.colors.danger[500]};
      `
		}
	}}
`

const CourseItem = styled.div`
	padding: 12px;
	border-radius: 8px;
	background-color: ${props => props.theme.colors.background.secondary};
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: ${props => props.theme.shadows?.md || '0 4px 12px rgba(0, 0, 0, 0.1)'};
	}
`

const CourseTitle = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const CourseDetails = styled.div`
	font-size: 12px;
	color: ${props => props.theme.colors.text.secondary};
`

const ScheduleItem = styled.div`
	display: flex;
	gap: 16px;
	padding: 12px;
	border-radius: 8px;
	background-color: ${props => props.theme.colors.background.secondary};
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: ${props => props.theme.shadows?.md || '0 4px 12px rgba(0, 0, 0, 0.1)'};
	}
`

const ScheduleTime = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 80px;
`

const TimeIcon = styled.div`
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: ${props => props.theme.colors.primary[50]};
	color: ${props => props.theme.colors.primary[500]};
	margin-bottom: 4px;
`

const TimeText = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const ScheduleDetails = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`

const LessonTitle = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const LessonDetails = styled.div`
	font-size: 12px;
	color: ${props => props.theme.colors.text.secondary};
`

const LoadingState = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100px;
	color: ${props => props.theme.colors.text.secondary};
	font-style: italic;
`

const AttendanceItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px;
	border-radius: 8px;
	background-color: ${props => props.theme.colors.background.secondary};
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: ${props => props.theme.shadows?.md || '0 4px 12px rgba(0, 0, 0, 0.1)'};
	}
`

const AttendanceDate = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const AttendanceStatus = styled.div<StatusProps>`
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;

	${props => {
		switch (props.$status) {
			case 'present':
				return `
          background-color: ${props.theme.colors.success[50]};
          color: ${props.theme.colors.success[500]};
        `
			case 'late':
				return `
          background-color: ${props.theme.colors.warning[50]};
          color: ${props.theme.colors.warning[500]};
        `
			case 'excused':
				return `
          background-color: ${props.theme.colors.primary[50]};
          color: ${props.theme.colors.primary[500]};
        `
			case 'absent':
				return `
          background-color: ${props.theme.colors.danger[50]};
          color: ${props.theme.colors.danger[500]};
        `
			default:
				return `
          background-color: ${props.theme.colors.text.secondary};
          color: ${props.theme.colors.text.primary};
        `
		}
	}}
`

export default StudentDashboard
