import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Clock, FileText, X as XIcon } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import supabase from '../../config/supabaseClient'
import AttendancePercentageIndicator from './AttendancePercentageIndicator'

interface AttendanceCalendarModalProps {
	isOpen: boolean
	onClose: () => void
	student: {
		id: string
		fullName: string
	}
	classId: string
	teacherId?: string
	quarterId?: string
}

interface DailyAttendance {
	id: string
	student_id: string
	noted_for: string
	status: string
	noted_at: string
}

// Define status types for better type safety
type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent' | 'not-assigned' | null

const AttendanceCalendarModal: React.FC<AttendanceCalendarModalProps> = ({
	isOpen,
	onClose,
	student,
	classId,
	teacherId,
	quarterId,
}) => {
	const { t } = useTranslation()
	const [currentMonth, setCurrentMonth] = useState(new Date())
	const [attendanceData, setAttendanceData] = useState<DailyAttendance[]>([])
	const [loading, setLoading] = useState(false)
	const [savingDate, setSavingDate] = useState<string | null>(null)
	const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(null)
	const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null)
	const [attendanceStats, setAttendanceStats] = useState({
		monthly: 0,
		overall: 0,
		isLoading: true,
	})

	useEffect(() => {
		if (isOpen && student?.id) {
			fetchAttendanceData()
		}
	}, [isOpen, student, currentMonth])

	useEffect(() => {
		// Calculate attendance stats whenever attendance data changes
		if (attendanceData.length > 0) {
			calculateAttendanceStats()
		}
	}, [attendanceData, currentMonth])

	const fetchAttendanceData = async () => {
		if (!student?.id) return

		setLoading(true)

		const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
		const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

		const { data, error } = await supabase
			.from('daily_attendance')
			.select('*')
			.eq('student_id', student.id)
			.eq('class_id', classId)
			.gte('noted_for', startOfMonth.toISOString().split('T')[0])
			.lte('noted_for', endOfMonth.toISOString().split('T')[0])

		if (error) {
			console.error('Error fetching attendance data:', error)
			toast.error('Failed to load attendance data')
		} else {
			setAttendanceData(data || [])
		}

		// Also fetch overall attendance data
		fetchOverallAttendance()

		setLoading(false)
	}

	const fetchOverallAttendance = async () => {
		if (!student?.id || !classId) return

		try {
			const { data: overallData, error: overallError } = await supabase
				.from('daily_attendance')
				.select('status, noted_for')
				.eq('student_id', student.id)
				.eq('class_id', classId)

			if (overallError) throw overallError

			// Calculate overall attendance percentage
			const overallPercentage = calculateAttendancePercentage(overallData || [])

			setAttendanceStats(prev => ({
				...prev,
				overall: overallPercentage,
				isLoading: false,
			}))
		} catch (error) {
			console.error('Error fetching overall attendance data:', error)
		}
	}

	const calculateAttendanceStats = () => {
		// Calculate monthly attendance based on current month data
		const monthlyPercentage = calculateAttendancePercentage(attendanceData)

		setAttendanceStats(prev => ({
			...prev,
			monthly: monthlyPercentage,
			isLoading: false,
		}))
	}

	const calculateAttendancePercentage = (
		records: { status: string; noted_for: string }[]
	): number => {
		if (!records.length) return 0

		// Get all weekdays in the month for monthly calculation
		let totalDays = 0
		let presentDays = 0

		if (records === attendanceData) {
			// For monthly calculation, we need to count all weekdays in the month
			const year = currentMonth.getFullYear()
			const month = currentMonth.getMonth()
			const daysInMonth = new Date(year, month + 1, 0).getDate()

			// Count all weekdays (Mon-Fri) in the month
			for (let day = 1; day <= daysInMonth; day++) {
				const date = new Date(year, month, day)
				const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday

				// Skip weekends
				if (dayOfWeek !== 0 && dayOfWeek !== 6) {
					// Check if there's an attendance record for this day
					const dateStr = date.toISOString().split('T')[0]
					const record = records.find(r => r.noted_for === dateStr)

					// Only count assigned days in total (exclude not-assigned)
					if (record && record.status !== 'not-assigned') {
						totalDays++
						// Count as present only if explicitly marked present or late
						if (record.status === 'present' || record.status === 'late') {
							presentDays++
						}
					}
				}
			}
		} else {
			// For overall calculation, count all records
			// Group records by date to avoid counting duplicates
			const recordsByDate = new Map<string, string>()
			records.forEach(record => {
				recordsByDate.set(record.noted_for, record.status)
			})

			// Count total days and present days
			recordsByDate.forEach((status, date) => {
				const recordDate = new Date(date)
				const dayOfWeek = recordDate.getDay()

				// Only count weekdays and exclude not-assigned days
				if (dayOfWeek !== 0 && dayOfWeek !== 6 && status !== 'not-assigned') {
					totalDays++
					if (status === 'present' || status === 'late') {
						presentDays++
					}
				}
			})
		}

		return totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
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
		// Fix month formatting (months are 0-indexed in JS Date)
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

	// Check if a date is after the current week
	const isAfterCurrentWeek = (day: number): boolean => {
		const today = new Date()
		const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

		// If it's a different month in the future
		if (
			date.getFullYear() > today.getFullYear() ||
			(date.getFullYear() === today.getFullYear() && date.getMonth() > today.getMonth())
		) {
			return true
		}

		// If it's in the current month but future week
		if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
			// Get the start of the current week (Monday)
			const startOfWeek = new Date(today)
			const todayDayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
			const daysFromMonday = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1
			startOfWeek.setDate(today.getDate() - daysFromMonday)

			// Get the end of the current week (Sunday)
			const endOfWeek = new Date(startOfWeek)
			endOfWeek.setDate(startOfWeek.getDate() + 6)

			// Check if the date is after the end of the current week
			return date > endOfWeek
		}

		return false
	}

	const handleDayClick = (day: number) => {
		const dateString = formatDateString(day)

		// Don't allow interaction with weekends or future weeks
		if (isWeekend(day) || isAfterCurrentWeek(day)) {
			return
		}

		setShowStatusDropdown(showStatusDropdown === dateString ? null : dateString)
		setSelectedStatus(null)
	}

	const handleStatusSelect = async (date: string, status: AttendanceStatus) => {
		if (!student?.id || !classId || !status) return

		setSavingDate(date)
		setSelectedStatus(status)

		// Check if there's already an attendance record for this date
		const existingRecord = attendanceData.find(record => record.noted_for === date)

		try {
			if (existingRecord) {
				// Update existing record
				const { error } = await supabase
					.from('daily_attendance')
					.update({
						status,
						noted_at: new Date().toISOString(),
					})
					.eq('id', existingRecord.id)

				if (error) throw error

				// Update local state
				setAttendanceData(prev =>
					prev.map(item =>
						item.id === existingRecord.id
							? { ...item, status, noted_at: new Date().toISOString() }
							: item
					)
				)

				toast.success('Attendance updated successfully')
			} else {
				// Create new record
				const { data, error } = await supabase
					.from('daily_attendance')
					.insert({
						student_id: student.id,
						noted_for: date,
						status,
						class_id: classId,
						teacher_id: teacherId,
						quarter_id: quarterId,
					})
					.select()

				if (error) throw error

				// Update local state
				if (data && data.length > 0) {
					setAttendanceData(prev => [...prev, data[0]])
				}

				toast.success('Attendance saved successfully')
			}

			// Recalculate attendance stats after update
			fetchOverallAttendance()
		} catch (error) {
			console.error('Error saving attendance:', error)
			toast.error('Failed to save attendance')
		} finally {
			setSavingDate(null)
			setShowStatusDropdown(null)
		}
	}

	const getAttendanceStatus = (day: number): AttendanceStatus => {
		const dateString = formatDateString(day)
		const record = attendanceData.find(item => item.noted_for === dateString)
		return record ? (record.status as AttendanceStatus) : null
	}

	const getStatusIcon = (status: AttendanceStatus) => {
		if (!status) return null

		switch (status.toLowerCase()) {
			case 'present':
				return <Check size={16} />
			case 'late':
				return <Clock size={16} />
			case 'excused':
				return <FileText size={16} />
			case 'absent':
				return <XIcon size={16} />
			default:
				return null
		}
	}

	const renderCalendarDays = () => {
		const days = []
		const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth())
		const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth())

		// Add empty cells for days before the first day of the month
		for (let i = 0; i < firstDay; i++) {
			days.push(<EmptyDay key={`empty-${i}`} />)
		}

		// Add cells for each day of the month
		for (let day = 1; day <= daysInMonth; day++) {
			const dateString = formatDateString(day)
			const status = getAttendanceStatus(day)
			const isToday = new Date().toDateString() === new Date(dateString).toDateString()
			const isSaving = savingDate === dateString
			const isDropdownOpen = showStatusDropdown === dateString
			const isDisabledWeekend = isWeekend(day)
			const isDisabledFuture = isAfterCurrentWeek(day)
			const isDisabled = isDisabledWeekend || isDisabledFuture

			days.push(
				<Day
					key={day}
					onClick={() => handleDayClick(day)}
					status={status}
					isToday={isToday}
					isActive={isDropdownOpen}
					isDisabled={isDisabled}
					isWeekend={isDisabledWeekend}
				>
					<DayNumber isDisabled={isDisabled}>{day}</DayNumber>
					{status && <StatusIndicator status={status}>{getStatusIcon(status)}</StatusIndicator>}

					{isDropdownOpen && (
						<StatusDropdown>
							<StatusOption
								status='present'
								isSelected={selectedStatus === 'present'}
								onClick={e => {
									e.stopPropagation()
									handleStatusSelect(dateString, 'present')
								}}
								disabled={isSaving}
								color='success'
							>
								<Check size={16} />
								<span>Present</span>
							</StatusOption>
							<StatusOption
								status='late'
								isSelected={selectedStatus === 'late'}
								onClick={e => {
									e.stopPropagation()
									handleStatusSelect(dateString, 'late')
								}}
								disabled={isSaving}
								color='warning'
							>
								<Clock size={16} />
								<span>Late</span>
							</StatusOption>
							<StatusOption
								status='excused'
								isSelected={selectedStatus === 'excused'}
								onClick={e => {
									e.stopPropagation()
									handleStatusSelect(dateString, 'excused')
								}}
								disabled={isSaving}
								color='primary'
							>
								<FileText size={16} />
								<span>Excused</span>
							</StatusOption>
							<StatusOption
								status='absent'
								isSelected={selectedStatus === 'absent'}
								onClick={e => {
									e.stopPropagation()
									handleStatusSelect(dateString, 'absent')
								}}
								disabled={isSaving}
								color='danger'
							>
								<XIcon size={16} />
								<span>Absent</span>
							</StatusOption>
						</StatusDropdown>
					)}

					{isSaving && (
						<LoadingOverlay>
							<LoadingSpinner />
						</LoadingOverlay>
					)}
				</Day>
			)
		}

		return days
	}

	// Get formatted month name for display
	const getFormattedMonthName = () => {
		const monthNames = [
			t('calendar.january'),
			t('calendar.february'),
			t('calendar.march'),
			t('calendar.april'),
			t('calendar.may'),
			t('calendar.june'),
			t('calendar.july'),
			t('calendar.august'),
			t('calendar.september'),
			t('calendar.october'),
			t('calendar.november'),
			t('calendar.december'),
		]
		return `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
	}

	const renderCalendarHeader = () => {
		const dayNames = [
			t('calendar.monday'),
			t('calendar.tuesday'),
			t('calendar.wednesday'),
			t('calendar.thursday'),
			t('calendar.friday'),
			t('calendar.saturday'),
			t('calendar.sunday'),
		]

		return (
			<CalendarHeader>
				{dayNames.map((day, index) => (
					<DayName key={index} isWeekend={index >= 5}>
						{day.substring(0, 3)}
					</DayName>
				))}
			</CalendarHeader>
		)
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
					<StudentInfo>
						<StudentAvatar>{student.fullName.charAt(0)}</StudentAvatar>
						<div>
							<h2>{student.fullName}</h2>
							<p>{t('attendance.title')}</p>
						</div>
					</StudentInfo>
					<CloseButton onClick={onClose}>
						<XIcon size={24} />
					</CloseButton>
				</ModalHeader>

				<AttendanceStatsContainer>
					<AttendanceStatItem>
						<StatLabel>
							{getFormattedMonthName()} {t('attendance.monthlyAttendance')}:
						</StatLabel>
						{attendanceStats.isLoading ? (
							<LoadingSpinner size='small' />
						) : (
							<AttendancePercentageIndicator percentage={attendanceStats.monthly} />
						)}
					</AttendanceStatItem>
					<AttendanceStatItem>
						<StatLabel>{t('attendance.overallAttendance')}:</StatLabel>
						{attendanceStats.isLoading ? (
							<LoadingSpinner size='small' />
						) : (
							<AttendancePercentageIndicator percentage={attendanceStats.overall} />
						)}
					</AttendanceStatItem>
				</AttendanceStatsContainer>

				<CalendarContainer>
					<CalendarHeader>
						<MonthNavButton onClick={handlePreviousMonth}>
							<ChevronLeft size={20} />
						</MonthNavButton>
						<MonthYearDisplay>{getFormattedMonthName()}</MonthYearDisplay>
						<MonthNavButton onClick={handleNextMonth}>
							<ChevronRight size={20} />
						</MonthNavButton>
					</CalendarHeader>

					<WeekdayHeader>
						<Weekday>{t('calendar.monday').substring(0, 3)}</Weekday>
						<Weekday>{t('calendar.tuesday').substring(0, 3)}</Weekday>
						<Weekday>{t('calendar.wednesday').substring(0, 3)}</Weekday>
						<Weekday>{t('calendar.thursday').substring(0, 3)}</Weekday>
						<Weekday>{t('calendar.friday').substring(0, 3)}</Weekday>
						<Weekday>{t('calendar.saturday').substring(0, 3)}</Weekday>
						<Weekday>{t('calendar.sunday').substring(0, 3)}</Weekday>
					</WeekdayHeader>

					<CalendarGrid>
						{loading ? (
							<LoadingContainer>
								<LoadingSpinner size='large' />
								<p>{t('attendance.loadingAttendance')}</p>
							</LoadingContainer>
						) : (
							renderCalendarDays()
						)}
					</CalendarGrid>
				</CalendarContainer>

				<LegendContainer>
					<LegendItem>
						<LegendColor status='present' />
						<span>{t('attendance.present')}</span>
					</LegendItem>
					<LegendItem>
						<LegendColor status='late' />
						<span>{t('attendance.late')}</span>
					</LegendItem>
					<LegendItem>
						<LegendColor status='excused' />
						<span>{t('attendance.excused')}</span>
					</LegendItem>
					<LegendItem>
						<LegendColor status='absent' />
						<span>{t('attendance.absent')}</span>
					</LegendItem>
				</LegendContainer>

				<ModalFooter>
					<HelpText>{t('dailyAttendance.clickDayInstruction')}</HelpText>
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
	background-color: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 20px;
	backdrop-filter: blur(2px);
`

const ModalContent = styled(motion.div)`
	background-color: #fff;
	border-radius: 16px;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
	width: 100%;
	max-width: 800px;
	max-height: 90vh;
	overflow-y: auto;
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	z-index: 1001;
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--color-border);
`

const StudentInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;

	h2 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--color-text-primary);
		max-width: 300px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	p {
		margin: 4px 0 0;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}
`

const StudentAvatar = styled.div`
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background-color: #0ea5e9;
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 1.4rem;
`

const CloseButton = styled.button`
	background: transparent;
	border: none;
	color: var(--color-text-secondary);
	cursor: pointer;
	padding: 8px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background-color 0.2s, color 0.2s;

	&:hover {
		background-color: #0ea5e9;
		color: #fff;
	}
`

const CalendarContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	background-color: var(--color-bg-secondary);
	border-radius: 12px;
	padding: 20px;
`

const CalendarHeader = styled.div`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 8px;
	margin-bottom: 8px;
`

const MonthNavButton = styled.button`
	background: transparent;
	border: none;
	color: var(--color-text-primary);
	cursor: pointer;
	padding: 8px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background-color 0.2s;

	&:hover {
		background-color: #0ea5e9;
		color: #fff;
	}
`

const MonthYearDisplay = styled.h3`
	margin: 0;
	font-size: 1.2rem;
	font-weight: 600;
	color: #0ea5e9;
`

const WeekdayHeader = styled.div`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 8px;
	margin-bottom: 8px;
`

const Weekday = styled.div`
	text-align: center;
	font-weight: 600;
	color: var(--color-text-secondary);
	font-size: 0.9rem;
	padding: 8px 0;
`

const CalendarGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 8px;
	position: relative;
`

interface DayProps {
	status: AttendanceStatus
	isToday: boolean
	isActive: boolean
	isDisabled: boolean
	isWeekend: boolean
}

const Day = styled.div<DayProps>`
	aspect-ratio: 1;
	border-radius: 8px;
	padding: 4px;
	cursor: ${props => (props.isDisabled ? 'not-allowed' : 'pointer')};
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
	opacity: ${props => (props.isDisabled ? '0.5' : '1')};
	background-color: ${props =>
		props.isDisabled
			? props.isWeekend
				? '#f5f5f5'
				: '#f0f0f0'
			: props.isActive
			? '#f5f5f5'
			: props.status
			? `${getStatusColor(props.status)}15`
			: 'var(--color-bg-primary)'};
	border: 2px solid
		${props =>
			props.isToday ? '#0ea5e9' : props.status ? getStatusColor(props.status) : 'transparent'};
	box-shadow: ${props =>
		props.status && !props.isDisabled ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none'};
	z-index: ${props => (props.isActive ? 10 : 1)};

	&:hover {
		background-color: ${props =>
			props.isDisabled ? (props.isWeekend ? '#f5f5f5' : '#f0f0f0') : '#f5f5f5'};
		transform: ${props => (props.isDisabled ? 'none' : 'translateY(-2px)')};
	}
`

const EmptyDay = styled.div`
	aspect-ratio: 1;
`

interface DayNumberProps {
	isDisabled: boolean
}

const DayNumber = styled.span<DayNumberProps>`
	font-weight: 500;
	font-size: 1rem;
	color: ${props => (props.isDisabled ? '#999' : 'var(--color-text-primary)')};
`

interface StatusIndicatorProps {
	status: AttendanceStatus
}

const StatusIndicator = styled.div<StatusIndicatorProps>`
	margin-top: 4px;
	color: ${props => getStatusColor(props.status)};
	display: flex;
	align-items: center;
	justify-content: center;
`

const StatusDropdown = styled.div`
	position: absolute;
	top: calc(100% + 5px);
	left: 50%;
	transform: translateX(-50%);
	background-color: #fff;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	padding: 8px;
	z-index: 1000;
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 140px;
	border: 1px solid #c4c4c4;
`

interface StatusOptionProps {
	status: AttendanceStatus
	isSelected: boolean
	color: string
}

const StatusOption = styled.button<StatusOptionProps>`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px;
	border: none;
	cursor: pointer;
	border-radius: 6px;
	transition: all 0.2s;
	font-weight: ${props => (props.isSelected ? '500' : 'normal')};

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	span {
		font-size: 0.9rem;
	}
	${props => {
		switch (props.color) {
			case 'success':
				return `
					background-color: ${props.theme.colors.success[50]};
					color: ${props.theme.colors.success[700]};
					border: 1px solid ${props.theme.colors.success[200]};

					&:hover {
						background-color: ${props.theme.colors.success[100]};
					}
				`
			case 'primary':
				return `
					background-color: ${props.theme.colors.primary[50]};
					color: ${props.theme.colors.primary[700]};
					border: 1px solid ${props.theme.colors.primary[200]};

					&:hover {
						background-color: ${props.theme.colors.primary[100]};
					}
				`
			case 'warning':
				return `
					background-color: ${props.theme.colors.warning[50]};
					color: ${props.theme.colors.warning[700]};
					border: 1px solid ${props.theme.colors.warning[200]};

					&:hover {
						background-color: ${props.theme.colors.warning[100]};
					}
				`
			case 'danger':
				return `
					background-color: ${props.theme.colors.danger[50]};
					color: ${props.theme.colors.danger[700]};
					border: 1px solid ${props.theme.colors.danger[200]};

					&:hover {
						background-color: ${props.theme.colors.danger[100]};
					}
				`
			default:
				return `
					background-color: ${props.theme.colors.neutral[100]};
					color: ${props.theme.colors.neutral[600]};
					border: 1px solid ${props.theme.colors.neutral[200]};

					&:hover {
						background-color: ${props.theme.colors.neutral[200]};
					}
				`
		}
	}}
`

const LoadingOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(255, 255, 255, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 8px;
`

interface LoadingSpinnerProps {
	size?: 'small' | 'medium' | 'large'
}

const LoadingSpinner = styled.div<LoadingSpinnerProps>`
	width: ${props => (props.size === 'large' ? '40px' : props.size === 'medium' ? '24px' : '16px')};
	height: ${props => (props.size === 'large' ? '40px' : props.size === 'medium' ? '24px' : '16px')};
	border: 2px solid var(--color-bg-secondary);
	border-top: 2px solid var(--color-primary);
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

const LoadingContainer = styled.div`
	grid-column: 1 / -1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40px;
	gap: 16px;

	p {
		color: var(--color-text-secondary);
	}
`

const LegendContainer = styled.div`
	display: flex;
	justify-content: center;
	gap: 16px;
	padding: 16px;
	background-color: var(--color-bg-secondary);
	border-radius: 12px;
`

interface LegendColorProps {
	status: AttendanceStatus
}

const LegendItem = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;

	span {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}
`

const LegendColor = styled.div<LegendColorProps>`
	width: 16px;
	height: 16px;
	border-radius: 4px;
	background-color: ${props => getStatusColor(props.status)};
`

const ModalFooter = styled.div`
	display: flex;
	justify-content: center;
	padding-top: 8px;
`

const HelpText = styled.p`
	font-size: 0.9rem;
	color: var(--color-text-secondary);
	margin: 0;
	font-style: italic;
`

const AttendanceStatsContainer = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	padding: 16px 0;
	border-bottom: 1px solid var(--color-border);
	margin-bottom: 16px;

	@media (max-width: 768px) {
		flex-direction: column;
		gap: 12px;
	}
`

const AttendanceStatItem = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	flex: 1;
	min-width: 180px;
`

const StatLabel = styled.span`
	font-size: 0.9rem;
	font-weight: 500;
	color: var(--color-text-secondary);
	white-space: nowrap;
`

// Helper function for styled components to access
export function getStatusColor(status: AttendanceStatus): string {
	if (!status) return 'transparent'

	switch (status.toLowerCase()) {
		case 'present':
			return '#10b981' // success color
		case 'late':
			return '#f59e0b' // warning color
		case 'excused':
			return '#3b82f6' // primary color
		case 'absent':
			return '#ef4444' // danger color
		default:
			return 'transparent'
	}
}

export default AttendanceCalendarModal
