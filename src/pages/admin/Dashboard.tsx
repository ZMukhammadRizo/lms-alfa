import React, { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import {
	FiUsers,
	FiBook,
	FiBriefcase,
	FiCalendar,
	FiAward,
	FiPieChart,
	FiRefreshCw,
	FiClock,
	FiBarChart2,
	FiCheckCircle,
	FiAlertCircle,
	FiHelpCircle,
	FiCpu,
	FiDatabase,
	FiBell,
	FiClipboard,
	FiStar,
	FiUserCheck,
	FiUserX,
	FiInfo,
} from 'react-icons/fi'
import { DefaultTheme } from 'styled-components'
import StatCard from '../../components/admin/StatCard'
import {
	getDashboardStats,
	getRecentActivities,
	getPerformanceData,
	getTopStudents,
	getRecentAssessments,
	getAttendanceData,
} from '../../services/dashboardService'
import supabase from '../../config/supabaseClient'

const Dashboard: React.FC = () => {
	// State for time period selector
	const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month'>('week')
	// State for refresh animation
	const [isRefreshing, setIsRefreshing] = useState(false)
	// State for selected statistics view
	const [statsView, setStatsView] = useState<'overview' | 'students' | 'courses' | 'system'>(
		'overview'
	)
	// State for dashboard data
	const [isLoading, setIsLoading] = useState(true)
	const [dashboardStats, setDashboardStats] = useState({
		totalUsers: 0,
		totalStudents: 0,
		inactiveStudents: 0,
		totalTeachers: 0,
		totalClasses: 0,
		activeClasses: 0,
		totalSubjects: 0,
		upcomingEvents: 0,
		systemHealth: {
			status: 'Loading...',
			uptime: '0%',
			storageUsed: 0,
		},
	})
	const [activities, setActivities] = useState<any[]>([])
	const [performanceData, setPerformanceData] = useState<any[]>([])
	const [topStudents, setTopStudents] = useState<any[]>([])
	const [recentAssessments, setRecentAssessments] = useState<any[]>([])
	const [attendanceData, setAttendanceData] = useState<any[]>([])

	// Fetch dashboard data
	const fetchDashboardData = async () => {
		setIsLoading(true)
		try {
			// Get dashboard stats
			const stats = await getDashboardStats();
			setDashboardStats(stats);

			// Get recent activities
			const activities = await getRecentActivities(5);
			setActivities(activities);

			// Get performance data
			const performanceData = await getPerformanceData();
			setPerformanceData(performanceData);

			// Get top students
			const topStudents = await getTopStudents(4);
			setTopStudents(topStudents);

			// Get recent assessments
			const recentAssessments = await getRecentAssessments(4);
			setRecentAssessments(recentAssessments);

			// Get attendance data
			const attendanceData = await getAttendanceData();
			setAttendanceData(attendanceData);
		} catch (error) {
			console.error('Error fetching dashboard data:', error)
			// If there's an error, we'll keep the existing data in state
		} finally {
			setIsLoading(false)
		}
	}

	// Helper functions for formatting data
	const formatTimeAgo = (date: Date): string => {
		const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

		let interval = seconds / 31536000
		if (interval > 1) return Math.floor(interval) + ' years ago'

		interval = seconds / 2592000
		if (interval > 1) return Math.floor(interval) + ' months ago'

		interval = seconds / 86400
		if (interval > 1) return Math.floor(interval) + ' days ago'

		interval = seconds / 3600
		if (interval > 1) return Math.floor(interval) + ' hours ago'

		interval = seconds / 60
		if (interval > 1) return Math.floor(interval) + ' minutes ago'

		return Math.floor(seconds) + ' seconds ago'
	}

	const formatDate = (dateStr: string): string => {
		const date = new Date(dateStr)
		return date.toISOString().split('T')[0] // Returns YYYY-MM-DD
	}

	const calculateGrade = (score: number): string => {
		if (score >= 97) return 'A+'
		if (score >= 93) return 'A'
		if (score >= 90) return 'A-'
		if (score >= 87) return 'B+'
		if (score >= 83) return 'B'
		if (score >= 80) return 'B-'
		if (score >= 77) return 'C+'
		if (score >= 73) return 'C'
		if (score >= 70) return 'C-'
		if (score >= 67) return 'D+'
		if (score >= 63) return 'D'
		if (score >= 60) return 'D-'
		return 'F'
	}

	// Load data on component mount
	useEffect(() => {
		fetchDashboardData()
	}, [])

	// Add a console.log for debugging purposes
	useEffect(() => {
		if (!isLoading) {
			console.log('Dashboard stats loaded:', dashboardStats)
		}
	}, [dashboardStats, isLoading])

	// Add a new function to fetch student data
	const fetchStudentData = async () => {
		setIsLoading(true)
		try {
			// Fetch all students from the users table where role is 'student'
			const { data: studentsData, error: studentsError } = await supabase
				.from('users')
				.select('id, status')
				.eq('role', 'Student')

			if (studentsError) {
				console.error('Error fetching students:', studentsError)
				return
			}

			// Calculate student statistics
			const totalStudents = studentsData?.length || 0
			// Count students that have is_active explicitly set to false
			const inactiveStudents =
				studentsData?.filter(student => student.status === 'inactive').length || 0
			// Active students are all students minus inactive ones
			const activeStudents = totalStudents - inactiveStudents

			console.log('Student Data from Supabase:', studentsData)
			console.log('Student Statistics:', {
				total: totalStudents,
				active: activeStudents,
				inactive: inactiveStudents,
			})

			// Update the dashboard stats with the student data
			setDashboardStats(prevStats => ({
				...prevStats,
				totalStudents: totalStudents,
				inactiveStudents: inactiveStudents,
			}))
		} catch (error) {
			console.error('Error in fetchStudentData:', error)
		} finally {
			setIsLoading(false)
		}
	}

	// Call this function when the component mounts
	useEffect(() => {
		fetchStudentData()
	}, [])

	// Define dashboard stats based on the selected view and the fetched data
	const getActiveStats = () => {
		switch (statsView) {
			case 'students':
				return [
					{
						id: 5,
						title: 'Total Students',
						value: dashboardStats.totalStudents,
						change: '+8%',
						icon: <FiUserCheck />,
						color: 'primary',
					},
					{
						id: 6,
						title: 'Inactive Students',
						value: dashboardStats.inactiveStudents,
						change: '-5%',
						icon: <FiUserX />,
						color: 'red',
					},
					{
						id: 7,
						title: 'Avg. Attendance',
						value: '87%',
						change: '+2%',
						icon: <FiCheckCircle />,
						color: 'green',
					},
					{
						id: 8,
						title: 'Top Performers',
						value: topStudents.length,
						change: '+15%',
						icon: <FiStar />,
						color: 'yellow',
					},
				]
			case 'courses':
				return [
					{
						id: 9,
						title: 'Total Classes',
						value: dashboardStats.totalClasses,
						change: '+4%',
						icon: <FiBarChart2 />,
						color: 'primary',
					},
					{
						id: 10,
						title: 'Active Classes',
						value: dashboardStats.activeClasses,
						change: '+12%',
						icon: <FiClipboard />,
						color: 'yellow',
					},
					{
						id: 11,
						title: 'Total Subjects',
						value: dashboardStats.totalSubjects,
						change: '+3%',
						icon: <FiAward />,
						color: 'green',
					},
					{
						id: 12,
						title: 'Teachers',
						value: dashboardStats.totalTeachers,
						change: '+18%',
						icon: <FiClock />,
						color: 'purple',
					},
				]
			case 'system':
				return [
					{
						id: 13,
						title: 'System Health',
						value: dashboardStats.systemHealth.status === 'Healthy' ? '98%' : '50%',
						change: '+1%',
						icon: <FiCpu />,
						color: 'green',
					},
					{
						id: 14,
						title: 'Storage Used',
						value: `${dashboardStats.systemHealth.storageUsed}%`,
						change: '+7%',
						icon: <FiDatabase />,
						color: 'yellow',
					},
					{
						id: 15,
						title: 'Notifications',
						value: 18,
						change: '+5%',
						icon: <FiBell />,
						color: 'primary',
					},
					{
						id: 16,
						title: 'Support Tickets',
						value: 7,
						change: '-2%',
						icon: <FiHelpCircle />,
						color: 'purple',
					},
				]
			default:
				return [
					{
						id: 1,
						title: 'Total Users',
						value: dashboardStats.totalUsers,
						change: '+12%',
						icon: <FiUsers />,
						color: 'primary',
					},
					{
						id: 2,
						title: 'Total Students',
						value: dashboardStats.totalStudents,
						change: '+8%',
						icon: <FiUserCheck />,
						color: 'green',
					},
					{
						id: 3,
						title: 'Teachers',
						value: dashboardStats.totalTeachers,
						change: '+3%',
						icon: <FiBriefcase />,
						color: 'yellow',
					},
					{
						id: 4,
						title: 'Active Classes',
						value: dashboardStats.activeClasses,
						change: '+7%',
						icon: <FiCalendar />,
						color: 'purple',
					},
				]
		}
	}

	const handleRefresh = () => {
		setIsRefreshing(true)
		// Fetch new data
		fetchDashboardData().then(() => {
			setTimeout(() => {
				setIsRefreshing(false)
			}, 500) // Short delay to make the animation visible
		})
	}

	return (
		<DashboardContainer>
			<DashboardHeader>
				<div>
					<PageTitle>Dashboard</PageTitle>
					<WelcomeMessage>Welcome back, Admin User!</WelcomeMessage>
				</div>

				<HeaderControls>
					<TimePeriodSelector>
						<TimePeriodButton
							$isActive={timePeriod === 'today'}
							onClick={() => setTimePeriod('today')}
						>
							Today
						</TimePeriodButton>
						<TimePeriodButton
							$isActive={timePeriod === 'week'}
							onClick={() => setTimePeriod('week')}
						>
							This Week
						</TimePeriodButton>
						<TimePeriodButton
							$isActive={timePeriod === 'month'}
							onClick={() => setTimePeriod('month')}
						>
							This Month
						</TimePeriodButton>
					</TimePeriodSelector>

					<RefreshButton onClick={handleRefresh} disabled={isRefreshing || isLoading}>
						<AnimatePresence mode='wait'>
							{isRefreshing || isLoading ? (
								<motion.div
									key='refreshing'
									initial={{ rotate: 0 }}
									animate={{ rotate: 360 }}
									exit={{ rotate: 0 }}
									transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
								>
									<FiRefreshCw />
								</motion.div>
							) : (
								<motion.div key='refresh'>
									<FiRefreshCw />
								</motion.div>
							)}
						</AnimatePresence>
						<span>{isLoading ? 'Loading...' : 'Refresh'}</span>
					</RefreshButton>
				</HeaderControls>
			</DashboardHeader>

			{/* Stats View Selector */}
			<StatsViewSelector>
				<StatsViewButton
					$isActive={statsView === 'overview'}
					onClick={() => setStatsView('overview')}
				>
					Overview
				</StatsViewButton>
				<StatsViewButton
					$isActive={statsView === 'students'}
					onClick={() => setStatsView('students')}
				>
					Students
				</StatsViewButton>
				<StatsViewButton
					$isActive={statsView === 'courses'}
					onClick={() => setStatsView('courses')}
				>
					Courses
				</StatsViewButton>
				<StatsViewButton $isActive={statsView === 'system'} onClick={() => setStatsView('system')}>
					System
				</StatsViewButton>
			</StatsViewSelector>

			<StatsGrid>
				{getActiveStats().map((stat, index) => (
					<motion.div
						key={stat.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: index * 0.1 }}
					>
						<StatCard
							icon={stat.icon}
							title={stat.title}
							value={stat.value}
							change={stat.change}
							color={stat.color as ColorType}
							isLoading={isLoading}
						/>
					</motion.div>
				))}
			</StatsGrid>

			{/* Student Statistics Highlight - Only show in overview mode */}
			{statsView === 'overview' && (
				<StudentStatsHighlight
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.4 }}
				>
					<SectionHeader>
						<SectionTitle>
							<FiUserCheck style={{ marginRight: '8px' }} />
							Student Statistics
						</SectionTitle>
					</SectionHeader>
					<StudentStatsContent>
						<div className='count-section'>
							<StudentCountCircle>
								<BigNumber>{isLoading ? '-' : dashboardStats.totalStudents}</BigNumber>
								<CountLabel>Total Students</CountLabel>
							</StudentCountCircle>
						</div>
						<div className='details-section'>
							<StatDetail>
								<StatLabel>Active Students</StatLabel>
								<StatValue>
									{isLoading ? '-' : dashboardStats.totalStudents - dashboardStats.inactiveStudents}
									<span className='percentage'>
										(
										{Math.round(
											((dashboardStats.totalStudents - dashboardStats.inactiveStudents) /
												Math.max(dashboardStats.totalStudents, 1)) *
												100
										)}
										%)
									</span>
								</StatValue>
							</StatDetail>
							<StatDetail>
								<StatLabel>Inactive Students</StatLabel>
								<StatValue>
									{isLoading ? '-' : dashboardStats.inactiveStudents}
									<span className='percentage'>
										(
										{Math.round(
											(dashboardStats.inactiveStudents /
												Math.max(dashboardStats.totalStudents, 1)) *
												100
										)}
										%)
									</span>
								</StatValue>
							</StatDetail>
							<StudentProgress>
								<ProgressTitle>Active vs. Inactive</ProgressTitle>
								<ProgressBar>
									<ProgressFill
										$percentage={Math.round(
											((dashboardStats.totalStudents - dashboardStats.inactiveStudents) /
												Math.max(dashboardStats.totalStudents, 1)) *
												100
										)}
									/>
								</ProgressBar>
							</StudentProgress>
						</div>
					</StudentStatsContent>
				</StudentStatsHighlight>
			)}

			<DashboardGrid>
				{/* Recent Activities */}
				<GridItem
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.4 }}
				>
					<SectionHeader>
						<SectionTitle>Recent Activities</SectionTitle>
						<ViewAllButton>
							View All <FiClock />
						</ViewAllButton>
					</SectionHeader>
					<ActivitiesCard>
						{isLoading ? (
							// Loading state
							Array(5)
								.fill(0)
								.map((_, index) => (
									<ActivityItem key={index} as={motion.div}>
										<ActivityDot />
										<ActivityContent>
											<ActivitySkeleton />
										</ActivityContent>
									</ActivityItem>
								))
						) : activities.length === 0 ? (
							// Empty state
							<NoDataMessage>
								<FiInfo size={24} />
								<span>No recent activities found</span>
							</NoDataMessage>
						) : (
							// Activities list
							activities.map((activity, index) => (
								<ActivityItem
									key={activity.id}
									as={motion.div}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
								>
									<ActivityDot />
									<ActivityContent>
										<strong>{activity.user}</strong> {activity.action}
										<ActivityTime>{activity.time}</ActivityTime>
									</ActivityContent>
								</ActivityItem>
							))
						)}
					</ActivitiesCard>
				</GridItem>

				{/* Performance Overview */}
				<GridItem
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.5 }}
				>
					<SectionHeader>
						<SectionTitle>Course Performance</SectionTitle>
						<ViewAllButton>
							View Details <FiBarChart2 />
						</ViewAllButton>
					</SectionHeader>
					<PerformanceCard>
						{isLoading ? (
							// Loading state for performance data
							Array(4)
								.fill(0)
								.map((_, index) => (
									<PerformanceItem key={index}>
										<PerformanceSkeleton />
									</PerformanceItem>
								))
						) : performanceData.length === 0 ? (
							// Empty state
							<NoDataMessage>
								<FiInfo size={24} />
								<span>No performance data available</span>
							</NoDataMessage>
						) : (
							// Performance data
							performanceData.map((item, index) => (
								<PerformanceItem
									key={index}
									as={motion.div}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
								>
									<PerformanceLabel>{item.subject}</PerformanceLabel>
									<PerformanceBarContainer>
										<PerformanceBar
											$percentage={item.completion}
											as={motion.div}
											initial={{ width: 0 }}
											animate={{ width: `${item.completion}%` }}
											transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
										/>
									</PerformanceBarContainer>
									<PerformanceValue>{item.completion}%</PerformanceValue>
								</PerformanceItem>
							))
						)}
					</PerformanceCard>
				</GridItem>

				{/* Top Students */}
				<GridItem
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.6 }}
				>
					<SectionHeader>
						<SectionTitle>Top Performing Students</SectionTitle>
						<ViewAllButton>
							View All <FiStar />
						</ViewAllButton>
					</SectionHeader>
					<TopStudentsCard>
						{isLoading ? (
							// Loading state for top students
							Array(4)
								.fill(0)
								.map((_, index) => (
									<StudentItem key={index}>
										<StudentSkeleton />
									</StudentItem>
								))
						) : topStudents.length === 0 ? (
							// Empty state
							<NoDataMessage>
								<FiInfo size={24} />
								<span>No student data available</span>
							</NoDataMessage>
						) : (
							// Top students list
							topStudents.map((student, index) => (
								<StudentItem
									key={student.id}
									as={motion.div}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
								>
									<StudentInfo>
										<StudentAvatar>{student.name.charAt(0)}</StudentAvatar>
										<StudentDetails>
											<StudentName>{student.name}</StudentName>
											<StudentSubject>{student.subject}</StudentSubject>
										</StudentDetails>
									</StudentInfo>
									<GradeDisplay>
										<Grade $performance={student.performance}>{student.grade}</Grade>
										<PerformanceValue>{student.performance}%</PerformanceValue>
									</GradeDisplay>
								</StudentItem>
							))
						)}
					</TopStudentsCard>
				</GridItem>

				{/* Recent Assessments */}
				<GridItem
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.7 }}
				>
					<SectionHeader>
						<SectionTitle>Recent Assessments</SectionTitle>
						<ViewAllButton>
							View All <FiClipboard />
						</ViewAllButton>
					</SectionHeader>
					<AssessmentsCard>
						{isLoading ? (
							// Loading state for assessments
							<AssessmentTable>
								<AssessmentTableHeader>
									<tr>
										<th>Assessment</th>
										<th>Date</th>
										<th>Participation</th>
										<th>Avg. Score</th>
									</tr>
								</AssessmentTableHeader>
								<tbody>
									{Array(4)
										.fill(0)
										.map((_, index) => (
											<tr key={index}>
												<td colSpan={4}>
													<AssessmentSkeleton />
												</td>
											</tr>
										))}
								</tbody>
							</AssessmentTable>
						) : recentAssessments.length === 0 ? (
							// Empty state
							<NoDataMessage>
								<FiInfo size={24} />
								<span>No recent assessments found</span>
							</NoDataMessage>
						) : (
							// Assessments table
							<AssessmentTable>
								<AssessmentTableHeader>
									<tr>
										<th>Assessment</th>
										<th>Date</th>
										<th>Participation</th>
										<th>Avg. Score</th>
									</tr>
								</AssessmentTableHeader>
								<tbody>
									{recentAssessments.map((assessment, index) => (
										<AssessmentRow
											key={assessment.id}
											as={motion.tr}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
										>
											<td>{assessment.title}</td>
											<td>{assessment.date}</td>
											<td>
												<ParticipationValue>{assessment.participation}</ParticipationValue>
											</td>
											<td>
												<AvgScoreValue>{assessment.avgScore}</AvgScoreValue>
											</td>
										</AssessmentRow>
									))}
								</tbody>
							</AssessmentTable>
						)}
					</AssessmentsCard>
				</GridItem>

				{/* Attendance Chart */}
				<GridItem
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.7 }}
					className='span-2'
				>
					<SectionHeader>
						<SectionTitle>Attendance Overview</SectionTitle>
						<ViewAllButton>
							Full Report <FiBarChart2 />
						</ViewAllButton>
					</SectionHeader>
					<AttendanceChartNew>
						<ChartHeader>
							<ChartTitle>Daily Attendance</ChartTitle>
							<ChartLegend>
								<LegendItem>
									<LegendDot $color='primary' />
									<LegendText>Present</LegendText>
								</LegendItem>
								<LegendItem>
									<LegendDot $color='red' />
									<LegendText>Absent</LegendText>
								</LegendItem>
							</ChartLegend>
						</ChartHeader>
						<ChartContainer>
							{attendanceData.map((item, index) => (
								<AttendanceItem key={index}>
									<Day>{item.day}</Day>
									<AttendanceBarContainerNew>
										<AttendanceBarNew>
											<AttendanceBarFill $percentage={item.attendance} />
										</AttendanceBarNew>
										<AttendanceRate>{item.attendance}%</AttendanceRate>
									</AttendanceBarContainerNew>
								</AttendanceItem>
							))}
						</ChartContainer>
					</AttendanceChartNew>
				</GridItem>
			</DashboardGrid>
		</DashboardContainer>
	)
}

type ColorType = 'primary' | 'green' | 'yellow' | 'purple' | 'red'

const getColorValue = (color: ColorType, theme: DefaultTheme) => {
	switch (color) {
		case 'primary':
			return theme.colors.primary[600]
		case 'green':
			return theme.colors.success[500]
		case 'yellow':
			return theme.colors.warning[500]
		case 'purple':
			return theme.colors.purple[500]
		case 'red':
			return theme.colors.danger[500]
		default:
			return theme.colors.primary[600]
	}
}

const getColorLight = (color: ColorType, theme: DefaultTheme) => {
	switch (color) {
		case 'primary':
			return theme.colors.primary[50]
		case 'green':
			return theme.colors.success[50]
		case 'yellow':
			return theme.colors.warning[50]
		case 'purple':
			return theme.colors.purple[50]
		case 'red':
			return theme.colors.danger[50]
		default:
			return theme.colors.primary[50]
	}
}

const DashboardContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[6]};
	padding: ${props => props.theme.spacing[6]};

	@media (max-width: ${props => props.theme.breakpoints.lg}) {
		padding: ${props => props.theme.spacing[4]};
	}
`

const DashboardHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
		align-items: flex-start;
		gap: ${props => props.theme.spacing[4]};
	}
`

const PageTitle = styled.h1`
	margin: 0;
	margin-bottom: ${props => props.theme.spacing[1]};
	color: ${props => props.theme.colors.text.primary};
	font-size: 1.8rem;
`

const WelcomeMessage = styled.p`
	margin: 0;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 1rem;
`

const HeaderControls = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[3]};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		width: 100%;
		justify-content: space-between;
	}
`

const TimePeriodSelector = styled.div`
	display: flex;
	align-items: center;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.lg};
	overflow: hidden;
`

interface ActiveButtonProps {
	$isActive: boolean
}

const TimePeriodButton = styled.button<ActiveButtonProps>`
	background-color: ${props => (props.$isActive ? props.theme.colors.primary[600] : 'transparent')};
	color: ${props => (props.$isActive ? 'white' : props.theme.colors.text.secondary)};
	border: none;
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[3]}`};
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props =>
			props.$isActive ? props.theme.colors.primary[700] : props.theme.colors.background.lighter};
		color: ${props => (props.$isActive ? 'white' : props.theme.colors.text.primary)};
	}
`

// New styled component for stats view selector
const StatsViewSelector = styled.div`
	display: flex;
	justify-content: center;
	margin-bottom: ${props => props.theme.spacing[4]};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.lg};
	background-color: ${props => props.theme.colors.background.lighter};
	overflow: hidden;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		flex-wrap: wrap;
	}
`

const StatsViewButton = styled.button<ActiveButtonProps>`
	flex: 1;
	background-color: ${props => (props.$isActive ? props.theme.colors.primary[600] : 'transparent')};
	color: ${props => (props.$isActive ? 'white' : props.theme.colors.text.secondary)};
	border: none;
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[3]}`};
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props =>
			props.$isActive ? props.theme.colors.primary[700] : props.theme.colors.background.light};
		color: ${props => (props.$isActive ? 'white' : props.theme.colors.text.primary)};
	}

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		flex-basis: 50%;
	}
`

const RefreshButton = styled.button`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	background-color: ${props => props.theme.colors.background.light};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.lg};
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[3]}`};
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.background.lighter};
		color: ${props => props.theme.colors.text.primary};
	}

	&:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
`

const StatsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: ${props => props.theme.spacing[6]};

	@media (max-width: ${props => props.theme.breakpoints.xl}) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		grid-template-columns: 1fr;
	}
`

interface ColorProps {
	$color: ColorType
}

const DashboardGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: ${props => props.theme.spacing[6]};

	@media (max-width: ${props => props.theme.breakpoints.lg}) {
		grid-template-columns: 1fr;
	}
`

const GridItem = styled.div`
	display: flex;
	flex-direction: column;
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.lg};
	box-shadow: ${props => props.theme.shadows.sm};
	border: 1px solid ${props => props.theme.colors.border.light};
	overflow: hidden;
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		box-shadow: ${props => props.theme.shadows.md};
		transform: translateY(-2px);
	}
`

const SectionHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: ${props => `${props.theme.spacing[4]} ${props.theme.spacing[5]}`};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const SectionTitle = styled.h2`
	margin: 0;
	font-size: 1.1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const ViewAllButton = styled.button`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[1]};
	background: none;
	border: none;
	font-size: 0.9rem;
	color: ${props => props.theme.colors.primary[600]};
	cursor: pointer;
	transition: color ${props => props.theme.transition.fast};

	&:hover {
		color: ${props => props.theme.colors.primary[800]};
	}
`

const LastUpdatedText = styled.span`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
`

const ActivitiesCard = styled.div`
	padding: ${props => props.theme.spacing[4]};
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[4]};
	background-color: ${props => props.theme.colors.background.secondary};
	height: 100%;
`

const ActivityItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: ${props => props.theme.spacing[3]};
`

const ActivityDot = styled.div`
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.primary[500]};
	margin-top: 6px;
`

const ActivityContent = styled.div`
	flex: 1;
	font-size: 0.95rem;
	color: ${props => props.theme.colors.text.primary};
`

const ActivityTime = styled.div`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-top: ${props => props.theme.spacing[1]};
`

const PerformanceCard = styled.div`
	padding: ${props => props.theme.spacing[4]};
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[4]};
	background-color: ${props => props.theme.colors.background.secondary};
	height: 100%;
`

const PerformanceItem = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[4]};
`

const PerformanceLabel = styled.div`
	width: 100px;
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.primary};
`

interface ProgressProps {
	$percentage: number
	small?: boolean
}

const PerformanceBarContainer = styled.div<{ small?: boolean }>`
	flex: 1;
	height: ${props => (props.small ? '8px' : '12px')};
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: ${props => props.theme.borderRadius.full};
	overflow: hidden;
`

const PerformanceBar = styled.div<ProgressProps>`
	height: 100%;
	width: ${props => `${props.$percentage}%`};
	background-color: ${props =>
		props.$percentage > 80
			? props.theme.colors.success[500]
			: props.$percentage > 50
			? props.theme.colors.warning[500]
			: props.theme.colors.danger[500]};
	border-radius: ${props => props.theme.borderRadius.full};
`

const PerformanceValue = styled.div`
	width: 50px;
	text-align: right;
	font-size: 0.9rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const SmallPerformanceValue = styled.div`
	font-size: 0.8rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	margin-left: ${props => props.theme.spacing[2]};
`

// New styled components for top students
const TopStudentsCard = styled.div`
	padding: ${props => props.theme.spacing[4]};
	background-color: ${props => props.theme.colors.background.secondary};
	height: 100%;
`

const StudentsTable = styled.table`
	width: 100%;
	border-collapse: collapse;
`

const StudentTableHeader = styled.th`
	text-align: left;
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[3]}`};
	font-size: 0.85rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.secondary};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const StudentTableCell = styled.td`
	padding: ${props => `${props.theme.spacing[3]} ${props.theme.spacing[3]}`};
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.primary};
	border-bottom: 1px solid ${props => props.theme.colors.border.lighter};
`

const GradeBadge = styled.span<{ $grade: string }>`
	display: inline-block;
	padding: ${props => `${props.theme.spacing[1]} ${props.theme.spacing[2]}`};
	font-size: 0.8rem;
	font-weight: 600;
	border-radius: ${props => props.theme.borderRadius.md};
	background-color: ${props =>
		props.$grade.startsWith('A')
			? props.theme.colors.success[50]
			: props.$grade.startsWith('B')
			? props.theme.colors.primary[50]
			: props.$grade.startsWith('C')
			? props.theme.colors.warning[50]
			: props.theme.colors.danger[50]};
	color: ${props =>
		props.$grade.startsWith('A')
			? props.theme.colors.success[700]
			: props.$grade.startsWith('B')
			? props.theme.colors.primary[700]
			: props.$grade.startsWith('C')
			? props.theme.colors.warning[700]
			: props.theme.colors.danger[700]};
`

// New styled components for assessments
const AssessmentsCard = styled.div`
	padding: ${props => props.theme.spacing[4]};
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[3]};
	background-color: ${props => props.theme.colors.background.secondary};
	height: 100%;
`

const AssessmentItem = styled.div`
	padding: ${props => props.theme.spacing[3]};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	background-color: ${props => props.theme.colors.background.primary};
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: ${props => props.theme.shadows.sm};
	}
`

const AssessmentHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: ${props => props.theme.spacing[2]};
`

const AssessmentTitle = styled.div`
	font-weight: 600;
	font-size: 0.95rem;
	color: ${props => props.theme.colors.text.primary};
`

const AssessmentDate = styled.div`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
`

const AssessmentStats = styled.div`
	display: flex;
	gap: ${props => props.theme.spacing[4]};
`

const AssessmentStat = styled.div`
	flex: 1;
`

const AssessmentStatLabel = styled.div`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: ${props => props.theme.spacing[1]};
`

const AssessmentStatValue = styled.div`
	font-size: 1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

// New styled components for attendance chart
const AttendanceCard = styled.div`
	padding: ${props => props.theme.spacing[4]};
	background-color: ${props => props.theme.colors.background.secondary};
	height: 100%;
`

const AttendanceChartContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	height: 200px;
	margin-bottom: ${props => props.theme.spacing[4]};
`

const AttendanceDisplay = styled.div`
	display: flex;
	align-items: flex-end;
	justify-content: space-around;
	height: 200px;
`

const AttendanceColumn = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 15%;
`

const AttendanceBarGraph = styled.div<ProgressProps>`
	background-color: ${props => props.theme.colors.primary[600]};
	width: 40px;
	height: ${props => `${props.$percentage}%`};
	max-height: 95%;
	border-radius: ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md} 0 0;
	position: relative;
	transition: height 0.5s ease;
`

const AttendancePercentage = styled.div`
	position: absolute;
	top: -25px;
	left: 50%;
	transform: translateX(-50%);
	font-size: 0.75rem;
	color: ${props => props.theme.colors.text.secondary};
	white-space: nowrap;
`

const AttendanceDay = styled.div`
	margin-top: ${props => props.theme.spacing[2]};
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
`

const AttendanceAverage = styled.div`
	text-align: center;
	font-size: 0.95rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	padding-top: ${props => props.theme.spacing[2]};
	border-top: 1px solid ${props => props.theme.colors.border.light};
`

const QuickActionsCard = styled.div`
	padding: ${props => props.theme.spacing[4]};
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: ${props => props.theme.spacing[3]};
	background-color: ${props => props.theme.colors.background.secondary};
	height: 100%;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		grid-template-columns: 1fr;
	}
`

const ActionButton = styled.button<ColorProps>`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[3]};
	background-color: ${props => props.theme.colors.background.primary};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	padding: ${props => props.theme.spacing[3]};
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => getColorLight(props.$color, props.theme)};
		border-color: ${props => getColorValue(props.$color, props.theme)};
		transform: translateY(-2px);
		box-shadow: ${props => props.theme.shadows.sm};
	}
`

const IconWrapper = styled.div<ColorProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: ${props => props.theme.borderRadius.md};
	background-color: ${props => getColorLight(props.$color, props.theme)};
	color: ${props => getColorValue(props.$color, props.theme)};
	font-size: 1.2rem;
`

const StatusCard = styled.div`
	padding: ${props => props.theme.spacing[4]};
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: ${props => props.theme.spacing[4]};
	background-color: ${props => props.theme.colors.background.secondary};
	height: 100%;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		grid-template-columns: 1fr;
	}
`

const StatusItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[2]};
`

const StatusLabel = styled.div`
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};
`

const StatusValue = styled.div`
	font-size: 0.95rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const StatusProgressWrapper = styled.div`
	height: 6px;
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: ${props => props.theme.borderRadius.full};
	overflow: hidden;
	margin: ${props => props.theme.spacing[1]} 0;
`

const StatusProgress = styled.div<{ $percentage: number }>`
	height: 100%;
	width: ${props => `${props.$percentage}%`};
	background-color: ${props =>
		props.$percentage > 80
			? props.theme.colors.danger[500]
			: props.$percentage > 60
			? props.theme.colors.warning[500]
			: props.theme.colors.success[500]};
`

const StatusBadge = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	font-size: 0.9rem;
	font-weight: 500;
	color: ${props => props.theme.colors.success[700]};
`

interface StatusDotProps {
	$active: boolean
}

const StatusDot = styled.div<StatusDotProps>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: ${props =>
		props.$active ? props.theme.colors.success[500] : props.theme.colors.danger[500]};
`

// New components for notifications
const NotificationsCard = styled.div`
	padding: ${props => props.theme.spacing[4]};
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[3]};
	background-color: ${props => props.theme.colors.background.secondary};
	height: 100%;
`

const NotificationItem = styled.div<{ $type: 'info' | 'success' | 'warning' | 'error' }>`
	display: flex;
	gap: ${props => props.theme.spacing[3]};
	padding: ${props => props.theme.spacing[3]};
	border-radius: ${props => props.theme.borderRadius.md};
	background-color: ${props => props.theme.colors.background.primary};
	border: 1px solid
		${props =>
			props.$type === 'success'
				? props.theme.colors.success[400]
				: props.$type === 'warning'
				? props.theme.colors.warning[400]
				: props.$type === 'error'
				? props.theme.colors.danger[400]
				: props.theme.colors.primary[400]};
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: ${props => props.theme.shadows.sm};
	}
`

const NotificationIcon = styled.div<{ $type: 'info' | 'success' | 'warning' | 'error' }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background-color: ${props =>
		props.$type === 'success'
			? props.theme.colors.success[500]
			: props.$type === 'warning'
			? props.theme.colors.warning[500]
			: props.$type === 'error'
			? props.theme.colors.danger[500]
			: props.theme.colors.primary[500]};
	color: white;
	font-size: 1rem;
	flex-shrink: 0;
`

const NotificationContent = styled.div`
	flex: 1;
`

const NotificationMessage = styled.div`
	font-size: 0.95rem;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: ${props => props.theme.spacing[1]};
`

const NotificationTime = styled.div`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
`

// Icon components
const UserIcon = () => <FiUsers />

const ClassIcon = () => <FiBriefcase />

const SubjectIcon = () => <FiBook />

const EventIcon = () => <FiCalendar />

// Loading skeleton components
const Skeleton = styled.div`
	background-color: ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	animation: ${keyframes`
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  `} 1.5s ease-in-out infinite;
`

const ActivitySkeleton = styled(Skeleton)`
	height: 40px;
	width: 100%;
`

const PerformanceSkeleton = styled(Skeleton)`
	height: 24px;
	width: 100%;
`

const StudentSkeleton = styled(Skeleton)`
	height: 60px;
	width: 100%;
`

const AssessmentSkeleton = styled(Skeleton)`
	height: 20px;
	width: 100%;
`

const AttendanceChartSkeleton = styled.div`
	display: flex;
	align-items: flex-end;
	justify-content: space-around;
	height: 200px;
	width: 100%;
`

const AttendanceChartSkeletonBar = styled(Skeleton)`
	width: 40px;
	height: 150px;
	margin: 0 10px;
	border-radius: ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md} 0 0;
`

// Empty state component
const NoDataMessage = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: ${props => props.theme.spacing[6]};
	color: ${props => props.theme.colors.text.secondary};
	text-align: center;
	height: 100%;
	min-height: 100px;

	svg {
		margin-bottom: ${props => props.theme.spacing[2]};
		opacity: 0.5;
	}
`

// Student components
const StudentItem = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${props => props.theme.spacing[3]};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};

	&:last-child {
		border-bottom: none;
	}
`

const StudentInfo = styled.div`
	display: flex;
	align-items: center;
`

const StudentAvatar = styled.div`
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: bold;
	margin-right: ${props => props.theme.spacing[3]};
`

const StudentDetails = styled.div`
	display: flex;
	flex-direction: column;
`

const StudentName = styled.div`
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: ${props => props.theme.spacing[1]};
`

const StudentSubject = styled.div`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
`

const GradeDisplay = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
`

const Grade = styled.div<{ $performance: number }>`
	font-weight: bold;
	color: ${props => {
		if (props.$performance >= 90) return props.theme.colors.success[500]
		if (props.$performance >= 80) return props.theme.colors.success[700]
		if (props.$performance >= 70) return props.theme.colors.warning[500]
		return props.theme.colors.danger[500]
	}};
	margin-bottom: ${props => props.theme.spacing[1]};
`

// Assessment components
const AssessmentTable = styled.table`
	width: 100%;
	border-collapse: collapse;
`

const AssessmentTableHeader = styled.thead`
	th {
		text-align: left;
		padding: ${props => props.theme.spacing[3]};
		border-bottom: 2px solid ${props => props.theme.colors.border.light};
		color: ${props => props.theme.colors.text.secondary};
		font-weight: 600;
		font-size: 0.9rem;
	}
`

const AssessmentRow = styled.tr`
	td {
		padding: ${props => props.theme.spacing[3]};
		border-bottom: 1px solid ${props => props.theme.colors.border.light};
		color: ${props => props.theme.colors.text.primary};
	}

	&:last-child td {
		border-bottom: none;
	}
`

const ParticipationValue = styled.div`
	color: ${props => props.theme.colors.primary[600]};
	font-weight: 500;
`

const AvgScoreValue = styled.div`
	color: ${props => props.theme.colors.success[500]};
	font-weight: 500;
`

const StudentStatsHighlight = styled.div`
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.lg};
	box-shadow: ${props => props.theme.shadows.md};
	margin-bottom: ${props => props.theme.spacing[6]};
	overflow: hidden;
`

const StudentStatsContent = styled.div`
	display: flex;
	padding: ${props => props.theme.spacing[6]};

	.count-section {
		flex: 0 0 30%;
		display: flex;
		align-items: center;
		justify-content: center;
		border-right: 1px solid ${props => props.theme.colors.border.light};
	}

	.details-section {
		flex: 0 0 70%;
		padding-left: ${props => props.theme.spacing[6]};
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;

		.count-section {
			border-right: none;
			border-bottom: 1px solid ${props => props.theme.colors.border.light};
			padding-bottom: ${props => props.theme.spacing[4]};
			margin-bottom: ${props => props.theme.spacing[4]};
		}

		.details-section {
			padding-left: 0;
		}
	}
`

const StudentCountCircle = styled.div`
	width: 160px;
	height: 160px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.primary[50]};
	border: 4px solid ${props => props.theme.colors.primary[500]};
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		width: 120px;
		height: 120px;
	}
`

const BigNumber = styled.div`
	font-size: 3rem;
	font-weight: 700;
	color: ${props => props.theme.colors.primary[600]};
	line-height: 1;
	margin-bottom: ${props => props.theme.spacing[1]};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		font-size: 2.5rem;
	}
`

const CountLabel = styled.div`
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.secondary};
	text-align: center;
`

const StatDetail = styled.div`
	margin-bottom: ${props => props.theme.spacing[4]};
`

const StatLabel = styled.div`
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: ${props => props.theme.spacing[1]};
`

const StatValue = styled.div`
	font-size: 1.4rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};

	.percentage {
		font-size: 0.9rem;
		color: ${props => props.theme.colors.text.secondary};
		margin-left: ${props => props.theme.spacing[2]};
	}
`

const StudentProgress = styled.div`
	margin-top: ${props => props.theme.spacing[3]};
`

const ProgressTitle = styled.div`
	font-size: 0.9rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: ${props => props.theme.spacing[2]};
`

const ProgressBar = styled.div`
	height: 12px;
	background-color: ${props => props.theme.colors.background.lighter};
	border-radius: ${props => props.theme.borderRadius.full};
	overflow: hidden;
`

const ProgressFill = styled.div<ProgressProps>`
	height: 100%;
	width: ${props => `${props.$percentage}%`};
	background: linear-gradient(
		to right,
		${props => props.theme.colors.primary[400]},
		${props => props.theme.colors.primary[600]}
	);
	border-radius: inherit;
`

// Add these styled components for the attendance chart
const ChartHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: ${props => props.theme.spacing[4]};
	padding: 0 ${props => props.theme.spacing[4]};
`

const ChartTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
`

const ChartLegend = styled.div`
	display: flex;
	gap: 1rem;
`

const LegendItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`

const LegendDot = styled.div<ColorProps>`
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background-color: ${props => getColorValue(props.$color, props.theme)};
`

const LegendText = styled.span`
	font-size: 0.75rem;
	color: ${props => props.theme.colors.text.secondary};
`

const ChartContainer = styled.div`
	padding: ${props => props.theme.spacing[4]};
`

const AttendanceItem = styled.div`
	display: flex;
	align-items: center;
	margin-bottom: ${props => props.theme.spacing[3]};

	&:last-child {
		margin-bottom: 0;
	}
`

const Day = styled.div`
	width: 80px;
	font-size: 0.875rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const AttendanceChartNew = styled.div`
	padding: ${props => props.theme.spacing[3]};
`

const AttendanceBarContainerNew = styled.div`
	flex: 1;
	display: flex;
	align-items: center;
	gap: 1rem;
`

const AttendanceBarNew = styled.div`
	flex: 1;
	height: 10px;
	background-color: ${props => props.theme.colors.background.tertiary};
	border-radius: ${props => props.theme.borderRadius.full};
	overflow: hidden;
	position: relative;
`

const AttendanceBarFill = styled.div<ProgressProps>`
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	width: ${props => props.$percentage}%;
	background-color: ${props => getColorValue('primary', props.theme)};
	border-radius: ${props => props.theme.borderRadius.full};
`

const AttendanceRate = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	width: 50px;
	text-align: right;
`

export default Dashboard
