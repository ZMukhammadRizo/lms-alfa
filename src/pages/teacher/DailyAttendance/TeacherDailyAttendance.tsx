import React, { useEffect, useState } from 'react'
import { Book, Calendar, ChevronRight, FileText, Search, Users } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import FilterReportModal from '../../../components/admin/FilterReportModal'
import PageHeader from '../../../components/common/PageHeader'
import supabase from '../../../config/supabaseClient'
import { useAuth } from '../../../contexts/AuthContext'

interface Level {
	id: string
	name: string
	class_count: number
	student_count?: number
}

const TeacherDailyAttendance: React.FC = () => {
	const [levels, setLevels] = useState<Level[]>([])
	const [filteredLevels, setFilteredLevels] = useState<Level[]>([])
	const [searchQuery, setSearchQuery] = useState('')
	const [loading, setLoading] = useState(true)
	const [isReportModalOpen, setIsReportModalOpen] = useState(false)
	const navigate = useNavigate()
	const { user } = useAuth()
	const { t } = useTranslation()

	useEffect(() => {
		if (user?.id) {
			fetchTeacherLevels()
		}
	}, [user])

	useEffect(() => {
		if (searchQuery.trim() === '') {
			setFilteredLevels(levels)
		} else {
			const filtered = levels.filter(level =>
				level.name.toLowerCase().includes(searchQuery.toLowerCase())
			)
			setFilteredLevels(filtered)
		}
	}, [searchQuery, levels])

	const fetchTeacherLevels = async () => {
		try {
			setLoading(true)

			if (!user?.id) {
				throw new Error('User not authenticated')
			}

			// First, get all classes where the teacher is assigned
			const { data: classesData, error: classesError } = await supabase
				.from('classes')
				.select('id, level_id, student_count')
				.eq('teacherid', user.id)

			if (classesError) throw classesError

			if (!classesData || classesData.length === 0) {
				setLevels([])
				setLoading(false)
				return
			}

			// Get unique level IDs
			const levelIds = [...new Set(classesData.map(cls => cls.level_id).filter(Boolean))]

			// Fetch level details
			const { data: levelsData, error: levelsError } = await supabase
				.from('levels')
				.select('*')
				.in('id', levelIds)
				.order('name')

			if (levelsError) throw levelsError

			// For each level, count classes and students
			const levelsWithCounts = levelsData.map(level => {
				const levelClasses = classesData.filter(cls => cls.level_id === level.id)
				const classCount = levelClasses.length
				const studentCount = levelClasses.reduce(
					(total, cls) => total + (cls.student_count || 0),
					0
				)

				return {
					...level,
					class_count: classCount,
					student_count: studentCount,
				}
			})

			setLevels(levelsWithCounts)
		} catch (error) {
			console.error('Error fetching teacher levels:', error)
			toast.error('Failed to load levels')
		} finally {
			setLoading(false)
		}
	}

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value)
	}

	const handleLevelClick = (levelId: string) => {
		navigate(`/teacher/daily-attendance/${levelId}`)
	}

	return (
		<Container>
			<PageHeader
				title={t('teacherPanel.dailyAttendance.title')}
				subtitle={t('teacherPanel.dailyAttendance.description')}
			/>

			<HeaderInfo>
				<InfoCard>
					<InfoCardIcon $color='#0ea5e9'>
						<Calendar size={24} />
					</InfoCardIcon>
					<InfoCardContent>
						<InfoCardValue>{levels.length}</InfoCardValue>
						<InfoCardLabel>{t('teacherPanel.dashboard.assignedLevels')}</InfoCardLabel>
					</InfoCardContent>
				</InfoCard>

				<InfoCard>
					<InfoCardIcon $color='#0ea5e9'>
						<Book size={24} />
					</InfoCardIcon>
					<InfoCardContent>
						<InfoCardValue>
							{levels.reduce((sum, level) => sum + level.class_count, 0)}
						</InfoCardValue>
						<InfoCardLabel>{t('teacherPanel.dashboard.yourClasses')}</InfoCardLabel>
					</InfoCardContent>
				</InfoCard>

				<InfoCard>
					<InfoCardIcon $color='#0ea5e9'>
						<Users size={24} />
					</InfoCardIcon>
					<InfoCardContent>
						<InfoCardValue>
							{levels.reduce((sum, level) => sum + (level.student_count || 0), 0)}
						</InfoCardValue>
						<InfoCardLabel>{t('teacherPanel.dashboard.totalStudents')}</InfoCardLabel>
					</InfoCardContent>
				</InfoCard>
			</HeaderInfo>

			{loading ? (
				<LoadingContainer>
					<LoadingSpinner />
					<p>{t('teacherPanel.common.loading')}</p>
				</LoadingContainer>
			) : levels.length === 0 ? (
				<EmptyState>
					<h3>{t('teacherPanel.classes.noClasses')}</h3>
					<p>{t('teacherPanel.classes.noClasses')}</p>
				</EmptyState>
			) : (
				<>
					<SearchContainer>
						<SectionTitle>{t('teacherPanel.dailyAttendance.selectLevel')}</SectionTitle>
						<ActionContainer>
							<ReportButton onClick={() => setIsReportModalOpen(true)}>
								<FileText size={16} />
								<span>{t('teacherPanel.dailyAttendance.viewReports')}</span>
							</ReportButton>
							<SearchInputWrapper>
								<SearchIcon>
									<Search size={18} />
								</SearchIcon>
								<SearchInput
									type='text'
									placeholder={t('teacherPanel.common.search')}
									value={searchQuery}
									onChange={handleSearchChange}
								/>
							</SearchInputWrapper>
						</ActionContainer>
					</SearchContainer>

					{filteredLevels.length === 0 ? (
						<EmptyState>
							<h3>{t('teacherPanel.common.noData')}</h3>
							<p>{t('teacherPanel.common.noData')}</p>
						</EmptyState>
					) : (
						<LevelsGrid>
							{filteredLevels.map(level => (
								<LevelCard key={level.id} onClick={() => handleLevelClick(level.id)}>
									<LevelName>{level.name}</LevelName>
									<LevelStats>
										<StatItem>
											<Book size={16} />
											<span>{level.class_count} {t('teacherPanel.classes.title')}</span>
										</StatItem>
										<StatItem>
											<Users size={16} />
											<span>{level.student_count || 0} {t('teacherPanel.dashboard.students')}</span>
										</StatItem>
									</LevelStats>
									<GoButton>
										<ChevronRight size={20} />
									</GoButton>
								</LevelCard>
							))}
						</LevelsGrid>
					)}
				</>
			)}

			<FilterReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
		</Container>
	)
}

const Container = styled.div`
	padding: 24px;
	max-width: 1200px;
	margin: 0 auto;
`

const HeaderInfo = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 20px;
	margin-bottom: 32px;
`

const InfoCard = styled.div`
	background-color: #fff;
	border-radius: 12px;
	padding: 20px;
	display: flex;
	align-items: center;
	gap: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`

interface InfoCardIconProps {
	$color: string
}

const InfoCardIcon = styled.div<InfoCardIconProps>`
	width: 48px;
	height: 48px;
	border-radius: 12px;
	background-color: ${props => `${props.$color}15`};
	color: ${props => props.$color};
	display: flex;
	align-items: center;
	justify-content: center;
`

const InfoCardContent = styled.div`
	display: flex;
	flex-direction: column;
`

const InfoCardValue = styled.div`
	font-size: 1.8rem;
	font-weight: 600;
	color: #0ea5e9;
`

const InfoCardLabel = styled.div`
	font-size: 0.9rem;
	color: #464646;
`

const SearchContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
	flex-wrap: wrap;
	gap: 16px;
`

const SectionTitle = styled.h2`
	font-size: 1.2rem;
	font-weight: 500;
	color: #464646;
	margin: 0;
`

const ActionContainer = styled.div`
	display: flex;
	gap: 16px;
	align-items: center;
`

const ReportButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	background-color: #0ea5e9;
	color: white;
	border: none;
	border-radius: 8px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: #0284c7;
	}
`

const SearchInputWrapper = styled.div`
	position: relative;
	width: 300px;
`

const SearchIcon = styled.div`
	position: absolute;
	left: 12px;
	top: 50%;
	transform: translateY(-50%);
	color: #464646;
`

const SearchInput = styled.input`
	width: 100%;
	padding: 10px 10px 10px 40px;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
	font-size: 0.9rem;
	background-color: #fff;
	color: #464646;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #0ea5e9;
		box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
	}

	&::placeholder {
		color: #a0aec0;
	}
`

const LevelsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
	gap: 20px;
`

const LevelCard = styled.div`
	background-color: #fff;
	border-radius: 12px;
	padding: 20px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	cursor: pointer;
	transition: all 0.2s ease;
	border-left: 4px solid #0ea5e9;
	display: flex;
	flex-direction: column;
	position: relative;

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	}
`

const LevelName = styled.h3`
	margin: 0 0 16px;
	font-size: 1.3rem;
	color: #0ea5e9;
`

const LevelStats = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`

const StatItem = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	color: #464646;

	svg {
		color: #0ea5e9;
	}
`

const GoButton = styled.div`
	position: absolute;
	top: 20px;
	right: 20px;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background-color: rgba(14, 165, 233, 0.1);
	color: #0ea5e9;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;

	${LevelCard}:hover & {
		background-color: #0ea5e9;
		color: white;
		transform: translateX(4px);
	}
`

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px;
	gap: 16px;

	p {
		color: #000;
	}
`

const LoadingSpinner = styled.div`
	width: 40px;
	height: 40px;
	border: 3px solid #e5e7eb;
	border-top: 3px solid #0ea5e9;
	border-radius: 50%;
	animation: spin 1s linear infinite;

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
`

const EmptyState = styled.div`
	text-align: center;
	padding: 48px;
	color: #464646;
	background-color: #fff;
	border-radius: 12px;
	margin-top: 24px;

	h3 {
		margin: 0 0 8px;
		color: #0ea5e9;
	}
`

export default TeacherDailyAttendance
