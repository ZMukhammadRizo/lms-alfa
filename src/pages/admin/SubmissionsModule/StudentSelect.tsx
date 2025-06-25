import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	FiAward,
	FiCalendar,
	FiChevronRight,
	FiClipboard,
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
import { formatSubmissionDate } from '../../../services/submissionsService'
import useSubmissionsStore from '../../../store/submissionsStore'

type ViewMode = 'grid' | 'table'

const StudentSelect: React.FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { levelId, classId } = useParams<{ levelId?: string; classId: string }>()
	const [searchTerm, setSearchTerm] = useState('')
	const [viewMode, setViewMode] = useState<ViewMode>('grid')
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
				console.log('StudentSelect: Loading students for class:', classId)
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
			navigate(`/admin/submissions/levels/${levelId}/classes/${classId}/students/${studentId}`)
		} else {
			navigate(`/admin/submissions/classes/${classId}/students/${studentId}`)
		}
	}

	const formatAverageGrade = (grade: number | null): string => {
		if (grade === null) return t('submissions.noGrades')
		return `${grade}/10`
	}

	const formatLastSubmission = (date: string | null): string => {
		if (!date) return t('submissions.noSubmissions')
		return formatSubmissionDate(date)
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

	const renderGridView = () => (
		<StudentsGrid>
			{filteredStudents.map((student, index) => (
				<StudentCard
					key={student.studentId}
					as={motion.div}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: index * 0.05 }}
					onMouseEnter={() => setHoveredCard(student.studentId)}
					onMouseLeave={() => setHoveredCard(null)}
					onClick={() => handleStudentClick(student.studentId)}
				>
					<CardHeader>
						<StudentAvatar>
							<FiUser size={18} />
						</StudentAvatar>
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
									<FiClipboard size={14} />
								</StatIcon>
								<StatContent>
									<StatValue>{student.submissionCount}</StatValue>
									<StatLabel>{t('submissions.submissions')}</StatLabel>
								</StatContent>
							</StatItem>

							<StatItem>
								<StatIcon>
									<FiAward size={14} />
								</StatIcon>
								<StatContent>
									<StatValue>{formatAverageGrade(student.averageGrade)}</StatValue>
									<StatLabel>{t('submissions.avgGrade')}</StatLabel>
								</StatContent>
							</StatItem>
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
	)

	const renderTableView = () => (
		<TableContainer>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHeaderCell>{t('submissions.student')}</TableHeaderCell>
						<TableHeaderCell>{t('submissions.email')}</TableHeaderCell>
						<TableHeaderCell>{t('submissions.submissionCount')}</TableHeaderCell>
						<TableHeaderCell>{t('submissions.averageGrade')}</TableHeaderCell>
						<TableHeaderCell>{t('submissions.lastSubmission')}</TableHeaderCell>
						<TableHeaderCell>{t('submissions.actions')}</TableHeaderCell>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredStudents.map((student, index) => (
						<TableRow
							key={student.studentId}
							as={motion.tr}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3, delay: index * 0.05 }}
							$clickable
							onClick={() => handleStudentClick(student.studentId)}
						>
							<TableCell>
								<StudentTableInfo>
									<StudentAvatar>
										<FiUser size={16} />
									</StudentAvatar>
									<span>{student.fullName}</span>
								</StudentTableInfo>
							</TableCell>
							<TableCell>
								<EmailText>{student.email}</EmailText>
							</TableCell>
							<TableCell>
								<SubmissionCountBadge>{student.submissionCount}</SubmissionCountBadge>
							</TableCell>
							<TableCell>
								<GradeBadge $hasGrade={student.averageGrade !== null}>
									{formatAverageGrade(student.averageGrade)}
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
			</Table>
		</TableContainer>
	)

	return (
		<PageContainer>
			<PageHeaderWrapper>
				<PageHeader>
					<HeaderContent>
						<PageTitle>{t('submissions.classStudents')}</PageTitle>
						<SubTitle>{t('submissions.selectStudentToViewSubmissions')}</SubTitle>
					</HeaderContent>
					<HeaderRight>
						<ViewModeToggle>
							<ViewModeButton
								$isActive={viewMode === 'grid'}
								onClick={() => setViewMode('grid')}
								title={t('submissions.gridView')}
							>
								<FiGrid size={18} />
							</ViewModeButton>
							<ViewModeButton
								$isActive={viewMode === 'table'}
								onClick={() => setViewMode('table')}
								title={t('submissions.tableView')}
							>
								<FiList size={18} />
							</ViewModeButton>
						</ViewModeToggle>
						<SearchWrapper>
							<StyledInput
								prefix={<FiSearch />}
								placeholder={t('submissions.searchStudents')}
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
							/>
						</SearchWrapper>
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

					{viewMode === 'grid' ? renderGridView() : renderTableView()}
				</>
			)}
		</PageContainer>
	)
}

// Styled Components
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

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: stretch;
	}
`

const ViewModeToggle = styled.div`
	display: flex;
	background: ${props => props.theme.colors.background.secondary};
	border-radius: 8px;
	padding: 4px;
`

interface ViewModeButtonProps {
	$isActive: boolean
}

const ViewModeButton = styled.button<ViewModeButtonProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px 12px;
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

// Grid View Styles
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

const StudentAvatar = styled.div`
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

const StudentName = styled.h4`
	margin: 0 0 4px;
	font-size: 1.1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const StudentEmail = styled.div`
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

interface ChevronIconProps {
	$isHovered: boolean
}

const ChevronIcon = styled.div<ChevronIconProps>`
	color: ${props => props.theme.colors.text.tertiary};
	transition: all 0.2s ease;
	transform: translateX(${props => (props.$isHovered ? '4px' : '0')});
`

const CardBody = styled.div`
	padding: 16px 20px;
`

const StatsRow = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
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

const StatContent = styled.div`
	flex: 1;
	min-width: 0;
`

const StatValue = styled.div`
	font-size: 1.1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	line-height: 1.2;
`

const StatLabel = styled.div`
	font-size: 0.75rem;
	color: ${props => props.theme.colors.text.secondary};
	line-height: 1.2;
`

const LastSubmissionInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: 16px;
	padding: 8px 12px;
	background: ${props => props.theme.colors.background.lighter};
	border-radius: 6px;
`

interface ViewSubmissionsButtonProps {
	$isHovered: boolean
}

const ViewSubmissionsButton = styled.div<ViewSubmissionsButtonProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 10px 16px;
	background: ${props =>
		props.$isHovered ? props.theme.colors.primary[500] : props.theme.colors.background.secondary};
	color: ${props => (props.$isHovered ? 'white' : props.theme.colors.text.secondary)};
	border-radius: 6px;
	font-size: 0.9rem;
	font-weight: 500;
	transition: all 0.2s ease;
`

// Table View Styles
const TableContainer = styled.div`
	background: white;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
`

const TableHeader = styled.thead`
	background: ${props => props.theme.colors.background.secondary};
`

const TableHeaderCell = styled.th`
	padding: 16px 20px;
	text-align: left;
	font-size: 0.85rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.secondary};
	text-transform: uppercase;
	letter-spacing: 0.5px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const TableBody = styled.tbody``

interface TableRowProps {
	$clickable?: boolean
}

const TableRow = styled.tr<TableRowProps>`
	border-bottom: 1px solid ${props => props.theme.colors.border.lighter};
	transition: all 0.2s ease;

	${props =>
		props.$clickable &&
		`
		cursor: pointer;

		&:hover {
			background: ${props.theme.colors.background.lighter};
		}
	`}

	&:last-child {
		border-bottom: none;
	}
`

const TableCell = styled.td`
	padding: 16px 20px;
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.primary};
	vertical-align: middle;
`

const StudentTableInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`

const EmailText = styled.span`
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.85rem;
`

const SubmissionCountBadge = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 32px;
	height: 24px;
	padding: 0 8px;
	background: ${props => props.theme.colors.primary[50]};
	color: ${props => props.theme.colors.primary[600]};
	border-radius: 12px;
	font-size: 0.8rem;
	font-weight: 600;
`

interface GradeBadgeProps {
	$hasGrade: boolean
}

const GradeBadge = styled.span<GradeBadgeProps>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 48px;
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
	padding: 6px 12px;
	background: ${props => props.theme.colors.primary[50]};
	color: ${props => props.theme.colors.primary[600]};
	border: 1px solid ${props => props.theme.colors.primary[200]};
	border-radius: 6px;
	font-size: 0.8rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${props => props.theme.colors.primary[100]};
		border-color: ${props => props.theme.colors.primary[300]};
	}
`

export default StudentSelect
