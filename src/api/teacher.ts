import supabase from '../config/supabaseClient'
import type { Class, ClassStudent, Video } from '../types/teacher'

export const getTeacherClasses = async (teacherId: string) => {
	const { data, error } = await supabase
		.from('classes')
		.select(
			`
			*,
			classstudents ( count ),
            classsubjects ( count ),
            levels ( id, name, type_id )
		`
		)
		.eq('teacherid', teacherId)

	if (error) {
		console.error('Error fetching teacher classes with counts:', error)
		throw error
	}

	// Map data to include studentCount and subjectCount
	const classesWithCounts = data.map(cls => ({
		...cls,
		// @ts-ignore Supabase typings might not recognize the count directly
		studentCount: cls.classstudents?.[0]?.count ?? 0, // Use optional chaining and nullish coalescing
		// @ts-ignore
		subjectCount: cls.classsubjects?.[0]?.count ?? 0, // Add subjectCount
		// @ts-ignore
		level_id: cls.level_id, // Ensure level_id is directly accessible
		// @ts-ignore
		level_type_id: cls.levels?.type_id, // Add level type ID
	}))

	return classesWithCounts as Class[] // Ensure the return type matches the updated Class type
}

export const getClassById = async (classId: string) => {
	const { data, error } = await supabase.from('classes').select('*').eq('id', classId).single()

	if (error) throw error
	return data as Class
}

export const createClass = async (classData: Omit<Class, 'id' | 'createdAt'>) => {
	const { data, error } = await supabase.from('classes').insert([classData]).select().single()

	if (error) throw error
	return data as Class
}

export const updateClass = async (classId: string, classData: Partial<Class>) => {
	const { data, error } = await supabase
		.from('classes')
		.update(classData)
		.eq('id', classId)
		.select()
		.single()

	if (error) throw error
	return data as Class
}

export const deleteClass = async (classId: string) => {
	const { error } = await supabase.from('classes').delete().eq('id', classId)

	if (error) throw error
}

export const addStudentToClass = async (classId: string, studentId: string) => {
	const { data, error } = await supabase
		.from('classstudents')
		.insert([{ classId, studentId }])
		.select()
		.single()

	if (error) throw error
	return data as ClassStudent
}

export const removeStudentFromClass = async (classId: string, studentId: string) => {
	const { error } = await supabase
		.from('classstudents')
		.delete()
		.eq('classId', classId)
		.eq('studentId', studentId)

	if (error) throw error
}

export const addVideoToClass = async (videoData: Omit<Video, 'id'>) => {
	const { data, error } = await supabase.from('videos').insert([videoData]).select().single()

	if (error) throw error
	return data as Video
}

export const deleteVideo = async (videoId: string) => {
	const { error } = await supabase.from('videos').delete().eq('id', videoId)

	if (error) throw error
}

export const getClassSubjects = async (classId: string) => {
	try {
		const { data: relationData, error: relationError } = await supabase
			.from('classsubjects')
			.select('subjectid')
			.eq('classid', classId)

		if (relationError) throw relationError

		if (!relationData || relationData.length === 0) {
			return []
		}

		const subjectIds = relationData.map(item => item.subjectid)

		const { data: subjectsData, error: subjectsError } = await supabase
			.from('subjects')
			.select('*')
			.in('id', subjectIds)

		if (subjectsError) throw subjectsError

		return subjectsData || []
	} catch (error) {
		console.error('Error fetching class subjects:', error)
		throw error
	}
}
