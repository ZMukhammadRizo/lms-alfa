import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import RedirectPage from '../../pages/auth/RedirectPage'
import { checkUserPermission } from '../../utils/permissionUtils'
import AccessDenied from './AccessDenied'
import { CheckingPermission } from './PermissionCheck'

interface PermissionGuardProps {
	requiredPermission: string
	children: React.ReactNode
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ requiredPermission, children }) => {
	const { user } = useAuth()
	const location = useLocation()
	const [hasPermission, setHasPermission] = useState<boolean | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	// Check if the current path is a dashboard path
	const isDashboardPage = location.pathname.includes('/dashboard')

	useEffect(() => {
		const checkPermission = async () => {
			setIsLoading(true)
			if (user) {
				try {
					const hasAccess = await checkUserPermission(requiredPermission)
					setHasPermission(hasAccess)
				} catch (error) {
					console.error('Error checking permission:', error)
					setHasPermission(false)
				}
			} else {
				setHasPermission(false)
			}
			setIsLoading(false)
		}

		checkPermission()
	}, [requiredPermission, user])

	// Get the user's dashboard path
	const getDashboardPath = (): string => {
		setIsLoading(true)
		if (!user || !user.role) return '/login'

		// Basic role extraction
		let roleName: string
		if (typeof user.role === 'string') {
			roleName = user.role.toLowerCase()
		} else if (typeof user.role === 'object' && user.role?.name) {
			if (user.role.parent && user.role.parent.name) {
				roleName = user.role.parent.name.toLowerCase()
			} else {
				roleName = user.role.name
			}
		} else {
			// Default to student
			roleName = 'student'
		}

		setIsLoading(false)
		return `/${roleName}/dashboard`
	}

	if (isLoading) {
		// You can show a loading indicator here if needed
		return <CheckingPermission />
	}

	if (hasPermission === false) {
		return <AccessDenied permission={requiredPermission} />
	}

	return <>{children}</>
}

export default PermissionGuard
