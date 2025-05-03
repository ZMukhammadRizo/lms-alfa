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

// Define the structure for the summary data
export interface GradeLevelSummary {
	id: number; // Assuming grade level is a number like 10
	name: string; // e.g., "10th Grade"
	studentCount: number;
	classCount: number;
	subjectCount: number; // Assuming we can get this count too
}

// Helper to get ordinal suffix (e.g., 1st, 2nd, 3rd, 10th)
const getOrdinalSuffix = (n: number): string => {
	if (n > 3 && n < 21) return 'th'; 
	switch (n % 10) {
		case 1: return 'st';
		case 2: return 'nd';
		case 3: return 'rd';
		default: return 'th';
	}
};

// Fetches summary data for each grade level
export const getGradeLevelSummaries = async (): Promise<GradeLevelSummary[]> => {
	try {
		// Option 1: Use an RPC function (if you create one in Supabase)
		// const { data, error } = await supabase.rpc('get_grade_level_summaries');
		// if (error) throw error;
		// return data;

		// Option 2: Query and aggregate in the frontend (less efficient for large data)
		// This is a simplified example and might need adjustments based on your schema

		// 1. Get all distinct grade levels from classes
		const { data: gradesData, error: gradesError } = await supabase
			.from('classes')
			.select('level_id')

		if (gradesError) throw gradesError
		const distinctGradeLevels = [...new Set(gradesData.map(g => g.level_id))].filter(g => g != null) as number[];

		// 2. Fetch counts for each grade level
		const summaries: GradeLevelSummary[] = [];
		for (const level of distinctGradeLevels) {
			// Count classes for this level
			const { count: classCount, error: classError } = await supabase
				.from('classes')
				.select('*' , { count: 'exact', head: true })
				.eq('level_id', level);
			if (classError) console.warn(`Error counting classes for grade ${level}:`, classError);

			// Get class IDs for this level to count students and subjects
			const { data: classIdsData, error: classIdsError } = await supabase
				.from('classes')
				.select('id')
				.eq('level_id', level);
			if (classIdsError) {
				console.warn(`Error getting class IDs for grade ${level}:`, classIdsError);
				continue; // Skip this grade if we can't get class IDs
			}
			const classIds = classIdsData.map(c => c.id);

			let studentCount = 0;
			if (classIds.length > 0) {
				try {
					// Count unique students across all classes in this grade level
					const { data: studentData, error: studentError } = await supabase
						.from('classstudents')
						.select('studentid')
						.in('classid', classIds);
					if (studentError) throw studentError;
					studentCount = new Set(studentData?.map(s => s.studentid) || []).size;
				} catch (studentError) {
					console.error(`Error counting students for grade ${level} with class IDs [${classIds.join(', ')}]:`, studentError);
					// Optionally set count to 0 or a specific error indicator
				}
			}

			let subjectCount = 0;
			if (classIds.length > 0) {
				try {
					// Count unique subjects across all classes in this grade level
					// This assumes a 'classsubjects' table exists linking classid and subjectid
					const { data: subjectData, error: subjectError } = await supabase
						.from('classsubjects') 
						.select('subjectid')
						.in('classid', classIds);
					if (subjectError) throw subjectError;
					subjectCount = new Set(subjectData?.map(s => s.subjectid) || []).size;
				} catch (subjectError) {
					console.error(`Error counting subjects for grade ${level} with class IDs [${classIds.join(', ')}]:`, subjectError);
					// Optionally set count to 0 or a specific error indicator
				}
			}

			summaries.push({
				id: level,
				name: `${level}${getOrdinalSuffix(level)} Grade`,
				studentCount: studentCount || 0,
				classCount: classCount || 0,
				subjectCount: subjectCount || 0,
			});
		}
		
		// Sort summaries by grade level
		summaries.sort((a, b) => a.id - b.id);

		return summaries;
		
	} catch (error) {
		console.error('Error fetching grade level summaries:', error);
		throw error; // Re-throw the error to be handled by the calling component
	}
};
