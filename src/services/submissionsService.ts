import supabase from '../config/supabaseClient'

// Interface for class information
export interface ClassInfo {
	id: string
	name: string
	levelId: string
	levelName: string
	studentCount: number
}

// Get class information by ID
export const getClassInfo = async (classId: string): Promise<ClassInfo> => {
	try {
		// Simplified query to avoid nested join issues
		const { data, error } = await supabase
			.from('classes')
			.select('id, classname, level_id, student_count')
			.eq('id', classId)
			.single()

		if (error) throw error

		// Get level name separately if level_id exists
		let levelName = 'Unknown Level'
		if (data.level_id) {
			const { data: levelData } = await supabase
				.from('levels')
				.select('name')
				.eq('id', data.level_id)
				.single()

			levelName = levelData?.name || 'Unknown Level'
		}

		return {
			id: data.id,
			name: data.classname,
			levelId: data.level_id,
			levelName,
			studentCount: data.student_count || 0,
		}
	} catch (error) {
		console.error('Error fetching class info:', error)
		return {
			id: classId,
			name: 'Unknown Class',
			levelId: '',
			levelName: 'Unknown Level',
			studentCount: 0,
		}
	}
}

// Get student submission statistics for a class
export const getStudentSubmissionStats = async (studentId: string, classId: string) => {
	try {
		// Get assignments for this class
		const { data: assignments, error: assignmentsError } = await supabase
			.from('assignments')
			.select('id')
			.eq('classid', classId)

		if (assignmentsError) throw assignmentsError

		if (!assignments || assignments.length === 0) {
			return {
				submissionCount: 0,
				averageGrade: null,
				lastSubmissionDate: null,
			}
		}

		const assignmentIds = assignments.map(a => a.id)

		// Get submissions for this student in these assignments
		const { data: submissions, error: submissionsError } = await supabase
			.from('submissions')
			.select('id, grade, submittedat')
			.eq('studentid', studentId)
			.in('assignmentid', assignmentIds)
			.order('submittedat', { ascending: false })

		if (submissionsError) throw submissionsError

		const validSubmissions = submissions || []
		const submissionCount = validSubmissions.length

		// Calculate average grade
		const gradesSubmissions = validSubmissions.filter(s => s.grade !== null)
		const averageGrade =
			gradesSubmissions.length > 0
				? gradesSubmissions.reduce((sum, s) => sum + s.grade, 0) / gradesSubmissions.length
				: null

		// Get last submission date
		const lastSubmissionDate = validSubmissions.length > 0 ? validSubmissions[0].submittedat : null

		return {
			submissionCount,
			averageGrade,
			lastSubmissionDate,
		}
	} catch (error) {
		console.error('Error fetching student submission stats:', error)
		return {
			submissionCount: 0,
			averageGrade: null,
			lastSubmissionDate: null,
		}
	}
}

// Update submission grade and feedback
export const updateSubmissionGradeFeedback = async (
	submissionId: string,
	grade: number | null,
	feedback: string,
	status: string | null
) => {
	try {
		const { error } = await supabase
			.from('submissions')
			.update({
				grade: grade,
				feedback: feedback,
				status: status,
			})
			.eq('id', submissionId)

		if (error) throw error

		return { success: true }
	} catch (error) {
		console.error('Error updating submission:', error)
		throw error
	}
}

// Get submission file URLs with proper formatting
export const getSubmissionFileUrls = (fileurl: string | string[]): string[] => {
	if (Array.isArray(fileurl)) {
		return fileurl
	}

	if (typeof fileurl === 'string' && fileurl.trim() !== '') {
		return [fileurl]
	}

	return []
}

// Format file URL to ensure it's properly accessible
export const formatFileUrl = (url: string): string => {
	if (!url || typeof url !== 'string') {
		return ''
	}

	// If it's already a complete URL, return as is
	if (url.startsWith('http://') || url.startsWith('https://')) {
		return url
	}

	// If it's a Supabase storage path, format it properly
	if (url.startsWith('submissions/') || url.startsWith('/submissions/')) {
		const cleanPath = url.startsWith('/') ? url.substring(1) : url
		return `${supabase.supabaseUrl}/storage/v1/object/public/submissions/${cleanPath.replace(
			'submissions/',
			''
		)}`
	}

	// Default case - try to make it a proper URL
	return url.startsWith('/') ? url : `/${url}`
}

// Get display-friendly filename from URL
export const getFileDisplayName = (url: string): string => {
	if (!url || typeof url !== 'string') {
		return 'Unknown File'
	}

	try {
		// Extract filename from URL
		const urlParts = url.split('/')
		let fileName = urlParts[urlParts.length - 1]

		// Remove query parameters
		fileName = fileName.split('?')[0]

		if (!fileName || fileName.length < 3) {
			return 'Submission File'
		}

		// Try to decode and clean up the filename
		let decodedName = decodeURIComponent(fileName)

		// Remove UUID pattern if present at the beginning
		if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[_-]/.test(decodedName)) {
			decodedName = decodedName.replace(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[_-]/,
				''
			)
		} else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(decodedName)) {
			return 'Submission File'
		}

		// If still empty or too short, return default
		if (!decodedName || decodedName.length < 3) {
			return 'Submission File'
		}

		return decodedName
	} catch (e) {
		console.error('Error parsing file name:', e)
		return 'Submission File'
	}
}

// Format date for display
export const formatSubmissionDate = (dateString: string): string => {
	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}
	return new Date(dateString).toLocaleDateString(undefined, options)
}

// Extract filename from URL (legacy function - keeping for compatibility)
export const getFileNameFromUrl = (url: string): string => {
	return getFileDisplayName(url)
}

// Download file helper
export const downloadFile = (url: string, fileName?: string) => {
	try {
		const link = document.createElement('a')
		link.href = formatFileUrl(url)
		link.target = '_blank'
		link.download = fileName || getFileDisplayName(url)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	} catch (error) {
		console.error('Error downloading file:', error)
		throw error
	}
}
