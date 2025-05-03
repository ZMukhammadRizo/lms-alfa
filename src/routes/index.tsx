import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useThemeContext } from '../App'
import { AnnouncementProvider } from '../contexts/AnnouncementContext'
import { AuthProvider } from '../contexts/AuthContext'

// Layouts
import AdminLayout from '../layouts/AdminLayout'
import ParentLayout from '../layouts/ParentLayout'
import StudentLayout from '../layouts/StudentLayout'
import TeacherLayout from '../layouts/TeacherLayout'

// Admin Pages
import AnnouncementCreate from '../pages/admin/AnnouncementCreate'
import AdminAnnouncements from '../pages/admin/Announcements'
import AdminAssignments from '../pages/admin/Assignments'
import Classes from '../pages/admin/Classes'
import Dashboard from '../pages/admin/Dashboard'
import ProfilePage from '../pages/admin/ProfilePage'
import Roles from '../pages/admin/Roles'
import Settings from '../pages/admin/Settings'
import Subjects from '../pages/admin/Subjects'
import Timetables from '../pages/admin/Timetables'
import Users from '../pages/admin/Users'

// Teacher Pages
import TeacherAnnouncements from '../pages/teacher/TeacherAnnouncements'
import TeacherAssignments from '../pages/teacher/TeacherAssignments'
import TeacherCourseDetailsPage from '../pages/teacher/TeacherClassDetailsPage'
import TeacherCourses from '../pages/teacher/TeacherClasses'
import TeacherDashboard from '../pages/teacher/TeacherDashboard'
import TeacherJournalPage from '../pages/teacher/TeacherJournalPage'
import TeacherMessages from '../pages/teacher/TeacherMessages'
import TeacherSchedule from '../pages/teacher/TeacherSchedule'
import TeacherStudents from '../pages/teacher/TeacherStudents'

// Student Pages
import Announcements from '../pages/student/Announcements'
import Assignments from '../pages/student/Assignments'
import CourseDetail from '../pages/student/CourseDetail'
import Flashcards from '../pages/student/Flashcards'
import Messages from '../pages/student/Messages'
import MyCourses from '../pages/student/MyCourses'
import StudentDashboard from '../pages/student/StudentDashboard'
import StudentSchedule from '../pages/student/StudentSchedule'
import Tests from '../pages/student/Tests'
import Grades from '../pages/student/Grades'
import GradeDetails from '../pages/student/GradeDetails'

// Parent Pages
import AnnouncementsPage from '../pages/parent/AnnouncementsPage'
import { AssignmentsPage } from '../pages/parent/AssignmentsPage'
import AttendancePage from '../pages/parent/AttendancePage'
import GradesPage from '../pages/parent/GradesPage'
import { MessagesPage } from '../pages/parent/MessagesPage'
import ParentCalendar from '../pages/parent/ParentCalendar'
import ParentDashboard from '../pages/parent/ParentDashboard'
import { SettingsPage } from '../pages/parent/SettingsPage'
import { StudentsPage } from '../pages/parent/StudentsPage'

// Auth Pages
import Login from '../pages/auth/Login'

const AppRoutes: React.FC = () => {
	const { isDarkMode } = useThemeContext()

	return (
		<AuthProvider>
			<AnnouncementProvider>
				<ToastContainer
					position='top-right'
					autoClose={5000}
					hideProgressBar={false}
					newestOnTop
					closeOnClick
					rtl={false}
					pauseOnFocusLoss
					draggable
					pauseOnHover
					theme={isDarkMode ? 'dark' : 'light'}
				/>
				<Routes>
					{/* Redirect root to login page */}
					<Route path='/' element={<Navigate to='/login' replace />} />

					{/* Auth routes */}
					<Route path='/login' element={<Login />} />

					{/* Admin routes */}
					<Route path='/admin' element={<AdminLayout />}>
						<Route index element={<Navigate to='/admin/dashboard' replace />} />
						<Route path='dashboard' element={<Dashboard />} />
						<Route path='users' element={<Users />} />
						<Route path='roles' element={<Roles />} />
						<Route path='subjects' element={<Subjects />} />
						<Route path='classes' element={<Classes />} />
						<Route path='assignments' element={<AdminAssignments />} />
						<Route path='timetables' element={<Timetables />} />
						<Route path='settings' element={<Settings />} />
						<Route path='profile' element={<ProfilePage />} />
						<Route path='announcements' element={<AdminAnnouncements />} />
						<Route path='announcements/create' element={<AnnouncementCreate />} />
					</Route>

					{/* Teacher routes */}
					<Route path='/teacher' element={<TeacherLayout />}>
						<Route path='dashboard' element={<TeacherDashboard />} />
						<Route path='profile' element={<ProfilePage />} />
						<Route path='courses' element={<TeacherCourses />} />
						<Route path='courses/:id' element={<TeacherCourseDetailsPage />} />
						<Route path='students' element={<TeacherStudents />} />
						<Route path='assignments' element={<TeacherAssignments />} />
						<Route path='grades' element={<TeacherJournalPage />} />
						<Route path='schedule' element={<TeacherSchedule />} />
						<Route path='messages' element={<TeacherMessages />} />
						<Route path='settings' element={<Settings />} />
						<Route path='announcements' element={<TeacherAnnouncements />} />
					</Route>

					{/* Student routes */}
					<Route path='/student' element={<StudentLayout />}>
						<Route index element={<Navigate to='/student/dashboard' replace />} />
						<Route path='dashboard' element={<StudentDashboard />} />
						<Route path='announcements' element={<Announcements />} />
						<Route path='courses' element={<MyCourses />} />
						<Route path='courses/:courseId' element={<CourseDetail />} />
						<Route path='assignments' element={<Assignments />} />
						<Route path='grades' element={<Grades />} />
						<Route path='grades/:subjectId' element={<GradeDetails />} />
						<Route path='schedule' element={<StudentSchedule />} />
						<Route path='messages' element={<Messages />} />
						<Route path='tests' element={<Tests />} />
						<Route path='flashcards' element={<Flashcards />} />
						<Route path='profile' element={<ProfilePage />} />
						<Route path='settings' element={<Settings />} />
					</Route>

					{/* Parent routes */}
					<Route path='/parent' element={<ParentLayout />}>
						<Route index element={<ParentDashboard />} />
						<Route path='dashboard' element={<ParentDashboard />} />
						<Route path='students' element={<StudentsPage />} />
						<Route path='assignments' element={<AssignmentsPage />} />
						<Route path='grades' element={<GradesPage />} />
						<Route path='attendance' element={<AttendancePage />} />
						<Route path='messages' element={<MessagesPage />} />
						<Route path='calendar' element={<ParentCalendar />} />
						<Route path='announcements' element={<AnnouncementsPage />} />
						<Route path='settings' element={<SettingsPage />} />
						<Route path='profile' element={<ProfilePage />} />
					</Route>
				</Routes>
			</AnnouncementProvider>
		</AuthProvider>
	)
}

export default AppRoutes
