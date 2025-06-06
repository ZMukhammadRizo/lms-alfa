import { motion } from 'framer-motion'
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { menuItemPermissionMap } from '../../constants/menuItems'
import { useAuth } from '../../contexts/AuthContext'
import { hasPermission } from '../../utils/authUtils'

interface PermissionMenuItemProps {
	icon: React.ReactNode
	label: string
	to: string
	isCollapsed: boolean
	onMobileClick?: () => void
}

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
	color: ${props => props.theme.colors.text.secondary};
	font-weight: 400;
	font-size: 1rem;
	transition: all 0.15s ease;
	background: transparent;
	cursor: pointer;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
		color: ${props => props.theme.colors.text.primary};
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

const MenuLabel = styled.span`
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

const PermissionMenuItem: React.FC<PermissionMenuItemProps> = ({
	icon,
	label,
	to,
	isCollapsed,
	onMobileClick,
}) => {
	const location = useLocation()
	const { user } = useAuth()
	const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`)
	const requiredPermission = menuItemPermissionMap[to]

	const handleClick = () => {
		if (onMobileClick) {
			onMobileClick()
		}
	}

	// Check if this is an admin panel route
	const isAdminRoute = to.startsWith('/admin/')

	// Check if this is the module leader's subject management page
	const isModuleLeaderSubjectsPage =
		to.includes('/subjects') &&
		typeof user?.role === 'object' &&
		user.role.name === 'ModuleLeader' &&
		user.role.parent?.name === 'Teacher'

	const hasAccess = hasPermission(requiredPermission)

	// For admin routes, use permission checks
	if (isAdminRoute && hasAccess) {
		return (
			<MenuItemContainer
				to={to}
				$isActive={isActive}
				$isCollapsed={isCollapsed}
				onClick={handleClick}
			>
				<IconWrapper>{icon}</IconWrapper>
				{!isCollapsed && <MenuLabel>{label}</MenuLabel>}
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

	// For module leader's subject management page, check manage_subjects permission
	if (isModuleLeaderSubjectsPage) {
		if (!hasPermission('access_teacher_subjects')) {
			return null
		}
	}

	// For all other routes (parent, teacher, student panels), render without permission checks
	return (
		<MenuItemContainer
			to={to}
			$isActive={isActive}
			$isCollapsed={isCollapsed}
			onClick={handleClick}
		>
			<IconWrapper>{icon}</IconWrapper>
			{!isCollapsed && <MenuLabel>{label}</MenuLabel>}
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

export default PermissionMenuItem
