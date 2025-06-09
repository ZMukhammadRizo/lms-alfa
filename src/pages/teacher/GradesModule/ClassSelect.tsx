import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FiAward, FiBookOpen, FiChevronRight, FiSearch, FiUsers } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { PageTitle } from '../../../components/common'
import { Badge, Card, Container, Input } from '../../../components/ui'
import { useAuth } from '../../../contexts/AuthContext'
import { getClassStudentCount } from '../../../api/grades'
import useGradesStore from '../../../store/gradesStore'
import { CardProps } from '../../../types/grades'

// Interface for class data with correct student count
interface ClassWithStudentCount {
	classId: string;
	classname: string;
	levelId: string;
	studentCount: number;
	subjectCount: number;
	levelName: string;
	actualStudentCount?: number; // This will hold the actual count from classstudents table
}

const ClassSelect: React.FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { gradeLevel } = useParams<{ gradeLevel: string }>()
	const [searchTerm, setSearchTerm] = useState('')
	const [hoveredCard, setHoveredCard] = useState<string | null>(null)
	const { user } = useAuth()
	const [error, setError] = useState<string | null>(null)
	const [classesWithCounts, setClassesWithCounts] = useState<ClassWithStudentCount[]>([])

	// Use the gradesStore instead of direct service calls
	const classes = useGradesStore(state => state.classes as ClassWithStudentCount[])
	const isLoadingClasses = useGradesStore(state => state.isLoadingClasses)
	const fetchLevelClasses = useGradesStore(state => state.fetchLevelClasses)
	const levels = useGradesStore(state => state.levels)

	// Effect 1: Fetch initial classes for the grade level
	useEffect(() => {
		console.log("[ClassSelect] Initial fetch triggered for gradeLevel:", gradeLevel);
		if (gradeLevel) {
			fetchLevelClasses(gradeLevel).catch(err => {
				console.error('Initial fetchLevelClasses failed:', err);
				setError('Failed to load initial classes.');
			});
		} else {
			console.warn("[ClassSelect] gradeLevel param is missing, cannot fetch classes.");
			setError("Grade level information is missing.");
		}
	}, [fetchLevelClasses, gradeLevel]); // Depends only on stable function and param

	// Effect 2: Calculate accurate student counts when classes data changes from the store
	useEffect(() => {
		const calculateCounts = async () => {
			// Only run if classes are available from store and not loading
			if (!isLoadingClasses && classes && classes.length > 0) {
				setError(null); // Clear previous errors
				try {
					console.log("[ClassSelect] Store classes updated, calculating accurate counts...");
					const updatedClasses = await Promise.all(
						classes.map(async classItem => {
							try {
								// Ensure classItem is valid before fetching count
								if (!classItem || !classItem.classId) {
									console.warn("Invalid class item encountered:", classItem);
									return classItem; // Skip invalid item
								}
								const actualCount = await getClassStudentCount(classItem.classId);
								return {
									...classItem,
									actualStudentCount: actualCount,
								};
							} catch (countError) {
								console.error(`Error fetching student count for class ${classItem?.classId}:`, countError);
								// Return original item without count on error for this specific item
								return classItem; 
							}
						})
					);
					setClassesWithCounts(updatedClasses);
				} catch (err) {
					console.error('Error fetching accurate student counts:', err);
					setError('Failed to load student counts for classes.');
					setClassesWithCounts([]); // Clear potentially stale data
				}
			} else if (!isLoadingClasses && classes && classes.length === 0) {
				// Handle case where fetch completed but returned no classes
				console.log("[ClassSelect] Store fetch complete, no classes found for this level.");
				setClassesWithCounts([]); 
			} else if (!isLoadingClasses && !classes) {
                 // Handle case where classes is unexpectedly null/undefined after loading
                 console.warn("[ClassSelect] Classes data is null/undefined after loading.");
                 setClassesWithCounts([]);
                 setError('Failed to retrieve class data.');
            }
		};

		calculateCounts();
	}, [classes, isLoadingClasses]); // Depend only on store data and its loading state

	// Filter classes based on search term
	const filteredClasses = classesWithCounts.filter(
		classItem =>
			classItem.classname.toLowerCase().includes(searchTerm.toLowerCase()) ||
			classItem.levelName.toLowerCase().includes(searchTerm.toLowerCase())
	)

	// Handle card click - navigate to subject selection
	const handleClassClick = (classId: string) => {
		navigate(`/teacher/grades/levels/${gradeLevel}/classes/${classId}/subjects`)
	}

	// Get the current level name
	const currentLevel = levels.find(level => level.levelId === gradeLevel)
	const levelName = currentLevel ? currentLevel.levelName : gradeLevel

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
				<LoadingMessage>{t('grades.loadingClasses')}</LoadingMessage>
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
						<PageTitle>{t('grades.classesForGrade', { grade: levelName })}</PageTitle>
						<SubTitle>
							{t('grades.selectClassToViewGrades')}
						</SubTitle>
					</HeaderContent>
					<HeaderRight>
						<SearchWrapper>
							<StyledInput
								prefix={<FiSearch />}
								placeholder={t('grades.searchClasses')}
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
							/>
						</SearchWrapper>
					</HeaderRight>
				</PageHeader>
			</PageHeaderWrapper>

			<ContentContainer>
				<ClassGrid
					as={motion.div}
					variants={containerVariants}
					initial='hidden'
					animate='show'
				>
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
												<MetricValue>{classItem.actualStudentCount !== undefined ? classItem.actualStudentCount : classItem.studentCount}</MetricValue>
												<MetricLabel>{t('grades.students')}</MetricLabel>
											</MetricContent>
										</Metric>
										<Metric>
											<MetricIcon>
												<FiBookOpen />
											</MetricIcon>
											<MetricContent>
												<MetricValue>{classItem.subjectCount}</MetricValue>
												<MetricLabel>{t('grades.subjects')}</MetricLabel>
											</MetricContent>
										</Metric>
									</MetricRow>
									<CardArrow $isHovered={hoveredCard === classItem.classId}>
										<FiChevronRight />
										<span>{t('grades.viewSubjects')}</span>
									</CardArrow>
								</CardContent>
							</ClassCard>
						))
					) : (
						<NoResults>
							{classesWithCounts.length === 0
								? t('grades.noClassesFoundForLevel')
								: t('grades.noClassesFoundMatching', { searchTerm })}
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
