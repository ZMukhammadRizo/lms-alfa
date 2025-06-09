import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiBell, FiCalendar, FiCheckCircle, FiSearch, FiX } from 'react-icons/fi'
import styled from 'styled-components'
import { useAuth } from '../../contexts/AuthContext'
import { useAnnouncements } from '../../stores/useAnnouncementStore'

export interface Announcement {
	id: string
	title: string
	content: string
	created_at: string
	isImportant: boolean
	targetAudience: 'all' | 'student' | 'teacher' | 'admin' | 'parent'
	created_by: string | { id: string; name: string }
	created_by_name?: string
	video_url?: string
	photo_url?: string
	video_name?: string
	photo_name?: string
	isRead?: boolean
}

const AnnouncementsPage: React.FC = () => {
	const { t } = useTranslation()
	const {
		announcements,
		isLoading,
		error,
		fetchAnnouncements,
		markAsRead: markAnnouncementAsRead,
		markAllAsRead,
		unreadCount,
	} = useAnnouncements()
	const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const { user } = useAuth()
	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	// Show success message for 3 seconds then hide it
	useEffect(() => {
		if (successMessage) {
			const timer = setTimeout(() => {
				setSuccessMessage(null)
			}, 3000)
			return () => clearTimeout(timer)
		}
	}, [successMessage])

	useEffect(() => {
		// Fetch announcements when component mounts - target Parent and All announcements
		fetchAnnouncements('Parent')

		// Add a refresh every minute to sync with other tabs/windows
		const intervalId = setInterval(() => {
			fetchAnnouncements('Parent')
		}, 60000)

		return () => clearInterval(intervalId)
	}, [fetchAnnouncements])

	const filteredAnnouncements = announcements
		.filter(announcement => {
			// Only show Parent and All announcements
			if (
				announcement.targetAudience.toLowerCase() !== 'all' &&
				announcement.targetAudience.toLowerCase() !== 'parent'
			) {
				return false
			}

			// Apply search term filter
			if (
				searchTerm &&
				!announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
				!announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
			) {
				return false
			}
			return true
		})
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
	}

	const getTargetAudienceText = (audience: string) => {
		switch (audience.toLowerCase()) {
			case 'all':
				return t('parent.announcements.targetAudience.all')
			case 'parent':
				return t('parent.announcements.targetAudience.parent')
			case 'student':
				return t('parent.announcements.targetAudience.student')
			case 'teacher':
				return t('parent.announcements.targetAudience.teacher')
			case 'admin':
				return t('parent.announcements.targetAudience.admin')
			default:
				return audience.charAt(0).toUpperCase() + audience.slice(1)
		}
	}

	const handleMarkAsRead = (id: string) => {
		// Mark the announcement as read in localStorage through the store
		markAnnouncementAsRead(id)

		// Update local selected announcement if it's the one being marked
		if (selectedAnnouncement && selectedAnnouncement.id === id) {
			setSelectedAnnouncement({
				...selectedAnnouncement,
				isRead: true,
			})
		}

		setSuccessMessage(t('parent.announcements.markedAsRead'))
	}

	// Handle mark all as read with proper feedback
	const handleMarkAllAsRead = () => {
		// Mark all announcements as read in localStorage through the store
		markAllAsRead()

		// Update selected announcement if one is selected
		if (selectedAnnouncement) {
			setSelectedAnnouncement({
				...selectedAnnouncement,
				isRead: true,
			})
		}

		setSuccessMessage(t('parent.announcements.allMarkedAsRead'))

		// Force a refresh of announcements to reflect changes
		setTimeout(() => {
			fetchAnnouncements('Parent')
		}, 100)
	}

	return (
		<PageContainer
			as={motion.div}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			<PageHeader>
				<HeaderContent>
					<motion.h1
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.1 }}
					>
						{t('parent.announcements.title')}
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.2 }}
					>
						{t('parent.announcements.description')}
					</motion.p>
				</HeaderContent>
				<SearchAndFilterContainer>
					<SearchBar>
						<SearchIcon>
							<FiSearch />
						</SearchIcon>
						<SearchInput
							type='text'
							placeholder={t('parent.announcements.searchPlaceholder')}
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
						/>
						{searchTerm && (
							<ClearButton onClick={() => setSearchTerm('')}>
								<FiX />
							</ClearButton>
						)}
					</SearchBar>
					{/* Add Mark All as Read button - only shown if there are unread announcements */}
					{unreadCount > 0 && (
						<MarkAllReadButton onClick={handleMarkAllAsRead}>{t('parent.announcements.markAllAsRead')}</MarkAllReadButton>
					)}
				</SearchAndFilterContainer>
			</PageHeader>

			{successMessage && (
				<SuccessMessage>
					<FiCheckCircle size={18} />
					<span>{successMessage}</span>
				</SuccessMessage>
			)}

			<ContentContainer>
				{isLoading ? (
					<LoadingContainer>
						<LoadingSpinner />
						<LoadingText>{t('common.loading')}...</LoadingText>
					</LoadingContainer>
				) : error ? (
					<ErrorContainer>
						<ErrorIcon>!</ErrorIcon>
						<ErrorMessage>{error}</ErrorMessage>
						<ErrorAction onClick={() => fetchAnnouncements('Parent')}>
							{t('common.tryAgain')}
						</ErrorAction>
					</ErrorContainer>
				) : (
					<>
				<AnnouncementsList>
					{filteredAnnouncements.length > 0 ? (
						filteredAnnouncements.map((announcement, index) => (
							<AnnouncementItem
								key={announcement.id}
								$read={announcement.isRead === true}
								$priority={announcement.isImportant ? 'important' : 'normal'}
								as={motion.div}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: index * 0.05 }}
								onClick={() => {
									// Create a copy of the announcement with normalized properties
									const normalizedAnnouncement = {
										...announcement,
										created_by_name: announcement.created_by_name || '',
										isRead: announcement.isRead === true,
									}

									setSelectedAnnouncement(normalizedAnnouncement)

									// If announcement is not read, mark it as read
									if (!announcement.isRead) {
										handleMarkAsRead(announcement.id)
									}
								}}
								$isSelected={selectedAnnouncement?.id === announcement.id}
							>
								<AnnouncementHeader>
									<TargetBadge>
												{getTargetAudienceText(announcement.targetAudience)}
									</TargetBadge>
									<AnnouncementDate>
										<FiCalendar size={14} />
										<span>{formatDate(announcement.created_at)}</span>
									</AnnouncementDate>
								</AnnouncementHeader>
								<AnnouncementTitle>{announcement.title}</AnnouncementTitle>
								<AnnouncementPreview>
									{announcement.content.substring(0, 100)}
									{announcement.content.length > 100 ? '...' : ''}
								</AnnouncementPreview>
								{!announcement.isRead && <UnreadIndicator />}
							</AnnouncementItem>
						))
					) : (
						<NoAnnouncements>
							<FiBell size={40} />
									<p>{t('parent.announcements.noAnnouncements')}</p>
						</NoAnnouncements>
					)}
				</AnnouncementsList>

				<DetailPanel>
					<AnimatePresence mode='wait'>
						{selectedAnnouncement ? (
							<AnnouncementDetail
								key={selectedAnnouncement.id}
								as={motion.div}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.3 }}
							>
								<DetailHeader>
									<DetailHeaderContent>
										<DetailTitle>{selectedAnnouncement.title}</DetailTitle>
										<DetailMeta>
											<TargetBadge>
														{getTargetAudienceText(selectedAnnouncement.targetAudience)}
											</TargetBadge>
											{selectedAnnouncement.isImportant && (
														<ImportantBadge>{t('parent.announcements.important')}</ImportantBadge>
											)}
											<DetailDate>
												<FiCalendar size={14} />
												<span>{formatDate(selectedAnnouncement.created_at)}</span>
											</DetailDate>
										</DetailMeta>
									</DetailHeaderContent>
								</DetailHeader>
								<DetailContent>
									{selectedAnnouncement.content
										.split('\n')
										.map((paragraph, i) =>
											paragraph.trim() ? <p key={i}>{paragraph.trim()}</p> : <br key={i} />
										)}

									{(selectedAnnouncement.video_url || selectedAnnouncement.photo_url) && (
										<MediaContainer>
											{selectedAnnouncement.video_url && (
												<MediaItem
													onClick={e => {
														const element = e.currentTarget
														if (element.requestFullscreen) {
															element.requestFullscreen()
														}
													}}
												>
													<AnnouncementVideo
														controls
														disablePictureInPicture
														controlsList='nodownload'
														autoPlay={false}
													>
														<source src={selectedAnnouncement.video_url} type='video/mp4' />
																{t('parent.announcements.videoNotSupported')}
													</AnnouncementVideo>
												</MediaItem>
											)}
											{selectedAnnouncement.photo_url && (
												<MediaItem
													onClick={e => {
														const element = e.currentTarget
														if (element.requestFullscreen) {
															element.requestFullscreen()
														}
													}}
												>
													<AnnouncementImage
														src={selectedAnnouncement.photo_url}
														alt={selectedAnnouncement.title}
													/>
												</MediaItem>
											)}
										</MediaContainer>
									)}
								</DetailContent>
							</AnnouncementDetail>
						) : (
							<NoAnnouncementSelected
								as={motion.div}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.3 }}
							>
								<FiBell size={50} />
										<p>{t('parent.announcements.selectToView')}</p>
							</NoAnnouncementSelected>
						)}
					</AnimatePresence>
				</DetailPanel>
					</>
				)}
			</ContentContainer>
		</PageContainer>
	)
}

// Styled components
const PageContainer = styled(motion.div)`
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
	overflow-y: auto;
	padding: ${props => props.theme.spacing[5]};
	background-color: ${props => props.theme.colors.background.primary};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding: ${props => props.theme.spacing[4]};
	}
`

const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: ${props => props.theme.spacing[5]};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
		align-items: flex-start;
		gap: ${props => props.theme.spacing[3]};
	}
`

const HeaderContent = styled.div`
	h1 {
		font-size: 1.7rem;
		font-weight: 600;
		color: ${props => props.theme.colors.text.primary};
		margin: 0;
	}

	p {
		font-size: 1rem;
		color: ${props => props.theme.colors.text.secondary};
		margin: ${props => props.theme.spacing[1]} 0 0 0;
	}
`

const SearchAndFilterContainer = styled.div`
	display: flex;
	gap: ${props => props.theme.spacing[3]};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		width: 100%;
	}
`

const SearchBar = styled.div`
	display: flex;
	align-items: center;
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.md};
	padding: 0 ${props => props.theme.spacing[3]};
	width: 280px;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex: 1;
	}
`

const SearchIcon = styled.div`
	color: ${props => props.theme.colors.text.tertiary};
	margin-right: ${props => props.theme.spacing[2]};
`

const SearchInput = styled.input`
	border: none;
	background: transparent;
	padding: ${props => props.theme.spacing[2]};
	width: 100%;
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.95rem;

	&:focus {
		outline: none;
	}

	&::placeholder {
		color: ${props => props.theme.colors.text.tertiary};
	}
`

const ClearButton = styled.button`
	background: none;
	border: none;
	color: ${props => props.theme.colors.text.tertiary};
	cursor: pointer;
	padding: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
		color: ${props => props.theme.colors.text.primary};
	}
`

const SuccessMessage = styled.div`
	background-color: ${props => props.theme.colors.success[50]};
	color: ${props => props.theme.colors.success[700]};
	padding: ${props => props.theme.spacing[3]};
	border-radius: ${props => props.theme.borderRadius.md};
	margin-bottom: ${props => props.theme.spacing[4]};
	font-size: 0.9rem;
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
`

const ContentContainer = styled.div`
	display: grid;
	grid-template-columns: 1fr 1.5fr;
	gap: ${props => props.theme.spacing[4]};
	height: calc(100% - 150px);

	@media (max-width: ${props => props.theme.breakpoints.lg}) {
		grid-template-columns: 1fr;
		height: auto;
	}
`

const AnnouncementsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[3]};
	overflow-y: auto;
	padding-right: ${props => props.theme.spacing[2]};
	max-height: 100%;

	@media (max-width: ${props => props.theme.breakpoints.lg}) {
		max-height: 600px;
	}

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		max-height: 400px;
	}

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background-color: ${props => props.theme.colors.background.hover};
		border-radius: 6px;
	}
`

interface AnnouncementItemProps {
	$read: boolean
	$priority: 'normal' | 'important' | 'urgent'
	$isSelected: boolean
}

const AnnouncementItem = styled.div<AnnouncementItemProps>`
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.md};
	padding: ${props => props.theme.spacing[4]};
	cursor: pointer;
	position: relative;
	border-left: 4px solid transparent;
	transition: all ${props => props.theme.transition.fast};
	opacity: ${props => (props.$read ? 0.85 : 1)};
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

	${({ $priority, theme }) => {
		if ($priority === 'urgent') {
			return `
				border-left-color: ${theme.colors.danger};
				box-shadow: 0 1px 3px ${theme.colors.danger}20;
			`
		} else if ($priority === 'important') {
			return `
				border-left-color: ${theme.colors.warning};
				box-shadow: 0 1px 3px ${theme.colors.warning}20;
			`
		} else {
			return `
				border-left-color: ${theme.colors.primary};
				box-shadow: 0 1px 3px ${theme.colors.primary}20;
			`
		}
	}}

	${({ $isSelected, theme }) =>
		$isSelected &&
		`
		box-shadow: 0 0 0 2px ${theme.colors.primary}40;
	`}

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
		transform: translateY(-1px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
`

const AnnouncementHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: ${props => props.theme.spacing[2]};
`

const TargetBadge = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
	background-color: ${props => props.theme.colors.primary[100]};
	color: ${props => props.theme.colors.primary[700]};
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
`

const ImportantBadge = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
	background-color: ${props => props.theme.colors.warning[100]};
	color: ${props => props.theme.colors.warning[700]};
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
`

const AnnouncementDate = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[1]};
	color: ${props => props.theme.colors.text.tertiary};
	font-size: 0.85rem;

	svg {
		margin-top: -2px;
	}
`

const AnnouncementTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0 0 ${props => props.theme.spacing[2]} 0;
`

const AnnouncementPreview = styled.p`
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.secondary};
	margin: 0;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
`

const UnreadIndicator = styled.div`
	position: absolute;
	top: 12px;
	right: 12px;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.primary};
`

const DetailPanel = styled.div`
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.md};
	overflow: hidden;
	display: flex;
	flex-direction: column;
	height: 100%;

	@media (max-width: ${props => props.theme.breakpoints.lg}) {
		height: auto;
		min-height: 400px;
	}
`

const AnnouncementDetail = styled(motion.div)`
	display: flex;
	flex-direction: column;
	height: 100%;
`

const DetailHeader = styled.div`
	padding: ${props => props.theme.spacing[4]};
	border-bottom: 1px solid ${props => props.theme.colors.border};
`

const DetailHeaderContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[2]};
`

const DetailTitle = styled.h2`
	font-size: 1.3rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
`

const DetailMeta = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: ${props => props.theme.spacing[2]};
`

const DetailDate = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[1]};
	color: ${props => props.theme.colors.text.tertiary};
	font-size: 0.85rem;
	margin-left: ${props => props.theme.spacing[1]};
`

const DetailContent = styled.div`
	padding: ${props => props.theme.spacing[4]};
	overflow-y: auto;
	flex: 1;
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.95rem;
	line-height: 1.5;

	p {
		margin: 0 0 ${props => props.theme.spacing[3]} 0;
	}

	ul,
	ol {
		margin: 0 0 ${props => props.theme.spacing[3]} 0;
		padding-left: ${props => props.theme.spacing[4]};
	}
`

const MediaContainer = styled.div`
	display: flex;
	gap: ${props => props.theme.spacing[3]};
	margin: ${props => props.theme.spacing[3]} 0;
	width: 100%;
`

const MediaItem = styled.div`
	flex: 1;
	min-width: 0;
	cursor: pointer;
	transition: transform ${props => props.theme.transition.fast};

	&:hover {
		transform: scale(1.02);
	}

	&:fullscreen {
		background-color: ${props => props.theme.colors.background.primary};
		display: flex;
		align-items: center;
		justify-content: center;
		padding: ${props => props.theme.spacing[4]};

		img,
		video {
			max-height: 100vh;
			width: auto;
			object-fit: contain;
		}
	}

	&:-webkit-full-screen {
		background-color: ${props => props.theme.colors.background.primary};
		display: flex;
		align-items: center;
		justify-content: center;
		padding: ${props => props.theme.spacing[4]};

		img,
		video {
			max-height: 100vh;
			width: auto;
			object-fit: contain;
		}
	}

	&:-moz-full-screen {
		background-color: ${props => props.theme.colors.background.primary};
		display: flex;
		align-items: center;
		justify-content: center;
		padding: ${props => props.theme.spacing[4]};

		img,
		video {
			max-height: 100vh;
			width: auto;
			object-fit: contain;
		}
	}

	&:-ms-fullscreen {
		background-color: ${props => props.theme.colors.background.primary};
		display: flex;
		align-items: center;
		justify-content: center;
		padding: ${props => props.theme.spacing[4]};

		img,
		video {
			max-height: 100vh;
			width: auto;
			object-fit: contain;
		}
	}
`

const AnnouncementVideo = styled.video`
	width: 100%;
	height: auto;
	max-height: 400px;
	object-fit: contain;
	background-color: ${props => props.theme.colors.background.tertiary};
	border-radius: ${props => props.theme.borderRadius.md};
`

const AnnouncementImage = styled.img`
	width: 100%;
	height: auto;
	max-height: 400px;
	object-fit: contain;
	background-color: ${props => props.theme.colors.background.tertiary};
	border-radius: ${props => props.theme.borderRadius.md};
`

const NoAnnouncementSelected = styled(motion.div)`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	color: ${props => props.theme.colors.text.tertiary};
	gap: ${props => props.theme.spacing[3]};
	padding: ${props => props.theme.spacing[4]};
	text-align: center;

	p {
		font-size: 1rem;
		margin: 0;
	}
`

const NoAnnouncements = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: ${props => props.theme.spacing[6]} 0;
	color: ${props => props.theme.colors.text.tertiary};
	text-align: center;
	gap: ${props => props.theme.spacing[3]};

	p {
		font-size: 1rem;
		margin: 0;
	}
`

const MarkAllReadButton = styled.button`
	display: flex;
	align-items: center;
	background-color: ${props => props.theme.colors.background.secondary};
	color: ${props => props.theme.colors.primary};
	padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
	border-radius: ${props => props.theme.borderRadius.md};
	border: 1px solid ${props => props.theme.colors.primary};
	cursor: pointer;
	font-size: 0.95rem;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.primary}15;
	}
`

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	color: ${props => props.theme.colors.text.primary};
	gap: ${props => props.theme.spacing[3]};
`

const LoadingSpinner = styled.div`
	border: 4px solid ${props => props.theme.colors.background.secondary};
	border-top: 4px solid ${props => props.theme.colors.primary};
	border-radius: 50%;
	width: 40px;
	height: 40px;
	animation: spin 1s linear infinite;

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
`

const LoadingText = styled.p`
	font-size: 1rem;
	font-weight: 500;
	margin: 0;
`

const ErrorContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	color: ${props => props.theme.colors.text.primary};
	gap: ${props => props.theme.spacing[3]};
`

const ErrorIcon = styled.div`
	font-size: 2rem;
`

const ErrorMessage = styled.p`
	font-size: 1rem;
	font-weight: 500;
	margin: 0;
`

const ErrorAction = styled.button`
	background-color: ${props => props.theme.colors.background.secondary};
	color: ${props => props.theme.colors.primary};
	padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
	border-radius: ${props => props.theme.borderRadius.md};
	border: 1px solid ${props => props.theme.colors.primary};
	cursor: pointer;
	font-size: 0.95rem;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.primary}15;
	}
`

export default AnnouncementsPage
