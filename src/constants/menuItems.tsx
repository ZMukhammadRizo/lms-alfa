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
}

// Admin menu items
export const adminMenu: MenuItem[] = [
	{ path: '/admin/dashboard', icon: <FiHome />, label: 'Dashboard' },
	{ path: '/admin/users', icon: <FiUsers />, label: 'User Management' },
	{ path: '/admin/subjects', icon: <FiBook />, label: 'Subjects' },
	{ path: '/admin/classes', icon: <FiLayers />, label: 'Classes' },
	{ path: '/admin/assignments', icon: <FiFileText />, label: 'Assignments' },
	{ path: '/admin/submissions', icon: <FiClipboard />, label: 'Submissions' },
	{ path: '/admin/grades', icon: <FiClipboard />, label: 'Grades' },
	{ path: '/admin/timetables', icon: <FiCalendar />, label: 'Timetables' },
]

// Announcements submenu for admin
export const announcementsSubItems: MenuItem[] = [
	{ path: '/admin/announcements', icon: <FiList />, label: 'View All' },
	{ path: '/admin/announcements/create', icon: <FiPlus />, label: 'Create New' },
]

// Teacher menu items
export const teacherMenu: MenuItem[] = [
	{ path: '/teacher/dashboard', icon: <FiHome />, label: 'Dashboard' },
	{ path: '/teacher/classes', icon: <FiBook />, label: 'My Classes' },
	{ path: '/teacher/assignments', icon: <FiClipboard />, label: 'Assignments' },
	{ path: '/teacher/submissions', icon: <FiFileText />, label: 'Submissions' },
	{ path: '/teacher/grades', icon: <FiCheckSquare />, label: 'Grades' },
	{ path: '/teacher/schedule', icon: <FiCalendar />, label: 'Schedule' },
	{ path: '/teacher/messages', icon: <FiMessageSquare />, label: 'Messages' },
]

// Module leader specific menu items
export const getModuleLeaderMenu = (
	parentRole: string | null,
	fallbackRole: string
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
		label: 'Manage Subjects',
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
	{ path: '/student/messages', icon: <FiMessageSquare />, label: 'Messages' },
	{ path: '/student/tests', icon: <FiClipboard />, label: 'Tests' },
	{ path: '/student/flashcards', icon: <FiLayers />, label: 'Flashcards' },
]

// Parent menu items
export const parentMenu: MenuItem[] = [
	{ path: '/parent/dashboard', icon: <FiHome />, label: 'Dashboard' },
	{ path: '/parent/students', icon: <FiUsers />, label: 'My Children' },
	{ path: '/parent/assignments', icon: <FiClipboard />, label: 'Assignments' },
	{ path: '/parent/announcements', icon: <FiBell />, label: 'Announcements' },
	{ path: '/parent/grades', icon: <FiBarChart2 />, label: 'Grades' },
	{ path: '/parent/attendance', icon: <FiCheckSquare />, label: 'Attendance' },
	{ path: '/parent/messages', icon: <FiMessageSquare />, label: 'Messages' },
	{ path: '/parent/calendar', icon: <FiCalendar />, label: 'Calendar' },
]

// Function to get manager menu dynamically based on parent role
export const getManagerMenu = (parentRole: string | null, fallbackRole: string): MenuItem[] => [
	{
		path: `/${
			parentRole && parentRole !== 'Unknown'
				? parentRole.toLowerCase()
				: typeof fallbackRole === 'string'
				? fallbackRole.toLowerCase()
				: 'admin'
		}/roles`,
		icon: <FiShield />,
		label: 'Role Management',
	},
]

// System menu items - common across roles
export const getSystemMenu = (rolePath: string): MenuItem[] => [
	{ path: `/${rolePath}/profile`, icon: <FiUser />, label: 'Profile' },
	{ path: `/${rolePath}/settings`, icon: <FiSettings />, label: 'Settings' },
]

// Map menu item paths to required permissions
export const menuItemPermissionMap: Record<string, string> = {
	'/admin/dashboard': 'access_admin_dashboard',
	'/admin/users': 'manage_users',
	'/admin/subjects': 'manage_subjects',
	'/admin/classes': 'manage_classes',
	'/admin/assignments': 'manage_assignments',
	'/admin/submissions': 'manage_submissions',
	'/admin/grades': 'manage_grades',
	'/admin/timetables': 'manage_timetables',
	'/teacher/dashboard': 'access_teacher_dashboard',
	'/teacher/classes': 'view_classes',
	'/teacher/assignments': 'manage_assignments',
	'/teacher/submissions': 'manage_submissions',	
	'/teacher/grades': 'manage_grades',
	'/teacher/schedule': 'view_schedule',
	'/teacher/messages': 'send_messages',
	'/student/dashboard': 'access_student_dashboard',
	'/student/announcements': 'read_announcements',
	'/student/courses': 'view_courses',
	'/student/assignments': 'view_assignments',
	'/student/grades': 'view_grades',
	'/student/schedule': 'view_schedule',
	'/student/messages': 'send_messages',
	'/student/tests': 'take_tests',
	'/student/flashcards': 'use_flashcards',
	'/parent/dashboard': 'access_parent_dashboard',
	'/parent/students': 'view_students',
	'/parent/assignments': 'view_assignments',
	'/parent/announcements': 'read_announcements',
	'/parent/grades': 'view_grades',
	'/parent/attendance': 'view_attendance',
	'/parent/messages': 'send_messages',
	'/parent/calendar': 'view_calendar',
}
