import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import {
	Announcement,
	createAnnouncement as createAnnouncementService,
	deleteAnnouncement as deleteAnnouncementService,
	getAnnouncementsForRole,
} from '../utils/announcementService'

// Define types for the context
interface AnnouncementContextType {
	announcements: Announcement[]
	unreadCount: number
	isLoading: boolean
	error: string | null
	createAnnouncement: (formData: any) => Promise<boolean>
	markAsRead: (id: string) => void
	markAllAsRead: () => void
	deleteAnnouncement: (id: string) => Promise<boolean>
	refreshAnnouncements: () => Promise<void>
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined)

// Mock data for fallback or development
const mockAnnouncements: Announcement[] = []

export const AnnouncementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const { user } = useAuth()
	const [announcements, setAnnouncements] = useState<Announcement[]>([])
	const [unreadCount, setUnreadCount] = useState(0)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Function to fetch announcements
	const fetchAnnouncements = async () => {
		if (!user) {
			// If no user, use mock data in development
			if (process.env.NODE_ENV === 'development') {
				setAnnouncements(mockAnnouncements)
				setUnreadCount(mockAnnouncements.filter(a => !a.isRead).length)
			}
			setIsLoading(false)
			return
		}

		try {
			setIsLoading(true)
			setError(null)

			const { data, error } = await getAnnouncementsForRole(user.role)

			if (error) {
				throw error
			}

			if (data) {
				setAnnouncements(data)
				setUnreadCount(data.filter(a => !a.isRead).length)
			}
		} catch (err) {
			console.error('Error fetching announcements:', err)
			setError('Failed to fetch announcements. Please try again later.')

			// Use mock data as fallback in development
			if (process.env.NODE_ENV === 'development') {
				setAnnouncements(mockAnnouncements)
				setUnreadCount(mockAnnouncements.filter(a => !a.isRead).length)
			}
		} finally {
			setIsLoading(false)
		}
	}

	// Load announcements on mount
	useEffect(() => {
		fetchAnnouncements()

		// Apply read status from the dedicated localStorage key
		const readAnnouncementIds = localStorage.getItem('read-announcement-ids')
		if (readAnnouncementIds) {
			try {
				const readIds = JSON.parse(readAnnouncementIds)
				if (Array.isArray(readIds)) {
					setAnnouncements(prevAnnouncements =>
						prevAnnouncements.map(announcement => ({
							...announcement,
							isRead: readIds.includes(announcement.id) || announcement.isRead,
						}))
					)
				}
			} catch (error) {
				console.error('Error parsing read announcement IDs:', error)
			}
		}
	}, [])

	// Refresh announcements
	const refreshAnnouncements = async () => {
		await fetchAnnouncements()
	}

	// Function to create a new announcement
	const createAnnouncement = async (formData: any): Promise<boolean> => {
		setIsLoading(true)
		setError(null)

		try {
			const newAnnouncement = await createAnnouncementService({
				title: formData.title,
				content: formData.content,
				isImportant: formData.isImportant,
				targetAudience: formData.targetAudience,
				photo_url: formData.photo_url,
				video_url: formData.video_url,
			})

			if (newAnnouncement) {
				// Add the new announcement to our local state
				setAnnouncements(prev => [newAnnouncement, ...prev])
				return true
			} else {
				setError('Failed to create announcement')
				return false
			}
		} catch (err) {
			console.error('Error in createAnnouncement:', err)
			setError('An unexpected error occurred')
			return false
		} finally {
			setIsLoading(false)
		}
	}

	// Mark an announcement as read
	const markAsRead = (id: string) => {
		setAnnouncements(prevAnnouncements =>
			prevAnnouncements.map(announcement =>
				announcement.id === id ? { ...announcement, isRead: true } : announcement
			)
		)

		// Save to the dedicated localStorage key
		try {
			// Get existing read IDs
			let readIds = [];
			const readIdsStr = localStorage.getItem('read-announcement-ids');
			if (readIdsStr) {
				const parsed = JSON.parse(readIdsStr);
				readIds = Array.isArray(parsed) ? parsed : [];
			}
			
			// Add the new ID if not already in the list
			if (!readIds.includes(id)) {
				readIds.push(id);
				localStorage.setItem('read-announcement-ids', JSON.stringify(readIds));
			}
		} catch (error) {
			console.error('Error updating read announcements in localStorage:', error);
		}
	}

	// Mark all announcements as read
	const markAllAsRead = () => {
		// Mark all announcements as read in state
		setAnnouncements(prevAnnouncements =>
			prevAnnouncements.map(announcement => ({ ...announcement, isRead: true }))
		)

		// Set unread count to 0
		setUnreadCount(0)

		// Save to the dedicated localStorage key
		try {
			const allIds = announcements.map(a => a.id)
			localStorage.setItem('read-announcement-ids', JSON.stringify(allIds))
		} catch (error) {
			console.error('Error updating all read announcements in localStorage:', error)
		}
	}

	// Function to delete an announcement
	const deleteAnnouncement = async (id: string) => {
		if (!user) return false

		try {
			setError(null)

			const { success, error } = await deleteAnnouncementService(id)

			if (error) {
				throw error
			}

			if (success) {
				// Update local state to remove the deleted announcement
				setAnnouncements(prev => prev.filter(a => a.id !== id))
				// Update unread count if the deleted announcement was unread
				const deletedAnnouncement = announcements.find(a => a.id === id)
				if (deletedAnnouncement && !deletedAnnouncement.isRead) {
					setUnreadCount(prev => prev - 1)
				}
				return true
			}

			return false
		} catch (err) {
			console.error('Error deleting announcement:', err)
			setError('Failed to delete announcement. Please try again later.')
			return false
		}
	}

	const value = {
		announcements,
		unreadCount,
		isLoading,
		error,
		createAnnouncement,
		markAsRead,
		markAllAsRead,
		deleteAnnouncement,
		refreshAnnouncements,
	}

	return <AnnouncementContext.Provider value={value}>{children}</AnnouncementContext.Provider>
}

export const useAnnouncements = (): AnnouncementContextType => {
	const context = useContext(AnnouncementContext)
	if (context === undefined) {
		throw new Error('useAnnouncements must be used within an AnnouncementProvider')
	}
	return context
}
