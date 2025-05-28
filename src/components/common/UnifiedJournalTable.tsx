import React, { useEffect, useRef, useState } from 'react'
import { Check, Edit2, Loader, Plus, Save, X } from 'react-feather'
import styled from 'styled-components'

// Define the types that were imported from JournalData
interface Student {
	id: string
	fullName: string
}

interface Lesson {
	date: string
	topic?: string
	homework?: string
	id?: string
}

interface Grade {
	studentId: string
	date: string
	grade: number
}

interface Attendance {
	id: string
	lesson_id: string
	student_id: string
	status: string
	noted_at?: string
}

// Redefined JournalData
export interface JournalData {
	students: Student[]
	lessons: Lesson[]
	grades: Grade[]
	attendance: Attendance[]
}

interface StudentJournalTableProps {
	data: JournalData
	onGradeChange: (studentId: string, date: string, grade: number | null) => void
	onAttendanceChange?: (studentId: string, lessonId: string, status: string) => void
	onCommentChange?: (studentId: string, lessonId: string, comment: string) => void
	onLessonUpdate?: (date: string, topic: string, homework: string) => void
	onLessonSelect?: (date: string) => void
}

const UnifiedJournalTable: React.FC<StudentJournalTableProps> = ({
	data,
	onGradeChange,
	onAttendanceChange,
	onCommentChange,
	onLessonUpdate,
	onLessonSelect,
}) => {
	const [editingCell, setEditingCell] = useState<{ studentId: string; date: string } | null>(null)
	const [editValue, setEditValue] = useState<string>('')
	const [recentlyEdited, setRecentlyEdited] = useState<Set<string>>(new Set())
	const [savingCell, setSavingCell] = useState<string | null>(null)
	const [newlyAddedGrades, setNewlyAddedGrades] = useState<Set<string>>(new Set())
	const inputRef = useRef<HTMLInputElement>(null)

	// Use a click outside handler to detect clicks outside the editing cell
	const wrapperRef = useRef<HTMLDivElement>(null)

	// Add state for attendance dropdown
	const [attendanceDropdownOpen, setAttendanceDropdownOpen] = useState<string | null>(null)
	const [commentModalOpen, setCommentModalOpen] = useState<{
		studentId: string
		lessonDate: string
	} | null>(null)
	const [commentText, setCommentText] = useState('')
	const [modalStudentId, setModalStudentId] = useState<string>('')
	const [modalLessonDate, setModalLessonDate] = useState<string>('')
	const attendanceDropdownRef = useRef<HTMLDivElement>(null)
	const commentModalRef = useRef<HTMLDivElement>(null)

	// Add a new useEffect for closing attendance dropdown when clicking outside
	useEffect(() => {
		function handleAttendanceClickOutside(event: MouseEvent) {
			if (
				attendanceDropdownRef.current &&
				!attendanceDropdownRef.current.contains(event.target as Node) &&
				attendanceDropdownOpen
			) {
				setAttendanceDropdownOpen(null)
			}
		}

		document.addEventListener('mousedown', handleAttendanceClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleAttendanceClickOutside)
		}
	}, [attendanceDropdownOpen])

	// Add a new useEffect for closing comment modal when clicking outside
	useEffect(() => {
		function handleCommentClickOutside(event: MouseEvent) {
			if (
				commentModalRef.current &&
				!commentModalRef.current.contains(event.target as Node) &&
				commentModalOpen
			) {
				setCommentModalOpen(null)
			}
		}

		document.addEventListener('mousedown', handleCommentClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleCommentClickOutside)
		}
	}, [commentModalOpen])

	// When comment modal is closed
	useEffect(() => {
		if (!commentModalOpen) {
			setCommentText('')
		} else {
			// Store the current student and lesson ID when opening the modal
			setModalStudentId(commentModalOpen.studentId)
			setModalLessonDate(commentModalOpen.lessonDate)
		}
	}, [commentModalOpen])

	// Validate students data - filter out any invalid entries
	const validStudents = data.students.filter(
		student => student && student.id && typeof student.id === 'string'
	)

	// Sort lessons by date
	const sortedLessons = [...data.lessons].sort((a, b) => {
		return new Date(a.date).getTime() - new Date(b.date).getTime()
	})

	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString)
			return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
		} catch (e) {
			return ''
		}
	}

	const getGrade = (studentId: string, date: string) => {
		// Validate inputs before searching
		if (!studentId || !date) {
			return undefined
		}

		const grade = data.grades.find(g => g.studentId === studentId && g.date === date)
		return grade?.grade
	}

	// Get attendance status for a student and lesson
	const getAttendanceStatus = (studentId: string, date: string): string => {
		if (!data || !data.attendance) return ''

		// Find the lesson by date
		const lesson = data.lessons.find(l => l.date === date)
		if (!lesson) return ''

		console.log('Lesson found for attendance:', lesson)

		// Get the lesson ID or an empty string if undefined
		const lessonId = lesson.id || ''
		if (!lessonId) {
			console.warn('No lesson ID for date:', date)
			return ''
		}

		// Find attendance record for this student and lesson
		const record = data.attendance.find(a => a.student_id === studentId && a.lesson_id === lessonId)

		return record?.status || ''
	}

	// Get attendance display info (icon, color)
	const getAttendanceInfo = (status: string | undefined) => {
		if (!status) return { icon: '❌', color: 'danger' }

		switch (status?.toLowerCase()) {
			case 'present':
				return { icon: '✅', color: 'success' }
			case 'late':
				return { icon: '⏰', color: 'warning' }
			case 'excused':
				return { icon: '📝', color: 'primary' }
			case 'absent':
			default:
				return { icon: '❌', color: 'danger' }
		}
	}

	const handleCellClick = (studentId: string, date: string) => {
		try {
			// Check for valid inputs and don't allow clicking on cells that are currently saving
			if (!studentId || !date || savingCell === `${studentId}-${date}`) {
				return
			}

			// If this cell was recently edited, user might be clicking to view again
			const isRecentlyEdited = isCellRecentlyEdited(studentId, date)

			// Get the current grade value
			const currentGrade = getGrade(studentId, date)

			// Set up editing state
			setEditingCell({ studentId, date })
			setEditValue(
				currentGrade !== null && currentGrade !== undefined ? currentGrade.toString() : ''
			)

			// Focus the input after a short delay
			setTimeout(() => {
				if (inputRef.current) {
					inputRef.current.focus()
					inputRef.current.select() // Select the text for easy overwriting
				}
			}, 10)
		} catch (error) {
			console.error('Error handling cell click:', error)
			setEditingCell(null)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			handleGradeSave()
		} else if (e.key === 'Escape') {
			setEditingCell(null)
		}
	}

	const handleGradeSave = () => {
		if (!editingCell) return

		try {
			// Validate student ID
			if (!editingCell.studentId) {
				setEditingCell(null)
				return
			}

			const gradeValue = editValue.trim() === '' ? null : parseInt(editValue, 10)

			// Only save valid grades (numbers between 1-10)
			if (gradeValue === null || (gradeValue >= 1 && gradeValue <= 10)) {
				// Mark this cell as saving
				const cellKey = `${editingCell.studentId}-${editingCell.date}`
				setSavingCell(cellKey)

				// Save the grade and clear the editing state first to avoid UI issues
				setEditingCell(null)

				// Check if this is a new grade (doesn't exist yet)
				const isNewGrade = getGrade(editingCell.studentId, editingCell.date) === undefined

				// Save the grade
				onGradeChange(editingCell.studentId, editingCell.date, gradeValue)

				// Mark as recently edited after a delay to simulate saving
				setTimeout(() => {
					setSavingCell(null)

					// Mark as newly added or just updated based on previous state
					if (gradeValue !== null && isNewGrade) {
						markAsNewlyAdded(editingCell.studentId, editingCell.date)
					} else {
						// Otherwise mark as edited
						const newRecentlyEdited = new Set(recentlyEdited)
						newRecentlyEdited.add(cellKey)
						setRecentlyEdited(newRecentlyEdited)

						// Remove the highlight after 3 seconds
						setTimeout(() => {
							setRecentlyEdited(prev => {
								const updated = new Set(prev)
								updated.delete(cellKey)
								return updated
							})
						}, 3000)
					}
				}, 800) // Slightly longer delay for better UX
			} else {
				alert('Please enter a grade between 1 and 10')
				setEditingCell(null)
			}
		} catch (error) {
			// Reset editing state on error
			setEditingCell(null)
			setSavingCell(null)
			console.error('Error saving grade:', error)
		}
	}

	const isCellRecentlyEdited = (studentId: string, date: string) => {
		// Validate inputs
		if (!studentId || !date) return false

		return recentlyEdited.has(`${studentId}-${date}`)
	}

	const isCellSaving = (studentId: string, date: string) => {
		return savingCell === `${studentId}-${date}`
	}

	// Get grade letter and color based on numeric value
	const getGradeInfo = (grade: number | undefined) => {
		if (grade === undefined || grade === null) return { letter: '', color: 'neutral' }

		if (grade >= 9) return { letter: 'A+', color: 'success' }
		if (grade >= 8) return { letter: 'A', color: 'success' }
		if (grade >= 7) return { letter: 'B+', color: 'primary' }
		if (grade >= 6) return { letter: 'B', color: 'primary' }
		if (grade >= 5) return { letter: 'C+', color: 'warning' }
		if (grade >= 4) return { letter: 'C', color: 'warning' }
		if (grade >= 3) return { letter: 'D', color: 'danger' }
		return { letter: 'F', color: 'danger' }
	}

	// Function to mark a cell as newly added
	const markAsNewlyAdded = (studentId: string, date: string) => {
		const cellKey = `${studentId}-${date}`
		const newSet = new Set(newlyAddedGrades)
		newSet.add(cellKey)
		setNewlyAddedGrades(newSet)

		// Remove the "new" status after 5 seconds
		setTimeout(() => {
			setNewlyAddedGrades(prev => {
				const updated = new Set(prev)
				updated.delete(cellKey)
				return updated
			})
		}, 5000)
	}

	// Check if a grade was just added (not updated)
	const isGradeNewlyAdded = (studentId: string, date: string) => {
		if (!studentId || !date) return false
		return newlyAddedGrades.has(`${studentId}-${date}`)
	}

	// Handle attendance button click
	const handleAttendanceClick = (e: React.MouseEvent, studentId: string, date: string) => {
		e.stopPropagation()
		const key = `${studentId}-${date}`
		setAttendanceDropdownOpen(attendanceDropdownOpen === key ? null : key)
	}

	// Handle attendance status change
	const handleAttendanceChange = async (studentId: string, date: string, status: string) => {
		// Find the corresponding lesson to get the lesson_id
		const lesson = data.lessons.find(l => l.date === date)
		if (!lesson) return

		console.log(lesson)

		// Get the lesson ID or an empty string if undefined
		const lessonId = lesson.id || ''
		if (!lessonId) {
			console.error('Cannot update attendance: lesson ID not found')
			return
		}

		// Call the callback if provided
		if (onAttendanceChange) {
			onAttendanceChange(studentId, lessonId, status)
		}

		// Close dropdown
		setAttendanceDropdownOpen(null)
	}

	// Handle comment button click
	const handleCommentClick = (e: React.MouseEvent, studentId: string, date: string) => {
		e.stopPropagation()

		// Check if this cell's modal is already open
		if (
			commentModalOpen &&
			commentModalOpen.studentId === studentId &&
			commentModalOpen.lessonDate === date
		) {
			setCommentModalOpen(null) // Close if already open
		} else {
			setCommentModalOpen({ studentId, lessonDate: date }) // Open with new data
		}

		// Set initial comment text if available
		// This would need to be implemented in a real application
		setCommentText('')
	}

	// Handle comment save
	const handleCommentSave = async () => {
		if (!commentModalOpen) return

		// Get student ID and lesson date from the modal state
		const studentId = modalStudentId
		const lessonDate = modalLessonDate

		if (!studentId || !lessonDate) {
			console.error('Missing student ID or lesson date for comment save')
			return
		}

		// Find the lesson by date to get the lesson ID
		const lesson = data.lessons.find(l => l.date === lessonDate)
		if (!lesson || !lesson.id) {
			console.error('No lesson found or lesson has no ID for date:', lessonDate)
			return
		}

		const lessonId = lesson.id

		// Call the onCommentChange handler with the student ID, lesson ID, and comment text
		onCommentChange?.(studentId, lessonId, commentText)

		// Close the modal
		setCommentModalOpen(null)
	}

	// Get attendance icons for different statuses
	const getAttendanceIcon = (status: string) => {
		switch (status.toLowerCase()) {
			case 'present':
				return '✅'
			case 'late':
				return '⏰'
			case 'excused':
				return '📝'
			case 'absent':
			default:
				return '❌'
		}
	}

	return (
		<JournalContainer className='journal-container'>
			{/* Modal overlay */}
			{commentModalOpen && <ModalOverlay onClick={() => setCommentModalOpen(null)} />}

			{/* Comment modals should be rendered outside the table for proper z-index stacking */}
			{commentModalOpen && (
				<CommentModal ref={commentModalRef} onClick={e => e.stopPropagation()}>
					<CommentModalHeader>
						<h3>Add Comment</h3>
						<CloseButton onClick={() => setCommentModalOpen(null)}>
							<X size={18} />
						</CloseButton>
					</CommentModalHeader>
					<CommentModalBody>
						<CommentTextarea
							value={commentText}
							onChange={e => setCommentText(e.target.value)}
							placeholder='Enter your comment here...'
							autoFocus
						/>
					</CommentModalBody>
					<CommentModalFooter>
						<CommentModalButton $primary onClick={handleCommentSave}>
							Save Comment
						</CommentModalButton>
						<CommentModalButton onClick={() => setCommentModalOpen(null)}>
							Cancel
						</CommentModalButton>
					</CommentModalFooter>
				</CommentModal>
			)}

			<JournalHeader>
				<JournalTitle>Grades & Attendance Journal</JournalTitle>
				<HeaderSubtitle>Manage grades, attendance, and comments in one place</HeaderSubtitle>
			</JournalHeader>

			<TableScrollContainer>
				<JournalTable>
					<TableHeader>
						<HeaderRow>
							<StudentNameHeader>Student</StudentNameHeader>
							{sortedLessons.map(lesson => (
								<LessonHeader key={lesson.date}>
									<LessonTitle>{lesson.topic || 'Lesson'}</LessonTitle>
									<LessonDate>{formatDate(lesson.date)}</LessonDate>
								</LessonHeader>
							))}
						</HeaderRow>
					</TableHeader>
					<TableBody>
						{validStudents.map((student, index) => (
							<StudentRow key={student.id} $isEven={index % 2 === 0}>
								<StudentNameCell>
									<StudentName>{student.fullName}</StudentName>
								</StudentNameCell>
								{sortedLessons.map(lesson => {
									const grade = getGrade(student.id, lesson.date)
									const { letter, color } = getGradeInfo(grade)
									const attendanceStatus = getAttendanceStatus(student.id, lesson.date)
									const attendanceInfo = getAttendanceInfo(attendanceStatus)
									const isEditing =
										editingCell?.studentId === student.id && editingCell?.date === lesson.date
									const isSaving = isCellSaving(student.id, lesson.date)
									const isRecentlyEdited = isCellRecentlyEdited(student.id, lesson.date)
									const isNewlyAdded = isGradeNewlyAdded(student.id, lesson.date)
									const isAttendanceDropdownOpen =
										attendanceDropdownOpen === `${student.id}-${lesson.date}`
									const isCommentModalOpen =
										commentModalOpen?.studentId === student.id &&
										commentModalOpen?.lessonDate === lesson.date

									return (
										<GradeCell
											key={`${student.id}-${lesson.date}`}
											$isEdited={isRecentlyEdited}
											$isSaving={isSaving}
										>
											{isEditing ? (
												<GradeEditContainer ref={wrapperRef}>
													<GradeInput
														ref={inputRef}
														type='text'
														autoFocus
														value={editValue}
														onChange={e => setEditValue(e.target.value)}
														onKeyDown={handleKeyDown}
														onClick={e => e.stopPropagation()}
													/>
													<ActionButtons>
														<ActionButton
															$type='save'
															onClick={e => {
																e.stopPropagation()
																handleGradeSave()
															}}
															title='Save grade'
														>
															<Save size={14} />
														</ActionButton>
														<ActionButton
															$type='cancel'
															onClick={e => {
																e.stopPropagation()
																setEditingCell(null)
															}}
															title='Cancel'
														>
															<X size={14} />
														</ActionButton>
													</ActionButtons>
												</GradeEditContainer>
											) : isSaving ? (
												<SavingIndicator>
													<Loader size={20} />
													<SavingText>Saving...</SavingText>
												</SavingIndicator>
											) : (
												<CellContentWrapper>
													{/* Grade component */}
													{grade !== undefined ? (
														<GradeStatus
															onClick={() => handleCellClick(student.id, lesson.date)}
															$color={color}
														>
															<GradeValue>{grade}</GradeValue>
															{isRecentlyEdited && (
																<UpdatedIndicator title='Recently updated'>
																	<Check size={12} />
																</UpdatedIndicator>
															)}
															{isNewlyAdded && (
																<NewGradeIndicator title='Newly added grade'>
																	<span>NEW</span>
																</NewGradeIndicator>
															)}
														</GradeStatus>
													) : (
														<EmptyGradeStatus
															onClick={() => handleCellClick(student.id, lesson.date)}
														>
															<Plus size={14} />
														</EmptyGradeStatus>
													)}

													{/* Attendance dropdown button */}
													<AttendanceButtonContainer>
														<AttendanceButton
															$color={attendanceInfo.color}
															title={`Attendance: ${attendanceStatus || 'Not marked'}`}
															onClick={e => handleAttendanceClick(e, student.id, lesson.date)}
														>
															{attendanceInfo.icon}
														</AttendanceButton>

														{/* Attendance dropdown */}
														{isAttendanceDropdownOpen && (
															<AttendanceDropdown ref={attendanceDropdownRef}>
																<AttendanceOption
																	$isSelected={attendanceStatus === 'present'}
																	$color='success'
																	onClick={e => {
																		e.stopPropagation()
																		handleAttendanceChange(student.id, lesson.date, 'present')
																	}}
																>
																	<AttendanceIcon>✅</AttendanceIcon>
																	<AttendanceText>Present</AttendanceText>
																</AttendanceOption>
																<AttendanceOption
																	$isSelected={attendanceStatus === 'late'}
																	$color='warning'
																	onClick={e => {
																		e.stopPropagation()
																		handleAttendanceChange(student.id, lesson.date, 'late')
																	}}
																>
																	<AttendanceIcon>⏰</AttendanceIcon>
																	<AttendanceText>Late</AttendanceText>
																</AttendanceOption>
																<AttendanceOption
																	$isSelected={attendanceStatus === 'absent'}
																	$color='danger'
																	onClick={e => {
																		e.stopPropagation()
																		handleAttendanceChange(student.id, lesson.date, 'absent')
																	}}
																>
																	<AttendanceIcon>❌</AttendanceIcon>
																	<AttendanceText>Absent</AttendanceText>
																</AttendanceOption>
																<AttendanceOption
																	$isSelected={attendanceStatus === 'excused'}
																	$color='primary'
																	onClick={e => {
																		e.stopPropagation()
																		handleAttendanceChange(student.id, lesson.date, 'excused')
																	}}
																>
																	<AttendanceIcon>📝</AttendanceIcon>
																	<AttendanceText>Excused</AttendanceText>
																</AttendanceOption>
															</AttendanceDropdown>
														)}
													</AttendanceButtonContainer>

													{/* Comment button */}
													<CommentButton
														title='Add/edit comment'
														onClick={e => handleCommentClick(e, student.id, lesson.date)}
													>
														<Edit2 size={14} />
													</CommentButton>
												</CellContentWrapper>
											)}
										</GradeCell>
									)
								})}
							</StudentRow>
						))}
					</TableBody>
				</JournalTable>
			</TableScrollContainer>
		</JournalContainer>
	)
}

// Styled Components
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
	overflow-y: auto;
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

const TableBody = styled.tbody``

interface StudentRowProps {
	$isEven: boolean
}

const StudentRow = styled.tr<StudentRowProps>`
	background-color: ${props => (props.$isEven ? 'white' : props.theme.colors.background.lighter)};

	&:hover {
		background-color: ${props => props.theme.colors.primary[50]};
	}
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
	font-weight: 600;
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.primary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	margin-bottom: 2px;
`

const LessonDate = styled.div`
	font-size: 0.75rem;
	color: ${props => props.theme.colors.text.secondary};
`

const DateText = styled.div`
	display: block;
	font-size: 0.875rem;
`

const StudentNameCell = styled.td`
	padding: 12px 20px;
	position: sticky;
	left: 0;
	z-index: 2;
	background-color: inherit;
	box-shadow: 1px 0 3px rgba(0, 0, 0, 0.05);
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const StudentName = styled.div`
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

interface GradeCellProps {
	$isEdited: boolean
	$isSaving: boolean
}

const GradeCell = styled.td<GradeCellProps>`
	padding: 12px 6px;
	text-align: center;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	cursor: ${props => (props.$isSaving ? 'wait' : 'pointer')};
	transition: all 0.2s ease;
	background-color: ${props => {
		if (props.$isSaving) return props.theme.colors.neutral[50]
		return 'inherit'
	}};
	min-width: 140px; /* Ensure enough space for the three buttons */
`

interface GradeValueProps {
	$hasValue: boolean
	$isEdited: boolean
}

const GradeValue = styled.div`
	font-size: 1rem;
	font-weight: bold;
`

interface GradeStatusProps {
	$color: string
}

const GradeStatus = styled.div<GradeStatusProps>`
	position: relative;
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	padding: 0;
	border-radius: 50%;
	font-weight: 500;
	transition: transform 0.1s ease;
	user-select: none;

	&:hover {
		transform: scale(1.1);
	}

	${props => {
		switch (props.$color) {
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

const EmptyGradeStatus = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	color: ${props => props.theme.colors.text.tertiary};
	background-color: ${props => props.theme.colors.background.lighter};
	border: 1px dashed ${props => props.theme.colors.border.light};
	transition: all 0.2s ease;
	cursor: pointer;

	&:hover {
		transform: scale(1.1);
		color: ${props => props.theme.colors.primary[500]};
		background-color: ${props => props.theme.colors.primary[50]};
		border-color: ${props => props.theme.colors.primary[300]};
	}
`

const GradeEditContainer = styled.div`
	position: relative;
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
`

const ActionButtons = styled.div`
	display: flex;
	gap: 4px;
	margin-top: 4px;
`

interface ActionButtonProps {
	$type: 'save' | 'cancel'
}

const ActionButton = styled.button<ActionButtonProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 4px;
	border: none;
	cursor: pointer;
	background-color: ${props =>
		props.$type === 'save' ? props.theme.colors.success[500] : props.theme.colors.danger[500]};
	color: white;

	&:hover {
		background-color: ${props =>
			props.$type === 'save' ? props.theme.colors.success[600] : props.theme.colors.danger[600]};
	}
`

const GradeInput = styled.input`
	width: 60px;
	padding: 6px 8px;
	text-align: center;
	font-size: 1rem;
	font-weight: 500;
	border: 1px solid ${props => props.theme.colors.primary[300]};
	border-radius: 6px;
	outline: none;
	background-color: white;

	&:focus {
		border-color: ${props => props.theme.colors.primary[500]};
		box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[200]};
	}
`

const UpdatedIndicator = styled.div`
	position: absolute;
	top: -4px;
	right: -4px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.success[500]};
	color: white;
`

const NewGradeIndicator = styled.div`
	position: absolute;
	top: -15px;
	right: -8px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2px 4px;
	border-radius: 4px;
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	font-size: 0.6rem;
	font-weight: bold;
	letter-spacing: 0.5px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	animation: fadeInOut 5s forwards;

	@keyframes fadeInOut {
		0% {
			opacity: 0;
			transform: translateY(-5px);
		}
		10% {
			opacity: 1;
			transform: translateY(0);
		}
		80% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
`

const EditIndicator = styled.div`
	position: absolute;
	bottom: -4px;
	right: -4px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.primary[100]};
	color: ${props => props.theme.colors.primary[500]};
`

const SavingIndicator = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	color: ${props => props.theme.colors.primary[500]};

	svg {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`

const SavingText = styled.div`
	font-size: 0.7rem;
	color: ${props => props.theme.colors.text.secondary};
`

const CellContentWrapper = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 4px;
	min-height: 44px; /* Ensure consistent cell height */
`

interface AttendanceButtonProps {
	$color: string
}

const AttendanceButton = styled.div<AttendanceButtonProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	cursor: pointer;
	transition: transform 0.15s ease;
	font-size: 16px;

	&:hover {
		transform: scale(1.1);
	}

	${props => {
		switch (props.$color) {
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

const CommentButton = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.neutral[50]};
	color: ${props => props.theme.colors.neutral[600]};
	border: 1px solid ${props => props.theme.colors.neutral[200]};
	cursor: pointer;
	transition: transform 0.15s ease;

	&:hover {
		transform: scale(1.1);
		background-color: ${props => props.theme.colors.neutral[100]};
		color: ${props => props.theme.colors.neutral[700]};
	}
`

// New components for attendance dropdown
const AttendanceButtonContainer = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`

const AttendanceDropdown = styled.div`
	position: absolute;
	top: 50%;
	left: 100%;
	transform: translateY(-50%);
	min-width: 120px;
	background-color: ${props => props.theme.colors.background.secondary};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	box-shadow: ${props => props.theme.shadows.lg};
	padding: ${props => props.theme.spacing[2]} 0;
	z-index: ${props => props.theme.zIndices.dropdown};
	margin-left: ${props => props.theme.spacing[2]};
`

interface AttendanceOptionProps {
	$isSelected: boolean
	$color: string
}

const AttendanceOption = styled.div<AttendanceOptionProps>`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
	cursor: pointer;
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.primary};
	background-color: ${props =>
		props.$isSelected ? props.theme.colors.background.tertiary : 'transparent'};
	font-weight: ${props => (props.$isSelected ? '600' : '400')};

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}

	span {
		// Style for the icon if needed
	}
`

const AttendanceIcon = styled.div`
	margin-right: 8px;
	font-size: 16px;
`

const AttendanceText = styled.div`
	font-size: 0.85rem;
`

// New components for comment modal
const CommentModal = styled.div`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background-color: white;
	border-radius: 8px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
	padding: 16px;
	z-index: 1000;
	width: 340px;
	max-width: 90vw;
`

const CommentModalHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};

	h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		color: ${props => props.theme.colors.text.primary};
	}
`

const CommentModalTitle = styled.h3`
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const CommentModalClose = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	color: ${props => props.theme.colors.text.secondary};
	padding: 4px;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		color: ${props => props.theme.colors.text.primary};
	}
`

const CommentTextarea = styled.textarea`
	width: 100%;
	height: 100px;
	padding: 8px 12px;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 6px;
	font-size: 0.9rem;
	resize: vertical;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[300]};
		box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
	}
`

const CommentModalFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	padding: 0 16px 16px;
`

interface CommentButtonProps {
	$primary?: boolean
}

const CommentModalButton = styled.button<CommentButtonProps>`
	padding: 6px 12px;
	border-radius: 6px;
	font-size: 0.85rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	${props =>
		props.$primary
			? `
		background-color: ${props.theme.colors.primary[500]};
		color: white;
		border: none;

		&:hover {
			background-color: ${props.theme.colors.primary[600]};
		}
	`
			: `
		background-color: white;
		color: ${props.theme.colors.text.primary};
		border: 1px solid ${props.theme.colors.border.light};

		&:hover {
			background-color: ${props.theme.colors.background.lighter};
		}
	`}
`

// Add overlay for the modal
const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 999;
`

const CommentModalBody = styled.div`
	padding: 0 16px 16px;
`

const CloseButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	color: ${props => props.theme.colors.text.secondary};
	padding: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;

	&:hover {
		background-color: ${props => props.theme.colors.neutral[100]};
		color: ${props => props.theme.colors.text.primary};
	}
`

export default UnifiedJournalTable
