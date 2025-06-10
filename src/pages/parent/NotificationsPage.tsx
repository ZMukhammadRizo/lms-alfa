import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiClock, FiSearch, FiX } from 'react-icons/fi'
import styled from 'styled-components'
import { PageTitle } from '../../components/common'
import { useParentStore } from '../../stores/useParentStore'

const NotificationsPage: React.FC = () => {
	const { t } = useTranslation()
	const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useParentStore()
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedType, setSelectedType] = useState<string | null>(null)
	const [showUnreadOnly, setShowUnreadOnly] = useState(false)

	// Sort notifications by date (newest first)
	const sortedNotifications = [...notifications].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	)

	// Filter notifications based on search, type, and unread status
	const filteredNotifications = sortedNotifications.filter(notification => {
		// Filter by search term
		const matchesSearch =
			searchTerm === '' ||
			notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			notification.message.toLowerCase().includes(searchTerm.toLowerCase())

		// Filter by type
		const matchesType = selectedType === null || notification.type === selectedType

		// Filter by read status
		const matchesReadStatus = !showUnreadOnly || !notification.isRead

		return matchesSearch && matchesType && matchesReadStatus
	})

	// Get unique notification types for filter dropdown
	const notificationTypes = Array.from(
		new Set(notifications.map(notification => notification.type))
	).sort()

	// Format date in a readable format
	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	// Get notification icon based on type
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

	// Clear all filters
	const clearFilters = () => {
		setSearchTerm('')
		setSelectedType(null)
		setShowUnreadOnly(false)
	}

	return (
		<NotificationsContainer>
			<PageHeader>
				<PageTitle>{t('parent.notifications.title')}</PageTitle>
				<HeaderActions>
					{notifications.some(n => !n.isRead) && (
						<MarkAllReadButton onClick={markAllNotificationsAsRead}>
							{t('parent.notifications.markAllAsRead')}
						</MarkAllReadButton>
					)}
				</HeaderActions>
			</PageHeader>

			<FiltersSection>
				<SearchContainer>
					<SearchIcon>
						<FiSearch size={18} />
					</SearchIcon>
					<SearchInput
						type='text'
						placeholder={t('parent.notifications.searchPlaceholder')}
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
					/>
					{searchTerm && (
						<ClearSearchButton onClick={() => setSearchTerm('')}>
							<FiX size={18} />
						</ClearSearchButton>
					)}
				</SearchContainer>

				<FilterControls>
					<FilterSelect
						value={selectedType || ''}
						onChange={e => setSelectedType(e.target.value || null)}
					>
						<option value=''>{t('parent.notifications.allTypes')}</option>
						{notificationTypes.map(type => (
							<option key={type} value={type}>
								{type}
							</option>
						))}
					</FilterSelect>

					<FilterCheckbox>
						<input
							type='checkbox'
							id='unread-only'
							checked={showUnreadOnly}
							onChange={() => setShowUnreadOnly(!showUnreadOnly)}
						/>
						<label htmlFor='unread-only'>{t('parent.notifications.unreadOnly')}</label>
					</FilterCheckbox>

					{(searchTerm || selectedType || showUnreadOnly) && (
						<ClearFiltersButton onClick={clearFilters}>{t('parent.notifications.clearFilters')}</ClearFiltersButton>
					)}
				</FilterControls>
			</FiltersSection>

			<NotificationsCount>
				{filteredNotifications.length}{' '}
				{filteredNotifications.length === 1 ? t('parent.notifications.notification') : t('parent.notifications.notifications')}
			</NotificationsCount>

			<NotificationsList>
				{filteredNotifications.length > 0 ? (
					filteredNotifications.map(notification => (
						<NotificationItem
							key={notification.id}
							$unread={!notification.isRead}
							onClick={() => markNotificationAsRead(notification.id)}
						>
							<NotificationIconContainer>
								{getNotificationIcon(notification.type)}
							</NotificationIconContainer>
							<NotificationContent>
								<NotificationTitle>{notification.title}</NotificationTitle>
								<NotificationMessage>{notification.message}</NotificationMessage>
								<NotificationMeta>
									<TimeStamp>
										<FiClock size={14} />
										<span>{formatDate(notification.createdAt)}</span>
									</TimeStamp>
									<NotificationType $type={notification.type}>{notification.type}</NotificationType>
								</NotificationMeta>
							</NotificationContent>
							{!notification.isRead && <UnreadIndicator />}
						</NotificationItem>
					))
				) : (
					<EmptyState>
						<EmptyStateText>{t('parent.notifications.noNotifications')}</EmptyStateText>
						{(searchTerm || selectedType || showUnreadOnly) && (
							<EmptyStateSubtext>{t('parent.notifications.tryAdjustingFilters')}</EmptyStateSubtext>
						)}
					</EmptyState>
				)}
			</NotificationsList>
		</NotificationsContainer>
	)
}

const NotificationsContainer = styled.div`
	max-width: 800px;
	margin: 0 auto;
	padding: 24px;
`

const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
`

const HeaderActions = styled.div`
	display: flex;
	gap: 12px;
`

const MarkAllReadButton = styled.button`
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	border: none;
	border-radius: 4px;
	padding: 8px 16px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background-color: ${props => props.theme.colors.primary[600]};
	}
`

const FiltersSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	margin-bottom: 24px;

	@media (min-width: 768px) {
		flex-direction: row;
		align-items: center;
	}
`

const SearchContainer = styled.div`
	position: relative;
	flex: 1;
`

const SearchIcon = styled.div`
	position: absolute;
	left: 12px;
	top: 50%;
	transform: translateY(-50%);
	color: ${props => props.theme.colors.text.secondary};
`

const SearchInput = styled.input`
	width: 100%;
	padding: 10px 12px 10px 40px;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 4px;
	font-size: 14px;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[400]};
		box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
	}
`

const ClearSearchButton = styled.button`
	position: absolute;
	right: 12px;
	top: 50%;
	transform: translateY(-50%);
	background: none;
	border: none;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;

	&:hover {
		color: ${props => props.theme.colors.text.primary};
	}
`

const FilterControls = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
	flex-wrap: wrap;
`

const FilterSelect = styled.select`
	padding: 8px 12px;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 4px;
	font-size: 14px;
	background-color: white;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[400]};
	}
`

const FilterCheckbox = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;

	input {
		margin: 0;
	}

	label {
		font-size: 14px;
		color: ${props => props.theme.colors.text.secondary};
		cursor: pointer;
	}
`

const ClearFiltersButton = styled.button`
	background: none;
	border: none;
	color: ${props => props.theme.colors.primary[500]};
	font-size: 14px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;

	&:hover {
		color: ${props => props.theme.colors.primary[600]};
		text-decoration: underline;
	}
`

const NotificationsCount = styled.div`
	font-size: 14px;
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: 16px;
`

const NotificationsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`

interface NotificationItemProps {
	$unread: boolean
}

const NotificationItem = styled.div<NotificationItemProps>`
	display: flex;
	padding: 16px;
	background-color: ${props =>
		props.$unread
			? props.theme.colors.background.secondary
			: props.theme.colors.background.primary};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 8px;
	position: relative;
	cursor: pointer;
	transition: box-shadow 0.2s, transform 0.2s;

	&:hover {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
		transform: translateY(-2px);
	}
`

const NotificationIconContainer = styled.div`
	font-size: 24px;
	margin-right: 16px;
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: ${props => props.theme.colors.background.tertiary};
	border-radius: 8px;
`

const NotificationContent = styled.div`
	flex: 1;
`

const NotificationTitle = styled.h3`
	margin: 0 0 8px 0;
	font-size: 16px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const NotificationMessage = styled.p`
	margin: 0 0 12px 0;
	font-size: 14px;
	color: ${props => props.theme.colors.text.secondary};
	line-height: 1.5;
`

const NotificationMeta = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 8px;
`

const TimeStamp = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: ${props => props.theme.colors.text.tertiary};
`

interface NotificationTypeProps {
	$type: string
}

const NotificationType = styled.span<NotificationTypeProps>`
	padding: 2px 8px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 500;

	${props => {
		switch (props.$type) {
			case 'Attendance':
				return `
          background-color: ${props.theme.colors.warning[100]};
          color: ${props.theme.colors.warning[700]};
        `
			case 'Grade':
				return `
          background-color: ${props.theme.colors.success[100]};
          color: ${props.theme.colors.success[700]};
        `
			case 'Assignment':
				return `
          background-color: ${props.theme.colors.info[100]};
          color: ${props.theme.colors.info[700]};
        `
			case 'Message':
				return `
          background-color: ${props.theme.colors.primary[100]};
          color: ${props.theme.colors.primary[700]};
        `
			default:
				return `
          background-color: ${props.theme.colors.neutral[100]};
          color: ${props.theme.colors.neutral[700]};
        `
		}
	}}
`

const UnreadIndicator = styled.div`
	position: absolute;
	top: 16px;
	right: 16px;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.primary[500]};
`

const EmptyState = styled.div`
	padding: 48px 0;
	text-align: center;
`

const EmptyStateText = styled.p`
	font-size: 16px;
	font-weight: 500;
	color: ${props => props.theme.colors.text.secondary};
	margin: 0 0 8px 0;
`

const EmptyStateSubtext = styled.p`
	font-size: 14px;
	color: ${props => props.theme.colors.text.tertiary};
	margin: 0;
`

export default NotificationsPage
