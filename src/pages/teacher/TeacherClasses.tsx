import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import {
	FiArrowLeft,
	FiBookOpen,
	FiChevronRight,
	FiFolder,
	FiSearch,
	FiUsers,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import supabase from '../../config/supabaseClient'
import { useTeacherStore } from '../../stores/teacherStore'
import { Subject } from '../../types/Subject'
import { Class, ClassType } from '../../types/teacher'

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

const ClassTypeCard = styled(ItemCard)<{ $color?: string }>`
	border-top: 4px solid ${props => props.$color || props.theme.colors.primary[500]};
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

// Different views for the component
type ViewState = 'class-types' | 'classes' | 'subjects'

const TeacherClasses: React.FC = () => {
	const navigate = useNavigate()
	const { classes, loading: loadingClasses, error, loadClasses } = useTeacherStore()
	const [searchQuery, setSearchQuery] = useState('')
	const [currentView, setCurrentView] = useState<ViewState>('class-types')
	const [filteredClasses, setFilteredClasses] = useState<Class[]>([])
	const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
	const [selectedClassName, setSelectedClassName] = useState<string | null>(null)
	const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null)
	const [subjects, setSubjects] = useState<Subject[]>([])
	const [loadingSubjects, setLoadingSubjects] = useState(false)
	const [currentUser, setCurrentUser] = useState<any>(null)
	const [studentCounts, setStudentCounts] = useState<{ [classId: string]: number | null }>({})
	const [classCounts, setClassCounts] = useState<{ [typeId: number]: number }>({})
	const [lessonCounts, setLessonCounts] = useState<{ [subjectId: string]: number }>({})
	const [loadingCounts, setLoadingCounts] = useState(false)
	const theme = useTheme()

	// Add state for class types
	const [classTypes, setClassTypes] = useState<ClassType[]>([])
	const [loadingClassTypes, setLoadingClassTypes] = useState(false)
	// Add loading state specifically for filtering classes
	const [loadingFilteredClasses, setLoadingFilteredClasses] = useState(false)

	useEffect(() => {
		const fetchClassTypes = async () => {
			setLoadingClassTypes(true)
			try {
				const { data, error } = await supabase.from('class_types').select('*').order('name')

				if (error) throw error
				setClassTypes(data || [])

				// Fetch count of classes per type for the current teacher
				if (data && data.length > 0 && currentUser) {
					const countsByType: { [typeId: number]: number } = {}

					for (const type of data) {
						// First get level IDs for this type
						const { data: levelData } = await supabase
							.from('levels')
							.select('id')
							.eq('type_id', type.id)

						if (levelData && levelData.length > 0) {
							const levelIds = levelData.map(level => level.id)

							// Then count classes that match these level IDs and are assigned to this teacher
							const { count } = await supabase
								.from('classes')
								.select('*', { count: 'exact', head: true })
								.eq('teacherid', currentUser.id)
								.in('level_id', levelIds)

							countsByType[type.id] = count || 0
						} else {
							countsByType[type.id] = 0
						}
					}

					setClassCounts(countsByType)
				}
			} catch (error) {
				console.error('Error fetching class types:', error)
				toast.error('Failed to load class types')
			} finally {
				setLoadingClassTypes(false)
			}
		}

		if (currentUser) {
			fetchClassTypes()
		}
	}, [currentUser])

	useEffect(() => {
		const getUserData = async () => {
			try {
				const {
					data: { user },
					error: userError,
				} = await supabase.auth.getUser()

				if (userError) {
					console.error('Error fetching user:', userError)
					return
				}

				if (user) {
					setCurrentUser(user)
					loadClasses(user.id)
				} else {
					console.error('No authenticated user found')
				}
			} catch (err) {
				console.error('Error in getUserData:', err)
				toast.error('Could not fetch user data.')
			}
		}

		getUserData()
	}, [loadClasses])

	// Filter classes by selected class type when in classes view
	useEffect(() => {
		if (currentView === 'classes' && selectedClassType) {
			filterClassesByType(selectedClassType.id)
		}
	}, [currentView, selectedClassType, classes])

	// Filter classes by class type
	const filterClassesByType = async (classTypeId: number) => {
		try {
			setLoadingFilteredClasses(true)
			// First, get all level IDs for the selected class type
			const { data: levelData, error: levelError } = await supabase
				.from('levels')
				.select('id')
				.eq('type_id', classTypeId)

			if (levelError) throw levelError

			if (!levelData || levelData.length === 0) {
				setFilteredClasses([])
				setLoadingFilteredClasses(false)
				return
			}

			// Get level IDs as an array
			const levelIds = levelData.map(level => level.id)

			// Filter classes that have level_id in the array of level IDs
			const filteredClasses = classes.filter(cls => levelIds.includes(cls.level_id))

			// Apply search filter if needed
			const searchFiltered = searchQuery
				? filteredClasses.filter(cls =>
						cls.classname.toLowerCase().includes(searchQuery.toLowerCase())
				  )
				: filteredClasses

			setFilteredClasses(searchFiltered)
		} catch (error) {
			console.error('Error filtering classes by type:', error)
			toast.error('Error filtering classes')
			setFilteredClasses([])
		} finally {
			setLoadingFilteredClasses(false)
		}
	}

	useEffect(() => {
		// Apply search filter when search query changes
		if (currentView === 'classes' && selectedClassType) {
			filterClassesByType(selectedClassType.id)
		}
	}, [searchQuery])

	useEffect(() => {
		const fetchCounts = async () => {
			if (!classes || classes.length === 0) return

			setLoadingCounts(true)
			const counts: { [classId: string]: number | null } = {}
			const countPromises = classes.map(async classItem => {
				const { count, error } = await supabase
					.from('classstudents')
					.select('id', { count: 'exact', head: true })
					.eq('classid', classItem.id)
				return { classId: classItem.id, count: error ? null : count ?? 0 }
			})
			try {
				const results = await Promise.all(countPromises)
				results.forEach(result => {
					counts[result.classId] = result.count
				})
				setStudentCounts(counts)
			} catch (err) {
				console.error('Error fetching student counts:', err)
				classes.forEach(c => (counts[c.id] = null))
				setStudentCounts(counts)
			} finally {
				setLoadingCounts(false)
			}
		}

		if (!loadingClasses && classes.length > 0) fetchCounts()
	}, [classes, loadingClasses])

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

				const lessonCountPromises = subjectIds.map(async id => {
					const { count, error } = await supabase
						.from('lessons')
						.select('id', { count: 'exact', head: true })
						.eq('subjectid', id)
					return { subjectId: id, count: error ? 0 : count ?? 0 }
				})
				const lessonResults = await Promise.all(lessonCountPromises)
				const newLessonCounts: { [subjectId: string]: number } = {}
				lessonResults.forEach(res => {
					newLessonCounts[res.subjectId] = res.count
				})
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

	const handleClassTypeClick = (classType: ClassType) => {
		// Clear filtered classes first to prevent seeing previous classes
		setFilteredClasses([])
		setLoadingFilteredClasses(true)
		setSelectedClassType(classType)
		setCurrentView('classes')
		// Reset other selections
		setSelectedClassId(null)
		setSelectedClassName(null)
	}

	const handleClassClick = (classId: string, className: string) => {
		setSelectedClassId(classId)
		setSelectedClassName(className)
		setCurrentView('subjects')
		fetchSubjectsAndLessonCounts(classId)
	}

	const handleBackToClassTypes = () => {
		setCurrentView('class-types')
		setSelectedClassType(null)
		setFilteredClasses([])
		setSearchQuery('')
	}

	const handleBackToClasses = () => {
		setCurrentView('classes')
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

	// Generate a color for a class type based on its ID
	const getClassTypeColor = (id: number) => {
		const colors = [
			'#4F46E5', // Indigo
			'#0EA5E9', // Sky blue
			'#F59E0B', // Amber
			'#10B981', // Emerald
			'#8B5CF6', // Violet
			'#EC4899', // Pink
		]
		return colors[id % colors.length]
	}

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { staggerChildren: 0.08 },
		},
	}

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 },
	}

	const renderTitle = () => {
		switch (currentView) {
			case 'class-types':
				return 'My Classes'
			case 'classes':
				return selectedClassType ? `${selectedClassType.name} Classes` : 'Classes'
			case 'subjects':
				return selectedClassName ? `${selectedClassName} - Subjects` : 'Subjects'
			default:
				return 'My Classes'
		}
	}

	const renderSubtitle = () => {
		switch (currentView) {
			case 'class-types':
				return 'Select a class type to manage your classes'
			case 'classes':
				return selectedClassType
					? `View your ${selectedClassType.name.toLowerCase()} classes`
					: 'Manage your classes'
			case 'subjects':
				return 'Manage subjects and lessons for this class'
			default:
				return 'Manage your classes, subjects, and lessons'
		}
	}

	const renderBackButton = () => {
		switch (currentView) {
			case 'classes':
				return (
					<StyledBackButton onClick={handleBackToClassTypes}>
						<FiArrowLeft /> Back to Class Types
					</StyledBackButton>
				)
			case 'subjects':
				return (
					<StyledBackButton onClick={handleBackToClasses}>
						<FiArrowLeft /> Back to Classes
					</StyledBackButton>
				)
			default:
				return null
		}
	}

	return (
		<PageContainer>
			<PageHeader layout>
				<HeaderTitleSection>
					<PageTitle>{renderTitle()}</PageTitle>
					<PageSubtitle>{renderSubtitle()}</PageSubtitle>
				</HeaderTitleSection>
				<HeaderControls>
					{currentView === 'classes' && (
						<SearchInputContainer>
							<FiSearch size={18} />
							<SearchInputStyled
								type='text'
								placeholder='Search classes...'
								value={searchQuery}
								onChange={handleSearchChange}
							/>
						</SearchInputContainer>
					)}
				</HeaderControls>
			</PageHeader>

			{renderBackButton()}

			<AnimatePresence mode='wait'>
				{currentView === 'class-types' && (
					<motion.div
						key='class-types-view'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						{loadingClassTypes ? (
							<LoadingState>Loading class types...</LoadingState>
						) : classTypes.length > 0 ? (
							<ContentGrid variants={containerVariants} initial='hidden' animate='visible'>
								{classTypes.map(classType => {
									const color = getClassTypeColor(classType.id)
									return (
										<ClassTypeCard
											key={classType.id}
											variants={itemVariants}
											onClick={() => handleClassTypeClick(classType)}
											$color={color}
										>
											<CardBody>
												<CardTitle>{classType.name}</CardTitle>
												<CardDescription>
													Manage all your {classType.name.toLowerCase()} classes
												</CardDescription>
												<CardFooter>
													<CardStat>
														<FiFolder />
														<span>{classCounts[classType.id] || 0} Classes</span>
													</CardStat>
													<ViewDetailsButton>
														View Classes <FiChevronRight />
													</ViewDetailsButton>
												</CardFooter>
											</CardBody>
										</ClassTypeCard>
									)
								})}
							</ContentGrid>
						) : (
							<EmptyState>
								<FiFolder
									size={48}
									style={{ marginBottom: '1rem', color: theme.colors.text.tertiary }}
								/>
								<PageTitle style={{ fontSize: '1.2rem' }}>No class types found</PageTitle>
								<PageSubtitle style={{ maxWidth: '300px', margin: '0 auto' }}>
									There are no class types configured in the system.
								</PageSubtitle>
							</EmptyState>
						)}
					</motion.div>
				)}

				{currentView === 'classes' && (
					<motion.div
						key='classes-view'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						{loadingClasses || loadingCounts || loadingFilteredClasses ? (
							<LoadingState>Loading classes...</LoadingState>
						) : filteredClasses.length > 0 ? (
							<ContentGrid variants={containerVariants} initial='hidden' animate='visible'>
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
															: `${studentCounts[classItem.id]} Student${
																	studentCounts[classItem.id] !== 1 ? 's' : ''
															  }`}
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
								<FiFolder
									size={48}
									style={{ marginBottom: '1rem', color: theme.colors.text.tertiary }}
								/>
								<PageTitle style={{ fontSize: '1.2rem' }}>No classes found</PageTitle>
								<PageSubtitle style={{ maxWidth: '300px', margin: '0 auto' }}>
									{searchQuery
										? `No classes match your search "${searchQuery}".`
										: selectedClassType
										? `You don't have any ${selectedClassType.name.toLowerCase()} classes assigned.`
										: 'You are not currently assigned to any classes.'}
								</PageSubtitle>
							</EmptyState>
						)}
					</motion.div>
				)}

				{currentView === 'subjects' && (
					<motion.div
						key='subjects-view'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						{loadingSubjects ? (
							<LoadingState>Loading subjects...</LoadingState>
						) : subjects.length > 0 ? (
							<ContentGrid variants={containerVariants} initial='hidden' animate='visible'>
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
				)}
			</AnimatePresence>
		</PageContainer>
	)
}

export default TeacherClasses
