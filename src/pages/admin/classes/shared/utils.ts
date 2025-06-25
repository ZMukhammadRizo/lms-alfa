// Helper functions for admin classes
export const getPerformanceColor = (percentage: number) => {
	if (percentage >= 85) return '#10b981'
	if (percentage >= 70) return '#f59e0b'
	return '#ef4444'
}

export const formatAttendanceDays = (days: string[], t: (key: string) => string): string => {
	if (!days || days.length === 0) return t('classes.notScheduled')

	// Create an abbreviation map
	const dayAbbreviations: { [key: string]: string } = {
		Monday: 'Mon',
		Tuesday: 'Tue',
		Wednesday: 'Wed',
		Thursday: 'Thu',
		Friday: 'Fri',
		Saturday: 'Sat',
		Sunday: 'Sun',
	}

	// Get day abbreviations
	const abbreviated = days.map(day => dayAbbreviations[day] || day)

	// Special case: if days are consecutive, use hyphen format
	if (days.length > 2) {
		const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
		const indices = days.map(day => dayOrder.indexOf(day)).sort((a, b) => a - b)

		// Check if indices are consecutive
		let isConsecutive = true
		for (let i = 1; i < indices.length; i++) {
			if (indices[i] !== indices[i - 1] + 1) {
				isConsecutive = false
				break
			}
		}

		if (isConsecutive) {
			return `${dayAbbreviations[dayOrder[indices[0]]]}-${
				dayAbbreviations[dayOrder[indices[indices.length - 1]]]
			}`
		}
	}

	// Default: comma-separated list
	return abbreviated.join(', ')
}

export const formatAttendanceTimes = (times: string[], t: (key: string) => string): string => {
	if (!times || times.length === 0) return t('classes.notScheduled')
	if (times.length === 2) return `${times[0]} - ${times[1]}`
	return times.join(', ')
}

export const adjustColorBrightness = (color: string, percent: number) => {
	const usePound = color[0] === '#'
	const col = usePound ? color.slice(1) : color
	const num = parseInt(col, 16)
	let r = (num >> 16) + percent
	let g = ((num >> 8) & 0x00ff) + percent
	let b = (num & 0x0000ff) + percent
	r = r > 255 ? 255 : r < 0 ? 0 : r
	g = g > 255 ? 255 : g < 0 ? 0 : g
	b = b > 255 ? 255 : b < 0 ? 0 : b
	return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16)
}

export const generateRandomColor = () => {
	const colors = ['#4F46E5', '#0EA5E9', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899']
	return colors[Math.floor(Math.random() * colors.length)]
}

// Permission check function
export const withPermissionCheck = (
	permissionName: string,
	callbackIfPermitted: () => void,
	callbackIfNotPermitted?: () => void // Make the third argument optional
) => {
	// For now, always allow since permission system is not fully implemented
	// In a real implementation, you would check user permissions here
	callbackIfPermitted()

	// If you need to implement actual permission checking:
	// if (userHasPermission(permissionName)) {
	// 	callbackIfPermitted()
	// } else if (callbackIfNotPermitted) {
	// 	callbackIfNotPermitted()
	// }
}
