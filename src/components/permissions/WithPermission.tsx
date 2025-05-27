import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { checkUserPermission } from '../../utils/permissionUtils'

interface WithPermissionProps {
	permission: string | string[]
	redirectTo?: string
	fallback?: React.ReactNode
	children: React.ReactNode
}

/**
 * Higher-order component that protects routes/pages with permission checks
 *
 * @param permission - Single permission or array of permissions required to access the page
 * @param redirectTo - Where to redirect if permission check fails (defaults to '/')
 * @param fallback - Optional element to render instead of redirecting
 * @param children - The page/component to render if permission check passes
 */
export const WithPermission: React.FC<WithPermissionProps> = ({
	permission,
	redirectTo = '/',
	fallback,
	children,
}) => {
	const { user, isAuthenticated } = useAuth()
	const [hasPermission, setHasPermission] = useState<boolean | null>(null)

	useEffect(() => {
		const checkPermissions = async () => {
			// Not authenticated users don't have any permissions
			if (!isAuthenticated || !user) {
				setHasPermission(false)
				return
			}

			try {
				// SuperAdmin bypass
				if (typeof user.role === 'object' && user.role.name === 'SuperAdmin') {
					setHasPermission(true)
					return
				}

				// Check for multiple permissions (any one is sufficient)
				if (Array.isArray(permission)) {
					const results = await Promise.all(permission.map(p => checkUserPermission(p)))
					setHasPermission(results.some(result => result === true))
				} else {
					// Single permission check
					const result = await checkUserPermission(permission)
					setHasPermission(result)
				}
			} catch (error) {
				console.error('Error checking permissions:', error)
				setHasPermission(false)
			}
		}

		checkPermissions()
	}, [user, isAuthenticated, permission])

	// Still loading permissions
	if (hasPermission === null) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='text-xl text-gray-600'>Checking permissions...</div>
			</div>
		)
	}

	// Permission check failed
	if (!hasPermission) {
		// Show custom fallback if provided
		if (fallback) {
			return <>{fallback}</>
		}

		// Otherwise redirect
		return <Navigate to={redirectTo} replace />
	}

	// Permission check passed
	return <>{children}</>
}

export default WithPermission
