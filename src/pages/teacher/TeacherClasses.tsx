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
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useTeacherStore } from '../../stores/teacherStore'
import { Class } from '../../types/teacher'
import supabase from '../../config/supabaseClient'

// No need to define these interfaces again as they're imported from coursesData.ts

const CoursesContainer = styled.div`
	padding: 2rem;
	min-height: 100vh;
	background: ${({ theme }) => theme.colors.background.primary};
	transition: background-color 0.3s ease;
`

const CourseFooter = styled.div`
	margin-top: auto;
	padding-top: 1.5rem;
	display: flex;
	justify-content: center;
	width: 100%;
	position: relative;
	z-index: 1;
`

const TeacherClasses: React.FC = () => {
	const navigate = useNavigate()
	const { classes, loading, error, loadClasses } = useTeacherStore()
	const [searchTerm, setSearchTerm] = useState<string>('')
	const [gridColumns, setGridColumns] = useState<number>(3)
	const [openMenuClass, setOpenMenuClass] = useState<string | null>(null)
	const [hoverClass, setHoverClass] = useState<string | null>(null)
	const [, setIsAddClassVisible] = useState<boolean>(false)
	const [currentUser, setCurrentUser] = useState<any>(null)

	// Get current authenticated user
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
					// Load classes with the authenticated user's ID
					loadClasses(user.id)
				} else {
					console.error("No authenticated user found")
				}
			} catch (err) {
				console.error("Error in getUserData:", err)
			}
		}
		
		getUserData()
	}, [loadClasses])

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = () => {
			setOpenMenuClass(null)
		}

		document.addEventListener('click', handleClickOutside)

		return () => {
			document.removeEventListener('click', handleClickOutside)
		}
	}, [])

	// Handle search input change
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	// Filter classes based on search term and selected filter
	const filteredClasses = classes.filter(c => {
		const matchesSearch =
			c.classname.toLowerCase().includes(searchTerm.toLowerCase()) ||
			c.subjects?.name.toLowerCase().includes(searchTerm.toLowerCase())

		// Only include classes assigned to this teacher
		const isTeacherClass = currentUser ? c.teacherid === currentUser.id : false
		
		return matchesSearch && isTeacherClass
	})

	// Handler for viewing class
	const viewClass = (classId: string) => {
		navigate(`/teacher/classes/${classId}`)
	}

	// Get featured lesson (first lesson) of a course
	const getFeaturedLesson = (course: Class) => {
		return course.videos && course.videos.length > 0 ? course.videos[0] : null
	}

	return (
		<CoursesContainer>
			<AnimatePresence mode='wait'>
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
					<CoursesHeader>
						<HeaderContent>
							<div>
								<SectionTitle>My Classes</SectionTitle>
								<SectionSubtitle>View and manage class materials</SectionSubtitle>
							</div>

							<SearchFilterBar>
								<SearchWrapper>
									<SearchBar>
										<FiSearch size={18} color='#8d9aa8' />
										<SearchInput
											type='text'
											placeholder='Search courses...'
											value={searchTerm}
											onChange={handleSearchChange}
										/>
									</SearchBar>
								</SearchWrapper>

								<ViewToggleContainer>
									<ViewToggle>
										<ViewToggleBtn $isActive={gridColumns === 1} onClick={() => setGridColumns(1)}>
											<FiFolder size={18} />
										</ViewToggleBtn>
										<ViewToggleBtn $isActive={gridColumns === 3} onClick={() => setGridColumns(3)}>
											<FiFolder size={18} />
										</ViewToggleBtn>
									</ViewToggle>
								</ViewToggleContainer>
							</SearchFilterBar>
						</HeaderContent>

						<CourseStatusBar>
							<CourseStatusItem>
								<CourseStatusIcon
									backgroundColor={filteredClasses.length > 0 ? filteredClasses[0].coverImage : '#ccc'}
								>
									{filteredClasses.length}
								</CourseStatusIcon>
								<CourseStatusContent>
									<CourseStatusValue>{filteredClasses.length}</CourseStatusValue>
									<CourseStatusLabel>Total Classes</CourseStatusLabel>
								</CourseStatusContent>
							</CourseStatusItem>
							<CourseStatusItem>
								<CourseStatusIcon
									backgroundColor={filteredClasses.length > 0 ? filteredClasses[0].coverImage : '#ccc'}
								>
									{filteredClasses.reduce((sum, c) => sum + (c.videos?.length || 0), 0)}
								</CourseStatusIcon>
								<CourseStatusContent>
									<CourseStatusValue>
										{filteredClasses.reduce((sum, c) => sum + (c.videos?.length || 0), 0)}
									</CourseStatusValue>
									<CourseStatusLabel>Total Lessons</CourseStatusLabel>
								</CourseStatusContent>
							</CourseStatusItem>
							<CourseStatusItem>
								<CourseStatusIcon
									backgroundColor={
										filteredClasses.filter(c => c.subjects?.name === 'STEM').length > 0 ? '#05b169' : '#ccc'
									}
								>
									{filteredClasses.filter(c => c.subjects?.name === 'STEM').length}
								</CourseStatusIcon>
								<CourseStatusContent>
									<CourseStatusValue>
										{filteredClasses.filter(c => c.subjects?.name === 'STEM').length}
									</CourseStatusValue>
									<CourseStatusLabel>STEM Courses</CourseStatusLabel>
								</CourseStatusContent>
							</CourseStatusItem>
						</CourseStatusBar>
					</CoursesHeader>

					<CoursesGridContainer>
						{loading ? (
							<LoadingState>Loading your classes...</LoadingState>
						) : filteredClasses.length > 0 ? (
							<CoursesGrid $columns={gridColumns}>
								{filteredClasses.map(c => (
									<CourseCard
										key={c.id}
										as={motion.div}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3 }}
										whileHover={{ y: -8 }}
										whileTap={{ y: -2 }}
										onClick={() => viewClass(c.id)}
										onMouseEnter={() => setHoverClass(c.id)}
										onMouseLeave={() => setHoverClass(null)}
									>
										<CourseImageContainer>
											{c.coverImage && (
												<CourseImage $image={c.coverImage} $subject={c.subjects?.name as any} />
											)}
											<CourseSubject>{c.subjects?.name}</CourseSubject>
											<CourseLessonsCount>
												{c.videos?.length || 0} {c.videos?.length || 0 > 1 ? 'Lessons' : 'Lesson'}
											</CourseLessonsCount>

											{hoverClass === c.id && getFeaturedLesson(c) && (
												<PreviewButton
													onClick={(e: React.MouseEvent) => {
														e.stopPropagation()
														viewClass(c.id)
													}}
												>
													<FiPlayCircle size={16} />
													<span>Preview Course</span>
												</PreviewButton>
											)}

											<CourseMenu>
												<CourseMenuButton
													onClick={(e: React.MouseEvent) => {
														e.stopPropagation()
														setOpenMenuClass(openMenuClass === c.id ? null : c.id)
													}}
												>
													<FiMoreVertical size={18} />
												</CourseMenuButton>

												{openMenuClass === c.id && (
													<CourseMenuDropdown
														isVisible={openMenuClass === c.id}
														onClick={(e: React.MouseEvent) => e.stopPropagation()}
													>
														<CourseMenuItem>
															<FiEdit size={14} />
															<span>Edit</span>
														</CourseMenuItem>
														<CourseMenuItem className='delete'>
															<FiX size={14} />
															<span>Delete</span>
														</CourseMenuItem>
													</CourseMenuDropdown>
												)}
											</CourseMenu>
										</CourseImageContainer>

										<CourseContent>
											<CourseTitle>{c.classname}</CourseTitle>
											<CourseFooter>
												<CourseActionButton
													onClick={(e: React.MouseEvent) => {
														e.stopPropagation()
														viewClass(c.id)
													}}
													whileHover={{ y: -3 }}
													whileTap={{ y: 0 }}
												>
													<span>View Class</span>
													<FiChevronRight size={16} />
												</CourseActionButton>
											</CourseFooter>
										</CourseContent>
									</CourseCard>
								))}
							</CoursesGrid>
						) : (
							<EmptyState>
								<EmptyStateIcon>
									<FiFolder size={48} />
								</EmptyStateIcon>
								<EmptyStateTitle>No classes assigned to you yet</EmptyStateTitle>
								<EmptyStateDescription>
									Classes will appear here once they are assigned to your account
								</EmptyStateDescription>
							</EmptyState>
						)}
					</CoursesGridContainer>
				</motion.div>
			</AnimatePresence>
		</CoursesContainer>
	)
}

const CoursesHeader = styled.div`
	margin-bottom: 2.5rem;
	background-color: ${({ theme }) => theme.colors.background.secondary};
	border-radius: 1.5rem;
	padding: 2rem;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: ${({ theme }) =>
			theme.isDark
				? `linear-gradient(135deg, ${theme.colors.primary[700]}10, ${theme.colors.primary[500]}05)`
				: `linear-gradient(135deg, ${theme.colors.primary[100]}, ${theme.colors.primary[50]}50)`};
		opacity: 0.8;
		z-index: 0;
	}

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding: 1.5rem;
	}
`

const HeaderContent = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 2rem;
	gap: 2rem;
	position: relative;
	z-index: 1;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		flex-direction: column;
	}
`

const SectionTitle = styled.h1`
	font-size: 2.5rem;
	font-weight: 800;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
	transition: color 0.3s ease;
	position: relative;

	&::after {
		content: '';
		position: absolute;
		bottom: -0.5rem;
		left: 0;
		width: 3rem;
		height: 0.25rem;
		background: ${props => props.theme.colors.primary[500]};
		border-radius: 1rem;
	}
`

const SectionSubtitle = styled.p`
	font-size: 1.1rem;
	color: ${props => props.theme.colors.text.secondary};
	margin: 1.25rem 0 0;
	transition: color 0.3s ease;
	max-width: 500px;
`

const SearchFilterBar = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
	flex-wrap: wrap;
	position: relative;
	z-index: 1;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		width: 100%;
	}
`

const SearchWrapper = styled.div`
	flex: 1;
	min-width: 300px;
`

const SearchBar = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem 1.25rem;
	background: ${({ theme }) =>
		theme.isDark ? `${theme.colors.background.tertiary}80` : 'rgba(255, 255, 255, 0.8)'};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	border-radius: ${({ theme }) => theme.borderRadius.full};
	transition: all 0.3s ease;
	backdrop-filter: blur(8px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

	&:hover {
		border-color: ${({ theme }) => theme.colors.border.dark};
		transform: translateY(-2px);
	}

	&:focus-within {
		border-color: ${({ theme }) => theme.colors.primary[500]};
		box-shadow: 0 4px 12px ${({ theme }) => `${theme.colors.primary[500]}30`};
		transform: translateY(-2px);
	}

	svg {
		color: ${({ theme }) => theme.colors.text.secondary};
	}

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding: 0.6rem 1rem;
	}
`

const SearchInput = styled.input`
	width: 100%;
	border: none;
	background: transparent;
	font-size: 0.9375rem;
	color: ${({ theme }) => theme.colors.text.primary};
	outline: none;

	&::placeholder {
		color: ${({ theme }) => theme.colors.text.tertiary};
	}
`

const FilterWrapper = styled.div`
	position: relative;
`

const FilterButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem 1.25rem;
	background: ${({ theme }) =>
		theme.isDark ? `${theme.colors.background.tertiary}80` : 'rgba(255, 255, 255, 0.8)'};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	border-radius: ${({ theme }) => theme.borderRadius.full};
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: 0.9375rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
	backdrop-filter: blur(8px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

	&:hover {
		border-color: ${({ theme }) => theme.colors.border.dark};
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	svg {
		color: ${({ theme }) => theme.colors.text.secondary};
	}

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding: 0.6rem 1rem;
	}
`

const FilterDropdown = styled.div<{ isVisible: boolean }>`
	position: absolute;
	top: calc(100% + 0.75rem);
	right: 0;
	width: 220px;
	background: ${({ theme }) =>
		theme.isDark ? `${theme.colors.background.secondary}E6` : 'rgba(255, 255, 255, 0.95)'};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	box-shadow: ${({ theme }) =>
		theme.isDark ? '0 8px 24px rgba(0, 0, 0, 0.2)' : '0 8px 24px rgba(0, 0, 0, 0.1)'};
	overflow: hidden;
	z-index: 100;
	opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
	transform: ${({ isVisible }) => (isVisible ? 'translateY(0)' : 'translateY(-10px)')};
	pointer-events: ${({ isVisible }) => (isVisible ? 'all' : 'none')};
	transition: all 0.3s ease;
	backdrop-filter: blur(10px);
`

const FilterList = styled.div`
	padding: 0.5rem;
`

const FilterListItem = styled.button<{ $isActive: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 0.75rem 1rem;
	border: none;
	background: ${({ theme, $isActive }) => ($isActive ? theme.colors.primary[50] : 'transparent')};
	color: ${({ theme, $isActive }) =>
		$isActive ? theme.colors.primary[600] : theme.colors.text.primary};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	font-size: 0.9375rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ theme, $isActive }) =>
			$isActive ? theme.colors.primary[100] : theme.colors.background.tertiary};
	}
`

const FilterCheckmark = styled(FiCheck)`
	color: ${props => props.theme.colors.primary[500]};
`

const CourseStatusBar = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1.5rem;
	margin-top: 2rem;
`

const CourseStatusItem = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1.5rem;
	background: ${({ theme }) => theme.colors.background.secondary};
	border-radius: ${({ theme }) => theme.borderRadius.xl};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	transition: all 0.3s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: ${({ theme }) => theme.shadows.md};
	}
`

const CourseStatusIcon = styled.div<{ backgroundColor: string }>`
	width: 48px;
	height: 48px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: ${props => props.theme.borderRadius.lg};
	background: ${props => props.backgroundColor};
	color: white;
	font-weight: 600;
	font-size: 1.25rem;
`

const CourseStatusContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`

const CourseStatusValue = styled.div`
	font-size: 1.5rem;
	font-weight: 700;
	color: ${props => props.theme.colors.text.primary};
`

const CourseStatusLabel = styled.div`
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.secondary};
`

const CoursesGrid = styled.div<{ $columns: number }>`
	display: grid;
	grid-template-columns: repeat(${props => props.$columns}, 1fr);
	gap: 2rem;
	padding: 1.5rem;

	@media (max-width: ${props => props.theme.breakpoints.xl}) {
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1.25rem;
		padding: 1rem;
	}
`

const CourseCard = styled(motion.div)`
	background: ${({ theme }) => theme.colors.background.secondary};
	border-radius: ${({ theme }) => theme.borderRadius.xl};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	overflow: hidden;
	cursor: pointer;
	transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 320px;
	position: relative;
	
	&:before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: radial-gradient(circle at 10% 20%, ${({ theme }) => theme.colors.primary[50] + '20'} 0%, transparent 70%);
		opacity: 0.5;
		transition: opacity 0.4s ease;
		z-index: 0;
	}

	&:hover {
		border-color: ${({ theme }) => theme.colors.primary[500]};
		box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
		transform: translateY(-8px) scale(1.02);
		
		&:before {
			opacity: 1;
		}
	}
`

const CourseContent = styled.div`
	padding: 2rem 1.5rem;
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
	position: relative;
	z-index: 1;
	min-height: 180px;
`

const CourseTitle = styled.h3`
	font-size: 2.5rem;
	font-weight: 800;
	margin: 0 0 1.5rem;
	color: ${props => props.theme.colors.text.primary};
	transition: color 0.3s ease, transform 0.3s ease;
	line-height: 1.2;
	text-align: center;
	
	${CourseCard}:hover & {
		color: ${props => props.theme.colors.primary[600]};
		transform: scale(1.05);
	}
	
	@media (max-width: ${props => props.theme.breakpoints.md}) {
		font-size: 2rem;
		margin: 0 0 1rem;
	}
`

const CourseSubject = styled.div`
	position: absolute;
	top: 1rem;
	left: 1rem;
	padding: 0.5rem 1rem;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(8px);
	border-radius: ${props => props.theme.borderRadius.full};
	font-size: 0.875rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	z-index: 10;
	transition: all 0.3s ease;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

	${CourseCard}:hover & {
		background: ${props => props.theme.colors.primary[500]};
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}
`

const CourseLessonsCount = styled.div`
	position: absolute;
	top: 1rem;
	right: 1rem;
	padding: 0.5rem 1rem;
	background: ${props => props.theme.colors.primary[500]};
	backdrop-filter: blur(8px);
	border-radius: ${props => props.theme.borderRadius.full};
	font-size: 0.875rem;
	font-weight: 600;
	color: white;
	z-index: 10;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	transition: all 0.3s ease;

	${CourseCard}:hover & {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
		background: ${props => props.theme.colors.primary[600]};
	}

	svg {
		width: 16px;
		height: 16px;
	}
`

const CourseActionButton = styled(motion.button)`
	border: none;
	background: ${props => props.theme.colors.primary[500]};
	color: white;
	border-radius: ${props => props.theme.borderRadius.lg};
	padding: 0.75rem 1.5rem;
	cursor: pointer;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	font-size: 0.875rem;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	
	${CourseCard}:hover & {
		background: ${props => props.theme.colors.primary[600]};
		transform: translateY(-3px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	&:hover {
		background: ${props => props.theme.colors.primary[700]};
		transform: translateY(-2px) scale(1.05);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
	}
	
	svg {
		transition: transform 0.3s ease;
	}
	
	&:hover svg {
		transform: translateX(4px);
	}
`

const PreviewButton = styled.button`
	position: absolute;
	bottom: 1rem;
	right: 1rem;
	padding: 0.75rem 1.25rem;
	background: ${props => props.theme.colors.primary[500]};
	color: white;
	border: none;
	border-radius: ${props => props.theme.borderRadius.full};
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	z-index: 10;
	transition: all 0.3s ease;

	&:hover {
		background: ${props => props.theme.colors.primary[600]};
		transform: scale(1.05);
	}

	svg {
		width: 18px;
		height: 18px;
	}
`

const CourseImageContainer = styled.div`
	position: relative;
	padding-top: 56.25%; // 16:9 aspect ratio
	overflow: hidden;
	background: ${props => props.theme.colors.background.tertiary};
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const CourseImage = styled.div<{ $image: string; $subject: string }>`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-image: ${props => `url(${props.$image})`};
	background-size: cover;
	background-position: center;
	transition: transform 0.5s ease;

	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4));
		backdrop-filter: blur(0px);
		transition: all 0.3s ease;
	}

	${CourseCard}:hover & {
		transform: scale(1.05);

		&::after {
			backdrop-filter: blur(2px);
			background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5));
		}
	}
`

const CourseMenu = styled.div`
	position: absolute;
	top: 1rem;
	right: 1rem;
	z-index: 20;
`

const CourseMenuButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: ${props => props.theme.borderRadius.full};
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(8px);
	border: none;
	color: ${props => props.theme.colors.text.primary};
	cursor: pointer;
	transition: all 0.3s ease;

	&:hover {
		background: white;
		transform: scale(1.1);
	}
`

const CourseMenuDropdown = styled.div<{ isVisible: boolean }>`
	position: absolute;
	top: calc(100% + 0.5rem);
	right: 0;
	width: 200px;
	background: ${props => props.theme.colors.background.secondary};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: ${props => props.theme.borderRadius.lg};
	box-shadow: ${props => props.theme.shadows.lg};
	overflow: hidden;
	z-index: 100;
	opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
	transform: ${({ isVisible }) => (isVisible ? 'translateY(0)' : 'translateY(-10px)')};
	pointer-events: ${({ isVisible }) => (isVisible ? 'all' : 'none')};
	transition: all 0.3s ease;
	backdrop-filter: blur(8px);
`

const CourseMenuItem = styled.button`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	padding: 0.875rem 1rem;
	border: none;
	background: transparent;
	color: ${props => props.theme.colors.text.primary};
	font-size: 0.9375rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	svg {
		color: ${props => props.theme.colors.text.secondary};
	}

	&:hover {
		background: ${props => props.theme.colors.background.tertiary};
	}

	&.delete {
		color: ${props => props.theme.colors.danger[500]};

		svg {
			color: ${props => props.theme.colors.danger[500]};
		}

		&:hover {
			background: ${props => props.theme.colors.danger[50]};
		}
	}
`

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	padding: 4rem 2rem;
	background: ${props => props.theme.colors.background.secondary};
	border-radius: ${props => props.theme.borderRadius.xl};
	border: 2px dashed ${props => props.theme.colors.border.light};
	margin-top: 2rem;
	transition: all 0.3s ease;

	&:hover {
		border-color: ${props => props.theme.colors.primary[500]};
		transform: translateY(-4px);
	}
`

const EmptyStateIcon = styled.div`
	font-size: 3rem;
	color: ${props => props.theme.colors.text.tertiary};
	margin-bottom: 24px;
`

const EmptyStateTitle = styled.h3`
	font-size: 1.5rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0 0 12px;
`

const EmptyStateDescription = styled.p`
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
	margin: 0 0 32px;
	max-width: 460px;
`

// Animation variants for staggered animations

const ViewToggleContainer = styled.div`
	display: flex;
	align-items: center;
	background: ${({ theme }) =>
		theme.isDark ? `${theme.colors.background.tertiary}80` : 'rgba(255, 255, 255, 0.8)'};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	border-radius: ${({ theme }) => theme.borderRadius.full};
	padding: 0.25rem;
	margin-left: auto;
	backdrop-filter: blur(8px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		margin-left: 0;
		margin-top: 0.5rem;
	}
`

const ViewToggle = styled.button<{ active?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0.5rem;
	border-radius: ${({ theme }) => theme.borderRadius.full};
	border: none;
	background: ${({ active, theme }) =>
		active
			? theme.isDark
				? theme.colors.primary[700]
				: theme.colors.primary[500]
			: 'transparent'};
	color: ${({ active, theme }) => (active ? '#ffffff' : theme.colors.text.secondary)};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ active, theme }) =>
			active
				? theme.isDark
					? theme.colors.primary[600]
					: theme.colors.primary[400]
				: theme.isDark
				? 'rgba(255, 255, 255, 0.1)'
				: 'rgba(0, 0, 0, 0.05)'};
	}

	svg {
		font-size: 1.25rem;
	}
`

const ViewToggleBtn = styled.button<{ $isActive: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	background-color: ${({ theme, $isActive }) =>
		$isActive ? theme.colors.background.secondary : 'transparent'};
	color: ${({ theme, $isActive }) =>
		$isActive ? theme.colors.primary[500] : theme.colors.text.secondary};
	border: none;
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: ${({ theme, $isActive }) => ($isActive ? theme.shadows.sm : 'none')};

	&:hover {
		color: ${({ theme, $isActive }) =>
			$isActive ? theme.colors.primary[600] : theme.colors.text.primary};
		transform: ${({ $isActive }) => ($isActive ? 'scale(1.05)' : 'scale(1)')};
	}
`

const AddCourseButton = styled(motion.button)`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 0 24px;
	height: 56px;
	background-color: ${({ theme }) => theme.colors.primary[500]};
	color: ${({ theme }) => theme.colors.text.inverse};
	border: none;
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	font-size: 0.9375rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: ${({ theme }) => theme.shadows.md};

	&:hover {
		background-color: ${({ theme }) => theme.colors.primary[600]};
		box-shadow: ${({ theme }) => theme.shadows.lg};
		transform: translateY(-3px);
	}

	&:active {
		transform: translateY(-1px);
	}
`

const CoursesGridContainer = styled.div`
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: 1.5rem;
	padding: 2rem 0;
	margin-top: 1.5rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
	border: 1px solid ${props => props.theme.colors.border.light};

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding: 1.5rem 0;
	}
`

const FilterOption = styled.div<{ isSelected: boolean }>`
	padding: 0.75rem 1.25rem;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: space-between;

	background: ${({ isSelected, theme }) =>
		isSelected ? `${theme.colors.primary[500]}15` : 'transparent'};
	color: ${({ isSelected, theme }) =>
		isSelected ? theme.colors.primary[500] : theme.colors.text.primary};
	font-weight: ${({ isSelected }) => (isSelected ? '600' : '400')};

	&:hover {
		background: ${({ isSelected, theme }) =>
			isSelected
				? `${theme.colors.primary[500]}25`
				: theme.isDark
				? 'rgba(255, 255, 255, 0.05)'
				: 'rgba(0, 0, 0, 0.03)'};
	}

	&:not(:last-child) {
		border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
	}
`

// Add this new component for loading state
const LoadingState = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 200px;
	font-size: 18px;
	color: #8d9aa8;
`

export default TeacherClasses
