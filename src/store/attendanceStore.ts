import { create } from 'zustand'
import supabase from '../config/supabaseClient'

export interface Attendance {
	id: string
	lesson_id: string
	student_id: string
	present: boolean
	status?: string
	noted_at?: string
}

interface AttendanceState {
	attendance: Attendance[]
	loading: boolean
	error: string | null
	fetchAttendance: (lessonId: string) => Promise<void>
	fetchAttendanceForLessons: (lessonIds: string[]) => Promise<void>
	updateAttendance: (lessonId: string, studentId: string, present: boolean) => Promise<void>
	saveAttendanceStatus: (lessonId: string, studentId: string, status: string) => Promise<void>
	setAttendance: (attendance: Attendance[]) => void
}

const useAttendanceStore = create<AttendanceState>((set, get) => ({
	attendance: [],
	loading: false,
	error: null,

	fetchAttendance: async lessonId => {
		set({ loading: true, error: null })
		try {
			const { data, error } = await supabase
				.from('attendance')
				.select('*')
				.eq('lesson_id', lessonId)

			if (error) {
				set({ error: error.message })
			} else {
				set({ attendance: data || [] })
			}
		} catch (err) {
			set({ error: err instanceof Error ? err.message : 'Failed to fetch attendance data' })
		} finally {
			set({ loading: false })
		}
	},

	fetchAttendanceForLessons: async lessonIds => {
		// Skip if empty array
		if (!lessonIds || lessonIds.length === 0) {
			set({ attendance: [] })
			return
		}

		set({ loading: true, error: null })
		try {
			const { data, error } = await supabase
				.from('attendance')
				.select('*')
				.in('lesson_id', lessonIds)

			if (error) {
				set({ error: error.message })
			} else {
				set({ attendance: data || [] })
			}
		} catch (err) {
			set({ error: err instanceof Error ? err.message : 'Failed to fetch attendance data' })
		} finally {
			set({ loading: false })
		}
	},

	updateAttendance: async (lessonId, studentId, present) => {
		console.warn('Deprecated updateAttendance called. Use saveAttendanceStatus instead.')
		// For now, map boolean `present` to a status
		const status = present ? 'present' : 'absent'
		get().saveAttendanceStatus(lessonId, studentId, status)
	},

	saveAttendanceStatus: async (lessonId, studentId, status) => {
		// Validate inputs
		if (!lessonId || !studentId || !status) {
			console.error('Invalid values for saveAttendanceStatus:', { lessonId, studentId, status })
			set({ error: 'Invalid lesson, student ID, or status provided' })
			return
		}

		try {
			console.log('Attempting to save attendance status:', { lessonId, studentId, status })

			const { data: upsertedData, error } = await supabase
				.from('attendance')
				.upsert(
					{ lesson_id: lessonId, student_id: studentId, status: status },
					{
						onConflict: 'lesson_id,student_id', // Assumes unique constraint on these two
						ignoreDuplicates: false,
					} // Ensure it updates existing record
				)
				.select() // Select the upserted/updated row
				.single() // Expect a single row back

			if (error) {
				console.error('Supabase error during saveAttendanceStatus:', error)
				set({ error: `Failed to save status: ${error.message}` })
				return
			}

			// Update local state with the latest data from the upsert
			const { attendance } = get()
			const updatedAttendance = attendance.map(a =>
				a.lesson_id === lessonId && a.student_id === studentId
					? { ...a, status: status, id: upsertedData.id }
					: a
			)

			// Check if the record was updated or added
			const recordExists = attendance.some(
				a => a.lesson_id === lessonId && a.student_id === studentId
			)
			if (!recordExists && upsertedData) {
				updatedAttendance.push({ ...upsertedData, status: status })
			}

			set({ attendance: updatedAttendance, error: null }) // Clear error on success
			console.log('Attendance status saved successfully')
		} catch (err) {
			console.error('Exception in saveAttendanceStatus:', err)
			set({ error: err instanceof Error ? err.message : 'Failed to save attendance status' })
		}
	},

	// Add a function to directly set attendance records
	setAttendance: attendance => {
		set({ attendance, error: null })
	},
}))

export default useAttendanceStore
