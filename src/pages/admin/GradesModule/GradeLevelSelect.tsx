import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiAward, FiBarChart2, FiBookOpen, FiChevronRight, FiSearch, FiUsers, FiAlertCircle } from 'react-icons/fi'
import { Card, Container, Input } from '../../../components/ui'
import { PageTitle } from '../../../components/common'
import { getGradeLevelSummaries, GradeLevelSummary } from '../../../api/grades'

const GradeLevelSelect: React.FC = () => {
	const navigate = useNavigate()
	const [searchTerm, setSearchTerm] = useState('')
	const [gradeSummaries, setGradeSummaries] = useState<GradeLevelSummary[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [hoveredCard, setHoveredCard] = useState<number | null>(null)

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const summaries = await getGradeLevelSummaries()
				setGradeSummaries(summaries)
			} catch (err) {
				console.error('Failed to fetch grade summaries:', err)
				setError('Could not load grade level data. Please try again later.')
			} finally {
				setIsLoading(false)
			}
		}
		fetchData()
	}, [])

	const filteredGradeLevels = gradeSummaries.filter(level =>
		level.name.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const handleGradeLevelClick = (gradeLevelId: number) => {
		navigate(`/admin/grades/levels/${gradeLevelId}/classes`)
	}

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

	return (
		<PageContainer>
			<PageHeaderWrapper>
				<PageHeader>
					<HeaderContent>
						<PageTitle>Kundalik</PageTitle>
						<SubTitle>Select a grade level to view and manage student grades</SubTitle>
					</HeaderContent>
					<HeaderRight>
						<SearchWrapper>
							<StyledInput
								prefix={<FiSearch />}
								placeholder='Search grade levels...'
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
							/>
						</SearchWrapper>
					</HeaderRight>
				</PageHeader>
			</PageHeaderWrapper>

			<ContentContainer>
				{isLoading ? (
					<SkeletonGrid>
						{[...Array(6)].map((_, index) => (
							<SkeletonCard key={index} />
						))}
					</SkeletonGrid>
				) : error ? (
					<ErrorDisplay>
						<FiAlertCircle size={32} />
						<p>{error}</p>
					</ErrorDisplay>
				) : (
					<GradeLevelGrid
						as={motion.div}
						variants={containerVariants}
						initial='hidden'
						animate='show'
					>
						{filteredGradeLevels.length > 0 ? (
							filteredGradeLevels.map((level, index) => (
								<GradeLevelCard
									key={level.id}
									as={motion.div}
									variants={itemVariants}
									whileHover={{ y: -3, boxShadow: '0 8px 15px rgba(0, 0, 0, 0.08)' }}
									onHoverStart={() => setHoveredCard(level.id)}
									onHoverEnd={() => setHoveredCard(null)}
									onClick={() => handleGradeLevelClick(level.id)}
									$isHovered={hoveredCard === level.id}
									$colorIndex={index}
								>
									<CardTop $colorIndex={index}>
										<GradeLevelIcon>
											<FiBookOpen />
										</GradeLevelIcon>
										<GradeLevelName>{level.name}</GradeLevelName>
									</CardTop>
									<CardContent>
										<GradeMetricRow>
											<GradeMetric>
												<GradeMetricIcon>
													<FiUsers />
												</GradeMetricIcon>
												<GradeMetricContent>
													<GradeMetricValue>{level.studentCount}</GradeMetricValue>
													<GradeMetricLabel>Students</GradeMetricLabel>
												</GradeMetricContent>
											</GradeMetric>
											<GradeMetric>
												<GradeMetricIcon>
													<FiAward />
												</GradeMetricIcon>
												<GradeMetricContent>
													<GradeMetricValue>{level.classCount}</GradeMetricValue>
													<GradeMetricLabel>Classes</GradeMetricLabel>
												</GradeMetricContent>
											</GradeMetric>
											<GradeMetric>
												<GradeMetricIcon>
													<FiBarChart2 />
												</GradeMetricIcon>
												<GradeMetricContent>
													<GradeMetricValue>{level.subjectCount}</GradeMetricValue>
													<GradeMetricLabel>Subjects</GradeMetricLabel>
												</GradeMetricContent>
											</GradeMetric>
										</GradeMetricRow>
										<CardArrow>
											<FiChevronRight />
											<span>View Classes</span>
										</CardArrow>
									</CardContent>
								</GradeLevelCard>
							))
						) : (
							<NoResults>
								{gradeSummaries.length === 0
									? 'No grade levels found.'
									: `No grade levels found matching "${searchTerm}"`}
							</NoResults>
						)}
					</GradeLevelGrid>
				)}
			</ContentContainer>
		</PageContainer>
	)
}

const PageContainer = styled(Container)`
	max-width: 100%;
	padding: 0;
	background-color: ${props => props.theme.colors.background.primary};
	min-height: calc(100vh - 60px);
`

const PageHeaderWrapper = styled.div`
	background: ${props => props.theme.colors.background.secondary};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	padding: 0 48px;
	margin-bottom: 0;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding: 0 24px;
	}
`

const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24px 0;
	max-width: 1200px;
	margin: 0 auto;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
	}
`

const HeaderContent = styled.div`
	max-width: 600px;

	h1 {
		margin-bottom: 4px;
		font-size: 2rem;
		color: ${props => props.theme.colors.text.primary};
		font-weight: 700;
		line-height: 1.2;
	}
`

const HeaderRight = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	min-width: 350px;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		width: 100%;
		min-width: auto;
		margin-top: 16px;
	}
`

const ContentContainer = styled.div`
	padding: 32px 48px 48px;
	max-width: 1200px;
	margin: 0 auto;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding: 24px;
	}
`

const SubTitle = styled.p`
	color: ${props => props.theme.colors.text.secondary};
	margin: 0;
	font-size: 1rem;
	font-weight: 400;
`

const SearchWrapper = styled.div`
	width: 350px;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		width: 100%;
	}
`

const StyledInput = styled(Input)`
	width: 100%;
	font-size: 0.9rem;
	border-radius: ${props => props.theme.borderRadius.md};
	background-color: ${props => props.theme.colors.background.primary};

	input {
		padding-left: 36px;
	}
`

const GradeLevelGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 24px;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		grid-template-columns: 1fr;
		gap: 16px;
	}
`

const cardColors = [
	{ background: '#e0f2fe', text: '#0ea5e9', iconBg: 'rgba(14, 165, 233, 0.1)' },
	{ background: '#fef3c7', text: '#d97706', iconBg: 'rgba(217, 119, 6, 0.1)' }
]

interface CardStyleProps {
	$colorIndex: number;
	$isHovered?: boolean;
}

const GradeLevelCard = styled(Card)<CardStyleProps>`
	border-radius: ${props => props.theme.borderRadius.lg};
	overflow: hidden;
	cursor: pointer;
	transition: all 0.2s ease-in-out;
	border: none;
	background-color: ${props => cardColors[props.$colorIndex % cardColors.length].background};
	box-shadow: ${props => props.theme.shadows.sm};
	display: flex;
	flex-direction: column;

	&:hover {
		transform: translateY(-3px);
		box-shadow: ${props => props.theme.shadows.md};
	}
`

const CardTop = styled.div<{$colorIndex: number}>`
	padding: 16px 20px;
	display: flex;
	align-items: center;
	gap: 12px;
	border-bottom: 1px solid ${props => props.$colorIndex === 0 ? 'rgba(14, 165, 233, 0.2)' : 'rgba(217, 119, 6, 0.2)'};
`

const GradeLevelIcon = styled.div`
	font-size: 1.2rem;
	color: ${props => props.theme.colors.text.secondary};
`

const GradeLevelName = styled.h3`
	margin: 0;
	font-size: 1.1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const CardContent = styled.div`
	padding: 20px;
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
`

const GradeMetricRow = styled.div`
	display: flex;
	justify-content: space-around;
	align-items: flex-start;
	margin-bottom: 24px;
	gap: 16px;
`

const GradeMetric = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	flex: 1;
`

const GradeMetricIcon = styled.div<{$colorIndex?: number}>`
	font-size: 1.3rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: 8px;
`

const GradeMetricContent = styled.div``;

const GradeMetricValue = styled.div`
	font-size: 1.5rem;
	font-weight: 700;
	color: ${props => props.theme.colors.text.primary};
	line-height: 1.2;
`

const GradeMetricLabel = styled.div`
	font-size: 0.75rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-top: 2px;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`

const CardArrow = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	font-size: 0.85rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.secondary};
	margin-top: auto;
	padding-top: 16px;

	svg {
		margin-left: 4px;
		transition: transform 0.2s ease;
	}

	${GradeLevelCard}:hover & {
		color: ${props => props.theme.colors.primary[600]};
		svg {
			transform: translateX(3px);
		}
	}
`

const NoResults = styled.div`
	grid-column: 1 / -1;
	text-align: center;
	padding: 48px;
	color: ${props => props.theme.colors.text.secondary};
`

const SkeletonGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 24px;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		grid-template-columns: 1fr;
		gap: 16px;
	}
`

const SkeletonBase = styled.div<{ width?: string; height?: string; $radius?: string }>`
	background-color: ${props => props.theme.colors.background.tertiary};
	border-radius: ${props => props.$radius || props.theme.borderRadius.sm};
	animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	width: ${props => props.width || '100%'};
	height: ${props => props.height || '20px'};

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}
`

const SkeletonCard = () => (
	<GradeLevelCard $colorIndex={0} style={{ backgroundColor: '#f1f5f9', cursor: 'default' }}>
		<CardTop style={{ borderBottomColor: 'rgba(0,0,0,0.05)' }}>
			<SkeletonBase width="24px" height="20px" />
			<SkeletonBase width="100px" height="20px" />
		</CardTop>
		<CardContent>
			<GradeMetricRow>
				<GradeMetric>
					<SkeletonBase width="24px" height="20px" style={{ marginBottom: '8px' }} />
					<SkeletonBase width="40px" height="24px" />
					<SkeletonBase width="60px" height="12px" style={{ marginTop: '4px' }} />
				</GradeMetric>
				<GradeMetric>
					<SkeletonBase width="24px" height="20px" style={{ marginBottom: '8px' }} />
					<SkeletonBase width="40px" height="24px" />
					<SkeletonBase width="60px" height="12px" style={{ marginTop: '4px' }} />
				</GradeMetric>
				<GradeMetric>
					<SkeletonBase width="24px" height="20px" style={{ marginBottom: '8px' }} />
					<SkeletonBase width="40px" height="24px" />
					<SkeletonBase width="60px" height="12px" style={{ marginTop: '4px' }} />
				</GradeMetric>
			</GradeMetricRow>
			<CardArrow>
				<SkeletonBase width="100px" height="16px" />
			</CardArrow>
		</CardContent>
	</GradeLevelCard>
)

const ErrorDisplay = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px;
	text-align: center;
	color: ${props => props.theme.colors.danger[700]};
	background-color: ${props => props.theme.colors.danger[50]};
	border: 1px solid ${props => props.theme.colors.danger[200]};
	border-radius: ${props => props.theme.borderRadius.lg};
	grid-column: 1 / -1;

	svg {
		margin-bottom: 16px;
		color: ${props => props.theme.colors.danger[500]};
	}

	p {
		margin: 0;
		font-size: 1rem;
		font-weight: 500;
	}
`

export default GradeLevelSelect
