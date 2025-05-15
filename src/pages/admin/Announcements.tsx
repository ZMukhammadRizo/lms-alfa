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
	FiEdit,
	FiUploadCloud,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import ConfirmationModal from '../../components/common/ConfirmationModal'
import supabase from '../../config/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useAnnouncements, UpdateAnnouncementData } from '../../stores/useAnnouncementStore'
import { showError } from '../../utils/toast'

// Define styled components used by the form
const FormGroup = styled.div<{ flex?: number }>`
	margin-bottom: 16px;
	flex: ${props => props.flex || 1};
`

const FormLabel = styled.label`
	display: block;
	margin-bottom: 8px;
	font-size: 14px;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const FormInput = styled.input<{ isStyledFile?: boolean }>`
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

	${props => props.isStyledFile && `
		display: none; // Hide the actual file input
	`}
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

interface AnnouncementFormData {
	title: string
	content: string
	isImportant: boolean
	targetAudience: string
	created_by: string
	photo_file?: File | null
	video_file?: File | null
	// For display and removal logic
	current_photo_url?: string | null
	current_video_url?: string | null
}

const emptyFormData: AnnouncementFormData = {
	title: '',
	content: '',
	isImportant: false,
	targetAudience: 'all',
	created_by: 'Admin',
	photo_file: null,
	video_file: null,
	current_photo_url: null,
	current_video_url: null,
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
	const { createAnnouncement, deleteAnnouncement, updateAnnouncement, isLoading, error } = useAnnouncements()
	const { user } = useAuth()
	const [isFormOpen, setIsFormOpen] = useState(false)
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
	const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
	const [isDraggingPhoto, setIsDraggingPhoto] = useState(false)
	const [isDraggingVideo, setIsDraggingVideo] = useState(false)
	
	// Dedicated state for audience selection to troubleshoot select issues
	const [selectedAudience, setSelectedAudience] = useState('all');

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

	// Replace the handleAudienceChange function with this improved version
	const handleAudienceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		console.log(`*** Direct audience change handler - changing to: '${value}'`);
		
		// Update both state variables
		setSelectedAudience(value);
		setFormData(prev => ({...prev, targetAudience: value}));
		
		// Wait for the next rendering cycle and then manually update all select elements
		setTimeout(() => {
			const selects = document.querySelectorAll('select[name="targetAudience"]');
			console.log(`Found ${selects.length} audience selects to update`);
			
			selects.forEach(select => {
				(select as HTMLSelectElement).value = value;
			});
			
			// Force update select elements in the create form too - be more specific
			const createFormSelect = document.querySelector('.FormCard select[name="targetAudience"]');
			if (createFormSelect) {
				(createFormSelect as HTMLSelectElement).value = value;
			}
			
			// Another approach is to force a re-render of the entire form
			document.querySelectorAll('select').forEach(select => {
				// Simulate a change event to ensure the browser updates the visual display
				const event = new Event('change', { bubbles: true });
				select.dispatchEvent(event);
			});
		}, 50); // Longer timeout to ensure DOM is ready
	};

	// Original form change handler
	const handleFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value, type } = e.target;
		
		// Skip targetAudience as it's handled by handleAudienceChange
		if (name === 'targetAudience') {
			console.log(`*** handleFormChange - targetAudience is now handled separately, value was: '${value}'`);
			return;
		}

		if (type === 'checkbox') {
			const checked = (e.target as HTMLInputElement).checked;
			setFormData(prev => ({ ...prev, [name]: checked }));
		} else {
			// Ensure value is a string before trimming, then trim
			const finalValue = typeof value === 'string' ? value.trim() : value;
			setFormData(prev => {
				const newState = { ...prev, [name]: finalValue };
				return newState;
			});
		}
	};

	// Ensure selectedAudience stays in sync when formData.targetAudience changes
	useEffect(() => {
		console.log(`*** useEffect triggered by formData - formData.targetAudience: '${formData.targetAudience}'`);
		if (formData.targetAudience !== selectedAudience) {
			console.log(`*** Syncing selectedAudience to match formData.targetAudience: '${formData.targetAudience}'`);
			setSelectedAudience(formData.targetAudience);
		}
	}, [formData]);

	// Monitor selectedAudience changes
	useEffect(() => {
		console.log(`*** selectedAudience changed to: '${selectedAudience}'`);
	}, [selectedAudience]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.title || !formData.content) {
			setFormError('Please fill out all required fields')
			return
		}

		setFormSubmitting(true)
		setFormError(null)
		try {
			if (editingAnnouncement) {
				// For updating an existing announcement
				const updateData: UpdateAnnouncementData = {
					title: formData.title,
					content: formData.content,
					isImportant: formData.isImportant,
					targetAudience: formData.targetAudience,
					photo_file: formData.photo_file,
					video_file: formData.video_file,
					// Properly handle photo/video removal
					photo_url: formData.current_photo_url === null ? null : (editingAnnouncement?.photo_url || null),
					video_url: formData.current_video_url === null ? null : (editingAnnouncement?.video_url || null),
					photo_name: editingAnnouncement.photo_name,
					video_name: editingAnnouncement.video_name,
				};
				
				console.log('Submitting update with data:', {
					formState: formData,
					updateData: updateData,
					currentPhotoUrl: formData.current_photo_url,
					photoUrlInRequest: updateData.photo_url
				});
				
				// Call updateAnnouncement from the store
				const success = await updateAnnouncement(editingAnnouncement.id, updateData);
				
				if (success) {
					setIsFormOpen(false);
					setEditingAnnouncement(null);
					setFormData(emptyFormData);
					setSuccessMessage('Announcement updated successfully!');
					await handleRefresh(); // Refresh the list
				} else {
					setFormError('Failed to update announcement. Please try again.');
				}
			} else {
				// For creating a new announcement
				const createData = {
					...formData,
					targetAudience:
						formData.targetAudience.charAt(0).toUpperCase() + formData.targetAudience.slice(1),
					isImportant: formData.isImportant,
					created_by: user?.id || 'Admin',
					created_at: new Date().toISOString(),
					created_by_name: user?.firstName + ' ' + user?.lastName || user?.role,
					photo_file: formData.photo_file, // Pass the file for creation
					video_file: formData.video_file,
				};
				
				const success = await createAnnouncement(createData);

				if (success) {
					setIsFormOpen(false)
					setFormData(emptyFormData)
					setSuccessMessage('Announcement created successfully!')
					setSelectedAudience('all')
					await handleRefresh(); // Refresh the list
				} else {
					setFormError('Failed to create announcement. Please try again.')
				}
			}
		} catch (err) {
			console.error('Error submitting form:', err)
			const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
			setFormError(`Error: ${errorMessage}. Please try again.`)
		} finally {
			setFormSubmitting(false)
		}
	}

	const handleCancelForm = () => {
		setIsFormOpen(false)
		setEditingAnnouncement(null)
		setFormData(emptyFormData)
		setSelectedAudience('all')
		setFormError(null)
	}

	const handleDeleteClick = (id: string) => {
		setSelectedAnnouncementId(id)
		setDeleteConfirmOpen(true)
	}

	const handleEditClick = (announcement: Announcement) => {
		console.log('Edit announcement:', announcement);
		console.log('Photo URL:', announcement.photo_url);
		console.log('Video URL:', announcement.video_url);
		
		const audienceValue = announcement.targetAudience.toLowerCase().trim();
		console.log(`*** Setting audience for edit to: '${audienceValue}'`);
		
		setEditingAnnouncement(announcement);
		setFormData({
			title: announcement.title,
			content: announcement.content,
			isImportant: announcement.isImportant,
			targetAudience: audienceValue,
			created_by: announcement.created_by,
			photo_file: null, 
			video_file: null,
			current_photo_url: announcement.photo_url || null, 
			current_video_url: announcement.video_url || null,
		});
		
		// Set the dedicated audience state too
		setSelectedAudience(audienceValue);
		
		setIsFormOpen(true);
		window.scrollTo({ top: 0, behavior: 'smooth' });
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
						onClick={() => {
							setEditingAnnouncement(null);
							setFormData(emptyFormData);
							setSelectedAudience('all');
							setIsFormOpen(true);
							setFormError(null);
						}}
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

			{isFormOpen && (
				<FormCard>
					<CardHeader>
						<CardTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</CardTitle>
						{editingAnnouncement && (
							<EditingBadge>
								<FiEdit size={14} />
								<span>Editing mode</span>
							</EditingBadge>
						)}
						<CloseFormButton onClick={handleCancelForm}>
							<FiX size={20} />
						</CloseFormButton>
					</CardHeader>
					
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
							<FormGroup flex={2}>
								<FormLabel htmlFor='targetAudience'>Target Audience*</FormLabel>
								<FormSelect
									id='targetAudience'
									name='targetAudience'
									value={selectedAudience}
									onChange={handleAudienceChange}
									disabled={formSubmitting || isLoadingRoles}
								>
									<option value='all'>All Users</option>
									{isLoadingRoles ? (
										<option disabled>Loading roles...</option>
									) : (
										roles.map(role => (
											<option 
												key={role.id} 
												value={role.name.toLowerCase()}
											>
												{role.name}
											</option>
										))
									)}
								</FormSelect>
							</FormGroup>

							<FormGroup flex={1}>
								<FormCheckboxLabel>
									<FormCheckbox
										type='checkbox'
										name='isImportant'
										checked={formData.isImportant}
										onChange={handleFormChange}
										disabled={formSubmitting}
									/>
									<span>Mark as Important</span>
								</FormCheckboxLabel>
							</FormGroup>
						</FormRow>

						{/* Media Section */}
						<MediaSection>
							<MediaSectionTitle>Media Attachments</MediaSectionTitle>
							
							{/* Photo Upload */}
							<FormGroup>
								<FormLabel htmlFor='photo_file'>Photo</FormLabel>
								{formData.current_photo_url ? (
									<MediaPreviewContainer>
										<MediaPreview>
											<img src={formData.current_photo_url} alt='Current photo' />
										</MediaPreview>
										<MediaActions>
											<MediaActionButton 
												type="button" 
												onClick={() => {
													console.log("Removing photo");
													setFormData(prev => ({
														...prev, 
														current_photo_url: null, 
														photo_file: null
													}));
												}}
											>
												<FiTrash2 size={14} />
												<span>Remove Photo</span>
											</MediaActionButton>
										</MediaActions>
									</MediaPreviewContainer>
								) : (
									<StyledFileInputContainer>
										<StyledFileLabel 
											htmlFor="photo_file"
											onDragEnter={() => setIsDraggingPhoto(true)}
											onDragLeave={() => setIsDraggingPhoto(false)}
											onDragOver={(e) => e.preventDefault()} // Necessary to allow drop
											onDrop={() => setIsDraggingPhoto(false)}
											className={isDraggingPhoto ? 'drag-over' : ''}
										>
											<FiUploadCloud size={20} />
											<span>{formData.photo_file ? formData.photo_file.name : 'Choose a photo or drag & drop'}</span>
										</StyledFileLabel>
										<FormInput
											type='file'
											id='photo_file'
											name='photo_file'
											accept='image/*'
											onChange={e => {
												const file = e.target.files ? e.target.files[0] : null;
												setFormData(prev => ({ 
													...prev, 
													photo_file: file,
													current_photo_url: null 
												}));
											}}
											disabled={formSubmitting}
											isStyledFile
										/>
										<FileInputHint>Supported formats: JPG, PNG, GIF (max 5MB)</FileInputHint>
									</StyledFileInputContainer>
								)}
							</FormGroup>

							{/* Video Upload */}
							<FormGroup>
								<FormLabel htmlFor='video_file'>Video</FormLabel>
								{formData.current_video_url ? (
									<MediaPreviewContainer>
										<MediaPreview>
											<video src={formData.current_video_url} controls />
										</MediaPreview>
										<MediaActions>
											<MediaActionButton 
												type="button" 
												onClick={() => {
													console.log("Removing video");
													setFormData(prev => ({
														...prev, 
														current_video_url: null, 
														video_file: null
													}));
												}}
											>
												<FiTrash2 size={14} />
												<span>Remove Video</span>
											</MediaActionButton>
										</MediaActions>
									</MediaPreviewContainer>
								) : (
									<StyledFileInputContainer>
										<StyledFileLabel 
											htmlFor="video_file"
											onDragEnter={() => setIsDraggingVideo(true)}
											onDragLeave={() => setIsDraggingVideo(false)}
											onDragOver={(e) => e.preventDefault()} // Necessary to allow drop
											onDrop={() => setIsDraggingVideo(false)}
											className={isDraggingVideo ? 'drag-over' : ''}
										>
											<FiUploadCloud size={20} />
											<span>{formData.video_file ? formData.video_file.name : 'Choose a video or drag & drop'}</span>
										</StyledFileLabel>
										<FormInput
											type='file'
											id='video_file'
											name='video_file'
											accept='video/*'
											onChange={e => {
												const file = e.target.files ? e.target.files[0] : null;
												setFormData(prev => ({ 
													...prev, 
													video_file: file,
													current_video_url: null
												}));
											}}
											disabled={formSubmitting}
											isStyledFile
										/>
										<FileInputHint>Supported formats: MP4, MOV, WebM (max 20MB)</FileInputHint>
									</StyledFileInputContainer>
								)}
							</FormGroup>
						</MediaSection>

						<ButtonRow>
							<Button
								type='button'
								variant='secondary'
								onClick={handleCancelForm}
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
								{formSubmitting
									? editingAnnouncement ? 'Saving...' : 'Creating...'
									: editingAnnouncement ? 'Save Changes' : 'Create Announcement'}
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
												const element = e.currentTarget as any; // Use as any for simplicity with vendor prefixes
												if (element.requestFullscreen) {
													element.requestFullscreen();
												} else if (element.webkitRequestFullscreen) {
													element.webkitRequestFullscreen();
												} else if (element.msRequestFullscreen) {
													element.msRequestFullscreen();
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
									<ActionButtonsContainer>
										<DeleteButton onClick={() => handleDeleteClick(announcement.id)}>
											<FiTrash2 size={16} />
										</DeleteButton>
										<EditButton onClick={() => handleEditClick(announcement)}>
											<FiEdit size={16} />
										</EditButton>
									</ActionButtonsContainer>
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

const ActionButtonsContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`

const DeleteButton = styled.button`
	background: none;
	border: none;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background-color: ${props => props.theme.colors.danger[100]};
		color: ${props => props.theme.colors.danger[600]};
	}
`

const EditButton = styled.button`
	background: none;
	border: none;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	padding: 4px;
	margin-left: 8px;
	border-radius: 4px;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background-color: ${props => props.theme.colors.primary[100]};
		color: ${props => props.theme.colors.primary[600]};
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

const CardHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
`

const CardTitle = styled.h3`
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const EditingBadge = styled.div`
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

const CloseFormButton = styled.button`
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

const FormRow = styled.div<{ gap?: string }>`
	display: flex;
	gap: ${props => props.gap || '16px'};
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

const MediaPreviewContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
	margin-bottom: 8px;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 8px;
	padding: 12px;
	background-color: ${props => props.theme.colors.background.primary};
`

const MediaPreview = styled.div`
	width: 100%;
	max-height: 200px;
	overflow: hidden;
	border-radius: 8px;
	margin-bottom: 12px;
	
	img, video {
		width: 100%;
		max-height: 200px;
		object-fit: contain;
		background-color: ${props => props.theme.colors.background.tertiary};
		border-radius: 4px;
	}
`

const MediaActions = styled.div`
	display: flex;
	gap: 8px;
`

const MediaActionButton = styled.button`
	background: none;
	border: none;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	display: flex;
	align-items: center;
	gap: 4px;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
	}
`

const StyledFileInputContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: stretch; /* Make label take full width */
	gap: 8px;
`

const StyledFileLabel = styled.label`
	display: flex;
	align-items: center;
	justify-content: center; /* Center content */
	gap: 10px; /* Increased gap */
	padding: 16px 12px; /* Increased padding */
	font-size: 14px;
	font-weight: 500; /* Medium weight */
	color: ${props => props.theme.colors.text.secondary};
	background-color: ${props => props.theme.colors.background.primary};
	border: 2px dashed ${props => props.theme.colors.border.light};
	border-radius: 8px; /* More rounded */
	cursor: pointer;
	transition: all 0.2s ease-in-out;

	svg {
		color: ${props => props.theme.colors.primary[500]};
		transition: transform 0.2s ease-in-out;
	}

	&:hover {
		border-color: ${props => props.theme.colors.primary[300]};
		background-color: ${props => props.theme.colors.background.secondary};
		color: ${props => props.theme.colors.text.primary};

		svg {
			transform: scale(1.1);
		}
	}

	/* Style for when a file is being dragged over */
	&.drag-over {
		border-color: ${props => props.theme.colors.primary[500]};
		background-color: ${props => props.theme.colors.primary[50]};
	}
`

const FileInputHint = styled.span`
	font-size: 12px;
	color: ${props => props.theme.colors.text.tertiary};
`

const MediaSection = styled.div`
	margin-bottom: 24px;
`

const MediaSectionTitle = styled.h3`
	margin: 0 0 16px 0;
	font-size: 18px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

export default Announcements
