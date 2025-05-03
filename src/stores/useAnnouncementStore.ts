import { useEffect } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import supabase from '../config/supabaseClient'
import { showError, showSuccess } from '../utils/toast'

// Define types for announcements
export interface Announcement {
	id: string
	title: string
	content: string
	isImportant: boolean
	targetAudience: 'all' | 'student' | 'teacher' | 'admin'
	created_at: string
	created_by:
		| string
		| {
				id: string
				name: string
		  }
	photo_url?: string
	video_url?: string
	isRead?: boolean
	[key: string]: any
}

// Mock function to simulate announcement creation in Supabase
const mockCreateAnnouncement = async (
	announcement: Omit<Announcement, 'id' | 'created_at' | 'isRead'>
) => {
	// Simulate network delay
	await new Promise(resolve => setTimeout(resolve, 800))

	// Generate a random ID and timestamp
	const id = Math.random().toString(36).substring(2, 15)
	const createdAt = new Date().toISOString()

	return {
		id,
		...announcement,
		createdAt,
		isRead: false,
	}
}

// Define the store state type
interface AnnouncementState {
	announcements: Announcement[]
	isLoading: boolean
	error: string | null
	unreadCount: number

	// Actions
	fetchAnnouncements: (targetAudience: string) => Promise<void>
	createAnnouncement: (
		announcement: Omit<Announcement, 'id' | 'createdAt' | 'isRead'>
	) => Promise<boolean>
	deleteAnnouncement: (id: string) => Promise<boolean>
	markAsRead: (id: string) => void
	markAllAsRead: () => void
	refreshAnnouncements: () => Promise<void>
	subscribeToAnnouncements: () => void
}

// Create the store with persistence
export const useAnnouncementStore = create<AnnouncementState>()(
	persist(
		(set, get) => ({
			announcements: [],
			isLoading: false,
			error: null,
			unreadCount: 0,

			fetchAnnouncements: async (targetAudience: string = 'All') => {
				set({ isLoading: true, error: null })
				try {
					let targetAudienceArray = []

					if (targetAudience === 'All') {
						targetAudienceArray = ['All', 'Student', 'Teacher', 'Admin', "Parent"]
					} else {
						targetAudienceArray = [targetAudience, 'All']
					}

					const { data, error } = await supabase
						.from('announcements')
						.select(
							`
							id,
							title,
							content,
							isImportant,
							targetAudience,
							created_by,
							created_at,
							created_by_name,
							video_url,
							photo_url,
							video_name,
							photo_name
						`
						)
						// implement a ternary operator to check if the targetAudience is All, then pass all roles else pass the targetAudience

						.in('targetAudience', targetAudienceArray)
						.order('created_at', { ascending: false })

					if (!data && error) {
						throw new Error('Failed to fetch announcements')
					}

					// Get read announcement IDs from 'read-announcement-ids' in localStorage
					let readAnnouncementIds = [];
					try {
						const readIdsStr = localStorage.getItem('read-announcement-ids');
						if (readIdsStr) {
							const parsed = JSON.parse(readIdsStr);
							readAnnouncementIds = Array.isArray(parsed) ? parsed : [];
						}
					} catch (error) {
						console.error('Error parsing read announcement IDs:', error);
						readAnnouncementIds = [];
					}


					const announcementsWithIsRead =
						data?.map(a => ({
							...a,
							isRead: Array.isArray(readAnnouncementIds) && readAnnouncementIds.includes(a.id) ? true : false,
						})) || []

					set({
						announcements: announcementsWithIsRead,
						unreadCount: announcementsWithIsRead.filter(a => !a.isRead).length,
					})
				} catch (error) {
					set({ error: 'Failed to fetch announcements' })
					console.error('Error fetching announcements:', error)
				} finally {
					set({ isLoading: false })
				}
			},

			// Subscribe to real-time updates for announcements
			subscribeToAnnouncements: async () => {
				// Get user from localStorage
				let user = null;
				try {
					const userStr = localStorage.getItem('lms_user');
					if (userStr) {
						user = JSON.parse(userStr);
					}
				} catch (error) {
					console.error('Error parsing user from localStorage:', error);
					return;
				}

				if (!user) return;

				console.log("Setting up real-time subscription for announcements");

				// Get user role for filtering
				const userRole = user.role?.toLowerCase();

				try {
					// Unsubscribe from any existing subscription
					if (supabase.getChannels().length > 0) {
						supabase.removeAllChannels();
					}

					// Subscribe to the 'announcements' table
					const channel = supabase
						.channel('public:announcements')
						.on('postgres_changes', {
							event: '*',
							schema: 'public',
							table: 'announcements'
						}, async (payload) => {
							console.log('Real-time announcement update:', payload);

							// Handle INSERT event - new announcement
							if (payload.eventType === 'INSERT') {
								const newAnnouncement = payload.new;

								// Check if this announcement is targeted to the current user's role
								if (
									newAnnouncement.targetAudience === 'all' ||
									newAnnouncement.targetAudience === userRole
								) {
									// Fetch the creator's name
									let creatorName = 'Unknown';
									try {
										const { data: userData } = await supabase
											.from('users')
											.select('firstName, lastName')
											.eq('id', newAnnouncement.created_by)
											.single();

										if (userData) {
											creatorName = `${userData.firstName} ${userData.lastName}`;
										}
									} catch (err) {
										console.error('Error fetching creator name:', err);
									}

									// Create the complete announcement object
									const announcement = {
										...newAnnouncement,
										created_by_name: creatorName,
										isRead: false,
									};

									// Update state with the new announcement

									set(state => {
										const newState = {
											...state,
											announcements: [announcement, ...state.announcements],
											unreadCount: state.unreadCount + 1,
										};
										return newState as AnnouncementState;
									});

									// Play notification sound
									playNotificationSound();
								}
							}

							// Handle DELETE event - deleted announcement
							if (payload.eventType === 'DELETE') {
								const deletedId = payload.old.id;

								set(state => {
									// Check if the deleted announcement was unread
									const wasUnread = state.announcements.find(
										a => a.id === deletedId && !a.isRead
									);

									return {
										...state,
										announcements: state.announcements.filter(a => a.id !== deletedId),
										unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
									};
								});
							}

							// Handle UPDATE event if needed
							if (payload.eventType === 'UPDATE') {
								const updatedAnnouncement = payload.new;

								set(state => ({
									...state,
									announcements: state.announcements.map(a =>
										a.id === updatedAnnouncement.id
											? { ...a, ...updatedAnnouncement }
											: a
									),
								}));
							}
						})
						.subscribe();

					return () => {
						supabase.removeChannel(channel);
					};
				} catch (error) {
					console.error('Error setting up real-time subscription:', error);
				}
			},

			createAnnouncement: async announcement => {
				set({ isLoading: true, error: null })
				try {
					// In a real app, we would call Supabase here
					const { data: newAnnouncement, error: createError } = await supabase
						.from('announcements')
						.insert([announcement])
						.select()
						.single()

					if (createError) throw createError

					set(state => ({
						announcements: [{ ...newAnnouncement, isRead: false }, ...state.announcements],
						unreadCount: state.unreadCount + 1,
					}))

					showSuccess('Announcement created successfully!')
					return true
				} catch (error) {
					set({ error: 'Failed to create announcement' })
					console.error('Error creating announcement:', error)
					showError('Failed to create announcement')
					return false
				} finally {
					set({ isLoading: false })
				}
			},

			deleteAnnouncement: async id => {
				set({ isLoading: true, error: null })
				try {
					// Check if user is admin
					const {
						data: { user },
					} = await supabase.auth.getUser()
					if (!user) {
						throw new Error('User not authenticated')
					}

					// First, get the announcement to access its media URLs
					const { data: announcement, error: fetchError } = await supabase
						.from('announcements')
						.select('photo_url, video_url, photo_name, video_name')
						.eq('id', id)
						.single()
					if (fetchError) {
						throw new Error('Failed to fetch announcement details')
					}

					// Delete media files from storage if they exist
					if (announcement.photo_name) {
						const { error: photoError } = await supabase.storage
							.from('lms')
							.remove([announcement.photo_name])
						if (photoError) {
							console.error('Error deleting photo:', photoError)
						}
					}

					if (announcement.video_name) {
						const { error: videoError } = await supabase.storage
							.from('lms')
							.remove([announcement.video_name])
						if (videoError) {
							console.error('Error deleting video:', videoError)
						}
					}

					// Delete the announcement from the database
					const { error: deleteError } = await supabase.from('announcements').delete().eq('id', id)

					if (deleteError) throw deleteError

					set(state => {
						const announcement = state.announcements.find(a => a.id === id)
						const wasUnread = announcement && !announcement.isRead

						return {
							announcements: state.announcements.filter(a => a.id !== id),
							unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
						}
					})

					showSuccess('Announcement deleted successfully')
					return true
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : 'Failed to delete announcement'
					set({ error: errorMessage })
					console.error('Error deleting announcement:', error)
					showError(errorMessage)
					return false
				} finally {
					set({ isLoading: false })
				}
			},

			markAsRead: id => {
				set(state => {
					const updatedAnnouncements = state.announcements.map(announcement =>
						announcement.id === id && !announcement.isRead
							? { ...announcement, isRead: true }
							: announcement
					)

					const updatedUnreadCount = updatedAnnouncements.filter(a => !a.isRead).length

					// Update the read IDs in dedicated localStorage key
					try {
						// Get existing read IDs
						let readIds = [];
						const readIdsStr = localStorage.getItem('read-announcement-ids');
						if (readIdsStr) {
							try {
								const parsed = JSON.parse(readIdsStr);
								readIds = Array.isArray(parsed) ? parsed : [];
							} catch (e) {
								readIds = [];
							}
						}

						// Add the new ID if not already in the list
						if (!readIds.includes(id)) {
							readIds.push(id);
							localStorage.setItem('read-announcement-ids', JSON.stringify(readIds));
						}
					} catch (error) {
						console.error('Error updating read announcements in localStorage:', error);
					}

					return {
						announcements: updatedAnnouncements,
						unreadCount: updatedUnreadCount,
					}
				})
			},

			markAllAsRead: () => {
				set(state => {
					const updatedAnnouncements = state.announcements.map(a => ({ ...a, isRead: true }));

					// Update all read IDs in dedicated localStorage key
					try {
						// Get all announcement IDs
						const allIds = updatedAnnouncements.map(a => a.id);

						// Store directly to the dedicated localStorage key
						localStorage.setItem('read-announcement-ids', JSON.stringify(allIds));
					} catch (error) {
						console.error('Error updating all read announcements in localStorage:', error);
					}

					return {
						announcements: updatedAnnouncements,
						unreadCount: 0,
					}
				})
			},

			refreshAnnouncements: async () => {
				set({ isLoading: true, error: null })
				try {
					// In a real app, we would fetch fresh data from Supabase here
					// For demo, we'll just simulate a refresh delay
					await new Promise(resolve => setTimeout(resolve, 1000))

					// We're not actually refreshing the data in this mock version
					// but in a real app, we would call the API again

					showSuccess('Announcements refreshed')
					return
				} catch (error) {
					set({ error: 'Failed to refresh announcements' })
					console.error('Error refreshing announcements:', error)
					showError('Failed to refresh announcements')
				} finally {
					set({ isLoading: false })
				}
			},
		}),
		{
			name: 'announcements-storage',
			storage: createJSONStorage(() => localStorage),
			partialize: state => ({
				// Only store IDs and unread count, not full announcement objects
				unreadCount: state.unreadCount,
			}),
		}
	)
)

// Export a hook for easier use in the AnnouncementContext
export const useAnnouncements = () => {
	const store = useAnnouncementStore()

	// Set up real-time subscription when the hook is first used
	useEffect(() => {
		// Fetch the user role from localStorage
		let userRole = 'All';
		try {
			const user = JSON.parse(localStorage.getItem('lms_user') || '{}');
			if (user && user.role) {
				userRole = user.role;
			}
		} catch (error) {
			console.error('Error parsing user from localStorage:', error);
		}

		// Initial fetch of announcements
		if (store.announcements.length === 0) {
			store.fetchAnnouncements(userRole);
		}

		// Subscribe to real-time updates
		const subscription = store.subscribeToAnnouncements();

		// Clean up subscription when the component unmounts
		return () => {
			if (typeof subscription === 'function') {
				subscription();
			}
		};
	}, []);

	return {
		announcements: store.announcements,
		isLoading: store.isLoading,
		error: store.error,
		unreadCount: store.unreadCount,
		createAnnouncement: store.createAnnouncement,
		deleteAnnouncement: store.deleteAnnouncement,
		markAsRead: store.markAsRead,
		markAllAsRead: store.markAllAsRead,
		refreshAnnouncements: store.refreshAnnouncements,
		fetchAnnouncements: store.fetchAnnouncements,
	}
}

// Play a notification sound when a new announcement is received
const playNotificationSound = () => {
	try {
		const audio = new Audio('/sounds/notification.mp3');
		audio.volume = 0.5;
		audio.play().catch(err => {
			console.log('Could not play notification sound:', err);
		});
	} catch (err) {
		console.error('Error playing notification sound:', err);
	}
};
