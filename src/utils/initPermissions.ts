import supabase from '../config/supabaseClient'
import { usePermissionStore } from '../stores/permissionStore'

export const initPermissions = async (roleId: string) => {
	const { setPermissions } = usePermissionStore.getState()

	const { data, error } = await supabase
		.from('role_permissions')
		.select('permission:permissions(name)')
		.eq('role_id', roleId)

	if (error) {
		console.error('Failed to load permissions:', error)
		setPermissions([])
		return
	}

	// @ts-ignore
	const accessPermissions = data.map(rp => rp.permission.name).filter(p => p.startsWith('access_'))

	// Convert permission names to paths and add leading slash
	const allowedPages = accessPermissions.map(
		key => '/' + key.replace('access_', '').replace(/_/g, '/')
	)

	// Add the root paths for each permission
	const rootPaths = accessPermissions.map(key => {
		const parts = key.replace('access_', '').split('_')
		return '/' + parts[0]
	})

	// Combine and remove duplicates
	const allPaths = [...new Set([...allowedPages, ...rootPaths])]

	console.log('Initialized permissions with paths:', allPaths)
	setPermissions(allPaths)
}
