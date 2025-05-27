import supabase from '../config/supabaseClient'
import { fetchParentChildren } from './timetableService' // Adjust path if necessary

/**
 * Interface for assignment data
 */
export interface Assignment {
	id: string
	title: string
	description?: string
	due_date?: string
	subject?: string
	subject_id?: string
	status?: 'pending' | 'completed' | 'late' | 'overdue' | 'upcoming'
	created_at?: string
	updated_at?: string
	grade?: number | null
	submission_date?: string | null
	attachments?: AttachmentFile[]
	feedback_provided?: boolean
	file_url?: Array<{ name: string; url: string }> | string | null
	classid?: string
	className?: string
	studentId?: string
	studentName?: string
}

export interface AttachmentFile {
	id: string
	name: string
	size: string
	url?: string
}

/**
 * Interface for submission data
 */
export interface Submission {
	id: string
	assignmentid: string
	studentid: string
	fileurl: string
	submittedat: string
	grade: number | null
	feedback: string | null
	assignment?: {
		id: string
		title: string
		classid: string
		class?: {
			id: string
			classname: string
		}
	}
	student?: {
		id: string
		fullName: string
	}
}

/**
 * Get all assignments for a SINGLE student
 * Export this function so student panel can use it
 */
export async function getAssignmentsForSingleStudent(studentId: string): Promise<Assignment[]> {
	try {
		if (!studentId || studentId.trim() === '') return []

		const { error: tableCheckError } = await supabase.from('assignments').select('id').limit(1)
		if (tableCheckError) return []

		const { data: studentData, error: studentError } = await supabase
			.from('classstudents')
			.select('classid')
			.eq('studentid', studentId)
		if (studentError || !studentData || studentData.length === 0) return []

		const classIds = studentData.map(item => item.classid)
		if (classIds.length === 0) return []

		const { data, error } = await supabase
			.from('assignments')
			.select('*, class:classid(*)') // Fetching class details
			.in('classid', classIds)
			.order('duedate', { ascending: true })

		if (error || !data) return []

		return data.map((assignment: any): Assignment => {
			let calculatedStatus = assignment.status || 'pending'
			const dueDate = new Date(assignment.duedate)
			const today = new Date()
			if (dueDate < today && calculatedStatus !== 'completed') calculatedStatus = 'overdue'
			if (getDaysRemaining(assignment.duedate) > 7 && calculatedStatus === 'pending')
				calculatedStatus = 'upcoming'

			const className = assignment.class?.classname || 'Unknown Class'

			return {
				id: assignment.id,
				title: assignment.title,
				description: assignment.description || '',
				due_date: assignment.duedate,
				subject: assignment.subject || 'General',
				subject_id: assignment.subject_id,
				status: calculatedStatus,
				created_at: assignment.created_at,
				updated_at: assignment.updated_at,
				grade: assignment.grade,
				submission_date: assignment.submission_date,
				attachments: getAttachmentsFromDescription(assignment.description || ''),
				feedback_provided: assignment.feedback_provided || false,
				file_url: assignment.file_url || null,
				classid: assignment.classid,
				className: className,
				studentId: studentId, // Add studentId here
			}
		})
	} catch (error) {
		console.error(`Error fetching assignments for student ${studentId}:`, error)
		return []
	}
}

/**
 * Get all assignments for ALL children of a parent
 */
export async function fetchParentAssignments(parentId: string): Promise<Assignment[]> {
	if (!parentId) {
		console.error('[fetchParentAssignments] Parent ID is required.')
		return []
	}

	try {
		// 1. Fetch the parent's children (ID and Name)
		const children = await fetchParentChildren(parentId)
		if (!children || children.length === 0) {
			console.log('[fetchParentAssignments] No children found for parent.')
			return []
		}
		console.log('[fetchParentAssignments] Found children:', children)

		// 2. Fetch assignments for each child concurrently
		const assignmentPromises = children.map(child =>
			getAssignmentsForSingleStudent(child.id).then(assignments =>
				// Add student name to each assignment fetched for this child
				assignments.map(assignment => ({ ...assignment, studentName: child.name }))
			)
		)

		const results = await Promise.all(assignmentPromises)
		console.log('[fetchParentAssignments] Assignments per child:', results)

		// 3. Flatten the array of arrays into a single array
		const allAssignments = results.flat()

		// 4. Optional: Deduplicate assignments if multiple children share classes/assignments
		// (Simple deduplication based on assignment ID)
		const uniqueAssignmentsMap = new Map<string, Assignment>()
		allAssignments.forEach(assignment => {
			if (!uniqueAssignmentsMap.has(assignment.id)) {
				uniqueAssignmentsMap.set(assignment.id, assignment)
			} else {
				// If already present, maybe append child name if needed?
				// For now, just keep the first one encountered.
			}
		})

		const uniqueAssignments = Array.from(uniqueAssignmentsMap.values())
		console.log('[fetchParentAssignments] Unique assignments:', uniqueAssignments)

		// 5. Fetch all submissions for these children
		const studentIds = children.map(child => child.id)
		const { data: submissions } = await supabase
			.from('submissions')
			.select('*')
			.in('studentid', studentIds)

		if (submissions && submissions.length > 0) {
			// Update assignment status if there are matching submissions
			uniqueAssignments.forEach(assignment => {
				const matchingSubmission = submissions.find(
					sub => sub.assignmentid === assignment.id && sub.studentid === assignment.studentId
				)
				if (matchingSubmission) {
					assignment.status = 'pending'
				}
			})
		}

		// Sort combined list by due date
		uniqueAssignments.sort(
			(a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
		)

		return uniqueAssignments
	} catch (error) {
		console.error('[fetchParentAssignments] Failed:', error)
		return []
	}
}

/**
 * Get all courses for filtering
 */
export async function getStudentCourses(studentId: string): Promise<any[]> {
	try {
		// Try to get subjects
		const { data, error } = await supabase
			.from('subjects')
			.select('id, subjectname')
			.order('subjectname')

		if (error || !data || !data.length) {
			console.error('Error fetching courses:', error)
			return []
		}

		// Transform the data
		return data.map(course => ({
			id: course.id,
			name: course.subjectname,
			teacher: 'Teacher', // Default teacher name since we can't join to users
		}))
	} catch (error) {
		console.error('Error in getStudentCourses:', error)
		return []
	}
}

/**
 * Submit an assignment
 */
export async function submitAssignment(
	assignmentId: string,
	studentId: string,
	files: File[]
): Promise<boolean> {
	try {
		// First update the assignment status
		const { error: updateError } = await supabase
			.from('assignments')
			.update({
				status: 'completed',
				updated_at: new Date().toISOString(),
			})
			.eq('id', assignmentId)

		if (updateError) {
			console.error('Error updating assignment status:', updateError)
			return false
		}

		// For each file, upload to storage
		for (const file of files) {
			const fileName = `${studentId}/${assignmentId}/${file.name}`

			const { error: uploadError } = await supabase.storage
				.from('assignments')
				.upload(fileName, file)

			if (uploadError) {
				console.error('Error uploading file:', uploadError)
				return false
			}
		}

		return true
	} catch (error) {
		console.error('Error in submitAssignment:', error)
		return false
	}
}

// Helper function to get days remaining until due date
export const getDaysRemaining = (dueDateStr: string): number => {
	try {
		const dueDate = new Date(dueDateStr)
		const today = new Date()

		// If dueDate is invalid, return 0
		if (isNaN(dueDate.getTime())) {
			return 0
		}

		// Set time to 00:00:00 for accurate day calculation
		today.setHours(0, 0, 0, 0)
		dueDate.setHours(0, 0, 0, 0)

		const differenceMs = dueDate.getTime() - today.getTime()
		const differenceDays = Math.ceil(differenceMs / (1000 * 3600 * 24))

		return differenceDays
	} catch (error) {
		console.error('Error calculating days remaining:', error)
		return 0
	}
}

// Helper function to extract attachments from description text
// This is a workaround since we don't have a proper attachments table yet
export const getAttachmentsFromDescription = (description: string): AttachmentFile[] => {
	// Look for patterns like [attachment: filename.pdf] in the description
	const regex = /\[attachment:\s*([^\]]+)\]/g
	const matches = [...description.matchAll(regex)]

	if (!matches.length) {
		// If no matches, provide default mock attachment for testing
		if (description.toLowerCase().includes('problem set')) {
			return [{ id: '1', name: 'Problem_Set.pdf', size: '1.2 MB' }]
		}
		if (description.toLowerCase().includes('lab')) {
			return [
				{ id: '2', name: 'Lab_Instructions.pdf', size: '2.4 MB' },
				{ id: '3', name: 'Data_Collection_Template.xlsx', size: '0.8 MB' },
			]
		}
		return []
	}

	return matches.map((match, index) => ({
		id: `attachment-${index + 1}`,
		name: match[1].trim(),
		size: '1.0 MB', // Default size
	}))
}

/**
 * Fetch submissions for all children of a parent
 */
export async function fetchParentSubmissions(parentId: string): Promise<Submission[]> {
	if (!parentId) {
		console.error('[fetchParentSubmissions] Parent ID is required.')
		return []
	}

	try {
		// 1. Fetch the parent's children
		const children = await fetchParentChildren(parentId)
		if (!children || children.length === 0) {
			console.log('[fetchParentSubmissions] No children found for parent.')
			return []
		}

		// 2. Get all student IDs
		const studentIds = children.map(child => child.id)

		// 3. Fetch submissions for these students
		const { data: submissions, error } = await supabase
			.from('submissions')
			.select(
				`
        *,
        assignment:assignmentid (
          id,
          title,
          classid,
          class:classes!assignments_classid_fkey (
            id,
            classname
          )
        ),
        student:studentid (
          id,
          fullName
        )
      `
			)
			.in('studentid', studentIds)
			.order('submittedat', { ascending: false })

		if (error) {
			console.error('[fetchParentSubmissions] Error fetching submissions:', error)
			return []
		}

		return submissions || []
	} catch (error) {
		console.error('[fetchParentSubmissions] Failed:', error)
		return []
	}
}

/**
 * Fetch submissions with their assignments for a parent's children
 * This fetches assignments directly through the submissions table
 */
export async function fetchParentSubmissionsWithAssignments(parentId: string): Promise<{
	assignments: Assignment[]
	submissions: Submission[]
}> {
	if (!parentId) {
		console.error('[fetchParentSubmissionsWithAssignments] Parent ID is required.')
		return { assignments: [], submissions: [] }
	}

	try {
		// 1. Fetch the parent's children
		const children = await fetchParentChildren(parentId)
		if (!children || children.length === 0) {
			console.log('[fetchParentSubmissionsWithAssignments] No children found for parent.')
			return { assignments: [], submissions: [] }
		}

		// 2. Get all student IDs
		const studentIds = children.map(child => child.id)

		// 3. Fetch submissions with their linked assignments
		const { data: submissionsData, error } = await supabase
			.from('submissions')
			.select(
				`
				id,
				fileurl,
				submittedat,
				grade,
				feedback,
				assignmentid,
				studentid,
				assignment:assignmentid (
					id,
					title,
					instructions,
					duedate,
					classid,
					createdat,
					class:classes!assignments_classid_fkey (
						id,
						classname
					)
				),
				student:studentid (
					id,
					fullName
				)
			`
			)
			.in('studentid', studentIds)
			.order('submittedat', { ascending: false })

		if (error) {
			console.error('[fetchParentSubmissionsWithAssignments] Error fetching submissions:', error)
			return { assignments: [], submissions: [] }
		}

		// To avoid TypeScript errors, first cast to any
		const anySubmissions = (submissionsData || []) as any[]

		// 4. Convert submissions to our Assignment interface format
		const assignmentsMap = new Map<string, Assignment>()

		anySubmissions.forEach(submission => {
			if (submission.assignment) {
				const studentId = submission.student?.id || ''
				const childName = children.find(child => child.id === studentId)?.name || 'Unknown'

				// Create an assignment object from the submission data
				const assignment: Assignment = {
					id: submission.assignment.id,
					title: submission.assignment.title,
					description: submission.assignment.description || '',
					due_date: submission.assignment.duedate,
					subject: submission.assignment.subject || 'General',
					status: 'pending', // Default, will update below
					created_at: submission.assignment.created_at,
					updated_at: submission.assignment.updated_at,
					grade: submission.grade,
					submission_date: submission.submittedat,
					classid: submission.assignment.classid,
					className: submission.assignment.class?.classname || 'Unknown Class',
					studentId: studentId,
					studentName: childName,
					attachments: getAttachmentsFromDescription(submission.assignment.description || ''),
					file_url: submission.fileurl,
				}

				// Calculate the status based on submission and due date
				const dueDate = new Date(assignment.due_date)
				const submissionDate = new Date(submission.submittedat)

				if (submission.grade !== null) {
					assignment.status = 'completed'
				} else if (submissionDate > dueDate) {
					assignment.status = 'late'
				} else {
					assignment.status = 'pending'
				}

				// Add to map using a composite key to avoid duplicates
				const key = `${assignment.id}-${studentId}`
				assignmentsMap.set(key, assignment)
			}
		})

		// 5. Get assignments as an array
		const assignmentsFromSubmissions = Array.from(assignmentsMap.values())

		// 6. Sort by due date
		assignmentsFromSubmissions.sort(
			(a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
		)

		// 7. Convert submissions to our Submission interface
		const typedSubmissions: Submission[] = anySubmissions.map(sub => ({
			id: sub.id,
			assignmentid: sub.assignmentid,
			studentid: sub.studentid,
			fileurl: sub.fileurl,
			submittedat: sub.submittedat,
			grade: sub.grade,
			feedback: sub.feedback,
			assignment: sub.assignment
				? {
						id: sub.assignment.id,
						title: sub.assignment.title,
						classid: sub.assignment.classid,
						class: sub.assignment.class
							? {
									id: sub.assignment.class.id,
									classname: sub.assignment.class.classname,
							  }
							: undefined,
				  }
				: undefined,
			student: sub.student
				? {
						id: sub.student.id,
						fullName: sub.student.fullName,
				  }
				: undefined,
		}))

		return {
			assignments: assignmentsFromSubmissions,
			submissions: typedSubmissions,
		}
	} catch (error) {
		console.error('[fetchParentSubmissionsWithAssignments] Failed:', error)
		return { assignments: [], submissions: [] }
	}
}

/**
 * Comprehensive fetch for parent dashboard - gets both assignments and submissions
 * Shows all assignments, with submission data where available
 */
export async function fetchParentDashboardData(parentId: string): Promise<{
	assignments: Assignment[]
	submissions: Submission[]
}> {
	if (!parentId) {
		console.error('[fetchParentDashboardData] Parent ID is required.')
		return { assignments: [], submissions: [] }
	}

	try {
		// 1. Get all assignments for the children through class enrollment
		const regularAssignments = await fetchParentAssignments(parentId)

		// 2. Get submissions with their linked assignments
		const submissionsResult = await fetchParentSubmissionsWithAssignments(parentId)
		const submissionAssignments = submissionsResult.assignments
		const submissions = submissionsResult.submissions

		// 3. Merge both sets of assignments, with submission data taking precedence
		const allAssignments = [...regularAssignments]

		// Create a map for faster lookup
		const assignmentMap = new Map<string, Assignment>()
		regularAssignments.forEach(assignment => {
			if (assignment.studentId) {
				const key = `${assignment.id}-${assignment.studentId}`
				assignmentMap.set(key, assignment)
			}
		})

		// Update or add assignments from submissions
		submissionAssignments.forEach(assignment => {
			if (assignment.studentId) {
				const key = `${assignment.id}-${assignment.studentId}`
				if (assignmentMap.has(key)) {
					// Update existing assignment with submission data
					const existingAssignment = assignmentMap.get(key)!
					existingAssignment.status = assignment.status
					existingAssignment.grade = assignment.grade
					existingAssignment.submission_date = assignment.submission_date
					existingAssignment.file_url = assignment.file_url
				} else {
					// Add new assignment found through submissions
					allAssignments.push(assignment)
					assignmentMap.set(key, assignment)
				}
			}
		})

		// Sort all assignments by due date
		allAssignments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

		return {
			assignments: allAssignments,
			submissions: submissions,
		}
	} catch (error) {
		console.error('[fetchParentDashboardData] Failed:', error)
		return { assignments: [], submissions: [] }
	}
}

/**
 * Fetch assignments and submissions for a teacher
 * First gets all assignment IDs created by the teacher,
 * then fetches submissions for those assignments
 */
export async function fetchTeacherSubmissions(teacherId: string): Promise<Submission[]> {
	if (!teacherId) {
		console.error('[fetchTeacherSubmissions] Teacher ID is required.')
		return []
	}

	try {
		// 1. First fetch all assignments created by this teacher
		const { data: assignments, error: assignmentError } = await supabase
			.from('assignments')
			.select('id')
			.eq('createdby', teacherId)

		if (assignmentError) {
			console.error('[fetchTeacherSubmissions] Error fetching assignments:', assignmentError)
			return []
		}

		// If no assignments found, return empty array
		if (!assignments || assignments.length === 0) {
			return []
		}

		// Extract the assignment IDs
		const assignmentIds = assignments.map(a => a.id)

		// 2. Fetch submissions for these assignments
		const { data: submissionsData, error: submissionsError } = await supabase
			.from('submissions')
			.select(
				`
				id,
				fileurl,
				submittedat,
				grade,
				feedback,
				assignmentid,
				studentid,
				assignment:assignmentid (
					id,
					title,
					classid,
					quarter_id,
					createdby,
					class:classes!assignments_classid_fkey (
						id,
						classname
					),
					quarter:quarters!assignments_quarter_id_fkey (
						id,
						name
					)
				),
				student:studentid (
					id,
					fullName
				)
			`
			)
			.in('assignmentid', assignmentIds)
			.order('submittedat', { ascending: false })

		if (submissionsError) {
			console.error('[fetchTeacherSubmissions] Error fetching submissions:', submissionsError)
			return []
		}

		if (!submissionsData || submissionsData.length === 0) {
			return []
		}

		// 3. Convert to strongly typed Submission objects
		// Force cast to any then map to our interface to avoid TypeScript errors
		const anySubmissions = submissionsData as any[]

		const submissions: Submission[] = anySubmissions.map(sub => ({
			id: sub.id,
			assignmentid: sub.assignmentid,
			studentid: sub.studentid,
			fileurl: sub.fileurl,
			submittedat: sub.submittedat,
			grade: sub.grade,
			feedback: sub.feedback,
			assignment: sub.assignment
				? {
						id: sub.assignment.id,
						title: sub.assignment.title,
						classid: sub.assignment.classid,
						class: sub.assignment.class
							? {
									id: sub.assignment.class.id,
									classname: sub.assignment.class.classname,
							  }
							: undefined,
				  }
				: undefined,
			student: sub.student
				? {
						id: sub.student.id,
						fullName: sub.student.fullName,
				  }
				: undefined,
		}))

		return submissions
	} catch (error) {
		console.error('[fetchTeacherSubmissions] Failed:', error)
		return []
	}
}
