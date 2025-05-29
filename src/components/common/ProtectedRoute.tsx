import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import RedirectPage from '../../pages/auth/RedirectPage'

interface ProtectedRouteProps {
	allowedRoles: string[]
	redirectPath?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	allowedRoles,
	redirectPath = '/login',
}) => {
	const { isAuthenticated, user, getParentRoleName } = useAuth()
	const location = useLocation()
	const [isRedirecting, setIsRedirecting] = useState(false)
	const [redirectTo, setRedirectTo] = useState<string | null>(null)
	const [redirectMessage, setRedirectMessage] = useState('')
	const [initialCheckDone, setInitialCheckDone] = useState(false)

	// Define the primary roles
	const PRIMARY_ROLES = ['admin', 'teacher', 'student', 'parent']

	// Reset redirecting state on location change
	useEffect(() => {
		setIsRedirecting(false)
		setRedirectTo(null)
	}, [location.pathname])

	useEffect(() => {
		// If not authenticated yet, wait for auth state to settle
		if (!isAuthenticated && !user) {
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
			console.log(`Using parent role: ${parentRole} for access control`)
		} else {
			// Otherwise get the direct role
			const directRole =
				typeof user.role === 'string'
					? user.role
					: user.role && typeof user.role === 'object' && user.role.name
					? user.role.name
					: 'unknown'

			effectiveRole = directRole.toLowerCase()
			console.log(`Using direct role: ${directRole} for access control`)
		}

		// If role is not one of the primary roles and has no valid parent,
		// default to student for safety
		if (!PRIMARY_ROLES.includes(effectiveRole)) {
			console.warn(`Role ${effectiveRole} is not a primary role. Using 'student' as fallback.`)
			effectiveRole = 'student'
		}

		// Check if the effective role is in the allowed roles list
		const hasAllowedRole = allowedRoles.some(role => role.toLowerCase() === effectiveRole)

		if (!hasAllowedRole) {
			console.log(
				`Access denied: User with role "${effectiveRole}" attempted to access a route restricted to ${allowedRoles.join(
					', '
				)}`
			)

			// Redirect to the appropriate dashboard for this role
			const dashboardPath = `/${effectiveRole}/dashboard`
			console.log(`Access denied: Redirecting to: ${dashboardPath}`)

			// Set redirecting state and path
			setRedirectMessage(
				`You don't have permission to access this area. Redirecting to your dashboard...`
			)
			setRedirectTo(dashboardPath)
			setIsRedirecting(true)
		}

		// Mark initial check as complete
		setInitialCheckDone(true)
	}, [isAuthenticated, user, allowedRoles, location.pathname, getParentRoleName])

	// Don't render anything until we've completed our initial check
	if (!initialCheckDone) {
		return null
	}

	// Check if user is authenticated
	if (!isAuthenticated || !user) {
		console.log('User is not authenticated, redirecting to login')
		// Redirect to login page with the return url
		return <Navigate to={redirectPath} state={{ from: location }} replace />
	}

	// If we're redirecting due to role mismatch
	if (isRedirecting && redirectTo) {
		return <RedirectPage targetPath={redirectTo} message={redirectMessage} />
	}

	// If user is authenticated and has an allowed role, render the outlet
	return <Outlet />
}

export default ProtectedRoute
