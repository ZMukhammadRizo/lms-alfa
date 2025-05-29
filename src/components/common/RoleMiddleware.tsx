import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import RedirectPage from '../../pages/auth/RedirectPage'

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
	const { isAuthenticated, user, getParentRoleName, getEffectiveRoleName } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	const [isRedirecting, setIsRedirecting] = useState(false)
	const [redirectPath, setRedirectPath] = useState<string | null>(null)
	const [redirectMessage, setRedirectMessage] = useState('')
	const [initialCheckDone, setInitialCheckDone] = useState(false)

	// Define the primary roles
	const PRIMARY_ROLES = ['admin', 'teacher', 'student', 'parent']

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

		// Get user's effective role (the primary role or parent role)
		let effectiveRole: string

		// Get parent role if it exists
		let parentRole = null
		if (user.role && typeof user.role === 'object') {
			parentRole = getParentRoleName(user.role)
		}

		// If parent role exists and is one of the primary roles, use that
		if (parentRole && PRIMARY_ROLES.includes(parentRole.toLowerCase())) {
			effectiveRole = parentRole.toLowerCase()
			console.log(`Using parent role: ${effectiveRole} for navigation`)
		} else {
			// Otherwise get the direct role
			const directRole =
				typeof user.role === 'string'
					? user.role
					: user.role && typeof user.role === 'object' && user.role.name
					? user.role.name
					: 'unknown'

			effectiveRole = directRole.toLowerCase()
			console.log(`Using direct role: ${effectiveRole} for navigation`)
		}

		// If role is not one of the primary roles and has no valid parent,
		// default to student for safety
		if (!PRIMARY_ROLES.includes(effectiveRole)) {
			console.error(`Invalid role detected: "${effectiveRole}". Defaulting to student.`)
			effectiveRole = 'student'
		}

		const path = location.pathname

		// Check if the user is trying to access a layout not corresponding to their role
		const isAccessingAdmin = path.startsWith('/admin')
		const isAccessingTeacher = path.startsWith('/teacher')
		const isAccessingStudent = path.startsWith('/student')
		const isAccessingParent = path.startsWith('/parent')

		let shouldRedirect = false
		let redirectTarget = `/${effectiveRole}/dashboard`

		// Only allow access to the path matching the user's effective role
		if (isAccessingAdmin && effectiveRole !== 'admin') {
			shouldRedirect = true
		} else if (isAccessingTeacher && effectiveRole !== 'teacher') {
			shouldRedirect = true
		} else if (isAccessingStudent && effectiveRole !== 'student') {
			shouldRedirect = true
		} else if (isAccessingParent && effectiveRole !== 'parent') {
			shouldRedirect = true
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
	}, [location.pathname, isAuthenticated, user, navigate, getParentRoleName, getEffectiveRoleName])

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
