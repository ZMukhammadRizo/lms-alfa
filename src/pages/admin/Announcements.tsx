import { format } from 'date-fns'
import React, { useEffect, useState } from 'react'
import {
	FiAlertCircle,
	FiAlertTriangle,
	FiCheckCircle,
	FiInfo,
	FiLoader,
	FiPlus,
	FiRefreshCw,
	FiSearch,
	FiTrash2,
	FiUsers,
	FiX,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import ConfirmationModal from '../../components/common/ConfirmationModal'
import supabase from '../../config/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useAnnouncements } from '../../stores/useAnnouncementStore'
import { showError } from '../../utils/toast'

interface AnnouncementFormData {
	title: string
	content: string
	isImportant: boolean
	targetAudience: 'all' | 'student' | 'teacher' | 'admin'
	created_by: string
}

const emptyFormData: AnnouncementFormData = {
	title: '',
	content: '',
	isImportant: false,
	targetAudience: 'all',
	created_by: 'Admin',
}

interface Announcement {
	id: string
	title: string
	content: string
	isImportant: boolean
	targetAudience: string
	created_by: string
	created_at: string
	photo_url?: string
	video_url?: string
	[key: string]: any
}

const Announcements: React.FC = () => {
	const { createAnnouncement, deleteAnnouncement, isLoading, error } = useAnnouncements()
	const { user } = useAuth()
	const [isCreating, setIsCreating] = useState(false)
	const [formData, setFormData] = useState<AnnouncementFormData>(emptyFormData)
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null)
	const [formSubmitting, setFormSubmitting] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)
	const navigate = useNavigate()
	const [searchTerm, setSearchTerm] = useState('')
	const [filterChips, setFilterChips] = useState<string[]>([])
	const [isLoadingRoles, setIsLoadingRoles] = useState(true)
	const [roles, setRoles] = useState<any[]>([])
	const [announcements, setAnnouncements] = useState<Announcement[]>([])
	const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false)

	// Show success message for 3 seconds then hide it
	useEffect(() => {
		if (successMessage) {
			const timer = setTimeout(() => {
				setSuccessMessage(null)
			}, 3000)
			return () => clearTimeout(timer)
		}
	}, [successMessage])

	// Apply additional filters based on filter chips
	const handleFilterChipToggle = (filterValue: string) => {
		if (filterChips.includes(filterValue)) {
			console.log(filterChips)

			setFilterChips(filterChips.filter(chip => chip !== filterValue))
		} else {
			setFilterChips([...filterChips, filterValue])
		}
	}

	// Filter announcements based on chips
	const filteredAnnouncements = announcements

		.filter(announcement => {
			// Apply filter chips
			if (filterChips.length === 0) return true

			// Check important filter
			if (filterChips.includes('isImportant') && !announcement.isImportant) {
				return false
			}

			// Check role filters
			const roleFilters = filterChips.filter(chip => chip !== 'isImportant')
			if (roleFilters.length > 0) {
				if (!roleFilters.includes(announcement.targetAudience)) return false
				if (roleFilters.includes('All') && !roleFilters.includes(announcement.targetAudience))
					return false
				if (roleFilters.includes('All') && roleFilters.includes(announcement.targetAudience))
					return true
				if (roleFilters.includes(announcement.targetAudience)) return true
			}

			return true
		})
		.filter(announcement => {
			// Filter by search term
			if (searchTerm) {
				return (
					announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
				)
			}
			return true
		})
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

	useEffect(() => {
		console.log(filterChips)
	}, [filterChips])

	const handleFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value, type } = e.target

		if (type === 'checkbox') {
			const checked = (e.target as HTMLInputElement).checked
			setFormData(prev => ({ ...prev, [name]: checked }))
		} else {
			setFormData(prev => ({ ...prev, [name]: value }))
		}
	}

	useEffect(() => {
		console.log(formData)
	}, [formData])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.title || !formData.content) {
			setFormError('Please fill out all required fields')
			return
		}

		setFormSubmitting(true)
		setFormError(null)
		try {
			const success = await createAnnouncement({
				...formData,
				targetAudience:
					formData.targetAudience.charAt(0).toUpperCase() + formData.targetAudience.slice(1),
				isImportant: formData.isImportant,
				created_by: user?.id || 'Admin',
				created_at: new Date().toISOString(),
				created_by_name: user?.firstName + ' ' + user?.lastName || user?.role,
			})

			if (success) {
				setIsCreating(false)
				setFormData(emptyFormData)
				setSuccessMessage('Announcement created successfully!')
			} else {
				setFormError('Failed to create announcement. Please try again.')
			}
		} catch (err) {
			console.error('Error creating announcement:', err)
			setFormError('An unexpected error occurred. Please try again.')
		} finally {
			setFormSubmitting(false)
		}
	}

	const handleCancelCreate = () => {
		setIsCreating(false)
		setFormData(emptyFormData)
		setFormError(null)
	}

	const handleDeleteClick = (id: string) => {
		setSelectedAnnouncementId(id)
		setDeleteConfirmOpen(true)
	}

	const handleConfirmDelete = async () => {
		if (selectedAnnouncementId) {
			try {
				const success = await deleteAnnouncement(selectedAnnouncementId)
				if (success) {
					// delete that one specific announcement from the announcements array and from localStorage, and from zustand storage too
					setAnnouncements(prev =>
						prev.filter(announcement => announcement.id !== selectedAnnouncementId)
					)
					localStorage.removeItem('announcements-storage')
					setSuccessMessage('Announcement deleted successfully!')
				}
			} catch (err) {
				console.error('Error deleting announcement:', err)
			} finally {
				setDeleteConfirmOpen(false)
				setSelectedAnnouncementId(null)
			}
		}
	}

	const handleRefresh = async () => {
		setIsLoadingAnnouncements(true)
		try {
			const { data, error } = await supabase
				.from('announcements')
				.select('*')
				.order('created_at', { ascending: false })

			if (error) {
				console.error('Error refreshing announcements:', error)
				showError('Failed to refresh announcements')
			} else {
				setAnnouncements(data || [])
				setSuccessMessage('Announcements refreshed!')
			}
		} catch (err) {
			console.error('Error refreshing announcements:', err)
			showError('Failed to refresh announcements')
		} finally {
			setIsLoadingAnnouncements(false)
		}
	}

	const getTargetDisplay = (target: string) => {
		console.log(target)

		if (target === 'all') return 'All Users'
		const role = roles.find(r => r.name.toLowerCase() === target.toLowerCase())
		return role ? `${role.name}s` : target
	}

	const canManageAnnouncements = user?.role.toLowerCase() === 'admin'

	useEffect(() => {
		const fetchRoles = async () => {
			setIsLoadingRoles(true)
			try {
				const { data } = await supabase.from('roles').select('*').order('name', { ascending: true })
				if (data) {
					setRoles(data)
				}
			} catch (err) {
				console.error('Error fetching roles:', err)
			} finally {
				setIsLoadingRoles(false)
			}
		}
		fetchRoles()
	}, [])

	// Fetch announcements from Supabase
	useEffect(() => {
		const fetchAnnouncements = async () => {
			setIsLoadingAnnouncements(true)
			try {
				const { data, error } = await supabase
					.from('announcements')
					.select('*')
					.order('created_at', { ascending: false })

				if (!data && error) {
					console.error('Error fetching announcements:', error)
					showError('Failed to fetch announcements')
				} else if (data.length === 0) {
					localStorage.removeItem('announcements-storage')
				} else {
					setAnnouncements(data || [])
				}
				// clear announcements from local storage
			} catch (err) {
				console.error('Error fetching announcements:', err)
				showError('Failed to fetch announcements')
			} finally {
				setIsLoadingAnnouncements(false)
			}
		}

		fetchAnnouncements()
	}, [])

	return (
		<Container>
			<Header>
				<div>
					<Title>Announcements</Title>
					<Description>Manage system announcements for all users</Description>
				</div>

				{canManageAnnouncements && (
					<CreateAnnouncementButton
						onClick={() => navigate('/admin/announcements/create')}
						startIcon={<FiPlus />}
						variant='primary'
						disabled={isLoading}
					>
						Create Announcement
					</CreateAnnouncementButton>
				)}
			</Header>

			{error && (
				<ErrorMessage>
					<FiAlertCircle /> {error}
				</ErrorMessage>
			)}

			{successMessage && (
				<SuccessMessage>
					<FiCheckCircle /> {successMessage}
				</SuccessMessage>
			)}

			<ToolBar>
				<SearchBar>
					<FiSearch size={18} />
					<SearchInput
						type='text'
						placeholder='Search announcements...'
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
					/>
					{searchTerm && (
						<ClearButton onClick={() => setSearchTerm('')}>
							<FiX size={16} />
						</ClearButton>
					)}
				</SearchBar>

				<RefreshButton
					onClick={handleRefresh}
					startIcon={isLoadingAnnouncements ? <FiLoader className='spin' /> : <FiRefreshCw />}
					variant='secondary'
					disabled={isLoading}
				>
					Refresh
				</RefreshButton>
			</ToolBar>

			<FilterChipsContainer>
				{roles.map(role => (
					<React.Fragment key={role.id}>
						<FilterChip
							active={filterChips.includes(role.name)}
							onClick={() => handleFilterChipToggle(role.name)}
						>
							<FiUsers size={14} />
							<span>{role.name}s</span>
							{filterChips.includes(role.name) && <FiX size={14} />}
						</FilterChip>
					</React.Fragment>
				))}
				<FilterChip
					active={filterChips.includes('All')}
					onClick={() => handleFilterChipToggle('All')}
				>
					<FiUsers size={14} />
					<span>All</span>
					{filterChips.includes('All') && <FiX size={14} />}
				</FilterChip>

				{filterChips.length > 0 && (
					<ClearFiltersButton onClick={() => setFilterChips([])}>
						Clear all filters
					</ClearFiltersButton>
				)}
			</FilterChipsContainer>

			{isCreating && (
				<FormCard>
					<CardTitle>Create New Announcement</CardTitle>
					{formError && (
						<FormErrorMessage>
							<FiAlertCircle /> {formError}
						</FormErrorMessage>
					)}
					<form onSubmit={handleSubmit}>
						<FormGroup>
							<FormLabel htmlFor='title'>Title*</FormLabel>
							<FormInput
								type='text'
								id='title'
								name='title'
								value={formData.title}
								onChange={handleFormChange}
								placeholder='Enter announcement title'
								required
								disabled={formSubmitting}
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel htmlFor='content'>Content*</FormLabel>
							<FormTextarea
								id='content'
								name='content'
								value={formData.content}
								onChange={handleFormChange}
								placeholder='Enter announcement content'
								rows={4}
								required
								disabled={formSubmitting}
							/>
						</FormGroup>

						<FormRow>
							<FormGroup>
								<FormLabel htmlFor='target'>Target Audience*</FormLabel>
								<FormSelect
									id='target'
									name='target'
									value={formData.targetAudience}
									onChange={handleFormChange}
									disabled={formSubmitting}
								>
									<option value='all'>All Users</option>
									<option value='student'>Students Only</option>
									<option value='teacher'>Teachers Only</option>
									<option value='admin'>Administrators Only</option>
								</FormSelect>
							</FormGroup>

							<FormGroup>
								<FormCheckboxLabel>
									<FormCheckbox
										type='checkbox'
										name='important'
										checked={formData.isImportant}
										onChange={handleFormChange}
										disabled={formSubmitting}
									/>
									<span>Mark as Important</span>
								</FormCheckboxLabel>
							</FormGroup>
						</FormRow>

						<ButtonRow>
							<Button
								type='button'
								variant='secondary'
								onClick={handleCancelCreate}
								disabled={formSubmitting}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								variant='primary'
								disabled={formSubmitting}
								isLoading={formSubmitting}
							>
								{formSubmitting ? 'Creating...' : 'Create Announcement'}
							</Button>
						</ButtonRow>
					</form>
				</FormCard>
			)}

			<AnnouncementsList>
				{isLoadingAnnouncements ? (
					<LoadingState>
						<FiLoader className='spin' size={24} />
						<span>Loading announcements...</span>
					</LoadingState>
				) : filteredAnnouncements.length > 0 ? (
					filteredAnnouncements.map(announcement => (
						<AnnouncementItem key={announcement.id} $important={announcement.isImportant}>
							<AnnouncementHeader>
								<AnnouncementTitle>{announcement.title}</AnnouncementTitle>
								<HeaderBadges>
									{announcement.isImportant && (
										<ImportantBadge>
											<FiAlertTriangle size={14} />
											<span>Important</span>
										</ImportantBadge>
									)}
									<TargetBadge>
										<FiUsers size={14} />
										<span>{getTargetDisplay(announcement.targetAudience)}</span>
									</TargetBadge>
								</HeaderBadges>
							</AnnouncementHeader>
							{(announcement.video_url || announcement.photo_url) && (
								<MediaContainer>
									{announcement.video_url && (
										<MediaItem>
											<AnnouncementVideo
												controls
												disablePictureInPicture
												controlsList='nodownload'
												autoPlay={false}
												onClick={e => e.currentTarget.requestFullscreen()}
											>
												<source src={announcement.video_url} type='video/mp4' />
												Your browser does not support the video tag.
											</AnnouncementVideo>
										</MediaItem>
									)}
									{announcement.photo_url && (
										<MediaItem
											onClick={e => {
												const element = e.currentTarget
												if (element.requestFullscreen) {
													element.requestFullscreen()
												} else if (element.webkitRequestFullscreen) {
													element.webkitRequestFullscreen()
												} else if (element.msRequestFullscreen) {
													element.msRequestFullscreen()
												}
											}}
										>
											<AnnouncementImage src={announcement.photo_url} alt={announcement.title} />
										</MediaItem>
									)}
								</MediaContainer>
							)}

							<AnnouncementBody>{announcement.content}</AnnouncementBody>

							<AnnouncementMeta>
								<MetaInfo>
									<span>Posted by {announcement.created_by_name}</span>
									<span>•</span>
									<span>{format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}</span>
								</MetaInfo>

								{canManageAnnouncements && (
									<DeleteButton onClick={() => handleDeleteClick(announcement.id)}>
										<FiTrash2 size={16} />
									</DeleteButton>
								)}
							</AnnouncementMeta>
						</AnnouncementItem>
					))
				) : (
					<EmptyState>
						<FiInfo size={48} />
						<EmptyStateTitle>No announcements found</EmptyStateTitle>
						<EmptyStateDescription>
							{searchTerm || filterChips.length > 0
								? 'Try adjusting your filters or search term'
								: 'There are no announcements created yet'}
						</EmptyStateDescription>
					</EmptyState>
				)}
			</AnnouncementsList>

			<ConfirmationModal
				isOpen={deleteConfirmOpen}
				onCancel={() => setDeleteConfirmOpen(false)}
				onConfirm={handleConfirmDelete}
				title='Delete Announcement'
				message='Are you sure you want to delete this announcement? This action cannot be undone.'
				confirmText='Delete'
				cancelText='Cancel'
				isDanger={true}
			/>
		</Container>
	)
}

// Styled components
const Container = styled.div`
	padding: 24px;
	max-width: 1200px;
	margin: 0 auto;
`

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
`

const Title = styled.h1`
	font-size: 24px;
	font-weight: 600;
	margin: 0;
	color: ${props => props.theme.colors.text.primary};
`

const Description = styled.p`
	font-size: 14px;
	color: ${props => props.theme.colors.text.secondary};
	margin: 8px 0 0 0;
`

const ToolBar = styled.div`
	display: flex;
	gap: 16px;
	margin-bottom: 24px;
	flex-wrap: wrap;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		flex-direction: column;
		gap: 12px;
	}
`

const SearchBar = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	background-color: ${props => props.theme.colors.background.secondary};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 6px;
	padding: 0 12px;
	flex: 1;
	max-width: 400px;
	transition: all 0.2s ease-in-out;

	&:focus-within {
		border-color: ${props => props.theme.colors.primary[500]};
		box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
	}

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		max-width: none;
	}
`

const SearchInput = styled.input`
	border: none;
	background: transparent;
	padding: 10px 0;
	flex: 1;
	font-size: 14px;
	color: ${props => props.theme.colors.text.primary};

	&:focus {
		outline: none;
	}

	&::placeholder {
		color: ${props => props.theme.colors.text.tertiary};
	}
`

const CreateAnnouncementButton = styled(Button)`
	white-space: nowrap;
`

const RefreshButton = styled(Button)`
	white-space: nowrap;

	svg.spin {
		animation: spin 1.5s linear infinite;
	}

	@keyframes spin {
		100% {
			transform: rotate(360deg);
		}
	}
`

const AnnouncementsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`

interface AnnouncementItemProps {
	$important: boolean
}

const AnnouncementItem = styled.div<AnnouncementItemProps>`
	background-color: ${props => props.theme.colors.background.secondary};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	transition: box-shadow 0.2s ease;
	padding: 20px;

	${props =>
		props.$important &&
		`
    border-left: 4px solid ${props.theme.colors.warning[500]};
  `}

	&:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}
`

const AnnouncementHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 12px;
	margin-bottom: 12px;
`

const HeaderBadges = styled.div`
	display: flex;
	gap: 8px;
	flex-shrink: 0;
`

const AnnouncementTitle = styled.h3`
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
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

const AnnouncementBody = styled.div`
	font-size: 14px;
	line-height: 1.6;
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: 16px;
	white-space: pre-line;
`

const AnnouncementMeta = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`

const MetaInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	color: ${props => props.theme.colors.text.tertiary};
`

const DeleteButton = styled.button`
	background: none;
	border: none;
	color: ${props => props.theme.colors.danger[500]};
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.danger[50]};
	}
`

const EmptyState = styled.div`
	text-align: center;
	padding: 48px 24px;
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: 8px;
	color: ${props => props.theme.colors.text.tertiary};
`

const EmptyStateTitle = styled.h3`
	margin: 16px 0 8px;
	font-size: 18px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const EmptyStateDescription = styled.p`
	margin: 0;
	font-size: 14px;
	color: ${props => props.theme.colors.text.secondary};
	max-width: 400px;
	margin: 0 auto;
`

const FormCard = styled.div`
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: 8px;
	border: 1px solid ${props => props.theme.colors.border.light};
	padding: 24px;
	margin-bottom: 24px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`

const CardTitle = styled.h3`
	margin: 0 0 20px 0;
	font-size: 18px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const FormGroup = styled.div`
	margin-bottom: 16px;
`

const FormLabel = styled.label`
	display: block;
	margin-bottom: 8px;
	font-size: 14px;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const FormInput = styled.input`
	width: 100%;
	padding: 10px 12px;
	font-size: 14px;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 6px;
	background-color: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.text.primary};

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[500]};
		box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
	}

	&:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
`

const FormTextarea = styled.textarea`
	width: 100%;
	padding: 10px 12px;
	font-size: 14px;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 6px;
	background-color: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.text.primary};
	resize: vertical;
	min-height: 120px;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[500]};
		box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
	}

	&:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
`

const FormSelect = styled.select`
	width: 100%;
	padding: 10px 12px;
	font-size: 14px;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 6px;
	background-color: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.text.primary};

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[500]};
		box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
	}

	&:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
`

const FormRow = styled.div`
	display: flex;
	gap: 16px;
	margin-bottom: 16px;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		flex-direction: column;
		gap: 8px;
	}
`

const FormCheckboxLabel = styled.label`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	color: ${props => props.theme.colors.text.primary};
	cursor: pointer;
	margin-top: 24px;
`

const FormCheckbox = styled.input`
	margin: 0;
`

const ButtonRow = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	margin-top: 24px;
`

const FormErrorMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	color: ${props => props.theme.colors.danger[500]};
	background-color: ${props => props.theme.colors.danger[50]};
	padding: 12px;
	border-radius: 6px;
	margin-bottom: 16px;
	font-size: 14px;
`

const ErrorMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	color: ${props => props.theme.colors.danger[600]};
	background-color: ${props => props.theme.colors.danger[50]};
	padding: 12px 16px;
	border-radius: 6px;
	margin-bottom: 16px;
	font-size: 14px;
`

const SuccessMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	color: ${props => props.theme.colors.success[600]};
	background-color: ${props => props.theme.colors.success[50]};
	padding: 12px 16px;
	border-radius: 6px;
	margin-bottom: 16px;
	font-size: 14px;
`

const FilterChipsContainer = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 16px;
`

interface FilterChipProps {
	active: boolean
}

const FilterChip = styled.div<FilterChipProps>`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 10px;
	border-radius: 16px;
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	${({ active, theme }) =>
		active
			? `
      background-color: ${theme.colors.primary[100]};
      color: ${theme.colors.primary[700]};
      border: 1px solid ${theme.colors.primary[300]};
    `
			: `
      background-color: ${theme.colors.background.secondary};
      color: ${theme.colors.text.secondary};
      border: 1px solid ${theme.colors.border.light};
    `}

	&:hover {
		background-color: ${props =>
			props.active ? props.theme.colors.primary[200] : props.theme.colors.background.tertiary};
	}
`

const MediaContainer = styled.div`
	display: flex;
	gap: 16px;
	margin-bottom: 16px;
	width: 100%;
`

const MediaItem = styled.div`
	flex: 1;
	min-width: 0;
	cursor: pointer;
	transition: transform 0.2s ease;

	&:hover {
		transform: scale(1.02);
	}

	&:fullscreen {
		background-color: ${props => props.theme.colors.background.primary};
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;

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
		padding: 20px;

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
		padding: 20px;

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
		padding: 20px;

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
	border-radius: 8px;
`

const AnnouncementImage = styled.img`
	width: 100%;
	height: auto;
	max-height: 400px;
	object-fit: contain;
	background-color: ${props => props.theme.colors.background.tertiary};
	border-radius: 8px;
`

const ClearFiltersButton = styled.button`
	background: none;
	border: none;
	font-size: 12px;
	color: ${props => props.theme.colors.primary[600]};
	cursor: pointer;
	padding: 4px 8px;

	&:hover {
		text-decoration: underline;
	}
`

const ClearButton = styled.button`
	background: none;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${props => props.theme.colors.text.tertiary};
	cursor: pointer;
	padding: 2px;
	border-radius: 50%;

	&:hover {
		color: ${props => props.theme.colors.text.primary};
		background-color: ${props => props.theme.colors.background.tertiary};
	}
`

const LoadingState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 32px;
	color: ${props => props.theme.colors.text.secondary};

	svg.spin {
		animation: spin 1.5s linear infinite;
	}

	@keyframes spin {
		100% {
			transform: rotate(360deg);
		}
	}
`

export default Announcements
