import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, Info } from 'react-feather'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTitle } from '../../components/common'
import supabase from '../../config/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

// Define attendance status type
type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent' | null

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

const DailyAttendance: React.FC = () => {
	const { t } = useTranslation()
	const { user } = useAuth()
	const [attendanceData, setAttendanceData] = useState<DailyAttendance[]>([])
	const [loading, setLoading] = useState(true)
	const [currentMonth, setCurrentMonth] = useState(new Date())

	useEffect(() => {
		if (user) {
			fetchAttendanceData()
		}
	}, [user, currentMonth])

	const fetchAttendanceData = async () => {
		if (!user) return

		setLoading(true)
		try {
			const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
			const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

			const { data, error } = await supabase
				.from('daily_attendance')
				.select('*')
				.eq('student_id', user.id)
				.gte('noted_for', startOfMonth.toISOString().split('T')[0])
				.lte('noted_for', endOfMonth.toISOString().split('T')[0])

			if (error) throw error
			setAttendanceData(data || [])
		} catch (error) {
			console.error('Error fetching attendance data:', error)
		} finally {
			setLoading(false)
		}
	}

	const handlePreviousMonth = () => {
		setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
	}

	const handleNextMonth = () => {
		setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
	}

	const getDaysInMonth = (year: number, month: number) => {
		return new Date(year, month + 1, 0).getDate()
	}

	const getFirstDayOfMonth = (year: number, month: number) => {
		const firstDay = new Date(year, month, 1).getDay()
		return firstDay === 0 ? 6 : firstDay - 1
	}

	const formatDateString = (day: number): string => {
		const year = currentMonth.getFullYear()
		const month = currentMonth.getMonth()
		return new Date(year, month, day).toISOString().split('T')[0]
	}

	const isWeekend = (day: number): boolean => {
		const dayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay()
		return dayOfWeek === 0 || dayOfWeek === 6
	}

	const isToday = (day: number): boolean => {
		const today = new Date()
		return (
			day === today.getDate() &&
			currentMonth.getMonth() === today.getMonth() &&
			currentMonth.getFullYear() === today.getFullYear()
		)
	}

	const getAttendanceStatus = (day: number): AttendanceStatus => {
		const dateString = formatDateString(day)
		const record = attendanceData.find(record => record.noted_for === dateString)
		return record ? (record.status.toLowerCase() as AttendanceStatus) : null
	}

	const calculateMonthlyStats = () => {
		const totalDays = attendanceData.length
		const presentDays = attendanceData.filter(record => record.status === 'present').length
		const lateDays = attendanceData.filter(record => record.status === 'late').length
		const excusedDays = attendanceData.filter(record => record.status === 'excused').length
		const absentDays = attendanceData.filter(record => record.status === 'absent').length
		
		const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0

		return { totalDays, presentDays, lateDays, excusedDays, absentDays, attendanceRate }
	}

	const renderCalendarDays = () => {
		const year = currentMonth.getFullYear()
		const month = currentMonth.getMonth()
		const daysInMonth = getDaysInMonth(year, month)
		const firstDayOfMonth = getFirstDayOfMonth(year, month)

		const days = []

		// Add empty cells for days before the first day of the month
		for (let i = 0; i < firstDayOfMonth; i++) {
			days.push(<EmptyDay key={`empty-${i}`} />)
		}

		// Add cells for each day of the month
		for (let day = 1; day <= daysInMonth; day++) {
			const status = getAttendanceStatus(day)
			const isWeekendDay = isWeekend(day)
			const isTodayDay = isToday(day)

			days.push(
				<Day
					key={day}
					as={motion.div}
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.2, delay: day * 0.01 }}
					status={status}
					isToday={isTodayDay}
					isActive={false}
					isDisabled={false}
					isWeekend={isWeekendDay}
					whileHover={{ scale: 1.05, y: -2 }}
					whileTap={{ scale: 0.95 }}
				>
					<DayNumber status={status} isDisabled={false}>
						{day}
					</DayNumber>
					{status && <StatusIndicator status={status} />}
				</Day>
			)
		}

		return days
	}

	const stats = calculateMonthlyStats()

	return (
		<Container>
			<Header>
				<TitleSection>
					<PageTitle>{t('studentPanel.dailyAttendance.title')}</PageTitle>
					<Subtitle>Track your daily attendance and maintain perfect records</Subtitle>
				</TitleSection>
				<HeaderIcon>
					<CalendarIcon size={32} />
				</HeaderIcon>
			</Header>

			{/* Monthly Stats */}
			<StatsContainer>
				<StatCard
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					<StatIcon $color="#22c55e">
						<TrendingUp size={20} />
					</StatIcon>
					<StatContent>
						<StatValue>{stats.attendanceRate}%</StatValue>
						<StatLabel>Attendance Rate</StatLabel>
					</StatContent>
				</StatCard>

				<StatCard
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.1 }}
				>
					<StatIcon $color="#3b82f6">
						<CalendarIcon size={20} />
					</StatIcon>
					<StatContent>
						<StatValue>{stats.totalDays}</StatValue>
						<StatLabel>Total Days</StatLabel>
					</StatContent>
				</StatCard>

				<StatCard
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.2 }}
				>
					<StatIcon $color="#22c55e">
						<div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
					</StatIcon>
					<StatContent>
						<StatValue>{stats.presentDays}</StatValue>
						<StatLabel>Present</StatLabel>
					</StatContent>
				</StatCard>

				<StatCard
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.3 }}
				>
					<StatIcon $color="#ef4444">
						<div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
					</StatIcon>
					<StatContent>
						<StatValue>{stats.absentDays}</StatValue>
						<StatLabel>Absent</StatLabel>
					</StatContent>
				</StatCard>
			</StatsContainer>

			<CalendarWrapper>
				<CalendarCard
					as={motion.div}
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.2 }}
				>
					<CalendarHeader>
						<MonthNavButton 
							onClick={handlePreviousMonth}
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.9 }}
							as={motion.button}
						>
							<ChevronLeft size={20} />
						</MonthNavButton>
						<MonthYearDisplay>
							<MonthName>
								{currentMonth.toLocaleDateString('en-US', { month: 'long' })}
							</MonthName>
							<YearName>
								{currentMonth.getFullYear()}
							</YearName>
						</MonthYearDisplay>
						<MonthNavButton 
							onClick={handleNextMonth}
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.9 }}
							as={motion.button}
						>
							<ChevronRight size={20} />
						</MonthNavButton>
					</CalendarHeader>

					<WeekdayHeader>
						{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
							<Weekday key={day} isWeekend={index >= 5}>
								{day.slice(0, 3)}
							</Weekday>
						))}
					</WeekdayHeader>

					<CalendarGrid>
						<AnimatePresence mode="wait">
							{loading ? (
								<LoadingContainer
									as={motion.div}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
								>
									<LoadingSpinner />
									<LoadingText>{t('studentPanel.dailyAttendance.loading')}</LoadingText>
								</LoadingContainer>
							) : (
								renderCalendarDays()
							)}
						</AnimatePresence>
					</CalendarGrid>

					<CalendarLegend>
						<LegendTitle>
							<Info size={16} />
							<span>Attendance Status</span>
						</LegendTitle>
						<LegendItems>
							<LegendItem>
								<LegendColor status='present' />
								<span>{t('studentPanel.dailyAttendance.status.present')}</span>
							</LegendItem>
							<LegendItem>
								<LegendColor status='late' />
								<span>{t('studentPanel.dailyAttendance.status.late')}</span>
							</LegendItem>
							<LegendItem>
								<LegendColor status='excused' />
								<span>{t('studentPanel.dailyAttendance.status.excused')}</span>
							</LegendItem>
							<LegendItem>
								<LegendColor status='absent' />
								<span>{t('studentPanel.dailyAttendance.status.absent')}</span>
							</LegendItem>
						</LegendItems>
					</CalendarLegend>
				</CalendarCard>
			</CalendarWrapper>
		</Container>
	)
}

// Enhanced Styled Components
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 24px;
	min-height: 100vh;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 32px;
	padding: 0 4px;

	@media (max-width: 768px) {
		flex-direction: column;
		text-align: center;
		gap: 16px;
	}
`

const TitleSection = styled.div`
	flex: 1;
`

const Subtitle = styled.p`
	color: #64748b;
	font-size: 1.1rem;
	margin: 8px 0 0;
	font-weight: 400;
`

const HeaderIcon = styled.div`
	width: 60px;
	height: 60px;
	background: linear-gradient(135deg, #3b82f6, #1d4ed8);
	border-radius: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
`

const StatsContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 20px;
	margin-bottom: 32px;
`

const StatCard = styled.div`
	background: white;
	border-radius: 16px;
	padding: 24px;
	display: flex;
	align-items: center;
	gap: 16px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	border: 1px solid rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(10px);
	transition: all 0.3s ease;

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
	}
`

const StatIcon = styled.div<{ $color: string }>`
	width: 48px;
	height: 48px;
	border-radius: 12px;
	background: ${props => `${props.$color}15`};
	color: ${props => props.$color};
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
`

const StatContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`

const StatValue = styled.div`
	font-size: 2rem;
	font-weight: 700;
	color: #1e293b;
	line-height: 1;
`

const StatLabel = styled.div`
	font-size: 0.875rem;
	color: #64748b;
	font-weight: 500;
`

const CalendarWrapper = styled.div`
	display: flex;
	justify-content: center;
`

const CalendarCard = styled.div`
	background: white;
	border-radius: 24px;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	padding: 32px;
	width: 100%;
	max-width: 800px;
	border: 1px solid rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(10px);
`

const CalendarHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 32px;
	padding: 0 8px;
`

const MonthNavButton = styled.button`
	background: #f1f5f9;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #475569;
	width: 44px;
	height: 44px;
	border-radius: 12px;
	transition: all 0.2s ease;
	border: 1px solid transparent;

	&:hover {
		background: #e2e8f0;
		color: #1e293b;
		border-color: #cbd5e1;
	}

	&:active {
		background: #cbd5e1;
	}
`

const MonthYearDisplay = styled.div`
	text-align: center;
	flex: 1;
	margin: 0 16px;
`

const MonthName = styled.h2`
	margin: 0;
	font-size: 1.875rem;
	font-weight: 700;
	color: #1e293b;
	line-height: 1.2;
`

const YearName = styled.div`
	font-size: 1rem;
	color: #64748b;
	font-weight: 500;
	margin-top: 4px;
`

const WeekdayHeader = styled.div`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	margin-bottom: 16px;
	gap: 4px;
`

const Weekday = styled.div<{ isWeekend?: boolean }>`
	text-align: center;
	font-size: 0.875rem;
	font-weight: 600;
	color: ${props => props.isWeekend ? '#ef4444' : '#64748b'};
	padding: 12px 0;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`

const CalendarGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 8px;
	margin-bottom: 32px;
`

const EmptyDay = styled.div`
	aspect-ratio: 1;
	border-radius: 12px;
`

interface DayProps {
	status: AttendanceStatus
	isToday: boolean
	isActive: boolean
	isDisabled: boolean
	isWeekend: boolean
}

const Day = styled.div<DayProps>`
	position: relative;
	aspect-ratio: 1;
	padding: 8px;
	border-radius: 12px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	background: ${props => {
		if (props.status === 'present') return 'linear-gradient(135deg, #22c55e, #16a34a)'
		if (props.status === 'late') return 'linear-gradient(135deg, #f59e0b, #d97706)'
		if (props.status === 'excused') return 'linear-gradient(135deg, #3b82f6, #2563eb)'
		if (props.status === 'absent') return 'linear-gradient(135deg, #ef4444, #dc2626)'
		return '#f8fafc'
	}};
	
	border: ${props => {
		if (props.isToday) return '3px solid #3b82f6'
		if (props.status) return '2px solid rgba(255, 255, 255, 0.3)'
		return '2px solid #e2e8f0'
	}};
	
	box-shadow: ${props => {
		if (props.status) return '0 4px 12px rgba(0, 0, 0, 0.15)'
		return '0 2px 4px rgba(0, 0, 0, 0.05)'
	}};
	
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	opacity: ${props => (props.isDisabled ? 0.5 : 1)};

	&:hover {
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
	}
`

interface DayNumberProps {
	status: AttendanceStatus
	isDisabled: boolean
}

const DayNumber = styled.span<DayNumberProps>`
	font-size: 1.125rem;
	font-weight: 600;
	color: ${props => {
		if (props.status) return 'white'
		return '#1e293b'
	}};
	text-shadow: ${props => props.status ? '0 1px 2px rgba(0, 0, 0, 0.2)' : 'none'};
	line-height: 1;
	margin-bottom: 2px;
`

interface StatusIndicatorProps {
	status: AttendanceStatus
}

const StatusIndicator = styled.div<StatusIndicatorProps>`
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.8);
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`

const LoadingContainer = styled.div`
	grid-column: 1 / -1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
	gap: 16px;
`

const LoadingSpinner = styled.div`
	width: 40px;
	height: 40px;
	border: 3px solid #e2e8f0;
	border-top: 3px solid #3b82f6;
	border-radius: 50%;
	animation: spin 1s linear infinite;

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
`

const LoadingText = styled.p`
	color: #64748b;
	font-weight: 500;
	margin: 0;
`

const CalendarLegend = styled.div`
	border-top: 2px solid #f1f5f9;
	padding-top: 24px;
`

const LegendTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	color: #475569;
	font-weight: 600;
	font-size: 0.875rem;
	margin-bottom: 16px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`

const LegendItems = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 16px;
`

const LegendItem = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 8px;
	border-radius: 8px;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #f8fafc;
	}

	span {
		font-size: 0.875rem;
		color: #475569;
		font-weight: 500;
	}
`

interface LegendColorProps {
	status: AttendanceStatus
}

const LegendColor = styled.div<LegendColorProps>`
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: ${props => {
		switch (props.status) {
			case 'present':
				return 'linear-gradient(135deg, #22c55e, #16a34a)'
			case 'late':
				return 'linear-gradient(135deg, #f59e0b, #d97706)'
			case 'excused':
				return 'linear-gradient(135deg, #3b82f6, #2563eb)'
			case 'absent':
				return 'linear-gradient(135deg, #ef4444, #dc2626)'
			default:
				return '#e2e8f0'
		}
	}};
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	flex-shrink: 0;
`

export default DailyAttendance
