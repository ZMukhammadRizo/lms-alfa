import React, { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Footer from '../components/admin/Footer'
import ParentNotificationBell from '../components/parent/ParentNotificationBell'
import ParentSidebar from '../components/parent/ParentSidebar'
import { useAnnouncements } from '../stores/useAnnouncementStore'
import { useParentStore } from '../stores/useParentStore'
import { useAuth } from '../contexts/AuthContext'
// Error boundary for handling rendering errors
class ErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	{ hasError: boolean; error: Error | null }
> {
	constructor(props: { children: React.ReactNode }) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('Error caught by ErrorBoundary:', error, errorInfo)
	}

	render() {
		if (this.state.hasError) {
			return (
				<div
					style={{
						padding: '20px',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						height: '100vh',
					}}
				>
					<h2>Something went wrong.</h2>
					<p>Please try refreshing the page or contact support if the issue persists.</p>
					<button
						onClick={() => window.location.reload()}
						style={{
							padding: '8px 16px',
							background: '#1976d2',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							marginTop: '20px',
						}}
					>
						Refresh Page
					</button>
				</div>
			)
		}

		return this.props.children
	}
}

const ParentLayout: React.FC = () => {
	const [isSidebarCollapsed, setSidebarCollapsed] = useState(false)
	const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)
	const [showNotifications, setShowNotifications] = useState(false)
	const [showUserDropdown, setShowUserDropdown] = useState(false)
	const { user, logout } = useAuth()
	const location = useLocation()
	const navigate = useNavigate()
	const {
		announcements,
		unreadCount,
		markAsRead: markAnnouncementAsRead,
		markAllAsRead,
		fetchAnnouncements,
	} = useAnnouncements()

	// Get parent store functions
	const {
		initializeRealtimeUpdates,
		cleanupRealtimeUpdates,
		fetchLinkedStudents,
		notifications,
		markNotificationAsRead,
		markAllNotificationsAsRead,
	} = useParentStore()

	// Get parent announcements - both All and Parent targeted announcements
	const parentAnnouncements =
		announcements?.filter(
			announcement =>
				announcement?.targetAudience?.toLowerCase() === 'all' ||
				announcement?.targetAudience?.toLowerCase() === 'parent'
		) || []

	// Get most recent 3 announcements sorted by creation date
	const recentAnnouncements = [...parentAnnouncements]
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
		.slice(0, 3)

	// Get unread notification count
	const unreadNotificationsCount = notifications.filter(notification => !notification.isRead).length

	// Initialize realtime updates and fetch parent's children
	useEffect(() => {
		if (user) {
			// Fetch linked students (children) for the parent
			fetchLinkedStudents()

			// Initialize realtime updates
			initializeRealtimeUpdates()
		}

		// Cleanup on unmount
		return () => {
			cleanupRealtimeUpdates()
		}
	}, [user, fetchLinkedStudents, initializeRealtimeUpdates, cleanupRealtimeUpdates])

	useEffect(() => {
		try {
			// Fetch announcements for Parent role
			fetchAnnouncements('Parent')

			// Refresh announcements every 5 minutes
			const intervalId = setInterval(() => {
				fetchAnnouncements('Parent')
			}, 300000) // 5 minutes

			return () => clearInterval(intervalId)
		} catch (error) {
			console.error('Error fetching announcements:', error)
		}
	}, [fetchAnnouncements])

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 1024) {
				setSidebarCollapsed(true)
			}
		}

		// Initial check
		handleResize()

		// Add resize listener
		window.addEventListener('resize', handleResize)

		// Cleanup
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	const toggleSidebar = () => {
		setSidebarCollapsed(!isSidebarCollapsed)
	}

	const handleMobileToggle = (isOpen: boolean) => {
		setMobileSidebarOpen(isOpen)
	}

	// Close notifications on route change
	useEffect(() => {
		setShowNotifications(false)
		setShowUserDropdown(false)
	}, [location.pathname])

	return (
		<ErrorBoundary>
			<ParentLayoutContainer>
				<ParentSidebar
					isCollapsed={isSidebarCollapsed}
					toggleSidebar={toggleSidebar}
					onMobileToggle={handleMobileToggle}
				/>
				<MainContent $isCollapsed={isSidebarCollapsed} $isMobileOpen={isMobileSidebarOpen}>
					<Header />
					<ContentWrapper>
						<ErrorBoundary>
							<Outlet />
						</ErrorBoundary>
					</ContentWrapper>
					<Footer />
				</MainContent>
			</ParentLayoutContainer>
		</ErrorBoundary>
	)
}

const ParentLayoutContainer = styled.div`
	display: flex;
	height: 100vh;
	width: 100%;
	background-color: ${props => props.theme?.colors?.background?.primary || '#f5f5f5'};
`

interface MainContentProps {
	$isCollapsed: boolean
	$isMobileOpen: boolean
}

const MainContent = styled.div<MainContentProps>`
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow-x: hidden;
	transition: margin-left ${props => props.theme?.transition?.normal || '0.3s ease'},
		filter ${props => props.theme?.transition?.normal || '0.3s ease'},
		opacity ${props => props.theme?.transition?.normal || '0.3s ease'};
	z-index: ${props => props.theme?.zIndices?.base || 1};
	position: relative;
	margin-left: ${({ $isCollapsed }) => ($isCollapsed ? '80px' : '280px')};

	@media (max-width: ${props => props.theme?.breakpoints?.lg || '1024px'}) {
		margin-left: 0;
		filter: ${({ $isMobileOpen }) => ($isMobileOpen ? 'blur(4px)' : 'none')};
		opacity: ${({ $isMobileOpen }) => ($isMobileOpen ? 0.7 : 1)};
		pointer-events: ${({ $isMobileOpen }) => ($isMobileOpen ? 'none' : 'auto')};
	}
`

const ContentWrapper = styled.main`
	flex: 1;
	padding: 24px 32px;
	overflow-y: auto;
	background-color: ${props => props.theme?.colors?.background?.secondary || '#ffffff'};
`

// Header styled components
const HeaderContainer = styled.header`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.75rem 1.5rem;
	background-color: ${props => props.theme.colors.background.primary || 'white'};
	border-bottom: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
`

const HeaderLeft = styled.div`
	display: flex;
	align-items: center;
`

const PageTitle = styled.h1`
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary || '#334155'};
	margin: 0;
`

const HeaderRight = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`

const UserDropdown = styled.div`
	position: relative;
`

const UserButton = styled.button`
	display: flex;
	align-items: center;
	background: none;
	border: none;
	cursor: pointer;
	padding: 0.25rem;
	border-radius: 0.375rem;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover || '#f1f5f9'};
	}
`

const UserAvatar = styled.div`
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.primary[500] || '#3b82f6'};
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	margin-right: 0.5rem;
`

const UserName = styled.span`
	font-size: 0.875rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary || '#334155'};
`

const DropdownMenu = styled.div`
	position: absolute;
	top: 100%;
	right: 0;
	margin-top: 0.5rem;
	width: 12rem;
	background-color: ${props => props.theme.colors.background.primary || 'white'};
	border-radius: 0.375rem;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	border: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
	z-index: 50;
	padding: 0.5rem 0;
	display: none;

	${UserDropdown}:hover & {
		display: block;
	}
`

const DropdownItem = styled.button`
	display: block;
	width: 100%;
	text-align: left;
	padding: 0.5rem 1rem;
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.primary || '#334155'};
	background: none;
	border: none;
	cursor: pointer;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover || '#f1f5f9'};
	}
`

const DropdownDivider = styled.div`
	height: 1px;
	background-color: ${props => props.theme.colors.border.light || '#e2e8f0'};
	margin: 0.5rem 0;
`

// Header component
const Header: React.FC = () => {
	const navigate = useNavigate()
	const { user, logout } = useAuth()

	return (
		<HeaderContainer>
			<HeaderLeft>
				<PageTitle>Parent Dashboard</PageTitle>
			</HeaderLeft>
			<HeaderRight>
				<ParentNotificationBell basePath='/parent' />
				<UserDropdown>
					<UserButton>
						<UserAvatar>{user?.firstName?.charAt(0) || 'U'}</UserAvatar>
						<UserName>
							{user?.firstName} {user?.lastName}
						</UserName>
					</UserButton>
					<DropdownMenu>
						<DropdownItem onClick={() => navigate('/parent/profile')}>Profile</DropdownItem>
						<DropdownItem onClick={() => navigate('/parent/settings')}>Settings</DropdownItem>
						<DropdownDivider />
						<DropdownItem onClick={logout}>Sign Out</DropdownItem>
					</DropdownMenu>
				</UserDropdown>
			</HeaderRight>
		</HeaderContainer>
	)
}

export default ParentLayout
