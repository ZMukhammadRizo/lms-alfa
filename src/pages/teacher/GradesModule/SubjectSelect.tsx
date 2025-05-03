import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FiBook, FiChevronRight, FiFileText, FiSearch } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { PageTitle } from '../../../components/common'
import { Card, Container, Input } from '../../../components/ui'
import { getClassInfo } from '../../../services/gradesService'
import useGradesStore from '../../../store/gradesStore'

interface SubjectCardProps {
	$isHovered?: boolean
}

const SubjectSelect: React.FC = () => {
	const navigate = useNavigate()
	const { gradeLevel, classId } = useParams<{ gradeLevel?: string; classId: string }>()
	const [searchTerm, setSearchTerm] = useState('')
	const [hoveredCard, setHoveredCard] = useState<string | null>(null)
	const [classname, setClassname] = useState('')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Use the gradesStore instead of direct service calls
	const subjects = useGradesStore(state => state.subjects)
	const isLoadingSubjects = useGradesStore(state => state.isLoadingSubjects)
	const fetchClassSubjects = useGradesStore(state => state.fetchClassSubjects)
	const setSelectedClass = useGradesStore(state => state.setSelectedClass)

	// To get class name, we might need levels and classes
	const levels = useGradesStore(state => state.levels)
	const classes = useGradesStore(state => state.classes)
	const fetchTeacherLevels = useGradesStore(state => state.fetchTeacherLevels)
	const fetchLevelClasses = useGradesStore(state => state.fetchLevelClasses)

	useEffect(() => {
		const initializeData = async () => {
			if (!classId) return

			try {
				setLoading(true)

				// If refreshing directly on this page, we need to ensure we have class info
				// First try to find it in the store
				let classInfo = classes.find(c => c.classId === classId)

				// If not found in the store, fetch it directly
				if (!classInfo) {
					// Try to load class info from the API
					try {
						const info = await getClassInfo(classId)
						setClassname(info.name)
					} catch (err) {
						console.error('Error fetching class info:', err)
						setClassname(gradeLevel ? `${gradeLevel} Class` : `Class`)
					}
				} else {
					setClassname(classInfo.classname)
				}

				// Always fetch the subjects for this class
				await fetchClassSubjects(classId)
				setSelectedClass(classId)
			} catch (err) {
				console.error('Error fetching subjects:', err)
				setError('Failed to load subjects. Please try again later.')
			} finally {
				setLoading(false)
			}
		}

		initializeData()
	}, [classId, gradeLevel, fetchClassSubjects, setSelectedClass, classes, fetchLevelClasses])

	// Filter subjects based on search term
	const filteredSubjects = subjects.filter(subject =>
		subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
	)

	// Handle card click - navigate to journal
	const handleSubjectClick = (subjectId: string) => {
		// Determine which route pattern to use based on whether we have a gradeLevel
		if (gradeLevel) {
			navigate(
				`/teacher/grades/levels/${gradeLevel}/classes/${classId}/subjects/${subjectId}/journal`
			)
		} else {
			navigate(`/teacher/grades/classes/${classId}/subjects/${subjectId}/journal`)
		}
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

	if (loading || isLoadingSubjects) {
		return (
			<PageContainer>
				<LoadingMessage>Loading subjects...</LoadingMessage>
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
						<PageTitle>Class {classname} Subjects</PageTitle>
						<SubTitle>Select a subject to view and manage student grades</SubTitle>
					</HeaderContent>
					<HeaderRight>
						<SearchWrapper>
							<StyledInput
								prefix={<FiSearch />}
								placeholder='Search subjects...'
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
							/>
						</SearchWrapper>
					</HeaderRight>
				</PageHeader>
			</PageHeaderWrapper>

			<ContentContainer>
				<SubjectGrid as={motion.div} variants={containerVariants} initial='hidden' animate='show'>
					{filteredSubjects.length > 0 ? (
						filteredSubjects.map(subject => (
							<SubjectCard
								key={subject.subjectId}
								as={motion.div}
								variants={itemVariants}
								whileHover={{ scale: 1.02, y: -5 }}
								onHoverStart={() => setHoveredCard(subject.subjectId)}
								onHoverEnd={() => setHoveredCard(null)}
								onClick={() => handleSubjectClick(subject.subjectId)}
								$isHovered={hoveredCard === subject.subjectId}
							>
								<CardHeader>
									<SubjectIcon>
										<FiBook />
									</SubjectIcon>
									<SubjectName>{subject.subjectName}</SubjectName>
								</CardHeader>
								<CardContent>
									<LessonCount>
										<FiFileText />
										<span>
											{subject.lessonCount} {subject.lessonCount === 1 ? 'Lesson' : 'Lessons'}
										</span>
									</LessonCount>
									<CardArrow $isHovered={hoveredCard === subject.subjectId}>
										<FiChevronRight />
										<span>Open Journal</span>
									</CardArrow>
								</CardContent>
							</SubjectCard>
						))
					) : (
						<NoResults>
							{searchTerm
								? `No subjects found matching "${searchTerm}"`
								: 'No subjects assigned to this class.'}
						</NoResults>
					)}
				</SubjectGrid>
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

const SubjectGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 24px;

	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		grid-template-columns: 1fr;
	}
`

const SubjectCard = styled(Card)<SubjectCardProps>`
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
	background: ${props => props.theme.colors.success[props.theme.mode === 'dark' ? 900 : 50]};
	display: flex;
	align-items: center;
	gap: 16px;
`

const SubjectIcon = styled.div`
	background: ${props => props.theme.colors.success[500]};
	color: white;
	width: 44px;
	height: 44px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.5rem;
`

const SubjectName = styled.h3`
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

const LessonCount = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 1.1rem;
	margin-bottom: 20px;

	svg {
		color: ${props => props.theme.colors.success[500]};
	}
`

const CardArrow = styled.div<{ $isHovered?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	margin-top: auto;
	color: ${props =>
		props.$isHovered ? props.theme.colors.success[600] : props.theme.colors.text.tertiary};
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

export default SubjectSelect
