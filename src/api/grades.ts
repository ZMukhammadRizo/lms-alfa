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
		.update({ score })
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
}

export const upsertStudentGrade = async (gradeData: GradeDataRequest): Promise<GradeEntry> => {
	const { data, error } = await supabase.from('scores').upsert(gradeData).select().single()

	if (error) throw error

	// Map the response to the GradeEntry format
	return {
		id: data.id,
		studentId: data.student_id,
		lessonId: data.lesson_id,
		score: data.score,
	} as GradeEntry
}
