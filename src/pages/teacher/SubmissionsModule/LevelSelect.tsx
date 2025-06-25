import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiBookOpen, FiChevronRight, FiFileText, FiSearch, FiUsers } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { PageTitle } from '../../../components/common'
import { Card, Container, Input } from '../../../components/ui'
import useSubmissionsStore from '../../../store/submissionsStore'

const LevelSelect: React.FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [searchTerm, setSearchTerm] = useState('')
	const [hoveredCard, setHoveredCard] = useState<string | null>(null)

	const { levels, isLoadingLevels, levelsError, fetchTeacherLevels } = useSubmissionsStore()

	// Fetch levels on component mount
	useEffect(() => {
		fetchTeacherLevels()
	}, [fetchTeacherLevels])

	// Filter levels based on search term
	const filteredLevels = levels.filter(level =>
		level.levelName.toLowerCase().includes(searchTerm.toLowerCase())
	)

	// Handle card click - navigate to class selection
	const handleLevelClick = (levelId: string) => {
		navigate(`/teacher/submissions/levels/${levelId}/classes`)
	}

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

	if (isLoadingLevels) {
		return (
			<PageContainer>
				<LoadingMessage>{t('submissions.loadingLevels')}</LoadingMessage>
			</PageContainer>
		)
	}

	if (levelsError) {
		return (
			<PageContainer>
				<ErrorMessage>{levelsError}</ErrorMessage>
			</PageContainer>
		)
	}

	return (
		<PageContainer>
			<PageHeaderWrapper>
				<PageHeader>
					<HeaderContent>
						<PageTitle>{t('submissions.title')}</PageTitle>
						<SubTitle>{t('submissions.selectGradeLevel')}</SubTitle>
					</HeaderContent>
					<HeaderRight>
						<SearchWrapper>
							<StyledInput
								prefix={<FiSearch />}
								placeholder={t('submissions.searchGradeLevels')}
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
							/>
						</SearchWrapper>
					</HeaderRight>
				</PageHeader>
			</PageHeaderWrapper>

			<ContentContainer>
				<LevelGrid
					as={motion.div}
					variants={containerVariants}
					initial='hidden'
					animate='show'
				>
					{filteredLevels.length > 0 ? (
						filteredLevels.map(level => (
							<LevelCard
								key={level.levelId}
								as={motion.div}
								variants={itemVariants}
								whileHover={{ scale: 1.02, y: -5 }}
								onHoverStart={() => setHoveredCard(level.levelId)}
								onHoverEnd={() => setHoveredCard(null)}
								onClick={() => handleLevelClick(level.levelId)}
								$isHovered={hoveredCard === level.levelId}
							>
								<CardTop $gradelevel={parseInt(level.levelName, 10) || 1}>
									<LevelIcon>
										<FiBookOpen />
									</LevelIcon>
									<LevelName>
										{level.levelName}th {t('submissions.grade')}
									</LevelName>
								</CardTop>
								<CardContent>
									<MetricRow>
										<Metric>
											<MetricIcon>
												<FiUsers />
											</MetricIcon>
											<MetricContent>
												<MetricValue>{level.studentCount}</MetricValue>
												<MetricLabel>{t('submissions.students')}</MetricLabel>
											</MetricContent>
										</Metric>
										<Metric>
											<MetricIcon>
												<FiBookOpen />
											</MetricIcon>
											<MetricContent>
												<MetricValue>{level.classCount}</MetricValue>
												<MetricLabel>{t('submissions.classes')}</MetricLabel>
											</MetricContent>
										</Metric>
										<Metric>
											<MetricIcon>
												<FiFileText />
											</MetricIcon>
											<MetricContent>
												<MetricValue>-</MetricValue>
												<MetricLabel>{t('submissions.submissions')}</MetricLabel>
											</MetricContent>
										</Metric>
									</MetricRow>
									<ViewButton $isHovered={hoveredCard === level.levelId}>
										<ViewButtonText>{t('submissions.viewSubmissions')}</ViewButtonText>
										<ViewButtonIcon>
											<FiChevronRight />
										</ViewButtonIcon>
									</ViewButton>
								</CardContent>
							</LevelCard>
						))
					) : (
						<EmptyState>
							<EmptyStateMessage>
								{searchTerm
									? t('submissions.noGradeLevelsFound')
									: t('submissions.noGradeLevelsAvailable')}
							</EmptyStateMessage>
						</EmptyState>
					)}
				</LevelGrid>
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

const LevelGrid = styled.div`
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

const LevelCard = styled(Card)<CardProps>`
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

const CardTop = styled.div<{ $gradelevel: number }>`
	background: ${props => {
		const hue = (props.$gradelevel * 30) % 360
		return `linear-gradient(135deg,
      ${props.theme.mode === 'dark' ? `hsl(${hue}, 80%, 25%)` : `hsl(${hue}, 85%, 65%)`},
      ${props.theme.mode === 'dark' ? `hsl(${hue}, 70%, 35%)` : `hsl(${hue}, 75%, 75%)`})`
	}};
	padding: 24px;
	display: flex;
	align-items: center;
	gap: 16px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

const LevelIcon = styled.div`
	background: rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	width: 44px;
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

	svg {
		color: white;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
		font-size: 22px;
	}
`

const LevelName = styled.h3`
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: white;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
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
	align-items: center;
	gap: 16px;
	margin-bottom: 20px;
`

const Metric = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	flex: 1;
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
	text-align: center;
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

const ViewButton = styled.div<{ $isHovered?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	margin-top: auto;
	color: ${props => props.theme.colors.primary[600]};
	font-size: 0.9rem;
	transition: all 0.3s ease;
	font-weight: 500;
`

const ViewButtonText = styled.span<{ $isHovered?: boolean }>`
	transform: translateX(${props => (props.$isHovered ? '4px' : '0')});
	opacity: ${props => (props.$isHovered ? 1 : 0.7)};
	transition: all 0.3s ease;
`

const ViewButtonIcon = styled.div<{ $isHovered?: boolean }>`
	transition: all 0.3s ease;
	transform: translateX(${props => (props.$isHovered ? '4px' : '0')});
`

const EmptyState = styled.div`
	grid-column: 1 / -1;
	text-align: center;
	padding: 48px 0;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 1.1rem;
`

const EmptyStateMessage = styled.div`
	color: ${props => props.theme.colors.text.secondary};
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

export default LevelSelect
