import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { Link, useLocation } from 'react-router-dom'
import { FiBell } from 'react-icons/fi'
import { useAnnouncements } from '../../stores/useAnnouncementStore'

interface AnnouncementBellProps {
	className?: string
}

const AnnouncementBell: React.FC<AnnouncementBellProps> = ({ className }) => {
	const [isOpen, setIsOpen] = useState(false)
	const { announcements, unreadCount, markAsRead, markAllAsRead, fetchAnnouncements } =
		useAnnouncements()
	const dropdownRef = useRef<HTMLDivElement>(null)
	const location = useLocation()
	const [animateNotification, setAnimateNotification] = useState(false)
	const prevUnreadCountRef = useRef(unreadCount)

	const user = JSON.parse(localStorage.getItem('user') || '{}')
	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	// Animation effect when new announcements arrive
	useEffect(() => {
		// If unreadCount has increased, trigger animation
		if (unreadCount > prevUnreadCountRef.current) {
			setAnimateNotification(true)
			
			// Stop animation after a brief period
			const timer = setTimeout(() => {
				setAnimateNotification(false)
			}, 1000)
			
			return () => clearTimeout(timer)
		}
		
		// Update the reference for next comparison
		prevUnreadCountRef.current = unreadCount
	}, [unreadCount])

	useEffect(() => {
		fetchAnnouncements(user.role)
		console.log(announcements)
	}, [])

	const handleBellClick = () => {
		setIsOpen(!isOpen)
	}

	const handleAnnouncementClick = (id: string) => {
		markAsRead(id)
		// In a real app, this might navigate to a detailed view
	}

	const handleMarkAllRead = (e: React.MouseEvent) => {
		e.stopPropagation()
		markAllAsRead()
	}

	const navigateToAllAnnouncements = () => {
		setIsOpen(false)
	}

	// Show only the 5 most recent announcements in the dropdown
	const recentAnnouncements = announcements.slice(0, 5)

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(date)
	}

	return (
		<BellContainer className={className} onClick={handleBellClick}>
			<NotificationButton $animate={animateNotification}>
				<FiBell />
				{unreadCount > 0 && (
					<NotificationBadge>{unreadCount > 9 ? '9+' : unreadCount}</NotificationBadge>
				)}
			</NotificationButton>

			{isOpen && (
				<DropdownContainer ref={dropdownRef}>
					<DropdownHeader>
						<HeaderTitle>Announcements</HeaderTitle>
						{unreadCount > 0 && (
							<MarkAllRead onClick={handleMarkAllRead}>Mark all as read</MarkAllRead>
						)}
					</DropdownHeader>

					<AnnouncementList>
						{recentAnnouncements.length > 0 ? (
							recentAnnouncements.map(announcement => (
								<AnnouncementItem
									key={announcement.id}
									$read={announcement.isRead || false}
									$important={announcement.isImportant}
									onClick={() => handleAnnouncementClick(announcement.id)}
								>
									<AnnouncementContent>
										<AnnouncementTitle>
											{announcement.title}
											{announcement.important && <ImportantTag>Important</ImportantTag>}
										</AnnouncementTitle>

										<AnnouncementTextContent>{announcement.content}</AnnouncementTextContent>

										{announcement.imageUrl && (
											<AnnouncementThumbnail>
												<img src={announcement.imageUrl} alt='' />
											</AnnouncementThumbnail>
										)}

										<AnnouncementMeta>
											<span>{announcement.created_by_name}</span>
											<span>{formatDate(announcement.created_at)}</span>
										</AnnouncementMeta>
									</AnnouncementContent>
								</AnnouncementItem>
							))
						) : (
							<EmptyState>No announcements to display</EmptyState>
						)}
					</AnnouncementList>

					<ViewAllButton
						as={Link}
						to={`/${location.pathname.split('/')[1]}/announcements`}
						onClick={navigateToAllAnnouncements}
					>
						View all announcements
					</ViewAllButton>
				</DropdownContainer>
			)}
		</BellContainer>
	)
}

const BellContainer = styled.div`
	position: relative;
	cursor: pointer;
`

interface NotificationButtonProps {
	$animate?: boolean;
}

const NotificationButton = styled.button<NotificationButtonProps>`
	position: relative;
	background: transparent;
	border: none;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 1.25rem;
	padding: 0.25rem;
	border-radius: 50%;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
	
	${props => props.$animate && `
		animation: bellPulse 1s ease;
	`}
	
	@keyframes bellPulse {
		0% { transform: scale(1); }
		25% { transform: scale(1.2); }
		50% { transform: scale(1); }
		75% { transform: scale(1.1); }
		100% { transform: scale(1); }
	}

	&:hover {
		background: ${props => props.theme.colors.background.hover};
		color: ${props => props.theme.colors.text.primary};
	}
`

const NotificationBadge = styled.span`
	position: absolute;
	top: -5px;
	right: -5px;
	background-color: ${props => props.theme.colors.danger[500]};
	color: white;
	font-size: 0.75rem;
	font-weight: 600;
	width: 18px;
	height: 18px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
`

const DropdownContainer = styled.div`
	position: absolute;
	top: 40px;
	right: -10px;
	width: 320px;
	max-height: 400px;
	background-color: ${props => props.theme.colors.background.secondary};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	z-index: 100;
	overflow: hidden;
	display: flex;
	flex-direction: column;
`

const DropdownHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const HeaderTitle = styled.h3`
	margin: 0;
	font-size: 16px;
	color: ${props => props.theme.colors.text.primary};
`

const MarkAllRead = styled.button`
	background: none;
	border: none;
	color: ${props => props.theme.colors.primary[500]};
	font-size: 12px;
	cursor: pointer;
	padding: 4px;

	&:hover {
		text-decoration: underline;
	}
`

const AnnouncementList = styled.div`
	overflow-y: auto;
	flex-grow: 1;
	max-height: 320px;
`

interface AnnouncementItemProps {
	$read: boolean
	$important: boolean
}

const AnnouncementItem = styled.div<AnnouncementItemProps>`
	padding: 12px 16px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	background-color: ${props =>
		!props.$read ? props.theme.colors.background.tertiary : 'transparent'};
	cursor: pointer;

	${props =>
		props.$important &&
		`
    border-left: 3px solid ${props.theme.colors.danger[500]};
  `}

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}

	&:last-child {
		border-bottom: none;
	}
`

const AnnouncementTitle = styled.h4`
	margin: 0 0 4px 0;
	font-size: 14px;
	color: ${props => props.theme.colors.text.primary};
	display: flex;
	justify-content: space-between;
	align-items: center;
`

const AnnouncementContent = styled.div`
	padding: 8px 0;
`

const AnnouncementTextContent = styled.p`
	margin: 0 0 8px 0;
	font-size: 13px;
	color: ${props => props.theme.colors.text.secondary};
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
`

const AnnouncementThumbnail = styled.div`
	width: 100%;
	height: 80px;
	overflow: hidden;
	border-radius: 4px;
	margin: 8px 0;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
`

const AnnouncementMeta = styled.div`
	display: flex;
	justify-content: space-between;
	font-size: 11px;
	color: ${props => props.theme.colors.text.tertiary};
`

const ImportantTag = styled.span`
	background-color: ${props => props.theme.colors.danger[500]};
	color: white;
	font-size: 10px;
	padding: 2px 6px;
	border-radius: 4px;
	margin-left: 8px;
`

const ViewAllButton = styled.button`
	background-color: transparent;
	border: none;
	border-top: 1px solid ${props => props.theme.colors.border.light};
	color: ${props => props.theme.colors.primary[500]};
	padding: 12px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	text-align: center;
	text-decoration: none;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}
`

const EmptyState = styled.div`
	padding: 20px;
	text-align: center;
	color: ${props => props.theme.colors.text.tertiary};
	font-size: 14px;
`

export default AnnouncementBell
