import { create } from 'zustand'

type PermissionStore = {
	loading: boolean
	allowedPages: string[]
	setPermissions: (permissions: string[]) => void
	checkPermission: (path: string) => boolean
	reset: () => void
}

export const usePermissionStore = create<PermissionStore>((set, get) => ({
	loading: true,
	allowedPages: [],
	setPermissions: permissions => set({ allowedPages: permissions, loading: false }),
	checkPermission: path => {
		const { allowedPages } = get()

		// Check exact match
		if (allowedPages.includes(path)) {
			return true
		}

		console.log(allowedPages)

		// Check if path starts with any allowed path
		return allowedPages.some(allowedPath => {
			// Handle root paths (e.g., '/admin' should match '/admin/dashboard')
			if (allowedPath === path.split('/')[1]) {
				return true
			}
			// Handle nested paths
			return path.startsWith(allowedPath + '/')
		})
	},
	reset: () => set({ loading: true, allowedPages: [] }),
}))
