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
	// JS Sunday=0, Monday=1, .. Saturday=6 -> Target Monday=0, ..., Sunday=6
	const result = day === 0 ? 6 : day - 1;
	// console.log(`[getDayOfWeek] Input Date: ${date.toDateString()}, JS Day: ${day}, Result (Mon=0): ${result}`);
	return result
}

// Helper to convert various day formats (0-6, 1-7, "mon"-"sun") to 0-6 (Mon-Sun)
const normalizeDayOfWeek = (dayValue: any, entryId: string | number): number | null => {
	if (dayValue === null || dayValue === undefined) {
		console.log(`[NormalizeDay - ID: ${entryId}] Day value is null/undefined.`);
		return null;
	}

	const dayStr = String(dayValue).toLowerCase().trim();
	console.log(`[NormalizeDay - ID: ${entryId}] Normalizing day: '${dayStr}' (Original: '${dayValue}')`);

	// Handle string names
	const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
	const dayShort = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
	let index = dayNames.indexOf(dayStr);
	if (index !== -1) {
		console.log(`[NormalizeDay - ID: ${entryId}] Matched full name '${dayStr}' to index ${index}`);
		return index; // Returns 0-6 (Mon-Sun)
	}
	index = dayShort.indexOf(dayStr);
	if (index !== -1) {
		console.log(`[NormalizeDay - ID: ${entryId}] Matched short name '${dayStr}' to index ${index}`);
		return index; // Returns 0-6 (Mon-Sun)
	}

	// Handle numeric values
	const dayNum = parseInt(dayStr, 10);
	if (!isNaN(dayNum)) {
		console.log(`[NormalizeDay - ID: ${entryId}] Parsed as number: ${dayNum}`);
		
		// Case 1: Database uses 1-7 where 1=Monday, 7=Sunday
		if (dayNum >= 1 && dayNum <= 7) {
			const result = dayNum - 1;
			console.log(`[NormalizeDay - ID: ${entryId}] Assuming 1-7 (Mon-Sun) DB format. Result: ${result}`);
			return result; // Converts to 0-6 (Mon-Sun)
		}

		// Case 2: Database uses 0-6 where 0=Sunday, 6=Saturday (Standard JS getDay())
		// OR database uses 0-6 where 0=Monday, 6=Sunday
		if (dayNum >= 0 && dayNum <= 6) {
			 // We need Mon=0, ..., Sun=6 for the calendar
			 // If DB uses 0 for Monday, the number is already correct.
			 // If DB uses 0 for Sunday (JS style), we need to adjust.
			 // Let's PRIORITIZE the 0=Monday assumption based on user request.
			 const result = dayNum; 
			 console.log(`[NormalizeDay - ID: ${entryId}] Assuming 0-6 (Mon-Sun) DB format. Result: ${result}`);
			 return result;
			 
			 // Original JS-style conversion (commented out):
			 // const result = dayNum === 0 ? 6 : dayNum - 1; 
			 // console.log(`[NormalizeDay - ID: ${entryId}] Assuming 0-6 (Sun-Sat) DB format. Result: ${result}`);
			 // return result;
		}
		console.log(`[NormalizeDay - ID: ${entryId}] Numeric value ${dayNum} out of recognized range (0-6 or 1-7).`);
	} else {
		console.log(`[NormalizeDay - ID: ${entryId}] Could not parse '${dayStr}' as a number.`);
	}

	console.warn(`[NormalizeDay - ID: ${entryId}] Unrecognized day format: '${dayValue}'. Cannot normalize.`);
	return null; // Return null if format is unrecognized
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
        day,
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
				let normalizedDay: number | null = normalizeDayOfWeek(entry.day, entry.id)

				// If 'day' is not valid or missing, fallback to day_date
				if (normalizedDay === null && entry.day_date) {
					console.log(`[FetchEvents - ID: ${entry.id}] Day normalization failed or 'day' missing. Falling back to day_date: ${entry.day_date}`);
					normalizedDay = getDayOfWeek(entryDate);
					console.log(`[FetchEvents - ID: ${entry.id}] Day calculated from day_date: ${normalizedDay}`);
				} else if (normalizedDay === null) {
					console.warn(`[FetchEvents - ID: ${entry.id}] Missing valid day information ('day' and 'day_date'). Skipping entry.`);
					// Decide on a default or skip? Skipping for now.
					return null
				}

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
					day: normalizedDay,
					location: entry.location || 'N/A',
					color: entry.color || '#3182CE',
					classId: entry.classId,
					className: className, // Add className to returned object
					teacher: teacherName,
				}
			})
			.filter(event => event !== null)
			.filter(event => event.startTime < event.endTime)
		return events
	} catch (err) {
		console.warn('Primary timetable fetch failed, attempting fallback...', err)
		// Fallback attempt inside catch block
		try {
			const { data: fallbackData, error: fallbackError } = await supabase.from('timetable').select(`
           id, title, location, day, day_date, start_time, end_time, color, classId, subjectId,
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
					let normalizedDay: number | null = normalizeDayOfWeek(entry.day, entry.id)

					if (normalizedDay === null && entry.day_date) {
						console.log(`[FetchEvents Fallback - ID: ${entry.id}] Day normalization failed or 'day' missing. Falling back to day_date: ${entry.day_date}`);
						normalizedDay = getDayOfWeek(entryDate);
						console.log(`[FetchEvents Fallback - ID: ${entry.id}] Day calculated from day_date: ${normalizedDay}`);
					} else if (normalizedDay === null) {
						console.warn(`[FetchEvents Fallback - ID: ${entry.id}] Missing valid day information ('day' and 'day_date'). Skipping entry.`);
						return null
					}

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
						day: normalizedDay,
						location: entry.location || 'N/A',
						color: entry.color || '#3182CE',
						classId: entry.classId,
						className: className, // Add className in fallback
						teacher: teacherName,
					}
				})
				.filter(event => event !== null)
				.filter(event => event.startTime < event.endTime)
			return fallbackEvents
		} catch (finalError) {
			console.error('Failed to fetch master timetable after fallback:', finalError)
			return [] // Return empty array after all attempts fail
		}
	}
}
