import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	FiCalendar,
	FiCheck,
	FiChevronDown,
	FiChevronRight,
	FiDownload,
	FiExternalLink,
	FiFileText,
	FiFilter,
	FiMessageSquare,
	FiSearch,
	FiUser,
	FiX,
	FiXCircle,
} from 'react-icons/fi'
import { toast } from 'react-toastify'
import styled, { DefaultTheme } from 'styled-components'
import supabase from '../../config/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

// Import the project's DefaultTheme
import 'styled-components'

// Create a type-safe theme accessor
const getThemeValue = (theme: any): DefaultTheme => theme as DefaultTheme

// Interface definitions
interface Submission {
	id: string
	fileurl: string[]
	submittedat: string
	grade: number | null
	feedback: string | null
	status: string | null
	assignmentid: string
	studentid: string
	assignment?: {
		id: string
		title: string
		classid: string
		quarter_id?: string
		class?: {
			id: string
			classname: string
		}
		quarter?: {
			id: string
			name: string
		}
		createdby: string
	}
	student?: {
		id: string
		fullName: string
		email?: string
	}
}

interface Class {
	id: string
	classname: string
}

interface Permission {
	create_submissions: boolean
	read_submissions: boolean
	update_submissions: boolean
	delete_submissions: boolean
}

// Styled Components
const PageContainer = styled(motion.div)`
	padding: 30px;
	max-width: 1200px;
	margin: 0 auto;
`

const Header = styled.div`
	margin-bottom: 30px;
`

const HeaderContent = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
`

const PageTitle = styled.h1`
	font-size: 28px;
	font-weight: 700;
	margin: 0;
	color: ${({ theme }: { theme: any }) => getThemeValue(theme).colors.text.primary};
`

const PageDescription = styled.p`
	font-size: 16px;
	color: ${({ theme }: { theme: any }) => getThemeValue(theme).colors.text.secondary};
	margin: 5px 0 0;
`

const FiltersRow = styled.div`
	display: flex;
	margin-bottom: 25px;
	flex-wrap: wrap;
	gap: 15px;
`

const SearchBar = styled.div`
	position: relative;
	flex: 1;
	min-width: 250px;
`

const SearchIcon = styled(FiSearch)`
	position: absolute;
	left: 15px;
	top: 50%;
	transform: translateY(-50%);
	color: ${({ theme }) => getThemeValue(theme).colors.text.secondary};
`

const SearchInput = styled.input`
	width: 100%;
	padding: 12px 15px 12px 45px;
	border-radius: 8px;
	border: 1px solid ${({ theme }) => getThemeValue(theme).colors.border.light};
	font-size: 16px;
	background: ${({ theme }) => getThemeValue(theme).colors.background.light};
	color: ${({ theme }) => getThemeValue(theme).colors.text.primary};

	&:focus {
		outline: none;
		border-color: ${({ theme }) => getThemeValue(theme).colors.primary[500]};
		box-shadow: 0 0 0 2px ${({ theme }) => getThemeValue(theme).colors.primary[100]};
	}
`

const FilterContainer = styled.div`
	position: relative;
	min-width: 180px;
`

const FilterButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 15px;
	border-radius: 8px;
	border: 1px solid ${({ theme }) => getThemeValue(theme).colors.border.light};
	background: ${({ theme }) => getThemeValue(theme).colors.background.light};
	color: ${({ theme }) => getThemeValue(theme).colors.text.primary};
	font-size: 15px;
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		background: ${({ theme }) => getThemeValue(theme).colors.background.hover};
	}
`

const DropdownMenu = styled.div`
	position: absolute;
	top: calc(100% + 5px);
	left: 0;
	width: 100%;
	background: white;
	border-radius: 8px;
	box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
	z-index: 10;
	max-height: 300px;
	overflow-y: auto;
`

const DropdownItem = styled.div<{ $isActive?: boolean }>`
	padding: 12px 15px;
	cursor: pointer;
	color: ${({ theme, $isActive }) =>
		$isActive ? theme.colors.primary[500] : theme.colors.text.primary};
	background: ${({ theme, $isActive }) => ($isActive ? theme.colors.primary[50] : 'transparent')};

	&:hover {
		background: ${({ theme }) => theme.colors.background.hover};
	}
`

const ContentContainer = styled.div`
	margin-top: 20px;
`

const LoadingContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 200px;
`

const LoadingText = styled.p`
	font-size: 16px;
	color: ${({ theme }) => getThemeValue(theme).colors.text.secondary};
`

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
	background: white;
	border-radius: 10px;
	text-align: center;
`

const EmptyStateText = styled.p`
	font-size: 16px;
	color: ${({ theme }) => getThemeValue(theme).colors.text.secondary};
	margin: 15px 0 0;
`

const SubmissionsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
	gap: 20px;
`

const SubmissionCard = styled.div`
	background: white;
	border-radius: 10px;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	transition: transform 0.2s, box-shadow 0.2s;
	cursor: pointer;

	&:hover {
		transform: translateY(-3px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
	}
`

const CardHeader = styled.div`
	padding: 16px 20px;
	background: ${({ theme }) => getThemeValue(theme).colors.background.light};
	font-weight: 600;
	font-size: 16px;
	color: ${({ theme }) => getThemeValue(theme).colors.text.primary};
	border-bottom: 1px solid ${({ theme }) => getThemeValue(theme).colors.border.light};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const CardBody = styled.div`
	padding: 16px 20px;
`

const CardInfo = styled.div`
	margin-bottom: 15px;
`

const InfoItem = styled.div`
	display: flex;
	align-items: center;
	margin-bottom: 8px;
	color: ${({ theme }) => getThemeValue(theme).colors.text.secondary};
	font-size: 14px;

	svg {
		margin-right: 10px;
		color: ${({ theme }) => getThemeValue(theme).colors.text.secondary};
	}
`

const InfoText = styled.span`
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const CardActions = styled.div`
	margin-top: 15px;
`

const FeedbackSection = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 15px;
`

const GradeBadge = styled.span`
	background: #e3f2fd;
	color: #0288d1;
	padding: 5px 10px;
	border-radius: 20px;
	font-size: 13px;
	font-weight: 500;
	display: inline-flex;
	align-items: center;
`

const PendingBadge = styled.span`
	background: #fff8e1;
	color: #ffa000;
	padding: 5px 10px;
	border-radius: 20px;
	font-size: 13px;
	font-weight: 500;
	display: inline-flex;
	align-items: center;
`

const StatusBadge = styled.span<{ $status: string }>`
	background: ${({ $status }) => ($status === 'accepted' ? '#e8f5e9' : '#ffebee')};
	color: ${({ $status }) => ($status === 'accepted' ? '#388e3c' : '#d32f2f')};
	padding: 5px 10px;
	border-radius: 20px;
	font-size: 13px;
	font-weight: 500;
	display: inline-flex;
	align-items: center;
`

const FeedbackIndicator = styled.span`
	background: #f3e5f5;
	color: #7b1fa2;
	padding: 5px 10px;
	border-radius: 20px;
	font-size: 13px;
	font-weight: 500;
	display: inline-flex;
	align-items: center;

	svg {
		margin-right: 5px;
	}
`

const SubmissionFileSection = styled.div`
	margin-top: 12px;
`

const SubmissionFileLink = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8px 12px;
	background: ${({ theme }) => getThemeValue(theme).colors.background.lighter};
	border-radius: 6px;
	margin-bottom: 8px;

	a {
		display: flex;
		align-items: center;
		color: ${({ theme }) => getThemeValue(theme).colors.primary[500]};
		text-decoration: none;
		font-size: 14px;

		svg {
			margin-right: 8px;
		}

		span {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
`

const DownloadButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	color: ${({ theme }) => getThemeValue(theme).colors.text.secondary};
	display: flex;
	align-items: center;
	padding: 4px;
	border-radius: 4px;

	&:hover {
		background: ${({ theme }) => getThemeValue(theme).colors.background.hover};
		color: ${({ theme }) => getThemeValue(theme).colors.primary[500]};
	}
`

const LoadMoreContainer = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 30px;
`

const LoadMoreButton = styled.button`
	background: none;
	border: 1px solid ${({ theme }) => getThemeValue(theme).colors.border.light};
	border-radius: 8px;
	padding: 10px 20px;
	font-size: 15px;
	font-weight: 500;
	color: ${({ theme }) => getThemeValue(theme).colors.text.primary};
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 8px;

	&:hover {
		background: ${({ theme }) => getThemeValue(theme).colors.background.hover};
	}
`

// Modal styled components
const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
	padding: 20px;
`

const ModalContent = styled.div`
	background: white;
	border-radius: 12px;
	width: 100%;
	max-width: 700px;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`

const ModalHeader = styled.div`
	padding: 20px 25px;
	border-bottom: 1px solid ${({ theme }) => getThemeValue(theme).colors.border.light};
	display: flex;
	justify-content: space-between;
	align-items: center;
	position: sticky;
	top: 0;
	background: white;
	z-index: 2;
`

const ModalTitle = styled.h2`
	font-size: 20px;
	font-weight: 600;
	margin: 0;
	color: ${({ theme }) => getThemeValue(theme).colors.text.primary};
`

const CloseButton = styled.button`
	background: none;
	border: none;
	color: ${({ theme }) => getThemeValue(theme).colors.text.secondary};
	cursor: pointer;
	padding: 5px;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		color: ${({ theme }) => getThemeValue(theme).colors.text.primary};
	}
`

const ModalBody = styled.div`
	padding: 25px;
`

const SubmissionInfo = styled.div`
	margin-bottom: 25px;
`

const InfoGroup = styled.div`
	margin-bottom: 20px;
`

const InfoLabel = styled.div`
	font-size: 14px;
	font-weight: 500;
	color: ${({ theme }) => getThemeValue(theme).colors.text.secondary};
	margin-bottom: 5px;
`

const InfoValue = styled.div`
	font-size: 16px;
	color: ${({ theme }) => getThemeValue(theme).colors.text.primary};
`

const FileContainer = styled.div`
	margin-top: 20px;
`

const FileHeader = styled.h3`
	font-size: 16px;
	font-weight: 600;
	margin: 0 0 15px;
	color: ${({ theme }) => getThemeValue(theme).colors.text.primary};
`

const FileItem = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 15px;
	background: ${({ theme }) => getThemeValue(theme).colors.background.lighter};
	border-radius: 8px;
	margin-bottom: 10px;
`

const FileInfo = styled.div`
	display: flex;
	align-items: center;

	svg {
		margin-right: 10px;
		color: ${({ theme }) => getThemeValue(theme).colors.primary[500]};
	}
`

const FileName = styled.span`
	font-size: 14px;
	color: ${({ theme }) => getThemeValue(theme).colors.text.primary};
`

const FileActions = styled.div`
	display: flex;
	gap: 10px;
`

const FileButton = styled.a`
	background: none;
	border: none;
	cursor: pointer;
	color: ${({ theme }) => getThemeValue(theme).colors.primary[500]};
	padding: 5px;
	border-radius: 4px;
	display: flex;
	align-items: center;
	text-decoration: none;

	&:hover {
		background: ${({ theme }) => getThemeValue(theme).colors.background.hover};
	}
`

const FeedbackForm = styled.div`
	margin-top: 30px;
	padding-top: 20px;
	border-top: 1px solid ${({ theme }) => getThemeValue(theme).colors.border.light};
`

const FormGroup = styled.div`
	margin-bottom: 20px;
`

const FormLabel = styled.label`
	display: block;
	font-size: 14px;
	font-weight: 500;
	margin-bottom: 8px;
	color: ${({ theme }) => getThemeValue(theme).colors.text.primary};
`

const GradeInput = styled.input`
	width: 100%;
	max-width: 80px;
	padding: 10px 12px;
	border-radius: 6px;
	border: 1px solid ${({ theme }) => getThemeValue(theme).colors.border.light};
	font-size: 15px;

	&:focus {
		outline: none;
		border-color: ${({ theme }) => getThemeValue(theme).colors.primary[500]};
		box-shadow: 0 0 0 2px ${({ theme }) => getThemeValue(theme).colors.primary[100]};
	}
`

const FeedbackTextarea = styled.textarea`
	width: 100%;
	padding: 12px 15px;
	border-radius: 8px;
	border: 1px solid ${({ theme }) => getThemeValue(theme).colors.border.light};
	font-size: 15px;
	min-height: 120px;
	resize: vertical;

	&:focus {
		outline: none;
		border-color: ${({ theme }) => getThemeValue(theme).colors.primary[500]};
		box-shadow: 0 0 0 2px ${({ theme }) => getThemeValue(theme).colors.primary[100]};
	}
`

const StatusOptions = styled.div`
	display: flex;
	gap: 15px;
	margin-top: 5px;
`

const StatusOption = styled.button<{ $isSelected: boolean; $status: string }>`
	background: ${({ $isSelected, $status, theme }) =>
		$isSelected ? ($status === 'accepted' ? '#e8f5e9' : '#ffebee') : 'white'};
	color: ${({ $isSelected, $status, theme }) =>
		$isSelected
			? $status === 'accepted'
				? '#388e3c'
				: '#d32f2f'
			: getThemeValue(theme).colors.text.secondary};
	border: 1px solid
		${({ $isSelected, $status, theme }) =>
			$isSelected
				? $status === 'accepted'
					? '#388e3c'
					: '#d32f2f'
				: getThemeValue(theme).colors.border.light};
	padding: 8px 15px;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;

	&:hover {
		background: ${({ $status }) => ($status === 'accepted' ? '#e8f5e9' : '#ffebee')};
		color: ${({ $status }) => ($status === 'accepted' ? '#388e3c' : '#d32f2f')};
		border-color: ${({ $status }) => ($status === 'accepted' ? '#388e3c' : '#d32f2f')};
	}
`

const ButtonGroup = styled.div`
	display: flex;
	justify-content: flex-end;
	margin-top: 25px;
	gap: 15px;
`

const CancelButton = styled.button`
	background: none;
	border: 1px solid ${({ theme }) => getThemeValue(theme).colors.border.light};
	padding: 10px 20px;
	border-radius: 8px;
	font-size: 15px;
	font-weight: 500;
	color: ${({ theme }) => getThemeValue(theme).colors.text.secondary};
	cursor: pointer;

	&:hover {
		background: ${({ theme }) => getThemeValue(theme).colors.background.hover};
		color: ${({ theme }) => getThemeValue(theme).colors.text.primary};
	}
`

const SaveButton = styled.button`
	background: ${({ theme }) => getThemeValue(theme).colors.primary[500]};
	border: none;
	padding: 10px 20px;
	border-radius: 8px;
	font-size: 15px;
	font-weight: 500;
	color: white;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 8px;

	&:hover {
		background: ${({ theme }) => getThemeValue(theme).colors.primary[700]};
	}

	&:disabled {
		background: #e0e0e0;
		color: #9e9e9e;
		cursor: not-allowed;
	}
`

const ITEMS_PER_PAGE = 10

const AdminSubmissions: React.FC = () => {
	const { user } = useAuth()
	const { t } = useTranslation()
	const [allSubmissions, setAllSubmissions] = useState<Submission[]>([])
	const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
	const [displayedSubmissions, setDisplayedSubmissions] = useState<Submission[]>([])
	const [classes, setClasses] = useState<Class[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedClass, setSelectedClass] = useState<string | null>(null)
	const [showClassDropdown, setShowClassDropdown] = useState(false)
	const [showDetailModal, setShowDetailModal] = useState(false)
	const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [gradeInput, setGradeInput] = useState<number | ''>('')
	const [feedbackInput, setFeedbackInput] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [hasMore, setHasMore] = useState(true)
	const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)
	const [permissions, setPermissions] = useState<Permission>({
		create_submissions: false,
		read_submissions: false,
		update_submissions: false,
		delete_submissions: false,
	})

	// Check permissions on component mount
	useEffect(() => {
		if (user) {
			checkPermissions()
		}
	}, [user])

	// Fetch submissions and initial data when user and permissions are ready
	useEffect(() => {
		if (user && permissions.read_submissions) {
			fetchClasses()
			fetchAllSubmissions()
		}
	}, [user, permissions.read_submissions])

	// Apply filters whenever they change
	useEffect(() => {
		applyFilters()
	}, [selectedClass, searchTerm, allSubmissions])

	// Update displayed submissions when filtered submissions or page changes
	useEffect(() => {
		updateDisplayedSubmissions()
	}, [filteredSubmissions, currentPage])

	// Check user permissions for submissions
	const checkPermissions = async () => {
		try {
			if (!user) return

			// First check if user is Admin or SuperAdmin
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('role')
				.eq('id', user.id)
				.single()

			if (userError) throw userError

			// Admin and SuperAdmin always have permissions
			if (userData?.role === 'Admin' || userData?.role === 'SuperAdmin') {
				setPermissions({
					create_submissions: true,
					read_submissions: true,
					update_submissions: true,
					delete_submissions: true,
				})
				return
			}

			// For other roles, check their parent_id and permissions
			const { data: roleData, error: roleError } = await supabase
				.from('users')
				.select('parent_id')
				.eq('id', user.id)
				.single()

			if (roleError) throw roleError

			// If no parent_id, they don't have access
			if (!roleData?.parent_id) {
				setPermissions({
					create_submissions: false,
					read_submissions: false,
					update_submissions: false,
					delete_submissions: false,
				})
				return
			}

			// Check if parent is Admin
			const { data: parentData, error: parentError } = await supabase
				.from('users')
				.select('role')
				.eq('id', roleData.parent_id)
				.single()

			if (parentError) throw parentError

			// If parent is not Admin, they don't have access
			if (parentData?.role !== 'Admin' && parentData?.role !== 'SuperAdmin') {
				setPermissions({
					create_submissions: false,
					read_submissions: false,
					update_submissions: false,
					delete_submissions: false,
				})
				return
			}

			// Check specific permissions
			const { data: permData, error: permError } = await supabase
				.from('role_permissions')
				.select(
					`
					permissions (
						name
					)
				`
				)
				.eq('role_id', userData?.role)

			if (permError) throw permError

			// Set permissions based on retrieved data
			const userPermissions = {
				create_submissions: false,
				read_submissions: false,
				update_submissions: false,
				delete_submissions: false,
			}

			if (permData) {
				permData.forEach((item: any) => {
					const permName = item.permissions?.name
					if (permName === 'create_submissions') userPermissions.create_submissions = true
					if (permName === 'read_submissions') userPermissions.read_submissions = true
					if (permName === 'update_submissions') userPermissions.update_submissions = true
					if (permName === 'delete_submissions') userPermissions.delete_submissions = true
				})
			}

			setPermissions(userPermissions)
		} catch (error) {
			console.error('Error checking permissions:', error)
			toast.error(t('common.failedToCheckPermissions'))
		}
	}

	// Function to apply all filters
	const applyFilters = () => {
		if (allSubmissions.length === 0) return

		let filtered = [...allSubmissions]

		// Apply class filter
		if (selectedClass) {
			filtered = filtered.filter(submission => submission.assignment?.classid === selectedClass)
		}

		// Apply search filter
		if (searchTerm.trim() !== '') {
			filtered = filtered.filter(
				submission =>
					submission.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					submission.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					submission.assignment?.title?.toLowerCase().includes(searchTerm.toLowerCase())
			)
		}

		setFilteredSubmissions(filtered)
		setCurrentPage(1) // Reset to first page when filters change
	}

	// Function to update displayed submissions based on current page
	const updateDisplayedSubmissions = () => {
		const startIndex = 0
		const endIndex = currentPage * ITEMS_PER_PAGE
		const slicedSubmissions = filteredSubmissions.slice(startIndex, endIndex)

		setDisplayedSubmissions(slicedSubmissions)
		setHasMore(endIndex < filteredSubmissions.length)
	}

	// Function to load more submissions
	const loadMore = () => {
		if (hasMore) {
			setCurrentPage(prev => prev + 1)
		}
	}

	// Fetch all classes
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
			toast.error(t('submissions.failedToLoadClasses'))
		}
	}

	// Fetch all submissions (for admins only)
	const fetchAllSubmissions = async () => {
		if (!user) return

		setIsLoading(true)
		try {
			// For admin users, fetch all submissions
			const { data, error } = await supabase
				.from('submissions')
				.select(
					`
					id,
					fileurl,
					submittedat,
					grade,
					feedback,
					status,
					assignmentid,
					studentid,
					assignment:assignmentid (
						id,
						title,
						classid,
						quarter_id,
						class:classid (
							id,
							classname
						),
						quarter:quarter_id (
							id,
							name
						),
						createdby
					),
					student:studentid (
						id,
						fullName,
						email
					)
				`
				)
				.order('submittedat', { ascending: false })

			if (error) throw error

			// Transform data to ensure fileurl is always an array
			const transformedData = data.map(item => {
				// Create the properly formatted submission object
				const submission: Submission = {
					...item,
					assignmentid: item.assignmentid,
					studentid: item.studentid,
					fileurl: Array.isArray(item.fileurl) ? item.fileurl : item.fileurl ? [item.fileurl] : [],
					// Format the nested objects correctly, using type assertion to fix TypeScript errors
					assignment: item.assignment && {
						id: (item.assignment as any).id,
						title: (item.assignment as any).title,
						classid: (item.assignment as any).classid,
						quarter_id: (item.assignment as any).quarter_id,
						createdby: (item.assignment as any).createdby,
						class: (item.assignment as any).class && {
							id: (item.assignment as any).class.id,
							classname: (item.assignment as any).class.classname,
						},
						quarter: (item.assignment as any).quarter && {
							id: (item.assignment as any).quarter.id,
							name: (item.assignment as any).quarter.name,
						},
					},
					student: item.student && {
						id: (item.student as any).id,
						fullName: (item.student as any).fullName,
						email: (item.student as any).email,
					},
				}

				return submission
			})

			setAllSubmissions(transformedData)
			setFilteredSubmissions(transformedData)
			setIsLoading(false)
		} catch (error) {
			console.error('Error fetching submissions:', error)
			toast.error(t('submissions.failedToLoadSubmissions'))
			setIsLoading(false)
		}
	}

	// Utility functions

	// Format date for display
	const formatDate = (dateString: string) => {
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}
		return new Date(dateString).toLocaleDateString(undefined, options)
	}

	// Handle search input change
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	// Open submission detail modal
	const handleOpenDetail = (submission: Submission) => {
		setSelectedSubmission(submission)
		setGradeInput(submission.grade || '')
		setFeedbackInput(submission.feedback || '')
		setSubmissionStatus(submission.status)
		setShowDetailModal(true)
	}

	// Close submission detail modal
	const handleCloseDetail = () => {
		setShowDetailModal(false)
		setSelectedSubmission(null)
	}

	// Download file
	const downloadFile = (url: string) => {
		window.open(url, '_blank')
	}

	// Update grade and feedback
	const handleSaveGradeFeedback = async () => {
		if (!selectedSubmission || !permissions.update_submissions) return

		try {
			const { error } = await supabase
				.from('submissions')
				.update({
					grade: gradeInput === '' ? null : gradeInput,
					feedback: feedbackInput,
					status: submissionStatus,
				})
				.eq('id', selectedSubmission.id)

			if (error) throw error

			// Update the submission in the local state
			const updatedSubmission = {
				...selectedSubmission,
				grade: gradeInput === '' ? null : Number(gradeInput),
				feedback: feedbackInput,
				status: submissionStatus,
			}

			setSelectedSubmission(updatedSubmission)

			// Update all submission states
			const updateSubmissionsState = (prevSubmissions: Submission[]) => {
				return prevSubmissions.map(submission =>
					submission.id === selectedSubmission.id ? updatedSubmission : submission
				)
			}

			setAllSubmissions(updateSubmissionsState)
			setFilteredSubmissions(updateSubmissionsState)
			setDisplayedSubmissions(
				displayedSubmissions.map(submission =>
					submission.id === selectedSubmission.id ? updatedSubmission : submission
				)
			)

			toast.success(t('submissions.gradeAndFeedbackSaved'))
		} catch (error) {
			console.error('Error saving feedback:', error)
			toast.error(t('submissions.failedToSaveGradeFeedback'))
		}
	}

	// Validate grade input (1-10)
	const handleGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value

		if (value === '') {
			setGradeInput('')
			return
		}

		const numValue = parseInt(value, 10)
		if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
			setGradeInput(numValue)
		}
	}

	return (
		<PageContainer
			as={motion.div}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			<Header>
				<HeaderContent>
					<div>
						<PageTitle>{t('submissions.title')}</PageTitle>
						<PageDescription>{t('submissions.description')}</PageDescription>
					</div>
				</HeaderContent>

				<FiltersRow>
					<SearchBar>
						<SearchIcon />
						<SearchInput
							type='text'
							placeholder={t('submissions.searchByStudentOrAssignment')}
							value={searchTerm}
							onChange={handleSearchChange}
						/>
					</SearchBar>

					<FilterContainer>
						<FilterButton onClick={() => setShowClassDropdown(!showClassDropdown)}>
							<FiFilter />
							{selectedClass
								? `${t('submissions.class')}: ${
										classes.find(c => c.id === selectedClass)?.classname || t('common.selected')
								  }`
								: t('submissions.allClasses')}
							<FiChevronDown />
						</FilterButton>
						{showClassDropdown && (
							<DropdownMenu>
								<DropdownItem
									onClick={() => {
										setSelectedClass(null)
										setShowClassDropdown(false)
									}}
									$isActive={selectedClass === null}
								>
									{t('submissions.allClasses')}
								</DropdownItem>
								{classes.map(classItem => (
									<DropdownItem
										key={classItem.id}
										onClick={() => {
											setSelectedClass(classItem.id)
											setShowClassDropdown(false)
										}}
										$isActive={selectedClass === classItem.id}
									>
										{classItem.classname}
									</DropdownItem>
								))}
							</DropdownMenu>
						)}
					</FilterContainer>
				</FiltersRow>
			</Header>

			<ContentContainer>
				{isLoading ? (
					<LoadingContainer>
						<LoadingText>{t('submissions.loadingSubmissions')}</LoadingText>
					</LoadingContainer>
				) : !permissions.read_submissions ? (
					<EmptyState>
						<EmptyStateText>{t('submissions.noPermissionView')}</EmptyStateText>
					</EmptyState>
				) : filteredSubmissions.length === 0 ? (
					<EmptyState>
						<EmptyStateText>
							{allSubmissions.length === 0
								? t('submissions.noSubmissionsFound')
								: t('submissions.noSubmissionsMatchFilter')}
						</EmptyStateText>
					</EmptyState>
				) : (
					<>
						<SubmissionsGrid>
							{displayedSubmissions.map(submission => (
								<SubmissionCard key={submission.id} onClick={() => handleOpenDetail(submission)}>
									<CardHeader>
										{submission.assignment?.title || t('submissions.untitledAssignment')}
									</CardHeader>
									<CardBody>
										<CardInfo>
											<InfoItem>
												<FiUser />
												<InfoText>
													{submission.student?.fullName || t('submissions.unknownStudent')}
												</InfoText>
											</InfoItem>
											{submission.student?.email && (
												<InfoItem>
													<FiFileText />
													<InfoText>{submission.student.email}</InfoText>
												</InfoItem>
											)}
											{submission.assignment?.class?.classname && (
												<InfoItem>
													<FiFileText />
													<InfoText>{submission.assignment.class.classname}</InfoText>
												</InfoItem>
											)}
											<InfoItem>
												<FiCalendar />
												<InfoText>
													{t('submissions.submittedColon')} {formatDate(submission.submittedat)}
												</InfoText>
											</InfoItem>
										</CardInfo>

										<CardActions>
											{Array.isArray(submission.fileurl) && submission.fileurl.length > 0 && (
												<SubmissionFileSection>
													{submission.fileurl.map((url, index) => (
														<SubmissionFileLink key={index}>
															<a href={url} target='_blank' rel='noopener noreferrer'>
																<FiExternalLink size={14} />
																<span>
																	{t('submissions.viewFile')}{' '}
																	{submission.fileurl.length > 1 ? `${index + 1}` : ''}
																</span>
															</a>
															<DownloadButton
																onClick={e => {
																	e.stopPropagation()
																	downloadFile(url)
																}}
															>
																<FiDownload size={14} />
															</DownloadButton>
														</SubmissionFileLink>
													))}
												</SubmissionFileSection>
											)}
										</CardActions>
										<FeedbackSection>
											{submission.grade ? (
												<GradeBadge>
													{t('submissions.grade')}: {submission.grade}/10
												</GradeBadge>
											) : (
												<PendingBadge>{t('submissions.notGraded')}</PendingBadge>
											)}
											{submission.status && (
												<StatusBadge $status={submission.status}>
													{submission.status === 'accepted'
														? t('submissions.accepted')
														: t('submissions.rejected')}
												</StatusBadge>
											)}
											{submission.feedback && (
												<FeedbackIndicator>
													<FiMessageSquare /> {t('submissions.feedbackProvided')}
												</FeedbackIndicator>
											)}
										</FeedbackSection>
									</CardBody>
								</SubmissionCard>
							))}
						</SubmissionsGrid>

						{hasMore && (
							<LoadMoreContainer>
								<LoadMoreButton onClick={loadMore}>
									{t('submissions.loadMore')} <FiChevronRight />
								</LoadMoreButton>
							</LoadMoreContainer>
						)}
					</>
				)}
			</ContentContainer>

			{/* Detail Modal */}
			{showDetailModal && selectedSubmission && (
				<ModalOverlay onClick={handleCloseDetail}>
					<ModalContent onClick={e => e.stopPropagation()}>
						<ModalHeader>
							<ModalTitle>{t('submissions.submissionDetails')}</ModalTitle>
							<CloseButton onClick={handleCloseDetail}>
								<FiX size={20} />
							</CloseButton>
						</ModalHeader>
						<ModalBody>
							<SubmissionInfo>
								<InfoGroup>
									<InfoLabel>{t('submissions.assignment')}</InfoLabel>
									<InfoValue>
										{selectedSubmission.assignment?.title || t('submissions.untitledAssignment')}
									</InfoValue>
								</InfoGroup>
								<InfoGroup>
									<InfoLabel>{t('submissions.student')}</InfoLabel>
									<InfoValue>
										{selectedSubmission.student?.fullName || t('submissions.unknownStudent')}
									</InfoValue>
								</InfoGroup>
								{selectedSubmission.student?.email && (
									<InfoGroup>
										<InfoLabel>{t('submissions.email')}</InfoLabel>
										<InfoValue>{selectedSubmission.student.email}</InfoValue>
									</InfoGroup>
								)}
								{selectedSubmission.assignment?.class?.classname && (
									<InfoGroup>
										<InfoLabel>{t('submissions.class')}</InfoLabel>
										<InfoValue>{selectedSubmission.assignment.class.classname}</InfoValue>
									</InfoGroup>
								)}
								<InfoGroup>
									<InfoLabel>{t('submissions.submissionDate')}</InfoLabel>
									<InfoValue>{formatDate(selectedSubmission.submittedat)}</InfoValue>
								</InfoGroup>
							</SubmissionInfo>

							{Array.isArray(selectedSubmission.fileurl) &&
								selectedSubmission.fileurl.length > 0 && (
									<FileContainer>
										<FileHeader>{t('submissions.submittedFiles')}</FileHeader>
										{selectedSubmission.fileurl.map((url, index) => (
											<FileItem key={index}>
												<FileInfo>
													<FiFileText />
													<FileName>
														{t('submissions.submissionFile')}{' '}
														{selectedSubmission.fileurl.length > 1 ? `${index + 1}` : ''}
													</FileName>
												</FileInfo>
												<FileActions>
													<FileButton href={url} target='_blank' rel='noopener noreferrer'>
														<FiExternalLink size={16} />
													</FileButton>
													<FileButton as='button' onClick={() => downloadFile(url)}>
														<FiDownload size={16} />
													</FileButton>
												</FileActions>
											</FileItem>
										))}
									</FileContainer>
								)}

							{permissions.update_submissions && (
								<FeedbackForm>
									<FormGroup>
										<FormLabel>{t('submissions.gradeRange')}</FormLabel>
										<GradeInput
											type='number'
											min='1'
											max='10'
											value={gradeInput}
											onChange={handleGradeChange}
											placeholder={t('submissions.gradeOneTo10')}
										/>
									</FormGroup>
									<FormGroup>
										<FormLabel>{t('submissions.feedback')}</FormLabel>
										<FeedbackTextarea
											value={feedbackInput}
											onChange={e => setFeedbackInput(e.target.value)}
											placeholder={t('submissions.provideFeedback')}
										/>
									</FormGroup>
									<FormGroup>
										<FormLabel>{t('submissions.status')}</FormLabel>
										<StatusOptions>
											<StatusOption
												type='button'
												$isSelected={submissionStatus === 'accepted'}
												$status='accepted'
												onClick={() => setSubmissionStatus('accepted')}
											>
												<FiCheck /> {t('submissions.accept')}
											</StatusOption>
											<StatusOption
												type='button'
												$isSelected={submissionStatus === 'rejected'}
												$status='rejected'
												onClick={() => setSubmissionStatus('rejected')}
											>
												<FiXCircle /> {t('submissions.reject')}
											</StatusOption>
										</StatusOptions>
									</FormGroup>
									<ButtonGroup>
										<CancelButton onClick={handleCloseDetail}>
											{t('submissions.cancel')}
										</CancelButton>
										<SaveButton onClick={handleSaveGradeFeedback}>
											<FiCheck /> {t('submissions.saveFeedback')}
										</SaveButton>
									</ButtonGroup>
								</FeedbackForm>
							)}
						</ModalBody>
					</ModalContent>
				</ModalOverlay>
			)}
		</PageContainer>
	)
}

export default AdminSubmissions
