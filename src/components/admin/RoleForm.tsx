import { motion } from 'framer-motion'
import React, { useEffect, useMemo, useState } from 'react'
import { FiCheck, FiInfo, FiSearch, FiX } from 'react-icons/fi'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import supabase from '../../config/supabaseClient'
import { usePermissionsStore } from '../../stores/permissionsStore'

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
	permissions?: string[]
}

// Step types
type FormStep = 'create' | 'permissions'

interface RoleFormProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (roleData: Omit<Role, 'id'>) => void
	initialData?: Role
	formTitle: string
	step?: FormStep // Add step prop
	onStepChange?: (step: FormStep) => void // Add step change handler
}

const RoleForm: React.FC<RoleFormProps> = ({
	isOpen,
	onClose,
	onSubmit,
	initialData,
	formTitle,
	step = 'create', // Default to create step
	onStepChange,
}) => {
	const { permissions: permissionsInStore, fetchPermissions } = usePermissionsStore()
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)

	const [formData, setFormData] = useState({
		name: '',
		description: '',
	})

	const [errors, setErrors] = useState({
		name: '',
		description: '',
	})

	// Initialize form data when editing an existing role
	useEffect(() => {
		if (initialData) {
			setFormData({
				name: initialData.name,
				description: initialData.description,
			})
		} else {
			setFormData({
				name: '',
				description: '',
			})
		}
		setErrors({
			name: '',
			description: '',
		})
	}, [initialData, isOpen])

	// Filter permissions based on search term
	const filteredPermissions = useMemo(() => {
		return permissionsInStore.filter(permission =>
			permission.name.toLowerCase().includes(searchTerm.toLowerCase())
		)
	}, [permissionsInStore, searchTerm])

	// Handle input changes
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value,
		}))

		// Clear error when user types
		if (errors[name as keyof typeof errors]) {
			setErrors(prev => ({
				...prev,
				[name]: '',
			}))
		}
	}

	useEffect(() => {
		console.log(selectedPermissions)
	}, [selectedPermissions])

	// Handle permission selection
	const handlePermissionSelect = (permissionId: string) => {
		setSelectedPermissions(prev =>
			prev.includes(permissionId) ? prev.filter(id => id !== permissionId) : [...prev, permissionId]
		)
	}

	// Validate form
	const validateForm = () => {
		let isValid = true
		const newErrors = { ...errors }

		if (!formData.name.trim()) {
			newErrors.name = 'Role name is required'
			isValid = false
		}

		setErrors(newErrors)
		return isValid
	}

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!validateForm()) return

		try {
			// 1. Create or update the role
			let roleId: string
			if (initialData) {
				// Update existing role
				const { error: updateError } = await supabase
					.from('roles')
					.update({
						name: formData.name,
						description: formData.description,
					})
					.eq('id', initialData.id)

				if (updateError) throw updateError
				roleId = initialData.id
			} else {
				// Create new role with explicit fields
				const roleData = {
					name: formData.name,
					description: formData.description,
				}

				const { data: newRole, error: createError } = await supabase
					.from('roles')
					.insert(roleData)
					.select('id')
					.single()

				if (createError) {
					console.error('Create role error:', createError)
					throw createError
				}
				roleId = newRole.id
			}

			// 2. Delete existing permissions if updating
			if (initialData) {
				const { error: deleteError } = await supabase
					.from('role_permissions')
					.delete()
					.eq('role_id', roleId)

				if (deleteError) throw deleteError
			}

			// 3. Add new permissions
			if (selectedPermissions.length > 0) {
				const permissionData = selectedPermissions.map(permissionId => ({
					role_id: roleId,
					permission_id: permissionId,
				}))

				const { error: insertError } = await supabase
					.from('role_permissions')
					.insert(permissionData)

				if (insertError) {
					console.error('Insert permissions error:', insertError)
					throw insertError
				}
			}

			// 4. Show success message and close form
			toast.success(initialData ? 'Role updated successfully' : 'Role created successfully')
			onSubmit({
				name: formData.name,
				description: formData.description,
				permissions: selectedPermissions,
			})
			setFormData({ name: '', description: '' })
			setSelectedPermissions([])
			onClose()
		} catch (error) {
			console.error('Error saving role:', error)
			toast.error('Failed to save role. Please try again.')
		}
	}

	// Handle step changes
	const handleNextStep = async () => {
		const { data: newRole, error: createError } = await supabase
			.from('roles')
			.insert([
				{
					name: formData.name,
					description: formData.description,
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

		// fetch all roles
		const { data: roles, error: rolesError } = await supabase.from('roles').select('*')
		if (rolesError) {
			console.error('Error fetching roles:', rolesError)
			toast.error('Failed to fetch roles. Please try again.')
			return
		}

		// close modal
		onClose()
		toast.success('Role created successfully!')
	}

	const handlePreviousStep = () => {
		if (step === 'permissions' && onStepChange) {
			onStepChange('create')
		}
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
					<ModalTitle>{formTitle}</ModalTitle>
					<CloseButton onClick={onClose}>
						<FiX />
					</CloseButton>
				</ModalHeader>

				<form onSubmit={handleSubmit}>
					<ModalBody>
						{step === 'create' ? (
							<>
								<FormGroup>
									<Label htmlFor='name'>Role Name</Label>
									<Input
										type='text'
										id='name'
										name='name'
										value={formData.name}
										onChange={handleInputChange}
										$hasError={!!errors.name}
										placeholder='e.g., Teacher Admin, Content Manager'
									/>
									{errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
								</FormGroup>

								<FormGroup>
									<Label htmlFor='description'>Description</Label>
									<TextArea
										required={false}
										id='description'
										name='description'
										value={formData.description}
										onChange={handleInputChange}
										$hasError={!!errors.description}
										placeholder='Briefly describe what this role can do'
										rows={4}
									/>
									{errors.description && <ErrorMessage>{errors.description}</ErrorMessage>}
								</FormGroup>
							</>
						) : (
							<FormGroup>
								<Label>Permissions</Label>
								<DropdownContainer>
									<DropdownButton type='button' onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
										{selectedPermissions.length > 0
											? `${selectedPermissions.length} permissions selected`
											: 'Select permissions'}
									</DropdownButton>

									{isDropdownOpen && (
										<DropdownMenu>
											<SearchContainer>
												<SearchIcon>
													<FiSearch />
												</SearchIcon>
												<SearchInput
													type='text'
													placeholder='Search permissions...'
													value={searchTerm}
													onChange={e => setSearchTerm(e.target.value)}
												/>
											</SearchContainer>

											{permissionsInStore.length === 0 ? (
												<EmptyState>
													<p>No permissions available</p>
													<FetchButton onClick={fetchPermissions}>Fetch Permissions</FetchButton>
												</EmptyState>
											) : (
												<PermissionList>
													{filteredPermissions.map(permission => (
														<PermissionItem
															key={permission.id}
															onClick={() => handlePermissionSelect(permission.id)}
														>
															<Checkbox>
																{selectedPermissions.includes(permission.id) && <FiCheck />}
															</Checkbox>
															<PermissionName>{permission.name}</PermissionName>
														</PermissionItem>
													))}
												</PermissionList>
											)}
										</DropdownMenu>
									)}
								</DropdownContainer>
							</FormGroup>
						)}

						<InfoBox>
							<FiInfo />
							<InfoText>
								{step === 'create'
									? 'After creating the role, you can assign specific permissions.'
									: 'Select the permissions you want to assign to this role.'}
							</InfoText>
						</InfoBox>
					</ModalBody>

					<ModalFooter>
						{step === 'permissions' && (
							<BackButton type='button' onClick={handlePreviousStep}>
								Back
							</BackButton>
						)}
						<CancelButton type='button' onClick={onClose}>
							Cancel
						</CancelButton>
						{step === 'create' ? (
							<NextButton type='button' onClick={handleNextStep}>
								Next
							</NextButton>
						) : (
							<SubmitButton type='submit'>
								{initialData ? 'Update Role' : 'Create Role'}
							</SubmitButton>
						)}
					</ModalFooter>
				</form>
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
	max-width: 500px;
	overflow: hidden;
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

const ModalBody = styled.div`
	padding: ${props => props.theme.spacing[4]};
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[4]};
`

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[1]};
`

const Label = styled.label`
	font-size: 0.9rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

interface InputProps {
	$hasError?: boolean
}

const Input = styled.input<InputProps>`
	padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
	border: 1px solid
		${props => (props.$hasError ? props.theme.colors.danger[500] : props.theme.colors.border.light)};
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 0.9rem;
	background-color: ${props => (props.$hasError ? props.theme.colors.danger[50] : 'white')};

	&:focus {
		outline: none;
		border-color: ${props =>
			props.$hasError ? props.theme.colors.danger[500] : props.theme.colors.primary[400]};
		box-shadow: 0 0 0 3px
			${props => (props.$hasError ? 'rgba(244, 63, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)')};
	}
`

const TextArea = styled.textarea<InputProps>`
	padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
	border: 1px solid
		${props => (props.$hasError ? props.theme.colors.danger[500] : props.theme.colors.border.light)};
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 0.9rem;
	resize: vertical;
	font-family: inherit;
	background-color: ${props => (props.$hasError ? props.theme.colors.danger[50] : 'white')};

	&:focus {
		outline: none;
		border-color: ${props =>
			props.$hasError ? props.theme.colors.danger[500] : props.theme.colors.primary[400]};
		box-shadow: 0 0 0 3px
			${props => (props.$hasError ? 'rgba(244, 63, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)')};
	}
`

const ErrorMessage = styled.div`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.danger[500]};
	margin-top: ${props => props.theme.spacing[1]};
`

const InfoBox = styled.div`
	display: flex;
	align-items: flex-start;
	gap: ${props => props.theme.spacing[2]};
	padding: ${props => props.theme.spacing[3]};
	background-color: ${props => props.theme.colors.primary[50]};
	border-radius: ${props => props.theme.borderRadius.md};
	border-left: 4px solid ${props => props.theme.colors.primary[500]};

	svg {
		color: ${props => props.theme.colors.primary[500]};
		margin-top: 2px;
	}
`

const InfoText = styled.p`
	margin: 0;
	font-size: 0.85rem;
	color: ${props => props.theme.colors.primary[700]};
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

const SubmitButton = styled.button`
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[4]}`};
	border: none;
	border-radius: ${props => props.theme.borderRadius.md};
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.primary[700]};
	}
`

// New styled components
const DropdownContainer = styled.div`
	position: relative;
	width: 100%;
`

const DropdownButton = styled.button`
	width: 100%;
	padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	background-color: white;
	text-align: left;
	cursor: pointer;
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.primary};

	&:hover {
		border-color: ${props => props.theme.colors.primary[400]};
	}
`

const DropdownMenu = styled.div`
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	margin-top: ${props => props.theme.spacing[1]};
	background-color: white;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	box-shadow: ${props => props.theme.shadows.md};
	z-index: 10;
	max-height: 300px;
	overflow-y: auto;
`

const SearchContainer = styled.div`
	position: relative;
	padding: ${props => props.theme.spacing[2]};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const SearchIcon = styled.div`
	position: absolute;
	left: ${props => props.theme.spacing[3]};
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
	}
`

const PermissionList = styled.div`
	padding: ${props => props.theme.spacing[1]};
`

const PermissionItem = styled.div`
	display: flex;
	align-items: center;
	padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
	cursor: pointer;
	border-radius: ${props => props.theme.borderRadius.md};

	&:hover {
		background-color: ${props => props.theme.colors.background.lighter};
	}
`

const Checkbox = styled.div`
	width: 20px;
	height: 20px;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.sm};
	margin-right: ${props => props.theme.spacing[2]};
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${props => props.theme.colors.primary[600]};
`

const PermissionName = styled.span`
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.primary};
`

const EmptyState = styled.div`
	padding: ${props => props.theme.spacing[4]};
	text-align: center;
	color: ${props => props.theme.colors.text.secondary};
`

const FetchButton = styled.button`
	margin-top: ${props => props.theme.spacing[2]};
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[4]}`};
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	border: none;
	border-radius: ${props => props.theme.borderRadius.md};
	cursor: pointer;
	font-size: 0.9rem;

	&:hover {
		background-color: ${props => props.theme.colors.primary[700]};
	}
`

const BackButton = styled.button`
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

const NextButton = styled.button`
	padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[4]}`};
	border: none;
	border-radius: ${props => props.theme.borderRadius.md};
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.primary[700]};
	}
`

export default RoleForm
