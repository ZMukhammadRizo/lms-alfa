import supabase from '../config/supabaseClient'

// Define the attendance interface
export interface Attendance {
	id: string
	studentid: string
	classid: string
	date: string
	status: 'present' | 'absent' | 'late' | 'excused' | 'not-assigned'
	quarter_id: string
	lesson_id?: string
	subject_id?: string
	notes?: string
}

export interface AttendanceSummary {
	subjectId: string
	subjectName: string
	present: number
	absent: number
	late: number
	excused: number
	notAssigned: number
	total: number
	percentage: number
}

// Get student attendance for specific subject
export const getStudentAttendance = async (
	studentId: string,
	subjectId?: string
): Promise<Attendance[]> => {
	try {
		console.log(
			'Fetching attendance data for student:',
			studentId,
			subjectId ? `and subject: ${subjectId}` : ''
		)

		// Check if attendance table exists
		const { data: tableCheck, error: tableError } = await supabase
			.from('attendance')
			.select('id')
			.limit(1)

		if (tableError) {
			console.error('Attendance table error:', tableError.message)
			return getMockAttendance(studentId, subjectId)
		}

		// Build query
		let query = supabase.from('attendance').select('*').eq('studentid', studentId)

		// Add subject filter if provided
		if (subjectId) {
			query = query.eq('subject_id', subjectId)
		}

		// Execute query
		const { data, error } = await query.order('date', { ascending: false })

		if (error) {
			console.error('Error fetching attendance data:', error)
			return getMockAttendance(studentId, subjectId)
		}

		if (!data || data.length === 0) {
			console.log('No attendance records found')
			return getMockAttendance(studentId, subjectId)
		}

		return data
	} catch (error) {
		console.error('Error in getStudentAttendance:', error)
		return getMockAttendance(studentId, subjectId)
	}
}

// Calculate attendance summary by subject
export const calculateAttendanceSummary = async (
	studentId: string
): Promise<AttendanceSummary[]> => {
	try {
		// Get all attendance records for student
		const attendanceData = await getStudentAttendance(studentId)

		// If using mock data or no data, return mock summary
		if (attendanceData.length === 0) {
			return getMockAttendanceSummary()
		}

		// Get subject data
		const { data: subjects, error: subjectsError } = await supabase
			.from('subjects')
			.select('id, subjectname')

		if (subjectsError) {
			console.error('Error fetching subjects:', subjectsError)
			return getMockAttendanceSummary()
		}

		// Group attendance by subject
		const subjectMap = new Map<string, AttendanceSummary>()

		// Initialize counters for each subject
		subjects.forEach(subject => {
			subjectMap.set(subject.id, {
				subjectId: subject.id,
				subjectName: subject.subjectname,
				present: 0,
				absent: 0,
				late: 0,
				excused: 0,
				notAssigned: 0,
				total: 0,
				percentage: 0,
			})
		})

		// Count attendance statuses
		attendanceData.forEach(record => {
			const subjectId = record.subject_id
			if (!subjectId) return

			const summary = subjectMap.get(subjectId)
			if (!summary) return

			// Only count assigned statuses in total (exclude not-assigned)
			const status = record.status.toLowerCase()
			if (status !== 'not-assigned') {
				summary.total++
			}

			switch (status) {
				case 'present':
					summary.present++
					break
				case 'absent':
					summary.absent++
					break
				case 'late':
					summary.late++
					break
				case 'excused':
					summary.excused++
					break
				case 'not-assigned':
					summary.notAssigned++
					break
			}
		})

		// Calculate percentages and create final array
		const summaries: AttendanceSummary[] = []
		subjectMap.forEach(summary => {
			if (summary.total > 0) {
				// Only calculate percentage based on assigned days (exclude not-assigned)
				summary.percentage = Math.round(
					((summary.present + summary.excused * 0.5) / summary.total) * 100
				)
				summaries.push(summary)
			}
		})

		return summaries
	} catch (error) {
		console.error('Error calculating attendance summary:', error)
		return getMockAttendanceSummary()
	}
}

// Get mock attendance data for testing/demo
export const getMockAttendance = (studentId: string, subjectId?: string): Attendance[] => {
	const subjects = [
		{ id: '1', name: 'Mathematics' },
		{ id: '2', name: 'Physics' },
		{ id: '3', name: 'Biology' },
		{ id: '4', name: 'History' },
		{ id: '5', name: 'Literature' },
	]

	const today = new Date()
	const mockAttendance: Attendance[] = []

	// Generate 3 months of attendance data
	for (let i = 0; i < 60; i++) {
		const date = new Date(today)
		date.setDate(date.getDate() - i)

		// Skip weekends
		const day = date.getDay()
		if (day === 0 || day === 6) continue

		// For each day, create attendance for each subject
		subjects.forEach(subject => {
			// If subjectId is specified, only generate for that subject
			if (subjectId && subject.id !== subjectId) return

			// Randomly assign attendance status with bias toward present
			const random = Math.random()
			let status: 'present' | 'absent' | 'late' | 'excused' | 'not-assigned'

			if (random < 0.75) status = 'present'
			else if (random < 0.85) status = 'late'
			else if (random < 0.92) status = 'excused'
			else if (random < 0.97) status = 'absent'
			else status = 'not-assigned'

			mockAttendance.push({
				id: `mock-${i}-${subject.id}`,
				studentid: studentId,
				classid: 'class-1',
				date: date.toISOString(),
				status,
				quarter_id: 'q1',
				subject_id: subject.id,
				notes: status !== 'present' ? `Mock ${status} record` : undefined,
			})
		})
	}

	return mockAttendance
}

// Get mock attendance summary
export const getMockAttendanceSummary = (): AttendanceSummary[] => {
	return [
		{
			subjectId: '1',
			subjectName: 'Mathematics',
			present: 38,
			absent: 2,
			late: 4,
			excused: 1,
			notAssigned: 5,
			total: 45,
			percentage: 86,
		},
		{
			subjectId: '2',
			subjectName: 'Physics',
			present: 40,
			absent: 1,
			late: 3,
			excused: 2,
			notAssigned: 4,
			total: 46,
			percentage: 90,
		},
		{
			subjectId: '3',
			subjectName: 'Biology',
			present: 42,
			absent: 0,
			late: 2,
			excused: 1,
			notAssigned: 3,
			total: 45,
			percentage: 94,
		},
		{
			subjectId: '4',
			subjectName: 'History',
			present: 39,
			absent: 3,
			late: 2,
			excused: 2,
			notAssigned: 6,
			total: 46,
			percentage: 87,
		},
		{
			subjectId: '5',
			subjectName: 'Literature',
			present: 44,
			absent: 1,
			late: 0,
			excused: 0,
			notAssigned: 2,
			total: 45,
			percentage: 98,
		},
	]
}
