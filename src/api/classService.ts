import supabase from '../config/supabaseClient'

/**
 * Fetches a class by its ID with populated subject and creator information
 * Also fetches related lessons for the class's subject
 * @param classId - The ID of the class to fetch
 * @returns The class data with populated subject, creator, and lessons information
 */
export const getClassWithDetails = async (classId: string) => {
	if (!classId) {
		throw new Error('Class ID is required')
	}

	// First fetch the class with subject and creator
	const { data: classData, error: classError } = await supabase
		.from('classes')
		.select(
			`
      *,
      subjects:subjectid (*),
      creator:createdby (id, firstName, lastName, email)
    `
		)
		.eq('id', classId)
		.single()

	if (classError) {
		console.error('Error fetching class with details:', classError)
		throw classError
	}

	if (!classData) {
		throw new Error('Class not found')
	}

	// Now fetch lessons related to the subject
	const { data: lessonsData, error: lessonsError } = await supabase
		.from('lessons')
		.select('*')
		.eq('subjectid', classData.subjectid)

	if (lessonsError) {
		console.error('Error fetching lessons:', lessonsError)
		throw lessonsError
	}

	// Return the class data with lessons included
	return {
		...classData,
		lessons: lessonsData || [],
	}
}
