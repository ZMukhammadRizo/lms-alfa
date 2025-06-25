import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	FiArrowLeft,
	FiBook,
	FiBookOpen,
	FiChevronDown,
	FiDownload,
	FiEdit,
	FiFilter,
	FiPlus,
	FiSearch,
	FiTrash2,
} from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import supabase from '../../../config/supabaseClient'
import {
	ActionIconButton,
	AddButton,
	BackButton,
	ClassesContainer,
	CourseFilterButton,
	EmptyState,
	EmptyStateText,
	ExportDataButton,
	FilterButton,
	FilterDropdownMenu,
	FilterOption,
	LoadingMessage,
	LoadingSpinner,
	PageDescription,
	PageTitle,
	PageTitleWithBack,
	SearchContainer,
	SearchInput,
	StatusDot,
	StatusIndicator,
	StudentActionButtons,
	StudentAvatar,
	StudentDetails,
	StudentEmail,
	StudentName,
	StudentProfile,
	StudentsControls,
	StudentsFilterGroup,
	StudentsHeaderSection,
	StudentsTable,
	StudentsTableBody,
	StudentsTableCell,
	StudentsTableHeader,
	StudentsTableHeaderCell,
	StudentsTableRow,
	StudentsView,
} from './shared/styledComponents'
import { ClassType, Section, Student } from './shared/types'

const StudentsPage: React.FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { typeId, levelId, sectionId } = useParams()
	const [students, setStudents] = useState<Student[]>([])
	const [section, setSection] = useState<Section | null>(null)
	const [classType, setClassType] = useState<ClassType | null>(null)
	const [levelName, setLevelName] = useState<string>('')
	const [isLoading, setIsLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState('all')
	const [courseFilter, setCourseFilter] = useState('all')
	const [studentFilterOpen, setStudentFilterOpen] = useState(false)
	const [courseFilterOpen, setCourseFilterOpen] = useState(false)

	// Modal states
	const [isAddStudentsModalOpen, setIsAddStudentsModalOpen] = useState(false)
	const [isEditStudentClassModalOpen, setIsEditStudentClassModalOpen] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [isManageSubjectTeachersModalOpen, setIsManageSubjectTeachersModalOpen] = useState(false)
	const [studentToEditClass, setStudentToEditClass] = useState<Student | null>(null)
	const [studentToDeleteFromClass, setStudentToDeleteFromClass] = useState<{
		id: string
		name: string
	} | null>(null)

	// Refs for closing dropdowns on outside click
	const studentFilterRef = useRef<HTMLDivElement>(null)
	const courseFilterRef = useRef<HTMLDivElement>(null)

	// Fetch initial data
	useEffect(() => {
		const fetchInitialData = async () => {
			if (!typeId || !levelId || !sectionId) return

			try {
				// Fetch class type
				const { data: classTypeData } = await supabase
					.from('class_types')
					.select('*')
					.eq('id', typeId)
					.single()

				if (classTypeData) {
					setClassType(classTypeData)
				}

				// Fetch level
				const { data: levelData } = await supabase
					.from('levels')
					.select('name')
					.eq('id', levelId)
					.single()

				if (levelData) {
					setLevelName(levelData.name)
				}

				// Fetch section details
				const { data: sectionData } = await supabase
					.from('classes')
					.select('*')
					.eq('id', sectionId)
					.single()

				if (sectionData) {
					// Get teacher name
					let teacher = 'No teacher assigned'
					if (sectionData.teacherid) {
						const { data: teacherData, error: teacherError } = await supabase
							.from('users')
							.select('firstName, lastName')
							.eq('id', sectionData.teacherid)
							.single()

						if (!teacherError && teacherData) {
							teacher = `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim()
							if (!teacher) teacher = 'No teacher name'
						}
					}

					// Count students
					const { count: studentCount } = await supabase
						.from('classstudents')
						.select('*', { count: 'exact', head: true })
						.eq('classid', sectionId)

					setSection({
						id: sectionData.id,
						name: sectionData.classname,
						room: sectionData.room || 'No room assigned',
						students: studentCount || 0,
						teacher,
						performance: Math.floor(Math.random() * 30) + 70,
						grade: levelName,
					})
				}
			} catch (error) {
				console.error('Error fetching initial data:', error)
				toast.error('Failed to load section information')
			}
		}

		fetchInitialData()
	}, [typeId, levelId, sectionId, levelName])

	// Fetch students for the section
	useEffect(() => {
		const fetchStudents = async () => {
			if (!sectionId) return

			setIsLoading(true)
			try {
				// Fetch all students in the selected class from classstudents table
				let { data: classstudents, error } = await supabase
					.from('classstudents')
					.select('*')
					.eq('classid', sectionId)

				if (error) throw error

				console.log(
					`Found ${classstudents?.length || 0} students enrolled in class ID ${sectionId}`
				)

				if (!classstudents || classstudents.length === 0) {
					setStudents([])
					setIsLoading(false)
					return
				}

				// Get detailed student information for each enrolled student
				const transformedStudents = await Promise.all(
					classstudents.map(async enrollment => {
						// Fetch each student's user data directly
						const { data: userData, error: userError } = await supabase
							.from('users')
							.select('id, firstName, lastName, email, role, status')
							.eq('id', enrollment.studentid)
							.single()

						if (userError || !userData) {
							console.error(
								`Error fetching user data for student ID ${enrollment.studentid}:`,
								userError
							)
							return null
						}

						// Get the subjects that the student is enrolled in
						const { data: classSubjects, error: subjectsError } = await supabase
							.from('classsubjects')
							.select('id, subjectid')
							.eq('classid', enrollment.classid)

						if (subjectsError) {
							console.error(
								`Error fetching subjects for class ID ${enrollment.classid}:`,
								subjectsError
							)
						}

						// Get subject names for each subject ID
						let subjectList: string[] = []

						if (classSubjects && classSubjects.length > 0) {
							// Get all subject IDs
							const subjectIds = classSubjects.map(cs => cs.subjectid).filter(Boolean)

							if (subjectIds.length > 0) {
								// Fetch subject names for all subject IDs
								const { data: subjectData, error: subjectNameError } = await supabase
									.from('subjects')
									.select('id, subjectname')
									.in('id', subjectIds)

								if (!subjectNameError && subjectData) {
									// Map to just the subject names
									subjectList = subjectData.map(subj => subj.subjectname).filter(Boolean)
								} else {
									console.error('Error fetching subject names:', subjectNameError)
								}
							}
						}

						// Try to get actual performance and attendance data if available
						let performance = 0
						let attendance = 0

						try {
							// Check if there's performance data
							const { data: performanceData, error: perfError } = await supabase
								.from('studentperformance')
								.select('performance')
								.eq('studentid', enrollment.studentid)
								.eq('classid', enrollment.classid)
								.single()

							if (!perfError && performanceData) {
								performance = performanceData.performance
							}

							// Check if there's attendance data
							const { data: attendanceData, error: attError } = await supabase
								.from('attendance')
								.select('percentage')
								.eq('studentid', enrollment.studentid)
								.eq('classid', enrollment.classid)
								.single()

							if (!attError && attendanceData) {
								attendance = attendanceData.percentage
							} else if (attError && attError.code !== 'PGRST116') {
								// PGRST116 means no rows found, which is not an error here
								console.error(
									`Error fetching attendance for student ${enrollment.studentid} in class ${enrollment.classid}:`,
									attError
								)
							}
						} catch (dataError) {
							console.error('Error fetching performance/attendance data:', dataError)
						}

						return {
							id: userData.id,
							name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
							email: userData.email || '',
							phone: '', // Phone not available in current structure
							guardian: '', // Guardian not available in current structure
							status: userData.status || 'active',
							course: '', // Course not available in current structure
							grade: levelName,
							section: section?.name || '',
							performance, // Now using real data when available
							subjects: subjectList, // Real subjects from database
							attendance: attendance, // Real attendance data
						} as Student
					})
				)

				// Filter out null values
				const validStudents = transformedStudents.filter(
					(student): student is Student => student !== null
				)

				console.log(`Successfully processed ${validStudents.length} student records`)
				setStudents(validStudents)
			} catch (error) {
				console.error('Error fetching students:', error)
				toast.error('Failed to load students data')
				setStudents([])
			} finally {
				setIsLoading(false)
			}
		}

		fetchStudents()
	}, [sectionId, levelName, section?.name])

	// Handle navigation
	const handleBackToSections = () => {
		navigate(`/admin/classes/types/${typeId}/levels/${levelId}`)
	}

	// Handle search
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	// Filter handlers
	const handleStudentStatusFilterChange = (status: string) => {
		setStatusFilter(status)
		setStudentFilterOpen(false)
	}

	const handleCourseFilterChange = (course: string) => {
		setCourseFilter(course)
		setCourseFilterOpen(false)
	}

	// Get all unique courses from students data
	const getUniqueCourses = () => {
		try {
			// First filter students with valid subjects array
			const validStudents = students.filter(
				student => student && student.subjects && Array.isArray(student.subjects)
			)

			// Then extract all subjects, filtering out invalid ones
			const allCourses = validStudents.flatMap(student =>
				student.subjects.filter(subject => subject && typeof subject === 'string')
			)

			// Return unique courses with 'all' at the beginning
			return ['all', ...Array.from(new Set(allCourses))]
		} catch (error) {
			console.error('Error getting unique courses:', error)
			return ['all']
		}
	}

	// Student management handlers
	const handleOpenAddStudentsModal = () => {
		setIsAddStudentsModalOpen(true)
	}

	const handleEditStudent = (student: Student) => {
		console.log(`Edit student class for: ${student.name} (ID: ${student.id})`)
		setStudentToEditClass(student)
		setIsEditStudentClassModalOpen(true)
	}

	const handleDeleteStudentFromClass = (studentId: string, studentName: string) => {
		if (!section) {
			toast.error('Cannot remove student: No section selected.')
			return
		}
		setStudentToDeleteFromClass({ id: studentId, name: studentName })
		setIsDeleteModalOpen(true)
	}

	const confirmDeleteStudentFromClass = async () => {
		if (!studentToDeleteFromClass || !sectionId) {
			toast.error('Deletion failed: Missing student or section information.')
			setIsDeleteModalOpen(false)
			return
		}

		const { id: studentId } = studentToDeleteFromClass

		console.log(`Confirmed removal of student ${studentId} from class ${sectionId}`)
		setIsLoading(true)
		setIsDeleteModalOpen(false)

		try {
			const { error } = await supabase
				.from('classstudents')
				.delete()
				.match({ classid: sectionId, studentid: studentId })

			if (error) {
				console.error('Error removing student from class:', error)
				throw error
			}

			toast.success(`Student ${studentToDeleteFromClass.name} removed from class successfully!`)

			// Update the local state to remove the student
			setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId))
		} catch (error) {
			toast.error('Failed to remove student from class. Please check console.')
		} finally {
			setIsLoading(false)
			setStudentToDeleteFromClass(null)
		}
	}

	const handleUpdateStudentClass = async (studentId: string, newClassId: string) => {
		console.log(`Updating class for student ${studentId} to new class ${newClassId}`)
		setIsLoading(true)

		try {
			// Update the student's record in the classstudents table
			const { error } = await supabase
				.from('classstudents')
				.update({ classid: newClassId })
				.eq('studentid', studentId)

			if (error) {
				console.error('Error updating student class:', error)
				throw error
			}

			toast.success('Student class updated successfully!')

			// Update local state: Remove the student from the current view
			setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId))
		} catch (error) {
			toast.error('Failed to update student class. Please check console.')
		} finally {
			setIsEditStudentClassModalOpen(false)
			setStudentToEditClass(null)
			setIsLoading(false)
		}
	}

	const handleOpenManageSubjectTeachersModal = () => {
		if (section) {
			setIsManageSubjectTeachersModalOpen(true)
		} else {
			toast.error('Could not find section details to manage subject teachers.')
		}
	}

	// Close dropdown filters when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (studentFilterRef.current && !studentFilterRef.current.contains(event.target as Node)) {
				setStudentFilterOpen(false)
			}
			if (courseFilterRef.current && !courseFilterRef.current.contains(event.target as Node)) {
				setCourseFilterOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	// Filter students based on search term and filters
	const filteredStudents = students.filter(student => {
		// Match by search term
		const matchesSearch =
			!searchTerm ||
			(student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))

		// Match by status filter
		const matchesStatus = statusFilter === 'all' || student.status === statusFilter

		// Match by course filter
		const matchesCourse =
			courseFilter === 'all' ||
			(student.subjects &&
				Array.isArray(student.subjects) &&
				student.subjects.some(
					subject => subject && subject.toLowerCase() === courseFilter.toLowerCase()
				))

		return matchesSearch && matchesStatus && matchesCourse
	})

	return (
		<ClassesContainer>
			<StudentsHeaderSection>
				<div>
					<PageTitleWithBack>
						<BackButton onClick={handleBackToSections}>
							<FiArrowLeft />
							{t('classes.backTo')} {levelName} Sections
						</BackButton>
					</PageTitleWithBack>
					<PageTitle>
						{section?.name} {t('classes.students')}
					</PageTitle>
					<PageDescription>
						{filteredStudents.length} {t('classes.studentsIn')} {section?.name}
					</PageDescription>
				</div>

				<div style={{ display: 'flex', gap: '12px' }}>
					<AddButton onClick={handleOpenAddStudentsModal}>
						<FiPlus />
						<span>{t('classes.addStudents')}</span>
					</AddButton>
					<AddButton onClick={handleOpenManageSubjectTeachersModal}>
						<FiBookOpen />
						<span>{t('classes.manageSubjectTeachers')}</span>
					</AddButton>
					<ExportDataButton>
						<FiDownload />
						<span>{t('classes.exportData')}</span>
					</ExportDataButton>
				</div>
			</StudentsHeaderSection>

			{isLoading ? (
				<LoadingMessage>
					<LoadingSpinner />
					<span>{t('classes.loadingStudents')}</span>
				</LoadingMessage>
			) : (
				<StudentsView>
					{/* Search and Filter Controls */}
					<StudentsControls>
						<SearchContainer>
							<FiSearch />
							<SearchInput
								type='text'
								placeholder={t('classes.searchStudents')}
								value={searchTerm}
								onChange={handleSearchChange}
							/>
						</SearchContainer>

						<StudentsFilterGroup>
							<div ref={studentFilterRef} style={{ position: 'relative' }}>
								<FilterButton
									onClick={() => {
										setStudentFilterOpen(!studentFilterOpen)
										setCourseFilterOpen(false)
									}}
									$isActive={studentFilterOpen}
								>
									<FiFilter />
									<span>
										{t('common.filter')}:{' '}
										{statusFilter === 'all' ? t('classes.allStudents') : statusFilter}
									</span>
									<FiChevronDown />
								</FilterButton>

								{studentFilterOpen && (
									<FilterDropdownMenu>
										<FilterOption
											onClick={() => handleStudentStatusFilterChange('all')}
											$isActive={statusFilter === 'all'}
										>
											{t('classes.allStudents')}
										</FilterOption>
										<FilterOption
											onClick={() => handleStudentStatusFilterChange('active')}
											$isActive={statusFilter === 'active'}
										>
											{t('classes.active')}
										</FilterOption>
										<FilterOption
											onClick={() => handleStudentStatusFilterChange('inactive')}
											$isActive={statusFilter === 'inactive'}
										>
											{t('classes.inactive')}
										</FilterOption>
									</FilterDropdownMenu>
								)}
							</div>

							<div ref={courseFilterRef} style={{ position: 'relative' }}>
								<CourseFilterButton
									onClick={() => {
										setCourseFilterOpen(!courseFilterOpen)
										setStudentFilterOpen(false)
									}}
									$isActive={courseFilterOpen}
								>
									<FiBook />
									<span>Course: {courseFilter === 'all' ? 'All' : courseFilter}</span>
									<FiChevronDown />
								</CourseFilterButton>

								{courseFilterOpen && (
									<FilterDropdownMenu $isCourse>
										{getUniqueCourses().map((course, index) => (
											<FilterOption
												key={index}
												onClick={() => handleCourseFilterChange(course)}
												$isActive={courseFilter === course}
											>
												{course === 'all' ? 'All Courses' : course}
											</FilterOption>
										))}
									</FilterDropdownMenu>
								)}
							</div>
						</StudentsFilterGroup>
					</StudentsControls>

					{/* Students Table */}
					<StudentsTable>
						<StudentsTableHeader>
							<StudentsTableHeaderCell style={{ width: '28%' }}>
								<span>Student</span>
								<FiChevronDown />
							</StudentsTableHeaderCell>
							<StudentsTableHeaderCell style={{ width: '20%' }}>Grade</StudentsTableHeaderCell>
							<StudentsTableHeaderCell style={{ width: '20%' }}>Attendance</StudentsTableHeaderCell>
							<StudentsTableHeaderCell style={{ width: '20%' }}>Status</StudentsTableHeaderCell>
							<StudentsTableHeaderCell style={{ width: '20%' }}>Actions</StudentsTableHeaderCell>
						</StudentsTableHeader>

						<StudentsTableBody>
							{filteredStudents.map(student => (
								<StudentsTableRow key={student.id}>
									<StudentsTableCell style={{ width: '26%' }}>
										<StudentProfile>
											<StudentAvatar>{student.name.slice(0, 2)}</StudentAvatar>
											<StudentDetails>
												<StudentName>{student.name}</StudentName>
												<StudentEmail>{student.email}</StudentEmail>
											</StudentDetails>
										</StudentProfile>
									</StudentsTableCell>

									<StudentsTableCell style={{ width: '20%' }}>{section?.name}</StudentsTableCell>

									<StudentsTableCell style={{ width: '17%', color: '#f59e0b', fontWeight: 'bold' }}>
										{student.attendance}%
									</StudentsTableCell>

									<StudentsTableCell style={{ width: '15%' }}>
										<StatusIndicator>
											<StatusDot $active={student.status === 'active'} />
											<span>
												{student.status === 'active' ? t('classes.active') : t('classes.inactive')}
											</span>
										</StatusIndicator>
									</StudentsTableCell>

									<StudentsTableCell style={{ width: '12%' }}>
										<StudentActionButtons>
											<ActionIconButton
												onClick={() => handleDeleteStudentFromClass(student.id, student.name)}
												title={t('classes.removeFromClass')}
											>
												<FiTrash2 />
											</ActionIconButton>
											<ActionIconButton
												onClick={() => handleEditStudent(student)}
												title={t('classes.changeClass')}
											>
												<FiEdit />
											</ActionIconButton>
										</StudentActionButtons>
									</StudentsTableCell>
								</StudentsTableRow>
							))}
						</StudentsTableBody>
					</StudentsTable>

					{filteredStudents.length === 0 && (
						<EmptyState>
							<EmptyStateText>{t('classes.noStudentsFound')}</EmptyStateText>
						</EmptyState>
					)}
				</StudentsView>
			)}

			{/* TODO: Add modal components here when they are created */}
			{/*
			<AddStudentModal
				isOpen={isAddStudentsModalOpen}
				onClose={() => setIsAddStudentsModalOpen(false)}
				onAddStudents={handleAddStudentsToClass}
				classId={sectionId || ''}
				excludedStudentIds={students.map(s => s.id)}
			/>
			<EditStudentClassModal
				isOpen={isEditStudentClassModalOpen}
				onClose={() => setIsEditStudentClassModalOpen(false)}
				onSave={handleUpdateStudentClass}
				student={studentToEditClass!}
				currentClassId={sectionId || ''}
			/>
			<DeleteConfirmationModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={confirmDeleteStudentFromClass}
				itemName={studentToDeleteFromClass?.name || ''}
				title='Remove Student'
				message='Are you sure you want to remove this student from the class?'
			/>
			<ManageSubjectTeachersModal
				isOpen={isManageSubjectTeachersModalOpen}
				onClose={() => setIsManageSubjectTeachersModalOpen(false)}
				section={section}
			/>
			*/}
		</ClassesContainer>
	)
}

export default StudentsPage
