import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import {
	FiCalendar,
	FiCheck,
	FiLock,
	FiMail,
	FiShield,
	FiUser,
	FiUserPlus,
	FiUsers,
	FiX,
	FiSearch,
} from 'react-icons/fi'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import supabase, { supabaseAdmin } from '../../config/supabaseClient'
import { canCreateUserWithRole } from '../../utils/permissions'

// User interface matching the one in Users.tsx
interface User {
	id: string
	firstName: string
	lastName: string
	email: string
	role: string
	status: 'active' | 'inactive'
	lastLogin: string
	createdAt: string
	name?: string // Optional string property
	parent_id?: string // ID of parent user if this user is a child
	childrenIds?: string[] // For parent-child relationships
	password?: string // Password for new user creation
	birthday?: string // Date of birth
}

interface UserFormProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (user: Partial<User>) => void
	initialData?: Partial<User>
	formTitle: string
	currentUserRole?: string
	currentUserPermissions?: string[]
}

const UserForm: React.FC<UserFormProps> = ({
	isOpen,
	onClose,
	onSubmit,
	initialData,
	formTitle,
	currentUserRole = '',
	currentUserPermissions = [],
}) => {
	// Form state
	const [formData, setFormData] = useState<Partial<User>>({
		firstName: '',
		lastName: '',
		email: '',
		role: 'Student',
		status: 'active',
		birthday: '',
	})

	// States for parent-child relationship
	const [selectedChildren, setSelectedChildren] = useState<string[]>([])
	const [availableStudents, setAvailableStudents] = useState<User[]>([])
	const [isLoadingStudents, setIsLoadingStudents] = useState(false)
	const [childSearchTerm, setChildSearchTerm] = useState('') // New state for child search

	// State for all available roles
	const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string }[]>([])
	const [isLoadingRoles, setIsLoadingRoles] = useState(false)

	// Validation state
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Function to check database schema more directly
	const checkDatabaseSchema = async () => {
		try {
			console.log('Checking database schema directly...')

			// Try to get the structure of the public schema
			const { data: authData } = await supabaseAdmin.auth.getSession()
			console.log('Current auth session:', authData)

			// Try to get information about the 'users' table directly
			try {
				const { data, error } = await supabaseAdmin.from('users').select('*').limit(1)

				if (error) {
					console.error('Error querying users table:', error)
				} else {
					console.log('Successfully queried users table:', data)
					if (data.length > 0) {
						console.log('Users table schema:', Object.keys(data[0]))
						return Object.keys(data[0])
					} else {
						console.log('Users table exists but is empty')
						return []
					}
				}
			} catch (err) {
				console.error('Error checking users table:', err)
			}

			// Check if a 'public.users' table exists
			try {
				const { data, error } = await supabaseAdmin.rpc('execute_sql', {
					sql: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')",
				})

				if (!error && data) {
					console.log('Check for users table result:', data)
				}
			} catch (err) {
				console.error('Error checking table existence:', err)
			}
		} catch (err) {
			console.error('Failed to check schema:', err)
		}
		return []
	}

	// Function to check available tables and their structure more thoroughly
	const checkDatabaseTables = async () => {
		try {
			console.log('Checking database structure thoroughly...')

			// First, try to get schema information using postgres_meta function if available
			// try {
			//   const { data: tablesData, error: tablesError } = await supabaseAdmin.rpc('get_database_tables');
			//
			//   if (!tablesError && tablesData) {
			//     console.log("Available tables from metadata function:", tablesData);
			//     return tablesData;
			//   }
			// } catch (err) {
			//   console.log("Metadata function not available, using fallback methods");
			// }

			// Check potential user tables directly and record their schema
			const potentialTables = ['users', 'auth.users', 'public.users']
			const tableInfo: Record<
				string,
				{
					exists: boolean
					schema?: string[]
					isEmpty?: boolean
					error?: string
				}
			> = {}

			for (const table of potentialTables) {
				try {
					const { data, error } = await supabaseAdmin
						.from(table.replace(/^(public|auth)\./, ''))
						.select('*')
						.limit(1)

					if (!error && data) {
						console.log(
							`Table '${table}' exists and has schema:`,
							data.length > 0 ? Object.keys(data[0]) : 'No records'
						)
						tableInfo[table] = {
							exists: true,
							schema: data.length > 0 ? Object.keys(data[0]) : [],
							isEmpty: data.length === 0,
						}
					} else {
						console.log(`Table '${table}' does not exist or is not accessible`, error)
						tableInfo[table] = { exists: false, error: error?.message }
					}
				} catch (err: any) {
					// Type assertion for error
					console.error(`Error checking table '${table}':`, err)
					tableInfo[table] = { exists: false, error: err?.message || 'Unknown error' }
				}
			}

			console.log('Database tables scan complete:', tableInfo)

			// Check RLS policies that might block us
			try {
				const { data: userData, error: userError } = await supabase.auth.getUser()

				if (!userError && userData) {
					console.log('Current user for RLS context:', userData)
				}
			} catch (err) {
				console.error('Error checking current user context:', err)
			}

			return tableInfo
		} catch (err) {
			console.error('Failed to check database structure:', err)
			return {}
		}
	}

	// Function to ensure necessary tables exist
	const ensureTablesExist = async () => {
		try {
			console.log('Checking if necessary tables exist and creating them if needed...')

			// First, get the database structure
			const tableInfo = await checkDatabaseTables()

			// Check if 'users' table exists
			const hasUsersTable = tableInfo['users']?.exists || tableInfo['public.users']?.exists

			// If we need to create tables, use admin client
			if (!hasUsersTable) {
				console.log("Users table doesn't exist. Attempting to create one...")

				try {
					// Try to create a users table directly with SQL
					const { error: sqlError } = await supabaseAdmin.rpc('execute_sql', {
						sql: `
            CREATE TABLE IF NOT EXISTS public.users (
              id UUID PRIMARY KEY REFERENCES auth.users(id),
              email TEXT NOT NULL,
              first_name TEXT,
              last_name TEXT,
              name TEXT,
              role TEXT DEFAULT 'Student',
              status TEXT DEFAULT 'active',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "Users are viewable by everyone"
              ON public.users
              FOR SELECT USING (true);

            CREATE POLICY "Users can update their own data"
              ON public.users
              FOR UPDATE USING (auth.uid() = id);
            `,
					})

					if (sqlError) {
						console.error('Error creating users table via SQL:', sqlError)
					} else {
						console.log('Successfully created users table')
					}
				} catch (err) {
					console.error('Error creating necessary tables:', err)
				}
			} else {
				console.log('Required table already exists:', { hasUsersTable })
			}
		} catch (err) {
			console.error('Error in ensureTablesExist:', err)
		}
	}

	// Call these functions once when the form opens
	useEffect(() => {
		if (isOpen) {
			checkDatabaseSchema()
			checkDatabaseTables()
			ensureTablesExist()
		}
	}, [isOpen])

	// Initialize form with data if editing
	useEffect(() => {
		if (initialData) {
			console.log('Initializing form with data:', initialData)

			// Handle existing data which might still have "name" instead of first/last name
			if (initialData.name && (!initialData.firstName || !initialData.lastName)) {
				const nameParts = (initialData.name as string).split(' ')
				const firstName = nameParts[0] || ''
				const lastName = nameParts.slice(1).join(' ') || ''

				setFormData({
					...initialData,
					firstName,
					lastName,
					// Format the birthday for the date input if it exists
					birthday: initialData.birthday ? new Date(initialData.birthday).toISOString().split('T')[0] : '',
				})
			} else {
				setFormData({
					...initialData,
					// Format the birthday for the date input if it exists
					birthday: initialData.birthday ? new Date(initialData.birthday).toISOString().split('T')[0] : '',
				})
			}

			// Initialize selected children if this is a parent user with childrenIds
			if (initialData.role === 'Parent' && initialData.childrenIds) {
				setSelectedChildren(initialData.childrenIds as string[])
			}
		} else {
			// Reset form data when creating a new user
			setFormData({
				firstName: '',
				lastName: '',
				email: '',
				role: 'Student',
				status: 'active',
				birthday: '',
			})
			// Reset selected children
			setSelectedChildren([])
		}
	}, [initialData])

	// Fetch all students who don't have a parent assigned
	const fetchAvailableStudents = async () => {
		setIsLoadingStudents(true)
		try {
			// Fetch all students
			const { data, error } = await supabase.from('users').select('*').eq('role', 'Student')

			if (error) {
				console.error('Error fetching students:', error)
				return
			}

			// Format the data to match our User interface
			const formattedStudents = data.map(student => ({
				id: student.id,
				firstName: student.firstName || student.first_name || '',
				lastName: student.lastName || student.last_name || '',
				email: student.email || '',
				role: 'Student',
				status: student.status || 'active',
				lastLogin: student.lastLogin || student.last_login || '',
				createdAt: student.createdAt || student.createdAt || '',
				parent_id: student.parent_id,
			}))

			console.log('Available students:', formattedStudents)
			setAvailableStudents(formattedStudents)
		} catch (err) {
			console.error('Error in fetchAvailableStudents:', err)
		} finally {
			setIsLoadingStudents(false)
		}
	}

	// When the role changes to Parent, fetch available students
	useEffect(() => {
		if (formData.role === 'Parent') {
			fetchAvailableStudents()
		}
	}, [formData.role])

	// Filter and sort children based on search term and selection status
	const filteredAndSortedChildren = React.useMemo(() => {
		// First filter by search term
		const filtered = availableStudents.filter(student => {
			const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
			const email = student.email.toLowerCase()
			const search = childSearchTerm.toLowerCase()
			
			return fullName.includes(search) || email.includes(search)
		})

		// Then sort: selected children first, then alphabetically by name
		return filtered.sort((a, b) => {
			const aSelected = selectedChildren.includes(a.id)
			const bSelected = selectedChildren.includes(b.id)
			
			// If one is selected and the other isn't, the selected one comes first
			if (aSelected && !bSelected) return -1
			if (!aSelected && bSelected) return 1
			
			// If both are selected or both are unselected, sort alphabetically
			const aName = `${a.firstName} ${a.lastName}`.toLowerCase()
			const bName = `${b.firstName} ${b.lastName}`.toLowerCase()
			return aName.localeCompare(bName)
		})
	}, [availableStudents, selectedChildren, childSearchTerm])
      
	// Fetch all roles from Supabase
	const fetchAllRoles = async () => {
		setIsLoadingRoles(true)
		try {
			const { data, error } = await supabase.from('roles').select('id, name').order('name')

			if (error) {
				console.error('Error fetching roles:', error)
				toast.error('Failed to fetch roles')
				return
			}

			setAvailableRoles(data || [])
		} catch (err) {
			console.error('Unexpected error fetching roles:', err)
			toast.error('Failed to fetch roles')
		} finally {
			setIsLoadingRoles(false)
		}
	}

	// Fetch roles when form opens
	useEffect(() => {
		if (isOpen) {
			fetchAllRoles()
		}
	}, [isOpen])

	// Handle input changes
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target

		// If trying to change role to Parent but no permission
		if (name === 'role' && value === 'Parent') {
			const hasPermission = canCreateUserWithRole({
				currentUserRole,
				currentUserPermissions,
				newUserRole: 'Parent',
			})

			if (!hasPermission) {
				toast.error('You do not have permission to create Parent users.')
				return
			}
		}

		// Reset selected children if role changes from Parent
		if (name === 'role' && value !== 'Parent') {
			setSelectedChildren([])
		}

		setFormData({
			...formData,
			[name]: value,
		})

		// Clear any error for this field
		if (errors[name]) {
			setErrors({
				...errors,
				[name]: '',
			})
		}
	}

	// Form validation
	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {}

		// Validate required fields
		if (!formData.firstName?.trim()) {
			newErrors.firstName = 'First name is required'
		}

		if (!formData.lastName?.trim()) {
			newErrors.lastName = 'Last name is required'
		}

		if (!formData.email?.trim()) {
			newErrors.email = 'Email is required'
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Email is invalid'
		}

		if (!formData.role) {
			newErrors.role = 'Role is required'
		}

		if (!formData.status) {
			newErrors.status = 'Status is required'
		}
			
		// Add validation for parent-child relationship
		if (formData.role === 'Parent' && selectedChildren.length === 0) {
			newErrors.children = 'Please select at least one child'
		}

		// Validate birthday if provided
		if (formData.birthday) {
			const birthdayDate = new Date(formData.birthday)
			const today = new Date()
			
			// Check if birthday is in the future
			if (birthdayDate > today) {
				newErrors.birthday = 'Date of birth cannot be in the future'
			}
			
			// Check if person is too old (over 120 years)
			const maxAge = new Date()
			maxAge.setFullYear(today.getFullYear() - 120)
			if (birthdayDate < maxAge) {
				newErrors.birthday = 'Please enter a valid date of birth'
			}
		}

		// Check if we already have submission errors related to email
		if (errors.submit?.includes('Email address')) {
			newErrors.email = 'This email is already registered'
		}

		// Validate password for new user
		if (!initialData?.id && !formData.password?.trim()) {
			newErrors.password = 'Password is required for new users'
		} else if (formData.password && formData.password.length < 8) {
			newErrors.password = 'Password must be at least 8 characters'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) {
			// Scroll to the first error for better UX
			const firstErrorElement = document.querySelector('.error-message')
			if (firstErrorElement) {
				firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
			}
			return
		}

		setIsSubmitting(true)
		// Clear any previous submission errors
		setErrors(prev => ({ ...prev, submit: '' }))

		try {
			// First submit the user data normally
			const userData: Partial<User> = { ...formData }

			// When creating/updating a user who is a parent, include the selected children
			if (formData.role === 'Parent') {
				userData.childrenIds = selectedChildren
			}

			// For new users, set default password
			if (!initialData?.id) {
				userData.password = '12345678' // Set default password
				toast.info('New user will be created with default password: 12345678')
			}

			// Submit the updated user data
			await onSubmit(userData)

			// Close the form on success
			onClose()
		} catch (error: any) {
			console.error('Error submitting form:', error)
			setErrors({
				...errors,
				submit: error.message || 'Failed to save user data',
			})

			// Scroll to the error message
			setTimeout(() => {
				const errorElement = document.querySelector('.form-error')
				if (errorElement) {
					errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
				}
			}, 100)
		} finally {
			setIsSubmitting(false)
		}
	}

	// Function to assign children to a parent
	const assignChildrenToParent = async (parentId: string, childrenIds: string[]) => {
		try {
			console.log('Assigning children to parent:', { parentId, childrenIds })

			// First, fetch all children currently assigned to this parent
			const { data: currentChildren, error: fetchError } = await supabase
				.from('users')
				.select('id')
				.eq('parent_id', parentId)

			if (fetchError) {
				console.error('Error fetching current children:', fetchError)
				throw fetchError
			}

			// Extract IDs of current children
			const currentChildrenIds = currentChildren?.map(child => child.id) || []

			// Find children to remove (those in currentChildrenIds but not in new childrenIds)
			const childrenToRemove = currentChildrenIds.filter(id => !childrenIds.includes(id))

			// Find children to add (those in new childrenIds but not already assigned)
			const childrenToAdd = childrenIds.filter(id => !currentChildrenIds.includes(id))

			// Create a batch of promises to update all changes at once
			const updatePromises = []

			// Remove parent_id from children that should no longer be assigned to this parent
			if (childrenToRemove.length > 0) {
				const removePromise = supabase
					.from('users')
					.update({ parent_id: null })
					.in('id', childrenToRemove)
				updatePromises.push(removePromise)
			}

			// Assign parent_id to new children
			if (childrenToAdd.length > 0) {
				const addPromise = supabase
				.from('users')
				.update({ parent_id: parentId })
					.in('id', childrenToAdd)
				updatePromises.push(addPromise)
			}

			// Execute all updates
			const results = await Promise.all(updatePromises)
			
			// Check for errors
			for (const result of results) {
				if (result.error) {
					console.error('Error updating parent-child relationships:', result.error)
					throw result.error
				}
			}

			console.log('Successfully updated parent-child relationships')
			return results
		} catch (err) {
			console.error('Error in assignChildrenToParent:', err)
			throw err
		}
	}

	// Check if user has permission to create a parent user
	const canCreateParent = () => {
		return canCreateUserWithRole({
			currentUserRole,
			currentUserPermissions,
			newUserRole: 'Parent',
		})
	}

	// Check if user has permission to create a user with a specific role
	const canCreateUserWithSpecificRole = (roleName: string) => {
		return canCreateUserWithRole({
			currentUserRole,
			currentUserPermissions,
			newUserRole: roleName,
		})
	}

	if (!isOpen) return null

	return (
		<ModalOverlay
			as={motion.div}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onClose}
		>
			<ModalContent
				as={motion.div}
				initial={{ scale: 0.9, y: 50, opacity: 0 }}
				animate={{ scale: 1, y: 0, opacity: 1 }}
				exit={{ scale: 0.9, y: 50, opacity: 0 }}
				transition={{ type: 'spring', damping: 25 }}
				onClick={e => e.stopPropagation()}
			>
				<ModalHeader>
					<ModalTitleContainer>
						<ModalIcon>
							<FiUserPlus />
						</ModalIcon>
						<div>
							<ModalTitle>{formTitle}</ModalTitle>
							<ModalSubtitle>
								{initialData?.id ? 'Update user information' : 'Create a new user account'}
							</ModalSubtitle>
						</div>
					</ModalTitleContainer>
					<CloseButton onClick={onClose}>
						<FiX />
					</CloseButton>
				</ModalHeader>

				<FormDivider />

				<form onSubmit={handleSubmit}>
					{errors.submit && (
						<FormErrorContainer className='form-error'>
							<FormErrorIcon>⚠️</FormErrorIcon>
							<FormErrorMessage>
								{errors.submit.includes('Email address') ? (
									<>
										<strong>Email Already Registered:</strong> {errors.submit}
									</>
								) : (
									errors.submit
								)}
							</FormErrorMessage>
						</FormErrorContainer>
					)}

					<FormSection>
						<SectionTitle>Personal Information</SectionTitle>
						<FormGrid>
							<FormGroup>
								<FormLabel htmlFor='firstName'>
									<FiUser />
									<span>First Name</span>
								</FormLabel>
								<FormInput
									id='firstName'
									name='firstName'
									value={formData.firstName || ''}
									onChange={handleChange}
									placeholder='Enter first name'
									$hasError={!!errors.firstName}
								/>
								{errors.firstName && <ErrorMessage>{errors.firstName}</ErrorMessage>}
							</FormGroup>

							<FormGroup>
								<FormLabel htmlFor='lastName'>
									<FiUser />
									<span>Last Name</span>
								</FormLabel>
								<FormInput
									id='lastName'
									name='lastName'
									value={formData.lastName || ''}
									onChange={handleChange}
									placeholder='Enter last name'
									$hasError={!!errors.lastName}
								/>
								{errors.lastName && <ErrorMessage>{errors.lastName}</ErrorMessage>}
							</FormGroup>

							<FormGroup>
								<FormLabel htmlFor='email'>
									<FiMail />
									<span>Email Address</span>
								</FormLabel>
								<FormInput
									id='email'
									name='email'
									type='email'
									value={formData.email || ''}
									onChange={e => {
										// Clear duplicate email errors when user types
										if (errors.submit?.includes('Email address')) {
											setErrors(prev => ({ ...prev, submit: '' }))
										}
										handleChange(e)
									}}
									placeholder='Enter email address'
									$hasError={!!errors.email || errors.submit?.includes('Email address')}
								/>
								{errors.email && (
									<ErrorMessage>
										{errors.email.includes('already registered') ? (
											<>
												<strong>Duplicate:</strong> {errors.email}
											</>
										) : (
											errors.email
										)}
									</ErrorMessage>
								)}
							</FormGroup>

							<FormGroup>
								<FormLabel htmlFor='birthday'>
									<FiCalendar />
									<span>Date of Birth</span>
								</FormLabel>
								<FormInput
									id='birthday'
									name='birthday'
									type='date'
									value={formData.birthday || ''}
									onChange={handleChange}
									$hasError={!!errors.birthday}
								/>
								{errors.birthday && <ErrorMessage>{errors.birthday}</ErrorMessage>}
							</FormGroup>

							<FormGroup>
								<FormLabel htmlFor='role'>
									<FiShield />
									<span>Role</span>
								</FormLabel>
								<FormSelect
									id='role'
									name='role'
									value={formData.role || ''}
									onChange={handleChange}
									$hasError={!!errors.role}
									disabled={isLoadingRoles}
								>
									<option value=''>Select a role</option>
									{isLoadingRoles ? (
										<option value='' disabled>
											Loading roles...
										</option>
									) : (
										availableRoles
											.filter(role => role.name !== 'SuperAdmin')
											.map(role => (
												<option
													key={role.id}
													value={role.name}
													disabled={!canCreateUserWithSpecificRole(role.name)}
												>
													{role.name}{' '}
													{!canCreateUserWithSpecificRole(role.name) && '(No Permission)'}
												</option>
											))
									)}
								</FormSelect>
								{errors.role && <ErrorMessage>{errors.role}</ErrorMessage>}
							</FormGroup>
						</FormGrid>
					</FormSection>

					{!initialData?.id && (
						<FormSection>
							<SectionTitle>Security</SectionTitle>
							<FormGrid>
								<FormNote>
									New users will be created with the default password: <strong>12345678</strong>
								</FormNote>
							</FormGrid>
						</FormSection>
					)}

					<FormSection>
						<SectionTitle>Account Status</SectionTitle>
						<FormGrid>
							<FormGroup>
								<FormLabel htmlFor='status'>
									<FiCalendar />
									<span>Status</span>
								</FormLabel>
								<StatusOptions>
									<StatusOption
										$isActive={formData.status === 'active'}
										$status='active'
										onClick={() => {
											setFormData(prev => ({ ...prev, status: 'active' }))
											// Manually trigger any validation
											if (errors.status) {
												setErrors(prev => {
													const newErrors = { ...prev }
													delete newErrors.status
													return newErrors
												})
											}
										}}
									>
										<StatusRadio
											id='statusActive'
											name='status'
											value='active'
											checked={formData.status === 'active'}
											onChange={handleChange}
											aria-labelledby='statusActiveLabelText'
										/>
										<StatusCheck $isActive={formData.status === 'active'}>
											<FiCheck />
										</StatusCheck>
										<StatusLabel htmlFor='statusActive' id='statusActiveLabelText'>
											Active
										</StatusLabel>
									</StatusOption>

									<StatusOption
										$isActive={formData.status === 'inactive'}
										$status='inactive'
										onClick={() => {
											setFormData(prev => ({ ...prev, status: 'inactive' }))
											// Manually trigger any validation
											if (errors.status) {
												setErrors(prev => {
													const newErrors = { ...prev }
													delete newErrors.status
													return newErrors
												})
											}
										}}
									>
										<StatusRadio
											id='statusInactive'
											name='status'
											value='inactive'
											checked={formData.status === 'inactive'}
											onChange={handleChange}
											aria-labelledby='statusInactiveLabelText'
										/>
										<StatusCheck $isActive={formData.status === 'inactive'}>
											<FiCheck />
										</StatusCheck>
										<StatusLabel htmlFor='statusInactive' id='statusInactiveLabelText'>
											Inactive
										</StatusLabel>
									</StatusOption>
								</StatusOptions>
								{errors.status && <ErrorMessage>{errors.status}</ErrorMessage>}
							</FormGroup>
						</FormGrid>
					</FormSection>

					{/* Child selection field - only show when Parent role is selected */}
					{formData.role === 'Parent' && (
						<FormSection>
							<SectionTitle>Children</SectionTitle>
							<FormGroup>
								<FormLabel htmlFor='children'>
									<FiUsers />
									<span>Select Children</span>
								</FormLabel>

								{/* Search bar for children */}
								<ChildSearchContainer>
									<SearchIcon>
										<FiSearch />
									</SearchIcon>
									<SearchInput
										placeholder="Search children by name or email..."
										value={childSearchTerm}
										onChange={(e) => setChildSearchTerm(e.target.value)}
									/>
									{childSearchTerm && (
										<ClearSearchButton onClick={() => setChildSearchTerm('')}>
											<FiX />
										</ClearSearchButton>
									)}
								</ChildSearchContainer>

								{isLoadingStudents ? (
									<LoadingIndicator>Loading students...</LoadingIndicator>
								) : filteredAndSortedChildren.length > 0 ? (
									<>
										<ChildrenSelectionContainer>
											{filteredAndSortedChildren.map(student => (
												<ChildCard
													key={student.id}
													$isSelected={selectedChildren.includes(student.id)}
													onClick={() => {
														if (selectedChildren.includes(student.id)) {
															setSelectedChildren(selectedChildren.filter(id => id !== student.id))
														} else {
															setSelectedChildren([...selectedChildren, student.id])
														}
													}}
												>
													<ChildCheckbox $isSelected={selectedChildren.includes(student.id)}>
														{selectedChildren.includes(student.id) && <FiCheck />}
													</ChildCheckbox>
													<ChildInfo>
														<ChildName>
															{student.firstName} {student.lastName}
														</ChildName>
														<ChildEmail>{student.email}</ChildEmail>
													</ChildInfo>
												</ChildCard>
											))}
										</ChildrenSelectionContainer>
										<SelectionSummary>
											{selectedChildren.length === 0 ? (
												<span>No children selected</span>
											) : (
												<span>
													Selected: <strong>{selectedChildren.length}</strong>{' '}
													{selectedChildren.length === 1 ? 'child' : 'children'}
												</span>
											)}
										</SelectionSummary>
									</>
								) : childSearchTerm ? (
									<EmptyChildrenMessage>No students match your search</EmptyChildrenMessage>
								) : (
									<EmptyChildrenMessage>No students available for selection</EmptyChildrenMessage>
								)}
								{errors.children && <ErrorMessage>{errors.children}</ErrorMessage>}
							</FormGroup>
						</FormSection>
					)}

					<FormDivider />

					<ButtonGroup>
						<CancelButton type='button' onClick={onClose}>
							Cancel
						</CancelButton>
						<SubmitButton type='submit' disabled={isSubmitting}>
							{isSubmitting ? 'Saving...' : initialData?.id ? 'Update User' : 'Create User'}
						</SubmitButton>
					</ButtonGroup>
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
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.7);
	backdrop-filter: blur(4px);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
	padding: ${props => props.theme.spacing[4]};
`

const ModalContent = styled.div`
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: ${props => props.theme.borderRadius.lg};
	box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
	width: 100%;
	max-width: 700px;
	max-height: 90vh;
	overflow-y: auto;
	padding: ${props => props.theme.spacing[6]};
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: ${props => props.theme.spacing[4]};
`

const ModalTitleContainer = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[3]};
`

const ModalIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border-radius: ${props => props.theme.borderRadius.full};
	background-color: ${props => `${props.theme.colors.primary[500]}15`};
	color: ${props => props.theme.colors.primary[600]};
	font-size: 1.5rem;
	box-shadow: 0 0 0 6px ${props => `${props.theme.colors.primary[500]}05`};
`

const ModalTitle = styled.h2`
	margin: 0;
	color: ${props => props.theme.colors.text.primary};
	font-size: 1.5rem;
	font-weight: 600;
	line-height: 1.2;
`

const ModalSubtitle = styled.p`
	margin: ${props => props.theme.spacing[1]} 0 0 0;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.9rem;
	opacity: 0.9;
`

const FormDivider = styled.div`
	height: 1px;
	background-color: ${props => `${props.theme.colors.border}80`};
	margin: ${props => props.theme.spacing[5]} 0;
	opacity: 0.8;
`

const FormSection = styled.div`
	margin-bottom: ${props => props.theme.spacing[6]};
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.lg};
	padding: ${props => props.theme.spacing[5]};
`

const SectionTitle = styled.h3`
	font-size: 1.05rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0 0 ${props => props.theme.spacing[4]} 0;
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};

	&::before {
		content: '';
		display: block;
		width: 3px;
		height: 18px;
		background-color: ${props => props.theme.colors.primary[500]};
		border-radius: ${props => props.theme.borderRadius.full};
	}
`

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

const FormGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: ${props => props.theme.spacing[6]};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		grid-template-columns: 1fr;
	}
`

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[2]};
	margin-bottom: ${props => props.theme.spacing[1]};
`

const FormLabel = styled.label`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.9rem;
	font-weight: 500;
	margin-bottom: ${props => props.theme.spacing[1]};

	svg {
		color: ${props => props.theme.colors.primary[400]};
		font-size: 1rem;
	}
`

interface FormInputProps {
	$hasError?: boolean
}

const FormInput = styled.input<FormInputProps>`
	padding: ${props => `${props.theme.spacing[3]} ${props.theme.spacing[4]}`};
	border: 1px solid
		${props => (props.$hasError ? props.theme.colors.accent.red : props.theme.colors.neutral[300])};
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 0.95rem;
	background-color: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.text.primary};
	transition: all 0.2s ease;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
	height: 44px;
	width: 100%;

	&:focus {
		outline: none;
		border-color: ${props =>
			props.$hasError ? props.theme.colors.accent.red : props.theme.colors.primary[400]};
		box-shadow: ${props =>
			props.$hasError ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 0 0 3px rgba(99, 102, 241, 0.15)'};
		transform: translateY(-1px);
	}

	&:hover:not(:focus) {
		border-color: ${props =>
			props.$hasError ? props.theme.colors.accent.red : props.theme.colors.primary[200]};
	}

	&::placeholder {
		color: ${props => props.theme.colors.text.tertiary};
		opacity: 0.7;
	}
`

const FormSelect = styled.select<FormInputProps>`
	padding: ${props => `${props.theme.spacing[3]} ${props.theme.spacing[4]}`};
	border: 1px solid
		${props => (props.$hasError ? props.theme.colors.accent.red : props.theme.colors.neutral[300])};
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 0.95rem;
	background-color: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.text.primary};
	transition: all 0.2s ease;
	appearance: none;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
	background-repeat: no-repeat;
	background-position: right 12px center;
	background-size: 16px;
	padding-right: 40px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
	height: 44px;
	width: 100%;
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: ${props =>
			props.$hasError ? props.theme.colors.accent.red : props.theme.colors.primary[400]};
		box-shadow: ${props =>
			props.$hasError ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 0 0 3px rgba(99, 102, 241, 0.15)'};
		transform: translateY(-1px);
	}

	&:hover:not(:focus) {
		border-color: ${props =>
			props.$hasError ? props.theme.colors.accent.red : props.theme.colors.primary[200]};
	}
`

const StatusOptions = styled.div`
	display: flex;
	gap: ${props => props.theme.spacing[3]};
	margin-top: ${props => props.theme.spacing[1]};

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		flex-direction: column;
		width: 100%;
	}
`

interface StatusOptionProps {
	$isActive: boolean
	$status: 'active' | 'inactive'
}

const StatusOption = styled.div<StatusOptionProps>`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[3]};
	padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[4]};
	border-radius: ${props => props.theme.borderRadius.md};
	border: 2px solid
		${props =>
			props.$isActive
				? props.$status === 'active'
					? props.theme.colors.success[500]
					: props.theme.colors.warning[500]
				: props.theme.colors.neutral[300]};
	background-color: ${props =>
		props.$isActive
			? props.$status === 'active'
				? props.theme.colors.success[50]
				: props.theme.colors.warning[50]
			: 'transparent'};
	box-shadow: ${props => (props.$isActive ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none')};
	cursor: pointer;
	transition: all 0.2s ease;
	flex: 1;
	min-width: 150px;
	position: relative;
	user-select: none;

	&:hover {
		background-color: ${props => {
			if (props.$isActive) {
				return props.$status === 'active'
					? props.theme.colors.success[100]
					: props.theme.colors.warning[100]
			}
			return props.theme.colors.background.tertiary
		}};
		border-color: ${props => {
			if (props.$isActive) {
				return props.$status === 'active'
					? props.theme.colors.success[600]
					: props.theme.colors.warning[600]
			}
			return props.theme.colors.primary[200]
		}};
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
		box-shadow: none;
	}
`

const StatusRadio = styled.input.attrs({ type: 'radio' })`
	position: absolute;
	opacity: 0;
	width: 100%;
	height: 100%;
	cursor: pointer;
	z-index: 1;
	top: 0;
	left: 0;
	margin: 0;
	padding: 0;
`

interface StatusCheckProps {
	$isActive: boolean
}

const StatusCheck = styled.div<StatusCheckProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	border-radius: ${props => props.theme.borderRadius.full};
	border: 2px solid
		${props =>
			props.$isActive ? props.theme.colors.primary[500] : props.theme.colors.text.tertiary};
	color: white;
	background-color: ${props => (props.$isActive ? props.theme.colors.primary[500] : 'transparent')};
	transition: all ${props => props.theme.transition.fast};
	flex-shrink: 0;

	svg {
		opacity: ${props => (props.$isActive ? 1 : 0)};
		font-size: 14px;
		transition: all ${props => props.theme.transition.fast};
	}
`

const StatusLabel = styled.label`
	font-size: 0.95rem;
	font-weight: 500;
	cursor: pointer;
	color: ${props => props.theme.colors.text.primary};
	transition: color ${props => props.theme.transition.fast};

	&:hover {
		color: ${props => props.theme.colors.primary[600]};
	}
`

const ErrorMessage = styled.div.attrs(() => ({
	className: 'error-message',
}))`
	color: ${props => props.theme.colors.accent.red};
	font-size: 0.8rem;
	margin-top: ${props => props.theme.spacing[1]};
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[1]};

	&::before {
		content: '⚠';
		font-size: 0.8rem;
	}
`

const ButtonGroup = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: ${props => props.theme.spacing[3]};
	margin-top: ${props => props.theme.spacing[6]};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
	}
`

const CancelButton = styled.button`
	padding: ${props => `${props.theme.spacing[3]} ${props.theme.spacing[5]}`};
	background-color: transparent;
	color: ${props => props.theme.colors.text.primary};
	border: 1px solid ${props => props.theme.colors.border};
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 0.95rem;
	font-weight: 500;
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};
	min-width: 120px;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
		border-color: ${props => props.theme.colors.neutral[400]};
	}

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		order: 2;
	}
`

const SubmitButton = styled.button`
	padding: ${props => `${props.theme.spacing[3]} ${props.theme.spacing[5]}`};
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	border: none;
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 0.95rem;
	font-weight: 500;
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};
	min-width: 120px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

	&:hover {
		background-color: ${props => props.theme.colors.primary[700]};
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	&:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		order: 1;
		margin-bottom: ${props => props.theme.spacing[2]};
	}
`

// New styled component for help text
const HelpText = styled.div`
	font-size: 12px;
	color: #6b7280;
	margin-top: 4px;
`

// New styled component for loading indicator
const LoadingIndicator = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100px;
`

// New styled component for children selection container
const ChildrenSelectionContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: ${props => props.theme.spacing[3]};
	max-height: 300px;
	overflow-y: auto;
	padding: ${props => props.theme.spacing[2]};
	border: 1px solid ${props => props.theme.colors.neutral[200]};
	border-radius: ${props => props.theme.borderRadius.md};
	background-color: ${props => props.theme.colors.background.primary};
`

// New styled component for child card
const ChildCard = styled.div<{ $isSelected: boolean }>`
	display: flex;
	align-items: center;
	padding: ${props => props.theme.spacing[3]};
	border: 2px solid
		${props =>
			props.$isSelected ? props.theme.colors.primary[500] : props.theme.colors.neutral[200]};
	border-radius: ${props => props.theme.borderRadius.md};
	cursor: pointer;
	transition: all 0.2s ease;
	background-color: ${props =>
		props.$isSelected
			? `${props.theme.colors.primary[50]}`
			: props.theme.colors.background.primary};
	box-shadow: ${props => (props.$isSelected ? `0 2px 4px rgba(99, 102, 241, 0.15)` : 'none')};

	&:hover {
		border-color: ${props => props.theme.colors.primary[400]};
		background-color: ${props =>
			props.$isSelected
				? `${props.theme.colors.primary[50]}`
				: props.theme.colors.background.secondary};
		transform: translateY(-1px);
	}
`

// New styled component for child checkbox
const ChildCheckbox = styled.div<{ $isSelected: boolean }>`
	width: 18px;
	height: 18px;
	border-radius: ${props => props.theme.borderRadius.sm};
	border: 2px solid
		${props =>
			props.$isSelected ? props.theme.colors.primary[500] : props.theme.colors.neutral[300]};
	margin-right: ${props => props.theme.spacing[3]};
	transition: all 0.2s ease;
	background-color: ${props =>
		props.$isSelected ? props.theme.colors.primary[500] : 'transparent'};
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	flex-shrink: 0;

	svg {
		font-size: 12px;
	}
`

// New styled component for child info
const ChildInfo = styled.div`
	display: flex;
	flex-direction: column;
	overflow: hidden;
`

// New styled component for child name
const ChildName = styled.span`
	font-size: 0.95rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

// New styled component for child email
const ChildEmail = styled.span`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

// New styled component for selection summary
const SelectionSummary = styled.div`
	margin-top: ${props => props.theme.spacing[3]};
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.secondary};
	display: flex;
	align-items: center;

	strong {
		color: ${props => props.theme.colors.primary[600]};
		margin: 0 4px;
	}
`

// New styled component for empty children message
const EmptyChildrenMessage = styled.div`
	padding: ${props => props.theme.spacing[4]};
	text-align: center;
	border: 1px dashed ${props => props.theme.colors.neutral[300]};
	border-radius: ${props => props.theme.borderRadius.md};
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.9rem;
	margin-top: ${props => props.theme.spacing[2]};
`

// Form error display components
const FormErrorContainer = styled.div`
	margin-bottom: ${props => props.theme.spacing[4]};
	padding: ${props => props.theme.spacing[4]};
	background-color: ${props => `${props.theme.colors.danger[50]}`};
	border-left: 4px solid ${props => props.theme.colors.danger[500]};
	border-radius: ${props => props.theme.borderRadius.md};
	display: flex;
	align-items: flex-start;
	gap: ${props => props.theme.spacing[3]};
`

const FormErrorIcon = styled.div`
	font-size: 1.2rem;
	line-height: 1;
`

const FormErrorMessage = styled.div`
	color: ${props => props.theme.colors.danger[700]};
	font-size: 0.95rem;
	line-height: 1.5;
`

// New styled component for form note
const FormNote = styled.div`
	padding: 0.75rem;
	background-color: ${props => props.theme.colors.primary[50]};
	border: 1px solid ${props => props.theme.colors.primary[100]};
	border-radius: 0.375rem;
	color: ${props => props.theme.colors.primary[700]};
	font-size: 0.9rem;
	width: 100%;
	margin: 0.5rem 0;
`

// Add these new styled components at the appropriate location in the styled components section
const ChildSearchContainer = styled.div`
	position: relative;
	margin-bottom: ${props => props.theme.spacing[3]};
`

const SearchIcon = styled.div`
	position: absolute;
	left: ${props => props.theme.spacing[3]};
	top: 50%;
	transform: translateY(-50%);
	color: ${props => props.theme.colors.text.secondary};
	z-index: 1;
`

const SearchInput = styled.input`
	width: 100%;
	padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[3]} ${props => props.theme.spacing[3]} ${props => props.theme.spacing[9]};
	border: 1px solid ${props => props.theme.colors.neutral[300]};
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 0.95rem;
	background-color: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.text.primary};

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[400]};
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
	}

	&::placeholder {
		color: ${props => props.theme.colors.text.tertiary};
	}
`

const ClearSearchButton = styled.button`
	position: absolute;
	right: ${props => props.theme.spacing[3]};
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	background: none;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	padding: 4px;
	border-radius: 50%;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
		color: ${props => props.theme.colors.text.primary};
	}
`

export default UserForm
