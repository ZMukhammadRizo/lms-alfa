import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
	subscribeToAttendanceUpdates,
	subscribeToScoresUpdates,
	unsubscribeAll,
} from '../services/notificationService'
import {
	Assignment,
	AttendanceRecord,
	Grade,
	ParentNotification,
	ParentStudentRelation,
	StudentSummary,
} from '../types/parent'

// Mock data for development
const MOCK_LINKED_STUDENTS: ParentStudentRelation[] = [
	{
		id: '1',
		parentId: 'parent-1',
		studentId: 'student-1',
		relationshipType: 'mother',
		isVerified: true,
		status: 'active',
		createdAt: '2023-04-15T10:30:00Z',
		updatedAt: '2023-04-15T10:30:00Z',
	},
	{
		id: '2',
		parentId: 'parent-1',
		studentId: 'student-2',
		relationshipType: 'mother',
		isVerified: true,
		status: 'active',
		createdAt: '2023-04-15T10:30:00Z',
		updatedAt: '2023-04-15T10:30:00Z',
	},
]

const MOCK_STUDENT_DATA: Record<string, StudentSummary> = {
	'student-1': {
		id: 'student-1',
		name: 'Alex Johnson',
		grade: '10th Grade',
		className: 'Class A',
		avatar: '',
		overallGrade: 'B+',
		attendance: 92,
		pendingAssignments: 5,
		unreadMessages: 3,
	},
	'student-2': {
		id: 'student-2',
		name: 'Emma Johnson',
		grade: '8th Grade',
		className: 'Class C',
		avatar: '',
		overallGrade: 'A-',
		attendance: 96,
		pendingAssignments: 2,
		unreadMessages: 1,
	},
}

// Mock assignments data
const MOCK_ASSIGNMENTS: Record<string, Assignment[]> = {
	'student-1': [
		{
			id: '1',
			subject: 'Mathematics',
			title: 'Algebra Quiz',
			description: 'Solve the algebra problems from Chapter 5',
			dueDate: '2023-05-10T23:59:59Z',
			status: 'Pending',
		},
		{
			id: '2',
			subject: 'Science',
			title: 'Physics Lab Report',
			description: 'Write a report on the recent physics experiment',
			dueDate: '2023-05-12T23:59:59Z',
			status: 'Not Started',
		},
		{
			id: '3',
			subject: 'Literature',
			title: 'Book Analysis',
			description: 'Analyze the characters in the assigned book',
			dueDate: '2023-05-13T23:59:59Z',
			status: 'In Progress',
		},
	],
	'student-2': [
		{
			id: '4',
			subject: 'History',
			title: 'Ancient Civilizations Essay',
			description: 'Write an essay about ancient Egyptian civilization',
			dueDate: '2023-05-11T23:59:59Z',
			status: 'In Progress',
		},
		{
			id: '5',
			subject: 'Art',
			title: 'Painting Project',
			description: 'Create a watercolor landscape painting',
			dueDate: '2023-05-15T23:59:59Z',
			status: 'Not Started',
		},
	],
}

// Mock grades data
const MOCK_GRADES: Record<string, Grade[]> = {
	'student-1': [
		{
			id: '1',
			subject: 'Mathematics',
			title: 'Mid-term Exam',
			grade: 'A-',
			score: '92/100',
			date: '2023-04-28T14:30:00Z',
			type: 'Exam',
		},
		{
			id: '2',
			subject: 'Science',
			title: 'Biology Quiz',
			grade: 'B+',
			score: '85/100',
			date: '2023-04-27T10:15:00Z',
			type: 'Quiz',
		},
		{
			id: '3',
			subject: 'History',
			title: 'Essay Submission',
			grade: 'A',
			score: '95/100',
			date: '2023-04-21T16:45:00Z',
			type: 'Assignment',
		},
	],
	'student-2': [
		{
			id: '4',
			subject: 'English',
			title: 'Grammar Quiz',
			grade: 'A',
			score: '98/100',
			date: '2023-04-26T09:30:00Z',
			type: 'Quiz',
		},
		{
			id: '5',
			subject: 'Mathematics',
			title: 'Geometry Test',
			grade: 'B',
			score: '82/100',
			date: '2023-04-24T11:00:00Z',
			type: 'Exam',
		},
	],
}

// Mock attendance data
const MOCK_ATTENDANCE: Record<string, AttendanceRecord[]> = {
	'student-1': [
		{
			id: '1',
			date: '2023-05-01T08:00:00Z',
			status: 'Present',
			subject: 'Mathematics',
			period: '1st Period',
		},
		{
			id: '2',
			date: '2023-05-01T09:00:00Z',
			status: 'Present',
			subject: 'Science',
			period: '2nd Period',
		},
		{
			id: '3',
			date: '2023-05-01T10:00:00Z',
			status: 'Late',
			notes: 'Arrived 10 minutes late',
			subject: 'History',
			period: '3rd Period',
		},
		{
			id: '4',
			date: '2023-05-02T08:00:00Z',
			status: 'Absent',
			notes: 'Doctor appointment',
			subject: 'Mathematics',
			period: '1st Period',
		},
	],
	'student-2': [
		{
			id: '5',
			date: '2023-05-01T08:00:00Z',
			status: 'Present',
			subject: 'English',
			period: '1st Period',
		},
		{
			id: '6',
			date: '2023-05-01T09:00:00Z',
			status: 'Present',
			subject: 'Art',
			period: '2nd Period',
		},
		{
			id: '7',
			date: '2023-05-01T10:00:00Z',
			status: 'Present',
			subject: 'Mathematics',
			period: '3rd Period',
		},
	],
}

// Mock notifications data
const MOCK_NOTIFICATIONS: ParentNotification[] = [
	{
		id: '1',
		title: 'New Assignment Added',
		message: 'A new Mathematics assignment has been added for Alex Johnson',
		studentId: 'student-1',
		createdAt: '2023-05-01T12:30:00Z',
		isRead: false,
		type: 'Assignment',
	},
	{
		id: '2',
		title: 'Grade Posted',
		message: 'A new grade has been posted for Science Quiz',
		studentId: 'student-1',
		createdAt: '2023-04-29T15:45:00Z',
		isRead: true,
		type: 'Grade',
	},
	{
		id: '3',
		title: 'Attendance Alert',
		message: 'Alex Johnson was marked late for History class today',
		studentId: 'student-1',
		createdAt: '2023-05-01T11:00:00Z',
		isRead: false,
		type: 'Attendance',
	},
	{
		id: '4',
		title: 'New Message from Teacher',
		message: 'You have a new message from Mrs. Smith',
		studentId: 'student-2',
		createdAt: '2023-04-30T09:15:00Z',
		isRead: false,
		type: 'Message',
	},
]

interface ParentStoreState {
	// State
	selectedStudentId: string | null
	linkedStudents: ParentStudentRelation[]
	studentData: Record<string, StudentSummary>
	assignments: Record<string, Assignment[]>
	grades: Record<string, Grade[]>
	attendance: Record<string, AttendanceRecord[]>
	notifications: ParentNotification[]
	isLoading: boolean
	error: string | null
	realtimeInitialized: boolean

	// Actions
	setSelectedStudent: (studentId: string) => void
	fetchLinkedStudents: () => Promise<void>
	fetchStudentData: (studentId: string) => Promise<void>
	fetchStudentAssignments: (studentId: string) => Promise<Assignment[]>
	fetchStudentGrades: (studentId: string) => Promise<Grade[]>
	fetchStudentAttendance: (studentId: string) => Promise<AttendanceRecord[]>
	fetchNotifications: () => Promise<ParentNotification[]>
	markNotificationAsRead: (notificationId: string) => void
	markAllNotificationsAsRead: () => void
	initializeRealtimeUpdates: () => void
	addNotification: (notification: ParentNotification) => void
	cleanupRealtimeUpdates: () => void
}

// Create the store with persistence
export const useParentStore = create<ParentStoreState>()(
	persist(
		(set, get) => ({
			// Initial state
			selectedStudentId: null,
			linkedStudents: MOCK_LINKED_STUDENTS,
			studentData: MOCK_STUDENT_DATA,
			assignments: MOCK_ASSIGNMENTS,
			grades: MOCK_GRADES,
			attendance: MOCK_ATTENDANCE,
			notifications: MOCK_NOTIFICATIONS,
			isLoading: false,
			error: null,
			realtimeInitialized: false,

			// Actions
			setSelectedStudent: studentId => {
				if (get().linkedStudents.some(relation => relation.studentId === studentId)) {
					set({ selectedStudentId: studentId })
				}
			},

			fetchLinkedStudents: async () => {
				try {
					set({ isLoading: true, error: null })
					// TODO: Replace with actual API call when backend is implemented
					// const response = await api.get('/parent/linked-students');
					// const data = response.data;

					// Using mock data for now
					const data = MOCK_LINKED_STUDENTS

					set({
						linkedStudents: data,
						selectedStudentId:
							get().selectedStudentId || (data.length > 0 ? data[0].studentId : null),
						isLoading: false,
					})

					return
				} catch (error) {
					set({
						isLoading: false,
						error: error instanceof Error ? error.message : 'Failed to fetch linked students',
					})
				}
			},

			fetchStudentData: async studentId => {
				try {
					set({ isLoading: true, error: null })
					// TODO: Replace with actual API call when backend is implemented
					// const response = await api.get(`/parent/student/${studentId}`);
					// const data = response.data;

					// Using mock data for now
					const data = MOCK_STUDENT_DATA[studentId]

					if (data) {
						set(state => ({
							studentData: {
								...state.studentData,
								[studentId]: data,
							},
							isLoading: false,
						}))
					} else {
						set({
							isLoading: false,
							error: `Student data not found for ID: ${studentId}`,
						})
					}

					return
				} catch (error) {
					set({
						isLoading: false,
						error: error instanceof Error ? error.message : 'Failed to fetch student data',
					})
				}
			},

			fetchStudentAssignments: async studentId => {
				try {
					set({ isLoading: true, error: null })
					// TODO: Replace with actual API call when backend is implemented
					// const response = await api.get(`/parent/student/${studentId}/assignments`);
					// const data = response.data;

					// Using mock data for now
					const data = MOCK_ASSIGNMENTS[studentId] || []

					set(state => ({
						assignments: {
							...state.assignments,
							[studentId]: data,
						},
						isLoading: false,
					}))

					return data
				} catch (error) {
					set({
						isLoading: false,
						error: error instanceof Error ? error.message : 'Failed to fetch assignments',
					})
					return []
				}
			},

			fetchStudentGrades: async studentId => {
				try {
					set({ isLoading: true, error: null })
					// TODO: Replace with actual API call when backend is implemented
					// const response = await api.get(`/parent/student/${studentId}/grades`);
					// const data = response.data;

					// Using mock data for now
					const data = MOCK_GRADES[studentId] || []

					set(state => ({
						grades: {
							...state.grades,
							[studentId]: data,
						},
						isLoading: false,
					}))

					return data
				} catch (error) {
					set({
						isLoading: false,
						error: error instanceof Error ? error.message : 'Failed to fetch grades',
					})
					return []
				}
			},

			fetchStudentAttendance: async studentId => {
				try {
					set({ isLoading: true, error: null })
					// TODO: Replace with actual API call when backend is implemented
					// const response = await api.get(`/parent/student/${studentId}/attendance`);
					// const data = response.data;

					// Using mock data for now
					const data = MOCK_ATTENDANCE[studentId] || []

					set(state => ({
						attendance: {
							...state.attendance,
							[studentId]: data,
						},
						isLoading: false,
					}))

					return data
				} catch (error) {
					set({
						isLoading: false,
						error: error instanceof Error ? error.message : 'Failed to fetch attendance records',
					})
					return []
				}
			},

			fetchNotifications: async () => {
				try {
					set({ isLoading: true, error: null })
					// TODO: Replace with actual API call when backend is implemented
					// const response = await api.get('/parent/notifications');
					// const data = response.data;

					// Using mock data for now
					const data = MOCK_NOTIFICATIONS

					set({
						notifications: data,
						isLoading: false,
					})

					return data
				} catch (error) {
					set({
						isLoading: false,
						error: error instanceof Error ? error.message : 'Failed to fetch notifications',
					})
					return []
				}
			},

			markNotificationAsRead: notificationId => {
				set(state => ({
					notifications: state.notifications.map(notification =>
						notification.id === notificationId ? { ...notification, isRead: true } : notification
					),
				}))
			},

			markAllNotificationsAsRead: () => {
				set(state => ({
					notifications: state.notifications.map(notification => ({
						...notification,
						isRead: true,
					})),
				}))
			},

			// Add a new notification
			addNotification: (notification: ParentNotification) => {
				set(state => {
					// Avoid duplicate notifications
					const isDuplicate = state.notifications.some(
						n =>
							n.type === notification.type &&
							n.studentId === notification.studentId &&
							n.message === notification.message
					)

					if (isDuplicate) {
						return state
					}

					// Add the new notification at the beginning of the array
					return {
						...state,
						notifications: [notification, ...state.notifications],
					}
				})

				// Play notification sound if available
				try {
					const audio = new Audio('/notification-sound.mp3')
					audio.play()
				} catch (error) {
					console.log('Notification sound could not be played', error)
				}
			},

			// Initialize realtime updates for child records
			initializeRealtimeUpdates: () => {
				const state = get()

				// Don't initialize again if already done
				if (state.realtimeInitialized) {
					return
				}

				// Get all child IDs
				const childIds = state.linkedStudents.map(student => student.studentId)

				if (childIds.length === 0) {
					return
				}

				// Subscribe to attendance updates
				subscribeToAttendanceUpdates(childIds, notification => {
					get().addNotification(notification)
				})

				// Subscribe to score updates
				subscribeToScoresUpdates(childIds, notification => {
					get().addNotification(notification)
				})

				// Mark as initialized
				set({ realtimeInitialized: true })
			},

			// Cleanup realtime subscriptions
			cleanupRealtimeUpdates: () => {
				unsubscribeAll()
				set({ realtimeInitialized: false })
			},
		}),
		{
			name: 'parent-store', // name for localStorage
			partialize: state => ({
				selectedStudentId: state.selectedStudentId,
				// Only persist selected student and read status of notifications
				notifications: state.notifications.map(({ id, isRead }) => ({ id, isRead })),
			}),
		}
	)
)

// Export a hook for accessing parent store
export const useParent = () => useParentStore()

// Export selectors for optimized component rendering
export const useSelectedStudent = () => useParentStore(state => state.selectedStudentId)
export const useStudentData = (studentId: string) =>
	useParentStore(state => state.studentData[studentId])
export const useStudentAssignments = (studentId: string) =>
	useParentStore(state => state.assignments[studentId] || [])
export const useStudentGrades = (studentId: string) =>
	useParentStore(state => state.grades[studentId] || [])
export const useStudentAttendance = (studentId: string) =>
	useParentStore(state => state.attendance[studentId] || [])
export const useUnreadNotificationsCount = () =>
	useParentStore(state => state.notifications.filter(notification => !notification.isRead).length)
