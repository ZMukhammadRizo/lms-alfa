import React, { useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiLogOut, FiSettings, FiUser } from 'react-icons/fi'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Footer from '../components/admin/Footer'
import ParentNotificationBell from '../components/parent/ParentNotificationBell'
import ParentSidebar from '../components/parent/ParentSidebar'
import { useAuth } from '../contexts/AuthContext'
import { useAnnouncements } from '../stores/useAnnouncementStore'
import { useParentStore } from '../stores/useParentStore'
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
	align-items: center;
	justify-content: flex-end;
	padding: 0 32px;
	background-color: ${props => props.theme.colors.background.secondary};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	height: 60px;
	width: 100%;
	transition: background-color 0.2s ease, border-color 0.2s ease;
`

const HeaderActions = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`

const UserMenuContainer = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`

const UserName = styled.button`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	background: none;
	border: none;
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	padding: 0.25rem;

	&:hover {
		color: ${props => props.theme.colors.primary[600]};
	}

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		display: none;
	}
`

const UserAvatar = styled.div`
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.primary[500]};
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
`

const AvatarText = styled.span`
	color: white;
	font-weight: 600;
	font-size: 0.875rem;
`

const UserMenu = styled.div`
	position: absolute;
	top: calc(100% + 10px);
	right: 0;
	width: 240px;
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: 8px;
	border: 1px solid ${props => props.theme.colors.border.light};
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	z-index: ${props => props.theme.zIndices.dropdown};
	overflow: hidden;
`

const UserMenuHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem;
`

const MenuUserAvatar = styled.div`
	width: 42px;
	height: 42px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.primary[500]};
	display: flex;
	align-items: center;
	justify-content: center;
`

const MenuAvatarText = styled.span`
	color: white;
	font-weight: 600;
	font-size: 1rem;
`

const UserInfo = styled.div`
	display: flex;
	flex-direction: column;
`

const UserFullName = styled.span`
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const UserRole = styled.span`
	font-size: 0.75rem;
	color: ${props => props.theme.colors.text.secondary};
	text-transform: capitalize;
`

const UserMenuDivider = styled.div`
	height: 1px;
	background-color: ${props => props.theme.colors.border.light};
	margin: 0.25rem 0;
`

const UserMenuItem = styled.button`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	padding: 0.75rem 1rem;
	border: none;
	background: none;
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.875rem;
	text-align: left;
	cursor: pointer;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}
`

const MenuItemIcon = styled.span`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	color: ${props => props.theme.colors.text.secondary};
`

// Header component
const Header: React.FC = () => {
	const navigate = useNavigate()
	const { user, logout } = useAuth()
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
	const userMenuRef = useRef<HTMLDivElement>(null)

	// Handle clicking outside of user menu to close it
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
				setIsUserMenuOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const toggleUserMenu = () => {
		setIsUserMenuOpen(!isUserMenuOpen)
	}

	const handleCloseUserMenu = () => {
		setIsUserMenuOpen(false)
	}

	const getUserInitials = () => {
		if (!user || !user.firstName || !user.lastName) return '?'
		return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase()
	}

	return (
		<HeaderContainer>
			<HeaderActions>
				<ParentNotificationBell basePath='/parent' />
				<UserMenuContainer ref={userMenuRef}>
					<UserAvatar onClick={toggleUserMenu}>
						<AvatarText>{getUserInitials()}</AvatarText>
					</UserAvatar>
					<UserName onClick={toggleUserMenu}>
						{user?.firstName} {user?.lastName}
						<FiChevronDown
							style={{
								transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0)',
								transition: 'transform 0.2s ease',
							}}
						/>
					</UserName>

					{isUserMenuOpen && (
						<UserMenu>
							<UserMenuHeader>
								<MenuUserAvatar>
									<MenuAvatarText>{getUserInitials()}</MenuAvatarText>
								</MenuUserAvatar>
								<UserInfo>
									<UserFullName>
										{user?.firstName} {user?.lastName}
									</UserFullName>
									<UserRole>Parent</UserRole>
								</UserInfo>
							</UserMenuHeader>

							<UserMenuDivider />

							<UserMenuItem as={Link} to='/parent/profile' onClick={handleCloseUserMenu}>
								<MenuItemIcon>
									<FiUser />
								</MenuItemIcon>
								<span>My Profile</span>
							</UserMenuItem>

							<UserMenuItem as={Link} to='/parent/settings' onClick={handleCloseUserMenu}>
								<MenuItemIcon>
									<FiSettings />
								</MenuItemIcon>
								<span>Settings</span>
							</UserMenuItem>

							<UserMenuDivider />

							<UserMenuItem onClick={logout}>
								<MenuItemIcon>
									<FiLogOut />
								</MenuItemIcon>
								<span>Log out</span>
							</UserMenuItem>
						</UserMenu>
					)}
				</UserMenuContainer>
			</HeaderActions>
		</HeaderContainer>
	)
}

export default ParentLayout
