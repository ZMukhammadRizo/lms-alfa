import { RealtimeChannel } from '@supabase/supabase-js'
import supabase from '../config/supabaseClient'
import { ParentNotification } from '../types/parent'

// Track active subscription channels
const activeChannels: RealtimeChannel[] = []

/**
 * Subscribe to attendance updates for specific children
 */
export const subscribeToAttendanceUpdates = (
	childIds: string[],
	callback: (notification: ParentNotification) => void
) => {
	if (!childIds.length) return

	const channel = supabase
		.channel('attendance-updates')
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'attendance',
				filter: `student_id=in.(${childIds.join(',')})`,
			},
			payload => {
				// Create notification from payload
				const studentId = payload.new?.student_id || payload.old?.student_id
				const eventType = payload.eventType

				if (!studentId) return

				// Create appropriate notification based on the event type
				const notification: ParentNotification = {
					id: crypto.randomUUID(),
					title: 'Attendance Update',
					message: `Attendance record ${
						eventType === 'DELETE' ? 'removed' : 'updated'
					} for your child`,
					studentId,
					createdAt: new Date().toISOString(),
					isRead: false,
					type: 'Attendance',
				}

				callback(notification)
			}
		)
		.subscribe()

	activeChannels.push(channel)
}

/**
 * Subscribe to scores updates for specific children
 */
export const subscribeToScoresUpdates = (
	childIds: string[],
	callback: (notification: ParentNotification) => void
) => {
	if (!childIds.length) return

	const channel = supabase
		.channel('scores-updates')
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'scores',
				filter: `student_id=in.(${childIds.join(',')})`,
			},
			payload => {
				// Create notification from payload
				const studentId = payload.new?.student_id || payload.old?.student_id
				const eventType = payload.eventType

				if (!studentId) return

				// Create appropriate notification based on the event type
				const notification: ParentNotification = {
					id: crypto.randomUUID(),
					title: 'Grade Update',
					message: `${
						eventType === 'INSERT'
							? 'New grade added'
							: eventType === 'UPDATE'
							? 'Grade updated'
							: 'Grade removed'
					} for your child`,
					studentId,
					createdAt: new Date().toISOString(),
					isRead: false,
					type: 'Grade',
				}

				callback(notification)
			}
		)
		.subscribe()

	activeChannels.push(channel)
}

/**
 * Unsubscribe from all active channels
 */
export const unsubscribeAll = () => {
	activeChannels.forEach(channel => {
		supabase.removeChannel(channel)
	})

	// Clear the array
	activeChannels.length = 0
}
