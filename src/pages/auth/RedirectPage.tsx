import React, { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import type { UserRole } from '../../contexts/AuthContext'
import { getDashboardRoute, useAuth } from '../../contexts/AuthContext'

interface RedirectPageProps {
	targetPath?: string
	message?: string
}

const RedirectPage: React.FC<RedirectPageProps> = ({
	targetPath,
	message = 'Redirecting you to the appropriate dashboard...',
}) => {
	const navigate = useNavigate()
	const location = useLocation()
	const params = useParams<{ targetPath?: string }>()
	const { user, isAuthenticated } = useAuth()
	const [redirectStatus, setRedirectStatus] = useState<
		'initializing' | 'processing' | 'complete' | 'error'
	>('initializing')
	const [statusMessage, setStatusMessage] = useState(message)
	const [destination, setDestination] = useState<string | null>(null)
	const [countDown, setCountDown] = useState(3)

	// Use the provided targetPath, URL parameter, or determine from user role
	useEffect(() => {
		const determineDestination = () => {
			// Priority 1: Component prop targetPath
			if (targetPath) {
				setDestination(targetPath)
				setRedirectStatus('processing')
				return
			}

			// Priority 2: URL parameter
			if (params.targetPath) {
				// Decode URL encoded path
				const decodedPath = decodeURIComponent(params.targetPath)
				setDestination(decodedPath)
				setRedirectStatus('processing')
				return
			}

			// Priority 3: Determine based on user role
			if (isAuthenticated && user) {
				try {
					setRedirectStatus('processing')
					const userRole = user?.role || 'student'
					const dashboardPath = getDashboardRoute(userRole as UserRole)
					console.log('Determined destination:', dashboardPath)
					setStatusMessage(
						`Redirecting to your ${typeof userRole === 'string' ? userRole : 'dashboard'}...`
					)
					setDestination(dashboardPath)
				} catch (error) {
					console.error('Failed to determine destination path:', error)
					setRedirectStatus('error')
					setStatusMessage('Something went wrong during redirection')
					setDestination('/student/dashboard') // Safe fallback
				}
			} else {
				// Not authenticated, redirect to login
				setRedirectStatus('processing')
				setStatusMessage('You need to log in first')
				setDestination('/login')
			}
		}

		determineDestination()
	}, [user, isAuthenticated, targetPath, params.targetPath])

	// Countdown and navigate when destination is determined
	useEffect(() => {
		if (destination && redirectStatus === 'processing') {
			const timer = setInterval(() => {
				setCountDown(prev => {
					if (prev <= 1) {
						clearInterval(timer)
						setRedirectStatus('complete')
						return 0
					}
					return prev - 1
				})
			}, 1000)

			return () => clearInterval(timer)
		}
	}, [destination, navigate, redirectStatus])

	// Perform the actual navigation when countdown is complete
	useEffect(() => {
		if (redirectStatus === 'complete' && destination) {
			// Use Navigate component instead for better routing
			setStatusMessage(`Redirecting now to ${destination}...`)
		}
	}, [redirectStatus, destination])

	// Show debug info for development - this should be removed in production
	const debugInfo = {
		status: redirectStatus,
		destination,
		targetPathProp: targetPath,
		urlParam: params.targetPath,
		role: user?.role,
	}
	console.log('RedirectPage Debug:', debugInfo)

	// When redirect is complete, we'll use the Navigate component to do the actual redirect
	if (redirectStatus === 'complete' && destination) {
		return <Navigate to={destination} replace />
	}

	return (
		<RedirectContainer>
			<ContentCard>
				<LogoSection>
					<LogoIcon>LMS</LogoIcon>
					<h1>Learning Management System</h1>
				</LogoSection>

				<StatusSection>
					<SpinnerContainer>
						<Spinner />
					</SpinnerContainer>

					<StatusMessage>{statusMessage}</StatusMessage>

					{redirectStatus === 'processing' && destination && (
						<CountdownText>
							Redirecting in {countDown} second{countDown !== 1 ? 's' : ''}...
						</CountdownText>
					)}

					{redirectStatus === 'error' && (
						<ErrorMessage>
							There was a problem with the redirection.
							<RetryButton onClick={() => window.location.reload()}>Retry</RetryButton>
						</ErrorMessage>
					)}
				</StatusSection>
			</ContentCard>
		</RedirectContainer>
	)
}

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const scaleUp = keyframes`
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`

// Styled components
const RedirectContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	width: 100%;
	background-color: ${props => props.theme.colors.background.lighter};
	animation: ${fadeIn} 0.5s ease-in-out;
`

const ContentCard = styled.div`
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
`

const LogoSection = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: ${props => props.theme.spacing[6]};

	h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: ${props => props.theme.colors.text.primary};
		margin-top: ${props => props.theme.spacing[4]};
		text-align: center;
	}
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
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
`

const StatusSection = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
`

const SpinnerContainer = styled.div`
	width: 50px;
	height: 50px;
	margin-bottom: ${props => props.theme.spacing[4]};
`

const Spinner = styled.div`
	width: 100%;
	height: 100%;
	border: 3px solid rgba(0, 0, 0, 0.1);
	border-radius: 50%;
	border-left-color: ${props => props.theme.colors.primary[500]};
	animation: ${spin} 1s linear infinite;
`

const StatusMessage = styled.p`
	font-size: 1.125rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: ${props => props.theme.spacing[4]};
`

const CountdownText = styled.p`
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.secondary};
	animation: ${pulse} 1.5s ease-in-out infinite;
`

const ErrorMessage = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: ${props => props.theme.spacing[4]};
	background-color: ${props => props.theme.colors.danger[50]};
	color: ${props => props.theme.colors.danger[700]};
	border: 1px solid ${props => props.theme.colors.danger[100]};
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 0.875rem;
	margin-top: ${props => props.theme.spacing[4]};
	width: 100%;
`

const RetryButton = styled.button`
	margin-top: ${props => props.theme.spacing[2]};
	padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[4]};
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	border: none;
	border-radius: ${props => props.theme.borderRadius.md};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.primary[600]};
	}
`

export default RedirectPage
