import React, { useEffect, useState } from 'react'
import { FiAlertCircle, FiImage, FiTrash2, FiX } from 'react-icons/fi'
import styled from 'styled-components'
import supabase from '../../config/supabaseClient'
import { hasAnnouncementPermission } from '../../utils/authUtils'
import { generateSlug } from '../../utils/generateSlug'
import { showError, showSuccess } from '../../utils/toast'
import Button from '../common/Button'

const LOCAL_USER_KEY = 'lms_user'

interface AnnouncementFormData {
	title: string
	content: string
	isImportant: boolean
	targetAudience: 'All' | 'Student' | 'Teacher' | 'Admin'
	photo_url?: string
	video_url?: string
}

interface AnnouncementModalProps {
	onClose: () => void
	standalone?: boolean
}

interface Role {
	id: string
	name: string
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ onClose, standalone = false }) => {
	const [roles, setRoles] = useState<Role[]>([])
	const [formData, setFormData] = useState<AnnouncementFormData>({
		title: '',
		content: '',
		isImportant: false,
		targetAudience: 'All',
		photo_url: '',
		video_url: '',
	})
	const [formSubmitting, setFormSubmitting] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)
	const [imageFile, setImageFile] = useState<File | null>(null)
	const [imagePreview, setImagePreview] = useState<string | null>(null)
	const [uploadingImage, setUploadingImage] = useState(false)
	const [videoFile, setVideoFile] = useState<File | null>(null)
	const [videoPreview, setVideoPreview] = useState<string | null>(null)
	const [uploadingVideo, setUploadingVideo] = useState(false)

	async function getRoles() {
		try {
			const { data, error } = await supabase.from('roles').select('*')
			if (error) {
				console.error('Error fetching roles:', error)
			} else {
				setRoles(data as any)
			}
		} catch (error) {
			console.error('Error fetching roles:', error)
		}
	}

	useEffect(() => {
		getRoles()
	}, [])
	const handleFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value, type } = e.target

		if (type === 'checkbox') {
			const checked = (e.target as HTMLInputElement).checked
			console.log(checked)

			setFormData(prev => ({ ...prev, [name]: checked }))
		} else if (name === 'target') {
			setFormData(prev => ({
				...prev,
				// make targetAudience's first letter uppercase
				targetAudience: (value.charAt(0).toUpperCase() + value.slice(1)) as
					| 'All'
					| 'Student'
					| 'Teacher'
					| 'Admin'
					| any,
			}))
		} else {
			setFormData(prev => ({ ...prev, [name]: value }))
		}
	}

	useEffect(() => {
		console.log(formData)
	}, [formData])

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const file = e.target.files[0]

			// Check file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				showError('Image size must be less than 5MB')
				return
			}

			// Check file type
			if (!file.type.match('image.*')) {
				showError('Please select an image file')
				return
			}

			setImageFile(file)

			// Create preview
			const reader = new FileReader()
			reader.onloadend = () => {
				setImagePreview(reader.result as string)
			}
			reader.readAsDataURL(file)
		}
	}

	const handleImageUpload = async () => {
		if (!imageFile) return null

		try {
			setUploadingImage(true)

			// For demo purposes, we'll use a mock upload
			// In production, implement actual image upload to server/cloud storage
			// Example: Supabase Storage or AWS S3 upload would go here
			await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate upload delay

			// Normally we would return the URL from the upload service
			// For demo, we'll just use the image preview as the URL
			const url = imagePreview

			setUploadingImage(false)
			showSuccess('Image uploaded successfully')
			return url
		} catch (error) {
			setUploadingImage(false)
			showError('Failed to upload image')
			console.error('Error uploading image:', error)
			return null
		}
	}

	const removeImage = () => {
		setImageFile(null)
		setImagePreview(null)
		setFormData(prev => ({ ...prev, photo_url: '' }))
	}

	const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const file = e.target.files[0]

			// Check file size (max 50MB)
			if (file.size > 50 * 1024 * 1024) {
				showError('Video size must be less than 50MB')
				return
			}

			// Check file type
			if (!file.type.match('video.*')) {
				showError('Please select a video file')
				return
			}

			setVideoFile(file)

			// Create preview
			const reader = new FileReader()
			reader.onloadend = () => {
				setVideoPreview(reader.result as string)
			}
			reader.readAsDataURL(file)
		}
	}

	const handleVideoUpload = async () => {
		if (!videoFile) return null

		try {
			setUploadingVideo(true)

			// For demo purposes, we'll use a mock upload
			// In production, implement actual video upload to server/cloud storage
			await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate upload delay

			// Normally we would return the URL from the upload service
			// For demo, we'll just use the video preview as the URL
			const url = videoPreview

			setUploadingVideo(false)
			showSuccess('Video uploaded successfully')
			return url
		} catch (error) {
			setUploadingVideo(false)
			showError('Failed to upload video')
			console.error('Error uploading video:', error)
			return null
		}
	}

	const removeVideo = () => {
		setVideoFile(null)
		setVideoPreview(null)
		setFormData(prev => ({ ...prev, video_url: '' }))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.title || !formData.content) {
			setFormError('Please fill out all required fields')
			return
		}

		setFormSubmitting(true)
		setFormError(null)

		try {
			// Get current user and session
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser()
			if (userError || !user) {
				throw new Error('User not authenticated')
			}

			// Check if user has permission to create announcements
			if (!hasAnnouncementPermission('create')) {
				throw new Error('You do not have permission to create announcements')
			}

			// Handle video upload if there's a video
			let video_url = null
			let video_name = null
			if (videoFile) {
				setUploadingVideo(true)
				const generatedSlug = await generateSlug(formData.title)
				const videoFileName = `videos/${generatedSlug}-${Date.now()}`
				const { data: videoData, error: videoError } = await supabase.storage
					.from('lms')
					.upload(videoFileName, videoFile, {
						cacheControl: '3600',
						upsert: false,
					})

				if (videoError) {
					throw new Error(`Failed to upload video: ${videoError.message}`)
				}

				const {
					data: { publicUrl: videoPublicUrl },
				} = supabase.storage.from('lms').getPublicUrl(videoFileName)

				video_url = videoPublicUrl
				video_name = videoFileName
				setUploadingVideo(false)
			}

			// Handle image upload if there's an image
			let photo_url = null
			let photo_name = null
			if (imageFile) {
				setUploadingImage(true)
				const generatedSlug = await generateSlug(formData.title)
				const imageFileName = `photos/${generatedSlug}-${Date.now()}`
				const { data: imageData, error: imageError } = await supabase.storage
					.from('lms')
					.upload(imageFileName, imageFile, {
						cacheControl: '3600',
						upsert: false,
					})

				if (imageError) {
					throw new Error(`Failed to upload image: ${imageError.message}`)
				}

				const {
					data: { publicUrl: imagePublicUrl },
				} = supabase.storage.from('lms').getPublicUrl(imageFileName)

				photo_url = imagePublicUrl
				photo_name = imageFileName
				setUploadingImage(false)
			}

			// Create the announcement
			const { data: announcement, error: announcementError } = await supabase
				.from('announcements')
				.insert({
					title: formData.title,
					content: formData.content,
					isImportant: formData.isImportant,
					targetAudience: formData.targetAudience,
					created_by: user.id,
					photo_url: photo_url,
					video_url: video_url,
					video_name: video_name,
					photo_name: photo_name,
					created_at: new Date().toISOString(),
					created_by_name:
						JSON.parse(localStorage.getItem(LOCAL_USER_KEY) || '{}').firstName +
						' ' +
						JSON.parse(localStorage.getItem(LOCAL_USER_KEY) || '{}').lastName,
				})
				.select()
				.single()

			if (announcementError) {
				throw new Error(`Failed to create announcement: ${announcementError.message}`)
			}

			showSuccess('Announcement created successfully!')
			onClose()
		} catch (err) {
			console.error('Error creating announcement:', err)
			setFormError(err instanceof Error ? err.message : 'An unexpected error occurred')
			showError('Failed to create announcement')
		} finally {
			setFormSubmitting(false)
			setUploadingImage(false)
			setUploadingVideo(false)
		}
	}

	return standalone ? (
		<>
			{formError && (
				<FormErrorMessage>
					<FiAlertCircle />
				</FormErrorMessage>
			)}

			<ModalForm onSubmit={handleSubmit}>
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

				<FormGroup>
					<FormLabel>
						<ImageLabelContent>
							<span>Video</span>
							<ImageHelpText>Optional - Add a video to your announcement</ImageHelpText>
						</ImageLabelContent>
					</FormLabel>

					{videoPreview ? (
						<VideoPreviewContainer>
							<VideoPreview src={videoPreview} controls />
							<VideoPreviewOverlay>
								<RemoveVideoButton
									type='button'
									onClick={removeVideo}
									disabled={formSubmitting || uploadingVideo}
								>
									<FiTrash2 size={18} />
								</RemoveVideoButton>
							</VideoPreviewOverlay>
						</VideoPreviewContainer>
					) : (
						<VideoUploadContainer>
							<VideoInputLabel htmlFor='video-upload'>
								<FiImage size={24} />
								<span>Click to upload a video</span>
								<small>MP4, MOV or AVI, max 50MB</small>
							</VideoInputLabel>
							<VideoInput
								id='video-upload'
								type='file'
								accept='video/*'
								onChange={handleVideoChange}
								disabled={formSubmitting || uploadingVideo}
							/>
						</VideoUploadContainer>
					)}
				</FormGroup>

				<FormGroup>
					<FormLabel>
						<ImageLabelContent>
							<span>Image</span>
							<ImageHelpText>Optional - Add an image to your announcement</ImageHelpText>
						</ImageLabelContent>
					</FormLabel>

					{imagePreview ? (
						<ImagePreviewContainer>
							<ImagePreview src={imagePreview} alt='Announcement image preview' />
							<ImagePreviewOverlay>
								<RemoveImageButton
									type='button'
									onClick={removeImage}
									disabled={formSubmitting || uploadingImage}
								>
									<FiTrash2 size={18} />
								</RemoveImageButton>
							</ImagePreviewOverlay>
						</ImagePreviewContainer>
					) : (
						<ImageUploadContainer>
							<FileInputLabel htmlFor='image-upload'>
								<FiImage size={24} />
								<span>Click to upload an image</span>
								<small>JPG, PNG or GIF, max 5MB</small>
							</FileInputLabel>
							<FileInput
								id='image-upload'
								type='file'
								accept='image/*'
								onChange={handleImageChange}
								disabled={formSubmitting || uploadingImage}
							/>
						</ImageUploadContainer>
					)}
				</FormGroup>

				<FormRow>
					<FormGroup>
						<FormLabel htmlFor='target'>Target Audience*</FormLabel>
						<FormSelect
							id='target'
							name='target'
							value={formData.targetAudience}
							onChange={e => handleFormChange(e)}
							disabled={formSubmitting}
						>
							<option value='all'>All Users</option>
							{roles.map(role => (
								<option key={role.id} value={role.name.toLowerCase()}>
									{role.name}
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
								onChange={handleFormChange}
								disabled={formSubmitting}
							/>
							<span>Mark as Important 2</span>
						</FormCheckboxLabel>
					</FormGroup>
				</FormRow>

				<ButtonRow>
					<Button
						type='button'
						variant='secondary'
						onClick={onClose}
						disabled={formSubmitting || uploadingImage || uploadingVideo}
					>
						Cancel
					</Button>
					<Button
						type='submit'
						variant='primary'
						disabled={formSubmitting || uploadingImage || uploadingVideo}
						isLoading={formSubmitting || uploadingImage || uploadingVideo}
					>
						{formSubmitting || uploadingImage || uploadingVideo
							? 'Creating...'
							: 'Create Announcement'}
					</Button>
				</ButtonRow>
			</ModalForm>
		</>
	) : (
		<ModalOverlay>
			<ModalContainer>
				<ModalHeader>
					<ModalTitle>Create New Announcement</ModalTitle>
					<CloseButton onClick={onClose} disabled={formSubmitting}>
						<FiX size={24} />
					</CloseButton>
				</ModalHeader>

				{formError && (
					<FormErrorMessage>
						<FiAlertCircle /> {formError}
					</FormErrorMessage>
				)}

				<ModalForm onSubmit={handleSubmit}>
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

					<FormGroup>
						<FormLabel>
							<ImageLabelContent>
								<span>Video</span>
								<ImageHelpText>Optional - Add a video to your announcement</ImageHelpText>
							</ImageLabelContent>
						</FormLabel>

						{videoPreview ? (
							<VideoPreviewContainer>
								<VideoPreview src={videoPreview} controls />
								<VideoPreviewOverlay>
									<RemoveVideoButton
										type='button'
										onClick={removeVideo}
										disabled={formSubmitting || uploadingVideo}
									>
										<FiTrash2 size={18} />
									</RemoveVideoButton>
								</VideoPreviewOverlay>
							</VideoPreviewContainer>
						) : (
							<VideoUploadContainer>
								<VideoInputLabel htmlFor='video-upload'>
									<FiImage size={24} />
									<span>Click to upload a video</span>
									<small>MP4, MOV or AVI, max 50MB</small>
								</VideoInputLabel>
								<VideoInput
									id='video-upload'
									type='file'
									accept='video/*'
									onChange={handleVideoChange}
									disabled={formSubmitting || uploadingVideo}
								/>
							</VideoUploadContainer>
						)}
					</FormGroup>

					<FormGroup>
						<FormLabel>
							<ImageLabelContent>
								<span>Image</span>
								<ImageHelpText>Optional - Add an image to your announcement</ImageHelpText>
							</ImageLabelContent>
						</FormLabel>

						{imagePreview ? (
							<ImagePreviewContainer>
								<ImagePreview src={imagePreview} alt='Announcement image preview' />
								<ImagePreviewOverlay>
									<RemoveImageButton
										type='button'
										onClick={removeImage}
										disabled={formSubmitting || uploadingImage}
									>
										<FiTrash2 size={18} />
									</RemoveImageButton>
								</ImagePreviewOverlay>
							</ImagePreviewContainer>
						) : (
							<ImageUploadContainer>
								<FileInputLabel htmlFor='image-upload'>
									<FiImage size={24} />
									<span>Click to upload an image</span>
									<small>JPG, PNG or GIF, max 5MB</small>
								</FileInputLabel>
								<FileInput
									id='image-upload'
									type='file'
									accept='image/*'
									onChange={handleImageChange}
									disabled={formSubmitting || uploadingImage}
								/>
							</ImageUploadContainer>
						)}
					</FormGroup>

					<FormRow>
						<FormGroup>
							<FormLabel htmlFor='target'>Target Audience*</FormLabel>
							<FormSelect
								id='target'
								name='target'
								value={formData.targetAudience}
								onChange={e => handleFormChange(e)}
								disabled={formSubmitting}
							>
								<option value='all'>All Users</option>
								{roles.map(role => (
									<option key={role.id} value={role.name.toLowerCase()}>
										{role.name}
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
							onClick={onClose}
							disabled={formSubmitting || uploadingImage || uploadingVideo}
						>
							Cancel
						</Button>
						<Button
							type='submit'
							variant='primary'
							disabled={formSubmitting || uploadingImage || uploadingVideo}
							isLoading={formSubmitting || uploadingImage || uploadingVideo}
						>
							{formSubmitting || uploadingImage || uploadingVideo
								? 'Creating...'
								: 'Create Announcement'}
						</Button>
					</ButtonRow>
				</ModalForm>
			</ModalContainer>
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
	justify-content: center;
	align-items: center;
	z-index: 1000;
	padding: 20px;
`

const ModalContainer = styled.div`
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: 8px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	max-width: 600px;
	width: 100%;
	max-height: 90vh;
	overflow-y: auto;
	animation: fadeIn 0.2s ease-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px 24px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const ModalTitle = styled.h2`
	font-size: 20px;
	font-weight: 600;
	margin: 0;
	color: ${props => props.theme.colors.text.primary};
`

const CloseButton = styled.button`
	background: none;
	border: none;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	padding: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;
	transition: background-color 0.2s, color 0.2s;

	&:hover {
		background-color: ${props => props.theme.colors.background.tertiary};
		color: ${props => props.theme.colors.text.primary};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

const ModalForm = styled.form`
	padding: 24px;
`

const FormGroup = styled.div`
	margin-bottom: 20px;
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
	background-color: ${props => props.theme.colors.background.secondary};
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
	background-color: ${props => props.theme.colors.background.secondary};
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
	background-color: ${props => props.theme.colors.background.secondary};
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
	margin: 24px 24px 0;
	font-size: 14px;
`

const ImageLabelContent = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;

	span {
		font-weight: 500;
	}
`

const ImageHelpText = styled.span`
	font-size: 12px;
	color: ${props => props.theme.colors.text.tertiary};
	font-weight: normal !important;
`

const ImageUploadContainer = styled.div`
	border: 2px dashed ${props => props.theme.colors.border.light};
	border-radius: 8px;
	background-color: ${props => props.theme.colors.background.secondary};
	padding: 24px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		border-color: ${props => props.theme.colors.primary[300]};
		background-color: ${props => props.theme.colors.background.tertiary};
	}
`

const FileInputLabel = styled.label`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	cursor: pointer;
	color: ${props => props.theme.colors.text.secondary};

	svg {
		color: ${props => props.theme.colors.primary[500]};
	}

	small {
		font-size: 12px;
		color: ${props => props.theme.colors.text.tertiary};
	}
`

const FileInput = styled.input`
	display: none;
`

const ImagePreviewContainer = styled.div`
	position: relative;
	width: 100%;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

const ImagePreview = styled.img`
	width: 100%;
	height: auto;
	max-height: 300px;
	object-fit: cover;
	display: block;
`

const ImagePreviewOverlay = styled.div`
	position: absolute;
	top: 0;
	right: 0;
	padding: 8px;
	display: flex;
	gap: 8px;
	background: linear-gradient(to bottom right, rgba(0, 0, 0, 0.4), transparent);
	border-bottom-left-radius: 8px;
`

const RemoveImageButton = styled.button`
	background-color: rgba(255, 255, 255, 0.9);
	color: ${props => props.theme.colors.danger[600]};
	border: none;
	border-radius: 50%;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.danger[100]};
		transform: scale(1.05);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

const VideoUploadContainer = styled.div`
	border: 2px dashed ${props => props.theme.colors.border.light};
	border-radius: 8px;
	background-color: ${props => props.theme.colors.background.secondary};
	padding: 24px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;
	margin-top: 16px;

	&:hover {
		border-color: ${props => props.theme.colors.primary[300]};
		background-color: ${props => props.theme.colors.background.tertiary};
	}
`

const VideoPreviewContainer = styled.div`
	position: relative;
	width: 100%;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	margin-top: 16px;
`

const VideoPreview = styled.video`
	width: 100%;
	height: auto;
	max-height: 300px;
	object-fit: cover;
	display: block;
`

const VideoPreviewOverlay = styled.div`
	position: absolute;
	top: 0;
	right: 0;
	padding: 8px;
	display: flex;
	gap: 8px;
	background: linear-gradient(to bottom right, rgba(0, 0, 0, 0.4), transparent);
	border-bottom-left-radius: 8px;
`

const RemoveVideoButton = styled.button`
	background-color: rgba(255, 255, 255, 0.9);
	color: ${props => props.theme.colors.danger[600]};
	border: none;
	border-radius: 50%;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.danger[100]};
		transform: scale(1.05);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

const VideoInputLabel = styled.label`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	cursor: pointer;
	color: ${props => props.theme.colors.text.secondary};

	svg {
		color: ${props => props.theme.colors.primary[500]};
	}

	small {
		font-size: 12px;
		color: ${props => props.theme.colors.text.tertiary};
	}
`

const VideoInput = styled.input`
	display: none;
`

export default AnnouncementModal
