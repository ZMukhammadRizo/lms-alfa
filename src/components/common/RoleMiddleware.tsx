import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import RedirectPage from '../../pages/auth/RedirectPage'
import { getUserParentRole, getUserRole, isRoleManager } from '../../utils/authUtils'

interface RoleMiddlewareProps {
	children: React.ReactNode
}

/**
 * A global middleware component that prevents users from accessing layouts
 * not corresponding to their role by manually typing URLs.
 *
 * This serves as a backup to the ProtectedRoute component.
 */
const RoleMiddleware: React.FC<RoleMiddlewareProps> = ({ children }) => {
	const { isAuthenticated, user } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	const [isRedirecting, setIsRedirecting] = useState(false)
	const [redirectPath, setRedirectPath] = useState<string | null>(null)
	const [redirectMessage, setRedirectMessage] = useState('')
	const [initialCheckDone, setInitialCheckDone] = useState(false)

	useEffect(() => {
		// Reset redirecting state on location change
		setIsRedirecting(false)
		setRedirectPath(null)
	}, [location.pathname])

	useEffect(() => {
		// Skip checks for login page and debug routes
		if (
			!isAuthenticated ||
			!user ||
			location.pathname === '/login' ||
			location.pathname === '/debug' ||
			location.pathname === '/' ||
			location.pathname.startsWith('/redirect')
		) {
			setInitialCheckDone(true)
			return
		}

		// Get the user role as a string
		const userRoleValue = getUserRole()
		// Get the parent role for users with nested roles
		const parentRoleValue = getUserParentRole()

		// Ensure the role is a string, not an object
		const userRole =
			typeof userRoleValue === 'string'
				? userRoleValue.toLowerCase()
				: typeof userRoleValue === 'object' && userRoleValue !== null && 'name' in userRoleValue
				? String(userRoleValue.name).toLowerCase()
				: 'unknown'

		// For RoleManager, use their parent role for routing
		const isUserRoleManager = isRoleManager()
		const effectiveRole =
			isUserRoleManager && parentRoleValue ? parentRoleValue.toLowerCase() : userRole

		// Safety check to ensure we have a valid role
		if (
			![
				'admin',
				'superadmin',
				'teacher',
				'moduleleader',
				'student',
				'parent',
				'rolemanager',
			].includes(effectiveRole)
		) {
			console.error(`Invalid role detected: "${effectiveRole}". Defaulting to student.`)
			setRedirectMessage(`Redirecting you to the student dashboard...`)
			setRedirectPath('/student/dashboard')
			setIsRedirecting(true)
			setInitialCheckDone(true)
			return
		}

		const path = location.pathname

		// Check if the user is trying to access a layout not corresponding to their role
		const isAccessingAdmin = path.startsWith('/admin')
		const isAccessingTeacher = path.startsWith('/teacher')
		const isAccessingStudent = path.startsWith('/student')
		const isAccessingParent = path.startsWith('/parent')

		let shouldRedirect = false
		let redirectTarget = `/${effectiveRole}/dashboard`

		// Special case for RoleManager with Admin parent role
		if (isUserRoleManager && parentRoleValue === 'Admin') {
			redirectTarget = '/admin/dashboard'

			// If trying to access another role's dashboard when should be on Admin, redirect
			if (!isAccessingAdmin) {
				shouldRedirect = true
			}
		}
		// Standard role checks
		else {
			// Only allow access to the path matching the user's role
			if (isAccessingAdmin && effectiveRole !== 'admin' && effectiveRole !== 'superadmin') {
				shouldRedirect = true
			} else if (
				isAccessingTeacher &&
				effectiveRole !== 'teacher' &&
				effectiveRole !== 'moduleleader'
			) {
				shouldRedirect = true
			} else if (isAccessingStudent && effectiveRole !== 'student') {
				shouldRedirect = true
			} else if (isAccessingParent && effectiveRole !== 'parent') {
				shouldRedirect = true
			}
		}

		// Track that we've done the initial check
		setInitialCheckDone(true)

		if (shouldRedirect) {
			console.log(`Unauthorized access attempt: ${effectiveRole} trying to access ${path}`)
			console.log(`Redirecting to: ${redirectTarget}`)
			setRedirectMessage(`You don't have access to that area. Redirecting you to your dashboard...`)
			setRedirectPath(redirectTarget)
			setIsRedirecting(true)
		}
	}, [location.pathname, isAuthenticated, user, navigate])

	// Show nothing until the initial check is complete to prevent flicker
	if (!initialCheckDone) {
		return null
	}

	// If we're in the process of redirecting, show the redirect page
	if (isRedirecting && redirectPath) {
		return <RedirectPage targetPath={redirectPath} message={redirectMessage} />
	}

	return <>{children}</>
}

export default RoleMiddleware
