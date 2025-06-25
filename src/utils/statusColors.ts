import i18n from '../i18n'

// Status mapping for different modules
export interface StatusColorMap {
	[key: string]: string
}

// Attendance status colors
export const attendanceStatusColors: StatusColorMap = {
	present: '#10b981', // success color
	late: '#f59e0b', // warning color
	excused: '#3b82f6', // primary color
	absent: '#ef4444', // danger color
	'not-assigned': '#6b7280', // neutral color
}

// Submission status colors
export const submissionStatusColors: StatusColorMap = {
	submitted: '#10b981', // success color
	'in-progress': '#f59e0b', // warning color
	pending: '#3b82f6', // primary color
	overdue: '#ef4444', // danger color
	draft: '#6b7280', // neutral color
	completed: '#10b981', // success color
	graded: '#8b5cf6', // purple color
}

// Generic status colors
export const genericStatusColors: StatusColorMap = {
	active: '#10b981',
	inactive: '#6b7280',
	pending: '#f59e0b',
	approved: '#10b981',
	rejected: '#ef4444',
	draft: '#6b7280',
	published: '#10b981',
}

/**
 * Get color for attendance status - supports both English and translated values
 */
export function getAttendanceStatusColor(status: string): string {
	if (!status) return 'transparent'

	const normalizedStatus = status.toLowerCase().trim()

	// First try direct English mapping
	if (attendanceStatusColors[normalizedStatus]) {
		return attendanceStatusColors[normalizedStatus]
	}

	// Try reverse translation mapping for common statuses
	const t = i18n.t
	const statusMappings = {
		[t('attendance.present').toLowerCase()]: 'present',
		[t('attendance.late').toLowerCase()]: 'late',
		[t('attendance.excused').toLowerCase()]: 'excused',
		[t('attendance.absent').toLowerCase()]: 'absent',
		[t('attendance.notAssigned').toLowerCase()]: 'not-assigned',
	}

	const englishStatus = statusMappings[normalizedStatus]
	if (englishStatus && attendanceStatusColors[englishStatus]) {
		return attendanceStatusColors[englishStatus]
	}

	return 'transparent'
}

/**
 * Get color for submission status - supports both English and translated values
 */
export function getSubmissionStatusColor(status: string): string {
	if (!status) return 'transparent'

	const normalizedStatus = status.toLowerCase().trim()

	// First try direct English mapping
	if (submissionStatusColors[normalizedStatus]) {
		return submissionStatusColors[normalizedStatus]
	}

	// Try reverse translation mapping for common statuses
	const t = i18n.t
	const statusMappings = {
		[t('submissions.submitted').toLowerCase()]: 'submitted',
		[t('submissions.inProgress').toLowerCase()]: 'in-progress',
		[t('submissions.pending').toLowerCase()]: 'pending',
		[t('submissions.overdue').toLowerCase()]: 'overdue',
		[t('submissions.draft').toLowerCase()]: 'draft',
		[t('submissions.completed').toLowerCase()]: 'completed',
		[t('submissions.graded').toLowerCase()]: 'graded',
	}

	const englishStatus = statusMappings[normalizedStatus]
	if (englishStatus && submissionStatusColors[englishStatus]) {
		return submissionStatusColors[englishStatus]
	}

	return 'transparent'
}

/**
 * Generic status color function - supports both English and translated values
 */
export function getGenericStatusColor(status: string): string {
	if (!status) return 'transparent'

	const normalizedStatus = status.toLowerCase().trim()

	// First try direct English mapping
	if (genericStatusColors[normalizedStatus]) {
		return genericStatusColors[normalizedStatus]
	}

	// Try reverse translation mapping for common statuses
	const t = i18n.t
	const statusMappings = {
		[t('common.active').toLowerCase()]: 'active',
		[t('common.inactive').toLowerCase()]: 'inactive',
		[t('common.pending').toLowerCase()]: 'pending',
		[t('common.approved').toLowerCase()]: 'approved',
		[t('common.rejected').toLowerCase()]: 'rejected',
		[t('common.draft').toLowerCase()]: 'draft',
		[t('common.published').toLowerCase()]: 'published',
	}

	const englishStatus = statusMappings[normalizedStatus]
	if (englishStatus && genericStatusColors[englishStatus]) {
		return genericStatusColors[englishStatus]
	}

	return 'transparent'
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getAttendanceStatusColor instead
 */
export function getStatusColor(status: string): string {
	return getAttendanceStatusColor(status)
}
