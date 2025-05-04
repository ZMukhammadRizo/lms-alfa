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
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useTeacherStore } from '../../stores/teacherStore'
import { Class } from '../../types/teacher'
import supabase from '../../config/supabaseClient'
import { useTheme } from 'styled-components'
import { toast } from 'react-hot-toast'

// No need to define these interfaces again as they're imported from coursesData.ts

const CoursesContainer = styled.div`
	padding: 2rem;
	min-height: 100vh;
	background: ${({ theme }) => theme.colors.background.primary};
	transition: background-color 0.3s ease;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding: 1rem;
	}
`

const CoursesHeader = styled.div`
	margin-bottom: 2rem;
	background-color: ${({ theme }) => theme.colors.background.secondary};
	border-radius: ${({ theme }) => theme.borderRadius.xl};
	padding: 2rem;
	box-shadow: ${({ theme }) => theme.shadows.sm};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	position: relative;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		padding: 1.5rem;
	}
`

const HeaderContent = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 2rem;
	gap: 1.5rem;
	position: relative;
	z-index: 1;

	@media (max-width: ${props => props.theme.breakpoints.lg}) {
		flex-direction: column;
		align-items: stretch;
	}
`

const SectionTitle = styled.h1`
	font-size: 2rem;
	font-weight: 700;
	color: ${props => props.theme.colors.text.primary};
	margin: 0 0 0.25rem 0;
`

const SectionSubtitle = styled.p`
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
	margin: 0;
	max-width: 500px;
`

const SearchFilterBar = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
	flex-wrap: wrap;
	position: relative;
	z-index: 1;

	@media (max-width: ${props => props.theme.breakpoints.lg}) {
		width: 100%;
	}
`

const SearchBar = styled.div`
	display: flex;
	flex-grow: 1;
	align-items: center;
	gap: 0.75rem;
	padding: 0.6rem 1rem;
	background: ${({ theme }) => theme.colors.background.primary};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	transition: all 0.3s ease;
	box-shadow: none;

	&:focus-within {
		border-color: ${({ theme }) => theme.colors.primary[500]};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500] + '40'};
	}

	svg {
		color: ${({ theme }) => theme.colors.text.tertiary};
		flex-shrink: 0;
	}

	@media (min-width: ${props => props.theme.breakpoints.lg}) {
		min-width: 250px;
		flex-grow: 0;
	}
`

const SearchInput = styled.input`
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

const ViewToggleContainer = styled.div`
	display: flex;
	align-items: center;
	background: ${({ theme }) => theme.colors.background.primary};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	padding: 0.25rem;
	box-shadow: none;
	flex-shrink: 0;
`

const ViewToggleBtn = styled.button<{ $isActive: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0.5rem;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	background-color: ${({ theme, $isActive }) =>
		$isActive ? theme.colors.background.secondary : 'transparent'};
	color: ${({ theme, $isActive }) =>
		$isActive ? theme.colors.primary[500] : theme.colors.text.secondary};
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: ${({ $isActive }) => $isActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'};

	&:hover {
		color: ${({ theme }) => theme.colors.primary[500]};
		background-color: ${({ theme, $isActive }) => !$isActive && theme.colors.background.hover};
	}

	svg {
		font-size: 1.1rem;
	}
`

const HeaderRight = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`

const AddButton = styled(motion.button)`
	border: none;
	background: ${props => props.theme.colors.primary[500]};
	color: white;
	border-radius: ${props => props.theme.borderRadius.md};
	padding: 0.6rem 1.25rem;
	cursor: pointer;
	transition: all 0.3s ease;
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	font-weight: 500;
	font-size: 0.85rem;
	box-shadow: ${({ theme }) => theme.shadows.sm};

	&:hover {
		background: ${props => props.theme.colors.primary[600]};
		box-shadow: ${({ theme }) => theme.shadows.md};
	}

	svg {
		transition: transform 0.3s ease;
	}

	&:hover svg {
		transform: translateX(3px);
	}
`

const CoursesGridContainer = styled.div`
	padding: 0;
	margin-top: 2rem;
`

const CoursesGrid = styled(motion.div)<{ $columns: number }>`
	display: grid;
	grid-template-columns: repeat(${props => props.$columns === 1 ? 1 : 'auto-fill'}, minmax(280px, 1fr));
	gap: 1.5rem;

	@media (max-width: ${props => props.theme.breakpoints.md}) {
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}
	@media (max-width: ${props => props.theme.breakpoints.sm}) {
		grid-template-columns: 1fr;
		gap: 1rem;
	}
`

const CourseCard = styled(motion.div)`
	background: ${({ theme }) => theme.colors.background.secondary};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	overflow: hidden;
	transition: all 0.25s ease-out;
	box-shadow: ${({ theme }) => theme.shadows.sm};
	display: flex;
	flex-direction: column;
	height: 100%;
	position: relative;

	&:hover {
		border-color: ${({ theme }) => theme.colors.primary[400]};
		box-shadow: ${({ theme }) => theme.shadows.lg};
		transform: scale(1.02);
	}
`

const CardTopSection = styled.div`
	background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary[500]} 0%, ${({ theme }) => theme.colors.primary[600]} 100%);
	padding: 1rem 1.25rem;
	min-height: 60px;
	position: relative;
	display: flex;
	justify-content: space-between;
	align-items: center;
`

const TopRightControls = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`

const CourseTitle = styled.h3`
	font-size: 1.2rem;
	font-weight: 600;
	color: white;
	margin: 0;
	line-height: 1.3;
`

const ViewClassButton = styled(motion.button)`
	border: none;
	background: ${props => props.theme.colors.primary[500]};
	color: white;
	border-radius: ${props => props.theme.borderRadius.md};
	padding: 0.6rem 1.25rem;
	cursor: pointer;
	transition: all 0.3s ease;
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	font-weight: 500;
	font-size: 0.85rem;
	box-shadow: ${({ theme }) => theme.shadows.sm};

	&:hover {
		background: ${props => props.theme.colors.primary[600]};
		box-shadow: ${({ theme }) => theme.shadows.md};
	}

	svg {
		transition: transform 0.3s ease;
	}

	&:hover svg {
		transform: translateX(3px);
	}
`

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	padding: 3rem 1rem;
	margin-top: 1rem;
	min-height: 200px;
`

const EmptyStateIcon = styled.div`
	font-size: 2.5rem;
	color: ${props => props.theme.colors.text.tertiary};
	margin-bottom: 1rem;
`

const EmptyStateTitle = styled.h3`
	font-size: 1.1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0 0 0.5rem 0;
`

const EmptyStateDescription = styled.p`
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.secondary};
	margin: 0;
	max-width: 400px;
`

const LoadingState = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	min-height: 200px;
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
	gap: 1rem;
`

const StatsContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 1rem;
	margin-bottom: 1.5rem;
`

const StatItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.6rem;
	background-color: ${({ theme }) => theme.colors.background.tertiary};
	padding: 0.75rem;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
`

const StatIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${({ theme }) => theme.colors.primary[500]};
	font-size: 1.2rem;
`

const StatContent = styled.div`
	display: flex;
	flex-direction: column;
`

const StatValue = styled.span`
	font-size: 1.1rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text.primary};
`

const StatLabel = styled.span`
	font-size: 0.75rem;
	color: ${({ theme }) => theme.colors.text.secondary};
	text-transform: uppercase;
	letter-spacing: 0.5px;
`

const CardFooter = styled.div`
	margin-top: auto;
`

const ViewButton = styled(motion.button)`
	width: 100%;
	padding: 0.75rem 1rem;
	border: none;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	background: ${props => props.theme.colors.primary[500]};
	color: white;
	font-weight: 500;
	font-size: 0.9rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	transition: background-color 0.2s ease;

	&:hover {
		background: ${props => props.theme.colors.primary[600]};
	}

	svg {
		transition: transform 0.2s ease;
	}

	&:hover svg {
		transform: translateX(4px);
	}
`

const ActionMenu = styled(motion.div)`
	position: absolute;
	top: 45px;
	right: 10px;
	background: ${({ theme }) => theme.colors.background.secondary};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	box-shadow: ${({ theme }) => theme.shadows.lg};
	border: 1px solid ${({ theme }) => theme.colors.border.medium};
	z-index: 10;
	overflow: hidden;
`

const ActionMenuItem = styled.button`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	padding: 0.75rem 1rem;
	background: none;
	border: none;
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: 0.9rem;
	text-align: left;
	cursor: pointer;
	transition: background-color 0.15s ease;

	&:hover {
		background: ${({ theme }) => theme.colors.background.hover};
	}

	svg {
		color: ${({ theme }) => theme.colors.text.secondary};
		font-size: 1rem;
	}
`

const CardContent = styled.div`
	padding: 1.5rem;
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
`

const TeacherClasses: React.FC = () => {
	const navigate = useNavigate()
	const { classes, loading, error, loadClasses } = useTeacherStore()
	const [searchTerm, setSearchTerm] = useState<string>('')
	const [gridColumns, setGridColumns] = useState<number>(3)
	const [hoverClass, setHoverClass] = useState<string | null>(null)
	const [, setIsAddClassVisible] = useState<boolean>(false)
	const [currentUser, setCurrentUser] = useState<any>(null)
	const theme = useTheme();

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

	// Handle search input change
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	// Filter classes based on search term and selected filter
	const filteredClasses = classes.filter(c => {
		const matchesSearch =
			c.classname.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(c.subjects?.name && c.subjects.name.toLowerCase().includes(searchTerm.toLowerCase()));

		// Only include classes assigned to this teacher
		const isTeacherClass = currentUser ? c.teacherid === currentUser.id : false;
		
		return matchesSearch && isTeacherClass;
	})

	// Handler for viewing class
	const viewClass = (classId: string) => {
		navigate(`/teacher/classes/${classId}`)
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
								<SearchBar>
									<FiSearch size={18} color={theme.colors.text.tertiary} />
									<SearchInput
										type='text'
										placeholder='Search courses...'
										value={searchTerm}
										onChange={handleSearchChange}
									/>
								</SearchBar>

								<ViewToggleContainer>
									<ViewToggleBtn $isActive={gridColumns !== 1} onClick={() => setGridColumns(3)}>
										<FiFolder size={18} />
									</ViewToggleBtn>
									<ViewToggleBtn $isActive={gridColumns === 1} onClick={() => setGridColumns(1)}>
										<FiFolder size={18} />
									</ViewToggleBtn>
								</ViewToggleContainer>
							</SearchFilterBar>
						</HeaderContent>

						<HeaderRight>
							{/* Add Class Button Removed */}
						</HeaderRight>
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
										whileHover={{ y: -5, boxShadow: theme.shadows.md }}
									>
										<CardTopSection>
											<CourseTitle>{c.classname || 'N/A'}</CourseTitle>
											<TopRightControls>
											</TopRightControls>
										</CardTopSection>

										<CardContent>
											<StatsContainer>
												<StatItem>
													<StatIcon><FiUsers /></StatIcon>
													<StatContent>
														<StatValue>{c.studentCount || 0}</StatValue>
														<StatLabel>Students</StatLabel>
													</StatContent>
												</StatItem>
												<StatItem>
													<StatIcon><FiBookOpen /></StatIcon>
													<StatContent>
														<StatValue>{c.subjectCount || 0}</StatValue>
														<StatLabel>Subjects</StatLabel>
													</StatContent>
												</StatItem>
											</StatsContainer>
										</CardContent>

										<CardFooter>
											<ViewButton
												onClick={() => viewClass(c.id)}
												whileHover={{ scale: 1.03 }}
												whileTap={{ scale: 0.98 }}
											>
												View Class <FiChevronRight />
											</ViewButton>
										</CardFooter>
									</CourseCard>
								))}
							</CoursesGrid>
						) : (
							<EmptyState>
								<EmptyStateIcon>
									<FiFolder size={48} />
								</EmptyStateIcon>
								<EmptyStateTitle>
									{searchTerm ? `No classes found matching "${searchTerm}"` : "No classes assigned"}
								</EmptyStateTitle>
								<EmptyStateDescription>
									{searchTerm ? "Try broadening your search terms." : "Classes will appear here once they are assigned to your account."}
								</EmptyStateDescription>
							</EmptyState>
						)}
					</CoursesGridContainer>
				</motion.div>
			</AnimatePresence>
		</CoursesContainer>
	)
}

export default TeacherClasses
