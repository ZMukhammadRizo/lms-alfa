import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	FiCalendar,
	FiChevronRight,
	FiFileText,
	FiGrid,
	FiList,
	FiSearch,
	FiUser,
} from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { PageTitle } from '../../../components/common'
import { Card, Input } from '../../../components/ui'
import { useAuth } from '../../../contexts/AuthContext'
import useSubmissionsStore from '../../../store/submissionsStore'

const StudentSelect: React.FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { levelId, classId } = useParams<{ levelId?: string; classId: string }>()
	const [searchTerm, setSearchTerm] = useState('')
	const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
	const [hoveredCard, setHoveredCard] = useState<string | null>(null)
	const { user } = useAuth()
	const [error, setError] = useState<string | null>(null)

	// Use the submissionsStore
	const students = useSubmissionsStore(state => state.students)
	const isLoadingStudents = useSubmissionsStore(state => state.isLoadingStudents)
	const fetchClassStudents = useSubmissionsStore(state => state.fetchClassStudents)

	useEffect(() => {
		const loadData = async () => {
			if (classId && user?.id) {
				console.log('Teacher StudentSelect: Loading students for class:', classId)
				try {
					await fetchClassStudents(classId)
					console.log('Students loaded:', students)
				} catch (error) {
					console.error('Error loading students:', error)
					setError('Failed to load students')
				}
			}
		}

		loadData()
	}, [classId, user, fetchClassStudents])

	// Filter students based on search term
	const filteredStudents = students.filter(
		student =>
			student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			student.email.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const handleStudentClick = (studentId: string) => {
		if (levelId) {
			navigate(`/teacher/submissions/levels/${levelId}/classes/${classId}/students/${studentId}`)
		} else {
			navigate(`/teacher/submissions/classes/${classId}/students/${studentId}`)
		}
	}

	const formatLastSubmission = (date: string | null) => {
		if (!date) return t('submissions.noSubmissions')
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		})
	}

	const formatGrade = (grade: number | null) => {
		if (grade === null) return t('submissions.notGraded')
		return `${grade}/10`
	}

	if (isLoadingStudents) {
		return (
			<PageContainer>
				<LoadingMessage>{t('submissions.loadingStudents')}</LoadingMessage>
			</PageContainer>
		)
	}

	if (error) {
		return (
			<PageContainer>
				<ErrorMessage>{error}</ErrorMessage>
			</PageContainer>
		)
	}

	return (
		<PageContainer>
			<PageHeaderWrapper>
				<PageHeader>
					<HeaderContent>
						<PageTitle>{t('submissions.selectStudent')}</PageTitle>
						<SubTitle>{t('submissions.chooseStudentToViewSubmissions')}</SubTitle>
					</HeaderContent>
					<HeaderRight>
						<SearchWrapper>
							<StyledInput
								prefix={<FiSearch />}
								placeholder={t('submissions.searchStudents')}
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
							/>
						</SearchWrapper>
						<ViewModeToggle>
							<ViewModeButton $isActive={viewMode === 'grid'} onClick={() => setViewMode('grid')}>
								<FiGrid size={16} />
							</ViewModeButton>
							<ViewModeButton $isActive={viewMode === 'table'} onClick={() => setViewMode('table')}>
								<FiList size={16} />
							</ViewModeButton>
						</ViewModeToggle>
					</HeaderRight>
				</PageHeader>
			</PageHeaderWrapper>

			{filteredStudents.length === 0 ? (
				<EmptyStateContainer>
					<EmptyStateIcon>
						<FiUser size={48} />
					</EmptyStateIcon>
					<EmptyStateTitle>
						{searchTerm ? t('submissions.noStudentsMatchSearch') : t('submissions.noStudentsFound')}
					</EmptyStateTitle>
					<EmptyStateText>
						{searchTerm
							? t('submissions.tryDifferentStudentSearch')
							: t('submissions.noStudentsInClass')}
					</EmptyStateText>
				</EmptyStateContainer>
			) : (
				<>
					<ResultsHeader>
						<ResultsCount>
							{filteredStudents.length}{' '}
							{filteredStudents.length === 1 ? t('submissions.student') : t('submissions.students')}
						</ResultsCount>
					</ResultsHeader>

					{viewMode === 'grid' ? (
						<StudentsGrid>
							{filteredStudents.map((student, index) => (
								<StudentCard
									key={student.studentId}
									as={motion.div}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3, delay: index * 0.1 }}
									onMouseEnter={() => setHoveredCard(student.studentId)}
									onMouseLeave={() => setHoveredCard(null)}
									onClick={() => handleStudentClick(student.studentId)}
								>
									<CardHeader>
										<StudentIcon>
											<FiUser size={18} />
										</StudentIcon>
										<StudentInfo>
											<StudentName>{student.fullName}</StudentName>
											<StudentEmail>{student.email}</StudentEmail>
										</StudentInfo>
										<ChevronIcon $isHovered={hoveredCard === student.studentId}>
											<FiChevronRight size={18} />
										</ChevronIcon>
									</CardHeader>

									<CardBody>
										<StatsRow>
											<StatItem>
												<StatIcon>
													<FiFileText size={16} />
												</StatIcon>
												<StatContent>
													<StatValue>{student.submissionCount}</StatValue>
													<StatLabel>
														{student.submissionCount === 1
															? t('submissions.submission')
															: t('submissions.submissions')}
													</StatLabel>
												</StatContent>
											</StatItem>

											{student.averageGrade !== null && (
												<StatItem>
													<GradeBadge $hasGrade={student.averageGrade !== null}>
														{formatGrade(student.averageGrade)}
													</GradeBadge>
												</StatItem>
											)}
										</StatsRow>

										<LastSubmissionInfo>
											<FiCalendar size={14} />
											<span>
												{t('submissions.lastSubmission')}:{' '}
												{formatLastSubmission(student.lastSubmissionDate)}
											</span>
										</LastSubmissionInfo>

										<ViewSubmissionsButton $isHovered={hoveredCard === student.studentId}>
											<FiFileText size={16} />
											{t('submissions.viewSubmissions')}
										</ViewSubmissionsButton>
									</CardBody>
								</StudentCard>
							))}
						</StudentsGrid>
					) : (
						<TableContainer>
							<TableHeader>
								<TableHeaderCell>{t('submissions.student')}</TableHeaderCell>
								<TableHeaderCell>{t('submissions.submissions')}</TableHeaderCell>
								<TableHeaderCell>{t('submissions.averageGrade')}</TableHeaderCell>
								<TableHeaderCell>{t('submissions.lastSubmission')}</TableHeaderCell>
								<TableHeaderCell>{t('submissions.actions')}</TableHeaderCell>
							</TableHeader>
							<TableBody>
								{filteredStudents.map((student, index) => (
									<TableRow
										key={student.studentId}
										as={motion.tr}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ duration: 0.3, delay: index * 0.05 }}
										onClick={() => handleStudentClick(student.studentId)}
									>
										<TableCell>
											<StudentTableInfo>
												<StudentTableIcon>
													<FiUser size={16} />
												</StudentTableIcon>
												<StudentTableDetails>
													<StudentTableName>{student.fullName}</StudentTableName>
													<StudentTableEmail>{student.email}</StudentTableEmail>
												</StudentTableDetails>
											</StudentTableInfo>
										</TableCell>
										<TableCell>
											<SubmissionCountBadge>{student.submissionCount}</SubmissionCountBadge>
										</TableCell>
										<TableCell>
											<GradeBadge $hasGrade={student.averageGrade !== null}>
												{formatGrade(student.averageGrade)}
											</GradeBadge>
										</TableCell>
										<TableCell>
											<DateText $hasDate={student.lastSubmissionDate !== null}>
												{formatLastSubmission(student.lastSubmissionDate)}
											</DateText>
										</TableCell>
										<TableCell>
											<ViewButton
												onClick={e => {
													e.stopPropagation()
													handleStudentClick(student.studentId)
												}}
											>
												<FiFileText size={16} />
												{t('submissions.view')}
											</ViewButton>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</TableContainer>
					)}
				</>
			)}
		</PageContainer>
	)
}

// Styled Components (same as admin version)
const PageContainer = styled.div`
	padding: 24px;
	max-width: 1200px;
	margin: 0 auto;
`

const PageHeaderWrapper = styled.div`
	margin-bottom: 32px;
`

const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 24px;

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: stretch;
	}
`

const HeaderContent = styled.div`
	flex: 1;
`

const SubTitle = styled.p`
	color: ${props => props.theme.colors.text.secondary};
	font-size: 1rem;
	margin: 8px 0 0;
	line-height: 1.5;
`

const HeaderRight = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
`

const SearchWrapper = styled.div`
	min-width: 280px;

	@media (max-width: 768px) {
		min-width: auto;
		width: 100%;
	}
`

const StyledInput = styled(Input)`
	.ant-input-affix-wrapper {
		border-radius: 8px;
		border: 1px solid ${props => props.theme.colors.border.light};

		&:focus,
		&:focus-within {
			border-color: ${props => props.theme.colors.primary[500]};
			box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
		}
	}
`

const ViewModeToggle = styled.div`
	display: flex;
	border-radius: 8px;
	background: ${props => props.theme.colors.background.secondary};
	padding: 4px;

	@media (max-width: 768px) {
		display: none;
	}
`

interface ViewModeButtonProps {
	$isActive: boolean
}

const ViewModeButton = styled.button<ViewModeButtonProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px;
	border: none;
	border-radius: 6px;
	background: ${props => (props.$isActive ? props.theme.colors.primary[500] : 'transparent')};
	color: ${props => (props.$isActive ? 'white' : props.theme.colors.text.secondary)};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${props =>
			props.$isActive ? props.theme.colors.primary[500] : props.theme.colors.background.hover};
	}
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

const EmptyStateContainer = styled.div`
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

const ResultsHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
`

const ResultsCount = styled.div`
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.9rem;
	font-weight: 500;
`

const StudentsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
	gap: 20px;
`

const StudentCard = styled(Card)`
	cursor: pointer;
	transition: all 0.2s ease;
	border: 1px solid ${props => props.theme.colors.border.light};

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
		border-color: ${props => props.theme.colors.primary[200]};
	}
`

const CardHeader = styled.div`
	padding: 16px 20px;
	border-bottom: 1px solid ${props => props.theme.colors.border.lighter};
	display: flex;
	align-items: center;
	gap: 12px;
`

const StudentIcon = styled.div`
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: ${props => props.theme.colors.primary[50]};
	color: ${props => props.theme.colors.primary[500]};
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
`

const StudentInfo = styled.div`
	flex: 1;
	min-width: 0;
`

const StudentName = styled.h3`
	margin: 0 0 4px;
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const StudentEmail = styled.div`
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};
`

const CardBody = styled.div`
	padding: 16px 20px;
`

const StatsRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16px;
`

const StatItem = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`

const StatIcon = styled.div`
	width: 28px;
	height: 28px;
	border-radius: 6px;
	background: ${props => props.theme.colors.background.secondary};
	color: ${props => props.theme.colors.text.secondary};
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
`

const StatContent = styled.div``

const StatValue = styled.div`
	font-size: 1.1rem;
	font-weight: 700;
	color: ${props => props.theme.colors.text.primary};
	line-height: 1.2;
`

const StatLabel = styled.div`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
	line-height: 1.2;
`

interface GradeBadgeProps {
	$hasGrade: boolean
}

const GradeBadge = styled.div<GradeBadgeProps>`
	display: inline-flex;
	align-items: center;
	height: 24px;
	padding: 0 8px;
	background: ${props =>
		props.$hasGrade ? props.theme.colors.success[50] : props.theme.colors.neutral[50]};
	color: ${props =>
		props.$hasGrade ? props.theme.colors.success[600] : props.theme.colors.neutral[600]};
	border-radius: 12px;
	font-size: 0.8rem;
	font-weight: 600;
`

const LastSubmissionInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 20px;
	padding: 12px;
	background: ${props => props.theme.colors.background.secondary};
	border-radius: 8px;
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};
`

interface ViewSubmissionsButtonProps {
	$isHovered: boolean
}

const ViewSubmissionsButton = styled.div<ViewSubmissionsButtonProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 12px 16px;
	background: ${props =>
		props.$isHovered ? props.theme.colors.primary[500] : props.theme.colors.background.secondary};
	color: ${props => (props.$isHovered ? 'white' : props.theme.colors.text.secondary)};
	border-radius: 8px;
	font-size: 0.9rem;
	font-weight: 500;
	transition: all 0.2s ease;
`

// Table Components
const TableContainer = styled.div`
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 12px;
	overflow: hidden;
	background: white;
`

const TableHeader = styled.div`
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1.5fr 1fr;
	background: ${props => props.theme.colors.background.secondary};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const TableHeaderCell = styled.div`
	padding: 16px 20px;
	font-size: 0.85rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.secondary};
	text-transform: uppercase;
	letter-spacing: 0.5px;
`

const TableBody = styled.div``

interface TableRowProps {
	$clickable?: boolean
}

const TableRow = styled.div<TableRowProps>`
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1.5fr 1fr;
	border-bottom: 1px solid ${props => props.theme.colors.border.lighter};
	transition: all 0.2s ease;

	${props =>
		props.$clickable &&
		`
		cursor: pointer;

		&:hover {
			background: ${props.theme.colors.background.secondary};
		}
	`}

	&:last-child {
		border-bottom: none;
	}
`

const TableCell = styled.div`
	padding: 16px 20px;
	display: flex;
	align-items: center;
`

const StudentTableInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`

const StudentTableIcon = styled.div`
	width: 32px;
	height: 32px;
	border-radius: 8px;
	background: ${props => props.theme.colors.primary[50]};
	color: ${props => props.theme.colors.primary[500]};
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
`

const StudentTableDetails = styled.div``

const StudentTableName = styled.div`
	font-size: 0.9rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: 2px;
`

const StudentTableEmail = styled.div`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
`

const SubmissionCountBadge = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 24px;
	background: ${props => props.theme.colors.primary[50]};
	color: ${props => props.theme.colors.primary[600]};
	border-radius: 12px;
	font-size: 0.8rem;
	font-weight: 600;
`

interface DateTextProps {
	$hasDate: boolean
}

const DateText = styled.span<DateTextProps>`
	color: ${props =>
		props.$hasDate ? props.theme.colors.text.secondary : props.theme.colors.text.tertiary};
	font-size: 0.85rem;
`

const ViewButton = styled.button`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 12px;
	background: ${props => props.theme.colors.primary[500]};
	color: white;
	border: none;
	border-radius: 6px;
	font-size: 0.8rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${props => props.theme.colors.primary[600]};
		transform: translateY(-1px);
	}
`

interface ChevronIconProps {
	$isHovered: boolean
}

const ChevronIcon = styled.div<ChevronIconProps>`
	color: ${props => props.theme.colors.text.tertiary};
	transition: all 0.2s ease;
	transform: ${props => (props.$isHovered ? 'translateX(4px)' : 'translateX(0)')};
	opacity: ${props => (props.$isHovered ? 1 : 0.6)};
`

export default StudentSelect
