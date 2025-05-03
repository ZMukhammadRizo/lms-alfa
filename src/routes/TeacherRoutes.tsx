import { Navigate, Route, Routes } from 'react-router-dom'
import TeacherDashboard from '../pages/teacher/TeacherDashboard'
// import TeacherProfile from '../pages/teacher/TeacherProfile'; // Commented out since module not found
import TeacherCourses from '../pages/teacher/TeacherClasses'
import TeacherCourseDetail from '../pages/teacher/TeacherClassDetails'
import TeacherSchedule from '../pages/teacher/TeacherSchedule'
import TeacherStudents from '../pages/teacher/TeacherStudents'
import GradesModule from '../pages/teacher/GradesModule'

const TeacherRoutes = () => {
	return (
		<Routes>
			<Route path='/' element={<Navigate to='/teacher/dashboard' replace />} />
			<Route path='/dashboard' element={<TeacherDashboard />} />
			{/* <Route path="/profile" element={<TeacherProfile />} /> */}
			<Route path='/students' element={<TeacherStudents />} />
			<Route path='/schedule' element={<TeacherSchedule />} />
			<Route path='/courses' element={<TeacherCourses />} />
			<Route path='/courses/:courseId' element={<TeacherCourseDetail />} />
			<Route path='/grades/*' element={<GradesModule />} />
		</Routes>
	)
}

export default TeacherRoutes
