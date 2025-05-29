import { create } from 'zustand'
import supabase from '../config/supabaseClient'
import {
	ClassSubjectOverview,
	GradeLevelOverview,
	JournalTable,
	LevelCategoryOverview,
} from '../types/grades'

interface GradesState {
	// Data states
	levels: GradeLevelOverview[]
	classes: LevelCategoryOverview[]
	subjects: ClassSubjectOverview[]
	journalData: JournalTable | null
	activeQuarters: any[]

	// UI states
	isLoadingLevels: boolean
	isLoadingClasses: boolean
	isLoadingSubjects: boolean
	isLoadingJournal: boolean
	isLoadingQuarters: boolean

	// Current selection states
	selectedLevelId: string | null
	selectedClassId: string | null
	selectedSubjectId: string | null
	selectedQuarterId: string | null

	// Current selection states but their names, not ids
	selectedLevelName: string | null
	selectedClassName: string | null
	selectedSubjectName: string | null
	selectedQuarterName: string | null

	// Actions - fetch data
	fetchTeacherLevels: () => Promise<void>
	fetchLevelClasses: (levelId?: string) => Promise<void>
	fetchTeacherClasses: () => Promise<void>
	fetchClassSubjects: (classId: string) => Promise<void>
	fetchJournalData: (classId: string, subjectId: string, quarterId: string) => Promise<any>
	fetchActiveQuarters: () => Promise<any>
	fetchAllLevels: () => Promise<void>
	fetchAllClasses: () => Promise<void>

	// Actions - save data
	saveScore: (studentId: string, lessonId: string, quarterId: string, score: number) => Promise<any>

	// Actions - selection
	setSelectedLevel: (levelId: string | null) => void
	setSelectedClass: (classId: string | null) => void
	setSelectedSubject: (subjectId: string | null) => void
	setSelectedQuarter: (quarterId: string | null) => void
}

const useGradesStore = create<GradesState>((set, get) => ({
	// Initial data states
	levels: [],
	classes: [],
	subjects: [],
	journalData: null,
	activeQuarters: [],

	// Initial UI states
	isLoadingLevels: false,
	isLoadingClasses: false,
	isLoadingSubjects: false,
	isLoadingJournal: false,
	isLoadingQuarters: false,

	// Initial selection states
	selectedLevelId: null,
	selectedClassId: null,
	selectedSubjectId: null,
	selectedQuarterId: null,

	// Current selection states but their names, not ids
	selectedLevelName: null,
	selectedClassName: null,
	selectedSubjectName: null,
	selectedQuarterName: null,

	// Actions implementation
	fetchTeacherLevels: async () => {
		// Only prevent fetch if already loading
		if (get().isLoadingLevels) {
			console.log('[GradesStore] fetchTeacherLevels skipped (already loading).')
			return
		}

		set({ isLoadingLevels: true })
		try {
			const userResponse = await supabase.auth.getUser()
			const userId = userResponse.data.user?.id

			if (!userId) {
				throw new Error('User not logged in.')
			}

			// Get user role
			const { data: userData, error: userRoleError } = await supabase
				.from('users') // Assuming you have a 'users' table with a 'role' column
				.select('role')
				.eq('id', userId)
				.single()

			if (userRoleError) {
				console.error('[GradesStore] Error fetching user role:', userRoleError)
				throw userRoleError
			}
			const isAdmin = userData?.role === 'Admin'
			console.log(`[GradesStore] User role: ${userData?.role}. IsAdmin: ${isAdmin}`)

			let distinctLevelIds: string[] = []

			if (isAdmin) {
				console.log('[GradesStore] Admin user: fetching all distinct levels from all classes.')
				// Admin: Get all distinct level_ids from the classes table
				const { data: allClasses, error: allClassesError } = await supabase
					.from('classes')
					.select('level_id') // Select only level_id

				if (allClassesError) {
					console.error(
						'[GradesStore] Error fetching all classes for levels (Admin):',
						allClassesError
					)
					throw allClassesError
				}
				if (allClasses && allClasses.length > 0) {
					distinctLevelIds = [...new Set(allClasses.map(c => c.level_id).filter(id => id != null))]
				}
				console.log(
					`[GradesStore] Admin: Found distinct level IDs from all classes: ${distinctLevelIds.join(
						', '
					)}`
				)
			} else {
				// Teacher logic
				console.log(`[GradesStore] Teacher user: Fetching levels for teacher: ${userId}`)
				const { data: teacherClasses, error: classesError } = await supabase
					.from('classes')
					.select('level_id')
					.eq('teacherid', userId)

				if (classesError) {
					console.error(
						'[GradesStore] Error fetching teacher-specific classes for levels:',
						classesError
					)
					throw classesError
				}
				if (!teacherClasses || teacherClasses.length === 0) {
					console.log('[GradesStore] No classes found for this teacher to derive levels.')
					set({ levels: [], isLoadingLevels: false })
					return
				}
				distinctLevelIds = [
					...new Set(teacherClasses.map(c => c.level_id).filter(id => id != null)),
				]
				console.log(
					`[GradesStore] Teacher: Found distinct level IDs: ${distinctLevelIds.join(', ')}`
				)
			}

			if (distinctLevelIds.length === 0) {
				console.log('[GradesStore] No distinct levels found to fetch details for.')
				set({ levels: [], isLoadingLevels: false }) // Set loading false here
				return
			}

			const { data: levelsData, error: levelsError } = await supabase
				.from('levels')
				.select('id, name')
				.in('id', distinctLevelIds)

			if (levelsError) {
				console.error('[GradesStore] Error fetching level details by IDs:', levelsError)
				throw levelsError
			}

			const formattedLevels =
				levelsData?.map(
					(level): GradeLevelOverview => ({
						levelId: level.id,
						levelName: level.name || `Level ${level.id}`,
						classCount: 0,
						studentCount: 0,
						subjectCount: 0,
					})
				) || []

			console.log('[GradesStore] Setting formatted levels:', formattedLevels)
			set({ levels: formattedLevels }) // Set data
		} catch (error) {
			console.error('Error in fetchTeacherLevels (Admin/Teacher):', error)
			set({ levels: [] }) // Clear levels on error
		} finally {
			set({ isLoadingLevels: false }) // Ensure loading is false
		}
	},

	fetchLevelClasses: async (levelId?: string) => {
		set({ isLoadingClasses: true, classes: [] })
		try {
			console.log('Fetching classes for level:', levelId || 'all levels')

			const user = await supabase.auth.getUser()
			const userInPublic = await supabase
				.from('users')
				.select('*')
				.eq('id', user.data.user?.id)
				.single()

			const is_admin = userInPublic.data.role === 'Admin'

			const { data, error } = await supabase.rpc('get_level_classes', {
				user_id: userInPublic.data.id,
				lvl_id: levelId || null,
				is_admin,
			})

			if (error) {
				console.error('RPC error:', error)
				throw error
			}

			console.log('Received classes data:', data)

			// Make sure we're setting the correct level ID, not using the levelId as the name
			const currentLevel = get().levels.find(level => level.levelId === levelId)
			const levelName = currentLevel?.levelName || ''

			console.log('Setting selected level ID:', levelId)
			console.log('Setting selected level name:', levelName)

			set({
				classes: data || [],
				selectedLevelId: levelId || get().selectedLevelId,
				selectedLevelName: levelName || get().selectedLevelName,
			})
		} catch (error) {
			console.error('Error fetching level classes:', error)
		} finally {
			set({ isLoadingClasses: false })
		}
	},

	fetchTeacherClasses: async () => {
		// Only prevent fetch if already loading
		if (get().isLoadingClasses) {
			console.log('[GradesStore] fetchTeacherClasses skipped (already loading).')
			return
		}

		set({ isLoadingClasses: true }) // Set loading true, but don't clear classes here
		try {
			const userResponse = await supabase.auth.getUser()
			const userId = userResponse.data.user?.id

			if (!userId) {
				throw new Error('User not logged in for fetchTeacherClasses.')
			}

			const { data: userData, error: userRoleError } = await supabase
				.from('users')
				.select('role')
				.eq('id', userId)
				.single()

			if (userRoleError) {
				console.error(
					'[GradesStore] Error fetching user role for fetchTeacherClasses:',
					userRoleError
				)
				throw userRoleError
			}
			const isAdmin = userData?.role === 'Admin'
			console.log(
				`[GradesStore] fetchTeacherClasses - User role: ${userData?.role}. IsAdmin: ${isAdmin}`
			)

			let fetchedClassesData = []
			if (isAdmin) {
				console.log(
					'[GradesStore] Admin user: fetching all classes using get_level_classes RPC with is_admin=true, lvl_id=null'
				)
				const { data, error } = await supabase.rpc('get_level_classes', {
					user_id: userId,
					lvl_id: null,
					is_admin: true,
				})
				if (error) {
					console.error('[GradesStore] RPC error for admin get_level_classes:', error)
					throw error
				}
				console.log('[GradesStore] Admin: Received all classes data via RPC:', data)
				fetchedClassesData = data || []
			} else {
				// Teacher Logic
				console.log(
					`[GradesStore] Teacher user: fetching classes using get_teacher_classes RPC for teacher_uuid: ${userId}`
				)
				const { data, error } = await supabase.rpc('get_teacher_classes', {
					teacher_uuid: userId,
				})
				if (error) {
					console.error('[GradesStore] RPC error for teacher get_teacher_classes:', error)
					throw error
				}
				console.log('[GradesStore] Teacher: Received classes data via RPC:', data)
				fetchedClassesData = data || []
			}

			set({ classes: fetchedClassesData }) // Set data
		} catch (error) {
			console.error('Error in fetchTeacherClasses (Admin/Teacher):', error)
			set({ classes: [] }) // Clear classes on error
		} finally {
			set({ isLoadingClasses: false }) // Ensure loading is false
		}
	},

	fetchClassSubjects: async (classId: string) => {
		set({ isLoadingSubjects: true })
		try {
			const { data, error } = await supabase
				.from('classsubjects')
				.select(
					`
                    id,
                    classid,
                    subjectid,
                    subjects:subjectid(id, subjectname)
                `
				)
				.eq('classid', classId)

			if (error) throw error

			// Format the response to match the expected type
			const formattedSubjects = data.map(item => ({
				classId: item.classid,
				subjectId: item.subjectid,
				// @ts-ignore
				subjectName: item.subjects?.subjectname || 'Unknown Subject',
				lessonCount: 0, // Will be filled in the next step
			}))

			// Get lesson counts for each subject
			for (const subject of formattedSubjects) {
				const { count, error } = await supabase
					.from('lessons')
					.select('*', { count: 'exact' })
					.eq('subjectid', subject.subjectId)

				if (!error) {
					subject.lessonCount = count || 0
				}
			}

			set({
				subjects: formattedSubjects,
				selectedClassId: classId,
				selectedClassName: classId || get().selectedClassName,
			})
		} catch (error) {
			console.error('Error fetching class subjects:', error)
		} finally {
			set({ isLoadingSubjects: false })
		}
	},

	fetchJournalData: async (classId: string, subjectId: string, quarterId: string) => {
		// Only start loading if we're changing something
		const currentState = get()
		const isSameData =
			currentState.selectedClassId === classId &&
			currentState.selectedSubjectId === subjectId &&
			currentState.selectedQuarterId === quarterId &&
			currentState.journalData !== null

		// Compare more carefully before deciding to reload
		const hasData = Boolean(
			currentState.journalData?.lessons?.length || currentState.journalData?.students?.length
		)

		// If we're already showing the exact same data and have data, just return
		if (isSameData && hasData) {
			console.log('Same data, skipping fetch')
			return currentState.journalData
		}

		// Only set loading if we're actually changing data
		if (!isSameData) {
			set({ isLoadingJournal: true })
		}

		try {
			console.log(
				'Fetching journal data for class:',
				classId,
				'subject:',
				subjectId,
				'quarter:',
				quarterId
			)

			// Step 1: Get lessons for this subject
			const { data: lessonsData, error: lessonsError } = await supabase
				.from('lessons')
				.select('id, lessonname, uploadedat')
				.eq('subjectid', subjectId)
				.order('uploadedat', { ascending: true })

			if (lessonsError) throw lessonsError

			// Format lessons data
			const lessons = lessonsData.map(lesson => ({
				id: lesson.id,
				lessonName: lesson.lessonname || 'Unnamed Lesson',
				date: lesson.uploadedat,
			}))

			// Step 2: Get students for this class
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

			// Format students data with proper typing
			const students = studentsData.map((item: any) => ({
				id: item.studentid,
				firstName: item.users?.firstName || '',
				lastName: item.users?.lastName || '',
				fullName: `${item.users?.firstName || ''} ${item.users?.lastName || ''}`,
			}))

			// Step 3: Get scores for these students, lessons and quarter
			const { data: scoresData, error: scoresError } = await supabase
				.from('scores')
				.select('student_id, lesson_id, score')
				.eq('quarter_id', quarterId)
				.in(
					'lesson_id',
					lessons.map(l => l.id)
				)
				.in(
					'student_id',
					students.map(s => s.id)
				)

			if (scoresError) throw scoresError

			// Format scores data
			const scores = scoresData.map(score => ({
				studentId: score.student_id,
				lessonId: score.lesson_id,
				score: score.score,
			}))

			const journalData = {
				students,
				lessons,
				scores,
			}

			set({
				journalData,
				selectedClassId: classId,
				selectedSubjectId: subjectId,
				selectedQuarterId: quarterId,
				isLoadingJournal: false,
			})

			return journalData
		} catch (error) {
			console.error('Error fetching journal data:', error)
			set({ isLoadingJournal: false })
			return null
		}
	},

	fetchActiveQuarters: async () => {
		set({ isLoadingQuarters: true })
		try {
			const { data, error } = await supabase
				.from('quarters')
				.select('id, name, start_date, end_date')
				.order('start_date', { ascending: true })

			if (error) throw error

			set({
				activeQuarters: data || [],
				isLoadingQuarters: false,
			})

			return data || []
		} catch (error) {
			console.error('Error fetching quarters:', error)
			set({ isLoadingQuarters: false })
			return []
		}
	},

	fetchAllLevels: async () => {
		set({ isLoadingLevels: true })
		try {
			// Direct query to the levels table without teacher filter
			const { data: levelsData, error } = await supabase
				.from('levels')
				.select('id, name')
				.order('id', { ascending: true })

			if (error) throw error

			// Get enhanced data for each level
			const formattedLevels: GradeLevelOverview[] = await Promise.all(
				levelsData.map(async level => {
					// Get classes for this level
					const { data: classesData, error: classesError } = await supabase
						.from('classes')
						.select('id')
						.eq('level_id', level.id)

					if (classesError) {
						console.error('Error fetching classes for level:', classesError)
						return {
							levelId: level.id,
							levelName: level.name,
							classCount: 0,
							studentCount: 0,
							subjectCount: 0,
						}
					}

					const classCount = classesData?.length || 0
					const classIds = classesData?.map(c => c.id) || []

					let totalSubjectCount = 0

					// Only proceed if we have classes
					if (classIds.length > 0) {
						// Get total subject count for all classes in this level
						const { data: subjectsData, error: subjectsError } = await supabase
							.from('classsubjects')
							.select('subjectid')
							.in('classid', classIds)

						if (!subjectsError) {
							// Get unique subject IDs to avoid counting duplicates
							const uniqueSubjectIds = new Set(subjectsData?.map(s => s.subjectid))
							totalSubjectCount = uniqueSubjectIds.size
						}
					}

					return {
						levelId: level.id,
						levelName: level.name,
						classCount,
						studentCount: 0, // We don't have student data but keeping for future
						subjectCount: totalSubjectCount,
					}
				})
			)

			set({ levels: formattedLevels })
		} catch (error) {
			console.error('Error fetching all levels:', error)
		} finally {
			set({ isLoadingLevels: false })
		}
	},

	fetchAllClasses: async () => {
		set({ isLoadingClasses: true, classes: [] })
		try {
			// Direct query to classes without teacher filter
			const { data, error } = await supabase
				.from('classes')
				.select(
					`
					id,
					classname,
					level_id
				`
				)
				.order('level_id', { ascending: true })
				.order('classname', { ascending: true })

			if (error) throw error

			// Format and enhance the data
			const enhancedClasses: LevelCategoryOverview[] = []
			for (const classItem of data) {
				// No student count - table doesn't exist
				const studentCount = 0

				// Get subject count
				const { count: subjectCount, error: subjectCountError } = await supabase
					.from('classsubjects')
					.select('*', { count: 'exact' })
					.eq('classid', classItem.id)

				enhancedClasses.push({
					classId: classItem.id,
					classname: classItem.classname, // Use classname, not name
					levelId: classItem.level_id,
					studentCount: studentCount,
					subjectCount: subjectCountError ? 0 : subjectCount || 0,
				})
			}

			set({ classes: enhancedClasses })
		} catch (error) {
			console.error('Error fetching all classes:', error)
		} finally {
			set({ isLoadingClasses: false })
		}
	},

	saveScore: async (
		studentId: string,
		lessonId: string,
		quarterId: string,
		score: number
	): Promise<any> => {
		try {
			console.log(
				`Saving score: Student ${studentId}, Lesson ${lessonId}, Quarter ${quarterId}, Score ${score}`
			)

			const userId = (await supabase.auth.getUser()).data.user?.id
			const now = new Date().toISOString()

			// Use upsert to either insert a new score or update an existing one
			const { data, error } = await supabase.from('scores').upsert(
				{
					student_id: studentId,
					lesson_id: lessonId,
					quarter_id: quarterId,
					teacher_id: userId,
					score: score,
					updated_at: now,
					created_at: now, // This will only be used for new records
				},
				{
					onConflict: 'student_id,lesson_id,quarter_id',
					ignoreDuplicates: false,
				}
			)

			if (error) throw error

			// Update the score in the local state too
			const currentJournalData = get().journalData

			if (currentJournalData) {
				const updatedScores = [...currentJournalData.scores]
				const existingScoreIndex = updatedScores.findIndex(
					s => s.studentId === studentId && s.lessonId === lessonId
				)

				if (existingScoreIndex >= 0) {
					updatedScores[existingScoreIndex].score = score
				} else {
					updatedScores.push({
						studentId,
						lessonId,
						score,
					})
				}

				set({
					journalData: {
						...currentJournalData,
						scores: updatedScores,
					},
				})
			}

			return data
		} catch (error) {
			console.error('Error saving score:', error)
			throw error
		}
	},

	// Selection actions
	setSelectedLevel: (levelId: string | null) => set({ selectedLevelId: levelId }),
	setSelectedClass: (classId: string | null) => set({ selectedClassId: classId }),
	setSelectedSubject: (subjectId: string | null) => set({ selectedSubjectId: subjectId }),
	setSelectedQuarter: (quarterId: string | null) => set({ selectedQuarterId: quarterId }),

	// Selection actions but their names, not ids
	setSelectedLevelName: (levelName: string | null) => set({ selectedLevelName: levelName }),
	setSelectedClassName: (className: string | null) => set({ selectedClassName: className }),
	setSelectedSubjectName: (subjectName: string | null) => set({ selectedSubjectName: subjectName }),
	setSelectedQuarterName: (quarterName: string | null) => set({ selectedQuarterName: quarterName }),
}))

export default useGradesStore
