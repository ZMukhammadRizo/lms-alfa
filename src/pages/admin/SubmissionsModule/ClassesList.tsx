import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiChevronRight, FiClipboard, FiSearch, FiUsers } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { PageTitle } from '../../../components/common'
import { Card, Input } from '../../../components/ui'
import { useAuth } from '../../../contexts/AuthContext'
import useSubmissionsStore from '../../../store/submissionsStore'

const ClassesList: React.FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [searchTerm, setSearchTerm] = useState('')
	const [hoveredCard, setHoveredCard] = useState<string | null>(null)
	const { user } = useAuth()
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Use the submissionsStore
	const classes = useSubmissionsStore(state => state.classes)
	const isLoadingClasses = useSubmissionsStore(state => state.isLoadingClasses)
	const fetchAdminClasses = useSubmissionsStore(state => state.fetchAdminClasses)

	useEffect(() => {
		const loadData = async () => {
			if (user?.id) {
				console.log('Admin ClassesList: Loading all classes')
				try {
					await fetchAdminClasses()
					console.log('Admin classes loaded:', classes)
				} catch (error) {
					console.error('Error loading admin classes:', error)
					setError('Failed to load classes')
				} finally {
					setLoading(false)
				}
			}
		}

		loadData()
	}, [user, fetchAdminClasses])

	useEffect(() => {
		setLoading(isLoadingClasses)
	}, [isLoadingClasses])

	// Filter classes based on search term
	const filteredClasses = classes.filter(
		classItem =>
			classItem.classname.toLowerCase().includes(searchTerm.toLowerCase()) ||
			classItem.levelName.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const handleClassClick = (classId: string) => {
		navigate(`/admin/submissions/classes/${classId}/students`)
	}

	if (loading) {
		return (
			<PageContainer>
				<LoadingMessage>{t('submissions.loadingClasses')}</LoadingMessage>
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
						<PageTitle>{t('submissions.allClasses')}</PageTitle>
						<SubTitle>{t('submissions.chooseClassToViewStudentSubmissions')}</SubTitle>
					</HeaderContent>
					<HeaderRight>
						<SearchWrapper>
							<StyledInput
								prefix={<FiSearch />}
								placeholder={t('submissions.searchClasses')}
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
							/>
						</SearchWrapper>
					</HeaderRight>
				</PageHeader>
			</PageHeaderWrapper>

			{filteredClasses.length === 0 ? (
				<EmptyStateContainer>
					<EmptyStateIcon>
						<FiUsers size={48} />
					</EmptyStateIcon>
					<EmptyStateTitle>
						{searchTerm ? t('submissions.noClassesMatchSearch') : t('submissions.noClassesFound')}
					</EmptyStateTitle>
					<EmptyStateText>
						{searchTerm
							? t('submissions.tryDifferentClassSearch')
							: t('submissions.noClassesAvailable')}
					</EmptyStateText>
				</EmptyStateContainer>
			) : (
				<>
					<ResultsHeader>
						<ResultsCount>
							{filteredClasses.length}{' '}
							{filteredClasses.length === 1 ? t('submissions.class') : t('submissions.classes')}
						</ResultsCount>
					</ResultsHeader>

					<ClassesGrid>
						{filteredClasses.map((classItem, index) => (
							<ClassCard
								key={classItem.classId}
								as={motion.div}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: index * 0.1 }}
								onMouseEnter={() => setHoveredCard(classItem.classId)}
								onMouseLeave={() => setHoveredCard(null)}
								onClick={() => handleClassClick(classItem.classId)}
							>
								<CardHeader>
									<ClassIcon>
										<FiUsers size={20} />
									</ClassIcon>
									<ClassInfo>
										<ClassName>{classItem.classname}</ClassName>
										<LevelName>{classItem.levelName}</LevelName>
									</ClassInfo>
									<ChevronIcon $isHovered={hoveredCard === classItem.classId}>
										<FiChevronRight size={18} />
									</ChevronIcon>
								</CardHeader>

								<CardBody>
									<StatsGrid>
										<StatItem>
											<StatIcon>
												<FiUsers size={16} />
											</StatIcon>
											<StatContent>
												<StatValue>{classItem.studentCount}</StatValue>
												<StatLabel>
													{classItem.studentCount === 1
														? t('submissions.student')
														: t('submissions.students')}
												</StatLabel>
											</StatContent>
										</StatItem>

										<StatItem>
											<StatIcon>
												<FiClipboard size={16} />
											</StatIcon>
											<StatContent>
												<StatValue>{classItem.submissionCount}</StatValue>
												<StatLabel>
													{classItem.submissionCount === 1
														? t('submissions.submission')
														: t('submissions.submissions')}
												</StatLabel>
											</StatContent>
										</StatItem>
									</StatsGrid>

									<ViewStudentsButton $isHovered={hoveredCard === classItem.classId}>
										{t('submissions.viewStudents')}
									</ViewStudentsButton>
								</CardBody>
							</ClassCard>
						))}
					</ClassesGrid>
				</>
			)}
		</PageContainer>
	)
}

// Styled Components (identical to teacher version)
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

const ClassesGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 24px;
`

const ClassCard = styled(Card)`
	cursor: pointer;
	transition: all 0.2s ease;
	border: 1px solid ${props => props.theme.colors.border.light};

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
		border-color: ${props => props.theme.colors.primary[200]};
	}
`

const CardHeader = styled.div`
	padding: 20px 24px 16px;
	border-bottom: 1px solid ${props => props.theme.colors.border.lighter};
	display: flex;
	align-items: center;
	gap: 12px;
`

const ClassIcon = styled.div`
	width: 40px;
	height: 40px;
	border-radius: 10px;
	background: ${props => props.theme.colors.primary[50]};
	color: ${props => props.theme.colors.primary[500]};
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
`

const ClassInfo = styled.div`
	flex: 1;
	min-width: 0;
`

const ClassName = styled.h3`
	margin: 0 0 4px;
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const LevelName = styled.div`
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};
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
	padding: 20px 24px 24px;
`

const StatsGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20px;
	margin-bottom: 24px;
`

const StatItem = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`

const StatIcon = styled.div`
	width: 32px;
	height: 32px;
	border-radius: 8px;
	background: ${props => props.theme.colors.background.secondary};
	color: ${props => props.theme.colors.text.secondary};
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
`

const StatContent = styled.div`
	flex: 1;
`

const StatValue = styled.div`
	font-size: 1.25rem;
	font-weight: 700;
	color: ${props => props.theme.colors.text.primary};
	line-height: 1.2;
`

const StatLabel = styled.div`
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};
	line-height: 1.2;
`

interface ViewStudentsButtonProps {
	$isHovered: boolean
}

const ViewStudentsButton = styled.div<ViewStudentsButtonProps>`
	text-align: center;
	padding: 12px 16px;
	background: ${props =>
		props.$isHovered ? props.theme.colors.primary[500] : props.theme.colors.background.secondary};
	color: ${props => (props.$isHovered ? 'white' : props.theme.colors.text.secondary)};
	border-radius: 8px;
	font-size: 0.9rem;
	font-weight: 500;
	transition: all 0.2s ease;
`

export default ClassesList
