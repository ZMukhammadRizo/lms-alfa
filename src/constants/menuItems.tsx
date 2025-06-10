import React from 'react'
import {
	FiBarChart2,
	FiBell,
	FiBook,
	FiBookOpen,
	FiCalendar,
	FiCheckSquare,
	FiClipboard,
	FiFileText,
	FiHome,
	FiLayers,
	FiList,
	FiMessageSquare,
	FiPlus,
	FiSettings,
	FiShield,
	FiUser,
	FiUsers,
} from 'react-icons/fi'

// Type definition for menu items
export interface MenuItem {
	path: string
	icon: React.ReactNode
	label: string
	requiredPermission?: string
}

// Function to get translated admin menu items
export const getAdminMenu = (t: (key: string) => string): MenuItem[] => [
	{ path: '/admin/dashboard', icon: <FiHome />, label: t('navigation.dashboard') },
	{ path: '/admin/users', icon: <FiUsers />, label: t('navigation.userManagement') },
	{ path: '/admin/subjects', icon: <FiBook />, label: t('navigation.subjects') },
	{ path: '/admin/classes', icon: <FiLayers />, label: t('navigation.classes') },
	{ path: '/admin/assignments', icon: <FiFileText />, label: t('navigation.assignments') },
	{ path: '/admin/submissions', icon: <FiClipboard />, label: t('navigation.submissions') },
	{ path: '/admin/grades', icon: <FiClipboard />, label: t('navigation.grades') },
	{ path: '/admin/daily-attendance', icon: <FiCheckSquare />, label: t('navigation.dailyAttendance') },
	{ path: '/admin/timetables', icon: <FiCalendar />, label: t('navigation.timetables') },
]

// Admin menu items (kept for backward compatibility)
export const adminMenu: MenuItem[] = [
	{ path: '/admin/dashboard', icon: <FiHome />, label: 'Dashboard' },
	{ path: '/admin/users', icon: <FiUsers />, label: 'User Management' },
	{ path: '/admin/subjects', icon: <FiBook />, label: 'Subjects' },
	{ path: '/admin/classes', icon: <FiLayers />, label: 'Classes' },
	{ path: '/admin/assignments', icon: <FiFileText />, label: 'Assignments' },
	{ path: '/admin/submissions', icon: <FiClipboard />, label: 'Submissions' },
	{ path: '/admin/grades', icon: <FiClipboard />, label: 'Grades' },
	{ path: '/admin/daily-attendance', icon: <FiCheckSquare />, label: 'Daily Attendance' },
	{ path: '/admin/timetables', icon: <FiCalendar />, label: 'Timetables' },
]

// Announcements submenu for admin
export const announcementsSubItems: MenuItem[] = [
	{
		path: '/admin/announcements',
		icon: <FiList />,
		label: 'View All',
		requiredPermission: 'access_admin_announcements',
	},
	{
		path: '/admin/announcements/create',
		icon: <FiPlus />,
		label: 'Create New',
		requiredPermission: 'access_admin_announcements_create',
	},
]

// Function to get translated teacher menu items
export const getTeacherMenu = (t: (key: string) => string): MenuItem[] => [
	{ path: '/teacher/dashboard', icon: <FiHome />, label: t('teacherPanel.navigation.dashboard') },
	{ path: '/teacher/classes', icon: <FiBook />, label: t('teacherPanel.navigation.myClasses') },
	{ path: '/teacher/assignments', icon: <FiClipboard />, label: t('teacherPanel.navigation.assignments') },
	{ path: '/teacher/submissions', icon: <FiFileText />, label: t('teacherPanel.navigation.submissions') },
	{ path: '/teacher/grades', icon: <FiCheckSquare />, label: t('teacherPanel.navigation.grades') },
	{ path: '/teacher/daily-attendance', icon: <FiCheckSquare />, label: t('teacherPanel.navigation.dailyAttendance') },
	{ path: '/teacher/schedule', icon: <FiCalendar />, label: t('teacherPanel.navigation.schedule') },
	{ path: '/teacher/messages', icon: <FiMessageSquare />, label: t('teacherPanel.navigation.messages') },
]

// Teacher menu items (kept for backward compatibility)
export const teacherMenu: MenuItem[] = [
	{ path: '/teacher/dashboard', icon: <FiHome />, label: 'Dashboard' },
	{ path: '/teacher/classes', icon: <FiBook />, label: 'My Classes' },
	{ path: '/teacher/assignments', icon: <FiClipboard />, label: 'Assignments' },
	{ path: '/teacher/submissions', icon: <FiFileText />, label: 'Submissions' },
	{ path: '/teacher/grades', icon: <FiCheckSquare />, label: 'Grades' },
	{ path: '/teacher/daily-attendance', icon: <FiCheckSquare />, label: 'Daily Attendance' },
	{ path: '/teacher/schedule', icon: <FiCalendar />, label: 'Schedule' },
	{ path: '/teacher/messages', icon: <FiMessageSquare />, label: 'Messages' },
]

// Module leader specific menu items
export const getModuleLeaderMenu = (
	parentRole: string | null,
	fallbackRole: string,
	t?: (key: string) => string
): MenuItem[] => [
	{
		path: `/${
			parentRole && parentRole !== 'Unknown'
				? parentRole.toLowerCase()
				: typeof fallbackRole === 'string'
				? fallbackRole.toLowerCase()
				: 'teacher'
		}/subjects`,
		icon: <FiBookOpen />,
		label: t ? t('navigation.manageSubjects') : 'Manage Subjects',
	},
]

// Student menu items
export const studentMenu: MenuItem[] = [
	{ path: '/student/dashboard', icon: <FiHome />, label: 'Dashboard' },
	{ path: '/student/announcements', icon: <FiBell />, label: 'Announcements' },
	{ path: '/student/courses', icon: <FiBook />, label: 'My Courses' },
	{ path: '/student/assignments', icon: <FiFileText />, label: 'Assignments' },
	{ path: '/student/grades', icon: <FiBarChart2 />, label: 'My Grades' },
	{ path: '/student/schedule', icon: <FiCalendar />, label: 'Schedule' },
	{ path: '/student/daily-attendance', icon: <FiCheckSquare />, label: 'Daily Attendance' },
	{ path: '/student/messages', icon: <FiMessageSquare />, label: 'Messages' },
	{ path: '/student/tests', icon: <FiClipboard />, label: 'Tests' },
	{ path: '/student/flashcards', icon: <FiLayers />, label: 'Flashcards' },
]

// Function to get translated parent menu items
export const getParentMenu = (t: (key: string) => string): MenuItem[] => [
	{ path: '/parent/dashboard', icon: <FiHome />, label: t('navigation.dashboard') },
	{ path: '/parent/students', icon: <FiUsers />, label: t('navigation.myChildren') },
	{ path: '/parent/assignments', icon: <FiClipboard />, label: t('navigation.assignments') },
	{ path: '/parent/announcements', icon: <FiBell />, label: t('navigation.announcements') },
	{ path: '/parent/grades', icon: <FiBarChart2 />, label: t('navigation.grades') },
	{ path: '/parent/daily-attendance', icon: <FiCheckSquare />, label: t('navigation.dailyAttendance') },
	{ path: '/parent/messages', icon: <FiMessageSquare />, label: t('navigation.messages') },
	{ path: '/parent/calendar', icon: <FiCalendar />, label: t('navigation.calendar') },
]

// Parent menu items (kept for backward compatibility)
export const parentMenu: MenuItem[] = [
	{ path: '/parent/dashboard', icon: <FiHome />, label: 'Dashboard' },
	{ path: '/parent/students', icon: <FiUsers />, label: 'My Children' },
	{ path: '/parent/assignments', icon: <FiClipboard />, label: 'Assignments' },
	{ path: '/parent/announcements', icon: <FiBell />, label: 'Announcements' },
	{ path: '/parent/grades', icon: <FiBarChart2 />, label: 'Grades' },
	{ path: '/parent/daily-attendance', icon: <FiCheckSquare />, label: 'Daily Attendance' },
	{ path: '/parent/messages', icon: <FiMessageSquare />, label: 'Messages' },
	{ path: '/parent/calendar', icon: <FiCalendar />, label: 'Calendar' },
]

// Function to get manager menu dynamically based on parent role
export const getManagerMenu = (parentRole: string | null, fallbackRole: string, t?: (key: string) => string): MenuItem[] => [
	{
		path: `/${
			parentRole && parentRole !== 'Unknown'
				? parentRole.toLowerCase()
				: typeof fallbackRole === 'string'
				? fallbackRole.toLowerCase()
				: 'admin'
		}/roles`,
		icon: <FiShield />,
		label: t ? t('navigation.roleManagement') : 'Role Management',
	},
]

// System menu items - common across roles
export const getSystemMenu = (rolePath: string, t?: (key: string) => string): MenuItem[] => [
	{ path: `/${rolePath}/profile`, icon: <FiUser />, label: t ? t('navigation.profile') : 'Profile' },
	{ path: `/${rolePath}/settings`, icon: <FiSettings />, label: t ? t('navigation.settings') : 'Settings' },
]

// Map menu item paths to required permissions
export const menuItemPermissionMap: Record<string, string> = {
	// Admin menu items
	'/admin/dashboard': 'access_admin_dashboard',
	'/admin/users': 'access_admin_users',
	'/admin/roles': 'access_admin_roles',
	'/admin/subjects': 'access_admin_subjects',
	'/admin/classes': 'access_admin_classes',
	'/admin/assignments': 'access_admin_assignments',
	'/admin/grades': 'access_admin_grades',
	'/admin/daily-attendance': 'access_admin_daily_attendance',
	'/admin/timetables': 'access_admin_timetables',
	'/admin/settings': 'access_admin_settings',
	'/admin/profile': 'access_admin_profile',
	'/admin/announcements': 'access_admin_announcements',
	'/admin/announcements/create': 'access_admin_announcements_create',
	'/admin/subjects/:subjectId/lessons': 'access_admin_lessons',
	'/admin/lessons/:id': 'access_admin_lesson_detail',
	'/admin/submissions': 'access_admin_submissions',
	// Teacher menu items
	'/teacher/dashboard': 'access_teacher_dashboard',
	'/teacher/classes': 'view_classes',
	'/teacher/assignments': 'manage_assignments',
	'/teacher/submissions': 'manage_submissions',
	'/teacher/grades': 'manage_grades',
	'/teacher/daily-attendance': 'manage_daily_attendance',
	'/teacher/schedule': 'view_schedule',
	'/teacher/messages': 'send_messages',
	// Student menu items
	'/student/dashboard': 'access_student_dashboard',
	'/student/announcements': 'read_announcements',
	'/student/courses': 'view_courses',
	'/student/assignments': 'view_assignments',
	'/student/grades': 'view_grades',
	'/student/schedule': 'view_schedule',
	'/student/daily-attendance': 'view_daily_attendance',
	'/student/messages': 'send_messages',
	'/student/tests': 'take_tests',
	'/student/flashcards': 'use_flashcards',
	// Parent menu items
	'/parent/dashboard': 'access_parent_dashboard',
	'/parent/students': 'view_students',
	'/parent/assignments': 'view_assignments',
	'/parent/announcements': 'read_announcements',
	'/parent/grades': 'view_grades',
	'/parent/daily-attendance': 'view_daily_attendance',
	'/parent/messages': 'send_messages',
	'/parent/calendar': 'view_calendar',
}
