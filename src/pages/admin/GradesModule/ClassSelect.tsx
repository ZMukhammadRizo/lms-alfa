import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FiBookOpen, FiChevronRight, FiSearch, FiUsers } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { PageTitle } from '../../../components/common'
import { Card, Container, Input } from '../../../components/ui'
import useGradesStore from '../../../store/gradesStore'
import { CardProps } from '../../../types/grades'

const ClassSelect: React.FC = () => {
	const navigate = useNavigate()
	const { gradeLevel } = useParams<{ gradeLevel: string }>()
	const [searchTerm, setSearchTerm] = useState('')
	const [hoveredCard, setHoveredCard] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [levelName, setLevelName] = useState('')
	const [initialized, setInitialized] = useState(false)

	// Use the gradesStore instead of direct service calls
	const classes = useGradesStore(state => state.classes)
	const isLoadingClasses = useGradesStore(state => state.isLoadingClasses)
	const fetchLevelClasses = useGradesStore(state => state.fetchLevelClasses)
	const setSelectedLevel = useGradesStore(state => state.setSelectedLevel)

	// Get level information from the store if available
	const levels = useGradesStore(state => state.levels)
	const fetchAllLevels = useGradesStore(state => state.fetchAllLevels)

	useEffect(() => {
		const initializeData = async () => {
			if (!gradeLevel || initialized) return

			try {
				setLoading(true)

				// First, ensure we have the levels data
				if (levels.length === 0) {
					await fetchAllLevels()
				}

				// Then fetch classes for this level
				await fetchLevelClasses(gradeLevel)
				setSelectedLevel(gradeLevel)

				// Try to find the level name
				const foundLevel = levels.find(level => level.levelId === gradeLevel)
				if (foundLevel) {
					setLevelName(foundLevel.levelName)
				}

				setInitialized(true)
			} catch (err) {
				console.error('Error fetching classes:', err)
				setError('Failed to load classes. Please try again later.')
			} finally {
				setLoading(false)
			}
		}

		initializeData()
	}, [gradeLevel, fetchLevelClasses, fetchAllLevels, setSelectedLevel, levels, initialized])

	// Update level name when levels change and we already have a gradeLevel
	useEffect(() => {
		if (gradeLevel && levels.length > 0) {
			const foundLevel = levels.find(level => level.levelId === gradeLevel)
			if (foundLevel) {
				setLevelName(foundLevel.levelName)
			}
		}
	}, [levels, gradeLevel])

	// Filter classes based on search term
	const filteredClasses = classes.filter(classItem =>
		classItem.classname.toLowerCase().includes(searchTerm.toLowerCase())
	)

	// Handle card click - navigate to subject selection
	const handleClassClick = (classId: string) => {
		navigate(`/admin/grades/levels/${levelName}/classes/${classId}/subjects`)
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

	if (loading || isLoadingClasses) {
		return (
			<PageContainer>
				<LoadingMessage>Loading classes...</LoadingMessage>
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
						<PageTitle>Grade {levelName} Classes</PageTitle>
						<SubTitle>Select a class to view and manage subjects and grades</SubTitle>
					</HeaderContent>
					<HeaderRight>
						<SearchWrapper>
							<StyledInput
								prefix={<FiSearch />}
								placeholder='Search classes...'
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
												<MetricLabel>Students</MetricLabel>
											</MetricContent>
										</Metric>
										<Metric>
											<MetricIcon>
												<FiBookOpen />
											</MetricIcon>
											<MetricContent>
												<MetricValue>{classItem.subjectCount}</MetricValue>
												<MetricLabel>Subjects</MetricLabel>
											</MetricContent>
										</Metric>
									</MetricRow>
									<CardArrow $isHovered={hoveredCard === classItem.classId}>
										<FiChevronRight />
										<span>View Subjects</span>
									</CardArrow>
								</CardContent>
							</ClassCard>
						))
					) : (
						<NoResults>
							{searchTerm
								? `No classes found matching "${searchTerm}"`
								: 'No classes assigned for this grade level.'}
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
