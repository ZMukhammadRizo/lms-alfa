import { create } from 'zustand'
import {
	getParentChildren,
	getStudentsAttendance,
	getStudentsScores,
} from '../services/parentService'
import { AttendanceResponse, ScoreResponse } from '../types/parent'

interface Child {
	id: string
	firstName: string
	lastName: string
}

interface ParentStudentState {
	// State
	children: Child[]
	scores: ScoreResponse[]
	attendance: AttendanceResponse[]
	loading: boolean
	error: string | null

	// Actions
	fetchChildren: (parentId: string) => Promise<void>
	fetchScores: (childIds: string[]) => Promise<void>
	fetchAttendance: (childIds: string[]) => Promise<void>
	resetState: () => void
}

export const useParentStudentStore = create<ParentStudentState>(set => ({
	// Initial state
	children: [],
	scores: [],
	attendance: [],
	loading: false,
	error: null,

	// Fetch children of the logged-in parent
	fetchChildren: async (parentId: string) => {
		set({ loading: true, error: null })
		try {
			const children = await getParentChildren(parentId)
			set({ children, loading: false })
		} catch (error) {
			set({
				error: error instanceof Error ? error.message : 'Failed to fetch children data',
				loading: false,
			})
		}
	},

	// Fetch scores/grades for children
	fetchScores: async (childIds: string[]) => {
		if (!childIds.length) {
			set({ scores: [] })
			return
		}

		set({ loading: true, error: null })
		try {
			const scores = await getStudentsScores(childIds)
			set({ scores, loading: false })
		} catch (error) {
			set({
				error: error instanceof Error ? error.message : 'Failed to fetch scores data',
				loading: false,
			})
		}
	},

	// Fetch attendance records for children
	fetchAttendance: async (childIds: string[]) => {
		if (!childIds.length) {
			set({ attendance: [] })
			return
		}

		set({ loading: true, error: null })
		try {
			const attendance = await getStudentsAttendance(childIds)
			set({ attendance, loading: false })
		} catch (error) {
			set({
				error: error instanceof Error ? error.message : 'Failed to fetch attendance data',
				loading: false,
			})
		}
	},

	// Reset the store state
	resetState: () => {
		set({
			children: [],
			scores: [],
			attendance: [],
			error: null,
		})
	},
}))

// Export selectors for easier component access
export const useParentChildren = () => useParentStudentStore(state => state.children)
export const useParentScores = () => useParentStudentStore(state => state.scores)
export const useParentAttendance = () => useParentStudentStore(state => state.attendance)
export const useParentStudentLoading = () => useParentStudentStore(state => state.loading)
export const useParentStudentError = () => useParentStudentStore(state => state.error)
