import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import supabase from '../config/supabaseClient'
import { isRoleManager as checkIsRoleManager } from '../utils/authUtils'
import { syncUserPermissions } from '../utils/permissionUtils'

// Make sure UserRole is exported for use in other components
export type UserRole =
	| 'Admin'
	| 'Teacher'
	| 'Student'
	| 'Parent'
	| {
			name: string
			parent?: {
				name: string
			}
	  }

export interface User {
	id: string
	role: UserRole
	role_id?: string
	username?: string
	fullName?: string
	firstName?: string
	lastName?: string
	email?: string
	isRoleManager?: boolean
	isModuleLeader?: boolean
	permissions?: string[]
	[key: string]: any
}

interface AuthContextType {
	user: User | null
	isAuthenticated: boolean
	setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
	login: (
		username: string,
		password: string
	) => Promise<{ ok: boolean; role: UserRole | null; msg: string }>
	logout: () => void
	updateProfile: (
		userId: string,
		fields: User
	) => Promise<{ ok: boolean; msg: string; profile: User | null }>
	updatePassword: (
		currentPassword: string,
		newPassword: string
	) => Promise<{ ok: boolean; msg: string }>
	setUser: React.Dispatch<React.SetStateAction<User | null>>
	isRoleManager: () => {
		ok: boolean | undefined
		msg: string
	}
	loading: boolean
	getRoleName: (role: UserRole) => string
	getParentRoleName: (role: UserRole) => string | null
	getEffectiveRoleName: (role: UserRole) => string
}

const LOCAL_USER_KEY = 'lms_user'

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}

interface AuthProviderProps {
	children: ReactNode
}

// Helper function to get the dashboard route based on role
export const getDashboardRoute = (role: UserRole): string => {
	console.log(`Role in the getDashboardRoute:`, role)

	// First, ensure we have a valid string role
	let roleName: string

	try {
		// Check if the role indicates a RoleManager with Admin parent
		if (typeof role === 'object' && role !== null) {
			// If it has a parent property and the parent is Admin
			if (
				role.parent &&
				typeof role.parent === 'object' &&
				role.parent.name &&
				role.parent.name.toLowerCase() === 'admin'
			) {
				return '/admin/dashboard'
			}

			// If it's a RoleManager and we have a parent role
			if (
				role.name &&
				role.name.toLowerCase() === 'rolemanager' &&
				role.parent &&
				typeof role.parent === 'object' &&
				role.parent.name
			) {
				return `/${role.parent.name.toLowerCase()}/dashboard`
			}
		}

		// If role is already a string
		if (typeof role === 'string') {
			roleName = role.toLowerCase()
		}
		// If role is an object with name property
		else if (role && typeof role === 'object') {
			// Check for parent role first
			if (role.parent && typeof role.parent === 'object' && role.parent.name) {
				roleName = role.parent.name.toLowerCase()
			}
			// Then check for role name
			else if (role.name && typeof role.name === 'string') {
				roleName = role.name.toLowerCase()
			}
			// If we can't determine the role from the object, use a default
			else {
				console.warn('Could not determine role name from object:', role)
				roleName = 'student' // Safe default
			}
		}
		// Fallback for unexpected values
		else {
			console.warn('Unexpected role type in getDashboardRoute:', typeof role, role)
			roleName = 'student' // Safe default
		}

		// Safe check to ensure role is one of the valid roles
		if (
			![
				'admin',
				'superadmin',
				'teacher',
				'moduleleader',
				'student',
				'parent',
				'rolemanager',
			].includes(roleName)
		) {
			console.warn(
				`Invalid role "${roleName}" detected in getDashboardRoute. Defaulting to student.`
			)
			roleName = 'student'
		}

		// Special handling for 'rolemanager' - use admin as the parent role by default
		if (roleName === 'rolemanager') {
			return '/admin/dashboard'
		}

		return `/${roleName}/dashboard`
	} catch (error) {
		console.error('Error in getDashboardRoute:', error)
		return '/student/dashboard' // Safe default if anything goes wrong
	}
}

// Helper function to get role name
export const getRoleName = (role: UserRole): string => {
	if (typeof role === 'string') {
		return role
	}

	if (role && typeof role === 'object' && role.name) {
		return role.name
	}

	return 'Unknown'
}

// Helper function to get parent role name
export const getParentRoleName = (role: UserRole): string | null => {
	if (role && typeof role === 'object' && role.parent && role.parent.name) {
		return role.parent.name
	}
	return null
}

// Helper function to get the effective role name (parent role if exists, otherwise role name)
export const getEffectiveRoleName = (role: UserRole): string => {
	const parentRole = getParentRoleName(role)
	return parentRole || getRoleName(role)
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null)
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()
	const location = useLocation()

	// Use the imported function instead
	const isRoleManager = () => {
		try {
			return { ok: checkIsRoleManager(), msg: 'Success' }
		} catch (error) {
			console.error('Error checking role manager status:', error)
			return { ok: false, msg: 'Error checking role manager status' }
		}
	}

	useEffect(() => {
		let mounted = true

		const refreshSession = async () => {
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession()

				if (!session) {
					console.warn('No session found. Redirecting to login.')
					if (mounted) {
						setUser(null)
						setIsAuthenticated(false)
						localStorage.removeItem(LOCAL_USER_KEY)
						navigate('/login', { replace: true })
					}
					return
				}

				const { data: refreshedSession, error } = await supabase.auth.refreshSession()

				if (error || !refreshedSession.session) {
					console.warn('Session refresh failed:', error)
					if (mounted) {
						setUser(null)
						setIsAuthenticated(false)
						localStorage.removeItem(LOCAL_USER_KEY)
						navigate('/login', { replace: true })
					}
					return
				}

				// ✅ Fetch role if token refresh worked
				const { data: userData } = await supabase
					.from('users')
					.select(
						`
    *,
    role:roles!users_role_id_fkey (
      name,
      parent:parent_role (
        name
      )
    )
  `
					)
					.eq('id', refreshedSession.session.user.id)
					.single()
				if (userData && mounted) {
					// Get role_id from user_roles table
					const { data: userRoleData } = await supabase
						.from('user_roles')
						.select('role_id')
						.eq('user_id', refreshedSession.session.user.id)
						.maybeSingle()

					const roleId = userRoleData?.role_id || null

					const userWithRole = {
						...userData,
						username: userData.email?.split('@')[0] ?? '',
						fullName: `${userData.firstName} ${userData.lastName}`,
						role: userData.role,
						role_id: roleId, // Add role_id for permission inheritance
						isRoleManager: userData.is_role_manager,
						isModuleLeader: userData.is_module_leader,
					}

					// Store user first (without permissions)
					setUser(userWithRole)
					setIsAuthenticated(true)
					localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userWithRole))

					console.log('User role:', userData.role)
					console.log('Role name:', getRoleName(userData.role))
					console.log('Parent role name:', getParentRoleName(userData.role))
					console.log('Effective role name:', getEffectiveRoleName(userData.role))

					// Synchronize permissions using the role hierarchy
					try {
						// This function properly traverses the role hierarchy
						const permissions = await syncUserPermissions()

						// If we got permissions, update the user object
						if (permissions.length > 0) {
							// Update user in state and localStorage with permissions
							const updatedUserWithPermissions = {
								...userWithRole,
								permissions,
							}

							// Store in localStorage for persistence
							localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUserWithPermissions))

							// Update state
							setUser(updatedUserWithPermissions)
						}
					} catch (error) {
						console.error('Error fetching permissions during session refresh:', error)
					}

					// Only redirect if we're on an unauthenticated route (login, register, root)
					const currentPath = location.pathname
					const isUnauthenticatedRoute =
						currentPath === '/' || currentPath === '/login' || currentPath === '/register'

					if (isUnauthenticatedRoute) {
						// Use the helper function to determine the dashboard route
						const dashboardRoute = getDashboardRoute(userData.role)
						console.log(`Redirecting to dashboard: ${dashboardRoute}`)
						navigate(dashboardRoute, { replace: true })
					} else {
						console.log(`Staying on current page: ${currentPath}`)
					}
				}
			} catch (err) {
				console.error('Unexpected error during session refresh:', err)
				if (mounted) {
					setUser(null)
					setIsAuthenticated(false)
					localStorage.removeItem(LOCAL_USER_KEY)
					navigate('/login', { replace: true })
				}
			} finally {
				if (mounted) setLoading(false)
			}
		}

		refreshSession()

		return () => {
			mounted = false
		}
	}, [navigate])

	const login = async (
		email: string,
		password: string
	): Promise<{ ok: boolean; role: UserRole | null; msg: string }> => {
		console.log('Attempting login:', { email })

		const {
			data: { user: supabaseUser, session },
			error: authError,
		} = await supabase.auth.signInWithPassword({ email, password })

		if (authError || !supabaseUser) {
			console.log(authError)
			return { ok: false, role: null, msg: authError?.message || 'Login failed' }
		}

		// Fetch user role from database
		const { data: userData, error: roleError } = await supabase
			.from('users')
			.select(
				`
			role:roles!users_role_id_fkey (
      name,
      parent:parent_role (
        name
      )
    )
			`
			)
			.eq('id', supabaseUser.id)
			.single()

		const { data: userNames, error: namesError } = await supabase
			.from('users')
			.select('firstName,lastName,is_role_manager,is_module_leader')
			.eq('id', supabaseUser.id)
			.single()

		if (namesError || !userNames) {
			console.error('Error fetching user names:', namesError)
			return { ok: false, role: null, msg: 'Failed to retrieve user names' }
		}

		if (roleError || !userData) {
			console.error('Error fetching user role:', roleError)
			return { ok: false, role: null, msg: 'Failed to retrieve user role' }
		}

		const { error: userLastLoginError } = await supabase
			.from('users')
			.update({
				lastLogin: new Date().toISOString(),
			})
			.eq('id', supabaseUser.id)

		if (userLastLoginError) {
			console.error('Error updating user last login:', userLastLoginError)
		}

		const role = userData.role as unknown as UserRole

		console.log('Role data from login:', role)
		console.log('Role name:', getRoleName(role))
		console.log('Parent role name:', getParentRoleName(role))
		console.log('Effective role name:', getEffectiveRoleName(role))

		// Get role_id first for permission inheritance
		let roleId: string | null = null
		if (typeof role === 'object' && role.name) {
			// First try to get role_id from user_roles table
			const { data: userRoleData, error: userRoleError } = await supabase
				.from('user_roles')
				.select('role_id')
				.eq('user_id', supabaseUser.id)
				.maybeSingle()

			if (!userRoleError && userRoleData) {
				roleId = userRoleData.role_id
			} else {
				// Fallback: try to get role_id from roles table by name
				const { data: roleData, error: roleIdError } = await supabase
					.from('roles')
					.select('id')
					.eq('name', role.name)
					.single()

				if (!roleIdError && roleData) {
					roleId = roleData.id
				}
			}
		}

		// Create user object with role_id
		const newUser: User = {
			fullName: `${userNames.firstName} ${userNames.lastName}`,
			id: supabaseUser.id,
			firstName: userNames.firstName,
			lastName: userNames.lastName,
			email: supabaseUser.email,
			role: role,
			role_id: roleId || undefined, // Fix the type error by converting null to undefined
			username: supabaseUser.email?.split('@')[0] ?? '',
			isRoleManager: userNames.is_role_manager,
			isModuleLeader: userNames.is_module_leader,
		}

		// Now fetch permissions using the syncUserPermissions function
		// This will properly traverse role hierarchy
		if (roleId) {
			try {
				// Store user first (without permissions) so syncUserPermissions can use it
				localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser))

				// Get permissions including inherited ones
				const permissions = await syncUserPermissions()

				// Update user with permissions
				if (permissions.length > 0) {
					newUser.permissions = permissions
				}
			} catch (error) {
				console.error('Error fetching permissions during login:', error)
			}
		}

		// Save to state and localStorage
		setUser(newUser)
		setIsAuthenticated(true)
		localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser))

		console.log('Login successful, user set:', newUser)

		// Navigate based on the role's parent or the role itself
		const dashboardRoute = getDashboardRoute(role)
		navigate(dashboardRoute, { replace: true })

		return { ok: true, role, msg: 'Login successful' }
	}

	const logout = async () => {
		console.log('Logout function called in AuthContext')
		try {
			// Clear user state
			setUser(null)
			console.log('User state cleared')

			// Remove from localStorage
			localStorage.removeItem(LOCAL_USER_KEY)
			console.log('User removed from localStorage')
			await supabase.auth.signOut()

			// Navigate to login page
			console.log('Navigating to login page')
			navigate('/login')
			console.log('Navigation completed')
		} catch (error) {
			console.error('Error during logout process:', error)
		}
	}

	// Update user profile information
	const updateProfile = async (
		userId: string,
		fields: User
	): Promise<{ ok: boolean; msg: string; profile: User | null }> => {
		try {
			console.log(fields.email)
			const { data: adminEmail, error: adminError } = await supabase.auth.updateUser({
				email: fields.email,
			})

			if (adminError) {
				console.error('Update error:', adminError)
			} else {
				console.log('Updated user:', adminEmail)
			}

			const { data, error } = await supabase
				.from('users')
				.update({ ...fields })
				.eq('id', userId)
				.select(
					`
						 *,
				role:roles!users_role_id_fkey (
      name,
      parent:parent_role (
        name
      )
    )
					`
				)
				.single()

			if (error || !data) {
				console.error('Error updating profile:', error)
				return { ok: false, msg: 'Failed to update profile', profile: null }
			}

			console.log('Updated profile data:', data)
			console.log('Role name:', getRoleName(data.role))
			console.log('Parent role name:', getParentRoleName(data.role))

			const updatedUser = {
				...data,
				username: data.email?.split('@')[0] ?? '',
				fullName: `${data.firstName} ${data.lastName}`,
				role: data.role,
				isModuleLeader: data.is_module_leader,
			}

			setUser(updatedUser)
			localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser))
			return { ok: true, msg: 'Profile updated successfully', profile: updatedUser }
		} catch (error) {
			console.error('Error during profile update:', error)
			return { ok: false, msg: 'Failed to update profile', profile: null }
		}
	}

	// Update user password
	const updatePassword = async (
		currentPassword: string,
		_newPassword: string
	): Promise<{ ok: boolean; msg: string }> => {
		try {
			if (!user) {
				return { ok: false, msg: 'User not found' }
			}

			if (user?.password !== currentPassword) {
				return { ok: false, msg: 'Current password is incorrect' }
			}

			const { data: authData, error: authError } = await supabase.auth.updateUser({
				password: _newPassword,
			})

			if (authError || !authData) {
				console.error('Error updating password:', authError)
				return { ok: false, msg: authError?.message ?? 'Failed to update password' }
			}

			// Optionally, you can also update the password in your database
			const { data, error: dbError } = await supabase
				.from('users')
				.update({ password: _newPassword })
				.eq('id', user.id)
				.select(
					`
						 *,
						role:roles!users_role_id_fkey (
      name,
      parent:parent_role (
        name
      )
    )
					`
				)

			if (dbError || !data) {
				console.error('Error updating password in database:', dbError)
				return { ok: false, msg: dbError?.message ?? 'Failed to update password in database' }
			}

			console.log('Password updated successfully:', data)

			// Update local user state
			const updatedUser = { ...user, password: _newPassword }
			setUser(updatedUser)

			return { ok: true, msg: 'Password updated successfully' }
		} catch (error) {
			console.log('Error during password update:', error)
			return { ok: false, msg: 'Failed to update password' }
		}
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated,
				setIsAuthenticated,
				login,
				logout,
				updateProfile,
				setUser,
				loading,
				updatePassword,
				isRoleManager,
				getRoleName: role => getRoleName(role),
				getParentRoleName: role => getParentRoleName(role),
				getEffectiveRoleName: role => getEffectiveRoleName(role),
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}

export default AuthContext
