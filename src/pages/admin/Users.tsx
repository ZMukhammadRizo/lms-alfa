import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import {
	FiDownload,
	FiEdit2,
	FiFilter,
	FiHome,
	FiMoreVertical,
	FiSearch,
	FiTrash2,
	FiUser,
	FiUserCheck,
	FiUserPlus,
	FiUsers,
	FiX,
} from 'react-icons/fi'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import UserForm from '../../components/admin/UserForm'
import supabase, { supabaseAdmin } from '../../config/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { User as UserType } from '../../types/User'
import { formatDateToLocal } from '../../utils/formatDate'
import { canCreateUserWithRole } from '../../utils/permissions'

// User interface
interface User extends UserType {
	id: string
	firstName: string
	lastName: string
	name?: string // Keep for backwards compatibility
	email: string
	role: string
	roleObj?: {
		name: string
		parent_role?: string
		parent?: {
			name: string
		}
	}
	effectiveRole?: string // The parent role or main role for grouping purposes
	status: 'active' | 'inactive'
	lastLogin: string
	createdAt: string
	parent_id?: string // Local state representation
	parentId?: string // Database field (camelCase)
	childrenIds?: string[] // For form handling
	password?: string // For creating new users
}

// Define role types for tabs
type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Parent'

const Users: React.FC = () => {
	// State for search, filters, and selected users
	const [selectedUsers, setSelectedUsers] = useState<string[]>([])
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [currentUser, setCurrentUser] = useState<User | null>(null)
	const [users, setUsers] = useState<User[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [filterStatus, setFilterStatus] = useState<string>('')
	const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false)

	// New state for role tabs
	const [activeRole, setActiveRole] = useState<UserRole>('Admin')
	const [isLoading, setIsLoading] = useState(false)

	// Add state for delete confirmation modal
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [userToDelete, setUserToDelete] = useState<string | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)
	const [deleteError, setDeleteError] = useState<string | null>(null)

	// Get current user and permissions from context
	const { user } = useAuth()

	// Function to get effective role for a user (considering parent roles)
	const getEffectiveRole = (user: User): UserRole => {
		// If user has a roleObj with parent information
		if (user.roleObj?.parent?.name) {
			// Return parent role name if it's one of our primary roles
			const parentName = user.roleObj.parent.name
			if (['Admin', 'Teacher', 'Student', 'Parent'].includes(parentName)) {
				return parentName as UserRole
			}
		}

		// If no parent or parent is not a primary role, use the user's own role
		return user.role as UserRole
	}

	// Count users by effective role (including parent roles)
	const countUsersByRole = (role: UserRole): number => {
		return users.filter(user => {
			const effectiveRole = user.effectiveRole || getEffectiveRole(user)
			return effectiveRole === role
		}).length
	}

	// Roles with icons for tabs
	const roles: { role: UserRole; icon: React.ReactNode; count: number }[] = [
		{
			role: 'Admin',
			icon: <FiUserCheck />,
			count: countUsersByRole('Admin'),
		},
		{
			role: 'Teacher',
			icon: <FiUser />,
			count: countUsersByRole('Teacher'),
		},
		{
			role: 'Student',
			icon: <FiUsers />,
			count: countUsersByRole('Student'),
		},
		{
			role: 'Parent',
			icon: <FiHome />,
			count: countUsersByRole('Parent'),
		},
	]
	// User deletion helper function
	async function deleteUser(userId: string) {
		const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)
		if (error) {
			console.error('Error deleting user from auth:', error)
			throw error
		} else {
			console.log('User successfully deleted from auth:', data)
			return data
		}
	}

	// Add this new function before the useEffect that calls fetchUsers
	const inspectDatabaseSchema = async () => {
		try {
			console.log('Inspecting database schema...')

			// First, get a sample record to understand fields
			const { data: sampleData, error: sampleError } = await supabase
				.from('users')
				.select('*')
				.limit(1)

			if (sampleError) {
				console.error('Error fetching sample data:', sampleError)
			} else if (sampleData && sampleData.length > 0) {
				console.log('Sample user data structure:', sampleData[0])
				console.log('Available fields:', Object.keys(sampleData[0]))
			} else {
				console.log('No sample data found')
			}

			// Try to get actual schema using system tables if accessible
			try {
				const { data: schemaData, error: schemaError } = await supabase.rpc('get_schema_info', {
					table_name: 'users',
				})

				if (schemaError) {
					console.error('Error fetching schema:', schemaError)
				} else {
					console.log('Table schema information:', schemaData)
				}
			} catch (e) {
				console.log('Schema function not available')
			}
		} catch (err) {
			console.error('Error inspecting schema:', err)
		}
	}

	useEffect(() => {
		const fetchUsers = async () => {
			setIsLoading(true)
			try {
				// Debug database schema
				await inspectDatabaseSchema()

				// Try fetching from 'users' table with role details including parent role
				console.log('Fetching users with roles and parent roles...')
				let { data, error } = await supabase.from('users').select(`
						*,
						roleObj:roles!users_role_id_fkey (
							name,
							parent_role,
							parent:parent_role (
								name
							)
						)
					`)

				if (error) {
					console.error('Error fetching users with roles:', error)
					// Fallback to basic user fetching without role details
					const { data: basicData, error: basicError } = await supabase.from('users').select('*')

					if (!basicError && basicData) {
						console.log('Successfully fetched basic user data')
						data = basicData
						error = null
					} else {
						console.error('Error fetching basic user data:', basicError)
					}
				}

				if (data) {
					// Process users with role information
					const formattedUsers = data.map(user => {
						// Handle different field naming conventions
						const firstName = user.firstName || user.first_name || user.firstname || ''
						const lastName = user.lastName || user.last_name || user.lastname || ''
						const email = user.email || ''

						// Determine role display name and effective role for filtering
						let roleName = user.role || user.user_role || 'Student'
						let effectiveRole = roleName

						// If we have role object with parent information
						if (user.roleObj) {
							roleName = user.roleObj.name || roleName

							// If there's a parent role, use it for the effective role (for tab grouping)
							if (user.roleObj.parent && user.roleObj.parent.name) {
								effectiveRole = user.roleObj.parent.name
							}
						}

						const status =
							typeof user.status === 'string'
								? user.status
								: user.is_active || user.active
								? 'active'
								: 'inactive'
						const lastLogin =
							formatDateToLocal(user.lastLogin) ||
							formatDateToLocal(user.last_login) ||
							formatDateToLocal(user.last_sign_in_at) ||
							''

						// Extract name if firstName/lastName are not available
						let extractedFirstName = firstName
						let extractedLastName = lastName

						if ((!firstName || !lastName) && (user.name || user.full_name || user.display_name)) {
							const fullName = user.name || user.full_name || user.display_name || ''
							const nameParts = fullName.split(' ')
							extractedFirstName = nameParts[0] || ''
							extractedLastName = nameParts.slice(1).join(' ') || ''
						}

						return {
							id: user.id,
							firstName: extractedFirstName,
							lastName: extractedLastName,
							email,
							role: roleName,
							roleObj: user.roleObj,
							effectiveRole,
							status,
							lastLogin,
							createdAt: user.createdAt || user.created_at || '',
							parent_id: user.parent_id,
							parentId: user.parentId,
							childrenIds: user.childrenIds,
							password: user.password,
						}
					})

					setUsers(formattedUsers)
					console.log('Processed users with roles:', formattedUsers)
				}
			} catch (error) {
				console.error('Error in fetchUsers:', error)
			} finally {
				setIsLoading(false)
			}
		}
		fetchUsers()
	}, [])

	// Filter users based on search term, active role, and status filter
	const filteredUsers = users.filter(user => {
		const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
		const matchesSearch =
			fullName.includes(searchTerm.toLowerCase()) ||
			user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase())

		// Check if user's effective role matches the active tab
		const effectiveRole = user.effectiveRole || getEffectiveRole(user)
		const matchesRole = effectiveRole === activeRole

		const matchesStatus = filterStatus ? user.status === filterStatus : true

		return matchesSearch && matchesRole && matchesStatus
	})

	// Handle search input change
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	// Handle role tab change
	const handleRoleChange = (role: UserRole) => {
		setActiveRole(role)
		setSelectedUsers([]) // Clear selections when changing tabs
	}

	// Handle status filter change
	const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setFilterStatus(e.target.value)
	}

	// Handle checkbox selection
	const handleSelectUser = (userId: string) => {
		if (selectedUsers.includes(userId)) {
			setSelectedUsers(selectedUsers.filter(id => id !== userId))
		} else {
			setSelectedUsers([...selectedUsers, userId])
		}
	}

	// Handle select all checkbox
	const handleSelectAll = () => {
		if (selectedUsers.length === filteredUsers.length) {
			setSelectedUsers([])
		} else {
			setSelectedUsers(filteredUsers.map(user => user.id))
		}
	}

	// Toggle actions menu
	const toggleActionsMenu = () => {
		setIsActionsMenuOpen(!isActionsMenuOpen)
	}

	// Open form to add a new user
	const handleAddUser = () => {
		setCurrentUser(null)
		setIsFormOpen(true)
	}

	// Open form to edit an existing user
	const handleEditUser = (user: User) => {
		console.log('Opening edit form for user:', user)
		setCurrentUser(user)
		setIsFormOpen(true)
	}

	// Open delete confirmation modal
	const handleOpenDeleteModal = (userId: string) => {
		setUserToDelete(userId)
		setIsDeleteModalOpen(true)
	}

	// Close delete confirmation modal
	const handleCloseDeleteModal = () => {
		setIsDeleteModalOpen(false)
		setUserToDelete(null)
		setDeleteError(null)
	}

	// Handle delete user
	const handleDeleteUser = async () => {
		if (!userToDelete) return

		setIsDeleting(true)
		setDeleteError(null)

		try {
			// Delete from auth system using Admin API
			try {
				console.log('Deleting user from auth system:', userToDelete)
				await deleteUser(userToDelete)
			} catch (authDeleteError) {
				console.log('Error attempting to delete from auth system:', authDeleteError)
				// Continue with the main deletion even if auth deletion fails
			}

			// Delete the user from the main users table
			const { error } = await supabase.from('users').delete().eq('id', userToDelete)

			if (error) {
				console.error('Error deleting user:', error)
				setDeleteError(error.message)
				return
			}

			// Remove user from local state
			setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete))

			// Close the modal
			setIsDeleteModalOpen(false)
			setUserToDelete(null)
		} catch (error) {
			console.error('Unexpected error during deletion:', error)
			setDeleteError('An unexpected error occurred')
		} finally {
			setIsDeleting(false)
		}
	}

	// Function to check if email already exists
	const checkEmailExists = async (email: string): Promise<boolean> => {
		try {
			const { data, error } = await supabase.from('users').select('id').eq('email', email).single()

			if (error) {
				if (error.code === 'PGRST116') {
					// PGRST116 means no rows returned, so email doesn't exist
					return false
				}
				console.error('Error checking email existence:', error)
				// If there's an error querying, we can't be sure, so treat as not existing
				return false
			}

			// If we got data back, the email exists
			return !!data
		} catch (err) {
			console.error('Unexpected error checking email:', err)
			return false
		}
	}

	// Handle form submission (creating or updating a user)
	const handleFormSubmit = async (userData: Partial<User>) => {
		console.log('Form submission with user data:', userData)

		// Add loading state for form submission
		setIsLoading(true)

		try {
			if (currentUser && currentUser.id) {
				// If updating, check if changing to an email that already exists
				if (userData.email !== currentUser.email) {
					const emailExists = await checkEmailExists(userData.email as string)
					if (emailExists) {
						setIsLoading(false)
						throw new Error(
							`Email address ${userData.email} is already registered. Please use a different email.`
						)
					}
				}

				// Update existing user
				console.log('Updating existing user:', currentUser.id)

				// First update the user data
				const { error } = await supabase
					.from('users')
					.update({
						firstName: userData.firstName,
						lastName: userData.lastName,
						email: userData.email,
						role: userData.role,
						status: userData.status,
					})
					.eq('id', currentUser.id)

				if (error) {
					console.error('Error updating user:', error)
					toast.error(`Failed to update user: ${error.message || 'Unknown error'}`)
					throw error
				}

				// Check if we're updating a parent user with child associations
				if (userData.role === 'Parent' && userData.childrenIds) {
					// Assign the selected children to this parent
					await assignChildrenToParent(currentUser.id, userData.childrenIds as string[])
				}

				// Update the user in our local state
				setUsers(prevUsers =>
					prevUsers.map(user =>
						user.id === currentUser.id
							? {
									...user,
									...userData,
							  }
							: user
					)
				)

				toast.success('User updated successfully!')
			} else {
				// Create new user
				console.log('Creating new user:', userData.email)

				// Check permission for creating a user with this role
				if (userData.role === 'Parent') {
					const hasPermission = canCreateUserWithRole({
						currentUserRole: typeof user?.role === 'string' ? user.role : user?.role?.name || '',
						currentUserPermissions: user?.permissions || [],
						newUserRole: 'Parent',
					})

					if (!hasPermission) {
						setIsLoading(false)
						toast.error('You do not have permission to create Parent users.')
						return
					}
				}

				// Check if email already exists
				const emailExists = await checkEmailExists(userData.email as string)
				if (emailExists) {
					setIsLoading(false)
					throw new Error(
						`Email address ${userData.email} is already registered. Please use a different email.`
					)
				}

				let userId
				let retryCount = 0
				const maxRetries = 2

				// Retry loop for user creation
				while (retryCount <= maxRetries) {
					try {
						// First, create the user in auth
						const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
							email: userData.email as string,
							password: userData.password as string,
							email_confirm: true,
						})

						if (authError) {
							console.error('Error creating user in auth:', authError)
							if (retryCount >= maxRetries) {
								// We've exhausted our retries, show error and keep form open
								setIsLoading(false)
								toast.error(`Authentication error: ${authError.message}`)
								return // Return early to prevent closing the form
							}
							throw authError
						}

						// Get the user ID from auth
						userId = authData.user.id
						break // Successfully created auth user, exit retry loop
					} catch (error: any) {
						retryCount++
						console.error(`Auth creation attempt ${retryCount} failed:`, error)

						if (retryCount > maxRetries) {
							// Don't close the form, show error instead
							setIsLoading(false)
							toast.error(
								error.message
									? `Authentication error: ${error.message}`
									: 'Failed to create user account after multiple attempts'
							)

							// Return early to prevent closing the form
							return
						}

						// Wait before retrying
						await new Promise(resolve => setTimeout(resolve, 1000))
						toast.error(`Authentication error: ${error.message}. Retrying...`)
					}
				}

				if (!userId) {
					throw new Error('Failed to create user authentication')
				}

				// Log detailed information about the user table structure for debugging
				console.log('Attempting to insert user with data:', {
					id: userId,
					firstName: userData.firstName, // Try both camelCase and snake_case since we're not sure
					lastName: userData.lastName,
					first_name: userData.firstName,
					last_name: userData.lastName,
					email: userData.email,
					role: userData.role,
					status: userData.status,
					password: userData.password,
				})

				// Then, create the user in our users table
				try {
					const { error: dbError } = await supabase.from('users').insert({
						id: userId,
						firstName: userData.firstName, // Use camelCase instead of snake_case
						lastName: userData.lastName,
						email: userData.email,
						role: userData.role,
						status: userData.status,
						password: userData.password, // Add password field to satisfy NOT NULL constraint
						// Removed created_at as it's not in the schema
					})

					if (dbError) {
						console.error('Error inserting user into database:', dbError)
						// Show detailed error information for debugging
						console.log('Failed user data:', {
							id: userId,
							firstName: userData.firstName,
							lastName: userData.lastName,
							email: userData.email,
							role: userData.role,
							status: userData.status,
							password: userData.password ? '(provided)' : '(missing)',
						})

						// Don't close the form, show error instead
						setIsLoading(false)
						toast.error(`Database error: ${dbError.message || 'Unknown error'}`)

						// Return early to prevent closing the form
						return
					}
				} catch (dbError) {
					// If database insert fails, attempt to clean up the auth user
					try {
						await supabaseAdmin.auth.admin.deleteUser(userId)
					} catch (cleanupError) {
						console.error('Failed to clean up auth user after database error:', cleanupError)
					}

					// Don't close the form, show error instead
					setIsLoading(false)
					toast.error('Failed to create user in database')

					// Return early to prevent closing the form
					return
				}

				// Check if we're creating a parent with child associations
				if (userData.role === 'Parent' && userData.childrenIds && userData.childrenIds.length > 0) {
					try {
						// Assign the selected children to this parent
						await assignChildrenToParent(userId, userData.childrenIds as string[])
					} catch (relationError: any) {
						console.error('Error setting up parent-child relationships:', relationError)

						// We still consider this a partial success, but inform the user
						toast.error(
							'User created but failed to assign children: ' +
								(relationError.message || 'Unknown error')
						)
					}
				}

				// Add the new user to our local state
				const newUser: User = {
					id: userId,
					firstName: userData.firstName || '',
					lastName: userData.lastName || '',
					email: userData.email || '',
					role: userData.role || 'Student',
					effectiveRole: userData.role as string, // Set effective role same as role for new users
					status: (userData.status as 'active' | 'inactive') || 'active',
					lastLogin: 'Never',
					createdAt: new Date().toISOString(),
					childrenIds: userData.childrenIds,
					password: userData.password,
				}

				setUsers(prevUsers => [...prevUsers, newUser])

				toast.success('User created successfully!')
			}

			// Close the form
			setIsFormOpen(false)
			setCurrentUser(null)
		} catch (error: any) {
			console.error('Error in handleFormSubmit:', error)
			toast.error(error.message ? `Error: ${error.message}` : 'Failed to save user data')
		} finally {
			setIsLoading(false)
		}
	}

	// Function to assign children to a parent
	const assignChildrenToParent = async (parentId: string, childrenIds: string[]) => {
		try {
			console.log('Assigning children to parent:', { parentId, childrenIds })

			// Update each child's parent_id to point to this parent
			// Use camelCase (parentId) instead of snake_case (parent_id) to match DB schema
			const { data, error } = await supabase
				.from('users')
				.update({ parent_id: parentId })
				.in('id', childrenIds)

			if (error) {
				console.error('Error assigning children to parent:', error)
				console.log('Failed assignment data:', { parentId, childIds: childrenIds })
				toast.error(`Failed to assign children: ${error.message || 'Unknown error'}`)
				throw error
			}

			console.log('Successfully assigned children to parent:', data)

			// Update the local state to reflect parent-child relationships
			setUsers(prevUsers =>
				prevUsers.map(user => {
					if (childrenIds.includes(user.id)) {
						return { ...user, parent_id: parentId } // Keep using parent_id in state for consistency
					}
					return user
				})
			)

			return data
		} catch (err) {
			console.error('Error in assignChildrenToParent:', err)
			throw err
		}
	}

	// Function to get children for a parent
	const getChildrenForParent = (parentId: string) => {
		// Filter users that have this parent ID
		// Check both camelCase and snake_case field names for compatibility
		return users.filter(user => user.parent_id === parentId || user.parentId === parentId)
	}

	// Create a new component to display child users for a parent
	const ChildrenList: React.FC<{ parentId: string; users: User[] }> = ({ parentId, users }) => {
		const children = users.filter(user => user.parent_id === parentId || user.parentId === parentId)

		if (children.length === 0) {
			return <span className='text-gray-400'>No children assigned</span>
		}

		return (
			<div className='flex flex-col gap-1'>
				{children.map(child => (
					<div key={child.id} className='text-sm flex items-center'>
						<FiUsers className='mr-1 text-blue-500' size={12} />
						<span>
							{child.firstName} {child.lastName}
						</span>
					</div>
				))}
			</div>
		)
	}

	const handleFormClose = () => {
		setIsFormOpen(false)
		setCurrentUser(null)
	}

	// Add the delete confirmation modal as a component
	const DeleteConfirmationModal = () => {
		if (!isDeleteModalOpen || !userToDelete) return null

		const user = users.find(u => u.id === userToDelete)
		if (!user) return null

		return (
			<ModalOverlay
				as={motion.div}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
			>
				<DeleteModal
					as={motion.div}
					initial={{ scale: 0.9, y: 20, opacity: 0 }}
					animate={{ scale: 1, y: 0, opacity: 1 }}
					exit={{ scale: 0.9, y: 20, opacity: 0 }}
					transition={{ type: 'spring', damping: 25 }}
				>
					<DeleteModalHeader>
						<DeleteModalTitle>Delete User</DeleteModalTitle>
						<CloseButton onClick={handleCloseDeleteModal}>
							<FiX />
						</CloseButton>
					</DeleteModalHeader>

					<DeleteModalContent>
						<DeleteWarningIcon>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								viewBox='0 0 24 24'
								fill='currentColor'
								width='32'
								height='32'
							>
								<path
									fillRule='evenodd'
									d='M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z'
									clipRule='evenodd'
								/>
							</svg>
						</DeleteWarningIcon>

						<DeleteModalText>
							<DeleteTitle>Are you sure you want to delete this user?</DeleteTitle>
							<DeleteDescription>
								<strong>{`${user.firstName} ${user.lastName}`}</strong> will be permanently removed
								from the system. This action cannot be undone.
							</DeleteDescription>

							{deleteError && <DeleteError>{deleteError}</DeleteError>}
						</DeleteModalText>
					</DeleteModalContent>

					<DeleteModalFooter>
						<CancelButton onClick={handleCloseDeleteModal}>Cancel</CancelButton>
						<ConfirmDeleteButton onClick={handleDeleteUser} disabled={isDeleting}>
							{isDeleting ? 'Deleting...' : 'Delete User'}
						</ConfirmDeleteButton>
					</DeleteModalFooter>
				</DeleteModal>
			</ModalOverlay>
		)
	}

	// Update the actual delete handler
	const handleDeleteClick = (userId: string) => {
		handleOpenDeleteModal(userId)
	}

	return (
		<UsersContainer
			as={motion.div}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<PageHeader>
				<div>
					<PageTitle>User Management</PageTitle>
					<PageDescription>Manage system users, roles and permissions</PageDescription>
				</div>

				<AddUserButton onClick={handleAddUser}>
					<FiUserPlus />
					<span>Add New User</span>
				</AddUserButton>
			</PageHeader>

			{/* Role Tabs */}
			<RoleTabsContainer>
				{roles.map(({ role, icon, count }) => (
					<RoleTab key={role} $active={activeRole === role} onClick={() => handleRoleChange(role)}>
						<RoleTabIcon>{icon}</RoleTabIcon>
						<RoleTabContent>
							<RoleTabName>{role}s</RoleTabName>
							<RoleTabCount>{count}</RoleTabCount>
						</RoleTabContent>
					</RoleTab>
				))}
			</RoleTabsContainer>

			<ToolbarContainer>
				<SearchAndFilters>
					<SearchContainer>
						<SearchIcon>
							<FiSearch />
						</SearchIcon>
						<SearchInput
							placeholder={`Search ${activeRole.toLowerCase()}s...`}
							value={searchTerm}
							onChange={handleSearchChange}
						/>
					</SearchContainer>

					<FiltersSection>
						<FilterLabel>
							<FiFilter />
							<span>Status:</span>
						</FilterLabel>

						<FilterSelect value={filterStatus} onChange={handleStatusFilterChange}>
							<option value=''>All Status</option>
							<option value='active'>Active</option>
							<option value='inactive'>Inactive</option>
						</FilterSelect>
					</FiltersSection>
				</SearchAndFilters>

				<ToolbarActions>
					{selectedUsers.length > 0 && (
						<>
							<SelectedCount>{selectedUsers.length} selected</SelectedCount>
							<ActionsButton onClick={toggleActionsMenu}>
								<FiMoreVertical />
								<span>Actions</span>
							</ActionsButton>
							{isActionsMenuOpen && (
								<ActionsMenu>
									<ActionMenuItem>Send Email</ActionMenuItem>
									<ActionMenuItem $danger>Delete Selected</ActionMenuItem>
								</ActionsMenu>
							)}
						</>
					)}
					<ExportButton>
						<FiDownload />
						<span>Export</span>
					</ExportButton>
				</ToolbarActions>
			</ToolbarContainer>

			{isLoading ? (
				<LoadingState>Loading users...</LoadingState>
			) : (
				<TableContainer>
					<Table>
						<TableHeader>
							<TableRow>
								<HeaderCell width='40px'>#</HeaderCell>
								<HeaderCell>User</HeaderCell>
								<HeaderCell>Email</HeaderCell>
								<HeaderCell>Role</HeaderCell>
								<HeaderCell>Status</HeaderCell>
								{(activeRole === 'Student' || activeRole === 'Parent') && (
									<>
										{activeRole === 'Student' && <HeaderCell>Parent</HeaderCell>}
										{activeRole === 'Parent' && <HeaderCell>Children</HeaderCell>}
									</>
								)}
								<HeaderCell>Last Login</HeaderCell>
								<HeaderCell width='100px'>Actions</HeaderCell>
							</TableRow>
						</TableHeader>

						<TableBody>
							{filteredUsers.length > 0 ? (
								filteredUsers.map(user => (
									<TableRow key={user.id}>
										<TableCell>
											<CheckboxContainer>
												<Checkbox
													type='checkbox'
													checked={selectedUsers.includes(user.id)}
													onChange={() => handleSelectUser(user.id)}
												/>
											</CheckboxContainer>
										</TableCell>
										<TableCell>
											<UserCell>
												<UserInfo>
													<UserAvatar>
														{`${user.firstName} ${user.lastName}`
															.split(' ')
															.map((part: string) => part.charAt(0))
															.join('')
															.slice(0, 2) || ''}
													</UserAvatar>
													<UserDetails>
														<UserName>
															{user.firstName} {user.lastName}
														</UserName>
														<UserEmail>{user.email}</UserEmail>
													</UserDetails>
												</UserInfo>
											</UserCell>
										</TableCell>
										<TableCell>{user.email}</TableCell>
										<TableCell>
											<RoleBadge $role={user.role.toLowerCase()}>{user.role}</RoleBadge>
										</TableCell>
										<TableCell>
											<StatusIndicator $status={user.status}>
												{user.status === 'active' ? 'Active' : 'Inactive'}
											</StatusIndicator>
										</TableCell>
										{(activeRole === 'Student' || activeRole === 'Parent') && (
											<TableCell>
												{user.role === 'Parent' ? (
													<ChildrenList parentId={user.id} users={users} />
												) : user.parent_id || user.parentId ? (
													<div className='flex items-center text-sm'>
														<FiHome className='mr-1 text-green-500' size={14} />
														{(() => {
															const parentId = user.parent_id || user.parentId
															const parent = users.find(p => p.id === parentId)
															return parent
																? `${parent.firstName} ${parent.lastName}`
																: 'Unknown Parent'
														})()}
													</div>
												) : (
													<span className='text-gray-400'>None</span>
												)}
											</TableCell>
										)}
										<TableCell>{user.lastLogin || 'Never'}</TableCell>
										<TableCell>
											<ActionsContainer>
												<ActionIconButton onClick={() => handleEditUser(user)} title='Edit user'>
													<FiEdit2 />
												</ActionIconButton>
												<ActionIconButton
													onClick={() => handleDeleteClick(user.id)}
													title='Delete user'
												>
													<FiTrash2 />
												</ActionIconButton>
											</ActionsContainer>
										</TableCell>
									</TableRow>
								))
							) : (
								<EmptyRow>
									<EmptyCell colSpan={7}>
										<EmptyState>
											<EmptyIcon>
												<FiUser />
											</EmptyIcon>
											<EmptyTitle>No {activeRole.toLowerCase()}s found</EmptyTitle>
											<EmptyDescription>
												{searchTerm
													? `No ${activeRole.toLowerCase()}s match your search criteria.`
													: `There are no ${activeRole.toLowerCase()}s in the system yet.`}
											</EmptyDescription>
											<EmptyAction onClick={handleAddUser}>Add New {activeRole}</EmptyAction>
										</EmptyState>
									</EmptyCell>
								</EmptyRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{isFormOpen && (
				<UserForm
					isOpen={isFormOpen}
					onClose={handleFormClose}
					onSubmit={handleFormSubmit}
					initialData={currentUser || undefined}
					formTitle={currentUser ? 'Edit User' : 'Add New User'}
					currentUserRole={typeof user?.role === 'string' ? user?.role : user?.role?.name || ''}
					currentUserPermissions={user?.permissions || []}
				/>
			)}

			<DeleteConfirmationModal />
		</UsersContainer>
	)
}

// Add new styled components for role tabs
const RoleTabsContainer = styled.div`
	display: flex;
	gap: ${props => props.theme.spacing[2]};
	margin-bottom: ${props => props.theme.spacing[6]};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-wrap: wrap;
		gap: ${props => props.theme.spacing[1]};
	}
`

// Add the UsersContainer styled component first
const UsersContainer = styled.div`
	padding: ${props => props.theme.spacing[6]};
	max-width: 1200px;
	margin: 0 auto;

	@media (max-width: ${props => props.theme.breakpoints.lg}) {
		padding: ${props => props.theme.spacing[4]};
	}
`

interface RoleTabProps {
	$active: boolean
}

const RoleTab = styled.div<RoleTabProps>`
	display: flex;
	align-items: center;
	padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[4]};
	gap: ${props => props.theme.spacing[3]};
	cursor: pointer;
	border-bottom: 2px solid
		${props => (props.$active ? props.theme.colors.primary[500] : 'transparent')};
	color: ${props =>
		props.$active ? props.theme.colors.primary[500] : props.theme.colors.text.secondary};
	font-weight: ${props => (props.$active ? '600' : '500')};
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		color: ${props =>
			props.$active ? props.theme.colors.primary[500] : props.theme.colors.text.primary};
		border-bottom-color: ${props =>
			props.$active ? props.theme.colors.primary[500] : props.theme.colors.border.light};
	}
`

const RoleTabIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.2rem;
`

const RoleTabContent = styled.div`
	display: flex;
	flex-direction: column;
`

const RoleTabName = styled.span`
	font-size: 0.9rem;
`

const RoleTabCount = styled.span`
	font-size: 0.8rem;
	opacity: 0.7;
`

const LoadingState = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 300px;
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
`

// Add empty state components
const EmptyRow = styled.tr`
	height: 300px;
`

const EmptyCell = styled.td`
	text-align: center;
	vertical-align: middle;
`

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: ${props => props.theme.spacing[8]};
`

const EmptyIcon = styled.div`
	font-size: 3rem;
	color: ${props => props.theme.colors.text.tertiary};
	margin-bottom: ${props => props.theme.spacing[4]};
`

const EmptyTitle = styled.h3`
	margin: 0;
	margin-bottom: ${props => props.theme.spacing[2]};
	font-size: 1.2rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const EmptyDescription = styled.p`
	margin: 0;
	margin-bottom: ${props => props.theme.spacing[4]};
	color: ${props => props.theme.colors.text.secondary};
	max-width: 400px;
`

const EmptyAction = styled.button`
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	border: none;
	border-radius: ${props => props.theme.borderRadius.md};
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[4]}`};
	font-weight: 500;
	cursor: pointer;
	transition: background-color ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.primary[600]};
	}
`

// Additional styled components needed for the Users component
const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: ${props => props.theme.spacing[6]};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
		align-items: flex-start;
		gap: ${props => props.theme.spacing[4]};
	}
`

const PageTitle = styled.h1`
	margin: 0;
	font-size: 1.75rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const PageDescription = styled.p`
	margin: ${props => props.theme.spacing[1]} 0 0 0;
	color: ${props => props.theme.colors.text.secondary};
`

const AddUserButton = styled.button`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	border: none;
	border-radius: ${props => props.theme.borderRadius.md};
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[4]}`};
	font-weight: 500;
	cursor: pointer;
	transition: background-color ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.primary[600]};
	}

	svg {
		font-size: 1.2rem;
	}
`

const ToolbarContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: ${props => props.theme.spacing[4]};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
		align-items: stretch;
		gap: ${props => props.theme.spacing[3]};
	}
`

const SearchAndFilters = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[4]};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
		align-items: stretch;
		width: 100%;
	}
`

const SearchContainer = styled.div`
	position: relative;
	width: 100%;
	max-width: 400px;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		max-width: none;
	}
`

const SearchIcon = styled.div`
	position: absolute;
	top: 50%;
	left: ${props => props.theme.spacing[3]};
	transform: translateY(-50%);
	color: ${props => props.theme.colors.text.tertiary};
`

const SearchInput = styled.input`
	width: 100%;
	padding: ${props =>
		`${props.theme.spacing[2]} ${props.theme.spacing[2]} ${props.theme.spacing[2]} ${props.theme.spacing[8]}`};
	border-radius: ${props => props.theme.borderRadius.md};
	border: 1px solid ${props => props.theme.colors.border.light};
	background-color: ${props => props.theme.colors.background.secondary};
	color: ${props => props.theme.colors.text.primary};

	&::placeholder {
		color: ${props => props.theme.colors.text.tertiary};
	}

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[400]};
	}
`

const FiltersSection = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[3]};
`

const FilterLabel = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[1]};
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.9rem;
`

const FilterSelect = styled.select`
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[3]}`};
	border-radius: ${props => props.theme.borderRadius.md};
	border: 1px solid ${props => props.theme.colors.border.light};
	background-color: ${props => props.theme.colors.background.secondary};
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.9rem;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[400]};
	}
`

const ToolbarActions = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[3]};
	position: relative;
`

const SelectedCount = styled.span`
	color: ${props => props.theme.colors.text.primary};
	font-weight: 500;
	padding-right: ${props => props.theme.spacing[2]};
	border-right: 1px solid ${props => props.theme.colors.border.light};
`

const ActionsButton = styled.button`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	background-color: ${props => props.theme.colors.background.secondary};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[3]}`};
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.9rem;
	cursor: pointer;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
	}
`

const ActionsMenu = styled.div`
	position: absolute;
	top: 100%;
	right: 0;
	margin-top: ${props => props.theme.spacing[1]};
	background-color: ${props => props.theme.colors.background.primary};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	box-shadow: ${props => props.theme.shadows.md};
	z-index: 10;
	min-width: 150px;
`

interface ActionMenuItemProps {
	$danger?: boolean
}

const ActionMenuItem = styled.button<ActionMenuItemProps>`
	display: block;
	width: 100%;
	text-align: left;
	padding: ${props => `${props.theme.spacing[3]} ${props.theme.spacing[4]}`};
	border: none;
	background: none;
	color: ${props =>
		props.$danger ? props.theme.colors.danger[600] : props.theme.colors.text.primary};
	font-size: 0.9rem;
	cursor: pointer;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
	}

	&:not(:last-child) {
		border-bottom: 1px solid ${props => props.theme.colors.border.light};
	}
`

const ExportButton = styled.button`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	background-color: ${props => props.theme.colors.background.secondary};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[3]}`};
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.9rem;
	cursor: pointer;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
	}
`

const TableContainer = styled.div`
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.lg};
	box-shadow: ${props => props.theme.shadows.sm};
	overflow: hidden;
`

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
`

const TableHeader = styled.thead`
	background-color: ${props => props.theme.colors.background.tertiary};
`

const TableRow = styled.tr`
	border-bottom: 1px solid ${props => props.theme.colors.border.light};

	&:last-child {
		border-bottom: none;
	}
`

const HeaderCell = styled.th<{ width?: string }>`
	padding: ${props => props.theme.spacing[4]};
	text-align: left;
	font-weight: 600;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.9rem;
	width: ${props => props.width || 'auto'};
`

const TableBody = styled.tbody``

const TableCell = styled.td`
	padding: ${props => props.theme.spacing[4]};
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.9rem;
`

const CheckboxContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
`

const Checkbox = styled.input`
	width: 18px;
	height: 18px;
	cursor: pointer;
	accent-color: ${props => props.theme.colors.primary[500]};
`

const UserCell = styled.div`
	display: flex;
	align-items: center;
`

const UserInfo = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[3]};
`

const UserAvatar = styled.div`
	width: 40px;
	height: 40px;
	border-radius: ${props => props.theme.borderRadius.full};
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 0.9rem;
`

const UserDetails = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[1]};
`

const UserName = styled.div`
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const UserEmail = styled.div`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
`

interface RoleBadgeProps {
	$role: string
}

const RoleBadge = styled.div<RoleBadgeProps>`
	display: inline-flex;
	align-items: center;
	padding: ${props => `${props.theme.spacing[1]} ${props.theme.spacing[3]}`};
	border-radius: ${props => props.theme.borderRadius.full};
	font-size: 0.8rem;
	font-weight: 500;

	${props => {
		switch (props.$role) {
			case 'admin':
				return `
					background-color: ${props.theme.colors.purple[100]};
					color: ${props.theme.colors.purple[700]};
				`
			case 'teacher':
				return `
					background-color: ${props.theme.colors.primary[100]};
					color: ${props.theme.colors.primary[700]};
				`
			case 'student':
				return `
					background-color: ${props.theme.colors.success[100]};
					color: ${props.theme.colors.success[700]};
				`
			case 'parent':
				return `
					background-color: ${props.theme.colors.warning[100]};
					color: ${props.theme.colors.warning[700]};
				`
			default:
				return `
					background-color: ${props.theme.colors.neutral[100]};
					color: ${props.theme.colors.neutral[700]};
				`
		}
	}}
`

interface StatusIndicatorProps {
	$status: 'active' | 'inactive'
}

const StatusIndicator = styled.div<StatusIndicatorProps>`
	display: inline-flex;
	align-items: center;
	gap: ${props => props.theme.spacing[1]};

	&::before {
		content: '';
		display: block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: ${props =>
			props.$status === 'active'
				? props.theme.colors.success[500]
				: props.theme.colors.danger[500]};
	}

	font-size: 0.85rem;
	color: ${props =>
		props.$status === 'active' ? props.theme.colors.success[700] : props.theme.colors.danger[700]};
`

const ActionsContainer = styled.div`
	display: flex;
	gap: ${props => props.theme.spacing[2]};
`

const ActionIconButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: ${props => props.theme.borderRadius.md};
	border: none;
	background-color: transparent;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
		color: ${props => props.theme.colors.primary[500]};
	}

	&:active {
		background-color: ${props => props.theme.colors.background.tertiary};
	}
`

// Add styled components for the delete modal
const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(4px);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
`

const DeleteModal = styled.div`
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: ${props => props.theme.borderRadius.lg};
	box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
	width: 95%;
	max-width: 500px;
	overflow: hidden;
`

const DeleteModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: ${props => props.theme.spacing[5]};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const DeleteModalTitle = styled.h3`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const DeleteModalContent = styled.div`
	padding: ${props => props.theme.spacing[6]};
	display: flex;
	gap: ${props => props.theme.spacing[5]};
`

const DeleteWarningIcon = styled.div`
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background-color: ${props => `${props.theme.colors.danger[500]}20`};
	color: ${props => props.theme.colors.danger[500]};
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
`

const DeleteModalText = styled.div`
	flex: 1;
`

const DeleteTitle = styled.h4`
	margin: 0 0 ${props => props.theme.spacing[2]} 0;
	font-size: 1.1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const DeleteDescription = styled.p`
	margin: 0 0 ${props => props.theme.spacing[4]} 0;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.95rem;
	line-height: 1.5;
`

const DeleteError = styled.div`
	margin-top: ${props => props.theme.spacing[3]};
	padding: ${props => props.theme.spacing[3]};
	background-color: ${props => `${props.theme.colors.danger[500]}15`};
	border-left: 3px solid ${props => props.theme.colors.danger[500]};
	color: ${props => props.theme.colors.danger[700]};
	font-size: 0.9rem;
	border-radius: ${props => props.theme.borderRadius.sm};
`

const DeleteModalFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: ${props => props.theme.spacing[3]};
	padding: ${props => props.theme.spacing[4]} ${props => props.theme.spacing[5]};
	border-top: 1px solid ${props => props.theme.colors.border.light};
	background-color: ${props => props.theme.colors.background.secondary};
`

const CancelButton = styled.button`
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[4]}`};
	border-radius: ${props => props.theme.borderRadius.md};
	border: 1px solid ${props => props.theme.colors.border.light};
	background-color: transparent;
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.95rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
	}
`

const ConfirmDeleteButton = styled.button`
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[4]}`};
	border-radius: ${props => props.theme.borderRadius.md};
	border: none;
	background-color: ${props => props.theme.colors.danger[500]};
	color: white;
	font-size: 0.95rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: ${props => props.theme.colors.danger[600]};
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`

// Add CloseButton styled component with the other styled components
const CloseButton = styled.button`
	background: none;
	border: none;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 1.25rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: ${props => props.theme.borderRadius.full};
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
		color: ${props => props.theme.colors.text.primary};
	}
`

export default Users
