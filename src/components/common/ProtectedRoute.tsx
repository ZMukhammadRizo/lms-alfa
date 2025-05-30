import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import RedirectPage from '../../pages/auth/RedirectPage'
import { checkUserPermission } from '../../utils/permissionUtils'

interface ProtectedRouteProps {
	allowedRoles: string[]
	requiredPermission?: string
	redirectPath?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	allowedRoles,
	requiredPermission,
	redirectPath = '/login',
}) => {
	const { isAuthenticated, user, getParentRoleName, loading } = useAuth()
	const location = useLocation()
	const [isRedirecting, setIsRedirecting] = useState(false)
	const [redirectTo, setRedirectTo] = useState<string | null>(null)
	const [redirectMessage, setRedirectMessage] = useState('')
	const [initialCheckDone, setInitialCheckDone] = useState(false)
	const [hasPermission, setHasPermission] = useState<boolean | null>(null)

	// Define the primary roles
	const PRIMARY_ROLES = ['admin', 'teacher', 'student', 'parent']

	// Reset redirecting state on location change
	useEffect(() => {
		setIsRedirecting(false)
		setRedirectTo(null)
	}, [location.pathname])

	// Check permission if requiredPermission is provided
	useEffect(() => {
		const checkPermission = async () => {
			if (requiredPermission && user) {
				try {
					const hasAccess = await checkUserPermission(requiredPermission)
					setHasPermission(hasAccess)
				} catch (error) {
					console.error('Error checking permission:', error)
					setHasPermission(false)
				}
			} else if (!requiredPermission) {
				// If no permission is required, set to true
				setHasPermission(true)
			}
		}

		checkPermission()
	}, [requiredPermission, user])

	// Check roles and permissions
	useEffect(() => {
		// If not authenticated or no user, don't proceed with role checks
		if (!isAuthenticated || !user) {
			setInitialCheckDone(true)
			return
		}

		// If we're still checking permissions, don't proceed yet
		if (requiredPermission && hasPermission === null) {
			return
		}

		try {
			// Get user's effective role (the primary role or parent role)
			let effectiveRole: string

			// Only try to access role properties if user exists
			// Get parent role if it exists
			let parentRole = null
			if (user && user.role && typeof user.role === 'object') {
				parentRole = getParentRoleName(user.role)
			}

			// If parent role exists and is one of the primary roles, use that
			if (parentRole && PRIMARY_ROLES.includes(parentRole.toLowerCase())) {
				effectiveRole = parentRole.toLowerCase()
				console.log(`Using parent role: ${parentRole} for access control`)
			} else {
				// Otherwise get the direct role, with additional null checks
				const directRole =
					user && user.role
						? typeof user.role === 'string'
							? user.role
							: user.role && typeof user.role === 'object' && user.role.name
							? user.role.name
							: 'unknown'
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

			// Check if user has the required permission (if specified)
			const permissionCheck = requiredPermission ? hasPermission : true

			if (!hasAllowedRole || !permissionCheck) {
				console.log(
					`Access denied: User with role "${effectiveRole}" attempted to access a route restricted to ${allowedRoles.join(
						', '
					)}`
				)

				if (!permissionCheck) {
					console.log(`User lacks required permission: ${requiredPermission}`)
				}

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
		} catch (error) {
			console.error('Error in ProtectedRoute:', error)
		}

		// Mark initial check as complete
		setInitialCheckDone(true)
	}, [
		isAuthenticated,
		user,
		allowedRoles,
		location.pathname,
		getParentRoleName,
		hasPermission,
		requiredPermission,
	])

	// Check if user is authenticated - this must be done before any role checks
	if (!loading && (!isAuthenticated || !user)) {
		console.log('User is not authenticated, redirecting to login')
		// Redirect to login page with the return url
		return <Navigate to={redirectPath} state={{ from: location }} replace />
	}

	// If we're redirecting due to role mismatch (AFTER role check is done)
	if (initialCheckDone && isRedirecting && redirectTo) {
		return <RedirectPage targetPath={redirectTo} message={redirectMessage} />
	}

	// Render the outlet even while loading, to preserve layout and sidebar
	// Role-based redirects will happen after the check completes
	return <Outlet />
}

export default ProtectedRoute
