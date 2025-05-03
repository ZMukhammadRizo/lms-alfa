import { createContext, useContext, useState } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { DefaultTheme, ThemeProvider } from 'styled-components'
import { AnnouncementProvider } from './contexts/AnnouncementContext'
import { AuthProvider } from './contexts/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import ParentLayout from './layouts/ParentLayout'
import StudentLayout from './layouts/StudentLayout'
import TeacherLayout from './layouts/TeacherLayout'
import AnnouncementCreate from './pages/admin/AnnouncementCreate'
import AdminAnnouncements from './pages/admin/Announcements'
import AssignmentFiles from './pages/admin/AssignmentFiles'
import AdminAssignments from './pages/admin/Assignments'
import Classes from './pages/admin/Classes'
import Dashboard from './pages/admin/Dashboard'
import AdminGradesModule from './pages/admin/GradesModule'
import LessonDetail from './pages/admin/LessonDetail'
import LessonsManagePage from './pages/admin/LessonsManagePage'
import NewClassPage from './pages/admin/NewClassPage'
import ProfilePage from './pages/admin/ProfilePage'
import Roles from './pages/admin/Roles'
import Settings from './pages/admin/Settings'
import Subjects from './pages/admin/Subjects'
import SubjectsManagePage from './pages/admin/SubjectsManagePage'
import Timetables from './pages/admin/Timetables'
import Users from './pages/admin/Users'
import Debug from './pages/auth/Debug'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AnnouncementsPage from './pages/parent/AnnouncementsPage'
import AssignmentsPage from './pages/parent/AssignmentsPage'
import AttendancePage from './pages/parent/AttendancePage'
import GradesPage from './pages/parent/GradesPage'
import ParentCalendar from './pages/parent/ParentCalendar'
import ParentDashboard from './pages/parent/ParentDashboard'
import { SettingsPage } from './pages/parent/SettingsPage'
import { StudentsPage } from './pages/parent/StudentsPage'
import Announcements from './pages/student/Announcements'
import Assignments from './pages/student/Assignments'
import CourseDetail from './pages/student/CourseDetail'
import MyCourses from './pages/student/MyCourses'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentSchedule from './pages/student/StudentSchedule'
import TeacherAnnouncements from './pages/teacher/Announcements'
import TeacherGradesModule from './pages/teacher/GradesModule'
import TeacherAssignmentFiles from './pages/teacher/TeacherAssignmentFiles'
import TeacherAssignments from './pages/teacher/TeacherAssignments'
import TeacherClassDetails from './pages/teacher/TeacherClassDetails'
import TeacherClasses from './pages/teacher/TeacherClasses'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherGrades from './pages/teacher/TeacherGrades'
import TeacherJournalPage from './pages/teacher/TeacherJournalPage'
import TeacherSchedule from './pages/teacher/TeacherSchedule'
import TeacherStudents from './pages/teacher/TeacherStudents'
import GlobalStyle from './styles/globalStyles'
import { createTheme } from './styles/theme'
import StudentGradesPage from './pages/student/Grades'
import GradeDetails from './pages/student/GradeDetails'

// Create a context for theme settings
export interface ThemeContextType {
	isDarkMode: boolean
	toggleTheme: () => void
	setPrimaryColor: (color: string) => void
	primaryColor: string
}

export const ThemeContext = createContext<ThemeContextType | null>(null)

// Hook to use theme context
export const useThemeContext = () => {
	const context = useContext(ThemeContext)
	if (!context) {
		throw new Error('useThemeContext must be used within a ThemeProvider')
	}
	return context
}

function AppContent() {
	const [isDarkMode, setIsDarkMode] = useState(false)
	const [primaryColor, setPrimaryColor] = useState('#0ea5e9')

	const toggleTheme = () => {
		setIsDarkMode(!isDarkMode)
	}

	// Create theme based on current settings
	const theme = createTheme(isDarkMode ? 'dark' : 'light', primaryColor)

	// Theme context value
	const themeContextValue: ThemeContextType = {
		isDarkMode,
		toggleTheme,
		primaryColor,
		setPrimaryColor,
	}

	return (
		<ThemeContext.Provider value={themeContextValue}>
			<ThemeProvider theme={theme as unknown as DefaultTheme}>
				<GlobalStyle />
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
					<Route path='/register' element={<Register />} />
					<Route path='/debug' element={<Debug />} />

					{/* Admin routes */}
					<Route path='/admin' element={<AdminLayout />}>
						<Route index element={<Navigate to='/admin/dashboard' replace />} />
						<Route path='dashboard' element={<Dashboard />} />
						<Route path='users' element={<Users />} />
						<Route path='roles' element={<Roles />} />
						<Route path='subjects' element={<Subjects />} />
						<Route path='classes' element={<Classes />} />
						<Route path='assignments' element={<AdminAssignments />} />
						<Route path='assignments/files/:id' element={<AssignmentFiles />} />
						<Route path='grades/*' element={<AdminGradesModule />} />
						<Route path='timetables' element={<Timetables />} />
						<Route path='settings' element={<Settings />} />
						<Route path='profile' element={<ProfilePage />} />
						<Route path='announcements' element={<AdminAnnouncements />} />
						<Route path='announcements/create' element={<AnnouncementCreate />} />
						<Route path='new-class' element={<NewClassPage />} />
						<Route path='subjects' element={<SubjectsManagePage />} />
						<Route path='subjects/:subjectId/lessons' element={<LessonsManagePage />} />
						<Route path='lessons/:id' element={<LessonDetail />} />
					</Route>

					{/* Teacher routes */}
					<Route path='/teacher' element={<TeacherLayout />}>
						<Route path='dashboard' element={<TeacherDashboard />} />
						<Route path='profile' element={<ProfilePage />} />
						<Route path='classes' element={<TeacherClasses />} />
						<Route path='classes/:id' element={<TeacherClassDetails />} />
						<Route path='students' element={<TeacherStudents />} />
						<Route path='assignments' element={<TeacherAssignments />} />
						<Route path='assignments/files/:id' element={<TeacherAssignmentFiles />} />
						<Route path='grades' element={<TeacherGrades />} />
						<Route path='grades/*' element={<TeacherGradesModule />} />
						<Route path='schedule' element={<TeacherSchedule />} />
						<Route path='messages' element={<h1>Coming Soon...</h1>} />
						<Route path='settings' element={<Settings />} />
						<Route path='announcements' element={<TeacherAnnouncements />} />
						<Route path='journal/:classId' element={<TeacherJournalPage />} />
						<Route path='journal' element={<TeacherJournalPage />} />
					</Route>

					{/* Student routes */}
					<Route path='/student' element={<StudentLayout />}>
						<Route index element={<Navigate to='/student/dashboard' replace />} />
						<Route path='dashboard' element={<StudentDashboard />} />
						<Route path='announcements' element={<Announcements />} />
						<Route path='courses' element={<MyCourses />} />
						<Route path='course/:courseId' element={<CourseDetail />} />
						<Route path='lesson/:lessonId' element={<LessonDetail />} />
						<Route path='assignments' element={<Assignments />} />
						<Route path='schedule' element={<StudentSchedule />} />
						<Route path='grades' element={<StudentGradesPage />} />
						{/* Route for viewing grades for a specific subject */}
						<Route path='grades/:subjectId' element={<GradeDetails />} />
						<Route path='messages' element={<h1>Coming Soon...</h1>} />
						<Route path='tests' element={<h1>Coming Soon...</h1>} />
						<Route path='flashcards' element={<h1>Coming Soon...</h1>} />
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
						<Route path='messages' element={<h1>Coming Soon...</h1>} />
						<Route path='calendar' element={<ParentCalendar />} />
						<Route path='announcements' element={<AnnouncementsPage />} />
						<Route path='settings' element={<SettingsPage />} />
						<Route path='profile' element={<ProfilePage />} />
					</Route>
				</Routes>
			</ThemeProvider>
		</ThemeContext.Provider>
	)
}

// Silence the Future flag warnings - this is a workaround until we can upgrade React Router
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalConsoleWarn = console.warn
console.warn = (...args) => {
	if (typeof args[0] === 'string' && args[0].includes('React Router Future Flag Warning new')) {
		// Ignore React Router future flag warnings
		return
	}
	originalConsoleWarn(...args)
}

function App() {
	return (
		<Router>
			<AuthProvider>
				<AnnouncementProvider>
					<AppContent />
				</AnnouncementProvider>
			</AuthProvider>
		</Router>
	)
}

export default App
