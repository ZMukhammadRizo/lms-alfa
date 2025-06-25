import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiChevronRight, FiFileText, FiSearch, FiUsers } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { PageTitle } from '../../../components/common'
import { Card, Container, Input } from '../../../components/ui'
import useSubmissionsStore from '../../../store/submissionsStore'

const ClassSelect: React.FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { levelId } = useParams<{ levelId: string }>()
	const [searchTerm, setSearchTerm] = useState('')
	const [hoveredCard, setHoveredCard] = useState<string | null>(null)

	const { classes, levels, isLoadingClasses, classesError, fetchTeacherLevelClasses } =
		useSubmissionsStore()

	// Fetch classes for the selected level
	useEffect(() => {
		if (levelId) {
			fetchTeacherLevelClasses(levelId)
		}
	}, [levelId, fetchTeacherLevelClasses])

	// Filter classes based on search term
	const filteredClasses = classes.filter(
		classItem =>
			classItem.classname.toLowerCase().includes(searchTerm.toLowerCase()) ||
			classItem.levelName.toLowerCase().includes(searchTerm.toLowerCase())
	)

	// Handle card click - navigate to student selection
	const handleClassClick = (classId: string) => {
		navigate(`/teacher/submissions/levels/${levelId}/classes/${classId}/students`)
	}

	// Get the current level name
	const currentLevel = levels.find(level => level.levelId === levelId)
	const levelName = currentLevel ? currentLevel.levelName : levelId

	// Animation variants
	const containerVariants = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: {
				staggerChildren: 0.08,
			},
		},
	}

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
	}

	if (isLoadingClasses) {
		return (
			<PageContainer>
				<LoadingMessage>{t('submissions.loadingClasses')}</LoadingMessage>
			</PageContainer>
		)
	}

	if (classesError) {
		return (
			<PageContainer>
				<ErrorMessage>{classesError}</ErrorMessage>
			</PageContainer>
		)
	}

	return (
		<PageContainer>
			<PageHeaderWrapper>
				<PageHeader>
					<HeaderContent>
						<PageTitle>{t('submissions.classesForGrade', { grade: levelName })}</PageTitle>
						<SubTitle>{t('submissions.selectClassToViewSubmissions')}</SubTitle>
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

			<ContentContainer>
				<ClassGrid as={motion.div} variants={containerVariants} initial='hidden' animate='show'>
					{filteredClasses.length > 0 ? (
						filteredClasses.map(classItem => (
							<ClassCard
								key={classItem.classId}
								as={motion.div}
								variants={itemVariants}
								whileHover={{ scale: 1.02, y: -5 }}
								onHoverStart={() => setHoveredCard(classItem.classId)}
								onHoverEnd={() => setHoveredCard(null)}
								onClick={() => handleClassClick(classItem.classId)}
								$isHovered={hoveredCard === classItem.classId}
							>
								<CardHeader>
									<ClassIcon>
										<FiUsers />
									</ClassIcon>
									<ClassName>{classItem.classname}</ClassName>
								</CardHeader>
								<CardContent>
									<MetricRow>
										<Metric>
											<MetricIcon>
												<FiUsers />
											</MetricIcon>
											<MetricContent>
												<MetricValue>{classItem.studentCount}</MetricValue>
												<MetricLabel>{t('submissions.students')}</MetricLabel>
											</MetricContent>
										</Metric>
										<Metric>
											<MetricIcon>
												<FiFileText />
											</MetricIcon>
											<MetricContent>
												<MetricValue>{classItem.submissionCount}</MetricValue>
												<MetricLabel>{t('submissions.submissions')}</MetricLabel>
											</MetricContent>
										</Metric>
									</MetricRow>
									<CardArrow $isHovered={hoveredCard === classItem.classId}>
										<span>{t('submissions.viewStudents')}</span>
										<FiChevronRight />
									</CardArrow>
								</CardContent>
							</ClassCard>
						))
					) : (
						<NoResults>
							{classes.length === 0
								? t('submissions.noClassesFoundForLevel')
								: t('submissions.noClassesFoundMatching', { searchTerm })}
						</NoResults>
					)}
				</ClassGrid>
			</ContentContainer>
		</PageContainer>
	)
}

// Styled Components
const PageContainer = styled(Container)`
	max-width: 1200px;
	padding: 0;
`

const PageHeaderWrapper = styled.div`
	background: ${props => props.theme.colors.background.secondary};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	padding: 0 24px;
	margin-bottom: 24px;
`

const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 32px 0;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
		gap: 24px;
	}
`

const HeaderContent = styled.div`
	max-width: 600px;

	h1 {
		margin-bottom: 8px;
		font-size: 2.2rem;
		color: ${props => props.theme.colors.text.primary};
		line-height: 1.2;
	}
`

const HeaderRight = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	min-width: 300px;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		width: 100%;
	}
`

const ContentContainer = styled.div`
	padding: 0 24px 48px;
`

const SubTitle = styled.p`
	color: ${props => props.theme.colors.text.secondary};
	margin: 8px 0 0;
	font-size: 1.1rem;
	font-weight: 300;
`

const SearchWrapper = styled.div`
	width: 100%;
`

const StyledInput = styled(Input)`
	width: 100%;
	font-size: 1rem;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

	&:focus-within {
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
	}
`

const ClassGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 24px;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		grid-template-columns: 1fr;
	}
`

interface CardProps {
	$isHovered?: boolean
}

const ClassCard = styled(Card)<CardProps>`
	padding: 0;
	overflow: hidden;
	cursor: pointer;
	transition: all 0.3s ease-in-out;
	border-radius: 16px;
	border: 1px solid
		${props =>
			props.$isHovered ? props.theme.colors.primary[300] : props.theme.colors.border.light};
	box-shadow: ${props =>
		props.$isHovered
			? `0 16px 32px ${props.theme.colors.primary[100]}`
			: '0 4px 12px rgba(0, 0, 0, 0.06)'};
	display: flex;
	flex-direction: column;
	background: ${props => props.theme.colors.background.secondary};
`

const CardHeader = styled.div`
	padding: 24px;
	background: ${props => props.theme.colors.primary[props.theme.mode === 'dark' ? 800 : 50]};
	display: flex;
	align-items: center;
	gap: 16px;
`

const ClassIcon = styled.div`
	background: ${props => props.theme.colors.primary[500]};
	color: white;
	width: 44px;
	height: 44px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.5rem;
`

const ClassName = styled.h3`
	font-size: 1.5rem;
	font-weight: 600;
	margin: 0;
	color: ${props => props.theme.colors.text.primary};
`

const CardContent = styled.div`
	padding: 20px;
	display: flex;
	flex-direction: column;
	flex: 1;
`

const MetricRow = styled.div`
	display: flex;
	justify-content: space-between;
	gap: 16px;
	margin-bottom: 20px;
`

const Metric = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 8px;
`

const MetricIcon = styled.div`
	font-size: 1.2rem;
	color: ${props => props.theme.colors.primary[500]};
	margin-bottom: 4px;
`

const MetricContent = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
`

const MetricValue = styled.div`
	font-size: 1.5rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const MetricLabel = styled.div`
	font-size: 0.85rem;
	color: ${props => props.theme.colors.text.secondary};
`

const CardArrow = styled.div<{ $isHovered?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	margin-top: auto;
	color: ${props =>
		props.$isHovered ? props.theme.colors.primary[600] : props.theme.colors.text.tertiary};
	font-size: 0.9rem;
	transition: all 0.3s ease;
	font-weight: 500;

	span {
		transform: translateX(${props => (props.$isHovered ? '4px' : '0')});
		opacity: ${props => (props.$isHovered ? 1 : 0.7)};
		transition: all 0.3s ease;
	}

	svg {
		transition: all 0.3s ease;
		transform: translateX(${props => (props.$isHovered ? '4px' : '0')});
	}
`

const NoResults = styled.div`
	grid-column: 1 / -1;
	text-align: center;
	padding: 48px 0;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 1.1rem;
`

const LoadingMessage = styled.div`
	text-align: center;
	padding: 48px 0;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 1.1rem;
`

const ErrorMessage = styled.div`
	text-align: center;
	padding: 48px 0;
	color: ${props => props.theme.colors.danger[500]};
	font-size: 1.1rem;
`

export default ClassSelect
