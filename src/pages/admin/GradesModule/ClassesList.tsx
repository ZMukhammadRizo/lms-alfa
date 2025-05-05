import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FiAward, FiBookOpen, FiChevronRight, FiSearch, FiUsers } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { PageTitle } from '../../../components/common'
import { Badge, Card, Container, Input } from '../../../components/ui'
import { useAuth } from '../../../contexts/AuthContext'
import { getClassStudentCount } from '../../../api/grades'
import useGradesStore from '../../../store/gradesStore'

// Define interface for the teacher's classes with actual student count
interface TeacherClassInfo {
	classId: string
	classname: string
	levelId: string
	levelName: string
	studentCount: number
	subjectCount: number
	actualStudentCount?: number // This will hold the actual count from classstudents table
}

const ClassesList: React.FC = () => {
	const navigate = useNavigate()
	const [searchTerm, setSearchTerm] = useState('')
	const [hoveredCard, setHoveredCard] = useState<string | null>(null)
	const { user } = useAuth()
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [classesWithCounts, setClassesWithCounts] = useState<TeacherClassInfo[]>([])

	// Use the gradesStore instead of direct service calls
	const classes = useGradesStore(state => state.classes) as TeacherClassInfo[]
	const isLoadingClasses = useGradesStore(state => state.isLoadingClasses)
	const fetchTeacherClasses = useGradesStore(state => state.fetchTeacherClasses)
	const fetchTeacherLevels = useGradesStore(state => state.fetchTeacherLevels)
	const levels = useGradesStore(state => state.levels)

	useEffect(() => {
		const fetchDataAndCounts = async () => {
			try {
				setLoading(true)

				// First, ensure we have basic teacher data by fetching levels and classes
				const fetchPromises = []

				// Only fetch teacher levels if not already loaded
				if (levels.length === 0) {
					fetchPromises.push(fetchTeacherLevels())
				}

				// Always fetch classes as this is the primary data for this page
				fetchPromises.push(fetchTeacherClasses())

				// Wait for all data to load
				await Promise.all(fetchPromises)

				// Get actual student counts for each class
				const updatedClasses = await Promise.all(
					classes.map(async classItem => {
						try {
							const actualCount = await getClassStudentCount(classItem.classId)
							return {
								...classItem,
								actualStudentCount: actualCount,
							}
						} catch (countError) {
							console.error(`Error fetching student count for class ${classItem.classId}:`, countError)
							return classItem
						}
					})
				)

				setClassesWithCounts(updatedClasses)
			} catch (err) {
				console.error('Error fetching classes:', err)
				setError('Failed to load classes. Please try again later.')
			} finally {
				setLoading(false)
			}
		}

		fetchDataAndCounts()
	}, [fetchTeacherLevels, fetchTeacherClasses, levels.length, classes])

	// Filter classes based on search term
	const filteredClasses = classesWithCounts.filter(
		classItem =>
			classItem.classname.toLowerCase().includes(searchTerm.toLowerCase()) ||
			classItem.levelName.toLowerCase().includes(searchTerm.toLowerCase())
	)

	// Handle card click - navigate to subject selection
	const handleClassClick = (classId: string) => {
		navigate(`/teacher/grades/classes/${classId}/subjects`)
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
				<LoadingMessage>Loading your classes...</LoadingMessage>
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

	// Group classes by grade level for better organization
	const classGroups = classesWithCounts.reduce((groups, classItem) => {
		const level = classItem.levelName
		if (!groups[level]) {
			groups[level] = []
		}
		groups[level].push(classItem)
		return groups
	}, {} as Record<string, TeacherClassInfo[]>)

	return (
		<PageContainer>
			<PageHeaderWrapper>
				<PageHeader>
					<HeaderContent>
						<PageTitle>My Classes</PageTitle>
						<SubTitle>View and manage grades for all your assigned classes</SubTitle>
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
				{filteredClasses.length > 0 ? (
					searchTerm ? (
						// When searching, show flat list of results
						<ClassGrid as={motion.div} variants={containerVariants} initial='hidden' animate='show'>
							{filteredClasses.map(classItem => (
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
										<LevelBadge>{classItem.levelName}th Grade</LevelBadge>
									</CardHeader>
									<CardContent>
										<MetricRow>
											<Metric>
												<MetricIcon>
													<FiUsers />
												</MetricIcon>
												<MetricContent>
													<MetricValue>{classItem.actualStudentCount !== undefined ? classItem.actualStudentCount : classItem.studentCount}</MetricValue>
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
							))}
						</ClassGrid>
					) : (
						// When not searching, group by level
						Object.entries(classGroups).map(([levelName, levelClasses]) => (
							<LevelSection key={levelName}>
								<LevelHeader>
									<LevelIcon>
										<FiAward />
									</LevelIcon>
									<LevelName>{levelName}th Grade</LevelName>
									<LevelClassCount>
										{levelClasses.length} {levelClasses.length === 1 ? 'class' : 'classes'}
									</LevelClassCount>
								</LevelHeader>
								<ClassGrid
									as={motion.div}
									variants={containerVariants}
									initial='hidden'
									animate='show'
								>
									{levelClasses.map(classItem => (
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
															<MetricValue>{classItem.actualStudentCount !== undefined ? classItem.actualStudentCount : classItem.studentCount}</MetricValue>
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
									))}
								</ClassGrid>
							</LevelSection>
						))
					)
				) : (
					<NoResults>
						{classesWithCounts.length === 0
							? 'No classes assigned to you yet.'
							: `No classes found matching "${searchTerm}"`}
					</NoResults>
				)}
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

const LevelSection = styled.div`
	margin-bottom: 32px;
`

const LevelHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
	padding: 0 8px;
`

const LevelIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.2rem;
	color: ${props => props.theme.colors.primary[500]};
`

const LevelName = styled.h3`
	font-size: 1.4rem;
	font-weight: 600;
	margin: 0;
	color: ${props => props.theme.colors.text.primary};
`

const LevelClassCount = styled.div`
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-left: 8px;
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
	position: relative;
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

const LevelBadge = styled(Badge)`
	position: absolute;
	top: 12px;
	right: 12px;
	background: ${props => props.theme.colors.primary[100]};
	color: ${props => props.theme.colors.primary[700]};
	font-size: 0.8rem;
	padding: 4px 10px;
	border-radius: 12px;
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

export default ClassesList
