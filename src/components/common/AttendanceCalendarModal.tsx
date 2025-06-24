import { motion, AnimatePresence } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Clock, FileText, X as XIcon, Calendar as CalendarIcon, TrendingUp, User, Info } from 'react-feather'
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
type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent' | null

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
					totalDays++

					// Check if there's an attendance record for this day
					const dateStr = date.toISOString().split('T')[0]
					const record = records.find(r => r.noted_for === dateStr)

					// Count as present only if explicitly marked present or late
					if (record && (record.status === 'present' || record.status === 'late')) {
						presentDays++
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

				// Only count weekdays
				if (dayOfWeek !== 0 && dayOfWeek !== 6) {
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
		return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(
			2,
			'0'
		)}-${String(day).padStart(2, '0')}`
	}

	const isWeekend = (day: number): boolean => {
		const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
		const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
		return dayOfWeek === 0 || dayOfWeek === 6
	}

	const isAfterCurrentWeek = (day: number): boolean => {
		const today = new Date()
		const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

		// Get the date 3 days ago (to account for 3-day rule)
		const threeDaysAgo = new Date(today)
		threeDaysAgo.setDate(today.getDate() - 3)

		// Check if the date is after current week or too far in the past
		const dayOfWeek = today.getDay()
		const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Adjust for Monday start

		const startOfCurrentWeek = new Date(today)
		startOfCurrentWeek.setDate(today.getDate() - daysFromMonday)
		startOfCurrentWeek.setHours(0, 0, 0, 0)

		const endOfCurrentWeek = new Date(startOfCurrentWeek)
		endOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 6)
		endOfCurrentWeek.setHours(23, 59, 59, 999)

		// Only enable editing for current week and future dates, but not more than 3 days in the past
		const isInCurrentWeek = currentDate >= startOfCurrentWeek && currentDate <= endOfCurrentWeek
		const isFutureDate = currentDate > endOfCurrentWeek
		const isWithinEditWindow = currentDate >= threeDaysAgo

		return !(isInCurrentWeek || isFutureDate) || !isWithinEditWindow
	}

	const handleDayClick = (day: number) => {
		const dateString = formatDateString(day)
		if (isAfterCurrentWeek(day) || isWeekend(day)) return

		// Toggle dropdown
		if (showStatusDropdown === dateString) {
			setShowStatusDropdown(null)
		} else {
			setShowStatusDropdown(dateString)
		}
	}

	const handleStatusSelect = async (date: string, status: AttendanceStatus) => {
		if (!student?.id || savingDate === date) return

		setSavingDate(date)
		try {
			// Check if attendance record already exists
			const existingRecord = attendanceData.find(record => record.noted_for === date)

			if (existingRecord) {
				// Update existing record
				const { error } = await supabase
					.from('daily_attendance')
					.update({ status })
					.eq('id', existingRecord.id)

				if (error) throw error
			} else {
				// Create new record
				const { error } = await supabase.from('daily_attendance').insert([
					{
						student_id: student.id,
						noted_for: date,
						status,
						class_id: classId,
						teacher_id: teacherId,
						quarter_id: quarterId,
					},
				])

				if (error) throw error
			}

			// Refresh attendance data
			await fetchAttendanceData()

			toast.success('Attendance updated successfully')
		} catch (error) {
			console.error('Error updating attendance:', error)
			toast.error('Failed to update attendance')
		} finally {
			setSavingDate(null)
			setShowStatusDropdown(null)
		}
	}

	const getAttendanceStatus = (day: number): AttendanceStatus => {
		const dateString = formatDateString(day)
		const record = attendanceData.find(record => record.noted_for === dateString)
		return record ? (record.status.toLowerCase() as AttendanceStatus) : null
	}

	const getStatusIcon = (status: AttendanceStatus) => {
		switch (status) {
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
			const isDisabled = isAfterCurrentWeek(day) || isWeekendDay
			const isToday =
				new Date().toDateString() === new Date(year, month, day).toDateString()

			days.push(
				<DayContainer key={day}>
					<Day
						as={motion.div}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.2, delay: day * 0.01 }}
						whileHover={!isDisabled ? { scale: 1.05, y: -2 } : {}}
						whileTap={!isDisabled ? { scale: 0.95 } : {}}
						status={status}
						isToday={isToday}
						isActive={showStatusDropdown === dateString}
						isDisabled={isDisabled}
						isWeekend={isWeekendDay}
						onClick={() => handleDayClick(day)}
					>
						<DayNumber isDisabled={isDisabled} hasStatus={!!status}>{day}</DayNumber>
						{status && <StatusIndicator status={status}>{getStatusIcon(status)}</StatusIndicator>}
						{savingDate === dateString && (
							<SavingIndicator>
								<LoadingSpinner size="small" />
							</SavingIndicator>
						)}
					</Day>

					<AnimatePresence>
						{showStatusDropdown === dateString && !isDisabled && (
							<StatusDropdown
								as={motion.div}
								initial={{ opacity: 0, scale: 0.8, y: -10 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.8, y: -10 }}
								transition={{ duration: 0.2 }}
							>
								<DropdownHeader>
									<span>{t('attendance.attendanceCalendar.setStatus')}</span>
									<DropdownDate>{new Date(year, month, day).toLocaleDateString()}</DropdownDate>
								</DropdownHeader>
								<StatusOption
									onClick={() => handleStatusSelect(dateString, 'present')}
									status="present"
									isSelected={status === 'present'}
									color="success"
								>
									<Check size={16} />
									<span>{t('attendance.attendanceCalendar.present')}</span>
								</StatusOption>
								<StatusOption
									onClick={() => handleStatusSelect(dateString, 'late')}
									status="late"
									isSelected={status === 'late'}
									color="warning"
								>
									<Clock size={16} />
									<span>{t('attendance.attendanceCalendar.late')}</span>
								</StatusOption>
								<StatusOption
									onClick={() => handleStatusSelect(dateString, 'excused')}
									status="excused"
									isSelected={status === 'excused'}
									color="primary"
								>
									<FileText size={16} />
									<span>{t('attendance.attendanceCalendar.excused')}</span>
								</StatusOption>
								<StatusOption
									onClick={() => handleStatusSelect(dateString, 'absent')}
									status="absent"
									isSelected={status === 'absent'}
									color="danger"
								>
									<XIcon size={16} />
									<span>{t('attendance.attendanceCalendar.absent')}</span>
								</StatusOption>
							</StatusDropdown>
						)}
					</AnimatePresence>
				</DayContainer>
			)
		}

		return days
	}

	const getFormattedMonthName = () => {
		const monthNames = [
			t('calendar.january'), t('calendar.february'), t('calendar.march'),
			t('calendar.april'), t('calendar.may'), t('calendar.june'),
			t('calendar.july'), t('calendar.august'), t('calendar.september'),
			t('calendar.october'), t('calendar.november'), t('calendar.december')
		]
		
		const month = monthNames[currentMonth.getMonth()]
		const year = currentMonth.getFullYear()
		return `${month} ${year}`
	}

	if (!isOpen) return null

	return (
		<ModalOverlay
			as={motion.div}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onClose}
		>
			<ModalContent
				as={motion.div}
				initial={{ scale: 0.9, opacity: 0, y: 20 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				exit={{ scale: 0.9, opacity: 0, y: 20 }}
				transition={{ type: "spring", duration: 0.5 }}
				onClick={e => e.stopPropagation()}
			>
				<ModalHeader>
					<StudentSection>
						<StudentAvatar>
							<User size={24} />
						</StudentAvatar>
						<StudentInfo>
							<StudentName>{student.fullName}</StudentName>
							<StudentSubtitle>{t('attendance.attendanceCalendar.tracker')}</StudentSubtitle>
						</StudentInfo>
					</StudentSection>
					<CloseButton 
						onClick={onClose}
						whileHover={{ scale: 1.1, rotate: 90 }}
						whileTap={{ scale: 0.9 }}
						as={motion.button}
					>
						<XIcon size={20} />
					</CloseButton>
				</ModalHeader>

				<StatsSection>
					<StatCard
						as={motion.div}
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.1 }}
					>
						<StatIcon $color="#3b82f6">
							<CalendarIcon size={20} />
						</StatIcon>
						<StatContent>
							<StatLabel>{t('attendance.attendanceCalendar.monthlyAttendance')}</StatLabel>
							{attendanceStats.isLoading ? (
								<LoadingSpinner size='small' />
							) : (
								<AttendancePercentageIndicator percentage={attendanceStats.monthly} />
							)}
						</StatContent>
					</StatCard>

					<StatCard
						as={motion.div}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.2 }}
					>
						<StatIcon $color="#22c55e">
							<TrendingUp size={20} />
						</StatIcon>
						<StatContent>
							<StatLabel>{t('attendance.attendanceCalendar.overallAttendance')}</StatLabel>
							{attendanceStats.isLoading ? (
								<LoadingSpinner size='small' />
							) : (
								<AttendancePercentageIndicator percentage={attendanceStats.overall} />
							)}
						</StatContent>
					</StatCard>
				</StatsSection>

				<CalendarContainer
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
				>
					<CalendarHeaderContainer>
						<MonthNavButton 
							onClick={handlePreviousMonth}
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.9 }}
							as={motion.button}
						>
							<ChevronLeft size={20} />
						</MonthNavButton>
						<MonthYearDisplay>{getFormattedMonthName()}</MonthYearDisplay>
						<MonthNavButton 
							onClick={handleNextMonth}
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.9 }}
							as={motion.button}
						>
							<ChevronRight size={20} />
						</MonthNavButton>
					</CalendarHeaderContainer>

					<WeekdayHeader>
						{[
							t('calendar.monday').substring(0, 3),
							t('calendar.tuesday').substring(0, 3),
							t('calendar.wednesday').substring(0, 3),
							t('calendar.thursday').substring(0, 3),
							t('calendar.friday').substring(0, 3),
							t('calendar.saturday').substring(0, 3),
							t('calendar.sunday').substring(0, 3)
						].map((day, index) => (
							<Weekday key={day} isWeekend={index >= 5}>
								{day}
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
									<LoadingSpinner size='large' />
									<LoadingText>{t('attendance.attendanceCalendar.loadingData')}</LoadingText>
								</LoadingContainer>
							) : (
								renderCalendarDays()
							)}
						</AnimatePresence>
					</CalendarGrid>
				</CalendarContainer>

				<LegendSection>
					<LegendTitle>
						<Info size={16} />
						<span>{t('attendance.attendanceCalendar.statusLegend')}</span>
					</LegendTitle>
					<LegendContainer>
						<LegendItem>
							<LegendColor status='present' />
							<span>{t('attendance.attendanceCalendar.present')}</span>
						</LegendItem>
						<LegendItem>
							<LegendColor status='late' />
							<span>{t('attendance.attendanceCalendar.late')}</span>
						</LegendItem>
						<LegendItem>
							<LegendColor status='excused' />
							<span>{t('attendance.attendanceCalendar.excused')}</span>
						</LegendItem>
						<LegendItem>
							<LegendColor status='absent' />
							<span>{t('attendance.attendanceCalendar.absent')}</span>
						</LegendItem>
					</LegendContainer>
				</LegendSection>

				<ModalFooter>
					<HelpText>
						<Info size={14} />
						<span>{t('attendance.attendanceCalendar.clickDayToEdit')}</span>
					</HelpText>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	)
}

// Enhanced Styled Components
const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(8px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 20px;
`

const ModalContent = styled.div`
	background: white;
	border-radius: 24px;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	width: 100%;
	max-width: 900px;
	max-height: 90vh;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	border: 1px solid rgba(255, 255, 255, 0.2);
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 32px 32px 0;
	margin-bottom: 24px;
`

const StudentSection = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
`

const StudentAvatar = styled.div`
	width: 60px;
	height: 60px;
	border-radius: 16px;
	background: linear-gradient(135deg, #3b82f6, #1d4ed8);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
`

const StudentInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`

const StudentName = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 700;
	color: #1e293b;
	max-width: 400px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const StudentSubtitle = styled.p`
	margin: 0;
	color: #64748b;
	font-size: 0.875rem;
	font-weight: 500;
`

const CloseButton = styled.button`
	background: #f1f5f9;
	border: none;
	color: #475569;
	cursor: pointer;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	transition: all 0.2s ease;

	&:hover {
		background: #e2e8f0;
		color: #1e293b;
	}
`

const StatsSection = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 20px;
	padding: 0 32px;
	margin-bottom: 24px;
`

const StatCard = styled.div`
	background: #f8fafc;
	border-radius: 16px;
	padding: 20px;
	display: flex;
	align-items: center;
	gap: 16px;
	border: 1px solid #e2e8f0;
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
	gap: 8px;
	flex: 1;
`

const StatLabel = styled.div`
	font-size: 0.875rem;
	color: #64748b;
	font-weight: 500;
`

const CalendarContainer = styled.div`
	background: #f8fafc;
	border-radius: 20px;
	padding: 24px;
	margin: 0 32px 24px;
	border: 1px solid #e2e8f0;
`

const CalendarHeaderContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	padding: 0 8px;
`

const MonthNavButton = styled.button`
	background: white;
	border: 1px solid #e2e8f0;
	color: #475569;
	cursor: pointer;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	transition: all 0.2s ease;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

	&:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
		color: #1e293b;
	}
`

const MonthYearDisplay = styled.h3`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 700;
	color: #1e293b;
	text-align: center;
`

const WeekdayHeader = styled.div`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 8px;
	margin-bottom: 16px;
`

const Weekday = styled.div<{ isWeekend?: boolean }>`
	text-align: center;
	font-weight: 600;
	color: ${props => props.isWeekend ? '#ef4444' : '#64748b'};
	font-size: 0.875rem;
	padding: 12px 0;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`

const CalendarGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 8px;
	position: relative;
`

const DayContainer = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
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
	border-radius: 12px;
	padding: 8px;
	cursor: ${props => (props.isDisabled ? 'not-allowed' : 'pointer')};
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	opacity: ${props => (props.isDisabled ? 0.4 : 1)};
	width: 100%;
	
	background: ${props => {
		if (props.status === 'present') return 'linear-gradient(135deg, #22c55e, #16a34a)'
		if (props.status === 'late') return 'linear-gradient(135deg, #f59e0b, #d97706)'
		if (props.status === 'excused') return 'linear-gradient(135deg, #3b82f6, #2563eb)'
		if (props.status === 'absent') return 'linear-gradient(135deg, #ef4444, #dc2626)'
		return 'linear-gradient(135deg, #f8fafc, #e2e8f0)'
	}};
	
	border: ${props => {
		if (props.isToday) return '3px solid #3b82f6'
		if (props.isActive) return '2px solid #8b5cf6'
		if (props.status) return '2px solid rgba(255, 255, 255, 0.3)'
		return '2px solid #e2e8f0'
	}};
	
	box-shadow: ${props => {
		if (props.isActive) return '0 8px 25px rgba(139, 92, 246, 0.3)'
		if (props.status) return '0 4px 12px rgba(0, 0, 0, 0.15)'
		return '0 1px 3px rgba(0, 0, 0, 0.1)'
	}};

	&:hover {
		${props => !props.isDisabled && `
			box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
		`}
	}
`

const EmptyDay = styled.div`
	aspect-ratio: 1;
`

interface DayNumberProps {
	isDisabled: boolean
	hasStatus: boolean
}

const DayNumber = styled.span<DayNumberProps>`
	font-weight: 700;
	font-size: 1.1rem;
	color: ${props => {
		if (props.isDisabled) return '#94a3b8'
		if (props.hasStatus) return 'white'
		return '#1e293b'
	}};
	line-height: 1;
	margin-bottom: 4px;
	text-shadow: ${props => props.hasStatus ? '0 1px 3px rgba(0, 0, 0, 0.5)' : 'none'};
	z-index: 2;
	position: relative;
`

interface StatusIndicatorProps {
	status: AttendanceStatus
}

const StatusIndicator = styled.div<StatusIndicatorProps>`
	color: ${props => props.status ? 'rgba(255, 255, 255, 0.9)' : '#64748b'};
	display: flex;
	align-items: center;
	justify-content: center;
	text-shadow: ${props => props.status ? '0 1px 2px rgba(0, 0, 0, 0.2)' : 'none'};
`

const SavingIndicator = styled.div`
	position: absolute;
	top: 2px;
	right: 2px;
	background: rgba(255, 255, 255, 0.9);
	border-radius: 50%;
	padding: 2px;
`

const StatusDropdown = styled.div`
	position: absolute;
	top: calc(100% + 8px);
	left: 50%;
	transform: translateX(-50%);
	background: white;
	border-radius: 16px;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	padding: 16px;
	z-index: 1000;
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 180px;
	border: 1px solid #e2e8f0;
`

const DropdownHeader = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding-bottom: 12px;
	border-bottom: 1px solid #f1f5f9;
	margin-bottom: 8px;

	span:first-child {
		font-weight: 600;
		color: #1e293b;
		font-size: 0.875rem;
	}
`

const DropdownDate = styled.span`
	font-size: 0.75rem;
	color: #64748b;
	font-weight: 500;
`

interface StatusOptionProps {
	status: AttendanceStatus
	isSelected: boolean
	color: string
}

const StatusOption = styled.button<StatusOptionProps>`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	border: none;
	cursor: pointer;
	border-radius: 10px;
	transition: all 0.2s ease;
	font-weight: 500;
	font-size: 0.875rem;
	
	background: ${props => {
		const colors = {
			success: props.isSelected ? '#22c55e' : '#f0fdf4',
			warning: props.isSelected ? '#f59e0b' : '#fffbeb',
			primary: props.isSelected ? '#3b82f6' : '#eff6ff',
			danger: props.isSelected ? '#ef4444' : '#fef2f2'
		}
		return colors[props.color as keyof typeof colors] || '#f8fafc'
	}};
	
	color: ${props => {
		const colors = {
			success: props.isSelected ? 'white' : '#166534',
			warning: props.isSelected ? 'white' : '#92400e',
			primary: props.isSelected ? 'white' : '#1d4ed8',
			danger: props.isSelected ? 'white' : '#dc2626'
		}
		return colors[props.color as keyof typeof colors] || '#475569'
	}};

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
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

interface LoadingSpinnerProps {
	size?: 'small' | 'medium' | 'large'
}

const LoadingSpinner = styled.div<LoadingSpinnerProps>`
	width: ${props => props.size === 'large' ? '40px' : props.size === 'small' ? '20px' : '32px'};
	height: ${props => props.size === 'large' ? '40px' : props.size === 'small' ? '20px' : '32px'};
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

const LegendSection = styled.div`
	padding: 0 32px;
	margin-bottom: 24px;
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

const LegendContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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

const ModalFooter = styled.div`
	padding: 24px 32px 32px;
	border-top: 1px solid #f1f5f9;
`

const HelpText = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	color: #64748b;
	font-size: 0.875rem;
	font-weight: 500;
	text-align: center;
	justify-content: center;
	
	span {
		font-style: italic;
	}
`

export function getStatusColor(status: AttendanceStatus): string {
	switch (status) {
		case 'present':
			return '#22c55e'
		case 'late':
			return '#f59e0b'
		case 'excused':
			return '#3b82f6'
		case 'absent':
			return '#ef4444'
		default:
			return '#6b7280'
	}
}

export default AttendanceCalendarModal
