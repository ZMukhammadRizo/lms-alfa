import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FiBell, FiChevronDown, FiChevronLeft, FiChevronRight, FiMenu } from 'react-icons/fi'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import styled, { css } from 'styled-components'
import {
	adminMenu,
	getAdminMenu,
	announcementsSubItems,
	getManagerMenu,
	getModuleLeaderMenu,
	getSystemMenu,
	menuItemPermissionMap,
} from '../../constants/menuItems'
import { useAuth } from '../../contexts/AuthContext'
import { getUserParentRole, getUserRole, hasPermission, hasRole } from '../../utils/authUtils'
import LogoutButton from '../common/LogoutButton'
import PermissionMenuItem from '../common/PermissionMenuItem'
import { useTranslation } from 'react-i18next'

interface SidebarProps {
	isCollapsed: boolean
	toggleSidebar: () => void
	onMobileToggle?: (isOpen: boolean) => void
}

interface MenuItemProps {
	icon: React.ReactNode
	label: string
	to: string
	isCollapsed: boolean
	onMobileClick?: () => void
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, to, isCollapsed, onMobileClick }) => {
	const location = useLocation()
	const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`)

	const handleClick = () => {
		if (onMobileClick) {
			onMobileClick()
		}
	}

	return (
		<MenuItemContainer
			to={to}
			$isActive={isActive}
			$isCollapsed={isCollapsed}
			onClick={handleClick}
		>
			<IconWrapper>{icon}</IconWrapper>
			<AnimatePresence>
				{!isCollapsed && (
					<MenuLabel
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -10 }}
						transition={{ duration: 0.2 }}
					>
						{label}
					</MenuLabel>
				)}
			</AnimatePresence>
			{isActive && (
				<ActiveIndicator
					layoutId='activeIndicator'
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
				/>
			)}
		</MenuItemContainer>
	)
}

// New component for menu items with submenu
interface MenuItemWithSubmenuProps {
	icon: React.ReactNode
	label: string
	isCollapsed: boolean
	subItems: {
		path: string
		icon: React.ReactNode
		label: string
		requiredPermission?: string
		[key: string]: any
	}[]
	onMobileClick?: () => void
	requiredPermissions?: string[]
}

const MenuItemWithSubmenu: React.FC<MenuItemWithSubmenuProps> = ({
	icon,
	label,
	isCollapsed,
	subItems,
	onMobileClick,
	requiredPermissions,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const location = useLocation()
	const isActive = subItems.some(
		item => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
	)

	const toggleSubmenu = (e: React.MouseEvent) => {
		e.preventDefault() // Prevent navigation
		e.stopPropagation() // Stop event bubbling
		if (!isCollapsed) {
			setIsOpen(!isOpen)
		}
	}

	return (
		<div>
			<SubmenuTrigger onClick={toggleSubmenu} $isActive={isActive} $isCollapsed={isCollapsed}>
				<IconWrapper>{icon}</IconWrapper>

				<AnimatePresence>
					{!isCollapsed && (
						<>
							<MenuLabel
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -10 }}
								transition={{ duration: 0.2 }}
							>
								{label}
							</MenuLabel>

							<ChevronIcon
								initial={{ rotate: 0 }}
								animate={{ rotate: isOpen ? 180 : 0 }}
								transition={{ duration: 0.2 }}
							>
								<FiChevronDown />
							</ChevronIcon>
						</>
					)}
				</AnimatePresence>

				{isActive && (
					<ActiveIndicator
						layoutId='activeIndicator'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					/>
				)}
			</SubmenuTrigger>

			<AnimatePresence>
				{!isCollapsed && isOpen && (
					<SubMenu
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
					>
						{subItems.map(item => (
							<SubMenuItem
								key={item.path}
								to={item.path}
								$isActive={location.pathname === item.path}
								onClick={onMobileClick}
							>
								<SubMenuIcon>{item.icon}</SubMenuIcon>
								<span>{item.label}</span>
							</SubMenuItem>
						))}
					</SubMenu>
				)}
			</AnimatePresence>
		</div>
	)
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar, onMobileToggle }) => {
	const [isMobile, setIsMobile] = useState(false)
	const [isMobileOpen, setIsMobileOpen] = useState(false)
	const { user } = useAuth()
	const { t } = useTranslation()
	const navigate = useNavigate()

	// Handle window resize
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 1024)
		}

		// Initial check
		checkMobile()

		// Add resize listener
		window.addEventListener('resize', checkMobile)

		// Cleanup
		return () => window.removeEventListener('resize', checkMobile)
	}, [])

	// Effect to handle scroll lock when mobile menu is open
	useEffect(() => {
		if (isMobile) {
			if (isMobileOpen) {
				// Lock body scroll when mobile menu is open
				document.body.style.overflow = 'hidden'
				document.body.style.position = 'fixed'
				document.body.style.width = '100%'
				document.body.style.top = `-${window.scrollY}px`
			} else {
				// Restore scroll when mobile menu is closed
				const scrollY = document.body.style.top
				document.body.style.overflow = ''
				document.body.style.position = ''
				document.body.style.width = ''
				document.body.style.top = ''
				window.scrollTo(0, parseInt(scrollY || '0') * -1)
			}
		}

		return () => {
			// Cleanup scroll lock on unmount
			document.body.style.overflow = ''
			document.body.style.position = ''
			document.body.style.width = ''
			document.body.style.top = ''
		}
	}, [isMobileOpen, isMobile])

	const handleMobileToggle = () => {
		const newState = !isMobileOpen
		setIsMobileOpen(newState)
		if (onMobileToggle) {
			onMobileToggle(newState)
		}
	}

	// Close mobile menu on navigation
	const handleNavItemClick = () => {
		if (isMobile && isMobileOpen) {
			setIsMobileOpen(false)
			if (onMobileToggle) {
				onMobileToggle(false)
			}
		}
	}

	// Get user initials for profile display
	const getUserInitials = () => {
		if (!user || !user.username) return 'U'

		if (user.fullName) {
			const nameParts = user.fullName.split(' ')
			if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
			return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
		}

		return user.username.charAt(0).toUpperCase()
	}

	// Get full name display
	const getFullName = () => {
		return user?.fullName || user?.username || 'User'
	}

	// The following functions are now imported from authUtils.ts
	// instead of being defined locally

	const role = getUserRole()
	const parentRole = getUserParentRole()
	console.log('Detected user role:', role)
	console.log('Detected user parent role:', parentRole)

	// Get manager menu items based on parent role
	const managerMenu = getManagerMenu(parentRole, role, t)

	// Get system menu items for the current role
	const systemMenu = getSystemMenu(role.toLowerCase(), t)

	// Get module leader menu items based on parent role
	const moduleLeaderMenu = getModuleLeaderMenu(parentRole, role, t)

	// Get translated admin menu
	const translatedAdminMenu = getAdminMenu(t)

	console.log('hasPermission("manage_roles")', hasPermission('manage_roles'))

	return (
		<>
			{/* Mobile menu button */}
			{isMobile && !isMobileOpen && (
				<MobileMenuButton onClick={handleMobileToggle} aria-label='Open menu' aria-expanded={false}>
					<FiMenu />
				</MobileMenuButton>
			)}

			<AnimatePresence mode='sync'>
				{(isMobile ? isMobileOpen : true) && (
					<SidebarContainer
						$isCollapsed={isMobile ? false : isCollapsed}
						$isMobile={isMobile}
						as={motion.aside}
						initial={{ x: isMobile ? '-100%' : 0 }}
						animate={{ x: 0 }}
						exit={{ x: '-100%' }}
						transition={{
							duration: 0.2,
							ease: [0.4, 0, 0.2, 1],
						}}
					>
						<LogoContainer $isCollapsed={isMobile ? false : isCollapsed}>
							{isCollapsed && !isMobile ? (
								<SmallLogo>LMS</SmallLogo>
							) : (
								<Logo>
									<motion.span
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.2 }}
										style={{
											opacity: 1,
											display: 'inline-block',
											overflow: 'visible',
											whiteSpace: 'nowrap',
										}}
									>
										Learning Management System
									</motion.span>
								</Logo>
							)}

							{!isMobile && (
								<ToggleButton onClick={toggleSidebar}>
									{isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
								</ToggleButton>
							)}
						</LogoContainer>

						<MenuContainer>
							<MenuSection>
								{(role === 'Admin' || parentRole === 'Admin') && (
									<>
										{translatedAdminMenu.map(item => (
											<MenuItem
												key={item.path}
												icon={item.icon}
												label={item.label}
												to={item.path}
												isCollapsed={isMobile ? false : isCollapsed}
												onMobileClick={handleNavItemClick}
											/>
										))}

										<MenuItemWithSubmenu
											icon={<FiBell />}
											label={t('navigation.announcements')}
											isCollapsed={isMobile ? false : isCollapsed}
											subItems={announcementsSubItems}
											onMobileClick={handleNavItemClick}
										/>
									</>
								)}
								{hasPermission('access_admin_roles') ||
								hasRole('RoleManager') ||
								hasRole('Admin') ||
								hasRole('SuperAdmin') ? (
									<>
										<AnimatePresence>
											{(!isCollapsed || isMobile) && (
												<SectionLabel
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													transition={{ delay: 0.2 }}
												>
													{t('navigation.roleManagement').toUpperCase()}
												</SectionLabel>
											)}
										</AnimatePresence>

										{managerMenu.map(item => (
											<MenuItem
												key={item.path}
												icon={item.icon}
												label={item.label}
												to={item.path}
												isCollapsed={isMobile ? false : isCollapsed}
												onMobileClick={handleNavItemClick}
											/>
										))}
									</>
								) : null}

								{hasPermission('access_admin_subjects') ||
								hasRole('RoleManager') ||
								role === 'Admin' ||
								role === 'SuperAdmin' ? (
									<>
										<AnimatePresence>
											{(!isCollapsed || isMobile) && (
												<SectionLabel
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													transition={{ delay: 0.2 }}
												>
													{t('navigation.moduleLeader')}
												</SectionLabel>
											)}
										</AnimatePresence>

										{moduleLeaderMenu.map(item => (
											<MenuItem
												key={item.path}
												icon={item.icon}
												label={item.label}
												to={item.path}
												isCollapsed={isMobile ? false : isCollapsed}
												onMobileClick={handleNavItemClick}
											/>
										))}
									</>
								) : null}
							</MenuSection>

							<MenuSection>
								<AnimatePresence>
									{(!isCollapsed || isMobile) && (
										<SectionLabel
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ delay: 0.2 }}
										>
											{t('navigation.system')}
										</SectionLabel>
									)}
								</AnimatePresence>

								{systemMenu.map(item => (
									<MenuItem
										key={item.path}
										icon={item.icon}
										label={item.label}
										to={item.path}
										isCollapsed={isMobile ? false : isCollapsed}
										onMobileClick={handleNavItemClick}
									/>
								))}
							</MenuSection>
						</MenuContainer>

						<ProfileSection $isCollapsed={isMobile ? false : isCollapsed}>
							<ProfileImage>{getUserInitials()}</ProfileImage>
							<AnimatePresence>
								{(!isCollapsed || isMobile) && (
									<ProfileInfo
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.2 }}
									>
										<ProfileName>{getFullName()}</ProfileName>
										<ProfileRole>{role}</ProfileRole>
									</ProfileInfo>
								)}
							</AnimatePresence>
							<LogoutButton />
						</ProfileSection>

						{isMobile && <MobileOverlay onClick={handleMobileToggle} />}
					</SidebarContainer>
				)}
			</AnimatePresence>

			{/* Background Overlay for Mobile */}
			<AnimatePresence>
				{isMobile && isMobileOpen && (
					<Overlay
						as={motion.div}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
						onClick={handleMobileToggle}
					/>
				)}
			</AnimatePresence>
		</>
	)
}

interface CollapsibleProps {
	$isCollapsed: boolean
	$isMobile?: boolean
}

const SidebarContainer = styled(motion.aside)<CollapsibleProps>`
	height: 100%;
	background: #ffffff;
	color: ${props => props.theme.colors.text.primary};
	box-shadow: ${props => props.theme.shadows.lg};
	display: flex;
	flex-direction: column;
	overflow: hidden;
	position: fixed;
	top: 0;
	left: 0;
	z-index: ${props => props.theme.zIndices.modal};
	padding-top: env(safe-area-inset-top, 0);
	padding-bottom: env(safe-area-inset-bottom, 0);
	-webkit-overflow-scrolling: touch;

	width: ${({ $isCollapsed, $isMobile }) => {
		if ($isMobile) return '85%'
		return $isCollapsed ? '80px' : '280px'
	}};
	max-width: ${({ $isMobile }) => ($isMobile ? '360px' : 'none')};
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		transform: translateZ(0);
		backface-visibility: hidden;
		perspective: 1000px;
		will-change: transform;
		border-radius: 0 16px 16px 0;
		border-right: 1px solid ${props => props.theme.colors.border.light};
	}
`

const MobileOverlay = styled.div`
	display: none;

	@media (max-width: ${props => props.theme.breakpoints.lg}) {
		display: block;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		z-index: -1;
		touch-action: none;

		/* iOS safe area support */
		@supports (padding: max(0px)) {
			padding-top: env(safe-area-inset-top, 0px);
			padding-bottom: env(safe-area-inset-bottom, 0px);
			padding-left: env(safe-area-inset-left, 0px);
			padding-right: env(safe-area-inset-right, 0px);
		}
	}
`

const Overlay = styled(motion.div)`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.3);
	backdrop-filter: blur(4px);
	-webkit-backdrop-filter: blur(4px);
	z-index: ${props => props.theme.zIndices.overlay};
	touch-action: none;

	@supports (padding: max(0px)) {
		padding-top: env(safe-area-inset-top, 0px);
		padding-bottom: env(safe-area-inset-bottom, 0px);
		padding-left: env(safe-area-inset-left, 0px);
		padding-right: env(safe-area-inset-right, 0px);
	}
`

const MobileMenuButton = styled.button`
	position: fixed;
	top: 15px;
	left: 15px;
	width: 46px;
	height: 46px;
	border-radius: ${props => props.theme.borderRadius.full};
	background: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.text.primary};
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid ${props => props.theme.colors.border.light};
	cursor: pointer;
	font-size: 24px;
	z-index: ${props => props.theme.zIndices.sticky};
	box-shadow: ${props => props.theme.shadows.lg};
	padding: 0;
	-webkit-tap-highlight-color: transparent;
	margin-top: env(safe-area-inset-top, 0);
	touch-action: manipulation;
	transition: all 0.2s ease;
	transform-origin: center;

	&:active {
		transform: scale(0.92);
		background: ${props => props.theme.colors.background.secondary};
	}

	&:hover {
		background: ${props => props.theme.colors.background.secondary};
		border-color: ${props => props.theme.colors.border.light};
	}

	svg {
		width: 26px;
		height: 26px;
		transition: transform 0.3s ease;
	}

	@media (min-width: ${props => props.theme.breakpoints.lg}) {
		display: none;
	}

	@supports (-webkit-touch-callout: none) {
		padding: 12px;
	}
`

const LogoContainer = styled.div<CollapsibleProps>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${props => (props.$isCollapsed ? '0 0.5rem' : '0 1rem')};
	height: 60px;
	background: #ffffff;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};

	@media (max-width: ${props => props.theme.breakpoints.lg}) {
		padding: 0 1rem;
	}
`

const Logo = styled.div`
	font-size: 0.9rem;
	font-weight: 700;
	color: ${props => props.theme.colors.primary[600]};
	white-space: nowrap;
`

const SmallLogo = styled.div`
	font-size: 0.9rem;
	font-weight: bold;
	color: ${props => props.theme.colors.primary[600]};
`

const ToggleButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 30px;
	border-radius: 8px;
	border: none;
	background-color: ${props => props.theme.colors.background.tertiary};
	color: ${props => props.theme.colors.primary[600]};
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};
	margin-left: 0.5rem;
	position: absolute;
	right: 10px;
	z-index: 10;
	box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);

	&:hover {
		background-color: ${props => props.theme.colors.primary[100]};
		color: ${props => props.theme.colors.primary[700]};
	}
`

const MenuContainer = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: ${props => props.theme.spacing[4]} 0;
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[4]};
	background: #ffffff;

	/* Improve scrolling on touch devices */
	-webkit-overflow-scrolling: touch;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding-bottom: env(safe-area-inset-bottom, 20px);
	}

	&::-webkit-scrollbar {
		width: 4px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: 4px;
	}
`

const MenuSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[1]};
`

const SectionLabel = styled(motion.div)`
	font-size: ${props => props.theme.spacing[3]};
	font-weight: 600;
	color: ${props => props.theme.colors.text.tertiary};
	padding: 0 ${props => props.theme.spacing[4]};
	margin-top: ${props => props.theme.spacing[5]};
	margin-bottom: ${props => props.theme.spacing[3]};
	letter-spacing: 0.5px;
`

interface MenuItemContainerProps {
	$isActive: boolean
	$isCollapsed: boolean
}

const MenuItemContainer = styled(NavLink)<MenuItemContainerProps>`
	display: flex;
	align-items: center;
	padding: ${props => props.theme.spacing[4]} ${props => props.theme.spacing[4]};
	position: relative;
	text-decoration: none;
	color: ${props =>
		props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.text.secondary};
	font-weight: ${props => (props.$isActive ? '600' : '400')};
	font-size: 1rem;
	transition: all 0.15s ease;
	background: transparent;

	/* Optimize for touch */
	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding: ${props => props.theme.spacing[4]} ${props => props.theme.spacing[4]};
		min-height: 50px; /* Larger touch target for mobile */
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
		color: ${props =>
			props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.text.primary};
	}

	/* Active state for touch feedback */
	&:active {
		background-color: ${props => `${props.theme.colors.primary[50]}`};
	}

	${({ $isCollapsed }) =>
		$isCollapsed &&
		css`
			justify-content: center;
			padding: ${props => props.theme.spacing[4]} 0;
		`}
`

const IconWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.5rem;
	min-width: 28px;
`

const MenuLabel = styled(motion.span)`
	margin-left: ${props => props.theme.spacing[4]};
	white-space: nowrap;
	font-size: 1rem;
`

const ActiveIndicator = styled(motion.div)`
	position: absolute;
	top: 0;
	left: 0;
	width: 4px;
	height: 100%;
	background-color: ${props => props.theme.colors.primary[600]};
	border-radius: 0 ${props => props.theme.borderRadius.sm} ${props => props.theme.borderRadius.sm} 0;
`

const ProfileSection = styled.div<CollapsibleProps>`
	display: flex;
	align-items: center;
	padding: ${props => props.theme.spacing[4]};
	border-top: 1px solid ${props => props.theme.colors.border.light};
	gap: ${props => props.theme.spacing[3]};
	background: #ffffff;

	${({ $isCollapsed }) =>
		$isCollapsed &&
		css`
			justify-content: center;
			padding: ${props => props.theme.spacing[3]} 0;
		`}
`

const ProfileImage = styled.div`
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.primary[500]};
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-weight: 600;
`

const ProfileInfo = styled(motion.div)`
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
`

const ProfileName = styled.div`
	font-weight: 600;
	font-size: ${props => props.theme.spacing[3.5]};
	color: ${props => props.theme.colors.text.primary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const ProfileRole = styled.div`
	font-size: ${props => props.theme.spacing[3]};
	color: ${props => props.theme.colors.text.tertiary};
`

const SidebarLogoutButton = styled(LogoutButton)`
	padding: 0.5rem;
	background: transparent;

	svg {
		color: ${props => props.theme.colors.text.secondary};
	}

	&:hover {
		svg {
			color: ${props => props.theme.colors.danger[500]};
		}
	}
`

const SubmenuTrigger = styled.div<MenuItemContainerProps>`
	display: flex;
	align-items: center;
	padding: ${props => props.theme.spacing[4]} ${props => props.theme.spacing[4]};
	position: relative;
	text-decoration: none;
	color: ${props =>
		props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.text.secondary};
	font-weight: ${props => (props.$isActive ? '600' : '400')};
	font-size: 1rem;
	transition: all 0.15s ease;
	cursor: pointer;
	background: transparent;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
		color: ${props =>
			props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.text.primary};
	}

	${({ $isCollapsed }) =>
		$isCollapsed &&
		css`
			justify-content: center;
			padding: ${props => props.theme.spacing[4]} 0;
		`}
`

const ChevronIcon = styled(motion.div)`
	margin-left: auto;
	display: flex;
	align-items: center;
	font-size: 1.1rem;
`

const SubMenu = styled(motion.div)`
	margin-left: ${props => props.theme.spacing[6]};
	margin-right: ${props => props.theme.spacing[2]};
	overflow: hidden;
`

interface SubMenuItemProps {
	$isActive: boolean
}

const SubMenuItem = styled(NavLink)<SubMenuItemProps>`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.875rem 0.75rem 0.875rem 2.5rem;
	color: ${props =>
		props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.text.secondary};
	text-decoration: none;
	font-size: 0.95rem;
	font-weight: ${props => (props.$isActive ? '500' : 'normal')};
	transition: all 0.15s ease;
	position: relative;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
		color: ${props =>
			props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.text.primary};
	}

	/* Optimize for touch */
	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding: 0.875rem 0.75rem 0.875rem 2.5rem;
		min-height: 44px; /* Larger touch target for mobile */
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}

	/* Active state for touch feedback */
	&:active {
		background-color: ${props => `${props.theme.colors.primary[50]}`};
	}
`

const SubMenuIcon = styled.span`
	display: flex;
	align-items: center;
	margin-right: ${props => props.theme.spacing[2]};
	font-size: 1.2rem;
`

export default Sidebar
