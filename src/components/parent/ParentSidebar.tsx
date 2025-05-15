import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiMenu } from 'react-icons/fi'
import { NavLink, useLocation } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { getSystemMenu, parentMenu } from '../../constants/menuItems'
import { useAuth } from '../../contexts/AuthContext'
import LogoutButton from '../common/LogoutButton'

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

const ParentSidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar, onMobileToggle }) => {
	const [isMobile, setIsMobile] = useState(false)
	const [isMobileOpen, setIsMobileOpen] = useState(false)
	const { user } = useAuth()

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

	const handleMobileToggle = () => {
		const newState = !isMobileOpen
		setIsMobileOpen(newState)
		if (onMobileToggle) {
			onMobileToggle(newState)
		}
	}

	// Create memoized version of handleMobileToggle for event listener
	const memoizedHandleMobileToggle = useCallback(() => {
		setIsMobileOpen(false)
		if (onMobileToggle) {
			onMobileToggle(false)
		}
	}, [onMobileToggle])

	// Effect to handle scroll lock when mobile menu is open
	useEffect(() => {
		if (isMobile) {
			if (isMobileOpen) {
				// Lock body scroll when mobile menu is open
				document.body.style.overflow = 'hidden'
				document.body.style.position = 'fixed'
				document.body.style.width = '100%'
				document.body.style.top = `-${window.scrollY}px`

				// Add escape key listener to close sidebar
				const handleEscape = (e: KeyboardEvent) => {
					if (e.key === 'Escape') {
						memoizedHandleMobileToggle()
					}
				}
				document.addEventListener('keydown', handleEscape)
				return () => document.removeEventListener('keydown', handleEscape)
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
	}, [isMobileOpen, isMobile, memoizedHandleMobileToggle])

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
		if (!user || !user.username) return 'P'

		if (user.fullName) {
			const nameParts = user.fullName.split(' ')
			if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
			return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
		}

		return user?.username?.charAt(0).toUpperCase() || 'P'
	}

	// Get full name display
	const getFullName = () => {
		return user?.fullName || user?.username || 'Parent'
	}

	// Get system menu items for parent role
	const systemMenu = getSystemMenu('parent')

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
								{parentMenu.map(item => (
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

							<MenuSection>
								<AnimatePresence>
									{(!isCollapsed || isMobile) && (
										<SectionLabel
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ delay: 0.2 }}
										>
											System
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
										<ProfileRole>Parent</ProfileRole>
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
	box-shadow: ${props => props.theme.shadows?.lg || '0 10px 15px rgba(0, 0, 0, 0.07)'};
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

	@media (max-width: ${props => props.theme.breakpoints?.md}) {
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

	@media (max-width: ${props => props.theme.breakpoints?.lg}) {
		display: block;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: -1;
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
	top: 12px;
	left: 12px;
	z-index: ${props => props.theme.zIndices.modal + 1};
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	border: none;
	width: 40px;
	height: 40px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	box-shadow: ${props => props.theme.shadows?.md || '0 4px 6px rgba(0, 0, 0, 0.1)'};

	&:active {
		transform: scale(0.96);
	}

	svg {
		font-size: 24px;
	}
`

const LogoContainer = styled.div<CollapsibleProps>`
	height: 64px;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	padding: ${props => (props.$isCollapsed ? '0 12px' : '0 0 0 16px')};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	background: #ffffff;
	position: relative;
	width: 100%;
	overflow: visible;
`

const Logo = styled.div`
	font-size: 0.9rem;
	font-weight: 700;
	color: ${props => props.theme.colors.primary[600]};
	white-space: nowrap;
	user-select: none;
	flex: 1;
	max-width: 100%;
	padding-right: 40px;
	line-height: 1.2;
	overflow: visible;

	span {
		opacity: 1 !important;
		display: inline-block;
		white-space: nowrap;
		overflow: visible;
	}

	@media (max-width: ${props => props.theme.breakpoints?.lg}) {
		font-size: 0.85rem;
	}

	@media (max-width: ${props => props.theme.breakpoints?.md}) {
		font-size: 0.8rem;
	}
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
	width: 24px;
	height: 24px;
	border-radius: 50%;
	border: none;
	background-color: ${props => props.theme.colors.primary[50]};
	color: ${props => props.theme.colors.primary[600]};
	cursor: pointer;
	transition: all 0.2s ease;
	margin-left: 0;
	position: absolute;
	right: 12px;
	z-index: 10;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

	&:hover {
		background-color: ${props => props.theme.colors.primary[100]};
	}

	svg {
		width: 16px;
		height: 16px;
	}
`

const CloseButton = styled(ToggleButton)`
	color: ${props => props.theme.colors.text.secondary};

	&:hover {
		color: ${props => props.theme.colors.text.primary};
	}
`

const MenuContainer = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 12px 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
	background: #ffffff;

	/* Improve scrolling on touch devices */
	-webkit-overflow-scrolling: touch;

	&::-webkit-scrollbar {
		width: 4px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 4px;
	}

	@media (max-width: ${props => props.theme.breakpoints?.md}) {
		padding-bottom: env(safe-area-inset-bottom, 20px);
	}
`

const MenuSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`

const SectionLabel = styled(motion.div)`
	font-size: 11px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.tertiary};
	padding: 0 24px;
	margin-top: 16px;
	margin-bottom: 8px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`

interface MenuItemContainerProps {
	$isActive: boolean
	$isCollapsed: boolean
}

const MenuItemContainer = styled(NavLink)<MenuItemContainerProps>`
	display: flex;
	align-items: center;
	padding: ${props => (props.$isCollapsed ? '10px' : '10px 16px')};
	margin: 2px 8px;
	border-radius: 8px;
	text-decoration: none;
	color: ${props =>
		props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.text.secondary};
	font-weight: ${props => (props.$isActive ? 600 : 500)};
	position: relative;
	transition: all 0.3s ease;
	justify-content: ${props => (props.$isCollapsed ? 'center' : 'flex-start')};

	&:hover {
		background-color: rgba(0, 0, 0, 0.03);
		color: ${props => props.theme.colors.text.primary};
	}

	&[aria-current='page'] {
		background-color: ${props => props.theme.colors.primary[50]};
	}
`

const IconWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20px;
	min-width: 24px;
	transition: transform 0.2s ease;
	color: ${props => props.theme.colors.text.secondary};

	${MenuItemContainer}:hover & {
		transform: translateX(2px);
	}

	${MenuItemContainer}[aria-current="page"] & {
		color: ${props => props.theme.colors.primary[600]};
	}
`

const MenuLabel = styled(motion.span)`
	margin-left: 12px;
	font-size: 14px;
	font-weight: inherit;
	flex: 1;
	white-space: nowrap;
	color: inherit;
`

const ActiveIndicator = styled(motion.div)`
	position: absolute;
	left: 0;
	top: 8px;
	bottom: 8px;
	width: 2px;
	background-color: ${props => props.theme.colors.primary[500]};
	border-radius: 0 1px 1px 0;
`

const ProfileSection = styled.div<CollapsibleProps>`
	display: flex;
	align-items: center;
	padding: 16px;
	border-top: 1px solid ${props => props.theme.colors.border.light};
	gap: 12px;
	background: #ffffff;
	margin-top: auto;

	${({ $isCollapsed }) =>
		$isCollapsed &&
		css`
			justify-content: center;
			padding: 12px 0;
		`}
`

const ProfileImage = styled.div`
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.primary[500]};
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-weight: 600;
	font-size: 14px;
`

const ProfileInfo = styled(motion.div)`
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
`

const ProfileName = styled.div`
	font-weight: 600;
	font-size: 13px;
	color: ${props => props.theme.colors.text.primary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const ProfileRole = styled.div`
	font-size: 11px;
	color: ${props => props.theme.colors.text.tertiary};
`

export default ParentSidebar
