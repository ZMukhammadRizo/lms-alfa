import { toast } from 'react-toastify'
import { create } from 'zustand'
import supabase from '../config/supabaseClient'

// Types for submissions store
export interface SubmissionLevel {
	levelId: string
	levelName: string
	classCount: number
	studentCount: number
}

export interface SubmissionClass {
	classId: string
	classname: string
	levelId: string
	levelName: string
	studentCount: number
	submissionCount: number
}

export interface SubmissionStudent {
	studentId: string
	fullName: string
	email: string
	classId: string
	className: string
	submissionCount: number
	averageGrade: number | null
	lastSubmissionDate: string | null
}

export interface StudentSubmission {
	id: string
	fileurl: string[]
	submittedat: string
	grade: number | null
	feedback: string | null
	status: string | null
	assignmentId: string
	assignmentTitle: string
	subjectName: string
	quarterName: string
}

interface SubmissionsStore {
	// Data
	levels: SubmissionLevel[]
	classes: SubmissionClass[]
	students: SubmissionStudent[]
	submissions: StudentSubmission[]

	// Loading states
	isLoadingLevels: boolean
	isLoadingClasses: boolean
	isLoadingStudents: boolean
	isLoadingSubmissions: boolean

	// Error states
	levelsError: string | null
	classesError: string | null
	studentsError: string | null
	submissionsError: string | null

	// Actions
	fetchAdminLevels: () => Promise<void>
	fetchTeacherLevels: () => Promise<void>
	fetchAdminClasses: () => Promise<void>
	fetchTeacherClasses: () => Promise<void>
	fetchAdminLevelClasses: (levelId: string) => Promise<void>
	fetchTeacherLevelClasses: (levelId: string) => Promise<void>
	fetchClassStudents: (classId: string) => Promise<void>
	fetchStudentSubmissions: (studentId: string, classId?: string) => Promise<void>

	// Utility actions
	clearLevels: () => void
	clearClasses: () => void
	clearStudents: () => void
	clearSubmissions: () => void
	reset: () => void
}

const useSubmissionsStore = create<SubmissionsStore>((set, get) => ({
	// Initial state
	levels: [],
	classes: [],
	students: [],
	submissions: [],

	isLoadingLevels: false,
	isLoadingClasses: false,
	isLoadingStudents: false,
	isLoadingSubmissions: false,

	levelsError: null,
	classesError: null,
	studentsError: null,
	submissionsError: null,

	// Actions
	fetchAdminLevels: async () => {
		set({ isLoadingLevels: true, levelsError: null })

		try {
			// Fetch all levels for admin
			const { data: levelsData, error: levelsError } = await supabase
				.from('levels')
				.select('*')
				.order('name')

			if (levelsError) throw levelsError

			// For each level, count classes and students
			const levelsWithCounts = await Promise.all(
				(levelsData || []).map(async level => {
					// Count classes in this level
					const { count: classCount } = await supabase
						.from('classes')
						.select('*', { count: 'exact', head: true })
						.eq('level_id', level.id)

					// Count total students across all classes in this level
					const { data: classesData } = await supabase
						.from('classes')
						.select('student_count')
						.eq('level_id', level.id)

					const studentCount = (classesData || []).reduce(
						(total, cls) => total + (cls.student_count || 0),
						0
					)

					return {
						levelId: level.id,
						levelName: level.name,
						classCount: classCount || 0,
						studentCount,
					}
				})
			)

			set({ levels: levelsWithCounts, isLoadingLevels: false })
		} catch (error) {
			console.error('Error fetching admin levels:', error)
			set({ levelsError: 'Failed to load levels', isLoadingLevels: false })
			toast.error('Failed to load grade levels')
		}
	},

	fetchTeacherLevels: async () => {
		set({ isLoadingLevels: true, levelsError: null })

		try {
			// Get current user from auth context (we'll need to get user ID)
			const {
				data: { user },
			} = await supabase.auth.getUser()
			if (!user) throw new Error('User not authenticated')

			// First, get classes assigned to this teacher
			const { data: teacherClasses, error: teacherClassesError } = await supabase
				.from('classes')
				.select('id, level_id, student_count')
				.eq('teacherid', user.id)

			if (teacherClassesError) throw teacherClassesError

			if (!teacherClasses || teacherClasses.length === 0) {
				set({ levels: [], isLoadingLevels: false })
				return
			}

			// Get unique level IDs
			const levelIds = [...new Set(teacherClasses.map(cls => cls.level_id).filter(Boolean))]

			// Fetch level details
			const { data: levelsData, error: levelsError } = await supabase
				.from('levels')
				.select('*')
				.in('id', levelIds)
				.order('name')

			if (levelsError) throw levelsError

			// For each level, count teacher's classes and students
			const levelsWithCounts = levelsData.map(level => {
				const levelClasses = teacherClasses.filter(cls => cls.level_id === level.id)
				const classCount = levelClasses.length
				const studentCount = levelClasses.reduce(
					(total, cls) => total + (cls.student_count || 0),
					0
				)

				return {
					levelId: level.id,
					levelName: level.name,
					classCount,
					studentCount,
				}
			})

			set({ levels: levelsWithCounts, isLoadingLevels: false })
		} catch (error) {
			console.error('Error fetching teacher levels:', error)
			set({ levelsError: 'Failed to load levels', isLoadingLevels: false })
			toast.error('Failed to load grade levels')
		}
	},

	fetchAdminClasses: async () => {
		set({ isLoadingClasses: true, classesError: null })

		try {
			// Fetch all classes for admin - simplified query
			const { data: classesData, error: classesError } = await supabase
				.from('classes')
				.select('id, classname, level_id, student_count')
				.order('classname')

			if (classesError) throw classesError

			// For each class, count submissions via assignments table and get level name
			const classesWithCounts = await Promise.all(
				(classesData || []).map(async classItem => {
					// Get level name separately
					let levelName = 'Unknown Level'
					if (classItem.level_id) {
						const { data: levelData } = await supabase
							.from('levels')
							.select('name')
							.eq('id', classItem.level_id)
							.single()

						levelName = levelData?.name || 'Unknown Level'
					}

					// Count submissions for this class by querying assignments first
					const { data: assignments, error: assignmentsError } = await supabase
						.from('assignments')
						.select('id')
						.eq('classid', classItem.id)

					if (assignmentsError) {
						console.warn('Error fetching assignments for class:', assignmentsError)
					}

					const assignmentIds = (assignments || []).map(a => a.id)
					let submissionCount = 0

					if (assignmentIds.length > 0) {
						const { count } = await supabase
							.from('submissions')
							.select('*', { count: 'exact', head: true })
							.in('assignmentid', assignmentIds)

						submissionCount = count || 0
					}

					return {
						classId: classItem.id,
						classname: classItem.classname,
						levelId: classItem.level_id,
						levelName,
						studentCount: classItem.student_count || 0,
						submissionCount,
					}
				})
			)

			set({ classes: classesWithCounts, isLoadingClasses: false })
		} catch (error) {
			console.error('Error fetching admin classes:', error)
			set({ classesError: 'Failed to load classes', isLoadingClasses: false })
			toast.error('Failed to load classes')
		}
	},

	fetchTeacherClasses: async () => {
		set({ isLoadingClasses: true, classesError: null })

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser()
			if (!user) throw new Error('User not authenticated')

			// Fetch classes assigned to this teacher - simplified query
			const { data: classesData, error: classesError } = await supabase
				.from('classes')
				.select('id, classname, level_id, student_count')
				.eq('teacherid', user.id)
				.order('classname')

			if (classesError) throw classesError

			// For each class, count submissions via assignments table and get level name
			const classesWithCounts = await Promise.all(
				(classesData || []).map(async classItem => {
					// Get level name separately
					let levelName = 'Unknown Level'
					if (classItem.level_id) {
						const { data: levelData } = await supabase
							.from('levels')
							.select('name')
							.eq('id', classItem.level_id)
							.single()

						levelName = levelData?.name || 'Unknown Level'
					}

					// Count submissions for this class by querying assignments first
					const { data: assignments, error: assignmentsError } = await supabase
						.from('assignments')
						.select('id')
						.eq('classid', classItem.id)

					if (assignmentsError) {
						console.warn('Error fetching assignments for class:', assignmentsError)
					}

					const assignmentIds = (assignments || []).map(a => a.id)
					let submissionCount = 0

					if (assignmentIds.length > 0) {
						const { count } = await supabase
							.from('submissions')
							.select('*', { count: 'exact', head: true })
							.in('assignmentid', assignmentIds)

						submissionCount = count || 0
					}

					return {
						classId: classItem.id,
						classname: classItem.classname,
						levelId: classItem.level_id,
						levelName,
						studentCount: classItem.student_count || 0,
						submissionCount,
					}
				})
			)

			set({ classes: classesWithCounts, isLoadingClasses: false })
		} catch (error) {
			console.error('Error fetching teacher classes:', error)
			set({ classesError: 'Failed to load classes', isLoadingClasses: false })
			toast.error('Failed to load classes')
		}
	},

	fetchAdminLevelClasses: async (levelId: string) => {
		set({ isLoadingClasses: true, classesError: null })

		try {
			// First, let's verify the level exists
			const { data: levelCheck, error: levelError } = await supabase
				.from('levels')
				.select('id, name')
				.eq('id', levelId)
				.single()

			// Fetch all classes for this level (Admin sees all) - simplified query first
			const { data: classesData, error: classesError } = await supabase
				.from('classes')
				.select('id, classname, level_id, student_count, teacherid')
				.eq('level_id', levelId)
				.order('classname')

			if (classesError) throw classesError

			// Get level name separately since we simplified the query
			const levelName = levelCheck?.name || 'Unknown Level'

			// For each class, count submissions via assignments table
			const classesWithCounts = await Promise.all(
				(classesData || []).map(async classItem => {
					// Count submissions for this class by querying assignments first
					const { data: assignments, error: assignmentsError } = await supabase
						.from('assignments')
						.select('id')
						.eq('classid', classItem.id)

					if (assignmentsError) {
						console.warn('Error fetching assignments for class:', assignmentsError)
					}

					const assignmentIds = (assignments || []).map(a => a.id)
					let submissionCount = 0

					if (assignmentIds.length > 0) {
						const { count } = await supabase
							.from('submissions')
							.select('*', { count: 'exact', head: true })
							.in('assignmentid', assignmentIds)

						submissionCount = count || 0
					}

					return {
						classId: classItem.id,
						classname: classItem.classname,
						levelId: classItem.level_id,
						levelName,
						studentCount: classItem.student_count || 0,
						submissionCount,
					}
				})
			)

			set({ classes: classesWithCounts, isLoadingClasses: false })
		} catch (error) {
			console.error('Error fetching admin level classes:', error)
			set({ classesError: 'Failed to load classes', isLoadingClasses: false })
			toast.error('Failed to load classes')
		}
	},

	fetchTeacherLevelClasses: async (levelId: string) => {
		set({ isLoadingClasses: true, classesError: null })

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser()
			if (!user) throw new Error('User not authenticated')

			// Also check what level exists for teacher
			const { data: levelCheck, error: levelError } = await supabase
				.from('levels')
				.select('id, name')
				.eq('id', levelId)
				.single()

			// Fetch only classes assigned to this teacher in the specified level - simplified query
			const { data: classesData, error: classesError } = await supabase
				.from('classes')
				.select('id, classname, level_id, student_count, teacherid')
				.eq('level_id', levelId)
				.eq('teacherid', user.id)
				.order('classname')

			if (classesError) throw classesError

			// Get level name separately since we simplified the query
			const levelName = levelCheck?.name || 'Unknown Level'

			// For each class, count submissions via assignments table
			const classesWithCounts = await Promise.all(
				(classesData || []).map(async classItem => {
					// Count submissions for this class by querying assignments first
					const { data: assignments, error: assignmentsError } = await supabase
						.from('assignments')
						.select('id')
						.eq('classid', classItem.id)

					if (assignmentsError) {
						console.warn('Error fetching assignments for class:', assignmentsError)
					}

					const assignmentIds = (assignments || []).map(a => a.id)
					let submissionCount = 0

					if (assignmentIds.length > 0) {
						const { count } = await supabase
							.from('submissions')
							.select('*', { count: 'exact', head: true })
							.in('assignmentid', assignmentIds)

						submissionCount = count || 0
					}

					return {
						classId: classItem.id,
						classname: classItem.classname,
						levelId: classItem.level_id,
						levelName,
						studentCount: classItem.student_count || 0,
						submissionCount,
					}
				})
			)

			set({ classes: classesWithCounts, isLoadingClasses: false })
		} catch (error) {
			console.error('Error fetching teacher level classes:', error)
			set({ classesError: 'Failed to load classes', isLoadingClasses: false })
			toast.error('Failed to load classes')
		}
	},

	fetchClassStudents: async (classId: string) => {
		set({ isLoadingStudents: true, studentsError: null })

		try {
			// Fetch students in this class
			const { data: studentsData, error: studentsError } = await supabase
				.from('classstudents')
				.select(
					`
					studentid,
					users:studentid (
						id,
						fullName,
						email
					),
					classes:classid (
						id,
						classname
					)
				`
				)
				.eq('classid', classId)

			if (studentsError) throw studentsError

			// For each student, calculate submission statistics
			const studentsWithStats = await Promise.all(
				(studentsData || []).map(async item => {
					const user = (item as any).users
					const classInfo = (item as any).classes

					// Count submissions for this student in this class
					// First get assignments for this class
					const { data: classAssignments, error: assignmentsError } = await supabase
						.from('assignments')
						.select('id')
						.eq('classid', classId)

					if (assignmentsError) {
						console.warn('Error fetching class assignments:', assignmentsError)
					}

					const assignmentIds = (classAssignments || []).map(a => a.id)
					let submissions = []

					if (assignmentIds.length > 0) {
						const { data: submissionData, error: submissionsError } = await supabase
							.from('submissions')
							.select(
								`
								id,
								grade,
								submittedat,
								assignmentid
							`
							)
							.eq('studentid', user.id)
							.in('assignmentid', assignmentIds)

						if (submissionsError) {
							console.warn('Error fetching student submissions:', submissionsError)
						} else {
							submissions = submissionData || []
						}
					}

					const validSubmissions = submissions
					const submissionCount = validSubmissions.length

					// Calculate average grade
					const gradesSubmissions = validSubmissions.filter(s => s.grade !== null)
					const averageGrade =
						gradesSubmissions.length > 0
							? gradesSubmissions.reduce((sum, s) => sum + s.grade, 0) / gradesSubmissions.length
							: null

					// Get last submission date
					const lastSubmissionDate =
						validSubmissions.length > 0
							? validSubmissions.sort(
									(a, b) => new Date(b.submittedat).getTime() - new Date(a.submittedat).getTime()
							  )[0].submittedat
							: null

					return {
						studentId: user.id,
						fullName: user.fullName,
						email: user.email || '',
						classId: classInfo.id,
						className: classInfo.classname,
						submissionCount,
						averageGrade,
						lastSubmissionDate,
					}
				})
			)

			set({ students: studentsWithStats, isLoadingStudents: false })
		} catch (error) {
			console.error('Error fetching class students:', error)
			set({ studentsError: 'Failed to load students', isLoadingStudents: false })
			toast.error('Failed to load students')
		}
	},

	fetchStudentSubmissions: async (studentId: string, classId?: string) => {
		set({ isLoadingSubmissions: true, submissionsError: null })

		try {
			// First, get assignment IDs for filtering if classId is provided
			let assignmentIds: string[] = []

			if (classId) {
				const { data: classAssignments } = await supabase
					.from('assignments')
					.select('id')
					.eq('classid', classId)

				assignmentIds = (classAssignments || []).map(a => a.id)

				if (assignmentIds.length === 0) {
					// No assignments in this class, return empty result
					set({ submissions: [], isLoadingSubmissions: false })
					return
				}
			}

			// Simplified query for submissions
			let query = supabase
				.from('submissions')
				.select(
					`
					id,
					fileurl,
					submittedat,
					grade,
					feedback,
					status,
					assignmentid
				`
				)
				.eq('studentid', studentId)
				.order('submittedat', { ascending: false })

			// Filter by assignment IDs if class is specified
			if (classId && assignmentIds.length > 0) {
				query = query.in('assignmentid', assignmentIds)
			}

			const { data: submissionsData, error: submissionsError } = await query

			if (submissionsError) throw submissionsError

			// Get assignment details for each submission
			const transformedSubmissions = await Promise.all(
				(submissionsData || []).map(async item => {
					// Get assignment details
					const { data: assignmentData } = await supabase
						.from('assignments')
						.select(
							`
							id,
							title,
							classid,
							quarter_id,
							subject_id
						`
						)
						.eq('id', item.assignmentid)
						.single()

					let subjectName = 'Unknown Subject'
					let quarterName = 'Unknown Quarter'

					// Get subject name if subject_id exists
					if (assignmentData?.subject_id) {
						const { data: subjectData } = await supabase
							.from('subjects')
							.select('name')
							.eq('id', assignmentData.subject_id)
							.single()

						subjectName = subjectData?.name || 'Unknown Subject'
					}

					// Get quarter name if quarter_id exists
					if (assignmentData?.quarter_id) {
						const { data: quarterData } = await supabase
							.from('quarters')
							.select('name')
							.eq('id', assignmentData.quarter_id)
							.single()

						quarterName = quarterData?.name || 'Unknown Quarter'
					}

					return {
						id: item.id,
						fileurl: Array.isArray(item.fileurl)
							? item.fileurl
							: item.fileurl
							? [item.fileurl]
							: [],
						submittedat: item.submittedat,
						grade: item.grade,
						feedback: item.feedback,
						status: item.status,
						assignmentId: item.assignmentid,
						assignmentTitle: assignmentData?.title || 'Unknown Assignment',
						subjectName,
						quarterName,
					}
				})
			)

			set({ submissions: transformedSubmissions, isLoadingSubmissions: false })
		} catch (error) {
			console.error('Error fetching student submissions:', error)
			set({ submissionsError: 'Failed to load submissions', isLoadingSubmissions: false })
			toast.error('Failed to load submissions')
		}
	},

	// Utility actions
	clearLevels: () => set({ levels: [] }),
	clearClasses: () => set({ classes: [] }),
	clearStudents: () => set({ students: [] }),
	clearSubmissions: () => set({ submissions: [] }),

	reset: () =>
		set({
			levels: [],
			classes: [],
			students: [],
			submissions: [],
			isLoadingLevels: false,
			isLoadingClasses: false,
			isLoadingStudents: false,
			isLoadingSubmissions: false,
			levelsError: null,
			classesError: null,
			studentsError: null,
			submissionsError: null,
		}),
}))

export default useSubmissionsStore
