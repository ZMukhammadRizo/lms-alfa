import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FiBook, FiChevronRight, FiFileText, FiSearch } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { PageTitle } from '../../../components/common'
import { Card, Container, Input } from '../../../components/ui'
import { getClassInfo } from '../../../services/gradesService'
import useGradesStore from '../../../store/gradesStore'
import { LevelCategoryOverview } from '../../../types/grades'

interface SubjectCardProps {
	$isHovered?: boolean
}

const SubjectSelect: React.FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { classId } = useParams<{ classId: string }>()
	const [searchTerm, setSearchTerm] = useState('')
	const [hoveredCard, setHoveredCard] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Use the gradesStore instead of direct service calls
	const subjects = useGradesStore(state => state.subjects)
	const isLoadingSubjects = useGradesStore(state => state.isLoadingSubjects)
	const fetchClassSubjects = useGradesStore(state => state.fetchClassSubjects)
	const setSelectedClass = useGradesStore(state => state.setSelectedClass)

	// Select the class name directly and reactively from the store
	const classname = useGradesStore(state => 
		state.classes.find((c: LevelCategoryOverview) => c.classId === classId)?.classname
	)

	useEffect(() => {
		console.log(`SubjectSelect useEffect triggered for classId: ${classId}`);
		if (!classId) {
			setError("Class ID not found in URL.");
			setLoading(false);
			console.log("SubjectSelect useEffect: No classId, exiting.");
			return;
		}

		let isMounted = true;
		console.log(`SubjectSelect useEffect: Initial check, isMounted=${isMounted}, classId=${classId}`);

		const initializeData = async () => {
			console.log(`SubjectSelect: Calling initializeData for ${classId}`);
			if (isMounted) {
				 setLoading(true);
				 setError(null);
			}
			try {
				// 1. Conditionally set selected class ID in store
				const currentState = useGradesStore.getState();
				if (currentState.selectedClassId !== classId) {
					console.log(`SubjectSelect: Current selectedClassId (${currentState.selectedClassId}) differs from URL classId (${classId}). Calling setSelectedClass.`);
					setSelectedClass(classId);
				} else {
					console.log(`SubjectSelect: Store selectedClassId (${currentState.selectedClassId}) already matches URL classId (${classId}). Skipping setSelectedClass.`);
				}

				// 2. Fetch subjects
				 console.log(`SubjectSelect: Calling fetchClassSubjects(${classId})`);
				await fetchClassSubjects(classId);
				 console.log(`SubjectSelect: Fetched subjects successfully for ${classId}`);

			} catch (err) {
				console.error(`SubjectSelect: Error initializing for ${classId}:`, err);
				 if (isMounted) setError('Failed to load class subjects. Please try again later.');
			} finally {
				 console.log(`SubjectSelect: Setting loading false for ${classId}, isMounted=${isMounted}`);
				 if (isMounted) setLoading(false);
			}
		};

		initializeData();

		// Cleanup function
		return () => {
			console.log(`SubjectSelect useEffect cleanup for classId: ${classId}`);
			isMounted = false;
			 console.log(`SubjectSelect cleanup: isMounted set to ${isMounted}`);
		};
	}, [classId, fetchClassSubjects, setSelectedClass]); // Keep dependencies stable

	// Filter subjects based on search term
	const filteredSubjects = subjects.filter(subject =>
		subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
	)

	// Handle card click - navigate to journal
	const handleSubjectClick = (subjectId: string) => {
		if (!classId) {
			console.error("Class ID is undefined, cannot navigate to subject journal.");
			// Optionally show a toast error to the user
			return;
		}
		// Navigate to the admin-specific journal page
		navigate(`/admin/grades/classes/${classId}/subjects/${subjectId}/journal`);
	};

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
				<LoadingMessage>{t('grades.loadingSubjects')}</LoadingMessage>
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

	// Use the classname from the store selector, or fallback to ID if still loading/not found
	const displayClassName = classname || `Class ${classId}`;

	return (
		<PageContainer>
			<PageHeaderWrapper>
				<PageHeader>
					<HeaderContent>
						<PageTitle>{t('grades.classSubjects', { className: displayClassName })}</PageTitle>
						<SubTitle>{t('grades.selectSubjectToViewGrades')}</SubTitle>
					</HeaderContent>
					<HeaderRight>
						<SearchWrapper>
							<StyledInput
								prefix={<FiSearch />}
								placeholder={t('grades.searchSubjects')}
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
											{subject.lessonCount} {subject.lessonCount === 1 ? t('grades.lesson') : t('grades.lessons')}
										</span>
									</LessonCount>
									<CardArrow $isHovered={hoveredCard === subject.subjectId}>
										<FiChevronRight />
										<span>{t('grades.openJournal')}</span>
									</CardArrow>
								</CardContent>
							</SubjectCard>
						))
					) : (
						<NoResults>
							{searchTerm
								? t('grades.noSubjectsFoundMatching', { searchTerm })
								: t('grades.noSubjectsAssigned')}
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
