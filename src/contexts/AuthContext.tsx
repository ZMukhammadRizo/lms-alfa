import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import supabase from '../config/supabaseClient'

type UserRole = 'Admin' | 'Teacher' | 'Student'

export interface User {
	id: string
	role: UserRole
	username?: string
	fullName?: string
	firstName?: string
	lastName?: string
	email?: string
	isRoleManager?: boolean
	isModuleLeader?: boolean
	[key: string]: any
}

interface AuthContextType {
	user: User | null
	isAuthenticated: boolean
	setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
	login: (
		username: string,
		password: string
	) => Promise<{ ok: boolean; role: string | null; msg: string }>
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null)
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()
	const location = useLocation()

	function isRoleManager() {
		if (!user) return { ok: false, msg: 'User not found' }

		return { ok: user.isRoleManager, msg: 'ok' }
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
					.select('*')
					.eq('id', refreshedSession.session.user.id)
					.single()

				if (userData && mounted) {
					const savedUser = localStorage.getItem(LOCAL_USER_KEY)
					if (savedUser) {
						setUser({
							...userData,
							username: userData.email?.split('@')[0] ?? '',
							fullName: `${userData.firstName} ${userData.lastName}`,
							role: userData.role,
							isRoleManager: userData.is_role_manager,
							isModuleLeader: userData.is_module_leader,
						})
						setIsAuthenticated(true)

						// Optional auto-redirect to dashboard
						const currentPath = location.pathname
						const isUnauthenticatedRoute =
							currentPath === '/' || currentPath === '/login' || currentPath === '/register'

						if (isUnauthenticatedRoute) {
							navigate(`/${userData.role.toLowerCase()}/dashboard`, { replace: true })
						}
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
	): Promise<{ ok: boolean; role: string | null; msg: string }> => {
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
			.select('role')
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
				// identify user's timezone and add it to the lastLogin

				lastLogin: new Date().toISOString(),
			})
			.eq('id', supabaseUser.id)

		if (userLastLoginError) {
			console.error('Error updating user last login:', userLastLoginError)
		}

		const role = userData.role as UserRole

		console.log(supabaseUser.email?.split('@')[0])

		const newUser: User = {
			fullName: `${userNames.firstName} ${userNames.lastName}`,
			id: supabaseUser.id,
			firstName: userNames.firstName,
			lastName: userNames.lastName,
			email: supabaseUser.email,
			role,
			username: supabaseUser.email?.split('@')[0] ?? '',
			isRoleManager: userNames.is_role_manager,
			isModuleLeader: userNames.is_module_leader,
		}

		// Save to state and localStorage
		setUser(newUser)
		setIsAuthenticated(true)
		localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser))

		console.log('Login successful, user set:', newUser)
		console.log('Session: ', session)

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
				.select()
				.single()

			if (error || !data) {
				console.error('Error updating profile:', error)
				return { ok: false, msg: 'Failed to update profile', profile: null }
			}

			console.log(data)
			setUser({
				...data,
				username: data.email?.split('@')[0] ?? '',
				fullName: `${data.firstName} ${data.lastName}`,
				role: data.role,
				isModuleLeader: data.is_module_leader,
			})
			localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(data))
			return { ok: true, msg: 'Profile updated successfully', profile: data }
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
				.select()
				.single()

			if (dbError || !data) {
				console.error('Error updating password in database:', dbError)
				return { ok: false, msg: dbError?.message ?? 'Failed to update password in database' }
			}

			console.log('Password updated successfully:', data)
			console.log('Password updated successfully (auth):', authData.user)

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
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}

export default AuthContext
