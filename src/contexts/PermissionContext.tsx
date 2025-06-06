import React, { createContext, useContext, useEffect, useState } from 'react'
import supabase from '../config/supabaseClient'
import { hasPermission } from '../utils/authUtils'
import { useAuth } from './AuthContext'

interface Permission {
	id: string
	name: string
	description: string | null
	category: string | null
	[key: string]: any
}

interface PermissionContextType {
	permissionCache: Record<string, boolean>
	isLoading: boolean
	checkPermission: (permission: string) => boolean
	fetchRolePermission: () => Promise<void>
	rolePermissions: any[]
	allPermissions: Permission[]
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { user } = useAuth()
	const [permissionCache, setPermissionCache] = useState<Record<string, boolean>>({})
	const [rolePermissions, setRolePermissions] = useState<
		Omit<Permission, 'category, description'>[]
	>([])
	const [isLoading, setIsLoading] = useState(true)
	const [allPermissions, setAllPermissions] = useState<Permission[]>([])

	const fetchRolePermission = async () => {
		try {
			const { data, error } = await supabase
				.from('role_permissions')
				.select(
					`
    role_id,
    permission_id,
    permissions (
      name
    )
  `
				)
				.eq('role_id', user?.role_id)

			if (error) {
				console.error('Failed to load permissions:', error)
				return
			}

			const permissions = data.map((item: any) => ({
				name: item.permissions.name,
				id: item.permission_id,
				role_id: item.role_id,
			}))

			setRolePermissions(permissions)

			console.log(permissions)

			if (error) {
				console.error('Error fetching role permissions:', error)
				return
			}

			setRolePermissions(data as any)
		} catch (error) {
			console.error('Error in fetchRolePermission:', error)
		}
	}

	// Fetch all permissions from Supabase
	useEffect(() => {
		const fetchAllPermissions = async () => {
			try {
				const { data, error } = await supabase.from('permissions').select('*').order('name')

				if (error) {
					console.error('Error fetching permissions:', error)
					return
				}

				if (data) {
					setAllPermissions(data)
				}
			} catch (error) {
				console.error('Error in fetchAllPermissions:', error)
			}
		}

		fetchAllPermissions()
	}, [])

	// Initialize permission cache on mount and user change
	useEffect(() => {
		const initializePermissions = async () => {
			if (!user) {
				setPermissionCache({})
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			try {
				// Check all permissions at once
				const newPermissionCache: Record<string, boolean> = {}
				allPermissions.forEach(permission => {
					newPermissionCache[permission.name] = hasPermission(permission.name)
				})

				setPermissionCache(newPermissionCache)
			} catch (error) {
				console.error('Error initializing permissions:', error)
				setPermissionCache({})
			} finally {
				setIsLoading(false)
			}
		}

		initializePermissions()
	}, [user, allPermissions])

	const checkPermission = (permission: string): boolean => {
		return permissionCache[permission] || false
	}

	return (
		<PermissionContext.Provider
			value={{
				permissionCache,
				isLoading,
				checkPermission,
				allPermissions,
				fetchRolePermission,
				rolePermissions,
			}}
		>
			{children}
		</PermissionContext.Provider>
	)
}

export const usePermissions = () => {
	const context = useContext(PermissionContext)
	if (context === undefined) {
		throw new Error('usePermissions must be used within a PermissionProvider')
	}
	return context
}
