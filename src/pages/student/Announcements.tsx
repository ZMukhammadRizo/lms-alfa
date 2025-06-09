import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FiBell, FiCalendar, FiChevronDown, FiFilter, FiSearch, FiX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { useAuth } from '../../contexts/AuthContext'
import { useAnnouncements } from '../../stores/useAnnouncementStore'

export interface Announcement {
	id: string
	title: string
	content: string
	created_at: string
	isImportant: boolean
	targetAudience: 'all' | 'student' | 'teacher' | 'admin'
	created_by: string | { id: string; name: string }
	created_by_name?: string
	video_url?: string
	photo_url?: string
	video_name?: string
	photo_name?: string
	isRead?: boolean
}

interface FilterOptions {
	category: string[]
	priority: string[]
	readStatus: string[]
}

const Announcements: React.FC = () => {
	const { t } = useTranslation()
	const {
		announcements,
		isLoading,
		error,
		fetchAnnouncements,
		markAsRead: markAnnouncementAsRead,
		markAllAsRead,
	} = useAnnouncements()
	const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [showFilters, setShowFilters] = useState(false)
	const [filters, setFilters] = useState<FilterOptions>({
		category: [],
		priority: [],
		readStatus: [],
	})
	const { user } = useAuth()

	useEffect(() => {
		// Fetch announcements when component mounts
		fetchAnnouncements('Student')

		// Add a refresh every minute to sync with other tabs/windows
		const intervalId = setInterval(() => {
			fetchAnnouncements('Student')
		}, 60000)

		return () => clearInterval(intervalId)
	}, [fetchAnnouncements])

	const filteredAnnouncements = announcements
		.filter(announcement => {
			// Apply search term filter
			if (
				searchTerm &&
				!announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
				!announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
			) {
				return false
			}

			// Apply read status filter
			if (filters.readStatus.length > 0) {
				if (filters.readStatus.includes('read') && !announcement.isRead) return false
				if (filters.readStatus.includes('unread') && announcement.isRead) return false
			}

			return true
		})
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

	const toggleFilter = (type: keyof FilterOptions, value: string) => {
		setFilters(prev => {
			const currentFilters = [...prev[type]]
			const index = currentFilters.indexOf(value)

			if (index === -1) {
				currentFilters.push(value)
			} else {
				currentFilters.splice(index, 1)
			}

			return {
				...prev,
				[type]: currentFilters,
			}
		})
	}

	const clearFilters = () => {
		setFilters({
			category: [],
			priority: [],
			readStatus: [],
		})
		setSearchTerm('')
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
	}

	const handleMarkAsRead = (id: string) => {
		markAnnouncementAsRead(id)

		// Update local selected announcement if it's the one being marked
		if (selectedAnnouncement && selectedAnnouncement.id === id) {
			setSelectedAnnouncement({
				...selectedAnnouncement,
				isRead: true,
			})
		}
	}

	// Handle mark all as read with proper feedback
	const handleMarkAllAsRead = () => {
		markAllAsRead()

		// Update selected announcement if one is selected
		if (selectedAnnouncement) {
			setSelectedAnnouncement({
				...selectedAnnouncement,
				isRead: true,
			})
		}

		// Force a refresh of announcements to reflect changes
		setTimeout(() => {
			fetchAnnouncements('Student')
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
						{t('student.announcements.title')}
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.2 }}
					>
						{t('student.announcements.subtitle')}
					</motion.p>
				</HeaderContent>
				<SearchAndFilterContainer>
					<SearchBar>
						<SearchIcon>
							<FiSearch />
						</SearchIcon>
						<SearchInput
							type='text'
							placeholder={t('student.announcements.searchPlaceholder')}
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
						/>
						{searchTerm && (
							<ClearButton onClick={() => setSearchTerm('')}>
								<FiX />
							</ClearButton>
						)}
					</SearchBar>
					<FilterButton onClick={() => setShowFilters(!showFilters)}>
						<FiFilter />
						<span>{t('student.announcements.filter')}</span>
						<FiChevronDown
							style={{
								transform: showFilters ? 'rotate(180deg)' : 'rotate(0)',
								transition: 'transform 0.3s',
							}}
						/>
					</FilterButton>
					{/* Add Mark All as Read button */}
					{announcements.filter(a => !a.isRead).length > 0 && (
						<MarkAllReadButton onClick={handleMarkAllAsRead}>{t('student.announcements.markAllRead')}</MarkAllReadButton>
					)}
				</SearchAndFilterContainer>
			</PageHeader>

			<AnimatePresence>
				{showFilters && (
					<FiltersContainer
						as={motion.div}
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.3 }}
					>
						<FilterSection>
							<FilterTitle>{t('student.announcements.filters.category')}</FilterTitle>
							<FilterOptions>
								<FilterCheckbox>
									<input
										type='checkbox'
										id='general'
										checked={filters.category.includes('general')}
										onChange={() => toggleFilter('category', 'general')}
									/>
									<label htmlFor='general'>{t('student.announcements.filters.general')}</label>
								</FilterCheckbox>
								<FilterCheckbox>
									<input
										type='checkbox'
										id='course'
										checked={filters.category.includes('course')}
										onChange={() => toggleFilter('category', 'course')}
									/>
									<label htmlFor='course'>{t('student.announcements.filters.course')}</label>
								</FilterCheckbox>
								<FilterCheckbox>
									<input
										type='checkbox'
										id='event'
										checked={filters.category.includes('event')}
										onChange={() => toggleFilter('category', 'event')}
									/>
									<label htmlFor='event'>{t('student.announcements.filters.events')}</label>
								</FilterCheckbox>
								<FilterCheckbox>
									<input
										type='checkbox'
										id='administrative'
										checked={filters.category.includes('administrative')}
										onChange={() => toggleFilter('category', 'administrative')}
									/>
									<label htmlFor='administrative'>{t('student.announcements.filters.administrative')}</label>
								</FilterCheckbox>
							</FilterOptions>
						</FilterSection>

						<FilterSection>
							<FilterTitle>{t('student.announcements.filters.priority')}</FilterTitle>
							<FilterOptions>
								<FilterCheckbox>
									<input
										type='checkbox'
										id='urgent'
										checked={filters.priority.includes('urgent')}
										onChange={() => toggleFilter('priority', 'urgent')}
									/>
									<label htmlFor='urgent'>{t('student.announcements.filters.urgent')}</label>
								</FilterCheckbox>
								<FilterCheckbox>
									<input
										type='checkbox'
										id='important'
										checked={filters.priority.includes('important')}
										onChange={() => toggleFilter('priority', 'important')}
									/>
									<label htmlFor='important'>{t('student.announcements.filters.important')}</label>
								</FilterCheckbox>
								<FilterCheckbox>
									<input
										type='checkbox'
										id='normal'
										checked={filters.priority.includes('normal')}
										onChange={() => toggleFilter('priority', 'normal')}
									/>
									<label htmlFor='normal'>{t('student.announcements.filters.normal')}</label>
								</FilterCheckbox>
							</FilterOptions>
						</FilterSection>

						<FilterSection>
							<FilterTitle>{t('student.announcements.filters.status')}</FilterTitle>
							<FilterOptions>
								<FilterCheckbox>
									<input
										type='checkbox'
										id='read'
										checked={filters.readStatus.includes('read')}
										onChange={() => toggleFilter('readStatus', 'read')}
									/>
									<label htmlFor='read'>{t('student.announcements.filters.read')}</label>
								</FilterCheckbox>
								<FilterCheckbox>
									<input
										type='checkbox'
										id='unread'
										checked={filters.readStatus.includes('unread')}
										onChange={() => toggleFilter('readStatus', 'unread')}
									/>
									<label htmlFor='unread'>{t('student.announcements.filters.unread')}</label>
								</FilterCheckbox>
							</FilterOptions>
						</FilterSection>

						<ClearFiltersButton onClick={clearFilters}>{t('student.announcements.filters.clearAll')}</ClearFiltersButton>
					</FiltersContainer>
				)}
			</AnimatePresence>

			<ContentContainer>
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

									if (!announcement.isRead) {
										handleMarkAsRead(announcement.id)
									}
								}}
								$isSelected={selectedAnnouncement?.id === announcement.id}
							>
								<AnnouncementHeader>
									<CategoryBadge $category={announcement.targetAudience}>
										{announcement.targetAudience.charAt(0).toUpperCase() +
											announcement.targetAudience.slice(1)}
									</CategoryBadge>
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
							<p>{t('student.announcements.noResults')}</p>
							<ClearFiltersButton onClick={clearFilters}>{t('student.announcements.clearFilters')}</ClearFiltersButton>
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
											<CategoryBadge $category={selectedAnnouncement.targetAudience}>
												{selectedAnnouncement.targetAudience.charAt(0).toUpperCase() +
													selectedAnnouncement.targetAudience.slice(1)}
											</CategoryBadge>
											<PriorityBadge
												$priority={selectedAnnouncement.isImportant ? 'important' : 'normal'}
											>
												{selectedAnnouncement.isImportant ? 'Important' : 'Normal'}
											</PriorityBadge>
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
														Your browser does not support the video tag.
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
								<p>Select an announcement to view details</p>
							</NoAnnouncementSelected>
						)}
					</AnimatePresence>
				</DetailPanel>
			</ContentContainer>
		</PageContainer>
	)
}

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

const FilterButton = styled.button`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	background-color: ${props => props.theme.colors.background.secondary};
	color: ${props => props.theme.colors.text.primary};
	padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
	border-radius: ${props => props.theme.borderRadius.md};
	border: none;
	cursor: pointer;
	font-size: 0.95rem;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}

	svg {
		font-size: 1rem;
	}
`

const FiltersContainer = styled(motion.div)`
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.md};
	padding: ${props => props.theme.spacing[4]};
	margin-bottom: ${props => props.theme.spacing[4]};
	display: flex;
	flex-wrap: wrap;
	gap: ${props => props.theme.spacing[5]};
	overflow: hidden;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		flex-direction: column;
		gap: ${props => props.theme.spacing[4]};
	}
`

const FilterSection = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 200px;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		min-width: unset;
	}
`

const FilterTitle = styled.h3`
	font-size: 0.95rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0 0 ${props => props.theme.spacing[2]} 0;
`

const FilterOptions = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[2]};
`

const FilterCheckbox = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};

	input[type='checkbox'] {
		cursor: pointer;
	}

	label {
		font-size: 0.9rem;
		color: ${props => props.theme.colors.text.secondary};
		cursor: pointer;
	}
`

const ClearFiltersButton = styled.button`
	background-color: transparent;
	color: ${props => props.theme.colors.primary};
	border: 1px solid ${props => props.theme.colors.primary};
	border-radius: ${props => props.theme.borderRadius.md};
	padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
	font-size: 0.9rem;
	cursor: pointer;
	transition: all ${props => props.theme.transition.fast};

	&:hover {
		background-color: ${props => props.theme.colors.primary}15;
	}
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

	${({ $priority, theme }) => {
		if ($priority === 'urgent') {
			return `border-left-color: ${theme.colors.danger};`
		} else if ($priority === 'important') {
			return `border-left-color: ${theme.colors.warning};`
		} else {
			return `border-left-color: ${theme.colors.primary};`
		}
	}}

	${({ $isSelected, theme }) =>
		$isSelected &&
		`
    box-shadow: 0 0 0 2px ${theme.colors.primary}40;
  `}

  &:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}
`

const AnnouncementHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: ${props => props.theme.spacing[2]};
`

interface CategoryBadgeProps {
	$category: string
}

const CategoryBadge = styled.div<CategoryBadgeProps>`
	font-size: 0.8rem;
	padding: ${props => props.theme.spacing[1]} ${props => props.theme.spacing[2]};
	border-radius: ${props => props.theme.borderRadius.sm};
	font-weight: 500;

	${({ $category, theme }) => {
		switch ($category) {
			case 'general':
				return `
          background-color: ${theme.colors.primary}20;
          color: ${theme.colors.primary};
        `
			case 'course':
				return `
          background-color: ${theme.colors.success}20;
          color: ${theme.colors.success};
        `
			case 'event':
				return `
          background-color: ${theme.colors.warning}20;
          color: ${theme.colors.warning};
        `
			case 'administrative':
				return `
          background-color: ${theme.colors.purple}20;
          color: ${theme.colors.purple};
        `
			default:
				return `
          background-color: ${theme.colors.primary}20;
          color: ${theme.colors.primary};
        `
		}
	}}
`

interface PriorityBadgeProps {
	$priority: string
}

const PriorityBadge = styled.div<PriorityBadgeProps>`
	font-size: 0.8rem;
	padding: ${props => props.theme.spacing[1]} ${props => props.theme.spacing[2]};
	border-radius: ${props => props.theme.borderRadius.sm};
	font-weight: 500;

	${({ $priority, theme }) => {
		switch ($priority) {
			case 'urgent':
				return `
          background-color: ${theme.colors.danger}20;
          color: ${theme.colors.danger};
        `
			case 'important':
				return `
          background-color: ${theme.colors.warning}20;
          color: ${theme.colors.warning};
        `
			case 'normal':
				return `
          background-color: ${theme.colors.success}20;
          color: ${theme.colors.success};
        `
			default:
				return `
          background-color: ${theme.colors.success}20;
          color: ${theme.colors.success};
        `
		}
	}}
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

const DetailLink = styled.a`
	display: inline-flex;
	align-items: center;
	gap: ${props => props.theme.spacing[1]};
	color: ${props => props.theme.colors.primary};
	font-weight: 500;
	text-decoration: none;
	margin-top: ${props => props.theme.spacing[2]};

	&:hover {
		text-decoration: underline;
	}
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

	button {
		margin-top: ${props => props.theme.spacing[2]};
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

export default Announcements
