import { motion } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'
import {
	FiAlertCircle,
	FiCalendar,
	FiCheck,
	FiChevronDown,
	FiChevronLeft,
	FiChevronRight,
	FiClock,
	FiDownload,
	FiEdit,
	FiFile,
	FiFileText,
	FiFolder,
	FiImage,
	FiMail,
	FiPaperclip,
	FiPlus,
	FiSearch,
	FiTrash,
	FiUploadCloud,
	FiX,
} from 'react-icons/fi'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import supabase, { supabaseAdmin } from '../../config/supabaseClient'

// Interface for Assignment from the database
interface Assignment {
	id: string
	title: string
	content: string
	description?: string
	instructions?: string
	classid: string
	class_name?: string
	duedate?: string
	createdat: string
	createdby?: {
		email?: string
	}
	creator_email?: string
	status?: 'Published' | 'Draft' | 'Completed' | 'Grading'
	submissions_count?: number
	submissions_completed?: number
	average_score?: number
	max_score?: number
	classes?: { classname: string }[] | { classname: string }
	file_url?: Array<{ name: string; url: string }>
	subject_id?: string
	subjects?: { subjectname: string }
}

// Interface for Class
interface Class {
	id: string
	classname: string
}

// Interface for User
interface User {
	id: string
	email: string
	full_name?: string
}

// Interface for Subject
interface Subject {
	id: string
	subjectname: string
}

// Interface for form data
interface AssignmentFormData {
	title: string
	content: string
	classid: string
	assigned_date: string
	subject_id: string
}

// Status tags configuration
const StatusTags = {
	Published: { color: '#e3f2fd', textColor: '#0288d1', icon: FiClock },
	Completed: { color: '#e8f5e9', textColor: '#388e3c', icon: FiCheck },
	Grading: { color: '#fff8e1', textColor: '#ffa000', icon: FiAlertCircle },
	Draft: { color: '#f5f5f5', textColor: '#616161', icon: FiEdit },
}

// New component for Creator Email Badge
const CreatorEmailBadge: React.FC<{ email: string }> = ({ email }) => {
	return (
		<StyledEmailBadge>
			<FiMail style={{ marginRight: '6px' }} />
			{email}
		</StyledEmailBadge>
	)
}

// Add interface for user permissions
interface UserPermissions {
	create_assignments?: boolean
	update_assignments?: boolean
	read_assignments?: boolean
	delete_assignments?: boolean
	[key: string]: boolean | undefined
}

// Add these interfaces to match your database schema
interface UserRole {
	role_id: string
}

interface Permission {
	id: string
	name: string
	description?: string
}

// Add interface for the role permissions join response
interface RolePermissionJoin {
	permission_id: string
	permissions: {
		id: string
		name: string
	}
}

const AdminAssignments: React.FC = () => {
	// State variables
	const [assignments, setAssignments] = useState<Assignment[]>([])
	const [classes, setClasses] = useState<Class[]>([])
	const [subjects, setSubjects] = useState<Subject[]>([])
	const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [isLoading, setIsLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [formData, setFormData] = useState<AssignmentFormData>({
		title: '',
		content: '',
		classid: '',
		assigned_date: new Date().toISOString().split('T')[0],
		subject_id: '',
	})
	const [formErrors, setFormErrors] = useState<Partial<Record<keyof AssignmentFormData, string>>>(
		{}
	)
	const [showEditModal, setShowEditModal] = useState(false)
	const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
	const [editFormData, setEditFormData] = useState<AssignmentFormData>({
		title: '',
		content: '',
		classid: '',
		assigned_date: '',
		subject_id: '',
	})
	const [newAssignmentFiles, setNewAssignmentFiles] = useState<File[]>([])
	const [isUploading, setIsUploading] = useState(false)
	const newFileInputRef = useRef<HTMLInputElement>(null)

	// Add state for file uploads
	const [uploading, setUploading] = useState<Record<string, boolean>>({})
	const [hasUploadedFiles, setHasUploadedFiles] = useState<Record<string, boolean>>({})
	const fileInputRef = useRef<HTMLInputElement>(null)
	const currentAssignmentRef = useRef<string | null>(null)

	// Add state for file preview modal
	const [showPreviewModal, setShowPreviewModal] = useState(false)
	const [previewFiles, setPreviewFiles] = useState<string[]>([])
	const [currentFileIndex, setCurrentFileIndex] = useState(0)
	const [previewTitle, setPreviewTitle] = useState('')

	// Add a state variable for subject loading
	const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)
	const [hasSubjectsForClass, setHasSubjectsForClass] = useState(false)

	// Add these new state variables near the other file-related states
	const [isDragging, setIsDragging] = useState(false)
	const dropAreaRef = useRef<HTMLDivElement>(null)

	// Add a state to track upload progress
	const [uploadProgress, setUploadProgress] = useState({
		current: 0,
		total: 0,
	})

	// Add state for edit mode file management
	const [editAssignmentFiles, setEditAssignmentFiles] = useState<File[]>([])
	const [existingFiles, setExistingFiles] = useState<Array<{ name: string; url: string }>>([])
	const [filesToDelete, setFilesToDelete] = useState<string[]>([])
	const editFileInputRef = useRef<HTMLInputElement>(null)
	const [editUploadProgress, setEditUploadProgress] = useState({
		current: 0,
		total: 0,
	})

	// Add state for user permissions
	const [userPermissions, setUserPermissions] = useState<UserPermissions>({})
	const [isLoadingPermissions, setIsLoadingPermissions] = useState(true)

	// Add function to check if user has a specific permission
	const hasPermission = (permission: keyof UserPermissions): boolean => {
		const hasRequiredPermission = !!userPermissions[permission]

		// Debug log when a permission check fails
		if (!hasRequiredPermission && process.env.NODE_ENV !== 'production') {
			console.log(`Permission check failed: ${permission}`, {
				availablePermissions: userPermissions,
			})
		}

		return hasRequiredPermission
	}

	// Add a utility function to debug all permissions
	const debugUserPermissions = () => {
		console.group('User Permissions Debug')
		console.log('All permissions:', userPermissions)
		console.log('Has create_assignments:', hasPermission('create_assignments'))
		console.log('Has update_assignments:', hasPermission('update_assignments'))
		console.log('Has read_assignments:', hasPermission('read_assignments'))
		console.log('Has delete_assignments:', hasPermission('delete_assignments'))
		console.groupEnd()
	}

	// Add this function to handle file drag and drop events
	const handleDragEvents = (e: React.DragEvent, isDraggingState: boolean) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(isDraggingState)
	}

	// Update fetchUserPermissions function to get permissions directly from roles
	const fetchUserPermissions = async () => {
		try {
			setIsLoadingPermissions(true)

			// Get permissions directly from role_permissions joined with permissions
			const { data: permissionsData, error: permissionsError } = await supabase.from(
				'role_permissions'
			).select(`
					permission_id,
					permissions (
						id,
						name
					)
				`)

			if (permissionsError) {
				console.error('Error fetching role permissions:', permissionsError)
				toast.error('Failed to load user permissions')
				return
			}

			console.log('Permissions data:', permissionsData)

			// Process permissions
			const permissions: UserPermissions = {}

			if (permissionsData && permissionsData.length > 0) {
				// Cast the data to the proper type
				const typedPermissionsData = permissionsData as unknown as RolePermissionJoin[]

				typedPermissionsData.forEach(rolePermission => {
					if (rolePermission.permissions && rolePermission.permissions.name) {
						permissions[rolePermission.permissions.name] = true
					}
				})
			}

			console.log('Permissions loaded:', permissions)
			setUserPermissions(permissions)

			// Debug permissions
			setTimeout(() => debugUserPermissions(), 100)
		} catch (error) {
			console.error('Error in permission check:', error)
			toast.error('Failed to verify permissions')
		} finally {
			setIsLoadingPermissions(false)
		}
	}

	// Update useEffect to clear permissions on mount
	useEffect(() => {
		// Clear permissions state to avoid using stale data
		setUserPermissions({})
		setIsLoadingPermissions(true)

		// Fetch data
		fetchAssignments()
		fetchClasses()
		fetchSubjects()
		fetchUserPermissions()
	}, [])

	// Add another useEffect to initialize filteredSubjects when subjects are loaded
	useEffect(() => {
		setFilteredSubjects(subjects)
	}, [subjects])

	// Modify fetchAssignments to check for read permission
	const fetchAssignments = async () => {
		setIsLoading(true)
		try {
			const { data, error } = await supabase
				.from('assignments')
				.select(
					`
					*,
					classes (classname),
					subjects (subjectname),
					profiles:createdby (email)
				`
				)
				.order('createdat', { ascending: false })

			if (error) {
				throw error
			}

			// Transform data to match our Assignment interface
			const transformedAssignments = (data || []).map((assignment: any) => ({
				id: assignment.id,
				title: assignment.title,
				content: assignment.description || assignment.instructions,
				instructions: assignment.instructions,
				description: assignment.description || assignment.instructions,
				classid: assignment.classid,
				class_name: assignment.classes?.classname,
				duedate: assignment.duedate,
				createdat: assignment.createdat,
				status: assignment.status,
				submissions_count: assignment.submissions_count || 0,
				submissions_completed: assignment.submissions_completed || 0,
				average_score: assignment.average_score || 0,
				max_score: assignment.max_score || 100,
				file_url: assignment.file_url,
				subject_id: assignment.subject_id,
				subjects: assignment.subjects,
				creator_email: assignment.profiles?.email || 'Unknown',
			}))

			setAssignments(transformedAssignments)
		} catch (error) {
			console.error('Error fetching assignments:', error)
			toast.error('Failed to load assignments')
		} finally {
			setIsLoading(false)
		}
	}

	// Fetch available classes
	const fetchClasses = async () => {
		try {
			const { data, error } = await supabase
				.from('classes')
				.select('id, classname')
				.order('classname')

			if (error) throw error
			setClasses(data || [])
		} catch (error) {
			console.error('Error fetching classes:', error)
			toast.error('Failed to load classes')
		}
	}

	// Fetch subjects from the database
	const fetchSubjects = async () => {
		try {
			const { data, error } = await supabase
				.from('subjects')
				.select('id, subjectname')
				.order('subjectname', { ascending: true })

			if (error) throw error
			setSubjects(data || [])
		} catch (error) {
			console.error('Error fetching subjects:', error)
			toast.error('Failed to load subjects')
		}
	}

	// Fetch subjects for a specific class
	const fetchSubjectsForClass = async (classId: string) => {
		if (!classId) {
			setFilteredSubjects([])
			setHasSubjectsForClass(false)
			return
		}

		try {
			setIsLoadingSubjects(true)
			// First try to get subjects associated with this class from classsubjects table
			const { data: classSubjectsData, error: classSubjectsError } = await supabase
				.from('classsubjects')
				.select('subjectid')
				.eq('classid', classId)

			if (classSubjectsError) throw classSubjectsError

			if (classSubjectsData && classSubjectsData.length > 0) {
				// If there are associated subjects, get their details
				const subjectIds = classSubjectsData.map(item => item.subjectid)

				const { data: subjectsData, error: subjectsError } = await supabase
					.from('subjects')
					.select('id, subjectname')
					.in('id', subjectIds)
					.order('subjectname', { ascending: true })

				if (subjectsError) throw subjectsError

				setFilteredSubjects(subjectsData || [])
				setHasSubjectsForClass(subjectsData && subjectsData.length > 0)
			} else {
				// If no associated subjects, show all subjects or a message
				console.log('No subjects found for this class. Showing all subjects.')
				setFilteredSubjects([])
				setHasSubjectsForClass(false)
			}
		} catch (error) {
			console.error('Error fetching subjects for class:', error)
			toast.error('Failed to load subjects for this class')
			setFilteredSubjects(subjects) // Fallback to all subjects
			setHasSubjectsForClass(subjects && subjects.length > 0)
		} finally {
			setIsLoadingSubjects(false)
		}
	}

	// Handle search input change
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	// Handle form input changes with special handling for classid
	const handleFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		setFormData(prev => ({ ...prev, [name]: value }))

		// Special handling for class selection
		if (name === 'classid' && value) {
			// Reset subject selection when class changes
			setFormData(prev => ({ ...prev, subject_id: '' }))
			// Fetch subjects for this class
			fetchSubjectsForClass(value)
		}

		// Clear error when field is updated
		if (formErrors[name as keyof AssignmentFormData]) {
			setFormErrors(prev => ({ ...prev, [name]: undefined }))
		}
	}

	// Validate form
	const validateForm = (): boolean => {
		const errors: Partial<Record<keyof AssignmentFormData, string>> = {}
		let isValid = true

		if (!formData.title.trim()) {
			errors.title = 'Title is required'
			isValid = false
		}

		if (!formData.content.trim()) {
			errors.content = 'Description is required'
			isValid = false
		}

		if (!formData.classid) {
			errors.classid = 'Class is required'
			isValid = false
		}

		if (!formData.assigned_date) {
			errors.assigned_date = 'Assignment date is required'
			isValid = false
		}

		if (!formData.subject_id) {
			errors.subject_id = 'Subject is required'
			isValid = false
		}

		setFormErrors(errors)
		return isValid
	}

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Check if user has permission to create assignments
		if (!hasPermission('create_assignments')) {
			toast.error("You don't have permission to create assignments")
			return
		}

		if (!validateForm()) return

		try {
			setIsUploading(true)
			// Get the current user from Supabase auth
			const { data: authData, error: authError } = await supabase.auth.getUser()

			if (authError) {
				console.error('Authentication error:', authError)
				toast.error(`Authentication error: ${authError.message}`)
				return
			}

			if (!authData.user) {
				console.error('No authenticated user found')
				toast.error('Authentication error: No user found. Please sign in again.')
				return
			}

			// Format assigned_date to ISO string for duedate field
			let dueDate
			try {
				// The datetime-local input returns a string in the format "YYYY-MM-DDThh:mm"
				// We need to ensure it's a proper ISO string
				const dateTimeValue = formData.assigned_date
				const date = new Date(dateTimeValue)

				if (isNaN(date.getTime())) {
					throw new Error('Invalid date format')
				}

				dueDate = date.toISOString()
				console.log('Formatted duedate for submission:', dueDate)
			} catch (dateError) {
				console.error('Date formatting error:', dateError)
				toast.error('Invalid date format. Please select a valid date and time.')
				return
			}

			// Handle file uploads for multiple files
			let fileUrlArray: Array<{ name: string; url: string }> = []
			if (newAssignmentFiles.length > 0) {
				try {
					// Set upload progress initial state
					setUploadProgress({
						current: 0,
						total: newAssignmentFiles.length,
					})

					// Check if the lms bucket exists first
					const { data: buckets, error: bucketListError } =
						await supabaseAdmin.storage.listBuckets()

					if (bucketListError) {
						console.error('Error listing buckets:', bucketListError)
						throw bucketListError
					}

					const lmsBucketExists = buckets.some(bucket => bucket.name === 'lms')
					console.log('Does lms bucket exist?', lmsBucketExists)

					if (!lmsBucketExists) {
						console.log('LMS bucket does not exist, attempting to create it...')
						const { data, error } = await supabaseAdmin.storage.createBucket('lms', {
							public: true,
							fileSizeLimit: 52428800, // 50MB
							allowedMimeTypes: [
								'image/*',
								'application/pdf',
								'application/msword',
								'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
							],
						})

						if (error) {
							console.error('Failed to create lms bucket:', error)
							throw new Error(`Failed to create storage bucket: ${error.message}`)
						}

						console.log('Created lms bucket successfully:', data)
					}

					// Upload each file
					for (let i = 0; i < newAssignmentFiles.length; i++) {
						const file = newAssignmentFiles[i]

						// Update progress counter
						setUploadProgress({
							current: i,
							total: newAssignmentFiles.length,
						})

						// Generate a unique file name
						const fileExt = file.name.split('.').pop()
						const fileName = `new_${Date.now()}_${Math.random()
							.toString(36)
							.substring(2, 15)}.${fileExt}`

						// Use assignments folder inside lms bucket
						const filePath = `assignments/${fileName}`

						console.log(`Generated file path: ${filePath} in bucket 'lms'`)

						// Upload to Supabase Storage in the lms bucket
						const { data, error } = await supabaseAdmin.storage.from('lms').upload(filePath, file, {
							cacheControl: '3600',
							upsert: true,
						})

						if (error) {
							console.error('Error during upload:', error)
							throw error
						}

						// Get public URL from the lms bucket
						const { data: urlData } = supabaseAdmin.storage.from('lms').getPublicUrl(filePath)

						if (urlData) {
							// Store as object with name and url
							fileUrlArray.push({
								name: file.name, // Original file name
								url: urlData.publicUrl,
							})
							console.log(
								'File uploaded successfully, URL object:',
								fileUrlArray[fileUrlArray.length - 1]
							)
						} else {
							console.error('Failed to generate public URL for uploaded file')
						}
					}

					// Set final upload count
					setUploadProgress({
						current: newAssignmentFiles.length,
						total: newAssignmentFiles.length,
					})
				} catch (uploadError) {
					console.error('File upload error:', uploadError)
					toast.error(
						`File upload failed: ${
							uploadError instanceof Error ? uploadError.message : 'Unknown error'
						}`
					)
					return
				}
			}

			// Get information about the assignments table columns
			try {
				console.log('Checking assignments table structure...')
				const { data: tableInfo, error: tableError } = await supabase
					.from('assignments')
					.select('*')
					.limit(1)

				if (tableError) {
					console.error('Error fetching table structure:', tableError)
				} else if (tableInfo && tableInfo.length > 0) {
					console.log('Available columns in assignments table:', Object.keys(tableInfo[0]))
				} else {
					console.log('No data found in assignments table to check structure')
				}
			} catch (tableCheckError) {
				console.error('Error during table structure check:', tableCheckError)
			}

			// Fix: Use 'instructions' instead of 'content' based on the error message
			const submissionData = {
				title: formData.title,
				instructions: formData.content, // Map form content to instructions field
				classid: formData.classid,
				duedate: dueDate,
				createdby: authData.user.id,
				subject_id: formData.subject_id,
				createdat: new Date().toISOString(),
				file_url: fileUrlArray, // Array of file objects
			}

			console.log('Submitting assignment data:', submissionData)
			console.log('User ID being used for createdby:', authData.user.id)

			// Insert new assignment with verbose error handling
			const { data, error } = await supabase
				.from('assignments')
				.insert([submissionData])
				.select('*, subjects(*), profiles:createdby(email)')

			if (error) {
				console.error('Supabase error details:', error)
				toast.error(`Failed to add assignment: ${error.message}`)
				return
			}

			if (!data || data.length === 0) {
				console.error('No data returned from insert operation')
				toast.error('Assignment was not created properly. Please try again.')
				return
			}

			console.log('Inserted assignment data:', data[0])

			// Find the class name for the new assignment
			const classObj = classes.find(c => c.id === formData.classid)
			const subjectObj = subjects.find(s => s.id === formData.subject_id)

			// Map the database fields to the display fields
			const assignmentForDisplay = {
				...data[0],
				description: data[0].instructions, // Use instructions for description
				class_name: classObj?.classname || 'Unknown Class',
				creator_email: data[0].profiles?.email || authData.user.email || 'Current User', // Use email for display
			}

			// Add the new assignment to the state
			setAssignments(prev => [assignmentForDisplay, ...prev])

			// Reset form and close modal
			setFormData({
				title: '',
				content: '',
				classid: '',
				assigned_date: new Date().toISOString().split('T')[0],
				subject_id: '',
			})
			setNewAssignmentFiles([]) // Reset files state
			setShowModal(false)
			toast.success('Assignment added successfully!')
		} catch (error) {
			console.error('Error adding assignment:', error)
			let errorMessage = 'Failed to add assignment'
			if (error instanceof Error) {
				errorMessage = `${errorMessage}: ${error.message}`
			}
			toast.error(errorMessage)
		} finally {
			setIsUploading(false)
			// Reset upload progress
			setUploadProgress({ current: 0, total: 0 })
		}
	}

	// Handle edit button click
	const handleEditClick = (assignment: Assignment) => {
		setSelectedAssignment(assignment)
		setEditFormData({
			title: assignment.title,
			content: assignment.instructions || assignment.content,
			classid: assignment.classid,
			assigned_date: assignment.duedate
				? new Date(assignment.duedate).toISOString().split('T')[0]
				: new Date().toISOString().split('T')[0],
			subject_id: assignment.subject_id || '',
		})

		// Reset file states
		setEditAssignmentFiles([])
		setFilesToDelete([])

		// Initialize existing files if any
		if (assignment.file_url && Array.isArray(assignment.file_url)) {
			setExistingFiles(assignment.file_url)
		} else {
			setExistingFiles([])
		}

		// Fetch subjects for the class of this assignment
		if (assignment.classid) {
			fetchSubjectsForClass(assignment.classid)
		} else {
			// If no class, show all subjects
			setFilteredSubjects(subjects)
		}

		setShowEditModal(true)
	}

	// Handle edit form changes with special handling for classid
	const handleEditFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		setEditFormData(prev => ({ ...prev, [name]: value }))

		// Special handling for class selection in edit form
		if (name === 'classid' && value) {
			// Reset subject selection when class changes
			setEditFormData(prev => ({ ...prev, subject_id: '' }))
			// Fetch subjects for this class
			fetchSubjectsForClass(value)
		}
	}

	// Add a helper function to extract the storage path from a public URL
	const getStoragePathFromUrl = (url: string): string | null => {
		try {
			// Check if it's a Supabase storage URL
			if (!url.includes('storage/v1/object/public/')) return null

			// Extract the path after the bucket name
			const parts = url.split('storage/v1/object/public/')
			if (parts.length < 2) return null

			// Split by bucket name and path
			const bucketAndPath = parts[1].split('/', 2)
			if (bucketAndPath.length < 2) return null

			const bucket = bucketAndPath[0]
			// Get everything after the bucket name
			const path = parts[1].substring(bucket.length + 1)

			return path
		} catch (error) {
			console.error('Error extracting storage path:', error)
			return null
		}
	}

	// Update handleEditSubmit to delete files from storage
	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!selectedAssignment) return

		// Check if user has permission to update assignments
		if (!hasPermission('update_assignments')) {
			toast.error("You don't have permission to update assignments")
			return
		}

		try {
			setIsUploading(true)

			// Format date
			let dueDate
			try {
				const date = new Date(editFormData.assigned_date)
				if (isNaN(date.getTime())) {
					throw new Error('Invalid date format')
				}
				dueDate = date.toISOString()
			} catch (dateError) {
				console.error('Date formatting error:', dateError)
				toast.error('Invalid date format. Please select a valid date and time.')
				return
			}

			// Process file deletions if needed
			if (filesToDelete.length > 0) {
				try {
					console.log(`Deleting ${filesToDelete.length} files from storage...`)

					for (const fileUrl of filesToDelete) {
						const storagePath = getStoragePathFromUrl(fileUrl)

						if (storagePath) {
							console.log(`Deleting file from storage: ${storagePath}`)
							const { error: deleteError } = await supabaseAdmin.storage
								.from('lms')
								.remove([storagePath])

							if (deleteError) {
								console.error(`Error deleting file ${storagePath}:`, deleteError)
								// Continue with other deletions even if this one failed
							}
						} else {
							console.warn(`Could not determine storage path for URL: ${fileUrl}`)
						}
					}
				} catch (deleteError) {
					console.error('Error during file deletion:', deleteError)
					// Continue with the update even if file deletion had issues
				}
			}

			// Process file uploads if there are new files
			let updatedFileUrlArray = [...existingFiles] // Start with existing files (minus any deleted)

			if (editAssignmentFiles.length > 0) {
				try {
					// Set upload progress initial state
					setEditUploadProgress({
						current: 0,
						total: editAssignmentFiles.length,
					})

					// Check if the lms bucket exists
					const { data: buckets, error: bucketListError } =
						await supabaseAdmin.storage.listBuckets()

					if (bucketListError) {
						console.error('Error listing buckets:', bucketListError)
						throw bucketListError
					}

					const lmsBucketExists = buckets.some(bucket => bucket.name === 'lms')

					if (!lmsBucketExists) {
						console.log('LMS bucket does not exist, attempting to create it...')
						const { data, error } = await supabaseAdmin.storage.createBucket('lms', {
							public: true,
							fileSizeLimit: 52428800, // 50MB
							allowedMimeTypes: [
								'image/*',
								'application/pdf',
								'application/msword',
								'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
							],
						})

						if (error) {
							console.error('Failed to create lms bucket:', error)
							throw new Error(`Failed to create storage bucket: ${error.message}`)
						}
					}

					// Upload each new file
					for (let i = 0; i < editAssignmentFiles.length; i++) {
						const file = editAssignmentFiles[i]

						// Update progress counter
						setEditUploadProgress({
							current: i,
							total: editAssignmentFiles.length,
						})

						// Generate a unique file name
						const fileExt = file.name.split('.').pop()
						const fileName = `edit_${selectedAssignment.id}_${Date.now()}_${Math.random()
							.toString(36)
							.substring(2, 15)}.${fileExt}`

						// Upload path
						const filePath = `assignments/${fileName}`

						// Upload to Supabase Storage
						const { data, error } = await supabaseAdmin.storage.from('lms').upload(filePath, file, {
							cacheControl: '3600',
							upsert: true,
						})

						if (error) {
							console.error('Error during upload:', error)
							throw error
						}

						// Get public URL
						const { data: urlData } = supabaseAdmin.storage.from('lms').getPublicUrl(filePath)

						if (urlData) {
							updatedFileUrlArray.push({
								name: file.name,
								url: urlData.publicUrl,
							})
						}
					}

					// Set final upload count
					setEditUploadProgress({
						current: editAssignmentFiles.length,
						total: editAssignmentFiles.length,
					})
				} catch (uploadError) {
					console.error('Error in file upload process:', uploadError)
					if (uploadError instanceof Error) {
						toast.error(`Upload failed: ${uploadError.message}`)
					} else {
						toast.error('Failed to upload files')
					}
					return
				}
			}

			// Update the assignment
			const { data, error } = await supabase
				.from('assignments')
				.update({
					title: editFormData.title,
					instructions: editFormData.content,
					classid: editFormData.classid,
					duedate: dueDate,
					subject_id: editFormData.subject_id,
					// Add file_url to the update
					file_url: updatedFileUrlArray,
				})
				.eq('id', selectedAssignment.id)
				.select('*, subjects(*), profiles:createdby (email)')

			if (error) {
				console.error('Error updating assignment:', error)
				toast.error(`Failed to update assignment: ${error.message}`)
				return
			}

			// Find the class name
			const classObj = classes.find(c => c.id === editFormData.classid)

			// Update the assignments state with data including the subject from the joined query
			setAssignments(prev =>
				prev.map(a =>
					a.id === selectedAssignment.id
						? {
								...a,
								...data[0],
								title: editFormData.title,
								instructions: editFormData.content,
								content: editFormData.content,
								classid: editFormData.classid,
								class_name: classObj?.classname || 'Unknown Class',
								duedate: dueDate,
								subject_id: editFormData.subject_id,
								creator_email: data[0].profiles?.email || a.creator_email || 'Unknown',
								file_url: updatedFileUrlArray,
						  }
						: a
				)
			)

			// Reset states
			setEditAssignmentFiles([])
			setExistingFiles([])
			setFilesToDelete([])

			setShowEditModal(false)
			toast.success('Assignment updated successfully!')
		} catch (error) {
			console.error('Error updating assignment:', error)
			let errorMessage = 'Failed to update assignment'
			if (error instanceof Error) {
				errorMessage = `${errorMessage}: ${error.message}`
			}
			toast.error(errorMessage)
		} finally {
			setIsUploading(false)
			setEditUploadProgress({ current: 0, total: 0 })
		}
	}

	// Handle delete button click
	const handleDeleteClick = async (assignment: Assignment) => {
		// Check if user has permission to delete assignments
		if (!hasPermission('delete_assignments')) {
			toast.error("You don't have permission to delete assignments")
			return
		}

		// Show confirmation before deleting
		if (window.confirm(`Are you sure you want to delete the assignment "${assignment.title}"?`)) {
			try {
				console.log('Attempting to delete assignment with ID:', assignment.id)

				// Check if the assignment has files that need to be deleted
				if (assignment.file_url) {
					try {
						const fileUrls: string[] = []

						if (Array.isArray(assignment.file_url)) {
							// New format: array of objects with url
							assignment.file_url.forEach(file => {
								if (file.url) fileUrls.push(file.url)
							})
						} else if (typeof assignment.file_url === 'string') {
							// Old format: direct URL string
							fileUrls.push(assignment.file_url)
						}

						// Delete files from storage
						if (fileUrls.length > 0) {
							console.log(
								`Deleting ${fileUrls.length} files from storage for assignment ${assignment.id}`
							)

							for (const fileUrl of fileUrls) {
								const storagePath = getStoragePathFromUrl(fileUrl)

								if (storagePath) {
									console.log(`Deleting file from storage: ${storagePath}`)
									const { error: deleteError } = await supabaseAdmin.storage
										.from('lms')
										.remove([storagePath])

									if (deleteError) {
										console.error(`Error deleting file ${storagePath}:`, deleteError)
										// Continue with other deletions even if this one failed
									}
								} else {
									console.warn(`Could not determine storage path for URL: ${fileUrl}`)
								}
							}
						}
					} catch (fileDeleteError) {
						console.error('Error deleting assignment files:', fileDeleteError)
						// Continue with deleting the assignment even if file deletion failed
					}
				}

				const { error } = await supabase.from('assignments').delete().eq('id', assignment.id)

				if (error) {
					console.error('Supabase error details:', error)

					// Show the specific error message from Supabase
					const errorMessage = error.message || 'Unknown database error'
					const errorDetails = error.details || ''
					const errorCode = error.code || ''

					console.error(
						`Error code: ${errorCode}, Message: ${errorMessage}, Details: ${errorDetails}`
					)

					toast.error(`Failed to delete assignment: ${errorMessage}`)
					return
				}

				// Update assignments state
				setAssignments(prev => prev.filter(a => a.id !== assignment.id))

				toast.success(`Assignment "${assignment.title}" deleted successfully!`)
				console.log('Assignment deleted successfully')
			} catch (error) {
				console.error('Error deleting assignment:', error)

				// More detailed error reporting
				let errorMessage = 'Failed to delete assignment'
				if (error instanceof Error) {
					errorMessage = `${errorMessage}: ${error.message}`
					console.error('Error stack:', error.stack)
				}

				toast.error(errorMessage)
			}
		} else {
			console.log('Deletion cancelled by user')
			toast.info('Deletion cancelled')
		}
	}

	// Filter assignments based on search term
	const filteredAssignments = assignments.filter(
		assignment =>
			(assignment.title && assignment.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(assignment.class_name &&
				assignment.class_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(assignment.content && assignment.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(assignment.description &&
				assignment.description.toLowerCase().includes(searchTerm.toLowerCase()))
	)

	// Format date for display with time
	const formatDate = (dateString: string | undefined) => {
		if (!dateString) return 'N/A'

		try {
			// This function handles formatting any date string
			console.log('Formatting date and time:', dateString)
			const date = new Date(dateString)
			if (isNaN(date.getTime())) {
				console.error('Invalid date value:', dateString)
				return 'N/A'
			}

			// Format with date and time in a more readable format
			const formattedDate = date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			})

			const formattedTime = date.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: true,
			})

			return `${formattedDate} • ${formattedTime}`
		} catch (error) {
			console.error('Error formatting date:', error, 'for value:', dateString)
			return 'N/A'
		}
	}

	// Add file upload functions

	// Function to handle file upload
	const handleFileUpload = async (assignmentId: string, files: FileList) => {
		if (!files || files.length === 0) {
			console.log('No files selected for upload')
			return
		}

		console.log(
			`Starting upload process for ${files.length} file(s) for assignment ${assignmentId}`
		)

		// Set uploading state for this assignment
		setUploading(prev => ({ ...prev, [assignmentId]: true }))

		try {
			// Check if assignment already has files
			let existingFiles: Array<{ name: string; url: string }> = []
			const { data: assignmentData, error: assignmentError } = await supabase
				.from('assignments')
				.select('file_url')
				.eq('id', assignmentId)
				.single()

			if (!assignmentError && assignmentData && assignmentData.file_url) {
				// Parse existing file URLs - now they're in array format
				existingFiles = Array.isArray(assignmentData.file_url) ? assignmentData.file_url : [] // Use empty array if not an array
				console.log('Existing files:', existingFiles)
			}

			// Start with existing files
			let updatedFiles = [...existingFiles]

			// Check if the lms bucket exists first
			try {
				const { data: buckets, error: bucketListError } = await supabaseAdmin.storage.listBuckets()

				if (bucketListError) {
					console.error('Error listing buckets:', bucketListError)
					throw bucketListError
				}

				const lmsBucketExists = buckets.some(bucket => bucket.name === 'lms')
				console.log('Does lms bucket exist?', lmsBucketExists)

				if (!lmsBucketExists) {
					console.log('LMS bucket does not exist, attempting to create it...')
					const { data, error } = await supabaseAdmin.storage.createBucket('lms', {
						public: true,
						fileSizeLimit: 52428800, // 50MB
						allowedMimeTypes: [
							'image/*',
							'application/pdf',
							'application/msword',
							'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
						],
					})

					if (error) {
						console.error('Failed to create lms bucket:', error)
						throw new Error(`Failed to create storage bucket: ${error.message}`)
					}

					console.log('Created lms bucket successfully:', data)
				}
			} catch (bucketCheckError) {
				console.error('Error during bucket check:', bucketCheckError)
				toast.error('Storage system error. Please contact administrator.')
				setUploading(prev => ({ ...prev, [assignmentId]: false }))
				return
			}

			// Create assignments folder if it doesn't exist
			const assignmentsFolder = 'assignments/'
			try {
				const { data: folderCheck } = await supabaseAdmin.storage
					.from('lms')
					.list(assignmentsFolder)

				console.log('Assignments folder check:', folderCheck)
			} catch (folderError) {
				console.log('Assignments folder might not exist, will be created automatically')
			}

			// Upload each file to Supabase storage
			for (let i = 0; i < files.length; i++) {
				const file = files[i]
				console.log(
					`Preparing to upload file: ${file.name}, size: ${file.size}, type: ${file.type}`
				)

				const fileExt = file.name.split('.').pop()
				const fileName = `${assignmentId}_${Date.now()}_${Math.random()
					.toString(36)
					.substring(2, 15)}.${fileExt}`
				// Use assignments folder inside lms bucket
				const filePath = `assignments/${fileName}`

				console.log(`Generated file path: ${filePath} in bucket 'lms'`)

				// Upload to Supabase Storage in the lms bucket
				console.log('Uploading file to Supabase storage in lms bucket...')
				const { data, error } = await supabaseAdmin.storage.from('lms').upload(filePath, file, {
					cacheControl: '3600',
					upsert: true,
				})

				if (error) {
					console.error('Error during upload:', error)
					console.error('Error details:', error.message, error.stack)
					throw error
				}

				console.log('File uploaded successfully, data:', data)

				// Get public URL from the lms bucket
				const { data: urlData } = supabaseAdmin.storage.from('lms').getPublicUrl(filePath)

				if (urlData) {
					console.log('Generated public URL:', urlData.publicUrl)
					// Add new file object to the array
					updatedFiles.push({
						name: file.name, // Store original file name
						url: urlData.publicUrl,
					})
				} else {
					console.error('Failed to generate public URL for uploaded file')
				}
			}

			// Update the assignment's file_url in the database with the array of objects
			console.log('Updating assignment record with file URLs array:', updatedFiles)
			const { data: updateData, error: updateError } = await supabase
				.from('assignments')
				.update({ file_url: updatedFiles })
				.eq('id', assignmentId)
				.select()

			if (updateError) {
				console.error('Error updating assignment record:', updateError)
				throw updateError
			}

			console.log('Assignment record updated successfully:', updateData)

			// Update local state to show the file has been uploaded
			setHasUploadedFiles(prev => ({ ...prev, [assignmentId]: true }))

			// Success message
			toast.success(`${files.length} file(s) uploaded successfully!`)

			// Refresh assignments to get the updated data
			fetchAssignments()
		} catch (error) {
			console.error('Error in file upload process:', error)
			if (error instanceof Error) {
				toast.error(`Upload failed: ${error.message}`)
			} else {
				toast.error('Failed to upload files')
			}
		} finally {
			// Reset uploading state
			setUploading(prev => ({ ...prev, [assignmentId]: false }))
		}
	}

	// Helper function to trigger file input click
	const openFileSelector = (assignmentId: string) => {
		console.log('Opening file selector for assignment ID:', assignmentId)
		currentAssignmentRef.current = assignmentId

		// Ensure file input exists
		if (!fileInputRef.current) {
			console.error('File input reference is not available')
			toast.error('Could not open file selector. Please try again.')
			return
		}

		// Trigger click with a small delay to ensure state is updated
		setTimeout(() => {
			if (fileInputRef.current) {
				fileInputRef.current.click()
			}
		}, 50)
	}

	// Handle file selection
	const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
		console.log('File selection triggered:', e)
		const files = e.target.files
		const assignmentId = currentAssignmentRef.current

		// Clear the input right away to allow re-selection of the same file
		if (fileInputRef.current) {
			// Store the files in a variable before clearing the input
			const selectedFiles = files ? Array.from(files) : null
			fileInputRef.current.value = ''

			if (!assignmentId) {
				console.error('No assignment ID set for file upload')
				toast.error('Error: Unable to determine which assignment to upload files for')
				return
			}

			if (!selectedFiles || selectedFiles.length === 0) {
				console.log('No files selected')
				toast.info('No files were selected for upload')
				return
			}

			console.log(`Processing ${selectedFiles.length} files for assignment ${assignmentId}`)

			// Check for file size limits
			let totalSize = 0
			let oversizedFiles: string[] = []

			for (const file of selectedFiles) {
				totalSize += file.size

				// Check individual file size (20MB limit)
				if (file.size > 20 * 1024 * 1024) {
					oversizedFiles.push(file.name)
				}
			}

			// Check if any individual files are too large
			if (oversizedFiles.length > 0) {
				console.error('Some files exceed size limit:', oversizedFiles)
				toast.error(`Some files are too large (max 20MB per file): ${oversizedFiles.join(', ')}`)
				return
			}

			// Check total upload size (50MB limit)
			if (totalSize > 50 * 1024 * 1024) {
				console.error('Total upload size exceeds limit:', totalSize)
				toast.error('Total upload size exceeds 50MB limit. Please select fewer files.')
				return
			}

			// Convert FileList to regular array and create a new FileList-like object
			const transferList = new DataTransfer()
			for (const file of selectedFiles) {
				transferList.items.add(file)
			}

			// Proceed with upload
			handleFileUpload(assignmentId, transferList.files)
		} else {
			console.error('File input reference lost')
			toast.error('Upload failed: Could not process selected files')
		}
	}

	// Function to open file preview modal
	const openFilePreview = (assignment: Assignment) => {
		if (
			!assignment.file_url ||
			!Array.isArray(assignment.file_url) ||
			assignment.file_url.length === 0
		) {
			console.log('No files to preview for this assignment')
			toast.info('No files have been uploaded for this assignment')
			return
		}

		console.log('Opening file preview for file objects:', assignment.file_url)

		// Extract URL objects from the array
		const files = assignment.file_url.map(file => ({
			name: file.name,
			url: file.url,
		}))

		// Validate URLs
		if (files.length === 0) {
			console.error('Invalid file data:', files)
			toast.error('Unable to preview files: Invalid file data')
			return
		}

		setPreviewFiles(files.map(file => file.url)) // Still use urls for preview
		setCurrentFileIndex(0)
		setPreviewTitle(assignment.title || 'File Preview')
		setShowPreviewModal(true)
	}

	// Function to determine file type
	const getFileType = (url: string): 'image' | 'pdf' | 'other' => {
		try {
			if (!url) return 'other'

			// Extract file extension
			const ext = url.split('.').pop()?.toLowerCase()
			console.log('File extension detected:', ext)

			if (!ext) return 'other'

			// Check image types
			if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
				return 'image'
			}

			// Check PDF
			if (ext === 'pdf') {
				return 'pdf'
			}

			// Default to other
			return 'other'
		} catch (error) {
			console.error('Error determining file type:', error)
			return 'other'
		}
	}

	// Function to navigate between files in preview
	const navigatePreview = (direction: 'next' | 'prev') => {
		if (direction === 'next' && currentFileIndex < previewFiles.length - 1) {
			setCurrentFileIndex(currentFileIndex + 1)
		} else if (direction === 'prev' && currentFileIndex > 0) {
			setCurrentFileIndex(currentFileIndex - 1)
		}
	}

	// Add this function to handle file selection for a new assignment
	const handleNewAssignmentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) {
			return
		}

		// Convert FileList to array and add to current files
		const fileArray = Array.from(files)

		// Validate file sizes (20MB limit per file)
		const validFiles = fileArray.filter(file => {
			if (file.size > 20 * 1024 * 1024) {
				toast.error(`File ${file.name} is too large (max 20MB)`)
				return false
			}
			return true
		})

		// Check total size (50MB limit total)
		const newTotalSize = [...newAssignmentFiles, ...validFiles].reduce(
			(total, file) => total + file.size,
			0
		)
		if (newTotalSize > 50 * 1024 * 1024) {
			toast.error('Total file size exceeds 50MB limit')
			return
		}

		setNewAssignmentFiles(prev => [...prev, ...validFiles])
		console.log(`${validFiles.length} files selected`)
	}

	// Add a function to handle dropped files
	const handleDropFile = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(false)

		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			const fileArray = Array.from(e.dataTransfer.files)

			// Validate file sizes (20MB limit per file)
			const validFiles = fileArray.filter(file => {
				if (file.size > 20 * 1024 * 1024) {
					toast.error(`File ${file.name} is too large (max 20MB)`)
					return false
				}
				return true
			})

			// Check total size (50MB limit total)
			const newTotalSize = [...newAssignmentFiles, ...validFiles].reduce(
				(total, file) => total + file.size,
				0
			)
			if (newTotalSize > 50 * 1024 * 1024) {
				toast.error('Total file size exceeds 50MB limit')
				return
			}

			setNewAssignmentFiles(prev => [...prev, ...validFiles])
			console.log(`${validFiles.length} files dropped`)
		}
	}

	// Add function to remove a file from the selected files
	const removeFile = (index: number) => {
		setNewAssignmentFiles(prev => prev.filter((_, i) => i !== index))
	}

	// Add function to handle file selection for edit mode
	const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) return

		const fileArray = Array.from(files)

		// Validate file sizes (20MB limit per file)
		const validFiles = fileArray.filter(file => {
			if (file.size > 20 * 1024 * 1024) {
				toast.error(`File ${file.name} is too large (max 20MB)`)
				return false
			}
			return true
		})

		// Check total size (including existing files)
		const newTotalSize = [...editAssignmentFiles, ...validFiles].reduce(
			(total, file) => total + file.size,
			0
		)
		if (newTotalSize > 50 * 1024 * 1024) {
			toast.error('Total file size exceeds 50MB limit')
			return
		}

		setEditAssignmentFiles(prev => [...prev, ...validFiles])
	}

	// Add function to remove a file from edit mode
	const removeEditFile = (index: number) => {
		setEditAssignmentFiles(prev => prev.filter((_, i) => i !== index))
	}

	// Add function to mark an existing file for deletion
	const markFileForDeletion = (url: string) => {
		setFilesToDelete(prev => [...prev, url])
		setExistingFiles(prev => prev.filter(file => file.url !== url))
	}

	return (
		<PageContainer>
			<Header>
				<TitleSection>
					<Title>Assignments</Title>
					<Description>Manage all assignments across classes</Description>
				</TitleSection>
				<ActionSection>
					<SearchContainer>
						<SearchIcon>
							<FiSearch size={18} />
						</SearchIcon>
						<SearchInput
							type='text'
							placeholder='Search assignments...'
							value={searchTerm}
							onChange={handleSearchChange}
						/>
					</SearchContainer>
					{/* Only show Add button if user has create permission */}
					{hasPermission('create_assignments') && (
						<AddButton onClick={() => setShowModal(true)}>
							<FiPlus size={20} />
							<span>Add Assignment</span>
						</AddButton>
					)}
				</ActionSection>
			</Header>

			<ContentSection>
				{isLoadingPermissions || isLoading ? (
					<LoadingContainer>
						<LoadingSpinner />
						<p>{isLoadingPermissions ? 'Checking permissions...' : 'Loading assignments...'}</p>
					</LoadingContainer>
				) : !hasPermission('read_assignments') ? (
					<NoPermissionMessage>
						<FiAlertCircle size={48} />
						<h3>Permission Denied</h3>
						<p>You don't have permission to view assignments.</p>
					</NoPermissionMessage>
				) : filteredAssignments.length === 0 ? (
					<EmptyState>
						<EmptyStateIcon>
							<FiClock size={40} />
						</EmptyStateIcon>
						<EmptyStateTitle>No Assignments Found</EmptyStateTitle>
						<EmptyStateDescription>
							{searchTerm
								? 'No assignments match your search criteria.'
								: 'Start by adding a new assignment.'}
						</EmptyStateDescription>
						{!searchTerm && hasPermission('create_assignments') && (
							<AddButton onClick={() => setShowModal(true)}>
								<FiPlus size={20} />
								<span>Add Assignment</span>
							</AddButton>
						)}
					</EmptyState>
				) : (
					<AssignmentsTable>
						<TableHead>
							<TableRow>
								<TableHeader>Assignment</TableHeader>
								<TableHeader>Course</TableHeader>
								<TableHeader>Subject</TableHeader>
								<TableHeader style={{ cursor: 'pointer' }}>
									Due Date <FiChevronDown size={16} style={{ verticalAlign: 'middle' }} />
								</TableHeader>
								<TableHeader>Creator Email</TableHeader>
								<TableHeader>Actions</TableHeader>
							</TableRow>
						</TableHead>
						<TableBody>
							{filteredAssignments.map(assignment => {
								return (
									<TableRow key={assignment.id}>
										<TableCell>
											<AssignmentInfo>
												<Icon>
													<FiFolder />
												</Icon>
												<div>
													<AssignmentTitle>{assignment.title}</AssignmentTitle>
													<ClassInfo>
														{assignment.class_name ||
															(assignment.classes &&
																(typeof assignment.classes === 'object' &&
																'classname' in assignment.classes
																	? assignment.classes.classname
																	: Array.isArray(assignment.classes)
																	? assignment.classes[0]?.classname
																	: '')) ||
															'Unknown Class'}
													</ClassInfo>
												</div>
											</AssignmentInfo>
										</TableCell>
										<TableCell>
											<CourseTag>{assignment.class_name}</CourseTag>
										</TableCell>
										<TableCell>
											<SubjectTag
												isSubjectLoading={isLoadingSubjects}
												isSubjectAvailable={!!assignment.subjects?.subjectname}
											>
												{assignment.subjects?.subjectname || 'No subject'}
											</SubjectTag>
										</TableCell>
										<TableCell>
											<DateDisplay>
												<FiCalendar size={16} style={{ marginRight: '8px' }} />
												{formatDate(assignment.duedate)}
											</DateDisplay>
										</TableCell>
										<TableCell>
											<CreatorEmailBadge email={assignment.creator_email || 'Unknown'} />
										</TableCell>
										<TableCell>
											<ActionButtons>
												{/* Only show Edit button if user has update permission */}
												{hasPermission('update_assignments') && (
													<ActionButton title='Edit' onClick={() => handleEditClick(assignment)}>
														<FiEdit size={18} />
													</ActionButton>
												)}
												{/* Only show Delete button if user has delete permission */}
												{hasPermission('delete_assignments') && (
													<ActionButton
														title='Delete'
														variant='danger'
														onClick={() => handleDeleteClick(assignment)}
													>
														<FiTrash size={18} />
													</ActionButton>
												)}
												<ActionButton
													title='View Uploads'
													variant='secondary'
													onClick={() => {
														if (
															!assignment.file_url ||
															!Array.isArray(assignment.file_url) ||
															assignment.file_url.length === 0
														) {
															toast.info('No files uploaded for this assignment')
															return
														}
														// Navigate to the assignment files page
														window.location.href = `/admin/assignments/files/${assignment.id}`
													}}
													disabled={
														!assignment.file_url ||
														!Array.isArray(assignment.file_url) ||
														assignment.file_url.length === 0
													}
													style={{
														opacity:
															!assignment.file_url ||
															!Array.isArray(assignment.file_url) ||
															assignment.file_url.length === 0
																? 0.5
																: 1,
													}}
												>
													<FiPaperclip />
												</ActionButton>
												{/* Only show Upload button if user has update permission */}
												{hasPermission('update_assignments') && (
													<ActionButton
														title='Upload Files'
														variant='primary'
														onClick={e => {
															e.preventDefault()
															e.stopPropagation()
															openFileSelector(assignment.id)
														}}
														disabled={uploading[assignment.id]}
														style={{
															opacity: uploading[assignment.id] ? 0.7 : 1,
															position: 'relative',
														}}
													>
														{uploading[assignment.id] ? (
															<Spinner />
														) : (
															<>
																<FiUploadCloud />
																{(hasUploadedFiles[assignment.id] ||
																	(assignment.file_url &&
																		Array.isArray(assignment.file_url) &&
																		assignment.file_url.length > 0)) && (
																	<FileIndicator>
																		<FiPaperclip size={10} />
																	</FileIndicator>
																)}
															</>
														)}
													</ActionButton>
												)}
											</ActionButtons>
										</TableCell>
									</TableRow>
								)
							})}
						</TableBody>
					</AssignmentsTable>
				)}
			</ContentSection>

			{/* Add Assignment Modal */}
			{showModal && (
				<ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
					<ModalContent
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
					>
						<ModalHeader>
							<ModalTitle>Add New Assignment</ModalTitle>
							<CloseButton onClick={() => setShowModal(false)}>
								<FiX size={24} />
							</CloseButton>
						</ModalHeader>
						<ModalBody>
							<Form onSubmit={handleSubmit}>
								<FormGroup>
									<Label htmlFor='title'>Title</Label>
									<Input
										type='text'
										id='title'
										name='title'
										value={formData.title}
										onChange={handleFormChange}
										placeholder='Enter assignment title'
									/>
									{formErrors.title && <ErrorMessage>{formErrors.title}</ErrorMessage>}
								</FormGroup>

								<FormGroup>
									<Label htmlFor='content'>Description</Label>
									<TextArea
										id='content'
										name='content'
										value={formData.content}
										onChange={handleFormChange}
										placeholder='Enter assignment description'
										rows={3}
									/>
									{formErrors.content && <ErrorMessage>{formErrors.content}</ErrorMessage>}
								</FormGroup>

								<FormGroup>
									<Label htmlFor='classid'>Class</Label>
									<Select
										id='classid'
										name='classid'
										value={formData.classid}
										onChange={handleFormChange}
									>
										<option value='' disabled defaultChecked>
											Select a class
										</option>
										{classes.map(cls => (
											<option key={cls.id} value={cls.id}>
												{cls.classname}
											</option>
										))}
									</Select>
									{formErrors.classid && <ErrorMessage>{formErrors.classid}</ErrorMessage>}
								</FormGroup>

								<FormGroup>
									<Label htmlFor='subject_id'>Subject</Label>
									<Select
										id='subject_id'
										name='subject_id'
										value={formData.subject_id}
										onChange={handleFormChange}
										disabled={!formData.classid || isLoadingSubjects || !hasSubjectsForClass}
									>
										<option value='' disabled defaultChecked>
											{!formData.classid
												? 'Select a class first'
												: isLoadingSubjects
												? 'Loading subjects...'
												: !hasSubjectsForClass
												? 'No subjects available for this class'
												: 'Select a subject'}
										</option>
										{filteredSubjects.map(subject => (
											<option key={subject.id} value={subject.id}>
												{subject.subjectname}
											</option>
										))}
									</Select>
									{formErrors.subject_id && <ErrorMessage>{formErrors.subject_id}</ErrorMessage>}
									{formData.classid && !isLoadingSubjects && !hasSubjectsForClass && (
										<SubjectWarning>
											This class has no subjects. Please assign subjects to this class first.
										</SubjectWarning>
									)}
								</FormGroup>

								<FormGroup>
									<Label htmlFor='assigned_date'>Due Date & Time</Label>
									<Input
										type='datetime-local'
										id='assigned_date'
										name='assigned_date'
										value={formData.assigned_date}
										onChange={handleFormChange}
									/>
									{formErrors.assigned_date && (
										<ErrorMessage>{formErrors.assigned_date}</ErrorMessage>
									)}
								</FormGroup>

								<FormGroup>
									<Label htmlFor='assignment_file'>Assignment File (optional)</Label>
									<FileUploadContainer
										ref={dropAreaRef}
										isDragging={isDragging}
										onDragEnter={e => handleDragEvents(e, true)}
										onDragOver={e => handleDragEvents(e, true)}
										onDragLeave={e => handleDragEvents(e, false)}
										onDrop={handleDropFile}
									>
										{!newAssignmentFiles.length ? (
											<>
												<UploadIcon>
													<FiUploadCloud size={32} />
												</UploadIcon>
												<UploadText>
													<strong>Click to upload</strong> or drag and drop
												</UploadText>
												<UploadHint>PDF, Word, or image files (up to 50MB total)</UploadHint>
												<FileUploadButton
													type='button'
													onClick={() => newFileInputRef.current?.click()}
													disabled={isUploading}
												>
													Choose Files
												</FileUploadButton>
											</>
										) : (
											<>
												<FilesListHeader>
													<span>
														{newAssignmentFiles.length} file
														{newAssignmentFiles.length !== 1 ? 's' : ''} selected
													</span>
													<AddMoreButton
														onClick={e => {
															e.preventDefault()
															e.stopPropagation()
															newFileInputRef.current?.click()
														}}
													>
														Add More
													</AddMoreButton>
												</FilesListHeader>
												<FilesList>
													{newAssignmentFiles.map((file, index) => (
														<FilePreviewContainer key={index}>
															<FileTypeIcon>{getFileIconByType(file.name)}</FileTypeIcon>
															<FileDetails>
																<FileName>{file.name}</FileName>
																<FileSize>{formatFileSize(file.size)}</FileSize>
															</FileDetails>
															<RemoveFileButton
																onClick={e => {
																	e.preventDefault()
																	e.stopPropagation()
																	removeFile(index)
																}}
																title='Remove file'
															>
																<FiX size={18} />
															</RemoveFileButton>
														</FilePreviewContainer>
													))}
												</FilesList>
											</>
										)}
										<input
											type='file'
											id='assignment_file'
											ref={newFileInputRef}
											style={{ display: 'none' }}
											onChange={handleNewAssignmentFileChange}
											accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif'
											multiple // Add multiple attribute
										/>
									</FileUploadContainer>
								</FormGroup>

								<ButtonGroup>
									<CancelButton type='button' onClick={() => setShowModal(false)}>
										Cancel
									</CancelButton>
									<SubmitButton type='submit' disabled={isUploading}>
										{isUploading ? (
											<>
												<Spinner style={{ width: '14px', height: '14px', marginRight: '8px' }} />
												{uploadProgress.total > 0 ? (
													<span>
														Uploading file {uploadProgress.current + 1}/{uploadProgress.total}...
													</span>
												) : (
													<span>Uploading...</span>
												)}
											</>
										) : (
											<>
												<FiCheck size={18} />
												<span>Add Assignment</span>
											</>
										)}
									</SubmitButton>
								</ButtonGroup>
							</Form>
						</ModalBody>
					</ModalContent>
				</ModalOverlay>
			)}

			{/* Edit Assignment Modal */}
			{showEditModal && selectedAssignment && (
				<ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
					<ModalContent
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
					>
						<ModalHeader>
							<ModalTitle>Edit Assignment</ModalTitle>
							<CloseButton onClick={() => setShowEditModal(false)}>
								<FiX size={24} />
							</CloseButton>
						</ModalHeader>
						<ModalBody>
							<Form onSubmit={handleEditSubmit}>
								<FormGroup>
									<Label htmlFor='edit-title'>Title</Label>
									<Input
										type='text'
										id='edit-title'
										name='title'
										value={editFormData.title}
										onChange={handleEditFormChange}
										placeholder='Enter assignment title'
									/>
								</FormGroup>

								<FormGroup>
									<Label htmlFor='edit-content'>Description</Label>
									<TextArea
										id='edit-content'
										name='content'
										value={editFormData.content}
										onChange={handleEditFormChange}
										placeholder='Enter assignment description'
										rows={3}
									/>
								</FormGroup>

								<FormGroup>
									<Label htmlFor='edit-classid'>Class</Label>
									<Select
										id='edit-classid'
										name='classid'
										value={editFormData.classid}
										onChange={handleEditFormChange}
									>
										<option value='' disabled defaultChecked>
											Select a class
										</option>
										{classes.map(cls => (
											<option key={cls.id} value={cls.id}>
												{cls.classname}
											</option>
										))}
									</Select>
								</FormGroup>

								<FormGroup>
									<Label htmlFor='edit-subject_id'>Subject</Label>
									<Select
										id='edit-subject_id'
										name='subject_id'
										value={editFormData.subject_id}
										onChange={handleEditFormChange}
										disabled={!editFormData.classid || isLoadingSubjects || !hasSubjectsForClass}
									>
										<option value='' disabled defaultChecked>
											{!editFormData.classid
												? 'Select a class first'
												: isLoadingSubjects
												? 'Loading subjects...'
												: !hasSubjectsForClass
												? 'No subjects available for this class'
												: 'Select a subject'}
										</option>
										{filteredSubjects.map(subject => (
											<option key={subject.id} value={subject.id}>
												{subject.subjectname}
											</option>
										))}
									</Select>
									{editFormData.classid && !isLoadingSubjects && !hasSubjectsForClass && (
										<SubjectWarning>
											This class has no subjects. Please assign subjects to this class first.
										</SubjectWarning>
									)}
								</FormGroup>

								<FormGroup>
									<Label htmlFor='edit-assigned_date'>Due Date & Time</Label>
									<Input
										type='datetime-local'
										id='edit-assigned_date'
										name='assigned_date'
										value={editFormData.assigned_date}
										onChange={handleEditFormChange}
									/>
								</FormGroup>

								{/* Edit Assignment Modal - Inside the modal body after existing form groups */}
								<FormGroup>
									<Label>Assignment Files</Label>

									{/* Display existing files */}
									{existingFiles.length > 0 && (
										<>
											<FilesListHeader>
												<span>Existing Files</span>
											</FilesListHeader>
											<FilesList>
												{existingFiles.map((file, index) => (
													<FilePreviewContainer key={`existing-${index}`}>
														<FileTypeIcon>{getFileIconByType(file.name || 'unknown')}</FileTypeIcon>
														<FileDetails>
															<FileName>{file.name || getFileName(file.url)}</FileName>
															<FileInfo>From previous upload</FileInfo>
														</FileDetails>
														<RemoveFileButton
															onClick={e => {
																e.preventDefault()
																e.stopPropagation()
																markFileForDeletion(file.url)
															}}
															title='Remove file'
														>
															<FiX size={18} />
														</RemoveFileButton>
													</FilePreviewContainer>
												))}
											</FilesList>
										</>
									)}

									{/* Display newly added files */}
									{editAssignmentFiles.length > 0 && (
										<>
											<FilesListHeader>
												<span>New Files to Upload</span>
											</FilesListHeader>
											<FilesList>
												{editAssignmentFiles.map((file, index) => (
													<FilePreviewContainer key={`new-${index}`}>
														<FileTypeIcon>{getFileIconByType(file.name)}</FileTypeIcon>
														<FileDetails>
															<FileName>{file.name}</FileName>
															<FileSize>{formatFileSize(file.size)}</FileSize>
														</FileDetails>
														<RemoveFileButton
															onClick={e => {
																e.preventDefault()
																e.stopPropagation()
																removeEditFile(index)
															}}
															title='Remove file'
														>
															<FiX size={18} />
														</RemoveFileButton>
													</FilePreviewContainer>
												))}
											</FilesList>
										</>
									)}

									{/* File upload button */}
									<FileUploadButton
										type='button'
										onClick={() => editFileInputRef.current?.click()}
										disabled={isUploading}
										style={{ marginTop: '10px' }}
									>
										<FiUploadCloud size={16} style={{ marginRight: '8px' }} />
										{existingFiles.length > 0 || editAssignmentFiles.length > 0
											? 'Add More Files'
											: 'Add Files'}
									</FileUploadButton>

									<input
										type='file'
										ref={editFileInputRef}
										style={{ display: 'none' }}
										onChange={handleEditFileChange}
										accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif'
										multiple
									/>
								</FormGroup>

								<ButtonGroup>
									<CancelButton type='button' onClick={() => setShowEditModal(false)}>
										Cancel
									</CancelButton>
									<SubmitButton type='submit' disabled={isUploading}>
										{isUploading ? (
											<>
												<Spinner style={{ width: '14px', height: '14px', marginRight: '8px' }} />
												{editUploadProgress.total > 0 ? (
													<span>
														Uploading file {editUploadProgress.current + 1}/
														{editUploadProgress.total}...
													</span>
												) : (
													<span>Saving...</span>
												)}
											</>
										) : (
											<>
												<FiCheck size={18} />
												<span>Save Changes</span>
											</>
										)}
									</SubmitButton>
								</ButtonGroup>
							</Form>
						</ModalBody>
					</ModalContent>
				</ModalOverlay>
			)}

			{/* Hidden file input - now with multiple attribute */}
			<input
				type='file'
				ref={fileInputRef}
				style={{ display: 'none' }}
				onChange={handleFileSelection}
				multiple
			/>

			{/* File Preview Modal */}
			{showPreviewModal && (
				<ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
					<PreviewModalContent>
						<ModalHeader>
							<div>
								<ModalTitle>{previewTitle}</ModalTitle>
								<FileCounter>
									File {currentFileIndex + 1} of {previewFiles.length}
								</FileCounter>
							</div>
							<PreviewControls>
								<NavigationButton
									onClick={() => navigatePreview('prev')}
									disabled={currentFileIndex === 0}
								>
									<FiChevronLeft size={24} />
								</NavigationButton>
								<NavigationButton
									onClick={() => navigatePreview('next')}
									disabled={currentFileIndex === previewFiles.length - 1}
								>
									<FiChevronRight size={24} />
								</NavigationButton>
								<CloseButton onClick={() => setShowPreviewModal(false)}>
									<FiX size={24} />
								</CloseButton>
							</PreviewControls>
						</ModalHeader>
						<PreviewContainer>
							{previewFiles.length > 0 &&
								(() => {
									const currentFile = previewFiles[currentFileIndex]
									const fileType = getFileType(currentFile)

									switch (fileType) {
										case 'image':
											return (
												<img
													src={currentFile}
													alt='Preview'
													style={{ maxWidth: '100%', maxHeight: '80vh' }}
												/>
											)
										case 'pdf':
											return (
												<iframe
													src={currentFile}
													title='PDF preview'
													width='100%'
													height='100%'
													style={{ border: 'none', minHeight: '80vh' }}
												/>
											)
										default:
											return (
												<UnsupportedPreview>
													<FiFileText size={64} />
													<p>This file type cannot be previewed</p>
													<DownloadButton
														as='a'
														href={currentFile}
														download
														target='_blank'
														rel='noopener noreferrer'
													>
														<FiDownload size={16} />
														<span>Download File</span>
													</DownloadButton>
												</UnsupportedPreview>
											)
									}
								})()}
						</PreviewContainer>
					</PreviewModalContent>
				</ModalOverlay>
			)}
		</PageContainer>
	)
}

// Styled Components
const PageContainer = styled.div`
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
`

const Header = styled.header`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 2rem;
	flex-wrap: wrap;
	gap: 1rem;

	@media (max-width: 768px) {
		flex-direction: column;
	}
`

const TitleSection = styled.div`
	margin-right: 1rem;
`

const Title = styled.h1`
	font-size: 1.75rem;
	font-weight: 600;
	margin: 0 0 0.5rem;
	color: ${props => props.theme.colors?.text?.primary || '#333'};
`

const Description = styled.p`
	font-size: 0.875rem;
	color: ${props => props.theme.colors?.text?.secondary || '#666'};
	margin: 0;
`

const ActionSection = styled.div`
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;

	@media (max-width: 768px) {
		width: 100%;
	}
`

const SearchContainer = styled.div`
	position: relative;
	width: 300px;

	@media (max-width: 768px) {
		width: 100%;
	}
`

const SearchIcon = styled.div`
	position: absolute;
	left: 0.75rem;
	top: 50%;
	transform: translateY(-50%);
	color: ${props => props.theme.colors?.text?.tertiary || '#999'};
`

const SearchInput = styled.input`
	width: 100%;
	padding: 0.625rem 0.75rem 0.625rem 2.5rem;
	font-size: 0.875rem;
	border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	border-radius: 0.5rem;
	outline: none;

	&:focus {
		border-color: ${props => props.theme.colors?.primary[500] || '#3498db'};
		box-shadow: 0 0 0 2px ${props => props.theme.colors?.primary[100] || 'rgba(52, 152, 219, 0.2)'};
	}
`

const AddButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.625rem 1rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: white;
	background-color: ${props => props.theme.colors?.primary[500] || '#3498db'};
	border: none;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors?.primary[600] || '#2980b9'};
	}
`

const ContentSection = styled.div`
	background-color: white;
	border-radius: 0.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	overflow: hidden;
`

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem;
	color: ${props => props.theme.colors?.text?.secondary || '#666'};

	p {
		margin-top: 1rem;
	}
`

const LoadingSpinner = styled.div`
	width: 2rem;
	height: 2rem;
	border: 3px solid ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
	border-top: 3px solid ${props => props.theme.colors?.primary[500] || '#3498db'};
	border-radius: 50%;
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

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 4rem 2rem;
	text-align: center;
`

const EmptyStateIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 80px;
	height: 80px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
	color: ${props => props.theme.colors?.text?.tertiary || '#999'};
	margin-bottom: 1.5rem;
`

const EmptyStateTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 500;
	margin: 0 0 0.75rem;
	color: ${props => props.theme.colors?.text?.primary || '#333'};
`

const EmptyStateDescription = styled.p`
	font-size: 0.875rem;
	color: ${props => props.theme.colors?.text?.secondary || '#666'};
	margin: 0 0 1.5rem;
	max-width: 400px;
`

const AssignmentsTable = styled.table`
	width: 100%;
	border-collapse: collapse;
`

const TableHead = styled.thead`
	background-color: ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
`

const TableBody = styled.tbody``

const TableRow = styled.tr`
	&:not(:last-child) {
		border-bottom: 1px solid ${props => props.theme.colors?.border?.light || '#E2E8F0'};
	}

	&:hover {
		background-color: ${props => props.theme.colors?.background?.hover || '#F7FAFC'};
	}
`

const TableHeader = styled.th`
	padding: 1rem;
	text-align: left;
	font-weight: 600;
	font-size: 0.875rem;
	color: ${props => props.theme.colors?.text?.secondary || '#4A5568'};
	background-color: #f8f9fa;
	border-bottom: 2px solid #e2e8f0;
`

const TableCell = styled.td`
	padding: 1rem;
	font-size: 0.875rem;
	color: ${props => props.theme.colors?.text?.primary || '#333'};
	vertical-align: middle;
`

const AssignmentInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
`

const Icon = styled.div`
	width: 40px;
	height: 40px;
	background-color: #ebf8ff;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
`

const AssignmentTitle = styled.h3`
	margin: 0;
	font-size: 1rem;
	font-weight: 500;
	color: #2d3748;
`

const ClassInfo = styled.div`
	margin: 4px 0 0;
	font-size: 0.875rem;
	color: #718096;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	max-width: 300px;
`

const CourseTag = styled.span`
	display: inline-block;
	background-color: #ebf8ff;
	color: #3182ce;
	padding: 4px 12px;
	border-radius: 16px;
	font-size: 0.875rem;
	font-weight: 500;
`

const SubjectTag = styled.span<{ isSubjectLoading: boolean; isSubjectAvailable: boolean }>`
	display: inline-block;
	background-color: ${props => (props.isSubjectAvailable ? '#f0fff4' : '#f0f0f0')};
	color: ${props => (props.isSubjectAvailable ? '#38a169' : '#666')};
	padding: 4px 12px;
	border-radius: 16px;
	font-size: 0.875rem;
	font-weight: 500;
	opacity: ${props => (props.isSubjectLoading ? 0.5 : 1)};
`

const DateDisplay = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	color: #4a5568;
	font-size: 0.875rem;
`

const StyledEmailBadge = styled.div`
	display: flex;
	align-items: center;
	padding: 4px 8px;
	border-radius: 4px;
	background-color: #f0f7ff;
	color: #2271b1;
	font-size: 0.85rem;
	max-width: 200px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

// Modal Components
const ModalOverlay = styled(motion.div)`
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
	padding: 1rem;
`

const ModalContent = styled(motion.div)`
	background-color: white;
	border-radius: 0.5rem;
	width: 100%;
	max-width: 500px;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.25rem;
	border-bottom: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
`

const ModalTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0;
	color: ${props => props.theme.colors?.text?.primary || '#333'};
`

const CloseButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	color: ${props => props.theme.colors?.text?.tertiary || '#999'};
	transition: color 0.2s ease;

	&:hover {
		color: ${props => props.theme.colors?.text?.secondary || '#666'};
	}
`

const ModalBody = styled.div`
	padding: 1.25rem;
`

const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`

const Label = styled.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: ${props => props.theme.colors?.text?.primary || '#333'};
`

const Input = styled.input`
	padding: 0.625rem 0.75rem;
	font-size: 0.875rem;
	border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	border-radius: 0.375rem;
	outline: none;

	&:focus {
		border-color: ${props => props.theme.colors?.primary[500] || '#3498db'};
		box-shadow: 0 0 0 2px ${props => props.theme.colors?.primary[100] || 'rgba(52, 152, 219, 0.2)'};
	}
`

const TextArea = styled.textarea`
	padding: 0.625rem 0.75rem;
	font-size: 0.875rem;
	border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	border-radius: 0.375rem;
	resize: vertical;
	min-height: 80px;
	outline: none;

	&:focus {
		border-color: ${props => props.theme.colors?.primary[500] || '#3498db'};
		box-shadow: 0 0 0 2px ${props => props.theme.colors?.primary[100] || 'rgba(52, 152, 219, 0.2)'};
	}
`

const Select = styled.select`
	padding: 0.625rem 0.75rem;
	font-size: 0.875rem;
	border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	border-radius: 0.375rem;
	background-color: white;
	outline: none;

	&:focus {
		border-color: ${props => props.theme.colors?.primary[500] || '#3498db'};
		box-shadow: 0 0 0 2px ${props => props.theme.colors?.primary[100] || 'rgba(52, 152, 219, 0.2)'};
	}
`

const ButtonGroup = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
	margin-top: 1rem;
`

const CancelButton = styled.button`
	padding: 0.625rem 1rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: ${props => props.theme.colors?.text?.primary || '#333'};
	background-color: white;
	border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	border-radius: 0.375rem;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
	}
`

const SubmitButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.625rem 1rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: white;
	background-color: ${props => props.theme.colors?.primary[500] || '#3498db'};
	border: none;
	border-radius: 0.375rem;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors?.primary[600] || '#2980b9'};
	}
`

const ErrorMessage = styled.div`
	color: ${props => props.theme.colors?.danger[500] || '#e74c3c'};
	font-size: 0.75rem;
	margin-top: 0.25rem;
	display: flex;
	align-items: center;
	gap: 0.25rem;

	&::before {
		content: '•';
		color: inherit;
	}
`

// Action buttons
const ActionButtons = styled.div`
	display: flex;
	gap: 8px;
`

const ActionButton = styled.button<{ variant?: 'danger' | 'primary' | 'secondary' }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 4px;
	background-color: ${props =>
		props.variant === 'danger'
			? '#FEE2E2'
			: props.variant === 'primary'
			? '#E6F6FF'
			: props.variant === 'secondary'
			? '#F1F5F9'
			: '#F9FAFB'};
	color: ${props =>
		props.variant === 'danger'
			? '#DC2626'
			: props.variant === 'primary'
			? '#0EA5E9'
			: props.variant === 'secondary'
			? '#475569'
			: '#718096'};
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props =>
			props.variant === 'danger'
				? '#FCA5A5'
				: props.variant === 'primary'
				? '#BAE6FD'
				: props.variant === 'secondary'
				? '#CBD5E1'
				: '#E2E8F0'};
		transform: translateY(-2px);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
`

// Add a CSS spinner for loading state
const Spinner = styled.div`
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	border: 2px solid rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	border-top: 2px solid #fff;
	width: 16px;
	height: 16px;
	animation: spin 1s linear infinite;
`

// Add a file indicator for assignments with uploaded files
const FileIndicator = styled.div`
	position: absolute;
	top: -4px;
	right: -4px;
	background-color: #10b981;
	color: white;
	border-radius: 50%;
	width: 14px;
	height: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 8px;
`

// Add styled components for file preview
const PreviewContainer = styled.div`
	padding: 20px;
	overflow: auto;
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #f7fafc;
`

const PreviewImage = styled.img`
	max-width: 100%;
	max-height: 60vh;
	object-fit: contain;
`

const PreviewFrame = styled.iframe`
	width: 100%;
	height: 60vh;
	border: none;
`

const PreviewFallback = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 2rem;
	text-align: center;
	color: #666;
`

const PreviewLink = styled.a`
	display: inline-block;
	margin-top: 1rem;
	padding: 0.75rem 1.5rem;
	background-color: #0ea5e9;
	color: white;
	border-radius: 4px;
	text-decoration: none;
	font-weight: 600;
	transition: all 0.2s ease;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	border: none;
	cursor: pointer;

	&:hover {
		background-color: #0284c7;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	&:active {
		transform: translateY(0);
		box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
	}
`

const PreviewNote = styled.div`
	margin-top: 1rem;
	font-size: 0.75rem;
	color: #666;
	font-style: italic;
	max-width: 400px;
	text-align: center;
`

const FileNavigation = styled.div`
	display: flex;
	align-items: center;
	flex: 1;
	gap: 1rem;
`

const FileNavButton = styled.button<{ disabled?: boolean }>`
	background-color: ${props => (props.disabled ? '#f0f0f0' : '#f8f8f8')};
	color: ${props => (props.disabled ? '#999' : '#333')};
	border: 1px solid #ddd;
	border-radius: 4px;
	padding: 0.375rem 0.75rem;
	font-size: 0.875rem;
	cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};

	&:hover:not(:disabled) {
		background-color: #f0f0f0;
	}
`

const FileInfo = styled.div`
	flex: 1;
	text-align: center;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	padding: 0 1rem;
	font-size: 0.75rem;
	color: ${props => props.theme.colors?.text?.tertiary || '#999'};
`

const ModalFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
	padding: 1rem;
	border-top: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
`

const SecondaryButton = styled.button`
	padding: 0.625rem 1rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: ${props => props.theme.colors?.text?.primary || '#333'};
	background-color: white;
	border: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	border-radius: 0.375rem;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors?.background?.tertiary || '#f0f0f0'};
	}
`

const ModalBackdrop = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 999;
`

// Add Modal component at the beginning of styled components section
const Modal = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
`

const FileCounter = styled.div`
	font-size: 14px;
	color: #718096;
	margin-top: 4px;
`

const PreviewModalContent = styled(motion.div)`
	background-color: white;
	border-radius: 8px;
	width: 90%;
	max-width: 1200px;
	max-height: 90vh;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
`

const UnsupportedPreview = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40px;
	color: #4a5568;
	text-align: center;

	svg {
		margin-bottom: 16px;
		color: #3182ce;
	}

	p {
		margin-bottom: 24px;
	}
`

const DownloadButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	background-color: #3182ce;
	color: white;
	border: none;
	border-radius: 4px;
	padding: 8px 16px;
	font-size: 14px;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background-color: #2c5282;
	}
`

const PreviewControls = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`

const NavigationButton = styled.button<{ disabled?: boolean }>`
	background-color: ${props => (props.disabled ? '#e2e8f0' : '#edf2f7')};
	color: ${props => (props.disabled ? '#a0aec0' : '#4a5568')};
	border: none;
	border-radius: 4px;
	padding: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s;

	&:hover {
		background-color: ${props => (props.disabled ? '#e2e8f0' : '#e2e8f0')};
	}
`

// Add styled components for the file upload UI
const FileUploadContainer = styled.div<{ isDragging?: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 24px;
	border: 2px dashed ${props => (props.isDragging ? '#3b82f6' : '#cbd5e1')};
	background-color: ${props => (props.isDragging ? 'rgba(59, 130, 246, 0.05)' : '#f8fafc')};
	border-radius: 8px;
	transition: all 0.2s ease;
	text-align: center;
	cursor: pointer;
	min-height: 200px;

	&:hover {
		border-color: ${props => (props.isDragging ? '#3b82f6' : '#94a3b8')};
		background-color: ${props => (props.isDragging ? 'rgba(59, 130, 246, 0.05)' : '#f1f5f9')};
	}
`

const FileUploadButton = styled.button`
	margin-top: 16px;
	padding: 8px 16px;
	background-color: #3b82f6;
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background-color: #2563eb;
	}

	&:disabled {
		background-color: #cbd5e1;
		cursor: not-allowed;
	}
`

const UploadIcon = styled.div`
	margin-bottom: 12px;
	color: #64748b;
`

const UploadText = styled.p`
	margin: 0 0 4px 0;
	color: #1e293b;
	font-size: 0.875rem;
`

const UploadHint = styled.p`
	margin: 0;
	color: #64748b;
	font-size: 0.75rem;
`

const FilePreviewContainer = styled.div`
	display: flex;
	align-items: center;
	width: 100%;
	padding: 12px;
	background-color: white;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	position: relative;
`

const FileTypeIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12px;
`

const FileDetails = styled.div`
	flex: 1;
	text-align: left;
`

const FileName = styled.div`
	font-size: 0.875rem;
	color: #1e293b;
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 300px;
`

const FileSize = styled.div`
	font-size: 0.75rem;
	color: #64748b;
	margin-top: 2px;
`

const RemoveFileButton = styled.button`
	background: none;
	border: none;
	color: #94a3b8;
	cursor: pointer;
	padding: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	transition: all 0.2s;

	&:hover {
		color: #ef4444;
		background-color: #fee2e2;
	}
`

// Add these utility functions
// Function to determine file icon based on extension
const getFileIconByType = (filename: string) => {
	const ext = filename.split('.').pop()?.toLowerCase() || ''

	// Image files
	if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
		return <FiImage size={24} color='#10b981' />
	}

	// PDF files
	if (ext === 'pdf') {
		return <FiFileText size={24} color='#ef4444' />
	}

	// Word documents
	if (['doc', 'docx'].includes(ext)) {
		return <FiFileText size={24} color='#3b82f6' />
	}

	// Default file icon
	return <FiFile size={24} color='#6b7280' />
}

// Function to format file size
const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes'

	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const SubjectWarning = styled.div`
	font-size: 0.75rem;
	color: #f59e0b; // Amber/warning color
	margin-top: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.25rem;

	&::before {
		content: '⚠️';
		font-size: 0.875rem;
	}
`

// Add these styled components for the file list
const FilesListHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	padding: 0 0 10px 0;
	border-bottom: 1px solid ${props => props.theme.colors?.border?.light || '#ddd'};
	margin-bottom: 10px;

	span {
		font-size: 0.875rem;
		font-weight: 500;
		color: ${props => props.theme.colors?.text?.secondary || '#666'};
	}
`

const AddMoreButton = styled.button`
	background: none;
	border: none;
	color: ${props => props.theme.colors?.primary[500] || '#3498db'};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	padding: 5px;

	&:hover {
		text-decoration: underline;
	}
`

const FilesList = styled.div`
	width: 100%;
	max-height: 200px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 8px;
`

// Add a helper function to extract filename from URL if name is not stored
const getFileName = (url: string): string => {
	try {
		const urlParts = url.split('/')
		let fileName = urlParts[urlParts.length - 1]

		// Remove query parameters
		fileName = fileName.split('?')[0]

		// Decode URI components
		return decodeURIComponent(fileName)
	} catch (error) {
		return 'Unknown File'
	}
}

// Add styled component for no permission message
const NoPermissionMessage = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem;
	text-align: center;
	color: ${props => props.theme.colors?.text?.secondary || '#666'};

	h3 {
		margin: 1rem 0 0.5rem;
		font-size: 1.5rem;
		font-weight: 600;
		color: ${props => props.theme.colors?.text?.primary || '#333'};
	}

	p {
		margin: 0;
		font-size: 1rem;
	}

	svg {
		color: ${props => props.theme.colors?.danger?.[500] || '#e53e3e'};
	}
`

export default AdminAssignments
