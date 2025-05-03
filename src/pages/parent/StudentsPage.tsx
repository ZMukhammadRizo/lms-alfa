import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FaBook, FaUserGraduate } from 'react-icons/fa'
import { FiBarChart2, FiCalendar, FiCheckCircle, FiChevronRight, FiFileText } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { PageTitle } from '../../components/common'
import { supabase } from '../../services/supabaseClient'
import { useParentStudentStore } from '../../store/parentStudentStore'

interface Subject {
	id: string
	subjectname: string
}

interface Course {
	id: string
	name: string
	teacher: string
	grade: string
	subjectId: string
}

interface Student {
	category: any
	level: any
	id: string
	firstName: string
	lastName: string
	grade?: string
	className?: string
	teacher?: string
	attendance?: string
	grades?: string
	assignments?: number
	courses: Course[]
}

// Subject data type for grouped scores
interface SubjectData {
	subjectId: string
	subjectName: string
	scores: number[]
	total: number
	count: number
}

interface ClassInfo {
	id: string
	classname: string
	grade?: string
	level?: {
		id: string
		name: string
	}
	category?: {
		id: string
		name: string
	}
	teacher?: {
		id: string
		firstName: string
		lastName: string
	}
}

const StudentsPage: React.FC = () => {
	const navigate = useNavigate()
	// Get the store without destructuring to avoid unused variable warnings
	const parentStudentStore = useParentStudentStore()
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [students, setStudents] = useState<Student[]>([])

	// Function to calculate letter grade from numerical score (1-10 scale)
	const calculateGradeLetter = (score: number) => {
		if (score >= 9) return 'A'
		if (score >= 7) return 'B'
		if (score >= 5) return 'C'
		if (score >= 3) return 'D'
		return 'F'
	}

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true)

				// Get current user
				const {
					data: { user },
				} = await supabase.auth.getUser()

				if (!user) {
					navigate('/auth/login')
					return
				}

				// 1. Fetch children with basic info
				const { data: childrenData, error: childrenError } = await supabase
					.from('users')
					.select('*')
					.eq('parent_id', user.id)

				if (childrenError) throw childrenError

				// 2. Get student's class assignments
				const { data: classStudentsData, error: classStudentsError } = await supabase
					.from('classstudents')
					.select('*')
					.in(
						'studentid',
						childrenData.map(child => child.id)
					)

				if (classStudentsError) throw classStudentsError

				// 3. Get the classes information
				const classIds = classStudentsData.map(cs => cs.classid)

				// Only proceed if there are classes to fetch
				if (classIds.length === 0) {
					setStudents([])
					setLoading(false)
					return
				}

				const { data: classesData, error: classesError } = await supabase
					.from('classes')
					.select(
						`
						*,
						teacher:users!classes_teacherid_fkey (
							id,
							firstName,
							lastName
						),
						level:levels(id, name),
						category:categories(id, name)
					`
					)
					.in('id', classIds)

				if (classesError) throw classesError

				// 4. Fetch the subjects for these classes
				const { data: classSubjectsData, error: classSubjectsError } = await supabase
					.from('classsubjects')
					.select(
						`
						*,
						subject:subjects (
							id,
							subjectname
						)
					`
					)
					.in('classid', classIds)

				if (classSubjectsError) throw classSubjectsError

				// 5. Fetch scores for all children
				const { data: scoresData, error: scoresError } = await supabase
					.from('scores')
					.select(
						`
						*,
						lessons (
							*,
							subjects (*)
						),
						quarters (*)
					`
					)
					.in(
						'student_id',
						childrenData.map(child => child.id)
					)

				if (scoresError) throw scoresError

				// 6. Fetch attendance for all children
				const { data: attendanceData, error: attendanceError } = await supabase
					.from('attendance')
					.select(
						`
						*,
						lessons (
							*,
							subjects (*)
						)
					`
					)
					.in(
						'student_id',
						childrenData.map(child => child.id)
					)

				if (attendanceError) throw attendanceError

				// Prepare student data with classes and subjects
				const studentsWithoutScores: Student[] = childrenData.map(child => {
					// Find the class assignment for this student
					const classAssignment = classStudentsData.find(cs => cs.studentid === child.id)

					// Find the class info if available
					const classInfo = classAssignment
						? classesData?.find(c => c.id === classAssignment.classid)
						: null

					// Format teacher name
					const teacherFullName = classInfo?.teacher
						? `${classInfo.teacher.firstName} ${classInfo.teacher.lastName}`
						: `Ms. ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(
								97 + Math.floor(Math.random() * 26)
						  )}`

					// Format class name properly with level and category: "10th Grade, B Class"
					const formattedClassName = classInfo
						? `${classInfo.level?.name || ''}, ${classInfo.category?.name || ''}`
						: `${Math.floor(Math.random() * 6) + 6}th Grade, Class ${String.fromCharCode(
								65 + Math.floor(Math.random() * 3)
						  )}`

					return {
						id: child.id,
						firstName: child.firstName,
						lastName: child.lastName,
						// Store grade separately for potential future use
						level: classInfo?.level?.name || `Unknown`,
						category: classInfo?.category?.name || `Unknown`,
						// Use the formatted class name for display
						className: formattedClassName,
						teacher: teacherFullName,
						attendance: undefined,
						grades: undefined,
						assignments: 4, // Default value
						courses: [],
					}
				})

				setStudents(studentsWithoutScores)

				// Calculate stats and create courses for each student
				const enhancedStudents = studentsWithoutScores.map(student => {
					// Find the class assignment for this student
					const classAssignment = classStudentsData.find(cs => cs.studentid === student.id)
					const classId = classAssignment?.classid

					// Get subjects enrolled for this student's class
					const enrolledSubjects = classId
						? classSubjectsData
								.filter(cs => cs.classid === classId)
								.map(cs => cs.subject)
								.filter(subject => subject !== null) // Filter out any null subjects
						: []

					// Filter scores for this student
					const studentScores = scoresData.filter(score => score.student_id === student.id)

					// Group scores by subject
					const scoresBySubject = studentScores.reduce((acc, score) => {
						const subjectId = score.lessons.subjects.id
						if (!acc[subjectId]) {
							acc[subjectId] = {
								subjectId,
								subjectName: score.lessons.subjects.subjectname,
								scores: [],
								total: 0,
								count: 0,
							}
						}
						acc[subjectId].scores.push(score.score)
						acc[subjectId].total += score.score
						acc[subjectId].count += 1
						return acc
					}, {} as Record<string, SubjectData>)

					// Calculate overall average score
					let totalScore = 0
					let scoreCount = 0

					// Type assertion to properly handle object values
					const subjectDataValues = Object.values(scoresBySubject) as SubjectData[]

					subjectDataValues.forEach(subjectData => {
						totalScore += subjectData.total
						scoreCount += subjectData.count
					})

					const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0
					const gradeLetterOverall = calculateGradeLetter(averageScore)

					// Calculate attendance percentage
					const studentAttendance = attendanceData.filter(
						record => record.student_id === student.id
					)
					let presentCount = 0
					studentAttendance.forEach(record => {
						if (record.status?.toLowerCase() === 'present') {
							presentCount++
						}
					})
					const attendancePercentage =
						studentAttendance.length > 0
							? Math.round((presentCount / studentAttendance.length) * 100)
							: 100

					// Create courses array with proper typing
					const courses: Course[] = subjectDataValues.map(subjectData => {
						const averageSubjectScore =
							subjectData.count > 0 ? subjectData.total / subjectData.count : 0
						return {
							id: subjectData.subjectId,
							name: subjectData.subjectName,
							teacher: student.teacher || 'Not assigned',
							grade: calculateGradeLetter(averageSubjectScore),
							subjectId: subjectData.subjectId,
						}
					})

					// Add any missing enrolled subjects as courses with no grade
					enrolledSubjects.forEach(subject => {
						if (subject && !courses.some(course => course.id === subject.id)) {
							courses.push({
								id: subject.id,
								name: subject.subjectname,
								teacher: 'Not assigned',
								grade: 'N/A',
								subjectId: subject.id,
							})
						}
					})

					return {
						...student,
						grades: gradeLetterOverall,
						attendance: `${attendancePercentage}%`,
						courses,
					}
				})

				setStudents(enhancedStudents)
				setLoading(false)
			} catch (err) {
				console.error('Error loading data:', err)
				setError('Failed to load student data')
				setLoading(false)
			}
		}

		loadData()
	}, [navigate])

	const handleViewGrades = (studentId: string) => {
		navigate(`/parent/grades?student=${studentId}`)
	}

	const handleViewAttendance = (studentId: string) => {
		navigate(`/parent/attendance?student=${studentId}`)
	}

	return (
		<PageContainer
			as={motion.div}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			<PageHeader>
				<div>
					<PageTitle>My Children</PageTitle>
					<PageDescription>Manage and view your children's academic information</PageDescription>
				</div>
			</PageHeader>

			{loading ? (
				<LoadingState>Loading student information...</LoadingState>
			) : error ? (
				<ErrorMessage>{error}</ErrorMessage>
			) : students.length === 0 ? (
				<EmptyState>
					<EmptyStateTitle>No students found</EmptyStateTitle>
					<EmptyStateText>There are no children associated with your account.</EmptyStateText>
				</EmptyState>
			) : (
				<StudentsGrid>
					{students.map((student, index) => (
						<StudentCard
							key={student.id}
							as={motion.div}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.1 }}
						>
							<StudentHeader>
								<Avatar>
									<FaUserGraduate />
								</Avatar>
								<StudentInfo>
									<StudentName>
										{student.firstName} {student.lastName}
									</StudentName>
									<StudentMeta>
										{student.level}th Grade • {student.category} Class
									</StudentMeta>
									<TeacherName>Class Teacher: {student.teacher}</TeacherName>
								</StudentInfo>
							</StudentHeader>

							<StatsContainer>
								<StatItem>
									<StatIcon $color='#4361ee'>
										<FiBarChart2 />
									</StatIcon>
									<StatContent>
										<StatValue>{student.grades || 'N/A'}</StatValue>
										<StatLabel>Avg. Grade</StatLabel>
									</StatContent>
								</StatItem>

								<StatItem>
									<StatIcon $color='#2ec4b6'>
										<FiCheckCircle />
									</StatIcon>
									<StatContent>
										<StatValue>{student.attendance || 'N/A'}</StatValue>
										<StatLabel>Attendance</StatLabel>
									</StatContent>
								</StatItem>

								<StatItem>
									<StatIcon $color='#e71d36'>
										<FiFileText />
									</StatIcon>
									<StatContent>
										<StatValue>{student.assignments}</StatValue>
										<StatLabel>Assignments</StatLabel>
									</StatContent>
								</StatItem>
							</StatsContainer>

							<SectionTitle>
								<SectionIcon>
									<FaBook />
								</SectionIcon>
								<span>Enrolled Courses</span>
							</SectionTitle>

							<CoursesList>
								{student.courses.map(course => (
									<CourseItem key={course.id}>
										<CourseDetails>
											<CourseName>{course.name}</CourseName>
											<CourseTeacher>{course.teacher}</CourseTeacher>
										</CourseDetails>
										<GradeBadge $grade={course.grade}>{course.grade}</GradeBadge>
										<ActionButton>
											<FiChevronRight />
										</ActionButton>
									</CourseItem>
								))}
							</CoursesList>

							<CardActions>
								<PrimaryButton onClick={() => handleViewGrades(student.id)}>
									<ButtonIcon>
										<FiBarChart2 />
									</ButtonIcon>
									View Grades
								</PrimaryButton>
								<SecondaryButton onClick={() => handleViewAttendance(student.id)}>
									<ButtonIcon>
										<FiCalendar />
									</ButtonIcon>
									View Attendance
								</SecondaryButton>
							</CardActions>
						</StudentCard>
					))}
				</StudentsGrid>
			)}
		</PageContainer>
	)
}

// Styled Components
const PageContainer = styled.div`
	padding: 24px;
`

const PageHeader = styled.div`
	margin-bottom: 32px;
`

const PageDescription = styled.p`
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	margin: 8px 0 0 0;
	font-size: 0.95rem;
`

const StudentsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
	gap: 24px;

	@media (max-width: 576px) {
		grid-template-columns: 1fr;
	}
`

const StudentCard = styled.div`
	background-color: ${props => props.theme?.colors?.neutral?.[50] || '#fff'};
	border-radius: 12px;
	box-shadow: ${props => props.theme?.shadows?.sm || '0 2px 8px rgba(0, 0, 0, 0.1)'};
	overflow: hidden;
	transition: all 0.3s ease;
	display: flex;
	flex-direction: column;
	height: 100%;

	&:hover {
		transform: translateY(-5px);
		box-shadow: ${props => props.theme?.shadows?.md || '0 4px 16px rgba(0, 0, 0, 0.12)'};
	}
`

const StudentHeader = styled.div`
	display: flex;
	align-items: center;
	padding: 24px;
	border-bottom: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};
`

const Avatar = styled.div`
	width: 64px;
	height: 64px;
	border-radius: 50%;
	background-color: ${props => props.theme?.colors?.primary?.[50] || '#e6f7ff'};
	color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24px;
	margin-right: 16px;
	flex-shrink: 0;
`

const StudentInfo = styled.div`
	flex: 1;
`

const StudentName = styled.h3`
	margin: 0 0 4px 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme?.colors?.text?.primary || '#000'};
`

const StudentMeta = styled.div`
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	font-size: 0.875rem;
	margin-bottom: 4px;
`

const TeacherName = styled.div`
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	font-size: 0.875rem;
`

const StatsContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	padding: 16px;
	border-bottom: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};
`

const StatItem = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 12px 0;
`

interface ColorProps {
	$color: string
}

const StatIcon = styled.div<ColorProps>`
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background-color: ${props => `${props.$color}15`};
	color: ${props => props.$color};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20px;
	margin-bottom: 12px;
`

const StatContent = styled.div`
	text-align: center;
`

const StatValue = styled.div`
	font-size: 1.125rem;
	font-weight: 600;
	color: ${props => props.theme?.colors?.text?.primary || '#000'};
	margin-bottom: 4px;
`

const StatLabel = styled.div`
	font-size: 0.75rem;
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
`

const SectionTitle = styled.h4`
	margin: 0;
	padding: 16px;
	font-size: 1rem;
	font-weight: 600;
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	display: flex;
	align-items: center;
`

const SectionIcon = styled.span`
	margin-right: 8px;
	color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
	display: flex;
	align-items: center;
`

const CoursesList = styled.div`
	padding: 0 16px;
	flex: 1;
`

const CourseItem = styled.div`
	display: flex;
	align-items: center;
	padding: 12px 0;
	border-bottom: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};

	&:last-child {
		border-bottom: none;
	}
`

const CourseDetails = styled.div`
	flex: 1;
`

const CourseName = styled.div`
	font-size: 0.95rem;
	font-weight: 500;
	color: ${props => props.theme?.colors?.text?.primary || '#000'};
	margin-bottom: 4px;
`

const CourseTeacher = styled.div`
	font-size: 0.75rem;
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
`

interface GradeProps {
	$grade: string
}

const GradeBadge = styled.div<GradeProps>`
	font-size: 0.875rem;
	font-weight: 600;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 16px;

	background-color: ${props => {
		if (props.$grade === 'N/A') return props.theme?.colors?.neutral?.[100] || '#f5f5f5'
		if (props.$grade.startsWith('A')) return props.theme?.colors?.success?.[50] || '#f6ffed'
		if (props.$grade.startsWith('B')) return props.theme?.colors?.primary?.[50] || '#e6f7ff'
		if (props.$grade.startsWith('C')) return props.theme?.colors?.warning?.[50] || '#fff7e6'
		return props.theme?.colors?.danger?.[50] || '#fff1f0'
	}};

	color: ${props => {
		if (props.$grade === 'N/A') return props.theme?.colors?.text?.secondary || '#999'
		if (props.$grade.startsWith('A')) return props.theme?.colors?.success?.[600] || '#52c41a'
		if (props.$grade.startsWith('B')) return props.theme?.colors?.primary?.[600] || '#1890ff'
		if (props.$grade.startsWith('C')) return props.theme?.colors?.warning?.[600] || '#d48806'
		return props.theme?.colors?.danger?.[600] || '#f5222d'
	}};
`

const ActionButton = styled.button`
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	border: none;
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	cursor: pointer;
	border-radius: 50%;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme?.colors?.background?.light || '#f5f5f5'};
		color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
	}
`

const CardActions = styled.div`
	display: flex;
	gap: 12px;
	padding: 16px;
	border-top: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};
	margin-top: auto;
`

const PrimaryButton = styled.button`
	flex: 1;
	padding: 10px 16px;
	background-color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
	color: white;
	border: none;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background-color: ${props => props.theme?.colors?.primary?.[600] || '#096dd9'};
	}
`

const SecondaryButton = styled.button`
	flex: 1;
	padding: 10px 16px;
	background-color: transparent;
	color: ${props => props.theme?.colors?.text?.primary || '#000'};
	border: 1px solid ${props => props.theme?.colors?.border?.light || '#d9d9d9'};
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		border-color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
		color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
	}
`

const ButtonIcon = styled.span`
	display: flex;
	align-items: center;
	margin-right: 8px;
	font-size: 16px;
`

const LoadingState = styled.div`
	padding: ${props => props.theme?.spacing?.[8] || '32px'};
	text-align: center;
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	font-size: 1rem;
	background-color: ${props => props.theme?.colors?.background?.secondary || '#f9f9f9'};
	border-radius: ${props => props.theme?.borderRadius?.lg || '12px'};
`

const ErrorMessage = styled.div`
	padding: ${props => props.theme?.spacing?.[4] || '16px'};
	background-color: ${props => props.theme?.colors?.danger?.[50] || '#fff1f0'};
	border: 1px solid ${props => props.theme?.colors?.danger?.[200] || '#ffccc7'};
	border-radius: ${props => props.theme?.borderRadius?.md || '8px'};
	color: ${props => props.theme?.colors?.danger?.[700] || '#cf1322'};
	margin-bottom: ${props => props.theme?.spacing?.[4] || '16px'};
	font-size: 1rem;
`

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: ${props => props.theme?.spacing?.[6] || '24px'};
	text-align: center;
	background-color: ${props => props.theme?.colors?.background?.secondary || '#f9f9f9'};
	border-radius: ${props => props.theme?.borderRadius?.lg || '12px'};
`

const EmptyStateTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme?.colors?.text?.primary || '#000'};
	margin-bottom: ${props => props.theme?.spacing?.[2] || '8px'};
`

const EmptyStateText = styled.p`
	font-size: 1rem;
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	max-width: 400px;
	margin-bottom: ${props => props.theme?.spacing?.[3] || '12px'};
`

export { StudentsPage }
