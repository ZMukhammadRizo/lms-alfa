import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
	FiCalendar,
	FiDownload,
	FiEdit3,
	FiEye,
	FiFile,
	FiFileText,
	FiMessageSquare,
	FiSave,
	FiStar,
	FiUser,
	FiX,
} from 'react-icons/fi'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Button, Card } from '../../../components/ui'
import {
	formatFileUrl,
	getFileDisplayName,
	updateSubmissionGradeFeedback,
} from '../../../services/submissionsService'
import useSubmissionsStore from '../../../store/submissionsStore'

const StudentSubmissions: React.FC = () => {
	const { t } = useTranslation()
	const { levelId, classId, studentId } = useParams()
	const [editingSubmission, setEditingSubmission] = useState<string | null>(null)
	const [gradeInput, setGradeInput] = useState<string>('')
	const [feedbackInput, setFeedbackInput] = useState<string>('')
	const [statusInput, setStatusInput] = useState<string>('pending')
	const [savingSubmission, setSavingSubmission] = useState<string | null>(null)

	const { submissions, students, isLoadingSubmissions, submissionsError, fetchStudentSubmissions } =
		useSubmissionsStore()

	// Get student info
	const student = students.find(s => s.studentId === studentId)

	// Helper function to translate status
	const translateStatus = (status: string | null): string => {
		if (!status) return t('submissions.pending')

		const statusTranslations: { [key: string]: string } = {
			pending: t('submissions.pending'),
			accepted: t('submissions.accepted'),
			rejected: t('submissions.rejected'),
		}

		return statusTranslations[status] || t('submissions.pending')
	}

	// Helper function to get status color
	const getStatusColor = (status: string | null): string => {
		switch (status) {
			case 'accepted':
				return '#10b981' // green
			case 'rejected':
				return '#ef4444' // red
			default:
				return '#f59e0b' // yellow/orange for pending
		}
	}

	// Get available status options
	const getStatusOptions = () => [
		{ value: 'pending', label: t('submissions.pending'), color: '#f59e0b' },
		{ value: 'accepted', label: t('submissions.accepted'), color: '#10b981' },
		{ value: 'rejected', label: t('submissions.rejected'), color: '#ef4444' },
	];

	// Validation function
	const validateSubmission = (): string | null => {
		if (statusInput === 'accepted' && !gradeInput.trim()) {
			return t('submissions.gradeRequiredForAccepted')
		}
		if (statusInput === 'rejected' && !feedbackInput.trim()) {
			return t('submissions.feedbackRequiredForRejected')
		}
		return null
	}

	// Fetch submissions on component mount
	useEffect(() => {
		if (studentId && classId) {
			fetchStudentSubmissions(studentId, classId)
		}
	}, [studentId, classId, fetchStudentSubmissions])

	// Handle edit submission
	const handleEditSubmission = (
		submissionId: string,
		currentGrade: number | null,
		currentFeedback: string | null,
		currentStatus: string | null
	) => {
		setEditingSubmission(submissionId)
		setGradeInput(currentGrade?.toString() || '')
		setFeedbackInput(currentFeedback || '')
		setStatusInput(currentStatus || 'pending')
	}

	// Handle save submission
	const handleSaveSubmission = async (submissionId: string) => {
		// Validate before saving
		const validationError = validateSubmission()
		if (validationError) {
			toast.error(validationError)
			return
		}

		setSavingSubmission(submissionId)
		try {
			const grade = gradeInput.trim() ? parseInt(gradeInput) : null
			const status = statusInput === 'pending' ? null : statusInput
			await updateSubmissionGradeFeedback(submissionId, grade, feedbackInput, status)

			// Refresh submissions
			if (studentId && classId) {
				await fetchStudentSubmissions(studentId, classId)
			}

			setEditingSubmission(null)
			setGradeInput('')
			setFeedbackInput('')
			setStatusInput('pending')
			toast.success(t('submissions.submissionUpdatedSuccessfully'))
		} catch (error) {
			console.error('Error updating submission:', error)
			toast.error(t('submissions.errorUpdatingSubmission'))
		} finally {
			setSavingSubmission(null)
		}
	}

	// Handle cancel edit
	const handleCancelEdit = () => {
		setEditingSubmission(null)
		setGradeInput('')
		setFeedbackInput('')
		setStatusInput('pending')
	}

	// Handle file download
	const handleDownloadFile = (url: string) => {
		try {
			const formattedUrl = formatFileUrl(url)
			const fileName = getFileDisplayName(url)

			const link = document.createElement('a')
			link.href = formattedUrl
			link.target = '_blank'
			link.download = fileName
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
		} catch (error) {
			console.error('Error downloading file:', error)
			toast.error(t('submissions.errorDownloadingFile'))
		}
	}

	if (isLoadingSubmissions) {
		return (
			<Container>
				<LoadingMessage>{t('submissions.loadingSubmissions')}</LoadingMessage>
			</Container>
		)
	}

	if (submissionsError) {
		return (
			<Container>
				<ErrorMessage>{submissionsError}</ErrorMessage>
			</Container>
		)
	}

	return (
		<Container>
			<Header>
				<StudentInfo>
					<StudentAvatar>
						<FiUser />
					</StudentAvatar>
					<StudentDetails>
						<StudentName>{student?.fullName || t('submissions.unknownStudent')}</StudentName>
						<StudentMeta>
							<FiFileText size={16} />
							<span>
								{submissions.length}{' '}
								{submissions.length === 1
									? t('submissions.submission')
									: t('submissions.submissions')}
							</span>
						</StudentMeta>
					</StudentDetails>
				</StudentInfo>
			</Header>

			{submissions.length === 0 ? (
				<EmptyState>
					<EmptyStateIcon>
						<FiFileText size={48} />
					</EmptyStateIcon>
					<EmptyStateTitle>{t('submissions.noSubmissions')}</EmptyStateTitle>
					<EmptyStateText>{t('submissions.noSubmissionsForStudent')}</EmptyStateText>
				</EmptyState>
			) : (
				<SubmissionsGrid>
					{submissions.map((submission, index) => (
						<SubmissionCard
							key={submission.id}
							as={motion.div}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.1 }}
						>
							<CardHeader>
								<SubmissionTitle>{submission.assignmentTitle}</SubmissionTitle>
								<StatusBadge $color={getStatusColor(submission.status)}>
									{translateStatus(submission.status)}
								</StatusBadge>
							</CardHeader>

							<CardContent>
								<MetaInfo>
									<MetaItem>
										<FiFileText size={16} />
										<span>{submission.subjectName}</span>
									</MetaItem>
									<MetaItem>
										<FiCalendar size={16} />
										<span>{new Date(submission.submittedat).toLocaleDateString()}</span>
									</MetaItem>
								</MetaInfo>

								{/* Files Section */}
								{submission.fileurl && submission.fileurl.length > 0 && (
									<FilesSection>
										<FilesSectionTitle>
											<FiFile size={16} />
											{t('submissions.submittedFiles')}
										</FilesSectionTitle>
										<FilesList>
											{submission.fileurl.map((url: string, fileIndex: number) => (
												<FileItem key={fileIndex}>
													<FileName>{getFileDisplayName(url)}</FileName>
													<FileActions>
														<FileButton onClick={() => handleDownloadFile(url)}>
															<FiDownload size={14} />
														</FileButton>
														<FileButton onClick={() => window.open(formatFileUrl(url), '_blank')}>
															<FiEye size={14} />
														</FileButton>
													</FileActions>
												</FileItem>
											))}
										</FilesList>
									</FilesSection>
								)}

								{/* Grade and Feedback Section */}
								<GradingSection>
									{editingSubmission === submission.id ? (
										<EditingForm>
											<FormRow>
												<FormGroup>
													<FormLabel>{t('submissions.status')}</FormLabel>
													<StatusSelector>
														{getStatusOptions().map(option => (
															<StatusOption
																key={option.value}
																$isSelected={statusInput === option.value}
																$color={option.color}
																onClick={() => setStatusInput(option.value)}
															>
																<StatusDot $color={option.color} />
																{option.label}
															</StatusOption>
														))}
													</StatusSelector>
												</FormGroup>
											</FormRow>
											<FormRow>
												<FormGroup>
													<FormLabel>
														{t('submissions.grade')}
														{statusInput === 'accepted' && <RequiredIndicator>*</RequiredIndicator>}
													</FormLabel>
													<StyledInput
														type='number'
														min='1'
														max='10'
														value={gradeInput}
														onChange={e => setGradeInput(e.target.value)}
														placeholder={t('submissions.enterGrade')}
													/>
												</FormGroup>
											</FormRow>
											<FormRow>
												<FormGroup>
													<FormLabel>
														{t('submissions.feedback')}
														{statusInput === 'rejected' && <RequiredIndicator>*</RequiredIndicator>}
													</FormLabel>
													<StyledTextarea
														value={feedbackInput}
														onChange={e => setFeedbackInput(e.target.value)}
														placeholder={t('submissions.enterFeedback')}
														style={{ resize: 'vertical' }}
													/>
												</FormGroup>
											</FormRow>
											<FormActions>
												<Button
													variant='primary'
													onClick={() => handleSaveSubmission(submission.id)}
													disabled={savingSubmission === submission.id}
												>
													<FiSave size={16} />
													{savingSubmission === submission.id
														? t('common.saving')
														: t('common.save')}
												</Button>
												<Button variant='secondary' onClick={handleCancelEdit}>
													<FiX size={16} />
													{t('common.cancel')}
												</Button>
											</FormActions>
										</EditingForm>
									) : (
										<GradeDisplay>
											<GradeInfo>
												<GradeValue>
													{submission.grade !== null ? (
														<>
															<FiStar size={16} />
															{submission.grade}/10
														</>
													) : (
														<>
															<FiEdit3 size={16} />
															{t('submissions.notGraded')}
														</>
													)}
												</GradeValue>
												<EditButton
													onClick={() =>
														handleEditSubmission(
															submission.id,
															submission.grade,
															submission.feedback,
															submission.status
														)
													}
												>
													<FiEdit3 size={14} />
													{t('submissions.editGrade')}
												</EditButton>
											</GradeInfo>
											{submission.feedback && (
												<FeedbackSection>
													<FeedbackLabel>
														<FiMessageSquare size={16} />
														{t('submissions.feedback')}
													</FeedbackLabel>
													<FeedbackText>{submission.feedback}</FeedbackText>
												</FeedbackSection>
											)}
										</GradeDisplay>
									)}
								</GradingSection>
							</CardContent>
						</SubmissionCard>
					))}
				</SubmissionsGrid>
			)}
		</Container>
	)
}

// Styled Components
const Container = styled.div`
	padding: 24px;
	max-width: 1200px;
	margin: 0 auto;
`

const Header = styled.div`
	margin-bottom: 32px;
`

const StudentInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
`

const StudentAvatar = styled.div`
	width: 64px;
	height: 64px;
	border-radius: 50%;
	background: ${props => props.theme.colors.primary[500]};
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24px;
`

const StudentDetails = styled.div`
	flex: 1;
`

const StudentName = styled.h1`
	margin: 0 0 8px;
	font-size: 1.75rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const StudentMeta = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.9rem;
`

const SubmissionsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
	gap: 24px;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`

const SubmissionCard = styled(Card)`
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 12px;
	overflow: hidden;
	background: ${props => props.theme.colors.background.primary};
	transition: all 0.3s ease;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
		border-color: ${props => props.theme.colors.primary[200]};
	}
`

const CardHeader = styled.div`
	padding: 24px 24px 20px;
	border-bottom: 1px solid ${props => props.theme.colors.border.lighter};
	background: linear-gradient(
		135deg,
		${props => props.theme.colors.background.primary} 0%,
		${props => props.theme.colors.background.secondary} 100%
	);
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 16px;
`

const SubmissionTitle = styled.h3`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	line-height: 1.3;
	flex: 1;
`

interface StatusBadgeProps {
	$color: string
}

const StatusBadge = styled(Badge)<StatusBadgeProps>`
	background: ${props => `${props.$color}20`};
	color: ${props => props.$color};
	border: 1px solid ${props => `${props.$color}40`};
	font-weight: 500;
`

const CardContent = styled.div`
	padding: 20px 24px 24px;
`

const MetaInfo = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	margin-bottom: 20px;
`

const MetaItem = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.9rem;
`

const FilesSection = styled.div`
	margin-bottom: 24px;
`

const FilesSectionTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: 12px;
	font-size: 0.95rem;
`

const FilesList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const FileItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	background: ${props => props.theme.colors.background.secondary};
	border-radius: 8px;
	border: 1px solid ${props => props.theme.colors.border.lighter};
`

const FileName = styled.span`
	flex: 1;
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.primary};
	word-break: break-all;
`

const FileActions = styled.div`
	display: flex;
	gap: 8px;
`

const FileButton = styled.button`
	width: 32px;
	height: 32px;
	border: none;
	border-radius: 6px;
	background: ${props => props.theme.colors.primary[50]};
	color: ${props => props.theme.colors.primary[600]};
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${props => props.theme.colors.primary[100]};
		color: ${props => props.theme.colors.primary[700]};
	}
`

const GradingSection = styled.div`
	border-top: 1px solid ${props => props.theme.colors.border.lighter};
	padding-top: 20px;
`

const EditingForm = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`

const FormRow = styled.div`
	display: flex;
	gap: 16px;

	@media (max-width: 480px) {
		flex-direction: column;
	}
`

const FormGroup = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const FormLabel = styled.label`
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.9rem;
`

const StyledInput = styled.input`
	width: 100%;
	border: 2px solid #e2e8f0;
	border-radius: 8px;
	padding: 12px 16px;
	font-size: 0.95rem;
	transition: all 0.2s ease;
	background-color: #ffffff;
	color: #1a202c;

	&:hover {
		border-color: #93c5fd;
	}

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px #dbeafe;
	}

	&::placeholder {
		color: #64748b;
	}
`

const StyledTextarea = styled.textarea`
	width: 100%;
	resize: vertical;
	border: 2px solid #e2e8f0;
	border-radius: 8px;
	padding: 12px 16px;
	font-size: 0.95rem;
	min-height: 100px;
	transition: all 0.2s ease;
	background-color: #ffffff;
	color: #1a202c;

	&:hover {
		border-color: #93c5fd;
	}

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px #dbeafe;
	}

	&::placeholder {
		color: #64748b;
	}
`

const FormActions = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
`

const GradeDisplay = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`

const GradeInfo = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
`

const GradeValue = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 1.1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const EditButton = styled.button`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 12px;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 6px;
	background: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	font-size: 0.85rem;
	transition: all 0.2s ease;

	&:hover {
		border-color: ${props => props.theme.colors.primary[300]};
		color: ${props => props.theme.colors.primary[600]};
	}
`

const FeedbackSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const FeedbackLabel = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.9rem;
`

const FeedbackText = styled.div`
	padding: 12px 16px;
	background: ${props => props.theme.colors.background.secondary};
	border-radius: 8px;
	border: 1px solid ${props => props.theme.colors.border.lighter};
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.9rem;
	line-height: 1.5;
	white-space: pre-wrap;
`

const LoadingMessage = styled.div`
	text-align: center;
	padding: 60px 20px;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 1.1rem;
`

const ErrorMessage = styled.div`
	text-align: center;
	padding: 60px 20px;
	color: ${props => props.theme.colors.danger[500]};
	font-size: 1.1rem;
`

const EmptyState = styled.div`
	text-align: center;
	padding: 80px 20px;
`

const EmptyStateIcon = styled.div`
	color: ${props => props.theme.colors.text.tertiary};
	margin-bottom: 24px;
`

const EmptyStateTitle = styled.h3`
	color: ${props => props.theme.colors.text.primary};
	font-size: 1.5rem;
	font-weight: 600;
	margin: 0 0 12px;
`

const EmptyStateText = styled.p`
	color: ${props => props.theme.colors.text.secondary};
	font-size: 1rem;
	margin: 0;
	max-width: 400px;
	margin-left: auto;
	margin-right: auto;
	line-height: 1.5;
`

// Status Selector Components
const StatusSelector = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
`

interface StatusOptionProps {
	$isSelected: boolean
	$color: string
}

const StatusOption = styled.button<StatusOptionProps>`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	border: 2px solid ${props => (props.$isSelected ? props.$color : 'transparent')};
	border-radius: 8px;
	background: ${props => (props.$isSelected ? `${props.$color}10` : '#f8fafc')};
	color: ${props => (props.$isSelected ? props.$color : '#1a202c')};
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: 0.9rem;
	font-weight: 500;

	&:hover {
		border-color: ${props => props.$color};
		background: ${props => `${props.$color}15`};
	}
`

interface StatusDotProps {
	$color: string
}

const StatusDot = styled.div<StatusDotProps>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: ${props => props.$color};
`

const RequiredIndicator = styled.span`
	color: #ef4444;
	margin-left: 4px;
	font-weight: 600;
`

export default StudentSubmissions
