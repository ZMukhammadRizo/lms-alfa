import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	FiAlertTriangle,
	FiCalendar,
	FiCheck,
	FiCheckCircle,
	FiClock,
	FiClock as FiClockIcon,
	FiFileText,
	FiLoader,
	FiUser,
	FiX,
	FiXCircle,
} from 'react-icons/fi'
import Modal from 'react-modal'
import styled from 'styled-components'
import { PageTitle } from '../../components/common'
import { Badge, Button, Card, Col, Container, Row } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { Submission, fetchParentDashboardData } from '../../services/assignmentService'

// Set app element for modal accessibility
Modal.setAppElement('#root')

// Modal Specific Styled Components (Moved Before Use)
const ModalContent = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	max-height: 85vh; // Ensure modal does not exceed viewport height
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 20px;
	border-bottom: 1px solid ${props => props.theme?.colors?.border?.light || '#eee'};
`

const ModalCourseName = styled.span`
	font-size: 0.9rem;
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	font-weight: 500;
	display: block;
	margin-bottom: 4px;
`

const ModalTitle = styled.h2`
	margin: 0;
	font-size: 1.4rem;
	font-weight: 600;
	color: ${props => props.theme?.colors?.text?.primary || '#333'};
`

const CloseButton = styled.button`
	background: transparent;
	border: none;
	cursor: pointer;
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	padding: 4px;
	margin-left: 16px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;

	&:hover {
		color: ${props => props.theme?.colors?.text?.primary || '#333'};
		background-color: ${props => props.theme?.colors?.background?.hover || '#f0f0f0'};
	}
`

const ModalBody = styled.div`
	padding: 20px;
	overflow-y: auto; // Enable scrolling for modal body content
	display: flex;
	flex-direction: column;
	gap: 24px;
`

const ModalFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 16px;
	padding: 16px 20px;
	border-top: 1px solid ${props => props.theme?.colors?.border?.light || '#eee'};
	background-color: ${props => props.theme?.colors?.background?.secondary || '#f9f9f9'};
`

const ModalStatusSection = styled.div`
	display: flex;
	justify-content: flex-start;
	margin-bottom: 8px;
`

const ModalDetailSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`

const ModalDetailSectionTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 1rem;
	font-weight: 600;
	color: ${props => props.theme?.colors?.text?.primary || '#333'};
	border-bottom: 1px solid ${props => props.theme?.colors?.border?.light || '#eee'};
	padding-bottom: 8px;
	margin-bottom: 4px;
`

const ModalDetailContent = styled.div`
	font-size: 0.95rem;
	line-height: 1.6;
	color: ${props => props.theme?.colors?.text?.secondary || '#444'};
	white-space: pre-wrap; // Preserve whitespace and newlines
`

const ModalDetailsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 20px;
`

const ModalSecondaryButton = styled(Button)`
	background-color: ${props => props.theme?.colors?.background?.lighter || '#fff'};
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	border: 1px solid ${props => props.theme?.colors?.border?.light || '#d9d9d9'};

	&:hover {
		background-color: ${props => props.theme?.colors?.background?.hover || '#f0f0f0'};
	}
`

type FilterType = 'all' | 'pending' | 'completed' | 'late' | 'upcoming' | 'overdue'
type ChildFilter = string | 'all'

interface Assignment {
	id: string
	title: string
	description?: string
	due_date?: string
	subject?: string
	subjectid?: string
	status?: 'pending' | 'completed' | 'late' | 'overdue' | 'upcoming'
	created_at?: string
	updated_at?: string
	studentId?: string
	studentName?: string
	file_url?: Array<{ name: string; url: string }> | string | null
}

const AssignmentsPage: React.FC = () => {
	const { t } = useTranslation()
	const [activeFilter, setActiveFilter] = useState<FilterType>('all')
	const [childFilter, setChildFilter] = useState<ChildFilter>('all')
	const [assignments, setAssignments] = useState<Assignment[]>([])
	const [submissions, setSubmissions] = useState<Submission[]>([])
	const [children, setChildren] = useState<{ id: string; name: string }[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [modalIsOpen, setModalIsOpen] = useState(false)
	const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
	const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

	const { user } = useAuth()
	const parentId = user?.id

	useEffect(() => {
		const loadData = async () => {
			if (!parentId) {
				setError(t('parent.assignments.parentIdNotFound'))
				setIsLoading(false)
				return
			}
			setIsLoading(true)
			setError(null)
			try {
				const { fetchParentChildren } = await import('../../services/timetableService')

				// Get children and comprehensive assignment + submission data
				const [fetchedChildren, dashboardData] = await Promise.all([
					fetchParentChildren(parentId),
					fetchParentDashboardData(parentId),
				])

				setChildren(fetchedChildren || [])
				setAssignments(dashboardData.assignments || [])
				setSubmissions(dashboardData.submissions || [])
			} catch (err) {
				console.error('Failed to load data:', err)
				setError(t('parent.assignments.couldNotLoadData'))
			} finally {
				setIsLoading(false)
			}
		}
		loadData()
	}, [parentId])

	const filteredAssignments = assignments.filter(assignment => {
		const statusMatch = activeFilter === 'all' || assignment.status === activeFilter
		const childMatch = childFilter === 'all' || assignment.studentId === childFilter
		return statusMatch && childMatch
	})

	const getSubmissionForAssignment = (assignmentId: string, studentId: string) => {
		return submissions.find(sub => sub.assignmentid === assignmentId && sub.studentid === studentId)
	}

	const getStatusIcon = (status: Assignment['status']) => {
		switch (status) {
			case 'completed':
				return <FiCheckCircle />
			case 'pending':
				return <FiClockIcon />
			case 'late':
				return <FiXCircle />
			case 'overdue':
				return <FiAlertTriangle />
			case 'upcoming':
				return <FiCalendar />
			default:
				return null
		}
	}

	const getStatusText = (status: Assignment['status']) => {
		switch (status) {
			case 'completed':
				return t('parent.assignments.filters.completed')
			case 'pending':
				return t('parent.assignments.filters.pending')
			case 'late':
				return t('parent.assignments.filters.late')
			case 'overdue':
				return t('parent.assignments.filters.overdue')
			case 'upcoming':
				return t('parent.assignments.filters.upcoming')
			default:
				return t('parent.assignments.filters.pending')
		}
	}

	const openModal = (assignment: Assignment) => {
		setSelectedAssignment(assignment)
		const submission = getSubmissionForAssignment(assignment.id, assignment.studentId || '')
		setSelectedSubmission(submission || null)
		setModalIsOpen(true)
	}

	const closeModal = () => {
		setModalIsOpen(false)
		setSelectedAssignment(null)
		setSelectedSubmission(null)
	}

	return (
		<Container>
			<TitleWrapper>
				<PageTitle>{t('parent.assignments.title')}</PageTitle>
				<SubTitle>{t('parent.assignments.description')}</SubTitle>
			</TitleWrapper>

			<FiltersRow>
				<FilterGroup>
					<FilterButton $active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>
						{t('common.all')}
					</FilterButton>
					<FilterButton
						$active={activeFilter === 'pending'}
						onClick={() => setActiveFilter('pending')}
						$color='warning'
					>
						<FiClock /> {t('parent.assignments.filters.pending')}
					</FilterButton>
					<FilterButton
						$active={activeFilter === 'completed'}
						onClick={() => setActiveFilter('completed')}
						$color='success'
					>
						<FiCheck /> {t('parent.assignments.filters.completed')}
					</FilterButton>
					<FilterButton
						$active={activeFilter === 'overdue'}
						onClick={() => setActiveFilter('overdue')}
						$color='danger'
					>
						<FiAlertTriangle /> {t('parent.assignments.filters.overdue')}
					</FilterButton>
					<FilterButton
						$active={activeFilter === 'upcoming'}
						onClick={() => setActiveFilter('upcoming')}
						$color='info'
					>
						<FiCalendar /> {t('parent.assignments.filters.upcoming')}
					</FilterButton>
				</FilterGroup>

				<ChildFilterDropdown
					value={childFilter}
					onChange={e => setChildFilter(e.target.value as ChildFilter)}
					disabled={isLoading}
				>
					<option value='all'>{t('parent.assignments.allChildren')}</option>
					{children.map(child => (
						<option key={child.id} value={child.id}>
							{child.name}
						</option>
					))}
				</ChildFilterDropdown>
			</FiltersRow>

			<AssignmentsList>
				{isLoading ? (
					<LoadingState>
						<FiLoader /> {t('parent.assignments.loadingAssignments')}
					</LoadingState>
				) : error ? (
					<NoAssignments>
						<p>{error}</p>
					</NoAssignments>
				) : filteredAssignments.length === 0 ? (
					<NoAssignments>
						<p>{t('parent.assignments.noAssignmentsMatch')}</p>
					</NoAssignments>
				) : (
					filteredAssignments.map(assignment => {
						const submission = getSubmissionForAssignment(assignment.id, assignment.studentId || '')
						return (
							<AssignmentCard key={assignment.id}>
								<Row>
									<Col lg={8}>
										<AssignmentHeader>
											<AssignmentTitle>{assignment.title}</AssignmentTitle>
											<StatusBadge $status={assignment.status as FilterType | 'overdue'}>
												{getStatusIcon(assignment.status)}{' '}
												{getStatusText(assignment.status)}
											</StatusBadge>
										</AssignmentHeader>
										<AssignmentSubject>
											{assignment.className || assignment.subject}
										</AssignmentSubject>
										<AssignmentDescription>{assignment.description}</AssignmentDescription>
									</Col>
									<Col lg={4}>
										<AssignmentMeta>
											<MetaItem>
												<MetaIcon>
													<FiCalendar />
												</MetaIcon>
												<MetaText>
													<MetaLabel>{t('parent.assignments.dueDate')}</MetaLabel>
													<MetaValue>
														{new Date(assignment.due_date).toLocaleDateString()}
													</MetaValue>
												</MetaText>
											</MetaItem>
											<MetaItem>
												<MetaIcon>
													<FiUser />
												</MetaIcon>
												<MetaText>
													<MetaLabel>{t('parent.assignments.child')}</MetaLabel>
													<MetaValue>{assignment.studentName || t('common.notAvailable')}</MetaValue>
												</MetaText>
											</MetaItem>
											{submission?.grade && (
												<MetaItem>
													<MetaIcon>
														<FiCheck />
													</MetaIcon>
													<MetaText>
														<MetaLabel>{t('parent.assignments.grade')}</MetaLabel>
														<MetaValue>{submission.grade}</MetaValue>
													</MetaText>
												</MetaItem>
											)}
											{submission?.fileurl && (
												<MetaItem>
													<MetaIcon>
														<FiFileText />
													</MetaIcon>
													<MetaText>
														<MetaLabel>{t('parent.assignments.submitted')}</MetaLabel>
														<MetaValue>
															{new Date(submission.submittedat).toLocaleDateString()}
														</MetaValue>
													</MetaText>
												</MetaItem>
											)}
											<ViewDetailsButton onClick={() => openModal(assignment)}>
												{t('common.viewDetails')}
											</ViewDetailsButton>
										</AssignmentMeta>
									</Col>
								</Row>
							</AssignmentCard>
						)
					})
				)}
			</AssignmentsList>

			<Modal
				isOpen={modalIsOpen}
				onRequestClose={closeModal}
				contentLabel='Assignment Details'
				style={{
					overlay: {
						backgroundColor: 'rgba(0, 0, 0, 0.6)',
						zIndex: 1000,
					},
					content: {
						top: '50%',
						left: '50%',
						right: 'auto',
						bottom: 'auto',
						marginRight: '-50%',
						transform: 'translate(-50%, -50%)',
						borderRadius: '12px',
						padding: '0',
						border: 'none',
						width: '90%',
						maxWidth: '700px',
						maxHeight: '85vh',
						overflow: 'hidden',
					},
				}}
			>
				{selectedAssignment && (
					<ModalContent>
						<ModalHeader>
							<div>
								<ModalCourseName>
									{selectedAssignment.className || selectedAssignment.subject}
								</ModalCourseName>
								<ModalTitle>{selectedAssignment.title}</ModalTitle>
							</div>
							<CloseButton onClick={closeModal}>
								<FiX size={20} />
							</CloseButton>
						</ModalHeader>

						<ModalBody>
							<ModalStatusSection>
								<StatusBadge $status={selectedAssignment.status as FilterType | 'overdue'}>
									{getStatusIcon(selectedAssignment.status)}{' '}
									{getStatusText(selectedAssignment.status)}
								</StatusBadge>
							</ModalStatusSection>

							<ModalDetailSection>
								<ModalDetailSectionTitle>{t('parent.assignments.modal.description')}</ModalDetailSectionTitle>
								<ModalDetailContent>
									{selectedAssignment.description || t('parent.assignments.modal.noDescription')}
								</ModalDetailContent>
							</ModalDetailSection>

							<ModalDetailSection>
								<ModalDetailSectionTitle>{t('parent.assignments.modal.details')}</ModalDetailSectionTitle>
								<ModalDetailsGrid>
									<MetaItem>
										<MetaIcon>
											<FiCalendar />
										</MetaIcon>
										<MetaText>
											<MetaLabel>{t('parent.assignments.dueDate')}</MetaLabel>
											<MetaValue>
												{new Date(selectedAssignment.due_date).toLocaleDateString()} {t('parent.assignments.modal.at')}{' '}
												{new Date(selectedAssignment.due_date).toLocaleTimeString([], {
													hour: '2-digit',
													minute: '2-digit',
												})}
											</MetaValue>
										</MetaText>
									</MetaItem>
									<MetaItem>
										<MetaIcon>
											<FiUser />
										</MetaIcon>
										<MetaText>
											<MetaLabel>{t('parent.assignments.child')}</MetaLabel>
											<MetaValue>{selectedAssignment.studentName || t('common.notAvailable')}</MetaValue>
										</MetaText>
									</MetaItem>
									{selectedSubmission?.grade && (
										<MetaItem>
											<MetaIcon>
												<FiCheck />
											</MetaIcon>
											<MetaText>
												<MetaLabel>{t('parent.assignments.grade')}</MetaLabel>
												<MetaValue>{selectedSubmission.grade}</MetaValue>
											</MetaText>
										</MetaItem>
									)}
									{selectedSubmission?.fileurl && (
										<MetaItem>
											<MetaIcon>
												<FiFileText />
											</MetaIcon>
											<MetaText>
												<MetaLabel>{t('parent.assignments.submitted')}</MetaLabel>
												<MetaValue>
													{new Date(selectedSubmission.submittedat).toLocaleDateString()}
												</MetaValue>
											</MetaText>
										</MetaItem>
									)}
								</ModalDetailsGrid>
							</ModalDetailSection>

							{selectedAssignment.file_url && (
								<ModalDetailSection>
									<ModalDetailSectionTitle>
										<FiFileText />
										{t('parent.assignments.modal.assignmentMaterials')}
									</ModalDetailSectionTitle>
									{Array.isArray(selectedAssignment.file_url) ? (
										<FilesList>
											{selectedAssignment.file_url.map((file, index) => (
												<FileItem key={index}>
													<FileIcon>
														<FiFileText />
													</FileIcon>
													<FileName>{file.name}</FileName>
													<FileActionButton
														href={file.url}
														target='_blank'
														rel='noopener noreferrer'
													>
														{t('parent.assignments.modal.view')}
													</FileActionButton>
												</FileItem>
											))}
										</FilesList>
									) : (
										<FileItem>
											<FileIcon>
												<FiFileText />
											</FileIcon>
											<FileName>{t('parent.assignments.modal.assignmentMaterial')}</FileName>
											<FileActionButton
												href={selectedAssignment.file_url}
												target='_blank'
												rel='noopener noreferrer'
											>
												{t('parent.assignments.modal.view')}
											</FileActionButton>
										</FileItem>
									)}
								</ModalDetailSection>
							)}

							{selectedSubmission?.feedback && (
								<ModalDetailSection>
									<ModalDetailSectionTitle>{t('parent.assignments.modal.feedback')}</ModalDetailSectionTitle>
									<ModalDetailContent>{selectedSubmission.feedback}</ModalDetailContent>
								</ModalDetailSection>
							)}
						</ModalBody>

						<ModalFooter>
							{selectedSubmission?.fileurl && (
								<Button
									onClick={() => window.open(selectedSubmission.fileurl, '_blank')}
									variant='primary'
								>
									<FiFileText /> {t('parent.assignments.modal.viewSubmission')}
								</Button>
							)}
							<ModalSecondaryButton onClick={closeModal}>{t('common.close')}</ModalSecondaryButton>
						</ModalFooter>
					</ModalContent>
				)}
			</Modal>
		</Container>
	)
}

// Styled Components
const FiltersRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
	margin-top: 24px;
	flex-wrap: wrap;
	gap: 15px;

	@media (max-width: ${props => props.theme?.breakpoints?.md || '768px'}) {
		flex-direction: column;
		align-items: flex-start;
	}
`

const FilterGroup = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
`

interface FilterButtonProps {
	$active: boolean
	$color?: string
}

const FilterButton = styled.button<FilterButtonProps>`
	display: flex;
	align-items: center;
	gap: 5px;
	padding: 8px 15px;
	background-color: ${props =>
		props.$active
			? props.$color
				? props.theme?.colors?.[props.$color as keyof typeof props.theme.colors]?.[500] || '#1890ff'
				: props.theme?.colors?.primary?.[500] || '#1890ff'
			: props.theme?.colors?.background?.lighter || '#ffffff'};
	color: ${props =>
		props.$active
			? props.theme?.colors?.background?.lighter || '#ffffff'
			: props.$color
			? props.theme?.colors?.[props.$color as keyof typeof props.theme.colors]?.[600] || '#1890ff'
			: props.theme?.colors?.text?.secondary || '#666'};
	border: 1px solid
		${props =>
			props.$active
				? props.$color
					? props.theme?.colors?.[props.$color as keyof typeof props.theme.colors]?.[500] ||
					  '#1890ff'
					: props.theme?.colors?.primary?.[500] || '#1890ff'
				: props.theme?.colors?.border?.light || '#d9d9d9'};
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;

	&:hover {
		background-color: ${props =>
			!props.$active ? props.theme?.colors?.background?.hover || '#f0f0f0' : undefined};
		color: ${props => (!props.$active ? props.theme?.colors?.text?.primary || '#333' : undefined)};
	}

	svg {
		font-size: 16px;
	}
`

const ChildFilterDropdown = styled.select`
	padding: 8px 12px;
	border-radius: 6px;
	border: 1px solid ${props => props.theme?.colors?.border?.light || '#d9d9d9'};
	background-color: ${props => props.theme?.colors?.background?.lighter || '#ffffff'};
	font-size: 14px;
	min-width: 180px;

	&:disabled {
		background-color: ${props => props.theme?.colors?.background?.light || '#f5f5f5'};
		cursor: not-allowed;
	}
`

const AssignmentsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
`

const AssignmentCard = styled(Card)`
	padding: 20px;
`

const AssignmentHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 10px;
`

const AssignmentTitle = styled.h4`
	margin: 0;
	font-size: 1.1rem;
	font-weight: 600;
	color: ${props => props.theme?.colors?.text?.primary || '#333'};
`

interface StatusBadgeProps {
	$status: Assignment['status']
}

const StatusBadge = styled(Badge)<StatusBadgeProps>`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 5px 10px;
	font-size: 0.8rem;
	font-weight: 500;
	border-radius: 12px;
	background-color: ${props => {
		const colors = props.theme?.colors || {}
		switch (props.$status) {
			case 'completed':
				return colors.success?.[100] || '#e6f7e6'
			case 'pending':
				return colors.warning?.[100] || '#fff7e6'
			case 'overdue':
				return colors.danger?.[100] || '#ffe6e6'
			case 'upcoming':
				return colors.info?.[100] || '#e6f7ff'
			default:
				return colors.primary?.[100] || '#e6f7ff'
		}
	}};
	color: ${props => {
		const colors = props.theme?.colors || {}
		switch (props.$status) {
			case 'completed':
				return colors.success?.[800] || '#237804'
			case 'pending':
				return colors.warning?.[800] || '#ad6800'
			case 'overdue':
				return colors.danger?.[800] || '#a8071a'
			case 'upcoming':
				return colors.info?.[800] || '#0050b3'
			default:
				return colors.primary?.[800] || '#0050b3'
		}
	}};
`

const AssignmentSubject = styled.p`
	margin: 0 0 10px 0;
	color: ${props => props.theme?.colors?.text?.secondary || '#737373'};
	font-weight: 500;
`

const AssignmentDescription = styled.p`
	margin: 0;
	color: ${props => props.theme?.colors?.text?.secondary || '#737373'};
	font-size: 14px;
`

const AssignmentMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;
	padding-left: 20px;
	border-left: 1px solid ${props => props.theme?.colors?.border?.light || '#eee'};
	height: 100%;

	@media (max-width: ${props => props.theme?.breakpoints?.lg || '992px'}) {
		border-left: none;
		border-top: 1px solid ${props => props.theme?.colors?.border?.light || '#f0f0f0'};
		padding: 15px 0 0 0;
		margin-top: 15px;
	}
`

const MetaItem = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`

const MetaIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background-color: ${props => props.theme?.colors?.background?.tertiary || '#f5f5f5'};
	color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
`

const MetaText = styled.div`
	flex: 1;
`

const MetaLabel = styled.p`
	margin: 0;
	font-size: 12px;
	color: ${props => props.theme?.colors?.text?.secondary || '#737373'};
`

const MetaValue = styled.p`
	margin: 0;
	font-weight: 500;
`

const ViewDetailsButton = styled(Button).attrs({
	variant: 'outline',
	size: 'sm',
})`
	margin-top: 10px;
`

const NoAssignments = styled.div`
	text-align: center;
	padding: 40px;
	background-color: ${props => props.theme?.colors?.background?.tertiary || '#f5f5f5'};
	border-radius: ${props => props.theme?.borderRadius?.md || '6px'};
	color: ${props => props.theme?.colors?.text?.secondary || '#737373'};
`

const TitleWrapper = styled.div`
	margin-bottom: 16px;
`

const SubTitle = styled.p`
	color: ${props => props.theme?.colors?.text?.secondary || '#666'};
	margin: 8px 0 0 0;
	font-size: 0.95rem;
`

const LoadingState = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 40px;
	font-size: 1.1rem;
	color: ${({ theme }) => theme.colors.text.secondary};
	gap: 10px;

	svg {
		animation: spin 1.5s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`

const FilesList = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
`

const FileItem = styled.li`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 0;
`

const FileIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background-color: ${props => props.theme?.colors?.background?.tertiary || '#f5f5f5'};
	color: ${props => props.theme?.colors?.primary?.[500] || '#1890ff'};
`

const FileName = styled.span`
	font-size: 14px;
	font-weight: 500;
	color: ${props => props.theme?.colors?.text?.primary || '#333'};
`

const FileActionButton = styled.a`
	background: none;
	border: none;
	color: ${props => props.theme?.colors?.text?.primary || '#333'};
	font: inherit;
	cursor: pointer;
	outline: inherit;
	text-decoration: underline;
`

export default AssignmentsPage
