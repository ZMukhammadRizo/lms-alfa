import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { checkUserPermission, getCurrentUserPermissions } from '../../utils/permissionUtils'

interface PermissionGuardProps {
	permission: string | string[]
	fallback?: React.ReactNode
	children: React.ReactNode
	showLoading?: boolean
}

/**
 * A component that conditionally renders its children based on the user's permissions.
 *
 * @param permission - Single permission or array of permissions required to render children
 * @param fallback - Optional element to render if permission check fails
 * @param children - The elements to render if permission check passes
 * @param showLoading - Whether to show a loading state while checking permissions
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
	permission,
	fallback = null,
	children,
	showLoading = false,
}) => {
	const { user } = useAuth()
	const [hasPermission, setHasPermission] = useState<boolean>(false)
	const [isLoading, setIsLoading] = useState<boolean>(true)

	useEffect(() => {
		const checkPermission = async () => {
			setIsLoading(true)
			try {
				if (!user) {
					setHasPermission(false)
					return
				}

				// Handle case for SuperAdmin role which has all permissions
				if (typeof user.role === 'object' && user.role.name === 'SuperAdmin') {
					setHasPermission(true)
					return
				}

				// Handle array of permissions (any of them is sufficient)
				if (Array.isArray(permission)) {
					const permissions = await getCurrentUserPermissions()
					// Check if the user has any of the required permissions
					setHasPermission(permission.some(perm => permissions.includes(perm)))
				} else {
					// Single permission check
					const result = await checkUserPermission(permission)
					setHasPermission(result)
				}
			} catch (error) {
				console.error('Error checking permission:', error)
				setHasPermission(false)
			} finally {
				setIsLoading(false)
			}
		}

		checkPermission()
	}, [user, permission])

	if (isLoading && showLoading) {
		return <div className='text-gray-500'>Checking permissions...</div>
	}

	return hasPermission ? <>{children}</> : <>{fallback}</>
}

export default PermissionGuard
