import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { FiUser, FiLock, FiSave, FiX, FiInfo } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'

// Field validation interface
interface ValidationErrors {
	username?: string
	email?: string
	lastName?: string
	firstName?: string
	currentPassword?: string
	newPassword?: string
	confirmPassword?: string
}

const ProfilePage: React.FC = () => {
	const { t } = useTranslation()
	const { user, updateProfile, updatePassword } = useAuth()
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		lastName: '',
		firstName: '',
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	})
	const [errors, setErrors] = useState<ValidationErrors>({})
	const [activeTab, setActiveTab] = useState('general')
	const [isEditing, setIsEditing] = useState(false)
	const [successMessage, setSuccessMessage] = useState('')
	const [errorMessage, setErrorMessage] = useState('')

	// Load user data into form
	useEffect(() => {
		console.log(user)

		if (user) {
			setFormData({
				...formData,
				username: user.username || '',
				email: user.email || '',
				firstName: user.firstName || '',
				lastName: user.lastName || '',
			})
		}
	}, [user])

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(email)
	}

	const validateGeneralForm = (): boolean => {
		const newErrors: ValidationErrors = {}
		let isValid = true

		// Username validation
		if (!formData.username.trim()) {
			newErrors.username = t('profile.usernameRequired')
			isValid = false
		} else if (formData.username.length < 3) {
			newErrors.username = t('profile.usernameMinLength')
			isValid = false
		}

		// Email validation
		if (!formData.email.trim()) {
			newErrors.email = t('profile.emailRequired')
			isValid = false
		} else if (!validateEmail(formData.email)) {
			newErrors.email = t('profile.emailInvalid')
			isValid = false
		}

		// first name and last name validation min length for firstname is 3 and max is 20, same for lastname
		if (!formData.firstName.trim()) {
			newErrors.firstName = t('profile.firstNameRequired')
			isValid = false
		} else if (formData.firstName.length < 3 || formData.firstName.length > 20) {
			newErrors.firstName = t('profile.firstNameLength')
			isValid = false
		}

		setErrors(newErrors)
		return isValid
	}

	const validatePasswordForm = (): boolean => {
		const newErrors: ValidationErrors = {}
		let isValid = true

		// Current password validation
		if (!formData.currentPassword) {
			newErrors.currentPassword = t('profile.currentPasswordRequired')
			isValid = false
		}

		// New password validation
		if (!formData.newPassword) {
			newErrors.newPassword = t('profile.newPasswordRequired')
			isValid = false
		} else if (formData.newPassword.length < 6) {
			newErrors.newPassword = t('profile.newPasswordMinLength')
			isValid = false
		} else if (!/\d/.test(formData.newPassword)) {
			newErrors.newPassword = t('profile.passwordMustContainNumber')
			isValid = false
		} else if (!/[a-zA-Z]/.test(formData.newPassword)) {
			newErrors.newPassword = t('profile.passwordMustContainLetter')
			isValid = false
		}

		// Confirm password validation
		if (!formData.confirmPassword) {
			newErrors.confirmPassword = t('profile.confirmPasswordRequired')
			isValid = false
		} else if (formData.newPassword !== formData.confirmPassword) {
			newErrors.confirmPassword = t('profile.passwordsDoNotMatch')
			isValid = false
		}

		setErrors(newErrors)
		return isValid
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData({
			...formData,
			[name]: value,
		})

		// Clear error for this field when user types
		if (errors[name as keyof ValidationErrors]) {
			setErrors({
				...errors,
				[name]: undefined,
			})
		}
	}

	const handleTabChange = (tab: string) => {
		setActiveTab(tab)
		// Clear error message when changing tabs
		setErrorMessage('')
		setSuccessMessage('')
	}

	const toggleEditing = () => {
		setIsEditing(!isEditing)
		if (isEditing) {
			// Reset form to original values when canceling
			if (user) {
				setFormData({
					...formData,
					username: user.username || '',
					email: user.email || '',
					firstName: user.firstName || '',
					lastName: user.lastName || '',
				})
			}
			// Clear errors when canceling
			setErrors({})
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Reset messages
		setSuccessMessage('')
		setErrorMessage('')

		// Validate form
		if (!validateGeneralForm()) {
			setErrorMessage(t('profile.correctFormErrors'))
			return
		}

		try {
			if (!user) {
				setErrorMessage(t('profile.userNotFound'))
				return
			}

			const { currentPassword, newPassword, confirmPassword, username, ...safeData } = formData

			// Update user profile using AuthContext
			const result = await updateProfile(user.id, { ...safeData, id: user.id, role: user.role })

			if (!result.ok) {
				setErrorMessage(result.msg)
				return
			}

			// Show success message
			setSuccessMessage(t('profile.profileUpdatedSuccess'))
			setErrorMessage('')

			// Exit edit mode
			setIsEditing(false)

			// Clear success message after 3 seconds
			setTimeout(() => {
				setSuccessMessage('')
			}, 3000)
		} catch (error) {
			setErrorMessage(t('profile.profileUpdateFailed'))
			setSuccessMessage('')
		}
	}

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault()

		// Reset messages
		setSuccessMessage('')
		setErrorMessage('')

		// Validate password form
		if (!validatePasswordForm()) {
			setErrorMessage(t('profile.correctFormErrors'))
			return
		}

		try {
			// Update password using AuthContext
			const success = await updatePassword(formData.currentPassword, formData.newPassword)

			if (!success.ok) {
				setErrorMessage(success.msg)
				return
			}

			// Reset password fields
			setFormData({
				...formData,
				currentPassword: '',
				newPassword: '',
				confirmPassword: '',
			})

			// Show success message
			setSuccessMessage(success.msg)
			setErrorMessage('')

			// Clear success message after 3 seconds
			setTimeout(() => {
				setSuccessMessage('')
			}, 3000)
		} catch (error) {
			setErrorMessage(t('profile.passwordChangeFailed'))
			setSuccessMessage('')
		}
	}

	const getUserRole = () => {
		const userInfo = localStorage.getItem('lms_user')
		if (userInfo) {
			try {
				const parsedInfo = JSON.parse(userInfo)
				if (parsedInfo.role && typeof parsedInfo.role === 'object') {
					if (parsedInfo.role.parent && parsedInfo.role.parent.name) {
						return parsedInfo.role.parent.name.toLowerCase() || 'student'
					}

					return parsedInfo.role.name.toLowerCase() || 'student'
				}

				if (parsedInfo.role && typeof parsedInfo.role === 'string') {
					return parsedInfo.role.toLowerCase() || 'student'
				}

				return 'student'
			} catch (error) {
				console.error('Error parsing user info:', error)
				return 'student'
			}
		}
		return user?.role || 'student'
	}

	return (
		<PageContainer>
			<PageHeader>
				<HeaderTitle>{t('profile.title')}</HeaderTitle>
			</PageHeader>

			{/* Alerts */}
			{successMessage && <SuccessAlert>{successMessage}</SuccessAlert>}
			{errorMessage && <ErrorAlert>{errorMessage}</ErrorAlert>}

			<ProfileContainer>
				<ProfileSidebar>
					<ProfileImage>
						{user?.username
							? user.username.charAt(0).toUpperCase() + user.username.charAt(1).toUpperCase()
							: 'U'}
					</ProfileImage>
					<RoleLabel>{getUserRole()}</RoleLabel>

					<TabsContainer>
						<TabButton
							$isActive={activeTab === 'general'}
							onClick={() => handleTabChange('general')}
						>
							<FiUser />
							<span>{t('profile.generalInformation')}</span>
						</TabButton>
						<TabButton
							$isActive={activeTab === 'security'}
							onClick={() => handleTabChange('security')}
						>
							<FiLock />
							<span>{t('profile.passwordAndSecurity')}</span>
						</TabButton>
					</TabsContainer>
				</ProfileSidebar>

				<ProfileContent>
					{activeTab === 'general' && (
						<form onSubmit={handleSubmit}>
							<ContentHeader>
								<SectionTitle>{t('profile.generalInformation')}</SectionTitle>
								<ActionButtons>
									{isEditing ? (
										<>
											<SaveButton type='submit'>
												<FiSave />
												{t('profile.saveChanges')}
											</SaveButton>
											<CancelButton type='button' onClick={toggleEditing}>
												<FiX />
												{t('profile.cancel')}
											</CancelButton>
										</>
									) : (
										<EditButton type='button' onClick={toggleEditing}>
											{t('profile.editProfile')}
										</EditButton>
									)}
								</ActionButtons>
							</ContentHeader>

							<FormGroup>
								<FormLabel htmlFor='username'>{t('profile.username')}</FormLabel>
								<FormInput
									type='text'
									id='username'
									name='username'
									value={formData.username}
									onChange={handleInputChange}
									disabled={true}
									$hasError={!!errors.username}
								/>
								{errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
								<FormHint>{t('profile.usernameHint')}</FormHint>
							</FormGroup>

							<FormGroup>
								<FormLabel htmlFor='fullName'>{t('profile.firstName')}</FormLabel>
								<FormInput
									type='text'
									id='firstName'
									name='firstName'
									value={formData.firstName}
									onChange={handleInputChange}
									disabled={!isEditing}
									$hasError={!!errors.firstName}
								/>
								{errors.firstName && <ErrorMessage>{errors.firstName}</ErrorMessage>}
							</FormGroup>
							<FormGroup>
								<FormLabel htmlFor='lastName'>{t('profile.lastName')}</FormLabel>
								<FormInput
									type='text'
									id='lastName'
									name='lastName'
									value={formData.lastName}
									onChange={handleInputChange}
									disabled={!isEditing}
									$hasError={!!errors.lastName}
								/>
								{errors.lastName && <ErrorMessage>{errors.lastName}</ErrorMessage>}
							</FormGroup>

							<FormGroup>
								<FormLabel htmlFor='email'>{t('profile.emailAddress')}</FormLabel>
								<FormInput
									type='email'
									id='email'
									name='email'
									value={formData.email}
									onChange={handleInputChange}
									disabled={!isEditing}
									$hasError={!!errors.email}
								/>
								{errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
							</FormGroup>
						</form>
					)}

					{activeTab === 'security' && (
						<form onSubmit={handleChangePassword}>
							<ContentHeader>
								<SectionTitle>{t('profile.passwordAndSecurity')}</SectionTitle>
							</ContentHeader>

							<PasswordRequirements>
								<FiInfo />
								<div>
									<p>{t('profile.passwordRequirements')}</p>
								</div>
							</PasswordRequirements>

							<FormGroup>
								<FormLabel htmlFor='currentPassword'>{t('profile.currentPassword')}</FormLabel>
								<FormInput
									type='password'
									id='currentPassword'
									name='currentPassword'
									value={formData.currentPassword}
									onChange={handleInputChange}
									placeholder={t('profile.currentPasswordPlaceholder')}
									$hasError={!!errors.currentPassword}
								/>
								{errors.currentPassword && <ErrorMessage>{errors.currentPassword}</ErrorMessage>}
							</FormGroup>

							<FormGroup>
								<FormLabel htmlFor='newPassword'>{t('profile.newPassword')}</FormLabel>
								<PasswordInputWrapper>
									<FormInput
										type='password'
										id='newPassword'
										name='newPassword'
										value={formData.newPassword}
										onChange={handleInputChange}
										placeholder={t('profile.newPasswordPlaceholder')}
										$hasError={!!errors.newPassword}
									/>
								</PasswordInputWrapper>
								{errors.newPassword && <ErrorMessage>{errors.newPassword}</ErrorMessage>}
							</FormGroup>

							<FormGroup>
								<FormLabel htmlFor='confirmPassword'>{t('profile.confirmPassword')}</FormLabel>
								<FormInput
									type='password'
									id='confirmPassword'
									name='confirmPassword'
									value={formData.confirmPassword}
									onChange={handleInputChange}
									placeholder={t('profile.confirmPasswordPlaceholder')}
									$hasError={!!errors.confirmPassword}
								/>
								{errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
							</FormGroup>

							<SaveButton type='submit'>
								<FiSave />
								{t('profile.changePassword')}
							</SaveButton>
						</form>
					)}
				</ProfileContent>
			</ProfileContainer>
		</PageContainer>
	)
}

const PageContainer = styled.div`
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
`

const PageHeader = styled.div`
	margin-bottom: 2rem;
`

const HeaderTitle = styled.h1`
	font-size: 1.75rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const ProfileContainer = styled.div`
	display: flex;
	gap: 2rem;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
	}
`

const ProfileSidebar = styled.div`
	width: 280px;
	flex-shrink: 0;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		width: 100%;
	}
`

const ProfileImage = styled.div`
	width: 120px;
	height: 120px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.primary[500]};
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 3rem;
	font-weight: 600;
	margin: 0 auto 1rem;
`

const RoleLabel = styled.div`
	background-color: ${props => props.theme.colors.primary[100]};
	color: ${props => props.theme.colors.primary[700]};
	padding: 0.25rem 0.75rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 500;
	display: inline-block;
	margin: 0 auto;
	text-transform: capitalize;
	text-align: center;
	width: fit-content;
	display: block;
	margin-bottom: 2rem;
`

const TabsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`

interface TabButtonProps {
	$isActive: boolean
}

const TabButton = styled.button<TabButtonProps>`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem 1rem;
	border-radius: 0.5rem;
	background-color: ${props => (props.$isActive ? props.theme.colors.primary[50] : 'transparent')};
	color: ${props =>
		props.$isActive ? props.theme.colors.primary[700] : props.theme.colors.text.secondary};
	font-weight: ${props => (props.$isActive ? '600' : '400')};
	border: none;
	text-align: left;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props =>
			props.$isActive ? props.theme.colors.primary[50] : props.theme.colors.background.hover};
		color: ${props =>
			props.$isActive ? props.theme.colors.primary[700] : props.theme.colors.text.primary};
	}

	svg {
		font-size: 1.25rem;
	}
`

const ProfileContent = styled.div`
	flex: 1;
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: 0.75rem;
	border: 1px solid ${props => props.theme.colors.border.light};
	padding: 2rem;
`

const ContentHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
	}
`

const SectionTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const ActionButtons = styled.div`
	display: flex;
	gap: 0.75rem;
`

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`

const FormLabel = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.875rem;
`

interface FormInputProps {
	$hasError?: boolean
}

const FormInput = styled.input<FormInputProps>`
	width: 100%;
	padding: 0.625rem 0.75rem;
	border-radius: 0.375rem;
	border: 1px solid
		${props => (props.$hasError ? props.theme.colors.danger[500] : props.theme.colors.border.light)};
	background-color: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.875rem;
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: ${props =>
			props.$hasError ? props.theme.colors.danger[500] : props.theme.colors.primary[500]};
		box-shadow: 0 0 0 2px
			${props =>
				props.$hasError ? props.theme.colors.danger[100] : props.theme.colors.primary[100]};
	}

	&:disabled {
		background-color: ${props => props.theme.colors.background.tertiary};
		cursor: not-allowed;
	}

	&::placeholder {
		color: ${props => props.theme.colors.text.tertiary};
	}
`

const ErrorMessage = styled.div`
	color: ${props => props.theme.colors.danger[500]};
	font-size: 0.75rem;
	margin-top: 0.25rem;
	display: flex;
	align-items: center;
	gap: 0.25rem;

	&::before {
		content: '⚠';
	}
`

const FormHint = styled.p`
	margin-top: 0.5rem;
	color: ${props => props.theme.colors.text.tertiary};
	font-size: 0.75rem;
`

const PasswordRequirements = styled.div`
	display: flex;
	gap: 1rem;
	padding: 1rem;
	border-radius: 0.5rem;
	background-color: ${props => props.theme.colors.primary[50]};
	margin-bottom: 1.5rem;
	border: none;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

	svg {
		color: ${props => props.theme.colors.primary[500]};
		font-size: 1.25rem;
		flex-shrink: 0;
		margin-top: 0.25rem;
	}

	p {
		font-weight: 500;
		margin-bottom: 0.25rem;
	}

	ul {
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.875rem;

		li {
			margin-bottom: 0.25rem;
		}
	}
`

const PasswordInputWrapper = styled.div`
	position: relative;
	width: 100%;
`

const Button = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.625rem 1rem;
	border-radius: 0.375rem;
	font-weight: 500;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s ease;

	svg {
		font-size: 1rem;
	}
`

const EditButton = styled(Button)`
	background-color: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.text.primary};
	border: 1px solid ${props => props.theme.colors.border.light};

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
		border-color: ${props => props.theme.colors.border.dark};
	}
`

const SaveButton = styled(Button)`
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	border: none;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

	&:hover {
		background-color: ${props => props.theme.colors.primary[600]};
	}
`

const CancelButton = styled(Button)`
	background-color: transparent;
	color: ${props => props.theme.colors.text.secondary};
	border: none;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
		color: ${props => props.theme.colors.text.primary};
	}
`

const Alert = styled.div`
	padding: 0.75rem 1rem;
	border-radius: 0.375rem;
	margin-bottom: 1.5rem;
	font-size: 0.875rem;
`

const SuccessAlert = styled(Alert)`
	background-color: ${props => props.theme.colors.success[50]};
	color: ${props => props.theme.colors.success[700]};
	border: 1px solid ${props => props.theme.colors.success[200]};
`

const ErrorAlert = styled(Alert)`
	background-color: ${props => props.theme.colors.danger[50]};
	color: ${props => props.theme.colors.danger[700]};
	border: 1px solid ${props => props.theme.colors.danger[200]};
`

export default ProfilePage
