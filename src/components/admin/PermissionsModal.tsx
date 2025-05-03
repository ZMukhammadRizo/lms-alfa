import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FiCheck, FiSearch, FiShield, FiX } from 'react-icons/fi'
import styled from 'styled-components'
import { useAuth } from '../../contexts/AuthContext'

// Permission interface
interface Permission {
	id: string
	name: string
	description: string
}

// Role interface
interface Role {
	id: string
	name: string
	description: string
	role_permissions: Permission[]
}

interface PermissionsModalProps {
	isOpen: boolean
	onClose: () => void
	role: Role
	allPermissions: Permission[]
	onSave: (roleId: string, permissionIds: string[]) => void
}

// Helper function to extract operation type from permission name
const extractOperationType = (permissionName: string): string => {
	const parts = permissionName.split('_')
	return parts[0] || 'other' // Get the first part as operation type
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({
	isOpen,
	onClose,
	allPermissions,
	onSave,
	role,
}) => {
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const { isRoleManager } = useAuth()

	// Initialize selected permissions with current role permissions
	useEffect(() => {
		if (role && role.role_permissions) {
			// Get the IDs of the current role's permissions
			const currentRolePermissionIds = role.role_permissions.map(p => p.id)
			setSelectedPermissions(currentRolePermissionIds)
		}
	}, [role])

	// Group permissions by operation type
	const groupedPermissions = allPermissions.reduce((groups, permission) => {
		const operation = extractOperationType(permission.name)
		if (!groups[operation]) {
			groups[operation] = []
		}
		groups[operation].push(permission)
		return groups
	}, {} as Record<string, Permission[]>)

	// Define the order of operations
	const operationOrder = ['create', 'read', 'update', 'delete']
	const operations = operationOrder.filter(op => groupedPermissions[op]?.length > 0)

	// Helper function to check if a permission is selected
	const isPermissionSelected = (permissionId: string): boolean => {
		return selectedPermissions.includes(permissionId)
	}

	// Helper function to check if all permissions in an operation are selected
	const isOperationFullySelected = (operation: string): boolean => {
		const operationPermissions = groupedPermissions[operation] || []
		return (
			operationPermissions.length > 0 && operationPermissions.every(p => isPermissionSelected(p.id))
		)
	}

	// Handle permission selection
	const handlePermissionToggle = (permissionId: string) => {
		setSelectedPermissions(prev => {
			if (prev.includes(permissionId)) {
				return prev.filter(id => id !== permissionId)
			} else {
				return [...prev, permissionId]
			}
		})
	}

	// Handle select all for an operation
	const handleSelectOperation = (operation: string) => {
		const operationPermissions = groupedPermissions[operation] || []
		const operationPermissionIds = operationPermissions.map(p => p.id)
		const allSelected = isOperationFullySelected(operation)

		setSelectedPermissions(prev => {
			if (allSelected) {
				// Remove all permissions in this operation
				return prev.filter(id => !operationPermissionIds.includes(id))
			} else {
				// Add all permissions in this operation
				const newSelected = new Set([...prev, ...operationPermissionIds])
				return Array.from(newSelected)
			}
		})
	}

	// Early return if modal is not open
	if (!isOpen) return null

	return (
		<ModalOverlay
			as={motion.div}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
		>
			<ModalContent
				as={motion.div}
				initial={{ opacity: 0, y: 50 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 50 }}
			>
				<ModalHeader>
					<div>
						<ModalTitle>Manage Permissions</ModalTitle>
						<ModalSubtitle>Role: {role.name}</ModalSubtitle>
					</div>
					<CloseButton onClick={onClose}>
						<FiX />
					</CloseButton>
				</ModalHeader>

				<ModalToolbar>
					<SearchContainer>
						<SearchIcon>
							<FiSearch />
						</SearchIcon>
						<SearchInput
							placeholder='Search permissions...'
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
						/>
					</SearchContainer>
				</ModalToolbar>

				<PermissionsList>
					{operations.map(operation => (
						<PermissionCategory key={operation}>
							<CategoryHeader>
								<CategoryName>
									<FiShield />
									{operation.toUpperCase()}
								</CategoryName>
								<CategorySelectButton onClick={() => handleSelectOperation(operation)}>
									{isOperationFullySelected(operation) ? 'Deselect All' : 'Select All'}
								</CategorySelectButton>
							</CategoryHeader>
							<PermissionItems>
								{groupedPermissions[operation].map(permission => (
									<PermissionItem key={permission.id}>
										<PermissionCheckbox>
											{isRoleManager() &&
											permission.name === 'read_roles' &&
											role.name === 'Admin' ? (
												<Checkbox
													type='checkbox'
													checked={true}
													disabled
													onChange={() => handlePermissionToggle(permission.id)}
												/>
											) : (
												<Checkbox
													type='checkbox'
													checked={isPermissionSelected(permission.id)}
													onChange={() => handlePermissionToggle(permission.id)}
												/>
											)}
										</PermissionCheckbox>
										<PermissionInfo>
											<PermissionName>{permission.name}</PermissionName>
											<small>
												{isRoleManager() &&
												permission.name === 'read_roles' &&
												role.name === 'Admin'
													? "You can't change that permission"
													: ''}
											</small>
											<PermissionDescription>{permission.description}</PermissionDescription>
										</PermissionInfo>
									</PermissionItem>
								))}
							</PermissionItems>
						</PermissionCategory>
					))}
				</PermissionsList>

				<ModalFooter>
					<CancelButton onClick={onClose}>Cancel</CancelButton>
					<SaveButton onClick={() => onSave(role.id, selectedPermissions)}>
						<FiCheck />
						<span>Save Permissions</span>
					</SaveButton>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	)
}

// Styled Components
const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
`

const ModalContent = styled.div`
	background-color: white;
	border-radius: ${props => props.theme.borderRadius.lg};
	width: 90%;
	max-width: 800px;
	max-height: 90vh;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	box-shadow: ${props => props.theme.shadows.xl};
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: ${props => props.theme.spacing[4]};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const ModalTitle = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	color: ${props => props.theme.colors.text.primary};
`

const ModalSubtitle = styled.p`
	margin: ${props => props.theme.spacing[1]} 0 0 0;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.9rem;
`

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	cursor: pointer;
	color: ${props => props.theme.colors.text.secondary};
	display: flex;
	align-items: center;
	justify-content: center;
	padding: ${props => props.theme.spacing[1]};
	border-radius: ${props => props.theme.borderRadius.full};
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.background.lighter};
		color: ${props => props.theme.colors.text.primary};
	}
`

const ModalToolbar = styled.div`
	padding: ${props => props.theme.spacing[4]};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	display: flex;
	gap: ${props => props.theme.spacing[4]};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
		gap: ${props => props.theme.spacing[3]};
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

const PermissionsList = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: ${props => props.theme.spacing[4]};
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[4]};
`

const PermissionCategory = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[3]};
`

const CategoryHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`

const CategoryName = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	font-size: 1rem;

	svg {
		color: ${props => props.theme.colors.primary[500]};
	}
`

const CategorySelectButton = styled.button`
	background: none;
	border: none;
	font-size: 0.8rem;
	color: ${props => props.theme.colors.primary[600]};
	cursor: pointer;
	padding: ${props => props.theme.spacing[1]} ${props => props.theme.spacing[2]};
	border-radius: ${props => props.theme.borderRadius.sm};
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.primary[50]};
	}
`

const PermissionItems = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[2]};
	padding-left: ${props => props.theme.spacing[1]};
`

const PermissionItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: ${props => props.theme.spacing[3]};
	padding: ${props => props.theme.spacing[2]};
	border-radius: ${props => props.theme.borderRadius.md};
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.background.lighter};
	}
`

const PermissionCheckbox = styled.div`
	padding-top: 2px;
`

const Checkbox = styled.input`
	cursor: pointer;
`

const PermissionInfo = styled.div`
	flex: 1;
`

const PermissionName = styled.div`
	font-size: 0.9rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: ${props => props.theme.spacing[1]};
`

const PermissionDescription = styled.div`
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};
`

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: ${props => props.theme.spacing[3]};
	padding: ${props => props.theme.spacing[8]} 0;
	color: ${props => props.theme.colors.text.secondary};

	svg {
		font-size: 2rem;
	}
`

const EmptyStateText = styled.div`
	font-size: 0.9rem;
`

const ModalFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	align-items: center;
	gap: ${props => props.theme.spacing[3]};
	padding: ${props => props.theme.spacing[4]};
	border-top: 1px solid ${props => props.theme.colors.border.light};
`

const CancelButton = styled.button`
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[4]}`};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	background-color: white;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.9rem;
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.background.lighter};
		color: ${props => props.theme.colors.text.primary};
	}
`

const SaveButton = styled.button`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[4]}`};
	border: none;
	border-radius: ${props => props.theme.borderRadius.md};
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	font-size: 0.9rem;
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.primary[700]};
	}
`

export default PermissionsModal
