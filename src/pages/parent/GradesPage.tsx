import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { PageTitle } from '../../components/common'
import { Container } from '../../components/ui'
import { supabase } from '../../services/supabaseClient'
import {
	useParentChildren,
	useParentScores,
	useParentStudentStore,
} from '../../store/parentStudentStore'
import { ScoreResponse } from '../../types/parent'

const GradesPage: React.FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const studentParam = searchParams.get('student')

	const { fetchChildren, fetchScores, loading, error } = useParentStudentStore()
	const children = useParentChildren()
	const scores = useParentScores()

	const [selectedStudent, setSelectedStudent] = useState<string>(studentParam || 'all')
	const [expandedSubjects, setExpandedSubjects] = useState<{ [childId: string]: string[] }>({})

	useEffect(() => {
		const loadParentData = async () => {
			// Get current user
			const {
				data: { user },
			} = await supabase.auth.getUser()

			if (!user) {
				navigate('/auth/login')
				return
			}

			// Load children data
			await fetchChildren(user.id)
		}

		loadParentData()
	}, [fetchChildren, navigate])

	// Listen for changes in the URL query parameters
	useEffect(() => {
		if (studentParam && children.length > 0) {
			// Check if the student ID exists in the children list
			const childExists = children.some(child => child.id === studentParam)
			setSelectedStudent(childExists ? studentParam : 'all')
		}
	}, [studentParam, children])

	useEffect(() => {
		// When children are loaded, fetch scores for all of them
		if (children.length > 0) {
			const childrenIds = children.map(child => child.id)
			fetchScores(childrenIds)
		}
	}, [children, fetchScores])

	const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value
		setSelectedStudent(value)
		// Reset expanded subjects when changing student
		setExpandedSubjects({})

		// Update the URL with the selected student
		if (value === 'all') {
			navigate('/parent/grades')
		} else {
			navigate(`/parent/grades?student=${value}`)
		}
	}

	const renderGradeLetter = (score: number) => {
		// Using a 1-10 scale
		if (score >= 9) return 'A'
		if (score >= 7) return 'B'
		if (score >= 5) return 'C'
		if (score >= 3) return 'D'
		return 'F'
	}

	const toggleSubjectExpand = (childId: string, subject: string) => {
		setExpandedSubjects(prev => {
			const childSubjects = prev[childId] || []
			if (childSubjects.includes(subject)) {
				return {
					...prev,
					[childId]: childSubjects.filter(s => s !== subject),
				}
			} else {
				return {
					...prev,
					[childId]: [...childSubjects, subject],
				}
			}
		})
	}

	// Get child's scores
	const getChildScores = (childId: string) => {
		return scores.filter(score => score.student_id === childId)
	}

	// Get the list of visible children
	const visibleChildren =
		selectedStudent === 'all' ? children : children.filter(child => child.id === selectedStudent)

	// Group scores by subject for a specific child
	const getGroupedScoresByChild = (childId: string) => {
		const childScores = getChildScores(childId)
		const grouped: {
			[key: string]: {
				subjectName: string
				totalScore: number
				count: number
				lessons: ScoreResponse[]
			}
		} = {}

		childScores.forEach(score => {
			const subjectName = score.lessons.subjects.subjectname

			if (!grouped[subjectName]) {
				grouped[subjectName] = {
					subjectName,
					totalScore: 0,
					count: 0,
					lessons: [],
				}
			}

			grouped[subjectName].lessons.push(score)
			grouped[subjectName].totalScore += score.score
			grouped[subjectName].count += 1
		})

		return grouped
	}

	return (
		<Container>
			<PageHeader>
				<TitleSection>
					<PageTitle>{t('parent.grades.title')}</PageTitle>
					<SubTitle>{t('parent.grades.description')}</SubTitle>
				</TitleSection>

				<StudentSelectorWrapper>
					<SelectLabel>{t('parent.grades.selectChild')}</SelectLabel>
					<StudentSelector
						value={selectedStudent}
						onChange={handleStudentChange}
						disabled={loading || children.length === 0}
					>
						<option value='all'>{t('parent.grades.allChildren')}</option>
						{children.length === 0 && <option value=''>{t('parent.grades.noStudentsAvailable')}</option>}
						{children.map(child => (
							<option key={child.id} value={child.id}>
								{child.firstName} {child.lastName}
							</option>
						))}
					</StudentSelector>
				</StudentSelectorWrapper>
			</PageHeader>

			{error && <ErrorMessage>{t('parent.grades.errorLoading')}: {error}</ErrorMessage>}

			{loading ? (
				<LoadingState>{t('parent.grades.loadingGrades')}</LoadingState>
			) : scores.length === 0 ? (
				<EmptyState>
					<EmptyStateTitle>{t('parent.grades.noGradesAvailable')}</EmptyStateTitle>
					<EmptyStateText>{t('parent.grades.noGradesRecorded')}</EmptyStateText>
				</EmptyState>
			) : (
				<>
					{visibleChildren.map(child => {
						const groupedScores = getGroupedScoresByChild(child.id)

						if (Object.keys(groupedScores).length === 0) {
							return (
								<ChildGradesSection key={child.id}>
									<ChildName>
										{child.firstName} {child.lastName}
									</ChildName>
									<EmptyState>
										<EmptyStateTitle>{t('parent.grades.noGradesAvailable')}</EmptyStateTitle>
										<EmptyStateText>
											{t('parent.grades.noGradesForChild')}
										</EmptyStateText>
									</EmptyState>
								</ChildGradesSection>
							)
						}

						return (
							<ChildGradesSection key={child.id}>
								<ChildName>
									{child.firstName} {child.lastName}
								</ChildName>
								<GradesContainer>
									<GradesSummary>
										<SummaryTitle>{t('parent.grades.overallPerformance')}</SummaryTitle>
										<SubjectsGrid>
											{Object.values(groupedScores).map(subject => {
												const averageScore = subject.totalScore / subject.count
												return (
													<SubjectCard key={subject.subjectName}>
														<SubjectName>{subject.subjectName}</SubjectName>
														<SubjectGrade $score={averageScore}>
															{renderGradeLetter(averageScore)}
														</SubjectGrade>
													</SubjectCard>
												)
											})}
										</SubjectsGrid>
									</GradesSummary>

									<DetailedGrades>
										<DetailedTitle>{t('parent.grades.detailedGrades')}</DetailedTitle>
										<DetailedInstructions>
											{t('parent.grades.clickSubjectToExpand')}
										</DetailedInstructions>

										{Object.values(groupedScores).map(subject => {
											const childExpandedSubjects = expandedSubjects[child.id] || []
											const isExpanded = childExpandedSubjects.includes(subject.subjectName)
											const averageScore = subject.totalScore / subject.count

											return (
												<SubjectSection key={subject.subjectName}>
													<SubjectHeader
														onClick={() => toggleSubjectExpand(child.id, subject.subjectName)}
													>
														<SubjectHeaderName>
															{isExpanded ? <FiChevronDown /> : <FiChevronRight />}
															{subject.subjectName}
														</SubjectHeaderName>
														<SubjectHeaderGrade $score={averageScore}>
															{t('parent.grades.average')}: {renderGradeLetter(averageScore)}
														</SubjectHeaderGrade>
													</SubjectHeader>

													{isExpanded && (
														<LessonsTable>
															<LessonsTableHeader>
																<LessonCell width='50%'>{t('parent.grades.lesson')}</LessonCell>
																<LessonCell width='25%'>{t('parent.grades.quarter')}</LessonCell>
																<LessonCell width='25%'>{t('parent.grades.grade')}</LessonCell>
															</LessonsTableHeader>

															{subject.lessons.map(lesson => (
																<LessonsTableRow key={lesson.id}>
																	<LessonCell width='50%'>{lesson.lessons.lessonname}</LessonCell>
																	<LessonCell width='25%'>{lesson.quarters.name}</LessonCell>
																	<LessonGradeCell width='25%' $score={lesson.score}>
																		{renderGradeLetter(lesson.score)}
																	</LessonGradeCell>
																</LessonsTableRow>
															))}
														</LessonsTable>
													)}
												</SubjectSection>
											)
										})}
									</DetailedGrades>
								</GradesContainer>
							</ChildGradesSection>
						)
					})}
				</>
			)}
		</Container>
	)
}

// Styled components
const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: ${props => props.theme.spacing[6]};
	flex-wrap: wrap;
	gap: ${props => props.theme.spacing[4]};

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: stretch;
	}
`

const TitleSection = styled.div``

const SubTitle = styled.p`
	color: ${props => props.theme.colors.text.secondary};
	margin-top: ${props => props.theme.spacing[1]};
	font-size: 1rem;
`

const StudentSelectorWrapper = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 250px;
`

const SelectLabel = styled.label`
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: ${props => props.theme.spacing[2]};
	font-weight: 500;
`

const StudentSelector = styled.select`
	padding: ${props => props.theme.spacing[3]};
	border-radius: ${props => props.theme.borderRadius.md};
	border: 2px solid ${props => props.theme.colors.border.light};
	background-color: ${props => props.theme.colors.background.secondary};
	font-size: 1rem;
	color: ${props => props.theme.colors.text.primary};
	width: 100%;
	max-width: 300px;
	height: 48px;
`

const ErrorMessage = styled.div`
	padding: ${props => props.theme.spacing[4]};
	background-color: ${props => props.theme.colors.danger[50]};
	border: 1px solid ${props => props.theme.colors.danger[200]};
	border-radius: ${props => props.theme.borderRadius.md};
	color: ${props => props.theme.colors.danger[700]};
	margin-bottom: ${props => props.theme.spacing[4]};
	font-size: 1rem;
`

const ChildGradesSection = styled.div`
	margin-bottom: ${props => props.theme.spacing[8]};
`

const ChildName = styled.h2`
	font-size: 1.5rem;
	font-weight: 600;
	margin-bottom: ${props => props.theme.spacing[4]};
	color: ${props => props.theme.colors.text.primary};
	padding-bottom: ${props => props.theme.spacing[2]};
	border-bottom: 2px solid ${props => props.theme.colors.primary[500]};
`

const GradesContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[6]};
`

const GradesSummary = styled.div`
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.lg};
	padding: ${props => props.theme.spacing[6]};
	box-shadow: ${props => props.theme.shadows.sm};
`

const SummaryTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	margin-bottom: ${props => props.theme.spacing[4]};
	color: ${props => props.theme.colors.text.primary};
`

const SubjectsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
	gap: ${props => props.theme.spacing[4]};
`

const SubjectCard = styled.div`
	padding: ${props => props.theme.spacing[4]};
	background-color: ${props => props.theme.colors.background.tertiary};
	border-radius: ${props => props.theme.borderRadius.md};
	text-align: center;
	display: flex;
	flex-direction: column;
	gap: ${props => props.theme.spacing[2]};
`

const SubjectName = styled.div`
	font-size: 1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const SubjectGrade = styled.div<{ $score: number }>`
	font-size: 1.75rem;
	font-weight: 700;
	color: ${props => {
		if (props.$score >= 9) return props.theme.colors.success[600]
		if (props.$score >= 7) return props.theme.colors.primary[600]
		if (props.$score >= 5) return props.theme.colors.warning[600]
		return props.theme.colors.danger[600]
	}};
`

const SubjectScore = styled.span`
	font-size: 1rem;
	margin-left: ${props => props.theme.spacing[1]};
`

const DetailedGrades = styled.div`
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.lg};
	padding: ${props => props.theme.spacing[6]};
	box-shadow: ${props => props.theme.shadows.sm};
`

const DetailedTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	margin-bottom: ${props => props.theme.spacing[2]};
	color: ${props => props.theme.colors.text.primary};
`

const DetailedInstructions = styled.p`
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: ${props => props.theme.spacing[4]};
	font-size: 0.95rem;
`

const SubjectSection = styled.div`
	margin-bottom: ${props => props.theme.spacing[4]};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.md};
	overflow: hidden;
`

const SubjectHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: ${props => props.theme.spacing[4]};
	background-color: ${props => props.theme.colors.background.tertiary};
	cursor: pointer;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}
`

const SubjectHeaderName = styled.div`
	display: flex;
	align-items: center;
	gap: ${props => props.theme.spacing[2]};
	font-size: 1.1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const SubjectHeaderGrade = styled.div<{ $score: number }>`
	font-weight: 600;
	font-size: 1rem;
	color: ${props => {
		if (props.$score >= 9) return props.theme.colors.success[600]
		if (props.$score >= 7) return props.theme.colors.primary[600]
		if (props.$score >= 5) return props.theme.colors.warning[600]
		return props.theme.colors.danger[600]
	}};
`

const LessonsTable = styled.div`
	width: 100%;
`

const LessonsTableHeader = styled.div`
	display: flex;
	background-color: ${props => props.theme.colors.background.lighter};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	border-top: 1px solid ${props => props.theme.colors.border.light};
	padding: ${props => props.theme.spacing[3]};
`

const LessonsTableRow = styled.div`
	display: flex;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	padding: ${props => props.theme.spacing[3]};

	&:nth-child(even) {
		background-color: ${props => props.theme.colors.background.lighter};
	}

	&:last-child {
		border-bottom: none;
	}
`

const LessonCell = styled.div<{ width: string }>`
	width: ${props => props.width};
	font-size: 1rem;
	display: flex;
	align-items: center;
`

const LessonGradeCell = styled(LessonCell)<{ $score: number }>`
	font-weight: 600;
	color: ${props => {
		if (props.$score >= 9) return props.theme.colors.success[600]
		if (props.$score >= 7) return props.theme.colors.primary[600]
		if (props.$score >= 5) return props.theme.colors.warning[600]
		return props.theme.colors.danger[600]
	}};
`

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: ${props => props.theme.spacing[6]};
	text-align: center;
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.lg};
`

const EmptyStateTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: ${props => props.theme.spacing[2]};
`

const EmptyStateText = styled.p`
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
	max-width: 400px;
	margin-bottom: ${props => props.theme.spacing[3]};
`

const LoadingState = styled.div`
	padding: ${props => props.theme.spacing[8]};
	text-align: center;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 1rem;
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.lg};
`

export default GradesPage
