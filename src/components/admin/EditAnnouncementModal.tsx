import React, { useEffect, useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiTrash2, FiUpload, FiX } from 'react-icons/fi'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import supabase from '../../config/supabaseClient'
import Button from '../common/Button'

interface Announcement {
	id: string
	title: string
	content: string
	isImportant: boolean
	targetAudience: string
	created_by: string
	created_at: string
	photo_url?: string | null
	video_url?: string | null
	[key: string]: any
}

interface EditAnnouncementModalProps {
	isOpen: boolean
	onClose: () => void
	announcement: Announcement | null
	onSave: (announcement: Announcement) => void
	roles: any[]
}

interface FormData {
	title: string
	content: string
	isImportant: boolean
	targetAudience: 'All' | 'Student' | 'Teacher' | 'Admin'
}

const EditAnnouncementModal: React.FC<EditAnnouncementModalProps> = ({
	isOpen,
	onClose,
	announcement,
	onSave,
	roles,
}) => {
	const [formData, setFormData] = useState<FormData>({
		title: '',
		content: '',
		isImportant: false,
		targetAudience: 'All',
	})

	const [photoFile, setPhotoFile] = useState<File | null>(null)
	const [videoFile, setVideoFile] = useState<File | null>(null)
	const [photoPreview, setPhotoPreview] = useState<string | null>(null)
	const [videoPreview, setVideoPreview] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const [deletePhoto, setDeletePhoto] = useState(false)
	const [deleteVideo, setDeleteVideo] = useState(false)

	useEffect(() => {
		if (announcement) {
			setFormData({
				title: announcement.title,
				content: announcement.content,
				isImportant: announcement.isImportant,
				targetAudience: announcement.targetAudience as 'All' | 'Student' | 'Teacher' | 'Admin',
			})

			if (announcement.photo_url) {
				setPhotoPreview(announcement.photo_url)
			}

			if (announcement.video_url) {
				setVideoPreview(announcement.video_url)
			}

			setDeletePhoto(false)
			setDeleteVideo(false)
		}
	}, [announcement])

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value, type } = e.target

		if (type === 'checkbox') {
			const checked = (e.target as HTMLInputElement).checked
			setFormData(prev => ({ ...prev, [name]: checked }))
		} else if (name === 'targetAudience') {
			// Format the targetAudience value with first letter uppercase
			const formattedValue = value.charAt(0).toUpperCase() + value.slice(1)
			setFormData(prev => ({
				...prev,
				[name]: formattedValue as 'All' | 'Student' | 'Teacher' | 'Admin',
			}))
		} else {
			setFormData(prev => ({ ...prev, [name]: value }))
		}
	}

	const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0]
			setPhotoFile(file)
			setPhotoPreview(URL.createObjectURL(file))
			setDeletePhoto(false)
		}
	}

	const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0]
			setVideoFile(file)
			setVideoPreview(URL.createObjectURL(file))
			setDeleteVideo(false)
		}
	}

	const handlePhotoDelete = async () => {
		try {
			// Delete photo from Supabase if it exists
			if (announcement?.photo_url) {
				// Extract path from URL
				const photoPath = announcement.photo_url.split('lms/')[1]
				if (photoPath) {
					setIsSubmitting(true)
					const { error } = await supabase.storage.from('lms').remove([photoPath])
					if (error) {
						throw new Error(`Error deleting photo: ${error.message}`)
					}
					// Update announcement in database to remove photo_url
					const { error: updateError } = await supabase
						.from('announcements')
						.update({ photo_url: null })
						.eq('id', announcement?.id)

					if (updateError) {
						throw new Error(`Error updating announcement: ${updateError.message}`)
					}

					// Update parent component with the updated announcement
					const updatedAnnouncement = {
						...announcement,
						photo_url: null,
					} as Announcement
					onSave(updatedAnnouncement)

					setSuccess('Photo deleted successfully')
					setTimeout(() => setSuccess(null), 3000)
				}
			}
		} catch (err: any) {
			console.error('Error deleting photo:', err)
			setError(err.message || 'Failed to delete photo')
			setTimeout(() => setError(null), 3000)
		} finally {
			setPhotoFile(null)
			setPhotoPreview(null)
			setDeletePhoto(true)
			setIsSubmitting(false)
		}
	}

	const handleVideoDelete = async () => {
		try {
			// Delete video from Supabase if it exists
			if (announcement?.video_url) {
				// Extract path from URL
				const videoPath = announcement.video_url.split('lms/')[1]
				if (videoPath) {
					setIsSubmitting(true)
					const { error } = await supabase.storage.from('lms').remove([videoPath])
					if (error) {
						throw new Error(`Error deleting video: ${error.message}`)
					}
					// Update announcement in database to remove video_url
					const { error: updateError } = await supabase
						.from('announcements')
						.update({ video_url: null })
						.eq('id', announcement?.id)

					if (updateError) {
						throw new Error(`Error updating announcement: ${updateError.message}`)
					}

					// Update parent component with the updated announcement
					const updatedAnnouncement = {
						...announcement,
						video_url: null,
					} as Announcement
					onSave(updatedAnnouncement)

					setSuccess('Video deleted successfully')
					setTimeout(() => setSuccess(null), 3000)
				}
			}
		} catch (err: any) {
			console.error('Error deleting video:', err)
			setError(err.message || 'Failed to delete video')
			setTimeout(() => setError(null), 3000)
		} finally {
			setVideoFile(null)
			setVideoPreview(null)
			setDeleteVideo(true)
			setIsSubmitting(false)
		}
	}

	const uploadToSupabase = async (file: File, folder: string) => {
		const fileExt = file.name.split('.').pop()
		const fileName = `${uuidv4()}.${fileExt}`
		const filePath = `${folder}/${fileName}`

		const { error: uploadError } = await supabase.storage.from('lms').upload(filePath, file)

		if (uploadError) {
			throw new Error(`Error uploading file: ${uploadError.message}`)
		}

		const { data } = supabase.storage.from('lms').getPublicUrl(filePath)
		return data.publicUrl
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.title || !formData.content) {
			setError('Please fill out all required fields')
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			let photo_url = announcement?.photo_url || null
			let video_url = announcement?.video_url || null

			// We don't need to delete media here as it's handled by the delete buttons
			// Just respect the current state

			// Photo URL should be null if deleted
			if (deletePhoto) {
				photo_url = null
			}

			// Video URL should be null if deleted
			if (deleteVideo) {
				video_url = null
			}

			// Upload new photo if provided
			if (photoFile) {
				photo_url = await uploadToSupabase(photoFile, 'photos')
			}

			// Upload new video if provided
			if (videoFile) {
				video_url = await uploadToSupabase(videoFile, 'videos')
			}

			const updatedAnnouncement = {
				...announcement,
				title: formData.title,
				content: formData.content,
				isImportant: formData.isImportant,
				targetAudience:
					formData.targetAudience.charAt(0).toUpperCase() + formData.targetAudience.slice(1),
				photo_url,
				video_url,
			}

			// Save to database
			const { error: updateError } = await supabase
				.from('announcements')
				.update({
					title: formData.title,
					content: formData.content,
					isImportant: formData.isImportant,
					targetAudience:
						formData.targetAudience.charAt(0).toUpperCase() + formData.targetAudience.slice(1),
					photo_url,
					video_url,
				})
				.eq('id', announcement?.id)

			if (updateError) {
				throw new Error(`Error updating announcement: ${updateError.message}`)
			}

			setSuccess('Announcement updated successfully!')
			setTimeout(() => {
				setSuccess(null)
				onSave(updatedAnnouncement as Announcement)
				onClose()
			}, 1500)
		} catch (err: any) {
			console.error('Error updating announcement:', err)
			setError(err.message || 'An error occurred while updating the announcement')
		} finally {
			setIsSubmitting(false)
		}
	}

	if (!isOpen) return null

	return (
		<ModalOverlay>
			<ModalContent>
				<ModalHeader>
					<h2>Edit Announcement</h2>
					<CloseButton onClick={onClose}>
						<FiX size={24} />
					</CloseButton>
				</ModalHeader>

				{error && (
					<ErrorMessage>
						<FiAlertCircle /> {error}
					</ErrorMessage>
				)}

				{success && (
					<SuccessMessage>
						<FiCheckCircle /> {success}
					</SuccessMessage>
				)}

				<form onSubmit={handleSubmit}>
					<FormGroup>
						<FormLabel htmlFor='title'>Title*</FormLabel>
						<FormInput
							type='text'
							id='title'
							name='title'
							value={formData.title}
							onChange={handleChange}
							placeholder='Enter announcement title'
							required
							disabled={isSubmitting}
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel htmlFor='content'>Content*</FormLabel>
						<FormTextarea
							id='content'
							name='content'
							value={formData.content}
							onChange={handleChange}
							placeholder='Enter announcement content'
							rows={4}
							required
							disabled={isSubmitting}
						/>
					</FormGroup>

					<FormRow>
						<FormGroup>
							<FormLabel htmlFor='targetAudience'>Target Audience*</FormLabel>
							<FormSelect
								id='targetAudience'
								name='targetAudience'
								value={formData.targetAudience.toLowerCase()}
								onChange={handleChange}
								disabled={isSubmitting}
							>
								<option value='all'>All Users</option>
								{roles.map(role => (
									<option key={role.id} value={role.name.toLowerCase()}>
										{role.name}s Only
									</option>
								))}
							</FormSelect>
						</FormGroup>

						<FormGroup>
							<FormCheckboxLabel>
								<FormCheckbox
									type='checkbox'
									name='isImportant'
									checked={formData.isImportant}
									onChange={handleChange}
									disabled={isSubmitting}
								/>
								<span>Mark as Important</span>
							</FormCheckboxLabel>
						</FormGroup>
					</FormRow>

					<MediaSection>
						<h3>Media Attachments</h3>

						<MediaRow>
							<MediaColumn>
								<FormLabel htmlFor='photo'>Image</FormLabel>
								<FileInputContainer>
									<FileInputLabel htmlFor='photo'>
										<FiUpload />
										<span>Choose Image</span>
									</FileInputLabel>
									<FileInput
										type='file'
										id='photo'
										accept='image/*'
										onChange={handlePhotoChange}
										disabled={isSubmitting}
									/>
								</FileInputContainer>

								{photoPreview && (
									<MediaPreview>
										<MediaPreviewImage src={photoPreview} alt='Announcement preview' />
										<DeleteMediaButton
											type='button'
											onClick={handlePhotoDelete}
											disabled={isSubmitting}
										>
											<FiTrash2 />
											<span>Remove</span>
										</DeleteMediaButton>
									</MediaPreview>
								)}
							</MediaColumn>

							<MediaColumn>
								<FormLabel htmlFor='video'>Video</FormLabel>
								<FileInputContainer>
									<FileInputLabel htmlFor='video'>
										<FiUpload />
										<span>Choose Video</span>
									</FileInputLabel>
									<FileInput
										type='file'
										id='video'
										accept='video/*'
										onChange={handleVideoChange}
										disabled={isSubmitting}
									/>
								</FileInputContainer>

								{videoPreview && (
									<MediaPreview>
										<MediaPreviewVideo controls>
											<source src={videoPreview} type='video/mp4' />
											Your browser does not support the video tag.
										</MediaPreviewVideo>
										<DeleteMediaButton
											type='button'
											onClick={handleVideoDelete}
											disabled={isSubmitting}
										>
											<FiTrash2 />
											<span>Remove</span>
										</DeleteMediaButton>
									</MediaPreview>
								)}
							</MediaColumn>
						</MediaRow>
					</MediaSection>

					<ButtonRow>
						<Button type='button' variant='secondary' onClick={onClose} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button
							type='submit'
							variant='primary'
							disabled={isSubmitting}
							isLoading={isSubmitting}
						>
							{isSubmitting ? 'Saving...' : 'Save Changes'}
						</Button>
					</ButtonRow>
				</form>
			</ModalContent>
		</ModalOverlay>
	)
}

// Styled components
const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 20px;
`

const ModalContent = styled.div`
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	width: 100%;
	max-width: 700px;
	max-height: 90vh;
	overflow-y: auto;
	padding: 24px;
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;

	h2 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
		color: ${props => props.theme.colors.text.primary};
	}
`

const CloseButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	color: ${props => props.theme.colors.text.secondary};
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 4px;
	border-radius: 4px;
	transition: background-color 0.2s;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
		color: ${props => props.theme.colors.text.primary};
	}
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

const MediaSection = styled.div`
	margin-top: 24px;

	h3 {
		font-size: 16px;
		font-weight: 600;
		margin: 0 0 16px 0;
		color: ${props => props.theme.colors.text.primary};
	}
`

const MediaRow = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 16px;
`

const MediaColumn = styled.div`
	display: flex;
	flex-direction: column;
`

const FileInputContainer = styled.div`
	margin-bottom: 12px;
`

const FileInputLabel = styled.label`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	background-color: ${props => props.theme.colors.background.secondary};
	border: 1px dashed ${props => props.theme.colors.border.light};
	border-radius: 6px;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
		border-color: ${props => props.theme.colors.primary[300]};
		color: ${props => props.theme.colors.primary[500]};
	}
`

const FileInput = styled.input`
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border-width: 0;
`

const MediaPreview = styled.div`
	position: relative;
	margin-top: 8px;
`

const MediaPreviewImage = styled.img`
	max-width: 100%;
	max-height: 200px;
	border-radius: 6px;
	object-fit: contain;
	background-color: ${props => props.theme.colors.background.tertiary};
	border: 1px solid ${props => props.theme.colors.border.light};
`

const MediaPreviewVideo = styled.video`
	max-width: 100%;
	max-height: 200px;
	border-radius: 6px;
	object-fit: contain;
	background-color: ${props => props.theme.colors.background.tertiary};
	border: 1px solid ${props => props.theme.colors.border.light};
`

const DeleteMediaButton = styled.button`
	display: flex;
	align-items: center;
	gap: 6px;
	background-color: ${props => props.theme.colors.danger[50]};
	color: ${props => props.theme.colors.danger[600]};
	border: none;
	padding: 6px 12px;
	border-radius: 4px;
	margin-top: 8px;
	cursor: pointer;
	font-size: 12px;

	&:hover {
		background-color: ${props => props.theme.colors.danger[100]};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

export default EditAnnouncementModal
