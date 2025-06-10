import supabase from '../config/supabaseClient'
import { GradeEntry, Student, Subject, TeacherClass } from '../types/grades'

export const getTeacherClasses = async (teacherId: string): Promise<TeacherClass[]> => {
	const { data, error } = await supabase
		.from('teacher_courses')
		.select('*, classes(*)')
		.eq('teacher_id', teacherId)

	if (error) throw error
	return data as TeacherClass[]
}

export const getClassesByGradeLevel = async (
	teacherId: string,
	gradeLevel: number
): Promise<TeacherClass[]> => {
	const { data, error } = await supabase
		.from('teacher_courses')
		.select('*, classes(*)')
		.eq('teacher_id', teacherId)
		.eq('classes.grade_level', gradeLevel)

	if (error) throw error
	return data as TeacherClass[]
}

export const getClassSubjects = async (classId: string): Promise<Subject[]> => {
	const { data, error } = await supabase
		.from('class_subjects')
		.select('*, subjects(*)')
		.eq('class_id', classId)

	if (error) throw error
	return data.map(item => item.subjects) as Subject[]
}

export const getClassStudents = async (classId: string): Promise<Student[]> => {
	const { data, error } = await supabase
		.from('classstudents')
		.select('*, users(*)')
		.eq('classid', classId)

	if (error) throw error

	// Map the data to properly format Student objects
	return data.map(item => ({
		id: item.users.id,
		firstName: item.users.firstName || '',
		lastName: item.users.lastName || '',
		fullName: `${item.users.firstName || ''} ${item.users.lastName || ''}`,
	})) as Student[]
}

// Get the count of students in a class
export const getClassStudentCount = async (classId: string): Promise<number> => {
	const { count, error } = await supabase
		.from('classstudents')
		.select('*', { count: 'exact', head: true })
		.eq('classid', classId)

	if (error) throw error
	return count || 0
}

// Interface for raw grade data from API
export interface GradeEntryResponse {
	id: string
	student_id: string
	lesson_id: string
	score: number | null
}

export const getStudentGrades = async (
	classId: string,
	subjectId: string,
	quarter: 'quarter1' | 'quarter2' | 'quarter3' | 'quarter4' | 'final' = 'quarter1'
): Promise<GradeEntryResponse[]> => {
	// Get the quarter ID first
	const { data: quarterData, error: quarterError } = await supabase
		.from('quarters')
		.select('id')
		.eq('name', quarter)
		.single()

	if (quarterError) throw quarterError

	// Get the lessons for this subject
	const { data: lessonData, error: lessonError } = await supabase
		.from('lessons')
		.select('id')
		.eq('subjectid', subjectId)

	if (lessonError) throw lessonError

	const lessonIds = lessonData.map(lesson => lesson.id)

	// Get scores for this class (via students), subject (via lessons), and quarter
	const { data: studentIds, error: studentError } = await supabase
		.from('classstudents')
		.select('studentid')
		.eq('classid', classId)

	if (studentError) throw studentError

	const studentIdList = studentIds.map(s => s.studentid)

	const { data, error } = await supabase
		.from('scores')
		.select('*')
		.eq('quarter_id', quarterData.id)
		.in('lesson_id', lessonIds)
		.in('student_id', studentIdList)

	if (error) throw error

	// Return raw response data
	return data as GradeEntryResponse[]
}

export const updateStudentGrade = async (
	gradeId: string,
	score: number | null
): Promise<GradeEntry> => {
	const { data, error } = await supabase
		.from('scores')
		.update({
			score,
			updated_at: new Date().toISOString(),
		})
		.eq('id', gradeId)
		.select()
		.single()

	if (error) throw error
	return data as GradeEntry
}

// Intermediate type for the request to upsert a grade
interface GradeDataRequest {
	student_id: string
	lesson_id: string
	quarter_id: string
	score: number | null
	updated_at?: string
	created_at?: string
}

export const upsertStudentGrade = async (gradeData: GradeDataRequest): Promise<GradeEntry> => {
	const now = new Date().toISOString()
	const dataWithTimestamps = {
		...gradeData,
		updated_at: now,
		created_at: gradeData.created_at || now, // Use existing created_at or set new for new records
	}

	const { data, error } = await supabase.from('scores').upsert(dataWithTimestamps).select().single()

	if (error) throw error

	// Map the response to the GradeEntry format
	return {
		id: data.id,
		studentId: data.student_id,
		lessonId: data.lesson_id,
		score: data.score,
	} as GradeEntry
}

// Define the structure for the summary data
export interface GradeLevelSummary {
	id: number // Assuming grade level is a number like 10
	name: string // e.g., "10th Grade"
	studentCount: number
	classCount: number
	subjectCount: number // Assuming we can get this count too
}

// Helper to get ordinal suffix (e.g., 1st, 2nd, 3rd, 10th)
const getOrdinalSuffix = (n: number): string => {
	if (n > 3 && n < 21) return 'th'
	switch (n % 10) {
		case 1:
			return 'st'
		case 2:
			return 'nd'
		case 3:
			return 'rd'
		default:
			return 'th'
	}
}

// Fetches summary data for each grade level
export const getGradeLevelSummaries = async (): Promise<GradeLevelSummary[]> => {
	try {
		// Fetch distinct grade levels along with their names from the 'levels' table
		// Assumes 'levels' table has 'id' (UUID) and 'name' (string)
		// Assumes 'classes' table has 'level_id' referencing 'levels.id'
		const { data: levelsData, error: levelsError } = await supabase
			.from('levels')
			.select('id, name')

		if (levelsError) throw levelsError

		// 2. Fetch counts for each grade level
		const summaries: GradeLevelSummary[] = []
		for (const level of levelsData) {
			// Count classes for this level using the level ID (UUID)
			const { count: classCount, error: classError } = await supabase
				.from('classes')
				.select('*', { count: 'exact', head: true })
				.eq('level_id', level.id)
			if (classError)
				console.warn(
					`Error counting classes for level ${level.name} (ID: ${level.id}):`,
					classError
				)

			// Get class IDs for this level to count students and subjects
			const { data: classIdsData, error: classIdsError } = await supabase
				.from('classes')
				.select('id')
				.eq('level_id', level.id)
			if (classIdsError) {
				console.warn(
					`Error getting class IDs for level ${level.name} (ID: ${level.id}):`,
					classIdsError
				)
				continue // Skip this level if we can't get class IDs
			}
			const classIds = classIdsData.map(c => c.id)

			let studentCount = 0
			if (classIds.length > 0) {
				try {
					const { data: studentData, error: studentError } = await supabase
						.from('classstudents')
						.select('studentid')
						.in('classid', classIds)
					if (studentError) throw studentError
					studentCount = new Set(studentData?.map(s => s.studentid) || []).size
				} catch (studentError) {
					console.error(
						`Error counting students for level ${level.name} (ID: ${level.id}):`,
						studentError
					)
				}
			}

			let subjectCount = 0
			if (classIds.length > 0) {
				try {
					const { data: subjectData, error: subjectError } = await supabase
						.from('classsubjects')
						.select('subjectid')
						.in('classid', classIds)
					if (subjectError) throw subjectError
					subjectCount = new Set(subjectData?.map(s => s.subjectid) || []).size
				} catch (subjectError) {
					console.error(
						`Error counting subjects for level ${level.name} (ID: ${level.id}):`,
						subjectError
					)
				}
			}

			// Use the fetched level name directly
			// Also, use level.id (which is likely a UUID string) for the id field in the summary,
			// but the GradeLevelSummary interface expects a number. We might need to adjust the interface or how the ID is used later.
			// For now, let's cast it to any to satisfy the current structure, but this should be revisited.
			summaries.push({
				id: level.id as any, // Cast to any - REVISIT THIS LATER
				name: level.name || `Level ${level.id}`, // Use fetched name, fallback to ID
				studentCount: studentCount || 0,
				classCount: classCount || 0,
				subjectCount: subjectCount || 0,
			})
		}

		// Sort summaries by name (assuming name is like "10th Grade", "11th Grade")
		summaries.sort((a, b) => {
			const numA = parseInt(a.name)
			const numB = parseInt(b.name)
			if (!isNaN(numA) && !isNaN(numB)) {
				return numA - numB
			}
			return a.name.localeCompare(b.name) // Fallback to string compare
		})

		return summaries
	} catch (error) {
		console.error('Error fetching grade level summaries:', error)
		throw error // Re-throw the error to be handled by the calling component
	}
}
