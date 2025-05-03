import React from 'react'
import { Route, Routes } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import AdminAttendance from '../pages/admin/Attendance'
import AdminGradesModule from '../pages/admin/GradesModule'

// Import existing admin pages here
// ...

const AdminRoutes: React.FC = () => {
	return (
		<Routes>
			<Route path='/' element={<AdminLayout />}>
				{/* Existing routes */}
				{/* ... */}

				{/* Grades Module - replicated from teacher panel */}
				<Route path='grades/*' element={<AdminGradesModule />} />

				{/* Attendance Module - replicated from teacher panel */}
				<Route path='attendance/*' element={<AdminAttendance />} />
			</Route>
		</Routes>
	)
}

export default AdminRoutes
