import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Clock, FileText, X, X as XIcon } from 'react-feather'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import supabase from '../../config/supabaseClient'

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
type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent' | null

const AttendanceCalendarModal: React.FC<AttendanceCalendarModalProps> = ({
	isOpen,
	onClose,
	student,
	classId,
	teacherId,
	quarterId,
}) => {
	const [currentMonth, setCurrentMonth] = useState(new Date())
	const [attendanceData, setAttendanceData] = useState<DailyAttendance[]>([])
	const [loading, setLoading] = useState(false)
	const [savingDate, setSavingDate] = useState<string | null>(null)
	const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(null)
	const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null)

	// Helper function to get status color
	const getStatusColor = (status: AttendanceStatus): string => {
		if (!status) return 'transparent'

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
				return 'transparent'
		}
	}

	useEffect(() => {
		if (isOpen && student?.id) {
			fetchAttendanceData()
		}
	}, [isOpen, student, currentMonth])

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
							<p>Daily Attendance Record</p>
						</div>
					</StudentInfo>
					<CloseButton onClick={onClose}>
						<X size={24} />
					</CloseButton>
				</ModalHeader>

				<CalendarContainer>
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
						<Weekday>Mon</Weekday>
						<Weekday>Tue</Weekday>
						<Weekday>Wed</Weekday>
						<Weekday>Thu</Weekday>
						<Weekday>Fri</Weekday>
						<Weekday>Sat</Weekday>
						<Weekday>Sun</Weekday>
					</WeekdayHeader>

					<CalendarGrid>
						{loading ? (
							<LoadingContainer>
								<LoadingSpinner size='large' />
								<p>Loading attendance data...</p>
							</LoadingContainer>
						) : (
							renderCalendarDays()
						)}
					</CalendarGrid>
				</CalendarContainer>

				<LegendContainer>
					<LegendItem>
						<LegendColor status='present' />
						<span>Present</span>
					</LegendItem>
					<LegendItem>
						<LegendColor status='late' />
						<span>Late</span>
					</LegendItem>
					<LegendItem>
						<LegendColor status='excused' />
						<span>Excused</span>
					</LegendItem>
					<LegendItem>
						<LegendColor status='absent' />
						<span>Absent</span>
					</LegendItem>
				</LegendContainer>

				<ModalFooter>
					<HelpText>
						Click on any day to mark attendance. Weekends and future weeks are disabled.
					</HelpText>
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
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 0;
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

// Helper function for styled components to access
function getStatusColor(status: AttendanceStatus): string {
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
