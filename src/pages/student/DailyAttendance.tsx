import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'react-feather'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { PageTitle } from '../../components/common'
import supabase from '../../config/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

// Define attendance status type
type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent' | 'not-assigned' | null

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
	const { user } = useAuth()
	const { t } = useTranslation()
	const [currentMonth, setCurrentMonth] = useState(new Date())
	const [attendanceData, setAttendanceData] = useState<DailyAttendance[]>([])
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (user?.id) {
			fetchAttendanceData()
		}
	}, [user, currentMonth])

	const fetchAttendanceData = async () => {
		if (!user?.id) return

		setLoading(true)

		const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
		const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

		const { data, error } = await supabase
			.from('daily_attendance')
			.select('*')
			.eq('student_id', user.id)
			.gte('noted_for', startOfMonth.toISOString().split('T')[0])
			.lte('noted_for', endOfMonth.toISOString().split('T')[0])

		if (error) {
			console.error('Error fetching attendance data:', error)
		} else {
			setAttendanceData(data || [])
		}

		setLoading(false)
	}

	const handlePreviousMonth = () => {
		setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
	}

	const handleNextMonth = () => {
		setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
	}

	const getDaysInMonth = (year: number, month: number) => {
		return new Date(year, month + 1, 0).getDate()
	}

	const getFirstDayOfMonth = (year: number, month: number) => {
		// Get day of week (0-6), but adjust for Monday start (0 = Monday, 6 = Sunday)
		const day = new Date(year, month, 1).getDay()
		return day === 0 ? 6 : day - 1 // Sunday (0) becomes 6, Monday (1) becomes 0, etc.
	}

	const formatDateString = (day: number): string => {
		return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(
			2,
			'0'
		)}-${String(day).padStart(2, '0')}`
	}

	// Check if a date is a weekend (Saturday or Sunday)
	const isWeekend = (day: number): boolean => {
		const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
		const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
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
			const dateString = formatDateString(day)
			const status = getAttendanceStatus(day)
			const isWeekendDay = isWeekend(day)
			const isTodayDay = isToday(day)

			days.push(
				<Day
					key={dateString}
					status={status}
					isToday={isTodayDay}
					isActive={false}
					isDisabled={false}
					isWeekend={isWeekendDay}
				>
					<DayNumber isDisabled={false} status={status}>
						{day}
					</DayNumber>
				</Day>
			)
		}

		return days
	}

	return (
		<Container>
			<PageTitle>{t('studentPanel.dailyAttendance.title')}</PageTitle>

			<CardWrapper>
				<CalendarCard>
					<CalendarHeader>
						<MonthNavButton onClick={handlePreviousMonth}>
							<ChevronLeft size={20} />
						</MonthNavButton>
						<MonthYearDisplay>
							{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
						</MonthYearDisplay>
						<MonthNavButton onClick={handleNextMonth}>
							<ChevronRight size={20} />
						</MonthNavButton>
					</CalendarHeader>

					<WeekdayHeader>
						<Weekday>{t('studentPanel.dailyAttendance.weekdays.monday')}</Weekday>
						<Weekday>{t('studentPanel.dailyAttendance.weekdays.tuesday')}</Weekday>
						<Weekday>{t('studentPanel.dailyAttendance.weekdays.wednesday')}</Weekday>
						<Weekday>{t('studentPanel.dailyAttendance.weekdays.thursday')}</Weekday>
						<Weekday>{t('studentPanel.dailyAttendance.weekdays.friday')}</Weekday>
						<Weekday>{t('studentPanel.dailyAttendance.weekdays.saturday')}</Weekday>
						<Weekday>{t('studentPanel.dailyAttendance.weekdays.sunday')}</Weekday>
					</WeekdayHeader>

					<CalendarGrid>
						{loading ? (
							<LoadingContainer>
								<p>{t('studentPanel.dailyAttendance.loading')}</p>
							</LoadingContainer>
						) : (
							renderCalendarDays()
						)}
					</CalendarGrid>

					<CalendarLegend>
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
						<LegendItem>
							<LegendColor status='not-assigned' />
							<span>{t('studentPanel.dailyAttendance.status.notAssigned')}</span>
						</LegendItem>
					</CalendarLegend>
				</CalendarCard>
			</CardWrapper>
		</Container>
	)
}

// Styled Components
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
`

const CardWrapper = styled.div`
	margin-top: 20px;
`

const CalendarCard = styled.div`
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	padding: 20px;
	overflow: hidden;
`

const CalendarHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
`

const MonthNavButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${props => props.theme.colors.text.primary};
	width: 32px;
	height: 32px;
	border-radius: 50%;
	transition: background-color 0.2s;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}
`

const MonthYearDisplay = styled.h3`
	margin: 0;
	font-size: 1.1rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const WeekdayHeader = styled.div`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	margin-bottom: 10px;
`

const Weekday = styled.div`
	text-align: center;
	font-size: 0.85rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.secondary};
	padding: 8px 0;
`

const CalendarGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 5px;
`

const EmptyDay = styled.div`
	aspect-ratio: 1;
	border-radius: 8px;
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
	padding: 5px;
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	cursor: default;
	background-color: ${props => {
		switch (props.status) {
			case 'present':
				return props.theme.colors.success[500]
			case 'late':
				return props.theme.colors.warning[500]
			case 'excused':
				return props.theme.colors.primary[500]
			case 'absent':
				return props.theme.colors.danger[500]
			case 'not-assigned':
				return props.theme.colors.text.disabled || '#9CA3AF'
			default:
				return props.theme.colors.background.lighter
		}
	}};
	border: ${props =>
		props.isToday
			? `2px solid ${props.theme.colors.primary[500]}`
			: `1px solid ${props.theme.colors.border.light}`};
	transition: all 0.2s;
	opacity: ${props => (props.isDisabled ? 0.5 : 1)};
`

interface DayNumberProps {
	status: AttendanceStatus
	isDisabled: boolean
}

const DayNumber = styled.span<DayNumberProps>`
	font-size: 1.2rem;
	font-weight: ${props => (props.isDisabled ? 'normal' : '500')};
	color: ${props => {
		switch (props.status) {
			case 'present':
				return 'white'
			case 'late':
				return 'white'
			case 'excused':
				return 'white'
			case 'absent':
				return 'white'
			case 'not-assigned':
				return 'white'
			default:
				return 'black'
		}
	}};
	margin-bottom: 4px;
`

interface StatusIndicatorProps {
	status: AttendanceStatus
}

const StatusIndicator = styled.div<StatusIndicatorProps>`
	width: 18px;
	height: 18px;
	border-radius: 50%;
	background-color: ${props => {
		switch (props.status) {
			case 'present':
				return props.theme.colors.success[500]
			case 'late':
				return props.theme.colors.warning[500]
			case 'excused':
				return props.theme.colors.primary[500]
			case 'absent':
				return props.theme.colors.danger[500]
			default:
				return 'transparent'
		}
	}};
`

const LoadingContainer = styled.div`
	grid-column: span 7;
	display: flex;
	justify-content: center;
	align-items: center;
	height: 300px;
	color: ${props => props.theme.colors.text.secondary};
`

const CalendarLegend = styled.div`
	display: flex;
	justify-content: center;
	gap: 15px;
	margin-top: 20px;
	flex-wrap: wrap;
`

const LegendItem = styled.div`
	display: flex;
	align-items: center;
	gap: 5px;
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};
`

interface LegendColorProps {
	status: AttendanceStatus
}

const LegendColor = styled.div<LegendColorProps>`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background-color: ${props => {
		switch (props.status) {
			case 'present':
				return props.theme.colors.success[500]
			case 'late':
				return props.theme.colors.warning[500]
			case 'excused':
				return props.theme.colors.primary[500]
			case 'absent':
				return props.theme.colors.danger[500]
			case 'not-assigned':
				return props.theme.colors.text.disabled || '#9CA3AF'
			default:
				return 'transparent'
		}
	}};
`

export default DailyAttendance
