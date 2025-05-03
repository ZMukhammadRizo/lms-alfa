import React from 'react'
import { Navigate } from 'react-router-dom'

// TeacherJournalPage now redirects to the enhanced GradesJournal in GradesModule
const TeacherJournalPage: React.FC = () => {
	// The GradesJournal component has been updated to include the attendance functionality
	// So we redirect to it instead of duplicating functionality
	return <Navigate to='/teacher/grades/journal' replace />
}

export default TeacherJournalPage
