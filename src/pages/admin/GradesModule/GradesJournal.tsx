import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Loader, Save, X } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import { Variants, motion } from 'framer-motion'
import UnifiedJournalTable from '../../../components/common/UnifiedJournalTable'
import { ErrorMessage } from '../../../components/styled/TeacherComponents'
import { useAuth } from '../../../contexts/AuthContext'
import { getClassInfo, getGradeInfo } from '../../../services/gradesService'
import { supabase } from '../../../services/supabaseClient'
import useAttendanceStore from '../../../store/attendanceStore'
import useGradesStore from '../../../store/gradesStore'
import TopSection from './TopSection'

// Define useDebounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(handler)
		}
	}, [value, delay])

	return debouncedValue
}

// Get subject name from id
const getSubjectName = (subjectId: string): string => {
	// Use getState to access the store outside of a React component context
	const subjects = useGradesStore.getState().subjects
	const subject = subjects.find(s => s.subjectId === subjectId)
	return subject?.subjectName || `Subject ${subjectId}`
}

interface Quarter {
	id: string
	name: string
	start_date: string
	end_date: string
}

interface Student {
	id: string
	firstName: string
	lastName: string
	fullName: string
}

interface Lesson {
	id: string
	title: string
	date: string
}

interface Grade {
	id: string
	studentId: string
	lessonId: string
	score: number
}

interface EditButtonProps {
	$type: 'save' | 'cancel'
}

// Add a wrapper for ErrorMessage to fix type issues
const ErrorMessageWrapper = ({
	message,
	onRetry,
}: {
	message: string
	onRetry?: () => Promise<void>
}) => {
	return (
		<ErrorMessage
			// @ts-ignore
			message={message}
			onRetry={
				onRetry
					? () => {
							onRetry()
							return
					  }
					: undefined
			}
		/>
	)
}

// Add styled components at the beginning of the file
const LoaderContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
	width: 100%;

	svg {
		animation: spin 1s linear infinite;
		color: ${props => props.theme.colors.primary[500]};
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

const Text = styled.p<{ $size?: string; $weight?: string; $color?: string; $margin?: string }>`
	font-size: ${props => props.$size || '1rem'};
	font-weight: ${props => props.$weight || 'normal'};
	color: ${props => props.$color || props.theme.colors.text.primary};
	margin: ${props => props.$margin || '0'};
`

const Flex = styled.div<{ $gap?: string; $direction?: string; $align?: string; $justify?: string }>`
	display: flex;
	flex-direction: ${props => props.$direction || 'row'};
	align-items: ${props => props.$align || 'center'};
	justify-content: ${props => props.$justify || 'flex-start'};
	gap: ${props => props.$gap || '0.5rem'};
`

// Convert teacher data format to StudentJournalTable format
const convertDataForJournalTable = (
	filteredStudents: Array<{
		id: string
		firstName: string
		lastName: string
		fullName: string
	}>,
	lessons: Array<{
		id: string
		title: string
		date: string
	}>,
	grades: Array<{
		id: string
		studentId: string
		lessonId: string
		score: number
	}>,
	attendance: Array<{
		id: string
		lesson_id: string
		student_id: string
		status: string
		noted_at?: string
	}> = []
) => {
	// Create a lesson map for faster lookups
	const lessonMap = new Map<string, Lesson>()
	lessons.forEach(lesson => {
		lessonMap.set(lesson.id, lesson)
	})

	// Convert students to match the JournalData format
	const convertedStudents = filteredStudents.map(student => ({
		id: student.id, // Keep as string
		fullName: student.fullName,
	}))

	// Convert lessons to match the JournalData format
	const convertedLessons = lessons.map(lesson => ({
		date: lesson.date,
		topic: lesson.title,
		homework: '',
		id: lesson.id,
	}))

	// Convert grades to match the JournalData format (ensuring there are no nulls)
	const convertedGrades = grades
		.filter(
			grade =>
				grade &&
				typeof grade.score === 'number' &&
				!isNaN(grade.score) &&
				grade.studentId &&
				grade.lessonId
		)
		.map(grade => {
			const lesson = lessonMap.get(grade.lessonId)
			if (!lesson) {
				return null
			}

			// Find the attendance record for this student and lesson
			const attendanceRecord = attendance.find(
				a => a.student_id === grade.studentId && a.lesson_id === grade.lessonId
			)

			return {
				studentId: grade.studentId,
				date: lesson.date,
				grade: grade.score,
				// Include attendance status or default to 'absent'
				attendance: attendanceRecord?.status || 'absent',
			}
		})
		.filter(
			(grade): grade is { studentId: string; date: string; grade: number; attendance: string } =>
				grade !== null
		)

	// Add attendance-only records (where there's no grade but there is attendance)
	const attendanceOnlyRecords = attendance
		.filter(att => {
			// Skip if we already have a grade record for this student/lesson
			const hasGradeRecord = grades.some(
				g => g.studentId === att.student_id && g.lessonId === att.lesson_id
			)
			return !hasGradeRecord
		})
		.map(att => {
			const lesson = lessonMap.get(att.lesson_id)
			if (!lesson) return null

			return {
				studentId: att.student_id,
				date: lesson.date,
				grade: 0, // Default grade when attendance exists but no grade
				attendance: att.status,
			}
		})
		.filter(
			(record): record is { studentId: string; date: string; grade: number; attendance: string } =>
				record !== null
		)

	// Combine grade records and attendance-only records
	const allRecords = [...convertedGrades, ...attendanceOnlyRecords]

	return {
		students: convertedStudents,
		lessons: convertedLessons,
		grades: allRecords,
	}
}

const GradesJournal: React.FC = () => {
	const { gradeId, classId, subjectId } = useParams<{
		gradeId: string
		classId: string
		subjectId: string
	}>()

	// States
	const [students, setStudents] = useState<Student[]>([])
	const [lessons, setLessons] = useState<Lesson[]>([])
	const [grades, setGrades] = useState<Grade[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
	const [editingGrade, setEditingGrade] = useState<{
		studentId: string
		lessonId: string
		currentValue: number | null
	} | null>(null)
	const [inputValue, setInputValue] = useState('')
	const [savingGrade, setSavingGrade] = useState(false)
	const [showSuccessToast, setShowSuccessToast] = useState(false)
	const [showErrorToast, setShowErrorToast] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [quarters, setQuarters] = useState<Quarter[]>([])
	const [selectedQuarterId, setSelectedQuarterId] = useState<string>('')
	const [quarterDropdownOpen, setQuarterDropdownOpen] = useState(false)
	const [className, setClassName] = useState('')
	const [gradeName, setGradeName] = useState('')
	const [studentInEdit, setStudentInEdit] = useState<string | null>(null)
	const [lessonInEdit, setLessonInEdit] = useState<string | null>(null)
	const [editGradeValue, setEditGradeValue] = useState<number>(0)
	const [editError, setEditError] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [dataFetched, setDataFetched] = useState(false)

	const debouncedSearchQuery = useDebounce(searchQuery, 300)
	const inputRef = useRef<HTMLInputElement>(null)
	const quarterDropdownRef = useRef<HTMLDivElement>(null)
	const gradesStore = useGradesStore()
	const attendanceStore = useAttendanceStore()
	const { user } = useAuth()

	const attendance = useAttendanceStore(state => state.attendance)

	// Inside the component, add a ref to track if we're already fetching
	const isFetchingRef = useRef(false)

	// Get subject name from id

	// Get class name display from ID
	const fetchClassDisplayName = async (): Promise<void> => {
		try {
			// In a real app, this would be a Supabase call
			const classInfo = await getClassInfo(classId || '')
			console.log('Class Info: ', classInfo)

			setClassName(classInfo.name || `Class ${classId?.toUpperCase()}`)
		} catch (err) {
			console.error('Error fetching class name:', err)
			// Fallback to a formatted version of the ID
			setClassName(`Class ${classId?.toUpperCase()}`)
		}
	}

	// Get grade name display from ID
	const fetchGradeDisplayName = async (): Promise<void> => {
		try {
			// In a real app, this would be a Supabase call
			const gradeInfo = await getGradeInfo(gradeId || '')
			setGradeName(gradeInfo.name || `Grade ${gradeId}`)
		} catch (err) {
			console.error('Error fetching grade name:', err)
			// Fallback to a formatted version of the ID
			setGradeName(`Grade ${gradeId}`)
		}
	}

	// Set display names on component mount
	useEffect(() => {
		if (classId && gradeId) {
			fetchClassDisplayName()
			fetchGradeDisplayName()
		}
	}, [classId, gradeId])

	// Move fetchQuarters function here, before it's used in loadInitialData
	const fetchQuarters = async () => {
		try {
			// Use the store to fetch quarters
			const result = await gradesStore.fetchActiveQuarters()

			setQuarters(result)

			// If there are quarters and no currently selected quarter, select the first one
			if (result.length > 0 && !selectedQuarterId) {
				setSelectedQuarterId(result[0].id)
			}
		} catch (error) {
			console.error('Error fetching quarters:', error)
		}
	}

	// Add a new function to fetch attendance records directly from Supabase
	const fetchAttendanceRecords = async () => {
		try {
			if (!students.length || !lessons.length) {
				console.log('No students or lessons to fetch attendance for')
				return
			}

			console.log('Fetching attendance records for students and lessons')

			// Get student IDs and lesson IDs
			const studentIds = students.map(student => student.id)
			const lessonIds = lessons.map(lesson => lesson.id)

			// Fetch attendance records for these students and lessons
			const { data, error } = await supabase
				.from('attendance')
				.select('*')
				.in('student_id', studentIds)
				.in('lesson_id', lessonIds)

			if (error) {
				console.error('Error fetching attendance records:', error)
				return
			}

			console.log('Fetched attendance records:', data?.length || 0)

			// Update the store with the fetched records
			attendanceStore.setAttendance(data || [])
		} catch (err) {
			console.error('Error in fetchAttendanceRecords:', err)
		}
	}

	// Complete rewrite of loadInitialData to be more robust
	const loadInitialData = useCallback(async () => {
		if (isFetchingRef.current) return

		try {
			isFetchingRef.current = true
			setLoading(true)
			setError(null)

			// Step 1: Fetch quarters first
			const quartersResult = await gradesStore.fetchActiveQuarters()
			setQuarters(quartersResult)

			// Get a valid quarter ID
			let qId = selectedQuarterId
			if (!qId && quartersResult.length > 0) {
				qId = quartersResult[0].id
				setSelectedQuarterId(qId)
			}

			if (!qId) {
				throw new Error('No valid quarter ID available')
			}

			// Step 2: Fetch students directly from API
			let fetchedStudents: Student[] = []
			try {
				const { data, error } = await supabase
					.from('classstudents')
					.select(
						`
						studentid,
						users:studentid(id, firstName, lastName)
					`
					)
					.eq('classid', classId)

				if (error) throw error

				// Transform data to match Student interface
				fetchedStudents = data.map(item => ({
					id: item.studentid,
					// @ts-ignore - the structure is known but TS doesn't know it
					firstName: item.users?.firstName || '',
					// @ts-ignore
					lastName: item.users?.lastName || '',
					// @ts-ignore
					fullName: `${item.users?.firstName || ''} ${item.users?.lastName || ''}`,
				}))

				// Set students in component state
				setStudents(fetchedStudents)
				setFilteredStudents(fetchedStudents)
			} catch (err) {
				console.error('Error fetching students:', err)
				throw new Error('Failed to fetch students data')
			}

			// Step 3: Fetch lessons directly for subject
			let fetchedLessons: Lesson[] = []
			try {
				const { data: lessonsData, error: lessonsError } = await supabase
					.from('lessons')
					.select('*')
					.eq('subjectid', subjectId)
					.order('uploadedat', { ascending: true })

				if (lessonsError) throw lessonsError

				if (lessonsData.length > 0) {
					// Explicitly map lessons to the required format
					fetchedLessons = lessonsData.map(lesson => ({
						id: lesson.id,
						title: lesson.lessonname || '',
						date: lesson.uploadedat || new Date().toISOString(),
					}))

					// Set lessons in component state
					setLessons(fetchedLessons)
				} else {
					fetchedLessons = []
					setLessons([])
				}
			} catch (err) {
				console.error('Error fetching lessons:', err)
				throw new Error('Failed to fetch lessons data')
			}

			// Step 4: Fetch scores directly
			if (classId && subjectId && qId) {
				try {
					// We need both lesson IDs and student IDs to fetch scores
					const lessonIds = fetchedLessons.map(lesson => lesson.id)
					const studentIds = fetchedStudents.map(student => student.id)

					if (lessonIds.length > 0 && studentIds.length > 0) {
						const { data: scoresData, error: scoresError } = await supabase
							.from('scores')
							.select('id, student_id, lesson_id, score, quarter_id')
							.eq('quarter_id', qId)
							.in('lesson_id', lessonIds)
							.in('student_id', studentIds)

						if (scoresError) throw scoresError

						// If no scores found with the current filters, try fetching without quarter filter as a test
						if (scoresData?.length === 0) {
							const { data: allScoresData, error: allScoresError } = await supabase
								.from('scores')
								.select('id, student_id, lesson_id, score, quarter_id')
								.in('lesson_id', lessonIds)
								.in('student_id', studentIds)
								.limit(10)

							if (!allScoresError && allScoresData?.length > 0) {
								console.log('Found scores without quarter filter:', allScoresData)
							}
						}

						const formattedScores = (scoresData || []).map(score => ({
							id: score.id || `${score.student_id}-${score.lesson_id}`,
							score: score.score,
							studentId: score.student_id,
							lessonId: score.lesson_id,
						}))

						setGrades(formattedScores)
					} else {
						setGrades([])
					}
				} catch (err) {
					console.error('Error fetching scores:', err)
					// Don't throw here, as we can still show the journal without scores
					setGrades([])
				}

				setDataFetched(true)
			} else {
				console.error('Missing required parameters for fetching scores')
				throw new Error('Missing required parameters for fetching scores')
			}

			// After loading students and lessons, fetch attendance
			await fetchAttendanceRecords()
		} catch (err) {
			console.error('INIT DATA ERROR:', err)
			setError('Error loading data. Please try again.')
		} finally {
			setLoading(false)
			isFetchingRef.current = false
		}
	}, [classId, subjectId, selectedQuarterId, gradesStore]) // Dependencies

	// Also fix the initial useEffect - include loadInitialData in dependencies
	useEffect(() => {
		if (!classId || !subjectId) {
			return
		}

		// Only reset state and fetch if we're not already fetching
		if (!isFetchingRef.current) {
			// Clear state when component dependencies change
			setStudents([])
			setLessons([])
			setGrades([])
			setFilteredStudents([])
			setDataFetched(false)
			setLoading(true)

			// Load initial data immediately, no need for setTimeout
			loadInitialData().catch(err => {
				console.error('Error in initial data load:', err)
				setError('Failed to load initial data')
				setLoading(false)
			})
		}
	}, [classId, subjectId, loadInitialData])

	// Update the quarter change effect to also use the fetching ref
	useEffect(() => {
		// Skip initial render or when necessary params are missing
		if (!classId || !subjectId || !selectedQuarterId || isFetchingRef.current) return

		const updateJournalForQuarter = async () => {
			if (isFetchingRef.current) return

			try {
				isFetchingRef.current = true
				setLoading(true)

				// Reset the grades before fetching new ones
				setGrades([])

				// Directly fetch scores for the new quarter
				const lessonIds = lessons.map(lesson => lesson.id)
				const studentIds = students.map(student => student.id)

				if (lessonIds.length > 0 && studentIds.length > 0) {
					try {
						const { data: scoresData, error: scoresError } = await supabase
							.from('scores')
							.select('id, student_id, lesson_id, score, quarter_id')
							.eq('quarter_id', selectedQuarterId)
							.in('lesson_id', lessonIds)
							.in('student_id', studentIds)

						if (scoresError) throw scoresError

						const formattedScores = (scoresData || []).map(score => ({
							id: score.id || `${score.student_id}-${score.lesson_id}`,
							score: score.score,
							studentId: score.student_id,
							lessonId: score.lesson_id,
						}))

						setGrades(formattedScores)
					} catch (err) {
						console.error('Error fetching scores for quarter:', err)
						setGrades([])
					}
				}
			} finally {
				setLoading(false)
				isFetchingRef.current = false
			}
		}

		updateJournalForQuarter()
	}, [selectedQuarterId]) // Only depend on the quarter ID change, not classId or subjectId

	// Filter students based on search query
	useEffect(() => {
		console.log('Students updated - Current students count:', students.length)
		if (!debouncedSearchQuery.trim()) {
			console.log('Setting all students to filtered students')
			setFilteredStudents(students)
			return
		}

		const filtered = students.filter(student =>
			(student.fullName || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase())
		)
		console.log('Filtered students count:', filtered.length)
		setFilteredStudents(filtered)
	}, [debouncedSearchQuery, students])

	// Add a debug effect to log filteredStudents changes
	useEffect(() => {
		console.log('filteredStudents updated:', filteredStudents.length)
	}, [filteredStudents])

	// Add debug effect for lessons
	useEffect(() => {
		console.log('Lessons updated - current lessons count:', lessons.length)
	}, [lessons])

	// Get score for a student and lesson
	const getScoreForStudentAndLesson = (studentId: string, lessonId: string): number | null => {
		const grade = grades.find(g => g.studentId === studentId && g.lessonId === lessonId)
		return grade ? grade.score : null
	}

	// Handle edit grade
	const handleEditGrade = (studentId: string, lessonId: string) => {
		const currentGrade = getScoreForStudentAndLesson(studentId, lessonId)
		setEditingGrade({ studentId, lessonId, currentValue: currentGrade })
		setInputValue(currentGrade !== null ? currentGrade.toString() : '')
		// Set these as well to ensure the handleSaveGrade has the correct values
		setStudentInEdit(studentId)
		setLessonInEdit(lessonId)
		setTimeout(() => {
			inputRef.current?.focus()
		}, 10)
	}

	// Add a function to start editing a new grade when clicking on an empty cell
	const handleAddGrade = (studentId: string, lessonId: string) => {
		setEditingGrade({ studentId, lessonId, currentValue: null })
		setInputValue('')
		// Set these as well to ensure the handleSaveGrade has the correct values
		setStudentInEdit(studentId)
		setLessonInEdit(lessonId)
		setTimeout(() => {
			inputRef.current?.focus()
		}, 10)
	}

	// Handle grade input change
	const handleGradeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		// Only allow numbers 1-10
		if (
			value === '' ||
			(/^([1-9]|10)$/.test(value) && parseInt(value) >= 1 && parseInt(value) <= 10)
		) {
			setInputValue(value)
			if (value) {
				setEditGradeValue(parseInt(value))
			}
		}
	}

	// Handle grade changes from the StudentJournalTable
	const handleJournalTableGradeChange = (studentId: string, date: string, grade: number | null) => {
		// Find the lesson ID based on the date
		const lesson = lessons.find(lesson => lesson.date === date)
		if (!lesson) {
			console.error('Could not find lesson with date:', date)
			return
		}

		// Directly call handleSaveGrade with the parameters
		handleSaveGrade(studentId, lesson.id, grade)
	}

	// Save grade - refactored to take direct parameters instead of relying on state
	const handleSaveGrade = async (
		studentId?: string,
		lessonId?: string,
		scoreValue?: number | null
	) => {
		// Use parameters if provided, otherwise fall back to editingGrade state
		const effectiveStudentId = studentId || editingGrade?.studentId
		const effectiveLessonId = lessonId || editingGrade?.lessonId
		const effectiveScore =
			scoreValue !== undefined ? scoreValue : inputValue ? parseInt(inputValue) : null

		// Validate required parameters
		if (!effectiveStudentId || !effectiveLessonId) {
			console.error('Missing studentId or lessonId for grade save')
			return
		}

		// Validate the score
		if (effectiveScore !== null && (effectiveScore < 1 || effectiveScore > 10)) {
			setEditError('Grade must be between 1 and 10')
			return
		}

		try {
			setIsSaving(true)
			setEditError(null)

			// Find if there's an existing grade
			const existingGrade = grades.find(
				g => g.studentId === effectiveStudentId && g.lessonId === effectiveLessonId
			)

			if (existingGrade) {
				// Update existing grade
				if (effectiveScore === null) {
					// Delete the grade if score is null
					const { error } = await supabase
						.from('scores')
						.delete()
						.eq('student_id', effectiveStudentId)
						.eq('lesson_id', effectiveLessonId)

					if (error) throw error

					// Update local state
					setGrades(prevGrades =>
						prevGrades.filter(
							g => !(g.studentId === effectiveStudentId && g.lessonId === effectiveLessonId)
						)
					)
				} else {
					// Update the grade
					const now = new Date().toISOString()
					const { error } = await supabase
						.from('scores')
						.update({
							score: effectiveScore,
							teacher_id: user?.id,
							updated_at: now,
						})
						.eq('student_id', effectiveStudentId)
						.eq('lesson_id', effectiveLessonId)

					if (error) throw error

					// Update local state
					setGrades(prevGrades =>
						prevGrades.map(g =>
							g.studentId === effectiveStudentId && g.lessonId === effectiveLessonId
								? { ...g, score: effectiveScore }
								: g
						)
					)
				}
			} else if (effectiveScore !== null) {
				// Insert new grade
				const now = new Date().toISOString()
				const { data, error } = await supabase
					.from('scores')
					.insert({
						student_id: effectiveStudentId,
						lesson_id: effectiveLessonId,
						quarter_id: selectedQuarterId,
						teacher_id: user?.id,
						score: effectiveScore,
						created_at: now,
						updated_at: now,
					})
					.select()

				if (error) throw error

				// Get the new score ID from the response or generate one
				const newScoreId = data?.[0]?.id || `${effectiveStudentId}-${effectiveLessonId}`

				// Add to local state
				const newScore = {
					id: newScoreId,
					studentId: effectiveStudentId,
					lessonId: effectiveLessonId,
					score: effectiveScore,
				}

				setGrades(prevGrades => [...prevGrades, newScore])
			}

			// Clear editing state
			setEditingGrade(null)
			setInputValue('')

			// Show success toast
			setShowSuccessToast(true)
			setTimeout(() => setShowSuccessToast(false), 3000)
		} catch (error) {
			console.error('Error saving grade:', error)
			setErrorMessage(error instanceof Error ? error.message : 'Failed to save grade')
			setShowErrorToast(true)
			setTimeout(() => setShowErrorToast(false), 3000)
		} finally {
			setIsSaving(false)
		}
	}

	// Cancel editing
	const handleCancelEdit = () => {
		setEditingGrade(null)
		setInputValue('')
	}

	// Handle keyboard events
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSaveGrade()
		} else if (e.key === 'Escape') {
			handleCancelEdit()
		}
	}

	// Get letter grade from numeric grade
	const getLetterGrade = (grade: number | null): string => {
		if (grade === null) return '-'
		if (grade >= 9) return 'A+'
		if (grade >= 8) return 'A'
		if (grade >= 7) return 'B+'
		if (grade >= 6) return 'B'
		if (grade >= 5) return 'C+'
		if (grade >= 4) return 'C'
		if (grade >= 3) return 'D'
		if (grade >= 2) return 'E'
		return 'F'
	}

	// Get badge color based on grade
	const getGradeBadgeColor = (
		grade: number | null
	): 'success' | 'primary' | 'warning' | 'danger' | 'neutral' => {
		if (grade === null) return 'neutral'
		if (grade >= 8) return 'success'
		if (grade >= 6) return 'primary'
		if (grade >= 4) return 'warning'
		return 'danger'
	}

	// Animation variants
	const tableVariants: Variants = {
		hidden: {
			opacity: 0,
		},
		visible: {
			opacity: 1,
			transition: {
				when: 'beforeChildren',
				staggerChildren: 0.05,
			},
		},
	}

	const rowVariants: Variants = {
		hidden: {
			opacity: 0,
			y: 20,
		},
		visible: {
			opacity: 1,
			y: 0,
		},
	}

	// Define grid template for the journal table based on lessons
	const gridTemplateColumns = `minmax(200px, 1fr) repeat(${lessons.length}, minmax(80px, 100px))`

	// Return the correct display element based on whether we're editing or not
	const renderGradeCell = (studentId: string, lessonId: string) => {
		const currentGrade = getScoreForStudentAndLesson(studentId, lessonId)
		const isEditing =
			editingGrade && editingGrade.studentId === studentId && editingGrade.lessonId === lessonId

		if (isEditing) {
			return (
				<GradeEditInputWrapper>
					<GradeInput
						ref={inputRef}
						type='text'
						value={inputValue}
						onChange={handleGradeInputChange}
						onKeyDown={handleKeyDown}
						autoFocus
						placeholder='1-10'
					/>
					<EditButton
						$type='save'
						onClick={() => handleSaveGrade(studentId, lessonId, editGradeValue)}
						disabled={isSaving}
						title='Save grade'
					>
						<Save size={16} />
					</EditButton>
					<EditButton $type='cancel' onClick={handleCancelEdit} disabled={isSaving} title='Cancel'>
						<X size={16} />
					</EditButton>
				</GradeEditInputWrapper>
			)
		}

		if (currentGrade !== null) {
			return (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layout>
					<GradeBadge
						$color={getGradeBadgeColor(currentGrade)}
						onClick={() => handleEditGrade(studentId, lessonId)}
						title={`Score: ${currentGrade}/10. Click to edit.`}
					>
						{getLetterGrade(currentGrade)}
						<GradeIndicator>{currentGrade}</GradeIndicator>
					</GradeBadge>
				</motion.div>
			)
		}

		// Empty cell - click to add grade
		return (
			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layout>
				<EmptyGradeBadge
					onClick={() => handleAddGrade(studentId, lessonId)}
					title='Click to add grade'
				>
					<span>+</span>
				</EmptyGradeBadge>
			</motion.div>
		)
	}

	// Add this useEffect to handle clicking outside the dropdown
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				quarterDropdownRef.current &&
				!quarterDropdownRef.current.contains(event.target as Node)
			) {
				setQuarterDropdownOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	// Add this helper function to format dates nicely
	const formatDate = (dateString: string): string => {
		try {
			const date = new Date(dateString)
			return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
		} catch (e) {
			return ''
		}
	}

	// Add a function to calculate student average score
	const calculateStudentAverage = (studentId: string): number | null => {
		const studentGrades = grades.filter(g => g.studentId === studentId)
		if (studentGrades.length === 0) return null

		const sum = studentGrades.reduce((acc, grade) => acc + grade.score, 0)
		return parseFloat((sum / studentGrades.length).toFixed(1))
	}

	useEffect(() => {
		console.log(`Lessons: ${JSON.stringify(lessons)} `)
	}, [lessons])

	// Emergency fetch function that gets both students and lessons directly
	const fetchDataDirectly = async () => {
		console.log('EMERGENCY FETCH: Starting for class:', classId, 'subject:', subjectId)
		try {
			setLoading(true)

			// 1. Fetch students
			console.log('EMERGENCY FETCH: Fetching students for class:', classId)
			const { data: studentsData, error: studentsError } = await supabase
				.from('classstudents')
				.select(
					`
					studentid,
					users:studentid(id, firstName, lastName)
				`
				)
				.eq('classid', classId)

			if (studentsError) throw studentsError

			// Transform data to match Student interface
			const mappedStudents = studentsData.map(item => ({
				id: item.studentid,
				// @ts-ignore - the structure is known but TS doesn't know it
				firstName: item.users?.firstName || '',
				// @ts-ignore
				lastName: item.users?.lastName || '',
				// @ts-ignore
				fullName: `${item.users?.firstName || ''} ${item.users?.lastName || ''}`,
			}))

			console.log('EMERGENCY FETCH: Students count:', mappedStudents.length)
			setStudents(mappedStudents)
			setFilteredStudents(mappedStudents)

			// 2. Fetch lessons
			console.log('EMERGENCY FETCH: Fetching lessons for subject:', subjectId)
			const { data: lessonsData, error: lessonsError } = await supabase
				.from('lessons')
				.select('*')
				.eq('subjectid', subjectId)
				.order('uploadedat', { ascending: true })

			if (lessonsError) throw lessonsError

			// Map lessons to the required format
			const formattedLessons = lessonsData.map(lesson => ({
				id: lesson.id,
				title: lesson.lessonname || '',
				date: lesson.uploadedat || new Date().toISOString(),
			}))

			console.log('EMERGENCY FETCH: Lessons count:', formattedLessons.length)
			setLessons(formattedLessons)

			// Success message
			console.log('EMERGENCY FETCH: Successfully fetched data')
			setDataFetched(true)
		} catch (err) {
			console.error('EMERGENCY FETCH ERROR:', err)
			setError('Failed to fetch data directly')
		} finally {
			setLoading(false)
		}
	}

	// Add a handleGradeChange function to match JournalSection props
	const handleGradeChange = (studentId: string, lessonId: string, value: number | null) => {
		// Directly call handleSaveGrade with the parameters
		handleSaveGrade(studentId, lessonId, value)
	}

	// Update the handleAttendanceChange function
	const handleAttendanceChange = async (studentId: string, lessonId: string, status: string) => {
		try {
			console.log('Updating attendance:', {
				studentId,
				lessonId,
				status,
				quarterId: selectedQuarterId,
			})

			// Check if there's an existing attendance record
			const existingAttendance = attendance.find(
				a => a.student_id === studentId && a.lesson_id === lessonId
			)

			if (existingAttendance) {
				// Update existing attendance
				const { error } = await supabase
					.from('attendance')
					.update({
						status: status,
						noted_at: new Date().toISOString(),
					})
					.eq('student_id', studentId)
					.eq('lesson_id', lessonId)

				if (error) throw error
			} else {
				// Create new attendance record
				const { error } = await supabase.from('attendance').insert({
					student_id: studentId,
					lesson_id: lessonId,
					quarter_id: selectedQuarterId,
					status: status,
					noted_at: new Date().toISOString(),
				})

				if (error) throw error
			}

			// Fetch attendance records again after update
			await fetchAttendanceRecords()

			console.log('Attendance updated successfully')
		} catch (error) {
			console.error('Error updating attendance:', error)
		}
	}

	// Add a handler for comment updates
	const handleCommentChange = async (studentId: string, lessonId: string, comment: string) => {
		try {
			console.log('Updating comment:', { studentId, lessonId, comment })

			// Check if there's an existing record
			const existingRecord =
				attendanceStore.attendance.find(
					a => a.student_id === studentId && a.lesson_id === lessonId
				) || grades.find(g => g.studentId === studentId && g.lessonId === lessonId)

			if (existingRecord) {
				// Update existing record
				const { error } = await supabase
					.from('scores')
					.update({
						comment,
						teacher_id: user?.id,
					})
					.eq('student_id', studentId)
					.eq('lesson_id', lessonId)

				if (error) throw error
			} else {
				// Create new record with comment
				const { error } = await supabase.from('scores').insert({
					student_id: studentId,
					lesson_id: lessonId,
					quarter_id: selectedQuarterId,
					comment,
					teacher_id: user?.id,
					grade: 0,
					attendance: 'absent',
					created_at: new Date().toISOString(),
				})

				if (error) throw error
			}

			console.log('Comment updated successfully')
		} catch (error) {
			console.error('Error updating comment:', error)
		}
	}

	// Function to convert students for the AttendanceTab
	const convertStudentsForAttendance = useCallback(() => {
		// Filter out students with missing or invalid IDs
		return students
			.filter(student => student && student.id && typeof student.id === 'string')
			.map(student => ({
				id: student.id,
				fullName: student.fullName || `Student ${student.id}`,
			}))
	}, [students])

	// Function to get quarter name by ID
	const getQuarterNameById = useCallback(
		(id: string): string => {
			const quarter = quarters.find(q => q.id === id)
			return quarter?.name || ''
		},
		[quarters]
	)

	// Add a useEffect to refetch attendance when students or lessons change
	useEffect(() => {
		if (students.length > 0 && lessons.length > 0) {
			fetchAttendanceRecords()
		}
	}, [students, lessons])

	return (
		<PageContainer>
			<div className='flex flex-col h-full w-full'>
				{loading ? (
					<LoaderContainer>
						<Loader size={36} />
					</LoaderContainer>
				) : (
					<>
						{error ? (
							<ErrorMessageWrapper message={error} onRetry={loadInitialData} />
						) : (
							<>
								<Flex $direction='column' $gap='1rem'>
									{/* Top section */}
									<TopSection
										className={className}
										gradeName={gradeName}
										subjectName={getSubjectName(subjectId || '')}
										selectedQuarterId={selectedQuarterId}
										quarters={quarters}
										quarterDropdownOpen={quarterDropdownOpen}
										quarterDropdownRef={quarterDropdownRef}
										searchQuery={searchQuery}
										lessons={lessons}
										toggleQuarterDropdown={() => setQuarterDropdownOpen(!quarterDropdownOpen)}
										handleQuarterSelect={setSelectedQuarterId}
										setSearchQuery={setSearchQuery}
									/>

									<UnifiedJournalTable
										data={{
											students: convertDataForJournalTable(
												filteredStudents,
												lessons,
												grades,
												attendanceStore.attendance.map(attendance => ({
													...attendance,
													status: attendance.status || '',
												}))
											).students,
											lessons: convertDataForJournalTable(
												filteredStudents,
												lessons,
												grades,
												attendanceStore.attendance.map(attendance => ({
													...attendance,
													status: attendance.status || '',
												}))
											).lessons,
											grades: convertDataForJournalTable(
												filteredStudents,
												lessons,
												grades,
												attendanceStore.attendance.map(attendance => ({
													...attendance,
													status: attendance.status || '',
												}))
											).grades,
											attendance: attendanceStore.attendance.map(att => ({
												...att,
												status: att.status || '',
											})),
										}}
										onGradeChange={handleJournalTableGradeChange}
										onAttendanceChange={handleAttendanceChange}
										onCommentChange={handleCommentChange}
									/>
								</Flex>
							</>
						)}
					</>
				)}
			</div>
		</PageContainer>
	)
}

export default GradesJournal

const PageContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
`

const PageHeader = styled.header`
	background-color: white;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	padding: 16px 24px;
	position: sticky;
	top: 0;
	z-index: 10;
`

const HeaderContent = styled.div`
	max-width: 1400px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;

	h1 {
		font-size: 1.5rem;
		font-weight: 600;
		color: ${props => props.theme.colors.text.primary};
		margin: 8px 0 0 0;
	}
`

const BackLink = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	color: ${props => props.theme.colors.primary[600]};
	font-size: 0.875rem;
	font-weight: 500;
	background: none;
	border: none;
	padding: 0;
	cursor: pointer;

	&:hover {
		color: ${props => props.theme.colors.primary[700]};
		text-decoration: underline;
	}
`

const ContentContainer = styled.div`
	max-width: 1400px;
	width: 100%;
	margin: 0 auto;
	padding: 24px;
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
`

const ControlPanel = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: center;
	margin-bottom: 24px;
	padding: 16px;
	background-color: white;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: stretch;
	}
`

const SearchWrapper = styled.div`
	position: relative;
	flex: 1;
	min-width: 200px;
	display: flex;
	align-items: center;

	svg {
		position: absolute;
		left: 12px;
		color: ${props => props.theme.colors.text.secondary};
	}

	input {
		flex: 1;
		padding: 8px 12px 8px 40px;
		border: 1px solid ${props => props.theme.colors.border.light};
		border-radius: 8px;
		font-size: 0.9rem;

		&:focus {
			outline: none;
			border-color: ${props => props.theme.colors.primary[300]};
			box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
		}
	}
`

const ClearButton = styled.button`
	position: absolute;
	right: 10px;
	background: none;
	border: none;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	padding: 2px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;

	&:hover {
		background-color: ${props => props.theme.colors.neutral[100]};
		color: ${props => props.theme.colors.text.primary};
	}
`

const JournalTable = styled.div<{ $columns: string }>`
	display: grid;
	grid-template-columns: ${props => props.$columns};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 8px;
	overflow: hidden;
	background-color: white;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	overflow-x: auto;

	// Add alternating row colors for better readability
	& > div:nth-child(odd) > div:not(:first-child) {
		background-color: ${props => props.theme.colors.background.hover};
	}
`

const JournalHeader = styled.div`
	display: contents;

	& > div {
		padding: 12px 16px;
		background-color: ${props => props.theme.colors.background.lighter};
		font-weight: 600;
		color: ${props => props.theme.colors.text.secondary};
		border-bottom: 1px solid ${props => props.theme.colors.border.light};
		position: sticky;
		top: 0;
		z-index: 2;
		text-align: center;

		&:first-child {
			text-align: left;
		}
	}
`

const JournalBody = styled.div`
	display: contents;
`

const JournalRow = styled.div`
	display: contents;
	cursor: pointer;

	&:hover > div {
		background-color: ${props => props.theme.colors.background.hover};
	}
`

const StudentCell = styled.div`
	padding: 12px 16px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	display: flex;
	align-items: center;
	gap: 12px;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const GradeCell = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 60px;
	padding: 0 12px;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}

	&:empty::before {
		content: '+';
		position: absolute;
		font-size: 1.5rem;
		color: ${props => props.theme.colors.text.primary};
		opacity: 0.2;
		transition: opacity 0.2s ease;
	}

	&:hover:empty::before {
		opacity: 0.5;
	}

	// Add this to make it obvious that an empty cell can be clicked
	&:empty::after {
		content: 'Add';
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		font-size: 0.8rem;
		font-weight: 500;
		color: ${props => props.theme.colors.text.primary};
		background-color: rgba(0, 0, 0, 0.02);
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	&:hover:empty::after {
		opacity: 1;
	}
`

const GradeBadge = styled.div<{ $color: 'success' | 'primary' | 'warning' | 'danger' | 'neutral' }>`
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 40px;
	height: 40px;
	padding: 6px 12px;
	border-radius: 12px;
	font-weight: 600;
	font-size: 0.9rem;

	${props => {
		switch (props.$color) {
			case 'success':
				return `
						background-color: ${props.theme.colors.success[50]};
						color: ${props.theme.colors.success[700]};
						border: 1px solid ${props.theme.colors.success[200]};
					`
			case 'primary':
				return `
						background-color: ${props.theme.colors.primary[50]};
						color: ${props.theme.colors.primary[700]};
						border: 1px solid ${props.theme.colors.primary[200]};
					`
			case 'warning':
				return `
						background-color: ${props.theme.colors.warning[50]};
						color: ${props.theme.colors.warning[700]};
						border: 1px solid ${props.theme.colors.warning[200]};
					`
			case 'danger':
				return `
						background-color: ${props.theme.colors.danger[50]};
						color: ${props.theme.colors.danger[700]};
						border: 1px solid ${props.theme.colors.danger[200]};
					`
			default:
				return `
						background-color: ${props.theme.colors.neutral[100]};
						color: ${props.theme.colors.neutral[600]};
						border: 1px solid ${props.theme.colors.neutral[200]};
					`
		}
	}}
`

const GradeEditInputWrapper = styled.div`
	position: relative;
	display: flex;
	gap: 4px;
`

const GradeInput = styled.input`
	width: 60px;
	padding: 6px 8px;
	border: 2px solid ${props => props.theme.colors.primary[300]};
	border-radius: 8px;
	font-size: 0.9rem;
	text-align: center;
	color: ${props => props.theme.colors.text.primary};
	outline: none;
	font-weight: 600;

	&:focus {
		border-color: ${props => props.theme.colors.primary[500]};
		box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
	}
`

const EditButton = styled.button<EditButtonProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s ease;

	${props =>
		props.$type === 'save'
			? `
			background-color: ${props.theme.colors.success[500]};
			color: white;

			&:hover {
				background-color: ${props.theme.colors.success[600]};
			}
		`
			: `
			background-color: ${props.theme.colors.danger[500]};
			color: white;

			&:hover {
				background-color: ${props.theme.colors.danger[600]};
			}
		`}
`

// Add GradeIndicator styled component back
const GradeIndicator = styled.span`
	position: absolute;
	bottom: -2px;
	right: -2px;
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	font-size: 0.6rem;
	min-width: 14px;
	height: 14px;
	border-radius: 7px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	opacity: 0.8;
	pointer-events: none;
`

const EmptyGradeBadge = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 40px;
	height: 40px;
	border-radius: 12px;
	background-color: ${props => props.theme.colors.background.lighter};
	color: ${props => props.theme.colors.text.secondary};
	border: 1px dashed ${props => props.theme.colors.border.light};
	cursor: pointer;
	transition: all 0.2s ease;
	opacity: 0.6;

	span {
		font-size: 1.2rem;
		line-height: 1;
	}

	&:hover {
		border-color: ${props => props.theme.colors.primary[400]};
		background-color: ${props => props.theme.colors.primary[50]};
		color: ${props => props.theme.colors.primary[500]};
		opacity: 1;
	}
`
