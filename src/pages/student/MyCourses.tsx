import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import {
	FiAlertCircle,
	FiArrowLeft,
	FiBook,
	FiChevronRight,
	FiClock,
	FiFolder,
	FiSearch,
	FiUser,
} from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import supabase from '../../config/supabaseClient'
import { useAuth, User } from '../../contexts/AuthContext'

// View state to track which view we're on
type ViewState = 'class-types' | 'classes' | 'subjects'

// Interface for class type data
interface ClassType {
	id: number
	name: string
	created_at: string
}

// Interface for class data
interface Class {
	id: string
	classname: string
	description?: string
	level_id?: string
	level_type_id?: number
	levels?: {
		id: string
		type_id: number
		name: string
	}
	levelName?: string
}

// Interface for subject data
interface Subject {
	id: string
	subjectname: string
	code: string | null
	description: string | null
	status: string
	createdat: string
	teacher?: {
		firstName: string
		lastName: string
	} | null
	progress?: number
}

const MyCourses: React.FC = () => {
	const { t } = useTranslation()
	const [searchTerm, setSearchTerm] = useState('')
	const [classTypeSearchTerm, setClassTypeSearchTerm] = useState('')
	const [classSearchTerm, setClassSearchTerm] = useState('')
	const [activeTab, setActiveTab] = useState('all')
	const [subjects, setSubjects] = useState<Subject[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const { user }: { user: User | null } = useAuth()

	// New state for class types view
	const [currentView, setCurrentView] = useState<ViewState>('class-types')
	const [classTypes, setClassTypes] = useState<ClassType[]>([])
	const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([])
	const [classTypeClasses, setClassTypeClasses] = useState<Class[]>([])
	const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null)
	const [selectedClass, setSelectedClass] = useState<Class | null>(null)
	const [loadingClassTypes, setLoadingClassTypes] = useState(true)
	const [loadingClasses, setLoadingClasses] = useState(false)
	const [loadingSubjects, setLoadingSubjects] = useState(false)

	// Generate a random progress value for each subject (in a real app, this would come from the database)
	const generateRandomProgress = () => {
		return Math.floor(Math.random() * 101)
	}

	// Fetch class types from Supabase
	useEffect(() => {
		const fetchClassTypes = async () => {
			if (!user?.id) {
				setError('User not authenticated')
				setLoadingClassTypes(false)
				return
			}

			try {
				setLoadingClassTypes(true)
				setError(null)

				const { data, error: classTypesError } = await supabase
					.from('class_types')
					.select('*')
					.order('id')

				if (classTypesError) {
					console.error('Error fetching class types:', classTypesError)
					throw new Error('Failed to fetch class types')
				}

				if (data && data.length > 0) {
					setClassTypes(data)
				} else {
					setClassTypes([])
				}
			} catch (error) {
				console.error('Error fetching class types data:', error)
				setError('Failed to load class types. Please try again later.')
				toast.error('Failed to load class types')
			} finally {
				setLoadingClassTypes(false)
			}
		}

		fetchClassTypes()
	}, [user])

	// Fetch student enrolled classes
	useEffect(() => {
		const fetchEnrolledClasses = async () => {
			if (!user?.id) return

			try {
				// Find the classes the student is enrolled in
				const { data: enrollments, error: enrollmentError } = await supabase
					.from('classstudents')
					.select('classid')
					.eq('studentid', user.id)

				if (enrollmentError) {
					console.error('Error fetching student enrollments:', enrollmentError)
					return
				}

				if (!enrollments || enrollments.length === 0) {
					setEnrolledClasses([])
					return
				}

				// Get array of class IDs the student is enrolled in
				const classIds = enrollments.map(enrollment => enrollment.classid)

				// Fetch classes with their levels to get type_id
				const { data: classes, error: classesError } = await supabase
					.from('classes')
					.select(
						`
						id,
						classname,
						description,
						level_id,
						levels (
							id,
							type_id,
							name
						)
					`
					)
					.in('id', classIds)

				if (classesError) {
					console.error('Error fetching enrolled classes:', classesError)
					return
				}

				if (classes && classes.length > 0) {
					// Add level_type_id to each class for easier filtering
					const processedClasses = classes.map((classItem: any) => {
						return {
							...classItem,
							level_type_id: classItem.levels?.type_id || null,
							levelName: classItem.levels?.name || '',
						}
					})

					console.log('Processed classes with level types:', processedClasses)
					setEnrolledClasses(processedClasses)
				} else {
					setEnrolledClasses([])
				}
			} catch (error) {
				console.error('Error fetching enrolled classes:', error)
			}
		}

		fetchEnrolledClasses()
	}, [user])

	// Handle class type selection
	const handleSelectClassType = (classType: ClassType) => {
		setSelectedClassType(classType)
		setCurrentView('classes')
		setLoadingClasses(true)

		// Filter classes that belong to this class type
		const filteredClasses = enrolledClasses.filter(
			classItem => classItem.level_type_id === classType.id
		)
		setClassTypeClasses(filteredClasses)
		setLoadingClasses(false)
	}

	// Handle class selection
	const handleSelectClass = async (classItem: Class) => {
		setSelectedClass(classItem)
		setCurrentView('subjects')
		loadSubjectsForClass(classItem.id)
	}

	// Get class type name for a class
	const getClassTypeName = (classItem: Class) => {
		if (!classItem.level_type_id) return ''

		const classType = classTypes.find(type => type.id === classItem.level_type_id)
		return classType ? classType.name : ''
	}

	// Navigate back
	const handleBack = () => {
		if (currentView === 'subjects') {
			setCurrentView('classes')
			setSelectedClass(null)
		} else if (currentView === 'classes') {
			setCurrentView('class-types')
			setSelectedClassType(null)
		}
	}

	// Load subjects for a selected class
	const loadSubjectsForClass = async (classId: string) => {
		if (!user?.id) return

		try {
			setLoadingSubjects(true)
			setError(null)

			// Get subjects for the selected class
			const { data: classSubjects, error: subjectsError } = await supabase
				.from('classsubjects')
				.select('*, subjects(*)')
				.eq('classid', classId)

			if (subjectsError) {
				console.error('Error fetching class subjects:', subjectsError)
				throw new Error('Failed to fetch subject information')
			}

			// Process and set the subjects data
			if (classSubjects && classSubjects.length > 0) {
				const processedSubjects = classSubjects
					.filter(item => item.subjects) // Ensure subject data exists
					.map((item: any) => {
						const subject = item.subjects
						// Add random progress for demonstration
						return {
							...subject,
							progress: generateRandomProgress(),
						}
					})

				console.log('Fetched subjects:', processedSubjects)
				setSubjects(processedSubjects)
			} else {
				console.log('No subjects found for this class')
				setSubjects([])
			}
		} catch (error) {
			console.error('Error fetching subject data:', error)
			setError('Failed to load courses. Please try again later.')
			toast.error('Failed to load your courses')
		} finally {
			setLoadingSubjects(false)
		}
	}

	// Filter subjects based on active tab and search term
	const filteredSubjects = subjects.filter(subject => {
		const matchesSearch = subject.subjectname.toLowerCase().includes(searchTerm.toLowerCase())

		if (activeTab === 'all') {
			return matchesSearch
		} else if (activeTab === 'inProgress') {
			return matchesSearch && subject.progress && subject.progress < 100
		} else if (activeTab === 'completed') {
			return matchesSearch && subject.progress && subject.progress === 100
		}

		return matchesSearch
	})

	// Filter class types based on search term
	const filteredClassTypes = classTypes.filter(classType =>
		classType.name.toLowerCase().includes(classTypeSearchTerm.toLowerCase())
	)

	// Filter classes based on search term
	const filteredClasses = classTypeClasses.filter(classItem =>
		classItem.classname.toLowerCase().includes(classSearchTerm.toLowerCase())
	)

	// Get status for the subject based on progress
	const getSubjectStatus = (progress: number | undefined) => {
		if (!progress && progress !== 0) return 'unknown'
		if (progress === 100) return 'completed'
		if (progress >= 1) return 'inProgress'
		return 'notStarted'
	}

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'inProgress':
				return 'In Progress'
			case 'completed':
				return 'Completed'
			case 'notStarted':
				return 'Not Started'
			default:
				return 'Unknown'
		}
	}

	// Get a consistent color for a class type
	const getClassTypeColor = (id: number) => {
		const colors = ['primary', 'warning', 'danger', 'success', 'purple', 'teal', 'indigo']
		const index = id % colors.length
		return colors[index]
	}

	// Get a consistent color for a class
	const getClassColor = (id: string) => {
		const colors = ['primary', 'warning', 'danger', 'success', 'purple', 'teal', 'indigo']

		// Simple hash function to get a consistent color for the same ID
		let hash = 0
		for (let i = 0; i < id.length; i++) {
			hash = id.charCodeAt(i) + ((hash << 5) - hash)
		}

		const index = Math.abs(hash) % colors.length
		return colors[index]
	}

	// Get the page title based on current view
	const getPageTitle = () => {
		if (currentView === 'class-types') return t('student.courses.myClasses')
		if (currentView === 'classes' && selectedClassType) return t('student.courses.classTypeClasses', { type: selectedClassType.name })
		if (currentView === 'subjects' && selectedClass) return t('student.courses.classSubjects', { className: selectedClass.classname })
		return t('student.courses.title')
	}

	// Get the page description based on current view
	const getPageDescription = () => {
		if (currentView === 'class-types') return t('student.courses.selectClassType')
		if (currentView === 'classes') return t('student.courses.selectClass')
		if (currentView === 'subjects') return t('student.courses.manageSubjects')
		return t('student.courses.subtitle')
	}

	// Show loading spinner based on current view
	const isViewLoading = () => {
		if (currentView === 'class-types') return loadingClassTypes
		if (currentView === 'classes') return loadingClasses
		if (currentView === 'subjects') return loadingSubjects
		return isLoading
	}

	return (
		<PageContainer
			as={motion.div}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			<PageHeader>
				<HeaderContent>
					{currentView !== 'class-types' && (
						<BackButton onClick={handleBack}>
							<FiArrowLeft /> {t('student.courses.back')}
						</BackButton>
					)}
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.1 }}
					>
						<PageTitle>{getPageTitle()}</PageTitle>
						<PageDescription>{getPageDescription()}</PageDescription>
					</motion.div>
				</HeaderContent>

				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.2 }}
				>
					<FilterSection>
						<SearchContainer>
							<SearchIcon>
								<FiSearch />
							</SearchIcon>
							{currentView === 'class-types' && (
								<SearchInput
									type='text'
									placeholder={t('student.courses.searchClassTypes')}
									value={classTypeSearchTerm}
									onChange={e => setClassTypeSearchTerm(e.target.value)}
								/>
							)}
							{currentView === 'classes' && (
								<SearchInput
									type='text'
									placeholder={t('student.courses.searchClasses')}
									value={classSearchTerm}
									onChange={e => setClassSearchTerm(e.target.value)}
								/>
							)}
							{currentView === 'subjects' && (
								<SearchInput
									type='text'
									placeholder={t('student.courses.searchSubjects')}
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
								/>
							)}
						</SearchContainer>
					</FilterSection>
				</motion.div>
			</PageHeader>

			{isViewLoading() ? (
				<LoadingContainer>
					<LoadingSpinner />
					<LoadingText>
						{currentView === 'class-types'
							? t('student.courses.loadingClassTypes')
							: currentView === 'classes'
							? t('student.courses.loadingClasses')
							: t('student.courses.loadingSubjects')}
					</LoadingText>
				</LoadingContainer>
			) : error ? (
				<ErrorContainer>
					<ErrorIcon>
						<FiAlertCircle />
					</ErrorIcon>
					<ErrorMessage>{error}</ErrorMessage>
					<RetryButton onClick={() => window.location.reload()}>{t('student.courses.tryAgain')}</RetryButton>
				</ErrorContainer>
			) : currentView === 'class-types' ? (
				<>
					{classTypes.length === 0 ? (
						<EmptyStateContainer>
							<EmptyIcon>
								<FiFolder size={50} />
							</EmptyIcon>
							<EmptyTitle>{t('student.courses.noClassTypesAvailable')}</EmptyTitle>
							<EmptyDescription>
								{t('student.courses.noClassTypesConfigured')}
							</EmptyDescription>
						</EmptyStateContainer>
					) : filteredClassTypes.length === 0 ? (
						<EmptyStateContainer>
							<EmptyIcon>
								<FiFolder size={50} />
							</EmptyIcon>
							<EmptyTitle>{t('student.courses.noClassTypesFound')}</EmptyTitle>
							<EmptyDescription>
								{t('student.courses.noClassTypesMatching', { search: classTypeSearchTerm })}
							</EmptyDescription>
						</EmptyStateContainer>
					) : (
						<>
							<ResultCount>
								{t('student.courses.showingResults', { 
									count: filteredClassTypes.length, 
									type: filteredClassTypes.length === 1 ? t('student.courses.classType') : t('student.courses.classTypes')
								})}
							</ResultCount>
							<ClassTypeGrid>
								{filteredClassTypes.map((classType, index) => (
									<ClassTypeCard
										key={classType.id}
										as={motion.div}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3, delay: 0.1 * index }}
										whileHover={{
											y: -5,
											boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
											transition: { duration: 0.2 },
										}}
										onClick={() => handleSelectClassType(classType)}
									>
										<ClassTypeCardTop $color={getClassTypeColor(classType.id)}>
											<ClassTypeName>{classType.name}</ClassTypeName>
											<ClassTypeDescription>
												{t('student.courses.viewClassTypeClasses', { type: classType.name.toLowerCase() })}
											</ClassTypeDescription>
										</ClassTypeCardTop>
										<ClassTypeCardBody>
											<ClassTypeCardFooter>
												<ClassTypeButton $color={getClassTypeColor(classType.id)}>
													{t('student.courses.viewClasses')} <FiChevronRight />
												</ClassTypeButton>
											</ClassTypeCardFooter>
										</ClassTypeCardBody>
									</ClassTypeCard>
								))}
							</ClassTypeGrid>
						</>
					)}
				</>
			) : currentView === 'classes' ? (
				<>
					{classTypeClasses.length === 0 ? (
						<EmptyStateContainer>
							<EmptyIcon>
								<FiBook size={50} />
							</EmptyIcon>
							<EmptyTitle>{t('student.courses.noClassesFound')}</EmptyTitle>
							<EmptyDescription>
								{t('student.courses.notEnrolledInClasses', { type: selectedClassType?.name.toLowerCase() })}
							</EmptyDescription>
						</EmptyStateContainer>
					) : filteredClasses.length === 0 ? (
						<EmptyStateContainer>
							<EmptyIcon>
								<FiBook size={50} />
							</EmptyIcon>
							<EmptyTitle>{t('student.courses.noClassesFound')}</EmptyTitle>
							<EmptyDescription>
								{t('student.courses.noClassesMatching', { search: classSearchTerm })}
							</EmptyDescription>
						</EmptyStateContainer>
					) : (
						<>
							<ResultCount>
								{t('student.courses.showingResults', { 
									count: filteredClasses.length, 
									type: filteredClasses.length === 1 ? t('student.courses.class') : t('student.courses.classes')
								})}
							</ResultCount>
							<ClassGrid>
								{filteredClasses.map((classItem, index) => (
									<ClassCard
										key={classItem.id}
										as={motion.div}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3, delay: 0.1 * index }}
										whileHover={{
											y: -5,
											boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
											transition: { duration: 0.2 },
										}}
										onClick={() => handleSelectClass(classItem)}
									>
										<ClassCardTop $color={getClassColor(classItem.id)}>
											<ClassName>{classItem.classname}</ClassName>
											<BadgeContainer>
												{classItem.levelName && (
													<LevelBadge>{t('student.courses.level')}: {classItem.levelName}</LevelBadge>
												)}
												{getClassTypeName(classItem) && (
													<TypeBadge>{getClassTypeName(classItem)}</TypeBadge>
												)}
											</BadgeContainer>
											<ClassDescription>
												{classItem.description || t('student.courses.viewSubjectsFor', { className: classItem.classname })}
											</ClassDescription>
										</ClassCardTop>
										<ClassCardBody>
											<ClassCardFooter>
												<ClassButton $color={getClassColor(classItem.id)}>
													{t('student.courses.viewSubjects')} <FiChevronRight />
												</ClassButton>
											</ClassCardFooter>
										</ClassCardBody>
									</ClassCard>
								))}
							</ClassGrid>
						</>
					)}
				</>
			) : filteredSubjects.length === 0 ? (
				<EmptyStateContainer>
					<EmptyIcon>
						<FiBook size={50} />
					</EmptyIcon>
					<EmptyTitle>{t('student.courses.noSubjectsFound')}</EmptyTitle>
					<EmptyDescription>
						{searchTerm
							? t('student.courses.noSubjectsMatching', { search: searchTerm })
							: activeTab !== 'all'
							? t('student.courses.noSubjectsInStatus', { status: activeTab === 'inProgress' ? t('student.courses.inProgress') : t('student.courses.completed') })
							: t('student.courses.classHasNoSubjects')}
					</EmptyDescription>
				</EmptyStateContainer>
			) : (
				<>
					<ResultCount>
						{t('student.courses.showingResults', { 
							count: filteredSubjects.length, 
							type: filteredSubjects.length === 1 ? t('student.courses.subject') : t('student.courses.subjects')
						})}
					</ResultCount>

					<CourseGrid>
						{filteredSubjects.map((subject, index) => {
							const status = getSubjectStatus(subject.progress)
							const color = getClassColor(subject.id)

							return (
								<CourseCard
									key={subject.id}
									as={motion.div}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3, delay: 0.1 * index }}
									whileHover={{
										y: -5,
										boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
										transition: { duration: 0.2 },
									}}
								>
									<CourseCardTop $color={color}>
										<CourseName>{subject.subjectname}</CourseName>
										<CourseDescription>
											{subject.description || t('student.courses.subjectCurriculum', { subject: subject.subjectname })}
										</CourseDescription>
									</CourseCardTop>

									<CourseCardBody>
										{subject.teacher && (
											<CourseTeacher>
												<TeacherAvatar>
													<FiUser />
												</TeacherAvatar>
												<span>{`${subject.teacher.firstName || ''} ${
													subject.teacher.lastName || ''
												}`}</span>
											</CourseTeacher>
										)}

										<CourseFooter>
											<CourseMetadata>
												<MetadataItem>
													<FiClock />
													<span>{subject.code || t('student.courses.noCode')}</span>
												</MetadataItem>
											</CourseMetadata>

											<ViewCourseLink to={`/student/course/${subject.id}`} $color={color}>
												{t('student.courses.viewCourse')} <FiChevronRight />
											</ViewCourseLink>
										</CourseFooter>
									</CourseCardBody>
								</CourseCard>
							)
						})}
					</CourseGrid>
				</>
			)}
		</PageContainer>
	)
}

// Styled Components

// Loading components
const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 300px;
	width: 100%;
	padding: 2rem;
`

const LoadingSpinner = styled.div`
	width: 50px;
	height: 50px;
	border: 3px solid rgba(0, 0, 0, 0.1);
	border-radius: 50%;
	border-top-color: ${props => props.theme.colors.primary[500]};
	animation: spin 1s ease-in-out infinite;
	margin-bottom: 1rem;

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
`

const LoadingText = styled.p`
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
	text-align: center;
`

// Error components
const ErrorContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 300px;
	width: 100%;
	padding: 2rem;
	text-align: center;
`

const ErrorIcon = styled.div`
	font-size: 3rem;
	color: ${props => props.theme.colors.danger[500]};
	margin-bottom: 1rem;
`

const ErrorMessage = styled.p`
	font-size: 1.1rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: 1.5rem;
	max-width: 500px;
`

const RetryButton = styled.button`
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	border: none;
	border-radius: 4px;
	padding: 0.5rem 1.5rem;
	font-size: 1rem;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background-color: ${props => props.theme.colors.primary[600]};
	}
`

// Empty state components
const EmptyStateContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 300px;
	width: 100%;
	padding: 2rem;
	text-align: center;
`

const EmptyIcon = styled.div`
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: 1.5rem;
	opacity: 0.7;
`

const EmptyTitle = styled.h3`
	font-size: 1.5rem;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: 0.5rem;
`

const EmptyDescription = styled.p`
	font-size: 1.1rem;
	color: ${props => props.theme.colors.text.secondary};
	max-width: 400px;
`

const PageContainer = styled.div`
	padding: 1.5rem;
	max-width: 1400px;
	margin: 0 auto;
`

const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
	flex-wrap: wrap;
	gap: 1rem;

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: flex-start;
	}
`

const HeaderContent = styled.div`
	display: flex;
	flex-direction: column;
`

const PageTitle = styled.h1`
	font-size: 1.8rem;
	font-weight: 600;
	margin: 0;
	color: ${props => props.theme.colors.text.primary};
`

const PageDescription = styled.p`
	color: ${props => props.theme.colors.text.secondary};
	margin: 0.5rem 0 0 0;
`

const FilterSection = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;

	@media (max-width: 768px) {
		width: 100%;
	}
`

const SearchContainer = styled.div`
	position: relative;
	width: 300px;

	@media (max-width: 768px) {
		width: 100%;
	}
`

const SearchIcon = styled.div`
	position: absolute;
	left: 1rem;
	top: 50%;
	transform: translateY(-50%);
	color: ${props => props.theme.colors.text.secondary};
`

const SearchInput = styled.input`
	width: 100%;
	padding: 0.75rem 1rem 0.75rem 2.5rem;
	border-radius: 0.5rem;
	border: 1px solid ${props => props.theme.colors.border.light};
	background-color: ${props => props.theme.colors.background.primary};
	color: ${props => props.theme.colors.text.primary};

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[400]};
		box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
	}
`

const TabsContainer = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 1.5rem;
	overflow-x: auto;
	padding-bottom: 0.25rem;

	@media (max-width: 576px) {
		justify-content: space-between;
	}
`

interface TabButtonProps {
	$isActive: boolean
}

const TabButton = styled.button<TabButtonProps>`
	padding: 0.5rem 1rem;
	border-radius: 0.375rem;
	background-color: ${props => (props.$isActive ? props.theme.colors.primary[50] : 'transparent')};
	color: ${props =>
		props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.text.secondary};
	border: 1px solid ${props => (props.$isActive ? props.theme.colors.primary[200] : 'transparent')};
	font-weight: ${props => (props.$isActive ? 600 : 400)};
	cursor: pointer;
	white-space: nowrap;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props =>
			props.$isActive ? props.theme.colors.primary[50] : props.theme.colors.background.hover};
	}
`

const ResultCount = styled.div`
	color: ${props => props.theme.colors.text.secondary};
	margin-bottom: 1.5rem;
	font-size: 0.9rem;
`

const CourseGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 1.5rem;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`

const CourseCard = styled.div`
	border-radius: 0.5rem;
	overflow: hidden;
	background-color: ${props => props.theme.colors.background.primary};
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	transition: all 0.3s ease;
	height: 100%;
	display: flex;
	flex-direction: column;
`

interface ColorProps {
	$color: string
}

const CourseCardTop = styled.div<ColorProps>`
	padding: 1.5rem;
	position: relative;
	background: ${props => {
		const colorMap: Record<string, string> = {
			primary: props.theme.colors.primary[500],
			warning: props.theme.colors.warning[500],
			danger: props.theme.colors.danger[500],
			success: props.theme.colors.success[500],
			purple: '#8B5CF6',
			teal: '#14B8A6',
			indigo: '#6366F1',
		}
		return colorMap[props.$color] || props.theme.colors.primary[500]
	}};
	color: white;
`

interface StatusProps {
	$status: string
}

const CourseStatus = styled.div<StatusProps>`
	position: absolute;
	top: 1rem;
	right: 1rem;
	padding: 0.25rem 0.75rem;
	border-radius: 1rem;
	font-size: 0.75rem;
	font-weight: 600;
	background-color: rgba(255, 255, 255, 0.2);
	color: white;
	display: flex;
	align-items: center;
	gap: 0.25rem;

	&::before {
		content: '';
		display: ${props => (props.$status === 'completed' ? 'block' : 'none')};
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background-color: ${props =>
			props.$status === 'completed'
				? '#10B981'
				: props.$status === 'inProgress'
				? '#F59E0B'
				: '#EF4444'};
	}
`

const CourseName = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 0.75rem 0;
	color: white;
`

const CourseDescription = styled.p`
	font-size: 0.875rem;
	margin: 0;
	line-height: 1.4;
	opacity: 0.9;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
`

const CourseCardBody = styled.div`
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	flex: 1;
	background-color: ${props => props.theme.colors.background.primary};
`

const CourseTeacher = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1.25rem;
	color: ${props => props.theme.colors.text.primary};
	font-weight: 500;
`

const TeacherAvatar = styled.div`
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.background.secondary};
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${props => props.theme.colors.primary[500]};
`

const ProgressSection = styled.div`
	margin-bottom: 1.5rem;
`

const ProgressLabel = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.secondary};
`

const ProgressBar = styled.div`
	height: 0.5rem;
	width: 100%;
	background-color: ${props => props.theme.colors.background.tertiary};
	border-radius: 1rem;
	overflow: hidden;
	margin-bottom: 0.25rem;
`

interface ProgressProps {
	$progress: number
	$status?: string
}

const ProgressFill = styled.div<ProgressProps>`
	height: 100%;
	width: ${props => `${props.$progress}%`};
	background-color: ${props => {
		if (props.$status === 'completed') return props.theme.colors.success[500]
		if (props.$progress >= 50) return props.theme.colors.primary[500]
		return props.theme.colors.warning[500]
	}};
	border-radius: 1rem;
	transition: width 0.5s ease;
`

const ProgressValue = styled.div`
	font-size: 0.75rem;
	color: ${props => props.theme.colors.text.secondary};
	text-align: right;
`

const CourseFooter = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: auto;
`

const CourseMetadata = styled.div`
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 0.5rem;
`

const MetadataItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.8125rem;
	color: ${props => props.theme.colors.text.secondary};

	svg {
		color: ${props => props.theme.colors.text.secondary};
		opacity: 0.7;
	}
`

const ViewCourseLink = styled(Link)<ColorProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem;
	border-radius: 0.375rem;
	background-color: ${props => {
		const colorMap: Record<string, string> = {
			primary: props.theme.colors.primary[50],
			warning: props.theme.colors.warning[50],
			danger: props.theme.colors.danger[50],
			success: props.theme.colors.success[50],
			purple: '#F3E8FF',
			teal: '#CCFBF1',
			indigo: '#EEF2FF',
		}
		return colorMap[props.$color] || props.theme.colors.primary[50]
	}};
	color: ${props => {
		const colorMap: Record<string, string> = {
			primary: props.theme.colors.primary[700],
			warning: props.theme.colors.warning[700],
			danger: props.theme.colors.danger[700],
			success: props.theme.colors.success[700],
			purple: '#7E22CE',
			teal: '#0F766E',
			indigo: '#4338CA',
		}
		return colorMap[props.$color] || props.theme.colors.primary[700]
	}};
	font-weight: 500;
	text-decoration: none;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => {
			const colorMap: Record<string, string> = {
				primary: props.theme.colors.primary[100],
				warning: props.theme.colors.warning[100],
				danger: props.theme.colors.danger[100],
				success: props.theme.colors.success[100],
				purple: '#DDD6FE',
				teal: '#99F6E4',
				indigo: '#C7D2FE',
			}
			return colorMap[props.$color] || props.theme.colors.primary[100]
		}};
	}

	svg {
		font-size: 1rem;
	}
`

const BackButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background-color: transparent;
	color: ${props => props.theme.colors.primary[500]};
	border: 1px solid ${props => props.theme.colors.primary[200]};
	border-radius: 4px;
	padding: 0.5rem 1rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	margin-bottom: 1rem;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.primary[50]};
		color: ${props => props.theme.colors.primary[600]};
	}

	svg {
		font-size: 1rem;
	}
`

const ClassTypeGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 1.5rem;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`

const ClassTypeCard = styled.div`
	border-radius: 0.5rem;
	overflow: hidden;
	background-color: ${props => props.theme.colors.background.primary};
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	transition: all 0.3s ease;
	height: 100%;
	display: flex;
	flex-direction: column;
	cursor: pointer;
`

const ClassTypeCardTop = styled.div<ColorProps>`
	padding: 1.5rem;
	background: ${props => {
		const colorMap: Record<string, string> = {
			primary: props.theme.colors.primary[500],
			warning: props.theme.colors.warning[500],
			danger: props.theme.colors.danger[500],
			success: props.theme.colors.success[500],
			purple: '#8B5CF6',
			teal: '#14B8A6',
			indigo: '#6366F1',
		}
		return colorMap[props.$color] || props.theme.colors.primary[500]
	}};
	color: white;
`

const ClassTypeCardBody = styled.div`
	padding: 1.5rem;
`

const ClassTypeCardFooter = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`

const ClassTypeButton = styled.button<ColorProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem;
	border-radius: 0.375rem;
	background-color: ${props => {
		const colorMap: Record<string, string> = {
			primary: props.theme.colors.primary[50],
			warning: props.theme.colors.warning[50],
			danger: props.theme.colors.danger[50],
			success: props.theme.colors.success[50],
			purple: '#F3E8FF',
			teal: '#CCFBF1',
			indigo: '#EEF2FF',
		}
		return colorMap[props.$color] || props.theme.colors.primary[50]
	}};
	color: ${props => {
		const colorMap: Record<string, string> = {
			primary: props.theme.colors.primary[700],
			warning: props.theme.colors.warning[700],
			danger: props.theme.colors.danger[700],
			success: props.theme.colors.success[700],
			purple: '#7E22CE',
			teal: '#0F766E',
			indigo: '#4338CA',
		}
		return colorMap[props.$color] || props.theme.colors.primary[700]
	}};
	border: none;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => {
			const colorMap: Record<string, string> = {
				primary: props.theme.colors.primary[100],
				warning: props.theme.colors.warning[100],
				danger: props.theme.colors.danger[100],
				success: props.theme.colors.success[100],
				purple: '#DDD6FE',
				teal: '#99F6E4',
				indigo: '#C7D2FE',
			}
			return colorMap[props.$color] || props.theme.colors.primary[100]
		}};
	}

	svg {
		font-size: 1rem;
	}
`

const ClassTypeIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1.5rem;
	background: ${props => props.theme.colors.primary[500]};
	color: white;
`

const ClassTypeName = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 0.75rem 0;
	color: white;
`

const ClassTypeDescription = styled.p`
	font-size: 0.875rem;
	margin: 0;
	line-height: 1.4;
	color: white;
	opacity: 0.9;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
`

const ClassGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 1.5rem;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`

const ClassCard = styled.div`
	border-radius: 0.5rem;
	overflow: hidden;
	background-color: ${props => props.theme.colors.background.primary};
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	transition: all 0.3s ease;
	height: 100%;
	display: flex;
	flex-direction: column;
	cursor: pointer;
`

const ClassCardTop = styled.div<ColorProps>`
	padding: 1.5rem;
	background: ${props => {
		const colorMap: Record<string, string> = {
			primary: props.theme.colors.primary[500],
			warning: props.theme.colors.warning[500],
			danger: props.theme.colors.danger[500],
			success: props.theme.colors.success[500],
			purple: '#8B5CF6',
			teal: '#14B8A6',
			indigo: '#6366F1',
		}
		return colorMap[props.$color] || props.theme.colors.primary[500]
	}};
	color: white;
`

const ClassCardBody = styled.div`
	padding: 1.5rem;
`

const ClassCardFooter = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`

const ClassButton = styled.button<ColorProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem;
	border-radius: 0.375rem;
	background-color: ${props => {
		const colorMap: Record<string, string> = {
			primary: props.theme.colors.primary[50],
			warning: props.theme.colors.warning[50],
			danger: props.theme.colors.danger[50],
			success: props.theme.colors.success[50],
			purple: '#F3E8FF',
			teal: '#CCFBF1',
			indigo: '#EEF2FF',
		}
		return colorMap[props.$color] || props.theme.colors.primary[50]
	}};
	color: ${props => {
		const colorMap: Record<string, string> = {
			primary: props.theme.colors.primary[700],
			warning: props.theme.colors.warning[700],
			danger: props.theme.colors.danger[700],
			success: props.theme.colors.success[700],
			purple: '#7E22CE',
			teal: '#0F766E',
			indigo: '#4338CA',
		}
		return colorMap[props.$color] || props.theme.colors.primary[700]
	}};
	border: none;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => {
			const colorMap: Record<string, string> = {
				primary: props.theme.colors.primary[100],
				warning: props.theme.colors.warning[100],
				danger: props.theme.colors.danger[100],
				success: props.theme.colors.success[100],
				purple: '#DDD6FE',
				teal: '#99F6E4',
				indigo: '#C7D2FE',
			}
			return colorMap[props.$color] || props.theme.colors.primary[100]
		}};
	}

	svg {
		font-size: 1rem;
	}
`

const ClassName = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 0.75rem 0;
	color: white;
`

const ClassDescription = styled.p`
	font-size: 0.875rem;
	margin: 0;
	line-height: 1.4;
	color: white;
	opacity: 0.9;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
`

const BadgeContainer = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-bottom: 0.75rem;
`

const LevelBadge = styled.div`
	display: inline-block;
	background-color: rgba(255, 255, 255, 0.2);
	color: white;
	font-size: 0.75rem;
	font-weight: 500;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
`

const TypeBadge = styled.div`
	display: inline-block;
	background-color: rgba(255, 255, 255, 0.3);
	color: white;
	font-size: 0.75rem;
	font-weight: 500;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
`

export default MyCourses
