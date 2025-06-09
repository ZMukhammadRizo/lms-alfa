import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, FileText } from 'react-feather'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'
import supabase from '../../../config/supabaseClient'
import PageHeader from '../../../components/common/PageHeader'
import AttendancePercentageIndicator from '../../../components/common/AttendancePercentageIndicator'

interface ClassSelection {
	levelId: string
	classId: string
	levelName?: string
	className?: string
}

interface Student {
	id: string
	fullName: string
}

interface AttendanceRecord {
	id: string
	student_id: string
	noted_for: string
	status: 'present' | 'absent' | 'late' | 'excused'
}

interface StudentAttendance {
	student: Student
	attendanceByDate: Record<string, string>
	percentage: number
}

interface ClassAttendanceData {
	classId: string
	className: string
	levelName: string
	students: StudentAttendance[]
	overallPercentage: number
	dates: string[]
}

const DailyAttendanceReports: React.FC = () => {
	const location = useLocation()
	const navigate = useNavigate()
	const [loading, setLoading] = useState(true)
	const [classesData, setClassesData] = useState<ClassAttendanceData[]>([])
	const [overallPercentage, setOverallPercentage] = useState(0)

	// Get the selected classes and report type from location state
	const selectedClasses = location.state?.selectedClasses as ClassSelection[] || []
	const reportType = location.state?.reportType as 'monthly' | 'weekly' || 'monthly'

	useEffect(() => {
		if (selectedClasses.length === 0) {
			// If no classes selected, redirect back to the daily attendance page
			navigate('/admin/daily-attendance')
			return
		}

		fetchAttendanceData()
	}, [selectedClasses, reportType])

	const fetchAttendanceData = async () => {
		try {
			setLoading(true)

			// Calculate date range based on report type
			const { startDate, endDate } = getDateRange(reportType)

			const classesAttendanceData: ClassAttendanceData[] = []

			// Fetch data for each selected class
			for (const classSelection of selectedClasses) {
				// Fetch students for this class
				const { data: studentsData, error: studentsError } = await supabase
					.from('classstudents')
					.select(
						`
						studentid,
						users:studentid (
							id,
							fullName
						)
					`
					)
					.eq('classid', classSelection.classId)

				if (studentsError) throw studentsError

				// Transform students data
				const students = (studentsData || []).map(item => ({
					id: item.users.id,
					fullName: item.users.fullName,
				}))

				// Get all dates in the range
				const dates = getDatesInRange(startDate, endDate)

				// Fetch attendance records for all students in this class
				const attendancePromises = students.map(async student => {
					const { data: attendanceData, error: attendanceError } = await supabase
						.from('daily_attendance')
						.select('*')
						.eq('student_id', student.id)
						.eq('class_id', classSelection.classId)
						.gte('noted_for', startDate.toISOString().split('T')[0])
						.lte('noted_for', endDate.toISOString().split('T')[0])

					if (attendanceError) throw attendanceError

					// Create a map of date to attendance status
					const attendanceByDate: Record<string, string> = {}
					dates.forEach(date => {
						attendanceByDate[formatDate(date)] = 'absent' // Default to absent
					})

					// Update with actual attendance data
					;(attendanceData || []).forEach(record => {
						attendanceByDate[record.noted_for] = record.status
					})

					// Calculate attendance percentage
					const totalDays = dates.length
					const presentDays = Object.values(attendanceByDate).filter(
						status => status === 'present' || status === 'late'
					).length

					const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

					return {
						student,
						attendanceByDate,
						percentage,
					}
				})

				const studentsAttendance = await Promise.all(attendancePromises)

				// Calculate overall class attendance percentage
				const overallPercentage =
					studentsAttendance.length > 0
						? studentsAttendance.reduce((sum, item) => sum + item.percentage, 0) /
						  studentsAttendance.length
						: 0

				classesAttendanceData.push({
					classId: classSelection.classId,
					className: classSelection.className || '',
					levelName: classSelection.levelName || '',
					students: studentsAttendance,
					dates: dates.map(date => formatDate(date)),
					overallPercentage,
				})
			}

			setClassesData(classesAttendanceData)

			// Calculate overall attendance percentage across all classes
			if (classesAttendanceData.length > 0) {
				const overall =
					classesAttendanceData.reduce((sum, cls) => sum + cls.overallPercentage, 0) /
					classesAttendanceData.length
				setOverallPercentage(overall)
			}
		} catch (error) {
			console.error('Error fetching attendance data:', error)
			toast.error('Failed to load attendance data')
		} finally {
			setLoading(false)
		}
	}

	const getDateRange = (type: 'monthly' | 'weekly') => {
		const today = new Date()
		let startDate: Date
		let endDate: Date

		if (type === 'monthly') {
			// Get the first day of the current month
			startDate = new Date(today.getFullYear(), today.getMonth(), 1)
			// Get the last day of the current month
			endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
		} else {
			// Get the first day of the current week (Monday)
			const day = today.getDay()
			const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
			startDate = new Date(today.setDate(diff))
			// Get the last day of the current week (Sunday)
			endDate = new Date(startDate)
			endDate.setDate(startDate.getDate() + 6)
		}

		return { startDate, endDate }
	}

	const getDatesInRange = (startDate: Date, endDate: Date) => {
		const dates: Date[] = []
		let currentDate = new Date(startDate)

		while (currentDate <= endDate) {
			// Skip weekends (Saturday = 6, Sunday = 0)
			const day = currentDate.getDay()
			if (day !== 0 && day !== 6) {
				dates.push(new Date(currentDate))
			}
			currentDate.setDate(currentDate.getDate() + 1)
		}

		return dates
	}

	const formatDate = (date: Date) => {
		return date.toISOString().split('T')[0]
	}

	const getStatusDisplay = (status: string) => {
		switch (status) {
			case 'present':
				return <StatusDot $status='present' title='Present' />
			case 'late':
				return <StatusDot $status='late' title='Late' />
			case 'excused':
				return <StatusDot $status='excused' title='Excused' />
			case 'absent':
				return <StatusDot $status='absent' title='Absent' />
			default:
				return <StatusDot $status='absent' title='Absent' />
		}
	}

	const formatDateHeader = (dateStr: string) => {
		const date = new Date(dateStr)
		return `${date.getDate()}/${date.getMonth() + 1}`
	}

	const handleExportClass = (classData: ClassAttendanceData) => {
		try {
			// Prepare data for export
			const exportData = classData.students.map(studentData => {
				const row: Record<string, any> = {
					'Student Name': studentData.student.fullName,
				}

				// Add attendance status for each date
				classData.dates.forEach(date => {
					const status = studentData.attendanceByDate[date] || 'absent'
					row[formatDateHeader(date)] = status
				})

				// Add attendance percentage
				row['Attendance %'] = `${Math.round(studentData.percentage)}%`

				return row
			})

			// Add a summary row
			exportData.push({
				'Student Name': 'Class Average',
				'Attendance %': `${Math.round(classData.overallPercentage)}%`,
			})

			// Create worksheet
			const ws = XLSX.utils.json_to_sheet(exportData)
			const wb = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(wb, ws, 'Attendance')

			// Generate filename
			const filename = `${classData.levelName}_${classData.className}_${reportType}_attendance.xlsx`

			// Export to file
			XLSX.writeFile(wb, filename)

			toast.success(`Exported ${classData.className} attendance report`)
		} catch (error) {
			console.error('Error exporting data:', error)
			toast.error('Failed to export data')
		}
	}

	const handleExportAll = () => {
		try {
			// Create a new workbook
			const wb = XLSX.utils.book_new()

			// Add a worksheet for each class
			classesData.forEach(classData => {
				const exportData = classData.students.map(studentData => {
					const row: Record<string, any> = {
						'Student Name': studentData.student.fullName,
					}

					// Add attendance status for each date
					classData.dates.forEach(date => {
						const status = studentData.attendanceByDate[date] || 'absent'
						row[formatDateHeader(date)] = status
					})

					// Add attendance percentage
					row['Attendance %'] = `${Math.round(studentData.percentage)}%`

					return row
				})

				// Add a summary row
				exportData.push({
					'Student Name': 'Class Average',
					'Attendance %': `${Math.round(classData.overallPercentage)}%`,
				})

				// Create worksheet for this class
				const ws = XLSX.utils.json_to_sheet(exportData)
				XLSX.utils.book_append_sheet(wb, ws, classData.className)
			})

			// Add a summary worksheet
			const summaryData = classesData.map(classData => ({
				'Level': classData.levelName,
				'Class': classData.className,
				'Students': classData.students.length,
				'Attendance %': `${Math.round(classData.overallPercentage)}%`,
			}))

			// Add overall average
			summaryData.push({
				'Level': '',
				'Class': 'Overall Average',
				'Students': classesData.reduce((sum, cls) => sum + cls.students.length, 0),
				'Attendance %': `${Math.round(overallPercentage)}%`,
			})

			const summaryWs = XLSX.utils.json_to_sheet(summaryData)
			XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

			// Generate filename
			const filename = `All_Classes_${reportType}_attendance.xlsx`

			// Export to file
			XLSX.writeFile(wb, filename)

			toast.success('Exported attendance report for all classes')
		} catch (error) {
			console.error('Error exporting data:', error)
			toast.error('Failed to export data')
		}
	}

	return (
		<Container>
			<BackLink onClick={() => navigate('/admin/daily-attendance')}>
				<ArrowLeft size={16} />
				<span>Back to Daily Attendance</span>
			</BackLink>

			<PageHeader
				title={`${reportType === 'monthly' ? 'Monthly' : 'Weekly'} Attendance Report`}
				subtitle={`Attendance report for ${selectedClasses.length} ${selectedClasses.length === 1 ? 'class' : 'classes'}`}
			/>

			{loading ? (
				<LoadingContainer>
					<LoadingSpinner />
					<p>Loading attendance data...</p>
				</LoadingContainer>
			) : (
				<>
					<ExportAllButton onClick={handleExportAll}>
						<Download size={16} />
						Export All Data
					</ExportAllButton>

					{classesData.map((classData, index) => (
						<ClassReportCard key={classData.classId}>
							<ClassHeader>
								<ClassInfo>
									<ClassTitle>{classData.className}</ClassTitle>
									<ClassLevel>{classData.levelName}</ClassLevel>
								</ClassInfo>
								<ClassActions>
									<ClassAttendance>
										<span>Overall Attendance:</span>
										<AttendancePercentageIndicator percentage={classData.overallPercentage} />
									</ClassAttendance>
									<ExportButton onClick={() => handleExportClass(classData)}>
										<FileText size={16} />
										Export
									</ExportButton>
								</ClassActions>
							</ClassHeader>

							<TableWrapper>
								<AttendanceTable>
									<thead>
										<tr>
											<TableHeader>Student Name</TableHeader>
											{classData.dates.map(date => (
												<TableHeader key={date}>{formatDateHeader(date)}</TableHeader>
											))}
											<TableHeader>Attendance %</TableHeader>
										</tr>
									</thead>
									<tbody>
										{classData.students.map(studentData => (
											<TableRow key={studentData.student.id}>
												<TableCell>{studentData.student.fullName}</TableCell>
												{classData.dates.map(date => (
													<TableCell key={date}>
														{getStatusDisplay(studentData.attendanceByDate[date])}
													</TableCell>
												))}
												<TableCell>
													<AttendancePercentageIndicator percentage={studentData.percentage} />
												</TableCell>
											</TableRow>
										))}
									</tbody>
								</AttendanceTable>
							</TableWrapper>
						</ClassReportCard>
					))}

					<OverallSummary>
						<SummaryTitle>Overall Attendance Summary</SummaryTitle>
						<SummaryContent>
							<SummaryItem>
								<SummaryLabel>Classes:</SummaryLabel>
								<SummaryValue>{classesData.length}</SummaryValue>
							</SummaryItem>
							<SummaryItem>
								<SummaryLabel>Students:</SummaryLabel>
								<SummaryValue>
									{classesData.reduce((sum, cls) => sum + cls.students.length, 0)}
								</SummaryValue>
							</SummaryItem>
							<SummaryItem>
								<SummaryLabel>Average Attendance:</SummaryLabel>
								<AttendancePercentageIndicator percentage={overallPercentage} size="lg" />
							</SummaryItem>
						</SummaryContent>
					</OverallSummary>
				</>
			)}
		</Container>
	)
}

interface StatusDotProps {
	$status: 'present' | 'late' | 'excused' | 'absent'
}

const StatusDot = styled.div<StatusDotProps>`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background-color: ${props => {
		switch (props.$status) {
			case 'present':
				return '#22c55e' // Green
			case 'late':
				return '#eab308' // Yellow
			case 'excused':
				return '#6b7280' // Gray
			case 'absent':
				return '#ef4444' // Red
			default:
				return '#ef4444'
		}
	}};
`

const Container = styled.div`
	padding: 24px;
	max-width: 1200px;
	margin: 0 auto;
`

const BackLink = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	color: #0ea5e9;
	background: none;
	border: none;
	padding: 0;
	margin-bottom: 16px;
	font-weight: 500;
	cursor: pointer;
	transition: opacity 0.2s;

	&:hover {
		opacity: 0.8;
	}
`

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px;
	gap: 16px;

	p {
		color: #4b5563;
	}
`

const LoadingSpinner = styled.div`
	width: 40px;
	height: 40px;
	border: 3px solid #e5e7eb;
	border-top: 3px solid #0ea5e9;
	border-radius: 50%;
	animation: spin 1s linear infinite;

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
`

const ExportAllButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	background-color: #0ea5e9;
	color: white;
	border: none;
	border-radius: 6px;
	padding: 10px 16px;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	margin-bottom: 24px;
	align-self: flex-end;
	margin-left: auto;

	&:hover {
		background-color: #0284c7;
	}
`

const ClassReportCard = styled.div`
	background-color: white;
	border-radius: 12px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	margin-bottom: 24px;
	overflow: hidden;
`

const ClassHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 24px;
	border-bottom: 1px solid #e5e7eb;
	flex-wrap: wrap;
	gap: 16px;
`

const ClassInfo = styled.div`
	display: flex;
	flex-direction: column;
`

const ClassTitle = styled.h3`
	margin: 0;
	font-size: 1.2rem;
	font-weight: 600;
	color: #0ea5e9;
`

const ClassLevel = styled.div`
	font-size: 0.9rem;
	color: #6b7280;
`

const ClassActions = styled.div`
	display: flex;
	align-items: center;
	gap: 24px;
`

const ClassAttendance = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;

	span {
		font-size: 0.9rem;
		color: #4b5563;
	}
`

const ExportButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	background-color: #f3f4f6;
	color: #4b5563;
	border: none;
	border-radius: 6px;
	padding: 8px 12px;
	font-size: 0.85rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: #e5e7eb;
		color: #111827;
	}
`

const TableWrapper = styled.div`
	overflow-x: auto;
`

const AttendanceTable = styled.table`
	width: 100%;
	border-collapse: collapse;
`

const TableHeader = styled.th`
	padding: 12px 16px;
	text-align: left;
	font-size: 0.85rem;
	font-weight: 600;
	color: #4b5563;
	background-color: #f9fafb;
	border-bottom: 1px solid #e5e7eb;
	white-space: nowrap;
`

const TableRow = styled.tr`
	&:nth-child(even) {
		background-color: #f9fafb;
	}
`

const TableCell = styled.td`
	padding: 12px 16px;
	font-size: 0.9rem;
	color: #111827;
	border-bottom: 1px solid #e5e7eb;
`

const OverallSummary = styled.div`
	background-color: white;
	border-radius: 12px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	padding: 24px;
	margin-top: 32px;
`

const SummaryTitle = styled.h3`
	margin: 0 0 16px;
	font-size: 1.2rem;
	font-weight: 600;
	color: #111827;
`

const SummaryContent = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 32px;
`

const SummaryItem = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`

const SummaryLabel = styled.span`
	font-size: 1rem;
	font-weight: 500;
	color: #4b5563;
`

const SummaryValue = styled.span`
	font-size: 1.1rem;
	font-weight: 600;
	color: #111827;
`

export default DailyAttendanceReports
