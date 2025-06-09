import { createContext, useContext, useState, useEffect } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { DefaultTheme, ThemeProvider } from 'styled-components'
import './i18n' // Initialize i18n
import ProtectedRoute from './components/common/ProtectedRoute'
import RoleMiddleware from './components/common/RoleMiddleware'
import { AnnouncementProvider } from './contexts/AnnouncementContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import ParentLayout from './layouts/ParentLayout'
import StudentLayout from './layouts/StudentLayout'
import TeacherLayout from './layouts/TeacherLayout'
import AnnouncementCreate from './pages/admin/AnnouncementCreate'
import AdminAnnouncements from './pages/admin/Announcements'
import AdminAssignments from './pages/admin/Assignments'
import { Classes } from './pages/admin/Classes'
import AdminDailyAttendance from './pages/admin/DailyAttendance/AdminDailyAttendance'
import AdminDailyAttendanceClass from './pages/admin/DailyAttendance/AdminDailyAttendanceClass'
import AdminDailyAttendanceLevel from './pages/admin/DailyAttendance/AdminDailyAttendanceLevel'
import Dashboard from './pages/admin/Dashboard'
import AdminGradesModule from './pages/admin/GradesModule'
import LessonDetail from './pages/admin/LessonDetail'
import LessonsManagePage from './pages/admin/LessonsManagePage'
import NewClassPage from './pages/admin/NewClassPage'
import ProfilePage from './pages/admin/ProfilePage'
import Roles from './pages/admin/Roles'
import Settings from './pages/admin/Settings'
import Subjects from './pages/admin/Subjects'
import AdminSubmissions from './pages/admin/Submissions'
import Timetables from './pages/admin/Timetables'
import Users from './pages/admin/Users'
import UserProfile from './pages/admin/UserProfile'
import Debug from './pages/auth/Debug'
import Login from './pages/auth/Login'
import RedirectPage from './pages/auth/RedirectPage'
import AnnouncementsPage from './pages/parent/AnnouncementsPage'
import AssignmentsPage from './pages/parent/AssignmentsPage'
import AttendancePage from './pages/parent/AttendancePage'
import GradesPage from './pages/parent/GradesPage'
import NotificationsPage from './pages/parent/NotificationsPage'
import ParentCalendar from './pages/parent/ParentCalendar'
import ParentDashboard from './pages/parent/ParentDashboard'
import { SettingsPage } from './pages/parent/SettingsPage'
import { StudentsPage } from './pages/parent/StudentsPage'
import Announcements from './pages/student/Announcements'
import Assignments from './pages/student/Assignments'
import CourseDetail from './pages/student/CourseDetail'
import GradeDetails from './pages/student/GradeDetails'
import StudentGradesPage from './pages/student/Grades'
import MyCourses from './pages/student/MyCourses'
import SingleAssignment from './pages/student/SingleAssignment'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentSchedule from './pages/student/StudentSchedule'
import TeacherAnnouncements from './pages/teacher/Announcements'
import TeacherDailyAttendance from './pages/teacher/DailyAttendance/TeacherDailyAttendance'
import TeacherDailyAttendanceClass from './pages/teacher/DailyAttendance/TeacherDailyAttendanceClass'
import TeacherDailyAttendanceLevel from './pages/teacher/DailyAttendance/TeacherDailyAttendanceLevel'
import TeacherGradesModule from './pages/teacher/GradesModule'
import SubjectsManagePage from './pages/teacher/SubjectsManagePage'
import TeacherAssignmentFiles from './pages/teacher/TeacherAssignmentFiles'
import TeacherAssignments from './pages/teacher/TeacherAssignments'
import TeacherClasses from './pages/teacher/TeacherClasses'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherGrades from './pages/teacher/TeacherGrades'
import TeacherJournalPage from './pages/teacher/TeacherJournalPage'
import TeacherLessonDetails from './pages/teacher/TeacherLessonDetails'
import TeacherSchedule from './pages/teacher/TeacherSchedule'
import { TeacherSubjectDetails } from './pages/teacher/TeacherSubjectDetails'
import TeacherSubmissions from './pages/teacher/TeacherSubmissions'
import GlobalStyle from './styles/globalStyles'
import { createTheme } from './styles/theme'

import StudentDailyAttendance from './pages/student/DailyAttendance'
import ParentDailyAttendance from './pages/parent/DailyAttendance'

import { debugCheckTables } from './services/gradesService'


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
	const { isAuthenticated, loading, user } = useAuth()
	const [tablesChecked, setTablesChecked] = useState(false)

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

	useEffect(() => {
		// Check database tables once when authenticated
		if (isAuthenticated && !tablesChecked) {
			const checkTables = async () => {
				console.log('Checking database tables structure at app startup...')
				await debugCheckTables()
				setTablesChecked(true)
			}

			checkTables()
		}
	}, [isAuthenticated, tablesChecked])

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
					<Route path='/debug' element={<Debug />} />
					<Route path='/redirect' element={<RedirectPage />} />
					<Route path='/redirect/:targetPath' element={<RedirectPage />} />

					{/* Admin routes - protected for Admin role only */}
					<Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
						<Route path='/admin' element={<AdminLayout />}>
							<Route index element={<Navigate to='/admin/dashboard' replace />} />
							<Route path='dashboard' element={<Dashboard />} />
							<Route path='users/:userId' element={<UserProfile />} />
							<Route path='users' element={<Users />} />
							<Route path='users/:userId' element={<UserProfile />} />
							<Route path='roles' element={<Roles />} />
							<Route path='subjects' element={<Subjects />} />
							<Route path='classes' element={<Classes />} />
							<Route path='assignments' element={<AdminAssignments />} />
							<Route path='grades/*' element={<AdminGradesModule />} />
							<Route path='daily-attendance' element={<AdminDailyAttendance />} />
							<Route path='daily-attendance/:levelId' element={<AdminDailyAttendanceLevel />} />
							<Route
								path='daily-attendance/:levelId/classes/:classId'
								element={<AdminDailyAttendanceClass />}
							/>
							<Route path='timetables' element={<Timetables />} />
							<Route path='settings' element={<Settings />} />
							<Route path='profile' element={<ProfilePage />} />
							<Route path='announcements' element={<AdminAnnouncements />} />
							<Route path='announcements/create' element={<AnnouncementCreate />} />
							<Route path='subjects/:subjectId/lessons' element={<LessonsManagePage />} />
							<Route path='subjects' element={<SubjectsManagePage />} />
							<Route path='lessons/:id' element={<LessonDetail />} />
							<Route path='submissions' element={<AdminSubmissions />} />
						</Route>
					</Route>

					{/* Teacher routes - protected for Teacher role only */}
					<Route element={<ProtectedRoute allowedRoles={['Teacher']} />}>
						<Route path='/teacher' element={<TeacherLayout />}>
							<Route path='subjects' element={<SubjectsManagePage />} />
							<Route path='new-class' element={<NewClassPage />} />
							<Route path='dashboard' element={<TeacherDashboard />} />
							<Route path='profile' element={<ProfilePage />} />
							<Route path='classes' element={<TeacherClasses />} />
							<Route
								path='classes/:classId/subjects/:subjectId'
								element={<TeacherSubjectDetails />}
							/>
							<Route
								path='classes/:classId/subjects/:subjectId/lessons/:lessonId'
								element={<TeacherLessonDetails />}
							/>
							<Route path='schedule' element={<TeacherSchedule />} />
							<Route path='messages' element={<h1>Coming Soon...</h1>} />
							<Route path='settings' element={<Settings />} />
							<Route path='announcements' element={<TeacherAnnouncements />} />
							<Route path='journal/:classId' element={<TeacherJournalPage />} />
							<Route path='journal' element={<TeacherJournalPage />} />
							<Route path='submissions' element={<TeacherSubmissions />} />
							<Route path='assignments' element={<TeacherAssignments />} />
							<Route path='assignments/files/:id' element={<TeacherAssignmentFiles />} />
							<Route path='subjects/:subjectId/lessons' element={<LessonsManagePage />} />
							<Route path='grades' element={<TeacherGrades />} />
							<Route path='grades/*' element={<TeacherGradesModule />} />
							<Route path='daily-attendance' element={<TeacherDailyAttendance />} />
							<Route path='daily-attendance/:levelId' element={<TeacherDailyAttendanceLevel />} />
							<Route
								path='daily-attendance/:levelId/classes/:classId'
								element={<TeacherDailyAttendanceClass />}
							/>
						</Route>
					</Route>

					{/* Student routes - protected for Student role only */}
					<Route element={<ProtectedRoute allowedRoles={['Student']} />}>
						<Route path='/student' element={<StudentLayout />}>
							<Route index element={<Navigate to='/student/dashboard' replace />} />
							<Route path='dashboard' element={<StudentDashboard />} />
							<Route path='announcements' element={<Announcements />} />
							<Route path='courses' element={<MyCourses />} />
							<Route path='course/:courseId' element={<CourseDetail />} />
							<Route path='lesson/:lessonId' element={<LessonDetail />} />
							<Route path='assignments' element={<Assignments />} />
							<Route path='assignments/:assignmentId' element={<SingleAssignment />} />
							<Route path='schedule' element={<StudentSchedule />} />
							<Route path='grades' element={<StudentGradesPage />} />
							<Route path='daily-attendance' element={<StudentDailyAttendance />} />
							{/* Route for viewing grades for a specific subject */}
							<Route path='grades/:subjectId' element={<GradeDetails />} />
							<Route path='messages' element={<h1>Coming Soon...</h1>} />
							<Route path='tests' element={<h1>Coming Soon...</h1>} />
							<Route path='flashcards' element={<h1>Coming Soon...</h1>} />
							<Route path='profile' element={<ProfilePage />} />
							<Route path='settings' element={<Settings />} />
						</Route>
					</Route>

					{/* Parent routes - protected for Parent role only */}
					<Route element={<ProtectedRoute allowedRoles={['Parent']} />}>
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
							<Route path='notifications' element={<NotificationsPage />} />
							<Route path='settings' element={<SettingsPage />} />
							<Route path='profile' element={<ProfilePage />} />
							<Route path='daily-attendance' element={<ParentDailyAttendance />} />
						</Route>
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
					<RoleMiddleware>
						<AppContent />
					</RoleMiddleware>
				</AnnouncementProvider>
			</AuthProvider>
		</Router>
	)
}

export default App
