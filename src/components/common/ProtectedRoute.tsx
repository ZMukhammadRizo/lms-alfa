import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import RedirectPage from '../../pages/auth/RedirectPage'
import { getUserParentRole, getUserRole, isRoleManager } from '../../utils/authUtils'

interface ProtectedRouteProps {
	allowedRoles: string[]
	redirectPath?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	allowedRoles,
	redirectPath = '/login',
}) => {
	const { isAuthenticated, user } = useAuth()
	const location = useLocation()
	const [isRedirecting, setIsRedirecting] = useState(false)
	const [redirectTo, setRedirectTo] = useState<string | null>(null)
	const [redirectMessage, setRedirectMessage] = useState('')

	// Reset redirecting state on location change
	useEffect(() => {
		setIsRedirecting(false)
		setRedirectTo(null)
	}, [location.pathname])

	useEffect(() => {
		// Log access attempt
		if (isAuthenticated && user) {
			const userRole = getUserRole()
			const parentRole = getUserParentRole()
			const isUserRoleManager = isRoleManager()

			// For RoleManager, prioritize parent role for permissions
			const effectiveRoleForPermission = isUserRoleManager && parentRole ? parentRole : userRole

			const hasAllowedRole = allowedRoles.some(
				role => role.toLowerCase() === effectiveRoleForPermission.toLowerCase()
			)

			if (!hasAllowedRole) {
				console.log(
					`Access denied: User with role "${effectiveRoleForPermission}" attempted to access a route restricted to ${allowedRoles.join(
						', '
					)}`
				)
			}
		}
	}, [isAuthenticated, user, allowedRoles, location.pathname])

	// Prevent flashing login page if user is authenticated but we're checking roles
	if (isAuthenticated && user && isRedirecting && redirectTo) {
		return <RedirectPage targetPath={redirectTo} message={redirectMessage} />
	}

	// Check if user is authenticated
	if (!isAuthenticated || !user) {
		// Only redirect to login if we're not already redirecting elsewhere
		if (!isRedirecting) {
			console.log('User is not authenticated, redirecting to login')
			// Redirect to login page with the return url
			return <Navigate to={redirectPath} state={{ from: location }} replace />
		}
		return <RedirectPage targetPath={redirectPath} message='Checking authentication...' />
	}

	// Get user's role and parent role (if any)
	const userRole = getUserRole()
	const parentRole = getUserParentRole()
	const isUserRoleManager = isRoleManager()

	// For RoleManager users, parent role should be checked first for permissions
	let effectiveRoleForAccess = userRole
	if (isUserRoleManager && parentRole) {
		effectiveRoleForAccess = parentRole
	}

	// Check if user's effective role (prioritizing parent role for RoleManager) is allowed
	const hasAllowedRole = allowedRoles.some(
		role => role.toLowerCase() === effectiveRoleForAccess.toLowerCase()
	)

	if (!hasAllowedRole) {
		// Ensure effectiveRoleForAccess is a string and not an object
		const roleName =
			typeof effectiveRoleForAccess === 'string'
				? effectiveRoleForAccess.toLowerCase()
				: typeof effectiveRoleForAccess === 'object' &&
				  effectiveRoleForAccess !== null &&
				  'name' in effectiveRoleForAccess
				? String(effectiveRoleForAccess.name).toLowerCase()
				: 'unknown'

		// Safe fallback if we can't determine the role
		const safeRoleName = ['admin', 'teacher', 'student', 'parent'].includes(roleName)
			? roleName
			: 'student'

		// Set up for redirection
		const dashboardPath = `/${safeRoleName}/dashboard`
		console.log(`Redirecting to: ${dashboardPath}`)

		// Set redirecting state and path
		setRedirectMessage(
			`You don't have permission to access this area. Redirecting to your dashboard...`
		)
		setRedirectTo(dashboardPath)
		setIsRedirecting(true)

		// Return the redirect page
		return (
			<RedirectPage
				targetPath={dashboardPath}
				message={`You don't have permission to access this area. Redirecting to your dashboard...`}
			/>
		)
	}

	// If user is authenticated and has an allowed role, render the outlet
	return <Outlet />
}

export default ProtectedRoute
