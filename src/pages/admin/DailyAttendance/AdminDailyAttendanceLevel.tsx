import React, { useEffect, useState } from 'react'
import { ArrowLeft, Search, Users } from 'react-feather'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import PageHeader from '../../../components/common/PageHeader'
import supabase from '../../../config/supabaseClient'

interface Class {
	id: string
	classname: string
	student_count: number
	room?: string
}

interface Level {
	id: string
	name: string
}

const AdminDailyAttendanceLevel: React.FC = () => {
	const { levelId } = useParams<{ levelId: string }>()
	const [classes, setClasses] = useState<Class[]>([])
	const [filteredClasses, setFilteredClasses] = useState<Class[]>([])
	const [searchQuery, setSearchQuery] = useState('')
	const [level, setLevel] = useState<Level | null>(null)
	const [loading, setLoading] = useState(true)
	const navigate = useNavigate()

	useEffect(() => {
		if (levelId) {
			fetchLevelAndClasses()
		}
	}, [levelId])

	useEffect(() => {
		if (searchQuery.trim() === '') {
			setFilteredClasses(classes)
		} else {
			const filtered = classes.filter(cls =>
				cls.classname.toLowerCase().includes(searchQuery.toLowerCase())
			)
			setFilteredClasses(filtered)
		}
	}, [searchQuery, classes])

	const fetchLevelAndClasses = async () => {
		try {
			setLoading(true)

			// Fetch level details
			const { data: levelData, error: levelError } = await supabase
				.from('levels')
				.select('*')
				.eq('id', levelId)
				.single()

			if (levelError) throw levelError

			setLevel(levelData)

			// Fetch classes for this level
			const { data: classesData, error: classesError } = await supabase
				.from('classes')
				.select('id, classname, student_count, room')
				.eq('level_id', levelId)
				.order('classname')

			if (classesError) throw classesError

			setClasses(classesData || [])
		} catch (error) {
			console.error('Error fetching level and classes:', error)
			toast.error('Failed to load classes')
		} finally {
			setLoading(false)
		}
	}

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value)
	}

	const handleClassClick = (classId: string) => {
		navigate(`/admin/daily-attendance/${levelId}/classes/${classId}`)
	}

	return (
		<Container>
			<BackLink to='/admin/daily-attendance'>
				<ArrowLeft size={16} />
				<span>Back to Levels</span>
			</BackLink>

			<PageHeader
				title={level ? `${level.name} - Daily Attendance` : 'Daily Attendance'}
				subtitle='Select a class to manage daily attendance'
			/>

			{loading ? (
				<LoadingContainer>
					<LoadingSpinner />
					<p>Loading classes...</p>
				</LoadingContainer>
			) : classes.length === 0 ? (
				<EmptyState>
					<h3>No classes found</h3>
					<p>There are no classes available for this level.</p>
				</EmptyState>
			) : (
				<>
					<SearchContainer>
						<ClassCount>{classes.length} Classes</ClassCount>
						<SearchInputWrapper>
							<SearchIcon>
								<Search size={18} />
							</SearchIcon>
							<SearchInput
								type='text'
								placeholder='Search classes...'
								value={searchQuery}
								onChange={handleSearchChange}
							/>
						</SearchInputWrapper>
					</SearchContainer>

					{filteredClasses.length === 0 ? (
						<EmptyState>
							<h3>No matching classes</h3>
							<p>No classes match your search criteria.</p>
						</EmptyState>
					) : (
						<ClassesGrid>
							{filteredClasses.map(cls => (
								<ClassCard key={cls.id} onClick={() => handleClassClick(cls.id)}>
									<ClassInfo>
										<ClassTitle>{cls.classname}</ClassTitle>
										{cls.room && <ClassRoom>Room: {cls.room}</ClassRoom>}
									</ClassInfo>
									<StudentCount>
										<Users size={16} />
										<span>{cls.student_count} Students</span>
									</StudentCount>
								</ClassCard>
							))}
						</ClassesGrid>
					)}
				</>
			)}
		</Container>
	)
}

const Container = styled.div`
	padding: 24px;
	max-width: 1200px;
	margin: 0 auto;
`

const BackLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	color: #0ea5e9;
	text-decoration: none;
	margin-bottom: 16px;
	font-weight: 500;
	transition: opacity 0.2s;

	&:hover {
		opacity: 0.8;
	}
`

const ClassesGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 24px;
	margin-top: 24px;
`

const ClassCard = styled.div`
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

const ClassInfo = styled.div`
	margin-bottom: 16px;
`

const ClassTitle = styled.h3`
	margin: 0 0 8px;
	font-size: 1.2rem;
	color: #0ea5e9;
`

const ClassRoom = styled.p`
	margin: 0;
	color: #464646;
	font-size: 0.9rem;
`

const StudentCount = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	color: #464646;

	svg {
		color: #0ea5e9;
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
	border: 3px solid #000;
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
	color: #c4c4c4;

	h3 {
		margin: 0 0 8px;
		color: #0ea5e9;
	}
`

const SearchContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
	flex-wrap: wrap;
	gap: 16px;
`

const ClassCount = styled.div`
	font-size: 1rem;
	font-weight: 500;
	color: #464646;
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

export default AdminDailyAttendanceLevel
