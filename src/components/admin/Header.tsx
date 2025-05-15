import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { FiSettings, FiUser, FiChevronDown, FiBell, FiPlus } from 'react-icons/fi'
// import { useThemeContext } from '../../App';
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import LogoutButton from '../common/LogoutButton'
import AnnouncementBell from '../common/AnnouncementBell'

const Header: React.FC = () => {
	// const { isDarkMode } = useThemeContext();
	const { user } = useAuth()
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
	const userMenuRef = useRef<HTMLDivElement>(null)
	const navigate = useNavigate()

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
		if (!user) return '?'

		if (user.fullName) {
			const nameParts = user.fullName.split(' ')
			if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
			return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
		}

		// Fallback to the first letter of username
		return user?.firstName?.charAt(0).toUpperCase()
	}

	const getProfilePath = () => {
		if (!user) return '/login'
		return `/${getUserRole()}/profile`
	}

	const handleNewAnnouncement = () => {
		navigate('/admin/announcements/create')
	}

	// Get user role from localStorage
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
		<HeaderContainer>
			<HeaderActions>
				<AnnouncementBell />

				{getUserRole() === 'Admin' && (
					<CreateAnnouncementButton onClick={handleNewAnnouncement}>
						<FiPlus />
						<ButtonText>New Announcement</ButtonText>
					</CreateAnnouncementButton>
				)}

				<UserMenuContainer ref={userMenuRef}>
					<UserAvatar onClick={toggleUserMenu}>
						<AvatarText>{getUserInitials()}</AvatarText>
					</UserAvatar>

					<UserName onClick={toggleUserMenu}>
						{user?.fullName || user?.username || 'User'}
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
									<UserFullName>{user?.fullName || user?.username || 'User'}</UserFullName>
									<UserRole>{getUserRole() || 'No role'}</UserRole>
								</UserInfo>
							</UserMenuHeader>

							<UserMenuDivider />

							<UserMenuItem as={Link} to={getProfilePath()} onClick={handleCloseUserMenu}>
								<MenuItemIcon>
									<FiUser />
								</MenuItemIcon>
								<span>My Profile</span>
							</UserMenuItem>

							<UserMenuItem as={Link} to={`/${getUserRole()}/settings`}>
								<MenuItemIcon>
									<FiSettings />
								</MenuItemIcon>
								<span>Settings</span>
							</UserMenuItem>

							<UserMenuDivider />

							<MenuLogoutButton variant='secondary' size='medium' text='Log out' />
						</UserMenu>
					)}
				</UserMenuContainer>
			</HeaderActions>
		</HeaderContainer>
	)
}

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
	text-decoration: none;

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

const MenuLogoutButton = styled(LogoutButton)`
	width: 100%;
	justify-content: flex-start;
	padding: 0.75rem 1rem;
	border-radius: 0;

	span {
		margin-left: 0.5rem;
	}
`

const CreateAnnouncementButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	border: none;
	border-radius: 4px;
	padding: 0.5rem 0.75rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.primary[600]};
	}

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding: 0.5rem;
	}
`

const ButtonText = styled.span`
	@media (max-width: ${props => props.theme.breakpoints.md}) {
		display: none;
	}
`

export default Header
