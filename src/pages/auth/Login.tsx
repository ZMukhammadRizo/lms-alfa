import React, { useEffect, useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import type { UserRole } from '../../contexts/AuthContext'
import { getDashboardRoute, useAuth } from '../../contexts/AuthContext'
import { showError, showSuccess } from '../../utils/toast'

// Loading animations
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const scaleUp = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`

const LogoIcon = styled.div`
	width: 80px;
	height: 80px;
	border-radius: 16px;
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.75rem;
	font-weight: bold;
	margin-bottom: ${props => props.theme.spacing[4]};
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
	animation: ${scaleUp} 0.5s ease-out;
`

const LoadingContainer = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: ${props => props.theme.colors.background.lighter};
	z-index: 1000;
	animation: ${fadeIn} 0.3s ease-in-out;
`

const LoadingContent = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: ${props => props.theme.spacing[3]};
`

const SpinnerContainer = styled.div`
	width: 50px;
	height: 50px;
	position: relative;
`

const Spinner = styled.div`
	width: 100%;
	height: 100%;
	border: 3px solid rgba(0, 0, 0, 0.1);
	border-radius: 50%;
	border-left-color: ${props => props.theme.colors.primary[500]};
	animation: ${spin} 1s linear infinite;
`

const LoadingText = styled.div`
	font-size: 1.25rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	margin-top: ${props => props.theme.spacing[2]};
	animation: ${pulse} 1.5s ease-in-out infinite;
`

// Styled components
const LoginContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	width: 100%;
	background-color: ${props => props.theme.colors.background.lighter};
	animation: ${fadeIn} 0.5s ease-in-out;
`

const FormSection = styled.div`
	display: flex;
	flex-direction: column;
	padding: ${props => props.theme.spacing[8]};
	background-color: ${props => props.theme.colors.background.secondary};
	box-shadow: ${props => props.theme.shadows.md};
	border-radius: ${props => props.theme.borderRadius.lg};
	max-width: 500px;
	width: 100%;
	margin: ${props => props.theme.spacing[4]};
	animation: ${scaleUp} 0.5s ease-in-out;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		padding: ${props => props.theme.spacing[6]};
	}
`

const LogoSection = styled.div`
	margin-bottom: ${props => props.theme.spacing[8]};
	text-align: center;

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: ${props => props.theme.colors.text.primary};
		margin-bottom: ${props => props.theme.spacing[2]};
	}

	p {
		color: ${props => props.theme.colors.text.secondary};
		font-size: 1rem;
	}

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		margin-bottom: ${props => props.theme.spacing[6]};

		h1 {
			font-size: 1.5rem;
		}
	}
`

const LoginForm = styled.form`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[5]};
`

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[2]};
`

const Label = styled.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const InputWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	background-color: ${props => props.theme.colors.background.secondary};
	transition: border-color ${props => props.theme.transition.fast};

	&:focus-within {
		border-color: ${props => props.theme.colors.primary[400]};
		box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
	}
`

const Input = styled.input`
	flex: 1;
	width: 100%;
	padding: ${props => props.theme.spacing[3]};
	padding-right: ${props => props.theme.spacing[9]};
	border: none;
	background-color: transparent;
	color: ${props => props.theme.colors.text.primary};
	font-size: 1rem;

	&:focus {
		outline: none;
	}

	&::placeholder {
		color: ${props => props.theme.colors.text.tertiary};
	}
`

const PasswordToggleButton = styled.button`
	position: absolute;
	right: ${props => props.theme.spacing[1]};
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	background: none;
	border: none;
	cursor: pointer;
	padding: ${props => props.theme.spacing[2]};
	color: ${props => props.theme.colors.text.tertiary};
	border-radius: ${props => props.theme.borderRadius.sm};

	svg {
		width: 1.2rem;
		height: 1.2rem;
	}

	&:hover {
		color: ${props => props.theme.colors.text.secondary};
		background-color: ${props => props.theme.colors.background.hover};
	}

	&:focus {
		outline: none;
		box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
	}
`

const LoginButton = styled.button<{ $isLoading?: boolean }>`
	width: 100%;
	padding: ${props => props.theme.spacing[3]};
	background-color: ${props =>
		props.$isLoading ? props.theme.colors.primary[400] : props.theme.colors.primary[500]};
	color: white;
	border: none;
	border-radius: ${props => props.theme.borderRadius.md};
	font-weight: 600;
	cursor: ${props => (props.$isLoading ? 'not-allowed' : 'pointer')};
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: ${props => (props.$isLoading ? 0.8 : 1)};

	&:hover {
		background-color: ${props =>
			props.$isLoading ? props.theme.colors.primary[400] : props.theme.colors.primary[600]};
	}

	&:disabled {
		background-color: ${props => props.theme.colors.primary[400]};
		cursor: not-allowed;
	}
`

const ErrorMessage = styled.div`
	padding: ${props => props.theme.spacing[3]};
	background-color: ${props => props.theme.colors.danger[50]};
	color: ${props => props.theme.colors.danger[700]};
	border: 1px solid ${props => props.theme.colors.danger[100]};
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 0.875rem;
`

// Add button spinner animation
const spinAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const ButtonSpinner = styled.div`
	display: inline-block;
	width: 18px;
	height: 18px;
	margin-right: 8px;
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	border-top-color: white;
	animation: ${spinAnimation} 0.8s linear infinite;
`

const RegisterPrompt = styled.div`
	text-align: center;
	margin-top: ${props => props.theme.spacing[4]};
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.secondary};
`

const RegisterLink = styled(Link)`
	font-size: 0.875rem;
	color: ${props => props.theme.colors.primary[600]};
	text-decoration: none;
	transition: color ${props => props.theme.transition.fast};

	&:hover {
		color: ${props => props.theme.colors.primary[700]};
		text-decoration: underline;
	}
`

const Login: React.FC = () => {
	const navigate = useNavigate()
	const { login, loading: authLoading, isAuthenticated, user } = useAuth()
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [rememberMe, setRememberMe] = useState(false)
	const [error, setError] = useState('')
	const [pageLoading, setPageLoading] = useState(true)
	const [isLoggingIn, setIsLoggingIn] = useState(false)
	const [isRedirecting, setIsRedirecting] = useState(false)
	const [redirectTarget, setRedirectTarget] = useState<string | null>(null)
	const [redirectMessage, setRedirectMessage] = useState('Redirecting to your dashboard...')

	// Handle initial page loading animation
	useEffect(() => {
		const timer = setTimeout(() => {
			setPageLoading(false)
		}, 1500) // Show loading animation for 1.5 seconds

		return () => clearTimeout(timer)
	}, [])

	// Handle redirection if already authenticated
	useEffect(() => {
		if (isAuthenticated && user && !isRedirecting) {
			try {
				const userRole = user?.role || 'student'
				const dashboardRoute = getDashboardRoute(userRole as UserRole)
				setRedirectTarget(dashboardRoute)
				setRedirectMessage(
					`Redirecting to your ${
						typeof userRole === 'string' ? userRole.toLowerCase() : 'dashboard'
					}...`
				)
				setIsRedirecting(true)

				// Directly navigate after a short delay
				const timer = setTimeout(() => {
					navigate(dashboardRoute, { replace: true })
				}, 1500)

				return () => clearTimeout(timer)
			} catch (error) {
				console.error('Error setting up redirection:', error)
				setRedirectTarget('/student/dashboard')
				setRedirectMessage('Redirecting to dashboard...')
				setIsRedirecting(true)

				// Fallback navigation
				const timer = setTimeout(() => {
					navigate('/student/dashboard', { replace: true })
				}, 1500)

				return () => clearTimeout(timer)
			}
		}
	}, [isAuthenticated, user, isRedirecting, navigate])

	// If we're still loading auth state or initial page load, or redirecting, show loading
	if (authLoading || pageLoading || (isRedirecting && redirectTarget)) {
		return (
			<LoadingContainer>
				<LoadingContent>
					<LogoIcon>LMS</LogoIcon>
					<SpinnerContainer>
						<Spinner />
					</SpinnerContainer>
					<LoadingText>{isRedirecting ? redirectMessage : 'Loading'}</LoadingText>
				</LoadingContent>
			</LoadingContainer>
		)
	}

	// Handle login form submission
	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoggingIn(true)
		setError('')

		try {
			// Use the AuthContext login function
			const loginResult = await login(username, password)

			if (loginResult.ok) {
				// Show success notification
				showSuccess(`Welcome back! You have successfully logged in.`)

				// Show redirection screen
				setIsRedirecting(true)

				// Get appropriate dashboard route
				const userRole = loginResult.role || 'student'
				const dashboardRoute = getDashboardRoute(userRole as UserRole)
				console.log('Login successful, redirecting to:', dashboardRoute)

				setRedirectTarget(dashboardRoute)
				setRedirectMessage(
					`Welcome! Redirecting to your ${
						typeof userRole === 'string' ? userRole.toLowerCase() : 'dashboard'
					}...`
				)

				// Navigate after a short delay
				setTimeout(() => {
					navigate(dashboardRoute, { replace: true })
				}, 1500)
			} else {
				// Show error notification
				showError(loginResult.msg)
				setError(loginResult.msg)
			}
		} catch (err) {
			console.error('Login error:', err)
			setError('An unexpected error occurred. Please try again.')
		} finally {
			setIsLoggingIn(false)
		}
	}

	// Only show login form if not authenticated and not redirecting
	return (
		<LoginContainer>
			<FormSection>
				<LogoSection>
					<h1>Learning Management System</h1>
					<p>Sign in to your account</p>
				</LogoSection>

				<LoginForm onSubmit={handleLogin}>
					{error && <ErrorMessage>{error}</ErrorMessage>}

					<FormGroup>
						<Label htmlFor='username'>Email</Label>
						<InputWrapper>
							<Input
								id='username'
								type='email'
								placeholder='Enter your email'
								value={username}
								onChange={e => setUsername(e.target.value)}
								required
							/>
						</InputWrapper>
					</FormGroup>

					<FormGroup>
						<Label htmlFor='password'>Password</Label>
						<InputWrapper>
							<Input
								id='password'
								type={showPassword ? 'text' : 'password'}
								placeholder='Enter your password'
								value={password}
								onChange={e => setPassword(e.target.value)}
								required
							/>
							<PasswordToggleButton
								type='button'
								onClick={() => setShowPassword(!showPassword)}
								aria-label={showPassword ? 'Hide password' : 'Show password'}
							>
								{showPassword ? <FiEyeOff /> : <FiEye />}
							</PasswordToggleButton>
						</InputWrapper>
					</FormGroup>
					<LoginButton type='submit' disabled={isLoggingIn} $isLoading={isLoggingIn}>
						{isLoggingIn ? (
							<>
								<ButtonSpinner />
								Signing in...
							</>
						) : (
							'Sign in'
						)}
					</LoginButton>
				</LoginForm>
			</FormSection>
		</LoginContainer>
	)
}

export default Login
