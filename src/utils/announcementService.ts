import supabase from '../config/supabaseClient'
import { PostgrestError } from '@supabase/supabase-js'

// Define types
export interface Announcement {
	id: string
	title: string
	content: string
	isImportant: boolean
	targetAudience: 'all' | 'student' | 'teacher' | 'admin' | 'parent'
	created_at: string
	created_by: string
	photo_url?: string
	video_url?: string
	[key: string]: any
}

export interface CreateAnnouncementData {
	title: string
	content: string
	isImportant: boolean
	targetAudience: 'all' | 'student' | 'teacher' | 'admin' | 'parent'
	photo_url?: string
	video_url?: string
}

// Interface for Supabase database item
interface AnnouncementDbItem {
	id: string
	title: string
	content: string
	isImportant: boolean
	targetAudience: 'all' | 'student' | 'teacher' | 'admin' | 'parent'
	created_at: string
	created_by: string
	photo_url?: string
	video_url?: string
}

// Convert database item to frontend model
const mapDbItemToAnnouncement = (item: AnnouncementDbItem): Announcement => ({
	id: item.id,
	title: item.title,
	content: item.content,
	isImportant: item.isImportant,
	targetAudience: item.targetAudience,
	created_at: item.created_at,
	created_by: item.created_by,
	photo_url: item.photo_url,
	video_url: item.video_url,
})

/**
 * Fetch all announcements from Supabase
 */
export const fetchAnnouncements = async (): Promise<{
	data: Announcement[] | null
	error: PostgrestError | null
}> => {
	try {

		const { data, error } = await supabase
			.from('announcements')
			.select('*')
			.order('created_at', { ascending: false })

		if (error) {
			return { data: null, error }
		}

		// Map DB items to frontend model
		const announcements = data.map(mapDbItemToAnnouncement)
		return { data: announcements, error: null }
	} catch (err) {
		console.error('Error fetching announcements:', err)
		return { data: null, error: err as PostgrestError }
	}
}

/**
 * Create a new announcement in Supabase
 */
export const createAnnouncement = async (
	data: CreateAnnouncementData
): Promise<Announcement | null> => {
	try {
		const { data: { user } } = await supabase.auth.getUser()

		if (!user) {
			console.error('User not authenticated')
			return null
		}

		// Get user's name from the users table
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('firstName, lastName')
			.eq('id', user.id)
			.single()

		if (userError) {
			console.error('Error fetching user data:', userError)
			return null
		}


		// Insert the announcement
		const { data: result, error } = await supabase
			.from('announcements')
			.insert({
				title: data.title,
				content: data.content,
				isImportant: data.isImportant,
				targetAudience: data.targetAudience,
				created_by: user.id,
				photo_url: data.photo_url || null, // Add the image URL field
			})
			.select()
			.single()

		if (error) {
			console.error('Error creating announcement:', error)
			return null
		}

		// Convert from DB format to frontend format
		return {
			id: result.id,
			title: result.title,
			content: result.content,
			isImportant: result.important,
			targetAudience: result.targetAudience,
			created_at: result.created_at,
			created_by: result.created_by,
			photo_url: result.photo_url,
			video_url: result.video_url,
		}
	} catch (error) {
		console.error('Error in createAnnouncement:', error)
		return null
	}
}

/**
 * Delete an announcement from Supabase
 */
export const deleteAnnouncement = async (
	id: string
): Promise<{ success: boolean; error: PostgrestError | null }> => {
	try {
		const { error } = await supabase.from('announcements').delete().eq('id', id)

		if (error) {
			return { success: false, error }
		}

		return { success: true, error: null }
	} catch (err) {
		console.error('Error deleting announcement:', err)
		return { success: false, error: err as PostgrestError }
	}
}

/**
 * Get announcements targeted for a specific role
 */
export const getAnnouncementsForRole = async (
	role: 'student' | 'teacher' | 'admin'
): Promise<{ data: Announcement[] | null; error: PostgrestError | null }> => {
	try {
		// Get announcements for this role or 'all'
		const { data, error } = await supabase
			.from('announcements')
			.select('*')
			.or(`target.eq.${role},target.eq.all`)
			.order('created_at', { ascending: false })

		if (error) {
			return { data: null, error }
		}

		// Map DB items to frontend model
		const announcements = data.map(mapDbItemToAnnouncement)
		return { data: announcements, error: null }
	} catch (err) {
		console.error(`Error fetching announcements for role ${role}:`, err)
		return { data: null, error: err as PostgrestError }
	}
}

/**
 * Get important announcements
 */
export const getImportantAnnouncements = async (): Promise<{
	data: Announcement[] | null
	error: PostgrestError | null
}> => {
	try {
		const { data, error } = await supabase
			.from('announcements')
			.select('*')
			.eq('important', true)
			.order('created_at', { ascending: false })

		if (error) {
			return { data: null, error }
		}

		// Map DB items to frontend model
		const announcements = data.map(mapDbItemToAnnouncement)
		return { data: announcements, error: null }
	} catch (err) {
		console.error('Error fetching important announcements:', err)
		return { data: null, error: err as PostgrestError }
	}
}

/**
 * Get a single announcement by ID
 */
export const getAnnouncementById = async (
	id: string
): Promise<{ data: Announcement | null; error: PostgrestError | null }> => {
	try {
		const { data, error } = await supabase.from('announcements').select('*').eq('id', id).single()

		if (error) {
			return { data: null, error }
		}

		// Map DB item to frontend model
		const announcement = mapDbItemToAnnouncement(data as AnnouncementDbItem)
		return { data: announcement, error: null }
	} catch (err) {
		console.error(`Error fetching announcement with id ${id}:`, err)
		return { data: null, error: err as PostgrestError }
	}
}
