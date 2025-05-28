import { AnimatePresence, motion } from 'framer-motion'
import React, { useState } from 'react'
import { FiBell, FiCheck, FiChevronRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useParentStore } from '../../stores/useParentStore'

interface ParentNotificationBellProps {
	basePath?: string
}

const ParentNotificationBell: React.FC<ParentNotificationBellProps> = ({ basePath = '' }) => {
	const [isOpen, setIsOpen] = useState(false)
	const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useParentStore()
	const unreadCount = notifications.filter(notification => !notification.isRead).length

	// Get 5 most recent notifications
	const recentNotifications = [...notifications]
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, 5)

	const toggleOpen = () => {
		setIsOpen(!isOpen)
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		const now = new Date()
		const diffMs = now.getTime() - date.getTime()
		const diffMins = Math.floor(diffMs / 60000)
		const diffHours = Math.floor(diffMins / 60)
		const diffDays = Math.floor(diffHours / 24)

		if (diffMins < 1) return 'Just now'
		if (diffMins < 60) return `${diffMins}m ago`
		if (diffHours < 24) return `${diffHours}h ago`
		if (diffDays === 1) return 'Yesterday'
		return date.toLocaleDateString()
	}

	const getNotificationIcon = (type: string) => {
		switch (type) {
			case 'Attendance':
				return '👤'
			case 'Grade':
				return '📝'
			case 'Assignment':
				return '📚'
			case 'Message':
				return '✉️'
			default:
				return '🔔'
		}
	}

	return (
		<BellContainer>
			<BellIconButton onClick={toggleOpen} aria-label='Notifications'>
				<FiBell size={22} />
				{unreadCount > 0 && <UnreadBadge>{unreadCount}</UnreadBadge>}
			</BellIconButton>

			<AnimatePresence>
				{isOpen && (
					<NotificationsDropdown
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2 }}
					>
						<NotificationsHeader>
							<div>
								<NotificationsTitle>Notifications</NotificationsTitle>
								{unreadCount > 0 && (
									<NotificationsSubtitle>{unreadCount} unread</NotificationsSubtitle>
								)}
							</div>
							{unreadCount > 0 && (
								<MarkAllReadButton onClick={markAllNotificationsAsRead}>
									Mark all as read
								</MarkAllReadButton>
							)}
						</NotificationsHeader>

						<NotificationsList>
							{recentNotifications.length > 0 ? (
								recentNotifications.map(notification => (
									<NotificationItem key={notification.id} $unread={!notification.isRead}>
										<NotificationContent
											onClick={() => markNotificationAsRead(notification.id)}
											as={notification.link ? Link : 'div'}
											to={notification.link || ''}
										>
											<NotificationIcon>{getNotificationIcon(notification.type)}</NotificationIcon>
											<NotificationDetails>
												<NotificationTitle>{notification.title}</NotificationTitle>
												<NotificationMessage>{notification.message}</NotificationMessage>
												<NotificationMeta>
													<NotificationTime>{formatDate(notification.createdAt)}</NotificationTime>
													<NotificationType>{notification.type}</NotificationType>
												</NotificationMeta>
											</NotificationDetails>
										</NotificationContent>
										{!notification.isRead && (
											<MarkReadButton
												onClick={e => {
													e.stopPropagation()
													markNotificationAsRead(notification.id)
												}}
											>
												<FiCheck size={16} />
											</MarkReadButton>
										)}
									</NotificationItem>
								))
							) : (
								<EmptyNotifications>No notifications</EmptyNotifications>
							)}
						</NotificationsList>

						<ViewAllButton to={`${basePath}/notifications`}>
							<span>View all notifications</span>
							<FiChevronRight size={16} />
						</ViewAllButton>
					</NotificationsDropdown>
				)}
			</AnimatePresence>
		</BellContainer>
	)
}

const BellContainer = styled.div`
	position: relative;
`

const BellIconButton = styled.button`
	background: none;
	border: none;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	cursor: pointer;
	color: ${props => props.theme.colors.text.secondary || '#64748b'};
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary || '#f1f5f9'};
		color: ${props => props.theme.colors.text.primary || '#334155'};
	}
`

const UnreadBadge = styled.span`
	position: absolute;
	top: 4px;
	right: 4px;
	min-width: 18px;
	height: 18px;
	border-radius: 9px;
	background-color: ${props => props.theme.colors.danger[500] || '#ef4444'};
	color: white;
	font-size: 10px;
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 4px;
`

const NotificationsDropdown = styled(motion.div)`
	position: absolute;
	top: calc(100% + 8px);
	right: 0;
	width: 360px;
	background-color: ${props => props.theme.colors.background.primary || 'white'};
	border-radius: 8px;
	box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	z-index: 100;
	border: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
`

const NotificationsHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 20px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
`

const NotificationsTitle = styled.h3`
	margin: 0;
	font-size: 16px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary || '#334155'};
`

const NotificationsSubtitle = styled.p`
	margin: 2px 0 0 0;
	font-size: 12px;
	color: ${props => props.theme.colors.text.secondary || '#64748b'};
`

const MarkAllReadButton = styled.button`
	background: none;
	border: none;
	color: ${props => props.theme.colors.primary[500] || '#3b82f6'};
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 4px;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.primary[50] || '#eff6ff'};
	}
`

const NotificationsList = styled.div`
	max-height: 320px;
	overflow-y: auto;
	scrollbar-width: thin;

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-track {
		background: ${props => props.theme.colors.background.lighter || '#f8fafc'};
	}

	&::-webkit-scrollbar-thumb {
		background: ${props => props.theme.colors.neutral[300] || '#cbd5e1'};
		border-radius: 3px;
	}
`

interface NotificationItemProps {
	$unread: boolean
}

const NotificationItem = styled.div<NotificationItemProps>`
	padding: 16px 20px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
	background-color: ${props =>
		props.$unread ? props.theme.colors.background.secondary || '#f8fafc' : 'transparent'};
	cursor: pointer;
	transition: background-color 0.2s ease;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;

	&:hover {
		background-color: ${props => props.theme.colors.background.secondary || '#f8fafc'};
	}
`

const NotificationContent = styled(Link)`
	display: flex;
	align-items: flex-start;
	flex: 1;
	text-decoration: none;
	color: inherit;
`

const NotificationIcon = styled.div`
	margin-right: 12px;
	font-size: 24px;
`

const NotificationDetails = styled.div`
	flex: 1;
`

const NotificationTitle = styled.h4`
	margin: 0 0 4px 0;
	font-size: 14px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary || '#334155'};
`

const NotificationMessage = styled.p`
	margin: 0 0 8px 0;
	font-size: 13px;
	color: ${props => props.theme.colors.text.secondary || '#64748b'};
	line-height: 1.5;
`

const NotificationMeta = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
`

const NotificationTime = styled.span`
	font-size: 12px;
	color: ${props => props.theme.colors.text.tertiary || '#94a3b8'};
`

const NotificationType = styled.span`
	padding: 2px 6px;
	background-color: ${props => props.theme.colors.primary[100] || '#dbeafe'};
	color: ${props => props.theme.colors.primary[700] || '#1d4ed8'};
	border-radius: 4px;
	font-size: 10px;
	font-weight: 500;
`

const MarkReadButton = styled.button`
	background-color: ${props => props.theme.colors.primary[500] || '#3b82f6'};
	color: white;
	border: none;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	flex-shrink: 0;
	margin-left: 12px;

	&:hover {
		background-color: ${props => props.theme.colors.primary[600] || '#2563eb'};
	}
`

const EmptyNotifications = styled.div`
	padding: 32px 20px;
	text-align: center;
	color: ${props => props.theme.colors.text.tertiary || '#94a3b8'};
	font-size: 14px;
`

const ViewAllButton = styled(Link)`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 20px;
	background-color: ${props => props.theme.colors.background.secondary || '#f8fafc'};
	color: ${props => props.theme.colors.primary[500] || '#3b82f6'};
	text-decoration: none;
	font-size: 14px;
	font-weight: 500;
	border-top: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary || '#f1f5f9'};
	}
`

export default ParentNotificationBell
