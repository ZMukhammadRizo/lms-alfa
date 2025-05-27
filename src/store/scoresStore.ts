import { create } from 'zustand'
import {
	fetchLessons,
	fetchScores,
	fetchStudents,
	Score,
	updateScore,
} from '../services/scoresService'
import { supabase } from '../services/supabaseClient'

export interface Student {
	id: string
	fullName: string
}

export interface Lesson {
	id: string
	date: string
	topic?: string
	homework?: string
}

interface ScoresState {
	students: Student[]
	lessons: Lesson[]
	scores: Score[]
	loading: boolean
	error: string | null

	// Selection states
	selectedClassId: string | null
	selectedSubjectId: string | null
	selectedQuarterId: string | null

	// Actions - fetch data
	fetchAllData: (classId: string, subjectId: string, quarterId: string) => Promise<void>
	updateScoreRecord: (score: Score) => Promise<void>

	// Actions - selection
	setSelectedClass: (classId: string) => void
	setSelectedSubject: (subjectId: string) => void
	setSelectedQuarter: (quarterId: string) => void
}

const useScoresStore = create<ScoresState>((set, get) => ({
	students: [],
	lessons: [],
	scores: [],
	loading: false,
	error: null,

	selectedClassId: null,
	selectedSubjectId: null,
	selectedQuarterId: null,

	fetchAllData: async (classId, subjectId, quarterId) => {
		set({ loading: true, error: null })

		try {
			// Validate IDs first
			if (!classId || !subjectId || !quarterId) {
				throw new Error(
					`Missing required IDs: classId=${classId}, subjectId=${subjectId}, quarterId=${quarterId}`
				)
			}

			// Store the selection
			set({
				selectedClassId: classId,
				selectedSubjectId: subjectId,
				selectedQuarterId: quarterId,
			})

			// Fetch all required data
			const [studentsData, lessonsData, scoresData] = await Promise.all([
				fetchStudents(classId),
				fetchLessons(subjectId, quarterId),
				fetchScores(classId, subjectId, quarterId),
			])

			set({
				students: studentsData,
				lessons: lessonsData,
				scores: scoresData,
			})
		} catch (error) {
			console.error('Error fetching unified data:', error)
			set({
				error: error instanceof Error ? error.message : 'Failed to fetch data',
			})
		} finally {
			set({ loading: false })
		}
	},

	updateScoreRecord: async score => {
		try {
			// Validate score data
			if (!score.student_id || !score.lesson_id) {
				throw new Error('Missing required fields in score: student_id and lesson_id are required')
			}

			// Add teacher_id if not present in the score object
			if (!score.teacher_id) {
				// Get current user
				const {
					data: { user },
				} = await supabase.auth.getUser()
				if (user) {
					score.teacher_id = user.id
				}
			}

			// First update the local state optimistically
			const currentScores = get().scores

			// Check if this score already exists in our state
			const existingScoreIndex = currentScores.findIndex(
				s => s.student_id === score.student_id && s.lesson_id === score.lesson_id
			)

			// Clone the current scores array
			const newScores = [...currentScores]

			// Update or add the score
			if (existingScoreIndex !== -1) {
				newScores[existingScoreIndex] = score
			} else {
				newScores.push(score)
			}

			// Update state optimistically
			set({ scores: newScores })

			// Perform the actual update
			const updatedScore = await updateScore(score)

			// Update the local state with the server response
			const finalScores = [...newScores]
			const updatedScoreIndex = finalScores.findIndex(
				s => s.student_id === updatedScore.student_id && s.lesson_id === updatedScore.lesson_id
			)

			if (updatedScoreIndex !== -1) {
				finalScores[updatedScoreIndex] = updatedScore
			}

			set({ scores: finalScores })
		} catch (error) {
			console.error('Error updating score:', error)
			set({
				error: error instanceof Error ? error.message : 'Failed to update score',
			})

			// Refresh the data on error to ensure state is in sync
			const { selectedClassId, selectedSubjectId, selectedQuarterId } = get()
			if (selectedClassId && selectedSubjectId && selectedQuarterId) {
				get().fetchAllData(selectedClassId, selectedSubjectId, selectedQuarterId)
			}
		}
	},

	setSelectedClass: classId => {
		set({ selectedClassId: classId })
	},

	setSelectedSubject: subjectId => {
		set({ selectedSubjectId: subjectId })
	},

	setSelectedQuarter: quarterId => {
		set({ selectedQuarterId: quarterId })
	},
}))

export default useScoresStore
