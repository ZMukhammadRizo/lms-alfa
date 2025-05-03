import React, { useEffect, useState } from 'react'
import { FiCalendar } from 'react-icons/fi'
import styled from 'styled-components'
import AdminAttendanceTab from '../../components/admin/AttendanceTab'
import { Card } from '../../components/ui'
import LoadingSpinner from '../../components/ui/Loader'
import { supabase } from '../../services/supabaseClient'

interface Student {
	id: string
	fullName: string
}

interface Lesson {
	id: string
	title: string
	date: string
}

interface Class {
	id: string
	name: string
}

interface Subject {
	id: string
	name: string
}

// Define types for database responses
interface ClassSubjectResponse {
	subjects: {
		id: string
		subjectname: string
	}
}

interface StudentClassResponse {
	students: {
		id: string
		firstname: string
		lastname: string
	}
}

const AdminAttendance: React.FC = () => {
	// State for the filters and data
	const [classes, setClasses] = useState<Class[]>([])
	const [subjects, setSubjects] = useState<Subject[]>([])
	const [selectedClass, setSelectedClass] = useState<string>('')
	const [selectedSubject, setSelectedSubject] = useState<string>('')
	const [students, setStudents] = useState<Student[]>([])
	const [lessons, setLessons] = useState<Lesson[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	// Fetch all classes for admin (not filtered by teacher)
	useEffect(() => {
		async function fetchClasses() {
			try {
				const { data, error } = await supabase
					.from('classes')
					.select('id, name')
					.order('name', { ascending: true })

				if (error) {
					throw error
				}

				setClasses(data || [])
			} catch (error) {
				console.error('Error fetching classes:', error)
				setError('Failed to load classes.')
			}
		}

		fetchClasses()
	}, [])

	// Fetch subjects when a class is selected
	useEffect(() => {
		async function fetchSubjects() {
			if (!selectedClass) {
				setSubjects([])
				return
			}

			try {
				setLoading(true)
				const { data, error } = await supabase
					.from('classsubjects')
					.select(
						`
            subjects:subjectid(
              id,
              subjectname
            )
          `
					)
					.eq('classid', selectedClass)

				if (error) {
					throw error
				}

				// Format the data with proper type assertion
				const formattedSubjects = data.map((item: any) => ({
					id: item.subjects.id,
					name: item.subjects.subjectname,
				}))

				setSubjects(formattedSubjects)
			} catch (error) {
				console.error('Error fetching subjects:', error)
				setError('Failed to load subjects.')
			} finally {
				setLoading(false)
			}
		}

		fetchSubjects()
	}, [selectedClass])

	// Fetch students when a class is selected
	useEffect(() => {
		async function fetchStudents() {
			if (!selectedClass) {
				setStudents([])
				return
			}

			try {
				setLoading(true)
				const { data, error } = await supabase
					.from('studentclasses')
					.select(
						`
            students:studentid(
              id,
              firstname,
              lastname
            )
          `
					)
					.eq('classid', selectedClass)

				if (error) {
					throw error
				}

				// Format the data with proper type assertion
				const formattedStudents = data.map((item: any) => ({
					id: item.students.id,
					fullName: `${item.students.firstname} ${item.students.lastname}`,
				}))

				setStudents(formattedStudents)
			} catch (error) {
				console.error('Error fetching students:', error)
				setError('Failed to load students.')
			} finally {
				setLoading(false)
			}
		}

		fetchStudents()
	}, [selectedClass])

	// Fetch lessons when a subject is selected
	useEffect(() => {
		async function fetchLessons() {
			if (!selectedSubject) {
				setLessons([])
				return
			}

			try {
				setLoading(true)
				const { data, error } = await supabase
					.from('lessons')
					.select('id, lessonname, uploadedat')
					.eq('subjectid', selectedSubject)
					.order('uploadedat', { ascending: true })

				if (error) {
					throw error
				}

				// Format the data
				const formattedLessons = data.map(item => ({
					id: item.id,
					title: item.lessonname,
					date: item.uploadedat,
				}))

				setLessons(formattedLessons)
			} catch (error) {
				console.error('Error fetching lessons:', error)
				setError('Failed to load lessons.')
			} finally {
				setLoading(false)
			}
		}

		fetchLessons()
	}, [selectedSubject])

	const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedClass(e.target.value)
		setSelectedSubject('') // Reset subject when class changes
	}

	const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedSubject(e.target.value)
	}

	return (
		<Container>
			<Header>
				<HeaderTitle>
					<CalendarIcon />
					<span>Attendance Management</span>
				</HeaderTitle>
			</Header>

			<FilterSection>
				<FilterCard>
					<FilterTitle>Filters</FilterTitle>
					<FiltersGrid>
						<FilterGroup>
							<FilterLabel>Class</FilterLabel>
							<StyledSelect value={selectedClass} onChange={handleClassChange} disabled={loading}>
								<option value=''>Select a class</option>
								{classes.map(c => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</StyledSelect>
						</FilterGroup>

						<FilterGroup>
							<FilterLabel>Subject</FilterLabel>
							<StyledSelect
								value={selectedSubject}
								onChange={handleSubjectChange}
								disabled={!selectedClass || loading}
							>
								<option value=''>Select a subject</option>
								{subjects.map(s => (
									<option key={s.id} value={s.id}>
										{s.name}
									</option>
								))}
							</StyledSelect>
						</FilterGroup>
					</FiltersGrid>
				</FilterCard>
			</FilterSection>

			{loading ? (
				<LoadingContainer>
					<LoadingSpinner />
					<LoadingText>Loading attendance data...</LoadingText>
				</LoadingContainer>
			) : error ? (
				<ErrorMessage>{error}</ErrorMessage>
			) : !selectedClass || !selectedSubject ? (
				<EmptyStateContainer>
					<EmptyTitle>
						{!selectedClass
							? 'Please select a class'
							: !selectedSubject
							? 'Please select a subject'
							: ''}
					</EmptyTitle>
					<EmptyDescription>
						{!selectedClass
							? 'Select a class to view attendance records'
							: !selectedSubject
							? 'Select a subject to view its attendance records'
							: ''}
					</EmptyDescription>
				</EmptyStateContainer>
			) : (
				<AdminAttendanceTab students={students} lessons={lessons} />
			)}
		</Container>
	)
}

// Custom Select component since we don't have access to the UI Select component
const StyledSelect = styled.select`
	display: block;
	width: 100%;
	padding: 8px 12px;
	font-size: 0.875rem;
	line-height: 1.5;
	color: ${props => props.theme.colors.text.primary};
	background-color: #fff;
	background-clip: padding-box;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 4px;
	transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

	&:focus {
		border-color: ${props => props.theme.colors.primary[400]};
		outline: 0;
		box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
	}

	&:disabled {
		background-color: ${props => props.theme.colors.background.lighter};
		opacity: 0.7;
		cursor: not-allowed;
	}
`

// Styled components
const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 24px;
	padding: 24px;
	max-width: 1200px;
	margin: 0 auto;
	width: 100%;
`

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`

const HeaderTitle = styled.h1`
	display: flex;
	align-items: center;
	gap: 12px;
	font-size: 1.5rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
`

const CalendarIcon = styled(FiCalendar)`
	color: ${props => props.theme.colors.primary[500]};
	font-size: 1.75rem;
`

const FilterSection = styled.div`
	margin-bottom: 16px;
`

const FilterCard = styled(Card)`
	padding: 16px;
`

const FilterTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	margin: 0 0 16px 0;
	color: ${props => props.theme.colors.text.primary};
`

const FiltersGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 16px;
`

const FilterGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const FilterLabel = styled.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.secondary};
`

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px 0;
	gap: 16px;
`

const LoadingText = styled.p`
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.875rem;
	margin: 0;
`

const ErrorMessage = styled.div`
	padding: 16px;
	background-color: ${props => props.theme.colors.danger[50]};
	color: ${props => props.theme.colors.danger[700]};
	border-radius: 8px;
	margin: 12px 0;
`

const EmptyStateContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 64px 0;
	text-align: center;
	background: white;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`

const EmptyTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	margin: 0 0 8px 0;
	color: ${props => props.theme.colors.text.primary};
`

const EmptyDescription = styled.p`
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.secondary};
	margin: 0;
	max-width: 300px;
`

export default AdminAttendance
