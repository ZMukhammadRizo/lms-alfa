import { motion } from 'framer-motion'
import React from 'react'
import { Calendar, Loader, Search } from 'react-feather'
import styled from 'styled-components'

// Props interface
interface JournalSectionProps {
	students: Array<{
		id: string
		firstName: string
		lastName: string
		fullName: string
	}>
	lessons: Array<{
		id: string
		title: string
		date: string
	}>
	loading: boolean
	selectedQuarter: {
		id: string
		name: string
	} | null
	handleGradeChange: (studentId: string, lessonId: string, value: number | null) => void
	searchQuery: string
	renderGradeCell?: (studentId: string, lessonId: string) => React.ReactNode
}

const JournalSection: React.FC<JournalSectionProps> = ({
	students,
	lessons,
	loading,
	selectedQuarter,
	handleGradeChange,
	searchQuery,
	renderGradeCell,
}) => {
	if (loading) {
		return (
			<LoadingContainer>
				<Loader size={32} />
				<LoadingText>Loading journal data...</LoadingText>
			</LoadingContainer>
		)
	}

	if (students.length === 0) {
		return (
			<EmptyStateContainer>
				<EmptyStateTitle>No students found for this class</EmptyStateTitle>
			</EmptyStateContainer>
		)
	}

	if (lessons.length === 0) {
		return (
			<EmptyStateContainer>
				<EmptyStateTitle>No lessons found for this subject</EmptyStateTitle>
				<EmptyStateSubtitle>
					Please add lessons to this subject or select a different quarter
				</EmptyStateSubtitle>
			</EmptyStateContainer>
		)
	}

	// Format date helper
	const formatDate = (dateString: string): string => {
		try {
			const date = new Date(dateString)
			return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
		} catch (e) {
			return ''
		}
	}

	return (
		<JournalContainer>
			<JournalHeader>
				<HeaderGroup>
					<Calendar size={16} />
					<HeaderLabel>{selectedQuarter?.name || 'Select Quarter'}</HeaderLabel>
				</HeaderGroup>

				{searchQuery && (
					<HeaderGroup>
						<Search size={16} />
						<SearchLabel>Results for "{searchQuery}"</SearchLabel>
					</HeaderGroup>
				)}
			</JournalHeader>

			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
				<TableScrollContainer>
					<JournalTable>
						<TableHeader>
							<HeaderRow>
								<StudentNameHeader>Student</StudentNameHeader>
								{lessons.map(lesson => (
									<LessonHeader key={lesson.id}>
										<LessonTitle>{lesson.title}</LessonTitle>
										<LessonDate>{formatDate(lesson.date)}</LessonDate>
									</LessonHeader>
								))}
							</HeaderRow>
						</TableHeader>
						<TableBody>
							{students.map((student, index) => (
								<StudentRow key={student.id} $isEven={index % 2 === 0}>
									<StudentNameCell>
										<StudentName>{student.fullName}</StudentName>
									</StudentNameCell>

									{lessons.map(lesson => (
										<GradeCell key={`${student.id}-${lesson.id}`}>
											{renderGradeCell ? (
												renderGradeCell(student.id, lesson.id)
											) : (
												<div className='flex justify-center'>
													<EmptyGradeBadge
														onClick={() => handleGradeChange(student.id, lesson.id, null)}
														title='Click to add grade'
													>
														<span>+</span>
													</EmptyGradeBadge>
												</div>
											)}
										</GradeCell>
									))}
								</StudentRow>
							))}
						</TableBody>
					</JournalTable>
				</TableScrollContainer>
			</motion.div>
		</JournalContainer>
	)
}

export default JournalSection

// Styled Components
const JournalContainer = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	background-color: white;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	overflow: hidden;
`

const JournalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 20px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const HeaderGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`

const HeaderLabel = styled.span`
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const SearchLabel = styled.span`
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.secondary};
	font-style: italic;
`

const TableScrollContainer = styled.div`
	overflow-x: auto;
	max-width: 100%;
	scrollbar-width: thin;

	&::-webkit-scrollbar {
		height: 8px;
	}

	&::-webkit-scrollbar-track {
		background: ${props => props.theme.colors.background.lighter};
		border-radius: 4px;
	}

	&::-webkit-scrollbar-thumb {
		background: ${props => props.theme.colors.neutral[300]};
		border-radius: 4px;
	}
`

const JournalTable = styled.table`
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	table-layout: fixed;
`

const TableHeader = styled.thead`
	position: sticky;
	top: 0;
	z-index: 10;
	background-color: white;
`

const HeaderRow = styled.tr`
	background-color: ${props => props.theme.colors.background.lighter};
`

const StudentNameHeader = styled.th`
	text-align: left;
	padding: 14px 20px;
	font-weight: 600;
	color: ${props => props.theme.colors.text.secondary};
	position: sticky;
	left: 0;
	background-color: ${props => props.theme.colors.background.lighter};
	min-width: 200px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	box-shadow: 1px 0 3px rgba(0, 0, 0, 0.05);
`

const LessonHeader = styled.th`
	padding: 12px 8px;
	font-weight: 600;
	font-size: 0.85rem;
	text-align: center;
	min-width: 90px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
	background-color: ${props => props.theme.colors.background.lighter};
	cursor: pointer;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}
`

const LessonTitle = styled.div`
	font-weight: 600;
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.primary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	margin-bottom: 2px;
`

const LessonDate = styled.div`
	font-size: 0.75rem;
	color: ${props => props.theme.colors.text.secondary};
`

const TableBody = styled.tbody``

interface StudentRowProps {
	$isEven: boolean
}

const StudentRow = styled.tr<StudentRowProps>`
	background-color: ${props => (props.$isEven ? 'white' : props.theme.colors.background.lighter)};

	&:hover {
		background-color: ${props => props.theme.colors.primary[50]};
	}
`

const StudentNameCell = styled.td`
	padding: 12px 20px;
	position: sticky;
	left: 0;
	z-index: 2;
	background-color: inherit;
	box-shadow: 1px 0 3px rgba(0, 0, 0, 0.05);
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const StudentName = styled.div`
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	display: flex;
	align-items: center;
	gap: 8px;
`

const GradeCell = styled.td`
	padding: 8px;
	text-align: center;
	height: 60px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

const EmptyGradeBadge = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 8px;
	background-color: ${props => props.theme.colors.background.lighter};
	color: ${props => props.theme.colors.text.secondary};
	border: 1px dashed ${props => props.theme.colors.border.light};
	cursor: pointer;
	transition: all 0.2s ease;
	margin: 0 auto;
	opacity: 0.6;

	span {
		font-size: 1.2rem;
		line-height: 1;
	}

	&:hover {
		border-color: ${props => props.theme.colors.primary[400]};
		background-color: ${props => props.theme.colors.primary[50]};
		color: ${props => props.theme.colors.primary[500]};
		opacity: 1;
	}
`

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px;
	background: white;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

	svg {
		animation: spin 1s linear infinite;
		color: ${props => props.theme.colors.primary[500]};
		margin-bottom: 16px;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`

const LoadingText = styled.p`
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.9rem;
`

const EmptyStateContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px;
	background: white;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	text-align: center;
`

const EmptyStateTitle = styled.h3`
	font-size: 1.1rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: 8px;
`

const EmptyStateSubtitle = styled.p`
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.secondary};
`
