import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
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
} from 'react-icons/fi'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import supabase from '../../config/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

// Interface definitions
interface Submission {
	id: string
	fileurl: string
	submittedat: string
	grade: number | null
	feedback: string | null
	assignment: {
		id: string
		title: string
		classid: string
		quarter_id: string
		class: {
			id: string
			classname: string
		}
		quarter: {
			id: string
			name: string
		}
		createdby: string
	}
	student: {
		id: string
		fullName: string
	}
}

interface Class {
	id: string
	classname: string
}

interface Quarter {
	id: string
	name: string
}

const ITEMS_PER_PAGE = 10

const TeacherSubmissions = () => {
	const { user } = useAuth()
	const [allSubmissions, setAllSubmissions] = useState<Submission[]>([])
	const [submissions, setSubmissions] = useState<Submission[]>([])
	const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
	const [displayedSubmissions, setDisplayedSubmissions] = useState<Submission[]>([])
	const [classes, setClasses] = useState<Class[]>([])
	const [quarters, setQuarters] = useState<Quarter[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedClass, setSelectedClass] = useState<string | null>(null)
	const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null)
	const [showClassDropdown, setShowClassDropdown] = useState(false)
	const [showQuarterDropdown, setShowQuarterDropdown] = useState(false)
	const [showDetailModal, setShowDetailModal] = useState(false)
	const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [gradeInput, setGradeInput] = useState<number | ''>('')
	const [feedbackInput, setFeedbackInput] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [hasMore, setHasMore] = useState(true)

	// Fetch submissions and initial data on component mount
	useEffect(() => {
		if (user) {
			fetchTeacherClasses()
			fetchQuarters()
			fetchAllSubmissions()
		}
	}, [user])

	// Apply filters (class, quarter, search) whenever they change
	useEffect(() => {
		applyFilters()
	}, [selectedClass, selectedQuarter, searchTerm, allSubmissions])

	// Update displayed submissions when filtered submissions or page changes
	useEffect(() => {
		updateDisplayedSubmissions()
	}, [filteredSubmissions, currentPage])

	// Function to apply all filters
	const applyFilters = () => {
		if (allSubmissions.length === 0) return

		let filtered = [...allSubmissions]

		// Apply class filter
		if (selectedClass) {
			filtered = filtered.filter(submission => submission.assignment.classid === selectedClass)
		}

		// Apply quarter filter
		if (selectedQuarter) {
			filtered = filtered.filter(submission => submission.assignment.quarter_id === selectedQuarter)
		}

		// Apply search filter
		if (searchTerm.trim() !== '') {
			filtered = filtered.filter(submission =>
				submission.student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
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

	// Fetch teacher's classes
	const fetchTeacherClasses = async () => {
		if (!user) return

		try {
			const { data, error } = await supabase
				.from('classes')
				.select('id, classname')
				.eq('teacherid', user.id)

			if (error) throw error

			setClasses(data || [])
		} catch (error) {
			console.error('Error fetching classes:', error)
			toast.error('Failed to load classes')
		}
	}

	// Fetch available quarters
	const fetchQuarters = async () => {
		try {
			const { data, error } = await supabase
				.from('quarters')
				.select('id, name')
				.order('id', { ascending: true })

			if (error) throw error

			setQuarters(data || [])
		} catch (error) {
			console.error('Error fetching quarters:', error)
			toast.error('Failed to load quarters')
		}
	}

	// Fetch all submissions for this teacher
	const fetchAllSubmissions = async () => {
		if (!user) return

		setIsLoading(true)
		try {
			const { data: assignments, error: assignmentError } = await supabase
				.from('assignments')
				.select('id')
				.eq('createdby', user.id)

		const assignmentIds = assignments?.map(a => a.id) || [];

const { data, error } = await supabase
  .from('submissions')
  .select(`
    id,
    fileurl,
    submittedat,
    grade,
    feedback,
    assignment:assignmentid (
      id,
      title,
      classid,
      quarter_id,
      createdby,
      class:classes!assignments_classid_fkey (
        id,
        classname
      ),
      quarter:quarters!assignments_quarter_id_fkey (
        id,
        name
      )
    ),
    student:studentid (
      id,
      fullName
    )
  `)
  .in('assignmentid', assignmentIds)
  .order('submittedat', { ascending: false });

			if (error) throw error

			setAllSubmissions(data || [])
			setSubmissions(data || [])
			setFilteredSubmissions(data || [])
		} catch (error) {
			console.error('Error fetching submissions:', error)
			toast.error('Failed to load submissions')
		} finally {
			setIsLoading(false)
		}
	}

	// Format date
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
		setShowDetailModal(true)
	}

	// Close submission detail modal
	const handleCloseDetail = () => {
		setShowDetailModal(false)
		setSelectedSubmission(null)
	}

	// Update grade and feedback
	const handleSaveGradeFeedback = async () => {
		if (!selectedSubmission) return

		try {
			const { error } = await supabase
				.from('submissions')
				.update({
					grade: gradeInput === '' ? null : gradeInput,
					feedback: feedbackInput.trim() === '' ? null : feedbackInput,
				})
				.eq('id', selectedSubmission.id)

			if (error) throw error

			// Update local states (all variants of submissions)
			const updatedSubmission = {
				...selectedSubmission,
				grade: gradeInput === '' ? null : Number(gradeInput),
				feedback: feedbackInput.trim() === '' ? null : feedbackInput,
			}

			// Helper function to update submissions in state
			const updateSubmissionsState = (prevSubmissions: Submission[]) => {
				return prevSubmissions.map(sub => {
					if (sub.id === selectedSubmission.id) {
						return updatedSubmission
					}
					return sub
				})
			}

			setAllSubmissions(updateSubmissionsState)
			setSubmissions(updateSubmissionsState)
			setFilteredSubmissions(updateSubmissionsState)
			setDisplayedSubmissions(updateSubmissionsState)

			toast.success('Feedback and grade updated successfully')
			handleCloseDetail()
		} catch (error) {
			console.error('Error updating submission:', error)
			toast.error('Failed to update feedback and grade')
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
						<PageTitle>Student Submissions</PageTitle>
						<PageDescription>
							Review and grade assignments submitted by your students
						</PageDescription>
					</div>
				</HeaderContent>

				<FiltersRow>
					<SearchBar>
						<SearchIcon />
						<SearchInput
							type='text'
							placeholder='Search by student name...'
							value={searchTerm}
							onChange={handleSearchChange}
						/>
					</SearchBar>

					<FilterContainer>
						<FilterButton onClick={() => setShowClassDropdown(!showClassDropdown)}>
							<FiFilter />
							{selectedClass
								? `Class: ${classes.find(c => c.id === selectedClass)?.classname || 'Selected'}`
								: 'Select Class'}
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
									All Classes
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

					<FilterContainer>
						<FilterButton onClick={() => setShowQuarterDropdown(!showQuarterDropdown)}>
							<FiCalendar />
							{selectedQuarter
								? `Quarter: ${quarters.find(q => q.id === selectedQuarter)?.name || 'Selected'}`
								: 'Select Quarter'}
							<FiChevronDown />
						</FilterButton>
						{showQuarterDropdown && (
							<DropdownMenu>
								<DropdownItem
									onClick={() => {
										setSelectedQuarter(null)
										setShowQuarterDropdown(false)
									}}
									$isActive={selectedQuarter === null}
								>
									All Quarters
								</DropdownItem>
								{quarters.map(quarter => (
									<DropdownItem
										key={quarter.id}
										onClick={() => {
											setSelectedQuarter(quarter.id)
											setShowQuarterDropdown(false)
										}}
										$isActive={selectedQuarter === quarter.id}
									>
										{quarter.name}
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
						<LoadingText>Loading submissions...</LoadingText>
					</LoadingContainer>
				) : filteredSubmissions.length === 0 ? (
					<EmptyState>
						<EmptyStateText>
							{allSubmissions.length === 0
								? 'No submissions found for your assignments.'
								: 'No submissions match your filter criteria.'}
						</EmptyStateText>
					</EmptyState>
				) : (
					<>
						<SubmissionsGrid>
							{displayedSubmissions.map(submission => (
								<SubmissionCard key={submission.id} onClick={() => handleOpenDetail(submission)}>
									<CardHeader>
										{`${submission.assignment.title} by ${submission.student.fullName}`}
									</CardHeader>
									<CardBody>
										<CardInfo>
											<InfoItem>
												<FiUser />
												<InfoText>{submission.student.fullName}</InfoText>
											</InfoItem>
											<InfoItem>
												<FiFileText />
												<InfoText>{submission.assignment.class.classname}</InfoText>
											</InfoItem>
											<InfoItem>
												<FiCalendar />
												<InfoText>{submission.assignment.quarter.name}</InfoText>
											</InfoItem>
											<InfoItem>
												<FiCalendar />
												<InfoText>Submitted: {formatDate(submission.submittedat)}</InfoText>
											</InfoItem>
										</CardInfo>
										<CardActions>
											{submission.fileurl && (
												<ActionLink
													href={submission.fileurl}
													target='_blank'
													rel='noopener noreferrer'
												>
													<FiDownload /> Download File
												</ActionLink>
											)}
										</CardActions>
										<FeedbackSection>
											{submission.grade ? (
												<GradeBadge>Grade: {submission.grade}/10</GradeBadge>
											) : (
												<PendingBadge>Not Graded</PendingBadge>
											)}
											{submission.feedback && (
												<FeedbackIndicator>
													<FiMessageSquare /> Feedback provided
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
									Load More <FiChevronRight />
								</LoadMoreButton>
							</LoadMoreContainer>
						)}
					</>
				)}
			</ContentContainer>

			{showDetailModal && selectedSubmission && (
				<DetailModalOverlay onClick={handleCloseDetail}>
					<DetailModal onClick={e => e.stopPropagation()}>
						<DetailHeader>
							<DetailTitle>
								{`${selectedSubmission.assignment.title} by ${selectedSubmission.student.fullName}`}
							</DetailTitle>
							<CloseButton onClick={handleCloseDetail}>×</CloseButton>
						</DetailHeader>
						<DetailContent>
							<SubmissionDetails>
								<DetailItem>
									<DetailLabel>Student:</DetailLabel>
									<DetailValue>{selectedSubmission.student.fullName}</DetailValue>
								</DetailItem>
								<DetailItem>
									<DetailLabel>Class:</DetailLabel>
									<DetailValue>{selectedSubmission.assignment.class.classname}</DetailValue>
								</DetailItem>
								<DetailItem>
									<DetailLabel>Quarter:</DetailLabel>
									<DetailValue>{selectedSubmission.assignment.quarter.name}</DetailValue>
								</DetailItem>
								<DetailItem>
									<DetailLabel>Submitted On:</DetailLabel>
									<DetailValue>{formatDate(selectedSubmission.submittedat)}</DetailValue>
								</DetailItem>
								<DetailItem>
									<DetailLabel>File:</DetailLabel>
									<DetailValue>
										{selectedSubmission.fileurl ? (
											<FileLink
												href={selectedSubmission.fileurl}
												target='_blank'
												rel='noopener noreferrer'
											>
												View Submission <FiExternalLink />
											</FileLink>
										) : (
											'No file attached'
										)}
									</DetailValue>
								</DetailItem>
							</SubmissionDetails>

							<GradeFeedbackSection>
								<SectionTitle>Grade & Feedback</SectionTitle>
								<GradeInput>
									<GradeLabel>Grade (1-10):</GradeLabel>
									<GradeNumberInput
										type='number'
										min='1'
										max='10'
										value={gradeInput}
										onChange={handleGradeChange}
										placeholder='Enter grade (1-10)'
									/>
								</GradeInput>

								<FeedbackInput>
									<FeedbackLabel>Feedback:</FeedbackLabel>
									<FeedbackTextarea
										value={feedbackInput}
										onChange={e => setFeedbackInput(e.target.value)}
										placeholder='Provide feedback to the student...'
										rows={4}
									/>
								</FeedbackInput>

								<SaveButton onClick={handleSaveGradeFeedback}>
									<FiCheck /> Save Grade & Feedback
								</SaveButton>
							</GradeFeedbackSection>
						</DetailContent>
					</DetailModal>
				</DetailModalOverlay>
			)}
		</PageContainer>
	)
}

// Styled Components
const PageContainer = styled(motion.div)`
	min-height: 100vh;
	background: ${({ theme }) => theme.colors.background.primary};
	transition: background-color 0.3s ease;
`

const Header = styled.div`
	padding: 2rem;
	background-color: ${({ theme }) => theme.colors.background.secondary};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding: 1.5rem;
	}
`

const HeaderContent = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 2rem;
	gap: 1.5rem;
	position: relative;
	z-index: 1;

	@media (max-width: ${props => props.theme.breakpoints.lg}) {
		flex-direction: column;
		align-items: stretch;
	}
`

const PageTitle = styled.h1`
	font-size: 2rem;
	font-weight: 700;
	color: ${props => props.theme.colors.text.primary};
	margin: 0 0 0.25rem 0;
`

const PageDescription = styled.p`
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
	margin: 0;
	max-width: 500px;
`

const ContentContainer = styled.div`
	padding: 2rem;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding: 1rem;
	}
`

const FiltersRow = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
	flex-wrap: wrap;
	position: relative;
	z-index: 1;

	@media (max-width: ${props => props.theme.breakpoints.lg}) {
		width: 100%;
	}
`

const SearchBar = styled.div`
	display: flex;
	flex-grow: 1;
	align-items: center;
	gap: 0.75rem;
	padding: 0.6rem 1rem;
	background: ${({ theme }) => theme.colors.background.primary};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	transition: all 0.3s ease;
	box-shadow: none;

	&:focus-within {
		border-color: ${({ theme }) => theme.colors.primary[500]};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500] + '40'};
	}

	svg {
		color: ${({ theme }) => theme.colors.text.tertiary};
		flex-shrink: 0;
	}

	@media (min-width: ${props => props.theme.breakpoints.lg}) {
		min-width: 250px;
		flex-grow: 0;
	}
`

const SearchIcon = styled(FiSearch)`
	color: ${({ theme }) => theme.colors.text.tertiary};
`

const SearchInput = styled.input`
	width: 100%;
	border: none;
	background: transparent;
	font-size: 0.9rem;
	color: ${({ theme }) => theme.colors.text.primary};
	outline: none;

	&::placeholder {
		color: ${({ theme }) => theme.colors.text.tertiary};
	}
`

const FilterContainer = styled.div`
	position: relative;
`

const FilterButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.6rem 1rem;
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	background: ${({ theme }) => theme.colors.background.primary};
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: 0.9rem;
	cursor: pointer;
	white-space: nowrap;
	transition: all 0.3s ease;

	&:hover {
		background: ${({ theme }) => theme.colors.background.hover};
	}

	svg {
		color: ${({ theme }) => theme.colors.text.tertiary};
	}
`

const DropdownMenu = styled.div`
	position: absolute;
	top: 100%;
	left: 0;
	z-index: 10;
	width: 220px;
	margin-top: 0.3rem;
	background: ${({ theme }) => theme.colors.background.primary};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	box-shadow: ${({ theme }) => theme.shadows.md};
	max-height: 300px;
	overflow-y: auto;
`

interface DropdownItemProps {
	$isActive: boolean
}

const DropdownItem = styled.div<DropdownItemProps>`
	padding: 0.8rem 1rem;
	cursor: pointer;
	color: ${({ theme }) => theme.colors.text.primary};
	background: ${({ $isActive, theme }) =>
		$isActive ? theme.colors.background.hover : 'transparent'};

	&:hover {
		background: ${({ theme }) => theme.colors.background.hover};
	}
`

const LoadingContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 200px;
`

const LoadingText = styled.div`
	font-size: 1rem;
	color: ${({ theme }) => theme.colors.text.secondary};
`

const EmptyState = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 200px;
	background: ${({ theme }) => theme.colors.background.secondary};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
`

const EmptyStateText = styled.div`
	font-size: 1rem;
	color: ${({ theme }) => theme.colors.text.secondary};
	text-align: center;
	max-width: 80%;
`

const SubmissionsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 1.5rem;
`

const LoadMoreContainer = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 2rem;
`

const LoadMoreButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.7rem 1.5rem;
	background: ${({ theme }) => theme.colors.background.secondary};
	color: ${({ theme }) => theme.colors.primary[600]};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ theme }) => theme.colors.background.hover};
		box-shadow: ${({ theme }) => theme.shadows.sm};
	}

	svg {
		transition: transform 0.2s ease;
	}

	&:hover svg {
		transform: translateX(3px);
	}
`

const SubmissionCard = styled.div`
	background: ${({ theme }) => theme.colors.background.primary};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	box-shadow: ${({ theme }) => theme.shadows.sm};
	overflow: hidden;
	transition: transform 0.2s, box-shadow 0.2s;
	cursor: pointer;

	&:hover {
		transform: translateY(-2px);
		box-shadow: ${({ theme }) => theme.shadows.md};
	}
`

const CardHeader = styled.div`
	padding: 1rem;
	background: ${({ theme }) => theme.colors.primary[50]};
	color: ${({ theme }) => theme.colors.text.primary};
	font-weight: 600;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
`

const CardBody = styled.div`
	padding: 1rem;
`

const CardInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.8rem;
	margin-bottom: 1rem;
`

const InfoItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: ${({ theme }) => theme.colors.text.primary};

	svg {
		color: ${({ theme }) => theme.colors.text.tertiary};
	}
`

const InfoText = styled.span`
	font-size: 0.9rem;
`

const CardActions = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 1rem;
`

const ActionLink = styled.a`
	display: flex;
	align-items: center;
	gap: 0.3rem;
	color: ${({ theme }) => theme.colors.primary[600]};
	font-size: 0.9rem;
	text-decoration: none;

	&:hover {
		text-decoration: underline;
	}
`

const FeedbackSection = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`

const GradeBadge = styled.div`
	padding: 0.3rem 0.6rem;
	background: ${({ theme }) => theme.colors.success[100]};
	color: ${({ theme }) => theme.colors.success[800]};
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	font-size: 0.8rem;
	font-weight: 500;
`

const PendingBadge = styled.div`
	padding: 0.3rem 0.6rem;
	background: ${({ theme }) => theme.colors.warning[100]};
	color: ${({ theme }) => theme.colors.warning[800]};
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	font-size: 0.8rem;
	font-weight: 500;
`

const FeedbackIndicator = styled.div`
	display: flex;
	align-items: center;
	gap: 0.3rem;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 0.8rem;
`

const DetailModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 100;
`

const DetailModal = styled.div`
	width: 90%;
	max-width: 800px;
	max-height: 90vh;
	overflow-y: auto;
	background: ${({ theme }) => theme.colors.background.primary};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	box-shadow: ${({ theme }) => theme.shadows.lg};
`

const DetailHeader = styled.div`
	padding: 1.5rem;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
	display: flex;
	justify-content: space-between;
	align-items: center;
`

const DetailTitle = styled.h2`
	font-size: 1.2rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text.primary};
`

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	color: ${({ theme }) => theme.colors.text.secondary};
	cursor: pointer;
	padding: 0.3rem;
	line-height: 1;

	&:hover {
		color: ${({ theme }) => theme.colors.text.primary};
	}
`

const DetailContent = styled.div`
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 2rem;
`

const SubmissionDetails = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 1rem;
`

const DetailItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
`

const DetailLabel = styled.div`
	font-size: 0.9rem;
	color: ${({ theme }) => theme.colors.text.secondary};
`

const DetailValue = styled.div`
	font-size: 1rem;
	color: ${({ theme }) => theme.colors.text.primary};
`

const FileLink = styled.a`
	display: flex;
	align-items: center;
	gap: 0.3rem;
	color: ${({ theme }) => theme.colors.primary[600]};
	text-decoration: none;

	&:hover {
		text-decoration: underline;
	}
`

const GradeFeedbackSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
`

const SectionTitle = styled.h3`
	font-size: 1.1rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text.primary};
	padding-bottom: 0.5rem;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
`

const GradeInput = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`

const GradeLabel = styled.label`
	font-size: 0.9rem;
	color: ${({ theme }) => theme.colors.text.secondary};
`

const GradeNumberInput = styled.input`
	width: 100%;
	max-width: 200px;
	padding: 0.8rem 1rem;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	background: ${({ theme }) => theme.colors.background.secondary};
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: 0.9rem;

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.primary[500]};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500] + '40'};
	}
`

const FeedbackInput = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`

const FeedbackLabel = styled.label`
	font-size: 0.9rem;
	color: ${({ theme }) => theme.colors.text.secondary};
`

const FeedbackTextarea = styled.textarea`
	width: 100%;
	padding: 0.8rem 1rem;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	background: ${({ theme }) => theme.colors.background.secondary};
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: 0.9rem;
	resize: vertical;

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.primary[500]};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500] + '40'};
	}
`

const SaveButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.8rem 1.5rem;
	background: ${({ theme }) => theme.colors.primary[600]};
	color: white;
	border: none;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	font-weight: 500;
	cursor: pointer;
	transition: background 0.2s;
	align-self: flex-end;

	&:hover {
		background: ${({ theme }) => theme.colors.primary[700]};
	}
`

export default TeacherSubmissions
