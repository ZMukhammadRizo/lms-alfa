import { supabase } from './supabaseClient'

export interface Score {
	id?: string
	student_id: string
	lesson_id: string
	grade: number | null
	attendance: string
	comment: string | null
	teacher_id?: string | null
	created_at?: string
	updated_at?: string
}

/**
 * Fetch scores for a specific class, subject, and quarter
 */
export const fetchScores = async (
	classId: string,
	subjectId: string,
	quarterId: string
): Promise<Score[]> => {
	try {
		// Validate IDs to avoid UUID parsing errors
		if (!classId || !subjectId || !quarterId) {
			console.error('fetchScores: Invalid IDs provided', { classId, subjectId, quarterId })
			return []
		}

		// First, get the lessons for this subject and quarter
		const { data: lessons, error: lessonsError } = await supabase
			.from('lessons')
			.select('id')
			.eq('subjectid', subjectId)
			.eq('quarterid', quarterId)

		if (lessonsError) {
			console.error('fetchScores: Error fetching lessons:', lessonsError)
			throw lessonsError
		}

		if (!lessons || lessons.length === 0) {
			console.log('fetchScores: No lessons found for subject and quarter', { subjectId, quarterId })
			return []
		}

		const lessonIds = lessons.map(lesson => lesson.id)

		// Get the students for this class
		const { data: students, error: studentsError } = await supabase
			.from('classstudents')
			.select('studentid')
			.eq('classid', classId)

		if (studentsError) {
			console.error('fetchScores: Error fetching students:', studentsError)
			throw studentsError
		}

		if (!students || students.length === 0) {
			console.log('fetchScores: No students found for class', { classId })
			return []
		}

		const studentIds = students.map(student => student.studentid)

		// Now fetch the scores for these lessons and students
		const { data: scores, error: scoresError } = await supabase
			.from('scores')
			.select('*')
			.in('lesson_id', lessonIds)
			.in('student_id', studentIds)

		if (scoresError) {
			console.error('fetchScores: Error fetching scores:', scoresError)
			throw scoresError
		}

		return scores || []
	} catch (error) {
		console.error('Error in fetchScores:', error)
		throw error
	}
}

/**
 * Update or create a score entry
 */
export const updateScore = async (score: Score): Promise<Score> => {
	try {
		// Validate required fields
		if (!score.student_id || !score.lesson_id) {
			throw new Error('updateScore: Missing required fields: student_id and lesson_id are required')
		}

		const { data, error } = await supabase
			.from('scores')
			.upsert(
				{
					student_id: score.student_id,
					lesson_id: score.lesson_id,
					grade: score.grade,
					attendance: score.attendance,
					comment: score.comment,
					teacher_id: score.teacher_id,
					updated_at: new Date().toISOString(),
				},
				{
					onConflict: 'student_id,lesson_id',
				}
			)
			.select()
			.single()

		if (error) {
			console.error('Error updating score:', error)
			throw error
		}

		return data
	} catch (error) {
		console.error('Error in updateScore:', error)
		throw error
	}
}

/**
 * Fetch lessons for a specific subject and quarter
 */
export const fetchLessons = async (subjectId: string, quarterId: string): Promise<any[]> => {
	try {
		// Validate IDs to avoid UUID parsing errors
		if (!subjectId || !quarterId) {
			console.error('fetchLessons: Invalid IDs provided', { subjectId, quarterId })
			return []
		}

		console.log('[fetchLessons] Fetching with:', { subjectId, quarterId })

		// Log the database structure to verify table and column names
		console.log(
			`[fetchLessons] Making query: SELECT * FROM lessons WHERE subjectid='${subjectId}' AND quarterid='${quarterId}' ORDER BY date ASC`
		)

		const { data, error } = await supabase
			.from('lessons')
			.select('*')
			.eq('subjectid', subjectId)
			.eq('quarterid', quarterId)
			.order('date', { ascending: true })

		if (error) {
			console.error('[fetchLessons] Error fetching lessons:', error)
			throw error
		}

		console.log(
			`[fetchLessons] Found ${
				data?.length || 0
			} lessons for subject ${subjectId} and quarter ${quarterId}`,
			data
		)

		if (data && data.length === 0) {
			console.log('[fetchLessons] No lessons found. Checking if subject and quarter exist...')
			// Check if subject exists
			const { data: subjectData, error: subjectError } = await supabase
				.from('subjects')
				.select('id, subjectname')
				.eq('id', subjectId)
				.single()

			console.log('[fetchLessons] Subject check:', { subject: subjectData, error: subjectError })

			// Check if quarter exists
			const { data: quarterData, error: quarterError } = await supabase
				.from('quarters')
				.select('id, name')
				.eq('id', quarterId)
				.single()

			console.log('[fetchLessons] Quarter check:', { quarter: quarterData, error: quarterError })
		}

		return data || []
	} catch (error) {
		console.error('[fetchLessons] Error in fetchLessons:', error)
		throw error
	}
}

/**
 * Fetch students for a specific class
 */
export const fetchStudents = async (classId: string): Promise<any[]> => {
	try {
		// Validate ID to avoid UUID parsing errors
		if (!classId) {
			console.error('fetchStudents: Invalid classId provided', { classId })
			return []
		}

		console.log('fetchStudents: Fetching students for class:', classId)

		const { data, error } = await supabase
			.from('classstudents')
			.select(
				`
        studentid,
        users:studentid (
          id,
          firstName,
          lastName
        )
      `
			)
			.eq('classid', classId)

		if (error) {
			console.error('fetchStudents: Error fetching students:', error)
			throw error
		}

		const students = (data || []).map(item => {
			// Assuming users relationship returns an object, not an array
			const user = item.users as { firstName?: string; lastName?: string } | null
			return {
				id: item.studentid,
				fullName: `${user?.firstName || ''} ${user?.lastName || ''}`,
			}
		})

		console.log(`fetchStudents: Found ${students.length} students for class ${classId}`)
		return students
	} catch (error) {
		console.error('Error in fetchStudents:', error)
		throw error
	}
}
