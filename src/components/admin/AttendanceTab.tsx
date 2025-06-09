import React, { useEffect } from 'react'
import styled from 'styled-components'
import useAttendanceStore from '../../store/attendanceStore'
import LoadingSpinner from '../ui/Loader'

interface AttendanceTabProps {
	students: Array<{ id: string; fullName: string }>
	lessons: Array<{ id: string; title: string; date: string }>
}

const AdminAttendanceTab: React.FC<AttendanceTabProps> = ({ students, lessons }) => {
	const { attendance, loading, error, fetchAttendanceForLessons, saveAttendanceStatus } =
		useAttendanceStore()

	useEffect(() => {
		if (lessons.length > 0) {
			const lessonIds = lessons.map(lesson => lesson.id)
			fetchAttendanceForLessons(lessonIds)
		}
	}, [lessons, fetchAttendanceForLessons])

	// Debugging: Log student data
	useEffect(() => {
		console.log('Student data in AdminAttendanceTab:', students)
	}, [students])

	if (loading) {
		return (
			<LoadingContainer>
				<LoadingSpinner />
				<LoadingText>Loading attendance data...</LoadingText>
			</LoadingContainer>
		)
	}

	if (error) {
		return <ErrorMessage>Error: {error}</ErrorMessage>
	}

	if (lessons.length === 0) {
		return (
			<EmptyStateContainer>
				<EmptyStateTitle>No lessons found</EmptyStateTitle>
				<EmptyStateSubtitle>
					There are no lessons for this subject or the data hasn't loaded
				</EmptyStateSubtitle>
			</EmptyStateContainer>
		)
	}

	if (students.length === 0) {
		return (
			<EmptyStateContainer>
				<EmptyStateTitle>No students found</EmptyStateTitle>
				<EmptyStateSubtitle>
					There are no students in this class or the class data hasn't loaded
				</EmptyStateSubtitle>
			</EmptyStateContainer>
		)
	}

	const getAttendanceStatus = (studentId: string, lessonId: string) => {
		// Validate IDs before checking
		if (!studentId || !lessonId) {
			return 'absent'
		}

		const record = attendance.find(a => a.student_id === studentId && a.lesson_id === lessonId)
		return record?.status || 'absent'
	}

	// Format date helper
	const formatDate = (dateString: string): string => {
		try {
			const date = new Date(dateString)
			return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
		} catch (e) {
			return ''
		}
	}

	// Filter out students with invalid IDs
	const validStudents = students.filter(
		student => !!student.id && student.id !== 'undefined' && student.id !== 'null'
	)

	return (
		<JournalContainer>
			<JournalHeader>
				<JournalTitle>Attendance Journal</JournalTitle>
				<HeaderSubtitle>Click on a status to toggle attendance</HeaderSubtitle>
			</JournalHeader>

			<TableScrollContainer>
				<JournalTable>
					<TableHeader>
						<HeaderRow>
							<StudentNameHeader>Student</StudentNameHeader>
							{lessons.map(lesson => (
								<LessonHeader key={lesson.id}>
									<LessonTitle>{lesson.title}</LessonTitle>
									<LessonDate>{formatDate(lesson.date)}</LessonDate>
								</LessonHeader>
							))}
						</HeaderRow>
					</TableHeader>
					<tbody>
						{validStudents.map((student, studentIndex) => (
							<StudentRow key={student.id} $isEven={studentIndex % 2 === 0}>
								<StudentNameCell>
									<StudentName>{student.fullName}</StudentName>
								</StudentNameCell>

								{lessons.map(lesson => {
									const currentStatus = getAttendanceStatus(student.id, lesson.id)

									return (
										<AttendanceCell key={`${student.id}-${lesson.id}`}>
											<SelectDropdown
												value={currentStatus}
												onChange={e => {
													const newStatus = e.target.value
													saveAttendanceStatus(lesson.id, student.id, newStatus)
												}}
												$status={currentStatus}
											>
												<option value='present'>Present</option>
												<option value='absent'>Absent</option>
												<option value='late'>Late</option>
												<option value='excused'>Excused</option>
											</SelectDropdown>
										</AttendanceCell>
									)
								})}
							</StudentRow>
						))}
					</tbody>
				</JournalTable>
			</TableScrollContainer>
		</JournalContainer>
	)
}

// Styled components
const JournalContainer = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	background-color: white;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	overflow: hidden;
`

const JournalHeader = styled.div`
	padding: 16px 20px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const JournalTitle = styled.h2`
	font-size: 1.1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
`

const HeaderSubtitle = styled.p`
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};
	margin: 4px 0 0 0;
`

const TableScrollContainer = styled.div`
	overflow-x: auto;
	max-width: 100%;
	scrollbar-width: thin;

	&::-webkit-scrollbar {
		height: 8px;
	}

	&::-webkit-scrollbar-track {
		background: ${props => props.theme.colors.background.lighter};
		border-radius: 4px;
	}

	&::-webkit-scrollbar-thumb {
		background: ${props => props.theme.colors.neutral[300]};
		border-radius: 4px;
	}
`

const JournalTable = styled.table`
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	table-layout: fixed;
`

const TableHeader = styled.thead`
	position: sticky;
	top: 0;
	z-index: 10;
	background-color: white;
`

const HeaderRow = styled.tr`
	background-color: ${props => props.theme.colors.background.lighter};
`

const StudentNameHeader = styled.th`
	text-align: left;
	padding: 14px 20px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.secondary};
	position: sticky;
	left: 0;
	background-color: ${props => props.theme.colors.background.lighter};
	min-width: 200px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	box-shadow: 1px 0 3px rgba(0, 0, 0, 0.05);
`

const LessonHeader = styled.th`
	padding: 12px 8px;
	font-weight: 600;
	font-size: 0.85rem;
	text-align: center;
	min-width: 120px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	background-color: ${props => props.theme.colors.background.lighter};
`

const LessonTitle = styled.div`
	margin-bottom: 4px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const LessonDate = styled.div`
	font-size: 0.75rem;
	font-weight: 400;
	color: ${props => props.theme.colors.text.secondary};
`

interface StudentRowProps {
	$isEven: boolean
}

const StudentRow = styled.tr<StudentRowProps>`
	background-color: ${props => (props.$isEven ? 'white' : props.theme.colors.background.lighter)};
`

const StudentNameCell = styled.td`
	text-align: left;
	padding: 12px 20px;
	position: sticky;
	left: 0;
	background-color: inherit;
	z-index: 1;
	border-bottom: 1px solid ${props => props.theme.colors.border.lighter};
	box-shadow: 1px 0 3px rgba(0, 0, 0, 0.05);
`

const StudentName = styled.div`
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const AttendanceCell = styled.td`
	text-align: center;
	padding: 8px;
	border-bottom: 1px solid ${props => props.theme.colors.border.lighter};
	min-width: 120px;
`

interface SelectDropdownProps {
	$status: string
}

const SelectDropdown = styled.select<SelectDropdownProps>`
	padding: 6px 8px;
	border-radius: 4px;
	border: 1px solid ${props => props.theme.colors.border.light};
	font-size: 0.875rem;
	background-color: white;
	width: 100%;
	cursor: pointer;
	color: ${props => {
		switch (props.$status) {
			case 'present':
				return props.theme.colors.success[600]
			case 'absent':
				return props.theme.colors.danger[600]
			case 'late':
				return props.theme.colors.warning[600]
			case 'excused':
				return props.theme.colors.primary[600]
			default:
				return props.theme.colors.text.primary
		}
	}};
	font-weight: 500;
	appearance: none;
	background-image: ${props =>
		`url("data:image/svg+xml,%3Csvg width='12' height='6' viewBox='0 0 12 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 6L0 0H12L6 6Z' fill='%23${
			props.theme.colors.text.secondary?.replace('#', '') || '666'
		}'/%3E%3C/svg%3E%0A")`};
	background-repeat: no-repeat;
	background-position: right 10px center;
	padding-right: 24px;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[400]};
		box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
	}
`

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px;
	gap: 16px;
`

const LoadingText = styled.p`
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.875rem;
	margin: 0;
`

const ErrorMessage = styled.div`
	padding: 16px;
	background-color: ${props => props.theme.colors.danger[50]};
	color: ${props => props.theme.colors.danger[700]};
	border-radius: 8px;
	margin: 12px 0;
`

const EmptyStateContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px 0;
	text-align: center;
`

const EmptyStateTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	margin: 0 0 8px 0;
	color: ${props => props.theme.colors.text.primary};
`

const EmptyStateSubtitle = styled.p`
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.secondary};
	margin: 0;
	max-width: 300px;
`

export default AdminAttendanceTab
