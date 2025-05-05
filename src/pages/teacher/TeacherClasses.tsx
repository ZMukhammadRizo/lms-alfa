import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import {
	FiCheck,
	FiChevronRight,
	FiEdit,
	FiFolder,
	FiMoreVertical,
	FiPlayCircle,
	FiSearch,
	FiX,
	FiPlus,
	FiUsers,
	FiBookOpen,
	FiArrowLeft,
	FiGrid,
	FiList,
	FiSlash,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { useTeacherStore } from '../../stores/teacherStore'
import { Class } from '../../types/teacher'
import supabase from '../../config/supabaseClient'
import { toast } from 'react-hot-toast'
import { Subject } from '../../types/Subject'

const PageContainer = styled.div`
	padding: clamp(1.5rem, 4vw, 3rem);
	background-color: ${({ theme }) => theme.colors.background.primary};
	min-height: 100vh;
`

const PageHeader = styled(motion.div)`
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	align-items: center;
	gap: 1.5rem;
	margin-bottom: 2.5rem;
	padding: 1.5rem;
	background-color: ${({ theme }) => theme.colors.background.secondary};
	border-radius: ${({ theme }) => theme.borderRadius.xl};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	box-shadow: ${({ theme }) => theme.shadows.sm};
`

const HeaderTitleSection = styled.div``

const PageTitle = styled.h1`
	font-size: clamp(1.8rem, 5vw, 2.2rem);
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text.primary};
	margin: 0 0 0.25rem 0;
`

const PageSubtitle = styled.p`
	font-size: 1rem;
	color: ${({ theme }) => theme.colors.text.secondary};
	margin: 0;
	max-width: 45ch;
`

const HeaderControls = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`

const SearchInputContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.6rem 1rem;
	background: ${({ theme }) => theme.colors.background.primary};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	transition: all 0.2s ease;
	min-width: 240px;

	&:focus-within {
		border-color: ${({ theme }) => theme.colors.primary[500]};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500] + '30'};
	}

	svg {
		color: ${({ theme }) => theme.colors.text.tertiary};
		flex-shrink: 0;
	}
`

const SearchInputStyled = styled.input`
	width: 100%;
	border: none;
	background: transparent;
	font-size: 0.9rem;
	color: ${({ theme }) => theme.colors.text.primary};
	outline: none;

	&::placeholder {
		color: ${({ theme }) => theme.colors.text.tertiary};
	}
`

const ViewToggleGroup = styled.div`
	display: flex;
	align-items: center;
	background: ${({ theme }) => theme.colors.background.primary};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	padding: 0.25rem;
`

const ToggleButton = styled.button<{ $isActive: boolean }>`
	padding: 0.5rem;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	background-color: ${({ theme, $isActive }) =>
		$isActive ? theme.colors.background.secondary : 'transparent'};
	color: ${({ theme, $isActive }) =>
		$isActive ? theme.colors.primary[500] : theme.colors.text.secondary};
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: ${({ theme, $isActive }) => $isActive ? theme.shadows.sm : theme.shadows.none};

	&:hover:not(:disabled) {
		color: ${({ theme }) => theme.colors.primary[500]};
		background-color: ${({ theme, $isActive }) =>
			!$isActive && theme.colors.background.hover};
	}

	svg {
		font-size: 1.1rem;
	}
`

const ContentGrid = styled(motion.div)`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 1.75rem;
`

const ItemCard = styled(motion.div)`
	background: ${({ theme }) => theme.colors.background.secondary};
	border-radius: ${({ theme }) => theme.borderRadius.xl};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	border-top: 4px solid ${({ theme }) => theme.colors.primary[500]};
	overflow: hidden;
	transition: all 0.25s ease-out;
	box-shadow: ${({ theme }) => theme.shadows.sm};
	display: flex;
	flex-direction: column;
	height: 100%;
	cursor: pointer;

	&:hover {
		border-color: ${({ theme }) => theme.colors.primary[300]};
		box-shadow: ${({ theme }) => theme.shadows.md};
		transform: translateY(-4px);
	}
`

const CardBody = styled.div`
	padding: 1.5rem;
	flex-grow: 1;
	display: flex;
	flex-direction: column;
`

const CardTitle = styled.h3`
	font-size: 1.3rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text.primary};
	margin: 0 0 0.5rem 0;
	line-height: 1.3;
`

const CardSubtitle = styled.span`
	font-size: 0.85rem;
	color: ${({ theme }) => theme.colors.text.tertiary};
	margin-bottom: 1rem;
	display: block;
`

const CardDescription = styled.p`
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 0.9rem;
	line-height: 1.6;
	margin: 0 0 1.5rem 0;
	flex-grow: 1;
`

const CardFooter = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: auto;
	padding-top: 1rem;
	border-top: 1px solid ${({ theme }) => theme.colors.border.light};
`

const CardStat = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.85rem;
	color: ${({ theme }) => theme.colors.text.secondary};

	svg {
		color: ${({ theme }) => theme.colors.primary[500]};
		font-size: 1rem;
		flex-shrink: 0;
	}
`

const ViewDetailsButton = styled.div`
	font-size: 0.85rem;
	font-weight: 500;
	color: ${({ theme }) => theme.colors.primary[500]};
	display: flex;
	align-items: center;
	gap: 0.3rem;

	svg {
		transition: transform 0.2s ease;
	}

	${ItemCard}:hover & svg {
		transform: translateX(3px);
	}
`

const SubjectListHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
	flex-wrap: wrap;
	gap: 1rem;
`

const StyledBackButton = styled.button`
	background: transparent;
	border: none;
	color: ${props => props.theme.colors.text.secondary};
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	padding: 0.5rem 0;
	font-size: 0.95rem;
	transition: all 0.2s ease;

	&:hover {
		color: ${props => props.theme.colors.primary[500]};
	}
`

const ViewStudentsButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.6rem 1.2rem;
	background: ${({ theme }) => theme.colors.primary[50]};
	color: ${({ theme }) => theme.colors.primary[600]};
	border: 1px solid ${({ theme }) => theme.colors.primary[200]};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: ${({ theme }) => theme.shadows.sm};

	&:hover {
		background: ${({ theme }) => theme.colors.primary[100]};
		border-color: ${({ theme }) => theme.colors.primary[300]};
		box-shadow: ${({ theme }) => theme.shadows.sm};
	}

	svg {
		font-size: 1.1rem;
	}
`

const LoadingState = styled.div`
	padding: 4rem;
	text-align: center;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 1.1rem;
`

const EmptyState = styled.div`
	padding: 4rem;
	text-align: center;
	color: ${({ theme }) => theme.colors.text.secondary};
`

const TeacherClasses: React.FC = () => {
	const navigate = useNavigate()
	const { classes, loading: loadingClasses, error, loadClasses } = useTeacherStore()
	const [searchQuery, setSearchQuery] = useState('')
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
	const [filteredClasses, setFilteredClasses] = useState<Class[]>(classes)
	const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
	const [selectedClassName, setSelectedClassName] = useState<string | null>(null)
	const [subjects, setSubjects] = useState<Subject[]>([])
	const [loadingSubjects, setLoadingSubjects] = useState(false)
	const [currentUser, setCurrentUser] = useState<any>(null)
	const [studentCounts, setStudentCounts] = useState<{ [classId: string]: number | null }>({})
	const [lessonCounts, setLessonCounts] = useState<{ [subjectId: string]: number }>({})
	const [loadingCounts, setLoadingCounts] = useState(false)
	const theme = useTheme()

	useEffect(() => {
		const getUserData = async () => {
			try {
				const { data: { user }, error: userError } = await supabase.auth.getUser()
				
				if (userError) {
					console.error("Error fetching user:", userError)
					return
				}
				
				if (user) {
					setCurrentUser(user)
					loadClasses(user.id)
				} else {
					console.error("No authenticated user found")
				}
			} catch (err) {
				console.error("Error in getUserData:", err)
				toast.error("Could not fetch user data.")
			}
		}
		
		getUserData()
	}, [loadClasses])

	useEffect(() => {
		const fetchCounts = async () => {
			if (!classes || classes.length === 0) return
			
			setLoadingCounts(true)
			const counts: { [classId: string]: number | null } = {}
			const countPromises = classes.map(async (classItem) => {
				const { count, error } = await supabase
					.from('classstudents')
					.select('id', { count: 'exact', head: true })
					.eq('classid', classItem.id)
				return { classId: classItem.id, count: error ? null : count ?? 0 }
			})
			try {
				const results = await Promise.all(countPromises)
				results.forEach(result => { counts[result.classId] = result.count })
				setStudentCounts(counts)
			} catch (err) {
				console.error("Error fetching student counts:", err)
				classes.forEach(c => counts[c.id] = null)
				setStudentCounts(counts)
			} finally {
				setLoadingCounts(false)
			}
		}

		if (!loadingClasses && classes.length > 0) fetchCounts()
	}, [classes, loadingClasses])

	useEffect(() => {
		const filtered = classes.filter(classItem =>
			classItem.classname.toLowerCase().includes(searchQuery.toLowerCase())
		)
		setFilteredClasses(filtered)
	}, [classes, searchQuery])

	const fetchSubjectsAndLessonCounts = async (classId: string) => {
		setLoadingSubjects(true)
		setLessonCounts({})
		try {
			const { data: classSubjects, error: csError } = await supabase
				.from('classsubjects')
				.select('subjectid')
				.eq('classid', classId)

			if (csError) throw csError

			if (classSubjects && classSubjects.length > 0) {
				const subjectIds = classSubjects.map(cs => cs.subjectid)
				
				const { data: subjectData, error: subjError } = await supabase
					.from('subjects')
					.select('*')
					.in('id', subjectIds)

				if (subjError) throw subjError
				
				setSubjects(subjectData || [])

				const lessonCountPromises = subjectIds.map(async (id) => {
					const { count, error } = await supabase
						.from('lessons')
						.select('id', { count: 'exact', head: true })
						.eq('subjectid', id)
					return { subjectId: id, count: error ? 0 : count ?? 0 }
				})
				const lessonResults = await Promise.all(lessonCountPromises)
				const newLessonCounts: { [subjectId: string]: number } = {}
				lessonResults.forEach(res => { newLessonCounts[res.subjectId] = res.count })
				setLessonCounts(newLessonCounts)

			} else {
				setSubjects([])
			}
		} catch (error) {
			console.error('Error fetching subjects/lessons:', error)
			toast.error('Failed to load subjects')
			setSubjects([])
		} finally {
			setLoadingSubjects(false)
		}
	}

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value)
	}

	const handleClassClick = (classId: string, className: string) => {
		setSelectedClassId(classId)
		setSelectedClassName(className)
		fetchSubjectsAndLessonCounts(classId)
	}

	const handleBackToClasses = () => {
		setSelectedClassId(null)
		setSelectedClassName(null)
		setSubjects([])
		setLessonCounts({})
	}

	const handleSubjectClick = (subjectId: string) => {
		if (selectedClassId) {
			navigate(`/teacher/classes/${selectedClassId}/subjects/${subjectId}`)
		}
	}

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { staggerChildren: 0.08 }
		}
	}

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 }
	}

	return (
		<PageContainer>
			<PageHeader layout>
				<HeaderTitleSection>
					<PageTitle>My Classes</PageTitle>
					<PageSubtitle>Manage your classes, subjects, and lessons</PageSubtitle>
				</HeaderTitleSection>
				<HeaderControls>
					<SearchInputContainer>
						<FiSearch size={18} />
						<SearchInputStyled
							type="text"
							placeholder="Search classes..."
							value={searchQuery}
							onChange={handleSearchChange}
							disabled={!!selectedClassId}
						/>
					</SearchInputContainer>
				</HeaderControls>
			</PageHeader>

			<AnimatePresence mode="wait">
				{selectedClassId ? (
					<motion.div
						key="subjects-view"
						initial={{ opacity: 0, x: 50 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -50 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
					>
						<SubjectListHeader>
							<StyledBackButton onClick={handleBackToClasses}>
								<FiArrowLeft /> Back to Classes
							</StyledBackButton>
							<PageTitle style={{ fontSize: '1.8rem', marginBottom: 0 }}>
								{selectedClassName} - Subjects
							</PageTitle>
						</SubjectListHeader>

						{loadingSubjects ? (
							<LoadingState>Loading subjects...</LoadingState>
						) : subjects.length > 0 ? (
							<ContentGrid
								variants={containerVariants}
								initial="hidden"
								animate="visible"
							>
								{subjects.map(subject => (
									<ItemCard
										key={subject.id}
										variants={itemVariants}
										onClick={() => handleSubjectClick(subject.id)}
										layout
									>
										<CardBody>
											<CardTitle>{subject.subjectname}</CardTitle>
											<CardSubtitle>{subject.code}</CardSubtitle>
											<CardDescription>
												{subject.description || 'No description available.'}
											</CardDescription>
											<CardFooter>
												<CardStat>
													<FiBookOpen />
													<span>{lessonCounts[subject.id] ?? '...'} Lessons</span>
												</CardStat>
												<ViewDetailsButton>
													View Details <FiChevronRight />
												</ViewDetailsButton>
											</CardFooter>
										</CardBody>
									</ItemCard>
								))}
							</ContentGrid>
						) : (
							<EmptyState>No subjects found for this class.</EmptyState>
						)}
					</motion.div>
				) : (
					<motion.div
						key="classes-view"
						initial={{ opacity: 0, x: selectedClassId === null ? 0 : -50 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 50 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
					>
						{loadingClasses || loadingCounts ? (
							<LoadingState>Loading your classes...</LoadingState>
						) : filteredClasses.length > 0 ? (
							<ContentGrid
								variants={containerVariants}
								initial="hidden"
								animate="visible"
							>
								{filteredClasses.map(classItem => (
									<ItemCard
										key={classItem.id}
										variants={itemVariants}
										onClick={() => handleClassClick(classItem.id, classItem.classname)}
										layout
									>
										<CardBody>
											<CardTitle>{classItem.classname}</CardTitle>
											<CardDescription>
												{classItem.description || 'No description provided.'}
											</CardDescription>
											<CardFooter>
												<CardStat>
													<FiUsers />
													<span>
														{studentCounts[classItem.id] === null
															? 'Loading...'
															: `${studentCounts[classItem.id]} Student${studentCounts[classItem.id] !== 1 ? 's' : ''}`
														}
													</span>
												</CardStat>
												<ViewDetailsButton>
													View Subjects <FiChevronRight />
												</ViewDetailsButton>
											</CardFooter>
										</CardBody>
									</ItemCard>
								))}
							</ContentGrid>
						) : (
							<EmptyState>
								<FiFolder size={48} style={{ marginBottom: '1rem', color: theme.colors.text.tertiary }} />
								<PageTitle style={{ fontSize: '1.2rem' }}>No classes found</PageTitle>
								<PageSubtitle style={{ maxWidth: '300px', margin: '0 auto' }}>
									{searchQuery
										? `No classes match your search "${searchQuery}".`
										: "You are not currently assigned to any classes."}
								</PageSubtitle>
							</EmptyState>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</PageContainer>
	)
}

export default TeacherClasses
