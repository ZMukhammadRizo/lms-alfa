import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import RedirectPage from '../../pages/auth/RedirectPage'
import { checkUserPermission } from '../../utils/permissionUtils'
import AccessDenied from './AccessDenied'

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
		if (!user || !user.role) return '/login'

		// Basic role extraction
		let roleName: string
		if (typeof user.role === 'string') {
			roleName = user.role.toLowerCase()
		} else if (typeof user.role === 'object' && user.role?.name) {
			roleName = user.role.name.toLowerCase()
		} else {
			// Default to student
			roleName = 'student'
		}

		return `/${roleName}/dashboard`
	}

	if (isLoading) {
		// You can show a loading indicator here if needed
		return null
	}

	if (hasPermission === false) {
		// For dashboard pages, show the AccessDenied component instead of redirecting
		if (isDashboardPage) {
			return <AccessDenied permission={requiredPermission} />
		}

		// For other pages, redirect to the user's dashboard
		const dashboardPath = getDashboardPath()
		return (
			<RedirectPage
				targetPath={dashboardPath}
				message="You don't have permission to access this page. Redirecting to your dashboard..."
			/>
		)
	}

	return <>{children}</>
}

export default PermissionGuard
