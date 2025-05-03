import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FiAward, FiBarChart2, FiBookOpen, FiChevronRight, FiSearch, FiUsers } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { PageTitle } from '../../../components/common'
import { Card, Container, Input } from '../../../components/ui'
import { useAuth } from '../../../contexts/AuthContext'
import useGradesStore from '../../../store/gradesStore'
import { CardProps } from '../../../types/grades'

const GradeLevelSelect: React.FC = () => {
	const navigate = useNavigate()
	const [searchTerm, setSearchTerm] = useState('')
	const [hoveredCard, setHoveredCard] = useState<string | null>(null)
	const { user } = useAuth()
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [initialized, setInitialized] = useState(false)

	// Use the gradesStore instead of direct service calls
	const gradeLevels = useGradesStore(state => state.levels)
	const isLoadingLevels = useGradesStore(state => state.isLoadingLevels)
	const fetchAllLevels = useGradesStore(state => state.fetchAllLevels)

	useEffect(() => {
		const fetchGradeLevels = async () => {
			if (initialized) return

			try {
				setLoading(true)
				await fetchAllLevels()
				setInitialized(true)
			} catch (err) {
				console.error('Error fetching grade levels:', err)
				setError('Failed to load grade levels. Please try again later.')
			} finally {
				setLoading(false)
			}
		}

		fetchGradeLevels()
	}, [fetchAllLevels, initialized])

	// Filter grade levels based on search term
	const filteredGradeLevels = gradeLevels.filter(level =>
		level.levelName.toLowerCase().includes(searchTerm.toLowerCase())
	)

	// Handle card click - navigate to class selection
	const handleGradeLevelClick = (levelId: string) => {
		navigate(`/admin/grades/levels/${levelId}/classes`)
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

	if (loading || isLoadingLevels) {
		return (
			<PageContainer>
				<LoadingMessage>Loading grade levels...</LoadingMessage>
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
						<PageTitle>Grade Management</PageTitle>
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
				<GradeLevelGrid
					as={motion.div}
					variants={containerVariants}
					initial='hidden'
					animate='show'
				>
					{filteredGradeLevels.length > 0 ? (
						filteredGradeLevels.map(level => (
							<GradeLevelCard
								key={level.levelId}
								as={motion.div}
								variants={itemVariants}
								whileHover={{ scale: 1.02, y: -5 }}
								onHoverStart={() => setHoveredCard(level.levelId)}
								onHoverEnd={() => setHoveredCard(null)}
								onClick={() => handleGradeLevelClick(level.levelId)}
								$isHovered={hoveredCard === level.levelId}
							>
								<CardTop $gradelevel={parseInt(level.levelName, 10) || 1}>
									<GradeLevelIcon>
										<FiBookOpen />
									</GradeLevelIcon>
									<GradeLevelName>{level.levelName}th Grade</GradeLevelName>
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
									<CardArrow $isHovered={hoveredCard === level.levelId}>
										<FiChevronRight />
										<span>View Classes</span>
									</CardArrow>
								</CardContent>
							</GradeLevelCard>
						))
					) : (
						<NoResults>
							{searchTerm
								? `No grade levels found matching "${searchTerm}"`
								: 'No grade levels available.'}
						</NoResults>
					)}
				</GradeLevelGrid>
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

const GradeLevelGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 24px;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		grid-template-columns: 1fr;
	}
`

const GradeLevelCard = styled(Card)<CardProps>`
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
		const hue = (props.$gradelevel * 20) % 360
		return `linear-gradient(135deg,
      ${props.theme.mode === 'dark' ? `hsl(${hue}, 70%, 20%)` : `hsl(${hue}, 70%, 80%)`},
      ${props.theme.mode === 'dark' ? `hsl(${hue}, 60%, 30%)` : `hsl(${hue}, 60%, 90%)`})`
	}};
	padding: 24px;
	display: flex;
	align-items: center;
	gap: 16px;
`

const GradeLevelIcon = styled.div`
	background: rgba(255, 255, 255, 0.25);
	border-radius: 50%;
	width: 44px;
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.5rem;
	color: #fff;
	backdrop-filter: blur(4px);
`

const GradeLevelName = styled.h3`
	color: #fff;
	font-size: 1.5rem;
	font-weight: 600;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	margin: 0;
`

const CardContent = styled.div`
	padding: 20px;
	display: flex;
	flex-direction: column;
	flex: 1;
`

const GradeMetricRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	margin-bottom: 20px;
`

const GradeMetric = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	flex: 1;
`

const GradeMetricIcon = styled.div`
	font-size: 1.2rem;
	color: ${props => props.theme.colors.primary[500]};
	margin-bottom: 4px;
`

const GradeMetricContent = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
`

const GradeMetricValue = styled.div`
	font-size: 1.5rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const GradeMetricLabel = styled.div`
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

export default GradeLevelSelect
