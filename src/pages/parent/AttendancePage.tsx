import React, { useEffect, useState } from 'react'
import { FiCalendar, FiCheck, FiChevronDown, FiChevronRight, FiClock, FiX } from 'react-icons/fi'
import { PieChart } from 'react-minimal-pie-chart'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { PageTitle } from '../../components/common'
import { Container } from '../../components/ui'
import { supabase } from '../../services/supabaseClient'
import {
	useParentAttendance,
	useParentChildren,
	useParentStudentStore,
} from '../../store/parentStudentStore'
import { AttendanceResponse } from '../../types/parent'

type AttendanceRecord = {
	id: number
	childName: string
	date: string
	status: 'present' | 'absent' | 'late' | 'excused'
	subject?: string
	time?: string
	notes?: string
}

type ChildFilter = number | 'all'
type StatusFilter = 'all' | 'present' | 'absent' | 'late' | 'excused'
type MonthFilter = number | 'all' // 0-11 for Jan-Dec

// Add the missing interface
interface AttendanceStatusBadgeProps {
	$status: AttendanceRecord['status']
}

// Define the data entry type for pie chart
interface PieChartData {
	title: string
	value: number
	color: string
	percentage: number
}

const AttendancePage: React.FC = () => {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const studentParam = searchParams.get('student')

	const { fetchChildren, fetchAttendance, loading, error } = useParentStudentStore()
	const children = useParentChildren()
	const attendance = useParentAttendance()

	const [selectedStudent, setSelectedStudent] = useState<string>(studentParam || 'all')
	const [hoverSegment, setHoverSegment] = useState<{ childId: string; index: number } | null>(null)
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
	const [expandedDetails, setExpandedDetails] = useState<string[]>([])

	useEffect(() => {
		const loadParentData = async () => {
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
		}

		loadParentData()
	}, [fetchChildren, navigate])

	// Listen for changes in the URL query parameters
	useEffect(() => {
		if (studentParam && children.length > 0) {
			// Check if the student ID exists in the children list
			const childExists = children.some(child => child.id === studentParam)
			setSelectedStudent(childExists ? studentParam : 'all')
		}
	}, [studentParam, children])

	useEffect(() => {
		// When children are loaded, fetch attendance for all of them
		if (children.length > 0) {
			const childrenIds = children.map(child => child.id)
			fetchAttendance(childrenIds)
		}
	}, [children, fetchAttendance])

	const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value
		setSelectedStudent(value)

		// Reset hover state and expanded details when changing selection
		setHoverSegment(null)
		setExpandedDetails([])

		// Update the URL with the selected student
		if (value === 'all') {
			navigate('/parent/attendance')
		} else {
			navigate(`/parent/attendance?student=${value}`)
		}
	}

	const handleMouseMove = (e: React.MouseEvent) => {
		setMousePosition({ x: e.clientX, y: e.clientY })
	}

	const toggleDetailExpand = (childId: string) => {
		if (expandedDetails.includes(childId)) {
			setExpandedDetails(expandedDetails.filter(id => id !== childId))
		} else {
			setExpandedDetails([...expandedDetails, childId])
		}
	}

	// Get color for attendance status
	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case 'present':
				return 'success'
			case 'late':
				return 'warning'
			case 'excused':
				return 'primary'
			case 'absent':
				return 'danger'
			default:
				return 'secondary'
		}
	}

	// Format date for display
	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}

	// Get student's attendance data
	const getChildAttendance = (childId: string) => {
		return attendance.filter(record => record.student_id === childId)
	}

	// Get visible children based on selection
	const visibleChildren =
		selectedStudent === 'all' ? children : children.filter(child => child.id === selectedStudent)

	// Calculate attendance statistics for pie chart for a specific child
	const calculateAttendanceStats = (childId: string) => {
		const childAttendance = getChildAttendance(childId)

		const stats = {
			present: 0,
			late: 0,
			excused: 0,
			absent: 0,
		}

		childAttendance.forEach(record => {
			const status = record.status.toLowerCase()
			if (status === 'present') stats.present++
			else if (status === 'late') stats.late++
			else if (status === 'excused') stats.excused++
			else if (status === 'absent') stats.absent++
		})

		const total = childAttendance.length

		return {
			counts: stats,
			total,
			pieData: [
				{
					title: 'Present',
					value: stats.present,
					color: '#22c55e', // success.500
					percentage: total > 0 ? Math.round((stats.present / total) * 100) : 0,
				},
				{
					title: 'Late',
					value: stats.late,
					color: '#f59e0b', // warning.500
					percentage: total > 0 ? Math.round((stats.late / total) * 100) : 0,
				},
				{
					title: 'Excused',
					value: stats.excused,
					color: '#3b82f6', // primary.500
					percentage: total > 0 ? Math.round((stats.excused / total) * 100) : 0,
				},
				{
					title: 'Absent',
					value: stats.absent,
					color: '#ef4444', // danger.500
					percentage: total > 0 ? Math.round((stats.absent / total) * 100) : 0,
				},
			].filter(item => item.value > 0), // Only include statuses that have values
		}
	}

	return (
		<Container>
			<PageHeader>
				<TitleSection>
					<PageTitle>My Children's Attendance</PageTitle>
					<SubTitle>Monitor your children's class attendance records</SubTitle>
				</TitleSection>

				<StudentSelectorWrapper>
					<SelectLabel>Select Child:</SelectLabel>
					<StudentSelector
						value={selectedStudent}
						onChange={handleStudentChange}
						disabled={loading || children.length === 0}
					>
						<option value='all'>All Children</option>
						{children.length === 0 && <option value=''>No students available</option>}
						{children.map(child => (
							<option key={child.id} value={child.id}>
								{child.firstName} {child.lastName}
							</option>
						))}
					</StudentSelector>
				</StudentSelectorWrapper>
			</PageHeader>

			{error && <ErrorMessage>Error loading data: {error}</ErrorMessage>}

			{loading ? (
				<LoadingState>Loading attendance records...</LoadingState>
			) : attendance.length === 0 ? (
				<EmptyState>
					<EmptyStateTitle>No attendance records available</EmptyStateTitle>
					<EmptyStateText>There are no attendance records for your children yet.</EmptyStateText>
				</EmptyState>
			) : (
				<>
					{visibleChildren.map(child => {
						const childAttendance = getChildAttendance(child.id)
						const attendanceStats = calculateAttendanceStats(child.id)
						const isDetailExpanded = expandedDetails.includes(child.id)

						if (childAttendance.length === 0) {
							return (
								<ChildAttendanceSection key={child.id}>
									<ChildName>
										{child.firstName} {child.lastName}
									</ChildName>
									<EmptyState>
										<EmptyStateTitle>No attendance records available</EmptyStateTitle>
										<EmptyStateText>
											There are no attendance records for this child yet.
										</EmptyStateText>
									</EmptyState>
								</ChildAttendanceSection>
							)
						}

						return (
							<ChildAttendanceSection key={child.id}>
								<ChildName>
									{child.firstName} {child.lastName}
								</ChildName>
								<AttendanceContainer>
									{/* Attendance Summary with Pie Chart */}
									<SummarySection>
										<SummaryTitle>Attendance Summary</SummaryTitle>

										<SummaryContent>
											<ChartContainer onMouseMove={handleMouseMove}>
												{attendanceStats.pieData.length > 0 ? (
													<>
														<PieChart
															data={attendanceStats.pieData}
															lineWidth={60}
															paddingAngle={2}
															rounded
															animate
															animationDuration={500}
															label={({ dataEntry }) => `${Math.round(dataEntry.percentage)}%`}
															labelStyle={{
																fontSize: '6px',
																fontFamily: 'sans-serif',
																fill: '#fff',
															}}
															labelPosition={75}
															onMouseOver={(_, index) => {
																setHoverSegment({ childId: child.id, index })
															}}
															onMouseOut={() => {
																setHoverSegment(null)
															}}
														/>
														{hoverSegment?.childId === child.id &&
															hoverSegment.index !== null &&
															attendanceStats.pieData[hoverSegment.index] && (
																<SimpleTooltip
																	style={{
																		top: mousePosition.y,
																		left: mousePosition.x,
																	}}
																>
																	{attendanceStats.pieData[hoverSegment.index].title}:{' '}
																	{attendanceStats.pieData[hoverSegment.index].value}{' '}
																	{attendanceStats.pieData[hoverSegment.index].value === 1
																		? 'day'
																		: 'days'}{' '}
																	({attendanceStats.pieData[hoverSegment.index].percentage}%)
																</SimpleTooltip>
															)}
													</>
												) : (
													<NoDataMessage>No attendance data to display</NoDataMessage>
												)}
											</ChartContainer>

											<StatsList>
												<StatsItem $color='#22c55e'>
													<StatsIcon>
														<FiCheck />
													</StatsIcon>
													<StatsContent>
														<StatsValue>{attendanceStats.counts.present}</StatsValue>
														<StatsLabel>Present</StatsLabel>
														<StatsPercentage>
															{attendanceStats.total > 0
																? Math.round(
																		(attendanceStats.counts.present / attendanceStats.total) * 100
																  )
																: 0}
															%
														</StatsPercentage>
													</StatsContent>
												</StatsItem>

												<StatsItem $color='#f59e0b'>
													<StatsIcon>
														<FiClock />
													</StatsIcon>
													<StatsContent>
														<StatsValue>{attendanceStats.counts.late}</StatsValue>
														<StatsLabel>Late</StatsLabel>
														<StatsPercentage>
															{attendanceStats.total > 0
																? Math.round(
																		(attendanceStats.counts.late / attendanceStats.total) * 100
																  )
																: 0}
															%
														</StatsPercentage>
													</StatsContent>
												</StatsItem>

												<StatsItem $color='#3b82f6'>
													<StatsIcon>
														<FiCalendar />
													</StatsIcon>
													<StatsContent>
														<StatsValue>{attendanceStats.counts.excused}</StatsValue>
														<StatsLabel>Excused</StatsLabel>
														<StatsPercentage>
															{attendanceStats.total > 0
																? Math.round(
																		(attendanceStats.counts.excused / attendanceStats.total) * 100
																  )
																: 0}
															%
														</StatsPercentage>
													</StatsContent>
												</StatsItem>

												<StatsItem $color='#ef4444'>
													<StatsIcon>
														<FiX />
													</StatsIcon>
													<StatsContent>
														<StatsValue>{attendanceStats.counts.absent}</StatsValue>
														<StatsLabel>Absent</StatsLabel>
														<StatsPercentage>
															{attendanceStats.total > 0
																? Math.round(
																		(attendanceStats.counts.absent / attendanceStats.total) * 100
																  )
																: 0}
															%
														</StatsPercentage>
													</StatsContent>
												</StatsItem>
											</StatsList>
										</SummaryContent>
									</SummarySection>

									{/* Detailed Attendance Records */}
									<DetailedSection>
										<DetailsHeader onClick={() => toggleDetailExpand(child.id)}>
											<DetailsHeaderTitle>
												{isDetailExpanded ? <FiChevronDown /> : <FiChevronRight />}
												Detailed Attendance Records
											</DetailsHeaderTitle>
											<DetailsHeaderInfo>
												{childAttendance.length}{' '}
												{childAttendance.length === 1 ? 'record' : 'records'}
											</DetailsHeaderInfo>
										</DetailsHeader>

										{isDetailExpanded && (
											<AttendanceTable>
												<TableHeader>
													<HeaderCell>Date</HeaderCell>
													<HeaderCell>Subject</HeaderCell>
													<HeaderCell>Lesson</HeaderCell>
													<HeaderCell>Status</HeaderCell>
												</TableHeader>

												<TableBody>
													{childAttendance.map((record: AttendanceResponse) => (
														<TableRow key={record.id}>
															<DataCell>{formatDate(record.noted_at)}</DataCell>
															<DataCell>{record.lessons.subjects.subjectname}</DataCell>
															<DataCell>{record.lessons.lessonname}</DataCell>
															<StatusCell $status={getStatusColor(record.status)}>
																{record.status.charAt(0).toUpperCase() + record.status.slice(1)}
															</StatusCell>
														</TableRow>
													))}
												</TableBody>
											</AttendanceTable>
										)}
									</DetailedSection>
								</AttendanceContainer>
							</ChildAttendanceSection>
						)
					})}
				</>
			)}
		</Container>
	)
}

// Styled Components
const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: ${props => props.theme.spacing[6]};
	flex-wrap: wrap;
	gap: ${props => props.theme.spacing[4]};

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: stretch;
	}
`

const TitleSection = styled.div``

const SubTitle = styled.p`
	color: ${props => props.theme.colors.text.secondary};
	margin-top: ${props => props.theme.spacing[1]};
	font-size: 1rem;
`

const StudentSelectorWrapper = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 250px;
`

const SelectLabel = styled.label`
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: ${props => props.theme.spacing[2]};
	font-weight: 500;
`

const StudentSelector = styled.select`
	padding: ${props => props.theme.spacing[3]};
	border-radius: ${props => props.theme.borderRadius.md};
	border: 2px solid ${props => props.theme.colors.border.light};
	background-color: ${props => props.theme.colors.background.secondary};
	font-size: 1rem;
	color: ${props => props.theme.colors.text.primary};
	width: 100%;
	max-width: 300px;
	height: 48px;
`

const ErrorMessage = styled.div`
	padding: ${props => props.theme.spacing[4]};
	background-color: ${props => props.theme.colors.danger[50]};
	border: 1px solid ${props => props.theme.colors.danger[200]};
	border-radius: ${props => props.theme.borderRadius.md};
	color: ${props => props.theme.colors.danger[700]};
	margin-bottom: ${props => props.theme.spacing[4]};
	font-size: 1rem;
`

const ChildAttendanceSection = styled.div`
	margin-bottom: ${props => props.theme.spacing[8]};
`

const ChildName = styled.h2`
	font-size: 1.5rem;
	font-weight: 600;
	margin-bottom: ${props => props.theme.spacing[4]};
	color: ${props => props.theme.colors.text.primary};
	padding-bottom: ${props => props.theme.spacing[2]};
	border-bottom: 2px solid ${props => props.theme.colors.primary[500]};
`

const AttendanceContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[6]};
`

const SummarySection = styled.div`
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.lg};
	padding: ${props => props.theme.spacing[6]};
	box-shadow: ${props => props.theme.shadows.sm};
`

const SummaryTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	margin-bottom: ${props => props.theme.spacing[4]};
	color: ${props => props.theme.colors.text.primary};
`

const SummaryContent = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: ${props => props.theme.spacing[6]};

	@media (max-width: 768px) {
		flex-direction: column;
	}
`

const ChartContainer = styled.div`
	flex: 0 0 220px;
	height: 220px;
	position: relative;

	@media (max-width: 768px) {
		margin: 0 auto;
	}
`

const SimpleTooltip = styled.div`
	position: fixed;
	transform: translate(10px, -50%);
	background-color: ${props => props.theme.colors.background.secondary};
	box-shadow: ${props => props.theme.shadows.md};
	border-radius: ${props => props.theme.borderRadius.sm};
	padding: ${props => props.theme.spacing[2]};
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.primary};
	pointer-events: none;
	z-index: 1000;
	white-space: nowrap;
`

const StatsList = styled.div`
	flex: 1;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
	gap: ${props => props.theme.spacing[4]};
`

const StatsItem = styled.div<{ $color: string }>`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[3]};
	padding: ${props => props.theme.spacing[3]};
	border-radius: ${props => props.theme.borderRadius.md};
	background-color: ${props => props.theme.colors.background.lighter};
	border-left: 4px solid ${props => props.$color};
`

const StatsIcon = styled.div`
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.background.tertiary};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.25rem;
	color: ${props => props.theme.colors.text.secondary};
`

const StatsContent = styled.div`
	flex: 1;
`

const StatsValue = styled.div`
	font-size: 1.5rem;
	font-weight: 700;
	color: ${props => props.theme.colors.text.primary};
`

const StatsLabel = styled.div`
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.secondary};
`

const StatsPercentage = styled.div`
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.tertiary};
`

const DetailedSection = styled.div`
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.lg};
	padding: 0;
	box-shadow: ${props => props.theme.shadows.sm};
	overflow: hidden;
`

const DetailsHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: ${props => props.theme.spacing[4]};
	background-color: ${props => props.theme.colors.background.tertiary};
	cursor: pointer;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}
`

const DetailsHeaderTitle = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	font-size: 1.1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const DetailsHeaderInfo = styled.div`
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.secondary};
`

const AttendanceTable = styled.div`
	width: 100%;
	border-top: 1px solid ${props => props.theme.colors.border.light};
`

const TableHeader = styled.div`
	display: grid;
	grid-template-columns: 1.5fr 1fr 1fr 1fr;
	background-color: ${props => props.theme.colors.background.tertiary};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const HeaderCell = styled.div`
	padding: ${props => props.theme.spacing[3]};
	font-weight: 600;
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
`

const TableBody = styled.div`
	max-height: 400px;
	overflow-y: auto;
`

const TableRow = styled.div`
	display: grid;
	grid-template-columns: 1.5fr 1fr 1fr 1fr;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};

	&:nth-child(even) {
		background-color: ${props => props.theme.colors.background.lighter};
	}

	&:last-child {
		border-bottom: none;
	}
`

const DataCell = styled.div`
	padding: ${props => props.theme.spacing[3]};
	font-size: 1rem;
	color: ${props => props.theme.colors.text.primary};
`

const StatusCell = styled(DataCell)<{
	$status: 'success' | 'warning' | 'danger' | 'primary' | 'secondary'
}>`
	font-weight: 600;
	color: ${props => {
		switch (props.$status) {
			case 'success':
				return props.theme.colors.success[600]
			case 'warning':
				return props.theme.colors.warning[600]
			case 'danger':
				return props.theme.colors.danger[600]
			case 'primary':
				return props.theme.colors.primary[600]
			default:
				return props.theme.colors.text.secondary
		}
	}};
`

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: ${props => props.theme.spacing[6]};
	text-align: center;
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.lg};
`

const EmptyStateTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: ${props => props.theme.spacing[2]};
`

const EmptyStateText = styled.p`
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
	max-width: 400px;
	margin-bottom: ${props => props.theme.spacing[3]};
`

const LoadingState = styled.div`
	padding: ${props => props.theme.spacing[8]};
	text-align: center;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 1rem;
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.lg};
`

const NoDataMessage = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
`

export default AttendancePage
