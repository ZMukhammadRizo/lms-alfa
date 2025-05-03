import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FiEdit2, FiLock, FiSearch, FiShield, FiTrash2 } from 'react-icons/fi'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import PermissionsModal from '../../components/admin/PermissionsModal'
import RoleForm from '../../components/admin/RoleForm'
import supabase from '../../config/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissionsStore } from '../../stores/permissionsStore'

// Role interface
interface Role {
	id: string
	name: string
	created_at: string | Date
	description: string
	role_permissions: Permission[]
	[key: string]: any
}

// Permission interface
interface Permission {
	id: string
	name: string
	description: string
}

const Roles: React.FC = () => {
	const permissionsInStore = usePermissionsStore(store => store.permissions)
	const fetchPermissions = usePermissionsStore(store => store.fetchPermissions)
	const { isRoleManager } = useAuth()
	// State for search, filters, and selected roles
	const [searchTerm, setSearchTerm] = useState('')
	// const [currentPage, setCurrentPage] = useState(1);
	const [selectedRoles, setSelectedRoles] = useState<string[]>([])
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [currentRole, setCurrentRole] = useState<Role | null>(null)
	const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false)
	const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false)

	const roleManager = JSON.parse(localStorage.getItem('lms_user') || '{}').isRoleManager

	// State for roles and permissions
	const [roles, setRoles] = useState<Role[]>([])
	const [permissions, setPermissions] = useState<Permission[]>([])

	// Filter roles based on search term
	const filteredRoles = roles.filter(role =>
		role.name.toLowerCase().includes(searchTerm.toLowerCase())
	)

	// Handle search input change
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	// Handle checkbox selection
	const handleSelectRole = (roleId: string) => {
		if (selectedRoles.includes(roleId)) {
			setSelectedRoles(selectedRoles.filter(id => id !== roleId))
		} else {
			setSelectedRoles([...selectedRoles, roleId])
		}
	}

	// Handle select all checkbox
	const handleSelectAll = () => {
		if (selectedRoles.length === filteredRoles.length) {
			setSelectedRoles([])
		} else {
			setSelectedRoles(filteredRoles.map(role => role.id))
		}
	}

	// Toggle actions menu
	const toggleActionsMenu = () => {
		setIsActionsMenuOpen(!isActionsMenuOpen)
	}

	// Open form to add a new role
	const handleAddRole = async () => {
		setCurrentRole(null)
		setIsFormOpen(true)
	}

	// Open form to edit an existing role
	const handleEditRole = (role: Role) => {
		setCurrentRole(role)
		setIsFormOpen(true)
	}

	// Handle delete role
	const handleDeleteRole = (roleId: string) => {
		// In a real application, this would send a delete request to the API
		// For now, we'll just update our local state
		setRoles(roles.filter(role => role.id !== roleId))
		setSelectedRoles(selectedRoles.filter(id => id !== roleId))
		console.log(`Delete role with ID: ${roleId}`)
	}

	// Open permissions modal for a role
	const handleManagePermissions = (role: Role) => {
		setCurrentRole(role)
		setIsPermissionsModalOpen(true)
	}

	// Handle form submission for role creation/update
	const handleFormSubmit = async (
		roleData: Omit<Role, 'id' | 'permissions' | 'usersCount' | 'createdAt'>
	) => {
		try {
			// Case 1: Create a new role when currentRole is null
			if (!currentRole) {
				// Insert the new role into the Supabase database
				const { data: newRole, error: createError } = await supabase
					.from('roles')
					.insert([
						{
							name: roleData.name,
							description: roleData.description,
						},
					])
					.select('id, name, description, created_at')
					.single()

				if (createError) {
					console.error('Error creating role:', createError)
					toast.error('Failed to create role. Please try again.')
					return
				}

				// Create an empty role_permissions array for the new role
				const updatedRole = {
					...newRole,
					role_permissions: [],
					usersCount: 0,
				}

				// Update the local state with the new role
				setRoles([updatedRole, ...roles])
				toast.success('Role created successfully!')
			}
			// Case 2: Update an existing role when currentRole is not null
			else {
				// Update the existing role in the Supabase database
				const { error: updateError } = await supabase
					.from('roles')
					.update({
						name: roleData.name,
						description: roleData.description,
					})
					.eq('id', currentRole.id)

				if (updateError) {
					console.error('Error updating role:', updateError)
					toast.error('Failed to update role. Please try again.')
					return
				}

				// Update the local state
				setRoles(
					roles.map(role =>
						role.id === currentRole.id
							? {
									...role,
									name: roleData.name,
									description: roleData.description,
							  }
							: role
					)
				)
				toast.success('Role updated successfully!')
			}

			// Close the form
			setIsFormOpen(false)
			setCurrentRole(null)
		} catch (error) {
			console.error('Error saving role:', error)
			toast.error('An unexpected error occurred. Please try again.')
		}
	}

	const handlePermissionsUpdate = async (roleId: string, permissionIds: string[]) => {
		try {
			// Get the read_roles permission ID
			const readRolesPermission = permissions.find(p => p.name === 'read_roles')

			// If user is role manager, ensure read_roles is always included
			if (roleManager && readRolesPermission) {
				if (!permissionIds.includes(readRolesPermission.id)) {
					permissionIds.push(readRolesPermission.id)
				}
			}

			// First, delete all existing permissions for this role
			const { error: deleteError } = await supabase
				.from('role_permissions')
				.delete()
				.eq('role_id', roleId)

			if (deleteError) {
				console.error('Error deleting existing permissions:', deleteError)
				toast.error('Failed to update permissions. Please try again.')
				return
			}

			// Then, insert the new permissions
			if (permissionIds.length > 0) {
				const newPermissions = permissionIds.map(permissionId => ({
					role_id: roleId,
					permission_id: permissionId,
				}))

				const { error: insertError } = await supabase
					.from('role_permissions')
					.insert(newPermissions)

				if (insertError) {
					console.error('Error inserting new permissions:', insertError)
					toast.error('Failed to update permissions. Please try again.')
					return
				}
			}

			// Update the local state
			setRoles(
				roles.map(role =>
					role.id === roleId
						? {
								...role,
								role_permissions: permissions.filter(p => permissionIds.includes(p.id)),
						  }
						: role
				)
			)

			// Show success message and close modal
			toast.success('Permissions updated successfully!')
			setIsPermissionsModalOpen(false)

			console.log(`Successfully updated permissions for role ${roleId}:`, permissionIds)
		} catch (error) {
			console.error('Error updating permissions:', error)
			toast.error('An unexpected error occurred. Please try again.')
		}
	}

	const handleFormClose = () => {
		setIsFormOpen(false)
		setCurrentRole(null)
	}

	const handlePermissionsModalClose = () => {
		setIsPermissionsModalOpen(false)
		setCurrentRole(null)
	}

	// Handle bulk delete of selected roles
	const handleBulkDelete = () => {
		setRoles(roles.filter(role => !selectedRoles.includes(role.id)))
		setSelectedRoles([])
		setIsActionsMenuOpen(false)
		console.log('Bulk deleting roles:', selectedRoles)
	}

	const fetchRolesWithPermissions = async () => {
		const { data: roles, error } = await supabase
			.from('roles')
			.select(
				`
      id,
      name,
      created_at,
      role_permissions (
        permission_id,
        permissions (
          id,
          name
        )
      )
    `
			)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Error fetching roles:', error)
			return null
		}

		// Get user counts for each role using role_id
		const userCounts = await Promise.all(
			roles.map(async role => {
				const { count, error: userCountsError } = await supabase
					.from('users')
					.select('*', { count: 'exact' })
					.eq('role_id', role.id)

				if (userCountsError) {
					console.error('Error fetching user count:', userCountsError)
					return 0
				}

				return count || 0
			})
		)

		const cleanedRoles = roles.map((role, index) => ({
			...role,
			role_permissions: role.role_permissions.map(rp => rp.permissions),
			usersCount: userCounts[index],
		}))

		setRoles(cleanedRoles as any)
	}

	// Fetch all permissions
	const fetchAllPermissions = async () => {
		try {
			await fetchPermissions()
			setPermissions(permissionsInStore)
		} catch (error) {
			console.error('Error fetching permissions:', error)
		}
	}
	useEffect(() => {
		fetchRolesWithPermissions()
		fetchAllPermissions()
	}, [])

	return (
		<RolesContainer
			as={motion.div}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			{/* Header Section */}
			<PageHeader>
				<div>
					<PageTitle>Role Management</PageTitle>
					<PageDescription>Manage roles and their associated permissions</PageDescription>
				</div>
			</PageHeader>

			{/* Create Section */}
			{roleManager && (
				<CreateSection>
					<SectionTitle>Create New Role</SectionTitle>
					<AddRoleButton onClick={handleAddRole}>
						<FiShield />
						<span>Add New Role</span>
					</AddRoleButton>
				</CreateSection>
			)}

			{/* Read Section */}
			<ReadSection>
				<SectionTitle>View Roles</SectionTitle>
				<SearchAndFilters>
					<SearchContainer>
						<SearchIcon>
							<FiSearch />
						</SearchIcon>
						<SearchInput
							placeholder='Search roles...'
							value={searchTerm}
							onChange={handleSearchChange}
						/>
					</SearchContainer>
				</SearchAndFilters>

				<RolesTable>
					<TableHeader>
						<HeaderRow>
							<HeaderCell width='10%'>
								<CheckboxContainer>
									<Checkbox
										type='checkbox'
										checked={
											selectedRoles.length === filteredRoles.length && filteredRoles.length > 0
										}
										onChange={handleSelectAll}
									/>
								</CheckboxContainer>
							</HeaderCell>
							<HeaderCell width='20%'>Role Name</HeaderCell>
							<HeaderCell width='30%'>Description</HeaderCell>
							<HeaderCell width='30%'>Users</HeaderCell>

							{roleManager && <HeaderCell width='100%'>Actions</HeaderCell>}
						</HeaderRow>
					</TableHeader>
					<TableBody>
						{filteredRoles.length > 0 ? (
							filteredRoles.map(role => (
								<TableRow key={role.id}>
									<TableCell width='10%'>
										<CheckboxContainer>
											<Checkbox
												type='checkbox'
												checked={selectedRoles.includes(role.id)}
												onChange={() => handleSelectRole(role.id)}
											/>
										</CheckboxContainer>
									</TableCell>
									<TableCell width='20%'>
										<RoleName>{role.name}</RoleName>
									</TableCell>
									<TableCell width='30%'>{role.description}</TableCell>
									<TableCell width='30%'>
										<UsersCount>{role.usersCount} users</UsersCount>
									</TableCell>
									{roleManager && (
										<TableCell width='100%'>
											<ActionsContainer>
												<ActionIconButton onClick={() => handleEditRole(role)} title='Edit role'>
													<FiEdit2 />
												</ActionIconButton>
												<ActionIconButton
													onClick={() => handleDeleteRole(role.id)}
													title='Delete role'
												>
													<FiTrash2 />
												</ActionIconButton>
												<ActionIconButton
													onClick={() => handleManagePermissions(role)}
													title='Manage permissions'
												>
													<FiLock />
												</ActionIconButton>
											</ActionsContainer>
										</TableCell>
									)}
								</TableRow>
							))
						) : (
							<EmptyStateRow>
								<EmptyStateCell colSpan={6}>
									<EmptyStateMessage>
										No roles found matching your search criteria.
									</EmptyStateMessage>
								</EmptyStateCell>
							</EmptyStateRow>
						)}
					</TableBody>
				</RolesTable>
			</ReadSection>

			{/* Modals */}
			<RoleForm
				isOpen={isFormOpen}
				onClose={handleFormClose}
				onSubmit={handleFormSubmit}
				initialData={currentRole || undefined}
				formTitle={currentRole ? 'Edit Role' : 'Add New Role'}
			/>

			{currentRole && (
				<PermissionsModal
					isOpen={isPermissionsModalOpen}
					onClose={handlePermissionsModalClose}
					role={currentRole}
					allPermissions={permissionsInStore}
					onSave={handlePermissionsUpdate}
				/>
			)}
		</RolesContainer>
	)
}

// Styled Components
const RolesContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[6]};
`

const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
		align-items: flex-start;
		gap: ${props => props.theme.spacing[4]};
	}
`

const PageTitle = styled.h1`
	margin: 0;
	margin-bottom: ${props => props.theme.spacing[1]};
	color: ${props => props.theme.colors.text.primary};
	font-size: 1.8rem;
`

const PageDescription = styled.p`
	margin: 0;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 1rem;
`

const AddRoleButton = styled.button`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	border: none;
	border-radius: ${props => props.theme.borderRadius.md};
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[4]}`};
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.primary[700]};
	}

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		width: 100%;
		justify-content: center;
	}
`

const ToolbarContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;

	@media (max-width: ${props => props.theme.breakpoints.lg}) {
		flex-direction: column;
		align-items: stretch;
		gap: ${props => props.theme.spacing[4]};
	}
`

const SearchAndFilters = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[4]};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
		align-items: stretch;
		gap: ${props => props.theme.spacing[3]};
		width: 100%;
	}
`

const SearchContainer = styled.div`
	position: relative;
	width: 300px;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		width: 100%;
	}
`

const SearchIcon = styled.div`
	position: absolute;
	left: 12px;
	top: 50%;
	transform: translateY(-50%);
	color: ${props => props.theme.colors.text.secondary};
`

const SearchInput = styled.input`
	width: 100%;
	padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[2]}
		${props => props.theme.spacing[2]} ${props => props.theme.spacing[8]};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 0.9rem;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[400]};
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`

const ActionsContainer = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	position: relative;
`

const SelectedCount = styled.div`
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-right: ${props => props.theme.spacing[2]};
`

const ActionButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: ${props => props.theme.colors.background.light};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	padding: ${props => props.theme.spacing[2]};
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.background.lighter};
		color: ${props => props.theme.colors.text.primary};
	}
`

const ActionsMenu = styled.div`
	position: absolute;
	top: 100%;
	right: 0;
	margin-top: ${props => props.theme.spacing[1]};
	background-color: white;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	box-shadow: ${props => props.theme.shadows.md};
	z-index: 10;
	min-width: 160px;
`

const ActionMenuItem = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[3]}`};
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.background.lighter};
		color: ${props => props.theme.colors.text.primary};
	}
`

const RolesTable = styled.div`
	width: 100%;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	overflow: hidden;
`

interface HeaderCellProps {
	width?: string
}

const TableHeader = styled.div`
	background-color: ${props => props.theme.colors.background.lighter};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const HeaderRow = styled.div`
	display: flex;
	align-items: center;
	padding: ${props => `${props.theme.spacing[3]} ${props.theme.spacing[4]}`};
`

const HeaderCell = styled.div<HeaderCellProps>`
	flex: ${props => (props.width ? 'none' : '1')};
	align-items: start;
	width: ${props => props.width || 'auto'};
	font-weight: 600;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.9rem;
`

const TableBody = styled.div``

const TableRow = styled.div`
	display: flex;
	align-items: center;
	padding: ${props => `${props.theme.spacing[3]} ${props.theme.spacing[4]}`};
	border-bottom: 1px solid ${props => props.theme.colors.border.lighter};
	transition: all ${props => props.theme.transition.fast};

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}
`

const TableCell = styled.div<HeaderCellProps>`
	flex: ${props => (props.width ? 'none' : '1')};
	width: ${props => props.width || 'auto'};
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.9rem;
`

const EmptyStateRow = styled.div`
	padding: ${props => `${props.theme.spacing[6]} ${props.theme.spacing[4]}`};
`

interface EmptyStateCellProps {
	colSpan?: number
}

const EmptyStateCell = styled.div<EmptyStateCellProps>`
	text-align: center;
`

const EmptyStateMessage = styled.div`
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.9rem;
`

const CheckboxContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
`

const Checkbox = styled.input`
	cursor: pointer;
`

const RoleName = styled.div`
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const PermissionsPreview = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
`

const PermissionCount = styled.div`
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};
`

const ViewPermissionsButton = styled.button`
	font-size: 0.8rem;
	padding: ${props => `${props.theme.spacing[1]} ${props.theme.spacing[2]}`};
	background-color: ${props => props.theme.colors.primary[50]};
	color: ${props => props.theme.colors.primary[600]};
	border: none;
	border-radius: ${props => props.theme.borderRadius.sm};
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.primary[100]};
	}
`

const UsersCount = styled.div`
	font-size: 0.85rem;
`

const ActionIconButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	background: none;
	border: none;
	width: 32px;
	height: 32px;
	border-radius: ${props => props.theme.borderRadius.full};
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.background.lighter};
		color: ${props => props.theme.colors.primary[600]};
	}
`

const Pagination = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
		align-items: stretch;
		gap: ${props => props.theme.spacing[3]};
	}
`

const PageInfo = styled.div`
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};
`

const PageButtons = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[1]};
`

interface PageButtonProps {
	$isActive: boolean
}

const PageButton = styled.button<PageButtonProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 36px;
	height: 36px;
	padding: 0 ${props => props.theme.spacing[2]};
	background-color: ${props => (props.$isActive ? props.theme.colors.primary[500] : 'transparent')};
	color: ${props => (props.$isActive ? 'white' : props.theme.colors.text.primary)};
	border: 1px solid ${props => (props.$isActive ? 'transparent' : props.theme.colors.neutral[300])};
	border-radius: 4px;
	font-size: 0.95rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props =>
			props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.background.hover};
		border-color: ${props => (props.$isActive ? 'transparent' : props.theme.colors.neutral[400])};
	}

	&:focus {
		outline: none;
	}
`

const SectionTitle = styled.h2`
	font-size: 1.2rem;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: ${props => props.theme.spacing[4]};
`

const CreateSection = styled.section`
	background-color: ${props => props.theme.colors.background.light};
	padding: ${props => props.theme.spacing[4]};
	border-radius: ${props => props.theme.borderRadius.md};
	margin-bottom: ${props => props.theme.spacing[6]};
`

const ReadSection = styled.section`
	background-color: ${props => props.theme.colors.background.light};
	padding: ${props => props.theme.spacing[4]};
	border-radius: ${props => props.theme.borderRadius.md};
	margin-bottom: ${props => props.theme.spacing[6]};
`

const UpdateSection = styled.section`
	background-color: ${props => props.theme.colors.background.light};
	padding: ${props => props.theme.spacing[4]};
	border-radius: ${props => props.theme.borderRadius.md};
	margin-bottom: ${props => props.theme.spacing[6]};
`

const DeleteSection = styled.section`
	background-color: ${props => props.theme.colors.background.light};
	padding: ${props => props.theme.spacing[4]};
	border-radius: ${props => props.theme.borderRadius.md};
	margin-bottom: ${props => props.theme.spacing[6]};
`

const UpdateActions = styled.div`
	display: flex;
	gap: ${props => props.theme.spacing[3]};
	margin-top: ${props => props.theme.spacing[4]};
`

const DeleteActions = styled.div`
	display: flex;
	gap: ${props => props.theme.spacing[3]};
	margin-top: ${props => props.theme.spacing[4]};
`

const DeleteButton = styled.button`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	background-color: ${props => props.theme.colors?.danger[500] ?? ''};
	color: white;
	border: none;
	border-radius: ${props => props.theme.borderRadius.md};
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[4]}`};
	font-size: 0.9rem;
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.danger[600]};
	}

	&:disabled {
		background-color: ${props => props.theme.colors.danger[300]};
		cursor: not-allowed;
	}
`

export default Roles
