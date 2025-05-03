import { create } from 'zustand'
import {
	addStudentToClass,
	addVideoToClass,
	createClass,
	deleteClass,
	deleteVideo,
	getClassById,
	getTeacherClasses,
	removeStudentFromClass,
	updateClass,
} from '../api/teacher'
import { Class, Video } from '../types/teacher'

interface TeacherStore {
	classes: Class[]
	currentClass: Class | null
	currentVideo: Video | null
	loading: boolean
	error: string | null

	// Actions
	loadClasses: (teacherId: string) => Promise<void>
	loadClass: (classId: string) => Promise<void>
	createNewClass: (classData: Omit<Class, 'id' | 'createdAt'>) => Promise<void>
	updateExistingClass: (classId: string, classData: Partial<Class>) => Promise<void>
	removeClass: (classId: string) => Promise<void>
	addStudent: (classId: string, studentId: string) => Promise<void>
	removeStudent: (classId: string, studentId: string) => Promise<void>
	addVideo: (videoData: Omit<Video, 'id'>) => Promise<void>
	removeVideo: (videoId: string) => Promise<void>
	setError: (error: string | null) => void
}

export const useTeacherStore = create<TeacherStore>((set, get) => ({
	classes: [],
	currentClass: null,
	currentVideo: null,
	loading: false,
	error: null,

	loadClasses: async teacherId => {
		set({ loading: true, error: null })
		try {
			const data = await getTeacherClasses(teacherId)
			set({ classes: data, loading: false })
		} catch (error) {
			set({ error: 'Failed to load classes', loading: false })
		}
	},

	loadClass: async classId => {
		set({ loading: true, error: null })
		try {
			const data = await getClassById(classId)
			set({ currentClass: data, loading: false })
		} catch (error) {
			set({ error: 'Failed to load class', loading: false })
		}
	},

	createNewClass: async classData => {
		set({ loading: true, error: null })
		try {
			const newClass = await createClass(classData)
			set(state => ({
				classes: [...state.classes, newClass],
				loading: false,
			}))
		} catch (error) {
			set({ error: 'Failed to create class', loading: false })
		}
	},

	updateExistingClass: async (classId, classData) => {
		set({ loading: true, error: null })
		try {
			const updatedClass = await updateClass(classId, classData)
			set(state => ({
				classes: state.classes.map(cls => (cls.id === classId ? updatedClass : cls)),
				currentClass: state.currentClass?.id === classId ? updatedClass : state.currentClass,
				loading: false,
			}))
		} catch (error) {
			set({ error: 'Failed to update class', loading: false })
		}
	},

	removeClass: async classId => {
		set({ loading: true, error: null })
		try {
			await deleteClass(classId)
			set(state => ({
				classes: state.classes.filter(cls => cls.id !== classId),
				loading: false,
			}))
		} catch (error) {
			set({ error: 'Failed to delete class', loading: false })
		}
	},

	addStudent: async (classId, studentId) => {
		set({ loading: true, error: null })
		try {
			await addStudentToClass(classId, studentId)
			await get().loadClass(classId)
			set({ loading: false })
		} catch (error) {
			set({ error: 'Failed to add student', loading: false })
		}
	},

	removeStudent: async (classId, studentId) => {
		set({ loading: true, error: null })
		try {
			await removeStudentFromClass(classId, studentId)
			await get().loadClass(classId)
			set({ loading: false })
		} catch (error) {
			set({ error: 'Failed to remove student', loading: false })
		}
	},

	addVideo: async videoData => {
		set({ loading: true, error: null })
		try {
			const newVideo = await addVideoToClass(videoData)
			if (get().currentClass) {
				await get().loadClass(get().currentClass.id)
			}
			set({ loading: false })
		} catch (error) {
			set({ error: 'Failed to add video', loading: false })
		}
	},

	removeVideo: async videoId => {
		set({ loading: true, error: null })
		try {
			await deleteVideo(videoId)
			if (get().currentClass) {
				await get().loadClass(get().currentClass.id)
			}
			set({ loading: false })
		} catch (error) {
			set({ error: 'Failed to delete video', loading: false })
		}
	},

	setError: error => set({ error }),
}))
