import { AttendanceResponse, ScoreResponse } from '../types/parent'
import { supabase } from './supabaseClient'

/**
 * Get all children of a parent user
 */
export const getParentChildren = async (parentId: string) => {
	try {
		const { data, error } = await supabase
			.from('users')
			.select('id, firstName, lastName')
			.eq('parent_id', parentId)

		if (error) throw error
		return data || []
	} catch (error) {
		console.error('Error fetching parent children:', error)
		throw error
	}
}

/**
 * Get all scores/grades for specified students
 */
export const getStudentsScores = async (childIds: string[]) => {
	if (!childIds.length) return []

	try {
		const { data, error } = await supabase
			.from('scores')
			.select(
				`
        *,
        lessons (
          lessonname,
          subjectid,
          subjects (
            subjectname
          )
        ),
        quarters (
          name
        )
      `
			)
			.in('student_id', childIds)

		if (error) throw error
		return (data as ScoreResponse[]) || []
	} catch (error) {
		console.error('Error fetching student scores:', error)
		throw error
	}
}

/**
 * Get all attendance records for specified students
 */
export const getStudentsAttendance = async (childIds: string[]) => {
	if (!childIds.length) return []

	try {
		const { data, error } = await supabase
			.from('attendance')
			.select(
				`
        *,
        lessons (
          lessonname,
          subjectid,
          subjects (
            subjectname
          )
        )
      `
			)
			.in('student_id', childIds)

		if (error) throw error
		return (data as AttendanceResponse[]) || []
	} catch (error) {
		console.error('Error fetching student attendance:', error)
		throw error
	}
}
