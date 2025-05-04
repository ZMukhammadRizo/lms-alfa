import React, { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import {
	FiUsers,
	FiBook,
	FiBriefcase,
	FiCalendar,
	FiAward,
	FiClock,
	FiBarChart2,
	FiCheckCircle,
	FiClipboard,
	FiStar,
	FiUserCheck,
	FiUserX,
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

// Re-add necessary interfaces that were removed with unused styled components
interface ActiveButtonProps {
	$isActive: boolean
}
interface ProgressProps {
	$percentage: number
	small?: boolean
}

const Dashboard: React.FC = () => {
	// State for refresh animation
	// const [isRefreshing, setIsRefreshing] = useState(false)
	// State for selected statistics view
	const [statsView, setStatsView] = useState<'overview' | 'students' | 'courses'>(
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
	// const [activities, setActivities] = useState<any[]>([])
	// const [performanceData, setPerformanceData] = useState<any[]>([])
	const [topStudents, setTopStudents] = useState<any[]>([])
	// const [recentAssessments, setRecentAssessments] = useState<any[]>([])
	const [attendanceData, setAttendanceData] = useState<any[]>([])

	// Fetch dashboard data
	const fetchDashboardData = async () => {
		setIsLoading(true)
		try {
			// Get dashboard stats
			const stats = await getDashboardStats();
			setDashboardStats(stats);

			// Get recent activities
			// const activities = await getRecentActivities(5); // State removed
			// setActivities(activities); // State removed

			// Get performance data
			// const performanceData = await getPerformanceData(); // State removed
			// setPerformanceData(performanceData); // State removed

			// Get top students
			const topStudents = await getTopStudents(4);
			setTopStudents(topStudents);

			// Get recent assessments
			const recentAssessments = await getRecentAssessments(4);
			// setRecentAssessments(recentAssessments);

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

	return (
		<DashboardContainer>
			<DashboardHeader>
				<div>
					<PageTitle>Dashboard</PageTitle>
					<WelcomeMessage>Welcome back, Admin User!</WelcomeMessage>
				</div>
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
							importantTextColor={stat.color as ColorType}
							isLoading={isLoading}
						/>
					</motion.div>
				))}
			</StatsGrid>

			{/* Student Statistics Highlight */}
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
