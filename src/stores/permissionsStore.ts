import { create } from 'zustand'
import supabase from '../config/supabaseClient'

interface Permission {
	id: string
	name: string
	description: string
}

interface PermissionsState {
	permissions: Permission[]
	isLoading: boolean
	error: string | null
	fetchPermissions: () => Promise<void>
}

export const usePermissionsStore = create<PermissionsState>(set => ({
	permissions: [],
	isLoading: false,
	error: null,
	fetchPermissions: async () => {
		try {
			set({ isLoading: true, error: null })
			const { data, error } = await supabase.from('permissions').select('*').order('name')

			if (error) throw error

			set({ permissions: data, isLoading: false })
		} catch (error) {
			set({
				error: error instanceof Error ? error.message : 'Failed to fetch permissions',
				isLoading: false,
			})
		}
	},
}))
