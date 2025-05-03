import supabase from '../config/supabaseClient' // Adjust path if necessary

// Interface for the data structure expected by the calendar component
// (Matches ParentCalendar.tsx for consistency)
interface ClassEvent {
	id: number | string
	title: string // Subject Name
	course: string // Subject Name
	startTime: number // Decimal hour format (e.g., 9.5 for 9:30)
	endTime: number // Decimal hour format
	day: number // 0-6 for Monday-Sunday
	teacher: string // Teacher Name (might be fetched differently if needed)
	location: string
	color: string
	classId?: string
	className?: string // Add className
}

// Helper to get day of week (0=Monday, 6=Sunday) from Date object
const getDayOfWeek = (date: Date): number => {
	const day = date.getDay()
	return day === 0 ? 6 : day - 1 // Adjust Sunday (0) to 6, shift others
}

// Helper to convert HH:MM or hour number to decimal hours
const timeToDecimal = (time: number | string | null | undefined): number => {
	if (typeof time === 'number') {
		// Assume it's already an hour number (e.g., 9, 10)
		// Or handle potential decimal format if needed based on DB schema
		return time
	}
	if (typeof time === 'string') {
		const parts = time.split(':')
		if (parts.length === 2) {
			const hours = parseInt(parts[0], 10)
			const minutes = parseInt(parts[1], 10)
			if (!isNaN(hours) && !isNaN(minutes)) {
				return hours + minutes / 60
			}
		} else {
			// Maybe it's just an hour string "9", "10"
			const hour = parseInt(time, 10)
			if (!isNaN(hour)) return hour
		}
	}
	// Fallback or error case - return a default or throw error
	console.warn('Invalid time format for timeToDecimal:', time)
	return 0
}

/**
 * Fetches the timetable for ALL teachers (Master Schedule).
 * @returns A promise that resolves to an array of ClassEvent objects.
 */
export async function fetchAllTimetableEvents(): Promise<ClassEvent[]> {
	try {
		// Primary attempt
		const { data, error } = await supabase.from('timetable').select(`
        id,
        title,
        location,
        day_date,
        start_time,
        end_time,
        color,
        classId,
        subjectId,
        subjects ( subjectname ),
        teacher:teacherId ( firstName, lastName ),
        classes:classId ( classname )
      `)

		if (error) {
			// Throw the error to be caught and handled by the fallback logic
			console.error('Primary fetch failed:', error)
			throw error
		}

		if (!data) return [] // Return empty if primary fetch yields no data

		// Transform the successful primary data
		const events: ClassEvent[] = data
			.map((entry: any) => {
				const entryDate = entry.day_date ? new Date(entry.day_date) : new Date()
				const startTimeDecimal = timeToDecimal(entry.start_time)
				const endTimeDecimal = timeToDecimal(entry.end_time)
				const subjectName = entry.subjects?.subjectname || entry.title || 'Untitled Event'
				const teacherName = entry.teacher?.full_name || 'Unknown Teacher'
				const className = entry.classes?.classname || 'Unknown Class' // Get class name
				return {
					id: entry.id,
					title: subjectName,
					course: subjectName,
					startTime: startTimeDecimal,
					endTime: endTimeDecimal,
					day: getDayOfWeek(entryDate),
					location: entry.location || 'N/A',
					color: entry.color || '#3182CE',
					classId: entry.classId,
					className: className, // Add className to returned object
					teacher: teacherName,
				}
			})
			.filter(event => event.startTime < event.endTime)
		return events
	} catch (err) {
		console.warn('Primary timetable fetch failed, attempting fallback...', err)
		// Fallback attempt inside catch block
		try {
			const { data: fallbackData, error: fallbackError } = await supabase.from('timetable').select(`
           id, title, location, day_date, start_time, end_time, color, classId, subjectId,
           subjects ( subjectname ),
           teacher:teacherId ( firstName, lastName ),
           classes:classId ( classname )
         `)

			if (fallbackError) {
				console.error('Fallback timetable fetch also failed:', fallbackError)
				throw fallbackError // Re-throw if fallback fails
			}

			if (!fallbackData) return [] // Return empty if fallback yields no data

			// Transform the successful fallback data
			console.log('Fallback fetch successful.')
			const fallbackEvents: ClassEvent[] = fallbackData
				.map((entry: any) => {
					const entryDate = entry.day_date ? new Date(entry.day_date) : new Date()
					const startTimeDecimal = timeToDecimal(entry.start_time)
					const endTimeDecimal = timeToDecimal(entry.end_time)
					const subjectName = entry.subjects?.subjectname || entry.title || 'Untitled Event'
					const teacherName =
						entry.teacher?.firstName + ' ' + entry.teacher?.lastName || 'Unknown Teacher'
					const className = entry.classes?.classname || 'Unknown Class' // Get class name in fallback
					return {
						id: entry.id,
						title: subjectName,
						course: subjectName,
						startTime: startTimeDecimal,
						endTime: endTimeDecimal,
						day: getDayOfWeek(entryDate),
						location: entry.location || 'N/A',
						color: entry.color || '#3182CE',
						classId: entry.classId,
						className: className, // Add className in fallback
						teacher: teacherName,
					}
				})
				.filter(event => event.startTime < event.endTime)
			return fallbackEvents
		} catch (finalError) {
			console.error('Failed to fetch master timetable after fallback:', finalError)
			return [] // Return empty array after all attempts fail
		}
	}
}
