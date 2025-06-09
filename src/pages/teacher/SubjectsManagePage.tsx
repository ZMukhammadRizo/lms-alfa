import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FiBook, FiEdit2, FiPlus, FiSearch, FiTrash2, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import AssignSubjectModal from '../../components/AssignSubjectModal'
import supabase from '../../config/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

// Interface definitions
interface Subject {
	id: string
	subjectname: string
	code: string
	description: string
	status: 'active' | 'inactive'
}

const SubjectsManagePage: React.FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { user } = useAuth()
	const [subjects, setSubjects] = useState<Subject[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [showAddModal, setShowAddModal] = useState(false)
	const [showAssignModal, setShowAssignModal] = useState(false)
	const [currentSubject, setCurrentSubject] = useState<Subject | null>(null)
	const [formData, setFormData] = useState({
		subjectname: '',
		code: '',
		description: '',
		status: 'active' as 'active' | 'inactive',
	})
	const [detectedGrade, setDetectedGrade] = useState<string | null>(null)

	// Check if user has proper permissions to access this page
	useEffect(() => {
		const checkAccess = async () => {
			if (!user) {
				navigate('/login')
				return
			}

			const userRole = getUserRealRole()
			const parentRole = getUserParentRole()

			// Only Admin, SuperAdmin, and ModuleLeader can access this page
			const allowedRoles = ['Admin', 'SuperAdmin', 'ModuleLeader']

			if (!allowedRoles.includes(userRole)) {
				toast.error(t('common.noPermissionToAccessPage'))

				// Redirect based on role or parent role
				if (userRole === 'Teacher') {
					navigate('/teacher/dashboard')
				} else if (userRole === 'Student') {
					navigate('/student/dashboard')
				} else if (userRole === 'Parent') {
					navigate('/parent/dashboard')
				} else if (parentRole && parentRole !== 'Unknown') {
					// If they have a parent role, redirect to that dashboard
					navigate(`/${parentRole.toLowerCase()}/dashboard`)
				} else {
					// Default fallback if no specific dashboard is available
					navigate('/')
				}
			}
		}

		checkAccess()
	}, [user, navigate])

	// Fetch subjects
	useEffect(() => {
		const fetchSubjects = async () => {
			setIsLoading(true)
			try {
				const { data, error } = await supabase
					.from('subjects')
					.select('*')
					.order('subjectname', { ascending: true })

				if (error) throw error

				setSubjects(data || [])
			} catch (error) {
				console.error('Error fetching subjects:', error)
				toast.error(t('common.failedToLoadSubjects'))
			} finally {
				setIsLoading(false)
			}
		}

		fetchSubjects()
	}, [])

	// Filter subjects based on search term
	const filteredSubjects = subjects.filter(
		subject =>
			subject.subjectname.toLowerCase().includes(searchTerm.toLowerCase()) ||
			subject.code.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		setFormData({ ...formData, [name]: value })

		// Update detected grade when code changes
		if (name === 'code') {
			const grade = getGradeFromSubjectCode(value)
			setDetectedGrade(grade)
		}
	}

	const handleAddSubject = () => {
		setCurrentSubject(null)
		setFormData({
			subjectname: '',
			code: '',
			description: '',
			status: 'active',
		})
		setShowAddModal(true)
	}

	const handleEditSubject = (subject: Subject) => {
		setCurrentSubject(subject)
		setFormData({
			subjectname: subject.subjectname,
			code: subject.code,
			description: subject.description,
			status: subject.status,
		})
		setShowAddModal(true)
	}

	const handleDeleteSubject = async (id: string) => {
		// Check if subject is used in any classes
		try {
			const { count, error: countError } = await supabase
				.from('classsubjects')
				.select('*', { count: 'exact', head: true })
				.eq('subjectid', id)

			if (countError) throw countError

			if (count && count > 0) {
				toast.error(t('common.cannotDeleteSubjectInUse', { count }))
				return
			}

			// Check if subject has lessons
			const { count: lessonCount, error: lessonCountError } = await supabase
				.from('lessons')
				.select('*', { count: 'exact', head: true })
				.eq('subjectid', id)

			if (lessonCountError) throw lessonCountError

			if (lessonCount && lessonCount > 0) {
				toast.error(t('common.cannotDeleteSubjectWithLessons', { count: lessonCount }))
				return
			}

			// Delete subject
			const { error: deleteError } = await supabase.from('subjects').delete().eq('id', id)

			if (deleteError) throw deleteError

			setSubjects(subjects.filter(subject => subject.id !== id))
			toast.success(t('common.subjectDeletedSuccessfully'))
		} catch (error) {
			console.error('Error deleting subject:', error)
			toast.error(t('common.failedToDeleteSubject'))
		}
	}

	const validateForm = () => {
		if (!formData.subjectname.trim()) {
			toast.error(t('common.subjectNameRequired'))
			return false
		}
		if (!formData.code.trim()) {
			toast.error(t('common.subjectCodeRequired'))
			return false
		}
		return true
	}

	// Improve the grade extraction function to handle more formats
	const getGradeFromSubjectCode = (code: string): string | null => {
		// First check for direct grade at the end (e.g., MATH10, BIO11, CHEM12)
		const directMatch = code.match(/(\d{1,2})$/)
		if (directMatch) {
			const grade = parseInt(directMatch[1])
			// Validate it's a reasonable grade (1-12)
			if (grade >= 1 && grade <= 12) {
				return grade.toString()
			}
		}

		// If no direct match, check for a grade within a longer code (e.g., MATH101)
		// by looking for common grade numbers (10, 11, 12)
		if (code.includes('10')) return '10'
		if (code.includes('11')) return '11'
		if (code.includes('12')) return '12'

		// For single digit grades, look for them at the end or with a separator
		for (let i = 1; i <= 9; i++) {
			const grade = i.toString()
			// Check for patterns like "MATH5" or "MATH-5" or "MATH_5"
			if (
				code.endsWith(grade) ||
				code.includes(`-${grade}`) ||
				code.includes(`_${grade}`) ||
				code.includes(`.${grade}`)
			) {
				return grade
			}
		}

		return null
	}

	// Update the function to handle an array of subject IDs
	const assignSubjectToGradeSections = async (
		grade: string,
		subjectIds: string[]
	): Promise<boolean> => {
		try {
			// Find all class sections for the selected grade
			// Make sure we're using a proper pattern for matching grade sections
			const pattern = `${grade}%` // e.g., "10%" to match "10A", "10B", etc.
			console.log(`Searching for classes with pattern: ${pattern}`)

			const { data: sections, error: sectionsError } = await supabase
				.from('classes')
				.select('*')
				.like('classname', pattern)

			if (sectionsError) {
				console.error('Error fetching class sections:', sectionsError)
				toast.error('Failed to fetch class sections')
				return false
			}

			if (!sections || sections.length === 0) {
				toast.error(`No class sections found for Grade ${grade}`)
				return false
			}

			let successCount = 0
			let errorCount = 0

			// Process each subject ID
			for (const subjectId of subjectIds) {
				// For each section, create a relationship in classsubjects table
				const relationships = sections.map(section => ({
					classid: section.id,
					subjectid: subjectId,
				}))

				// Check for existing relationships to avoid duplicates
				for (const rel of relationships) {
					const { data: existingData, error: checkError } = await supabase
						.from('classsubjects')
						.select('*')
						.eq('classid', rel.classid)
						.eq('subjectid', rel.subjectid)

					if (checkError) {
						console.error('Error checking existing relationship:', checkError)
						errorCount++
						continue
					}

					// If there are any existing relationships, skip
					if (existingData && existingData.length > 0) {
						continue
					}

					// Insert the new relationship
					const { error: insertError } = await supabase.from('classsubjects').insert([rel])

					if (insertError) {
						console.error('Error inserting relationship:', insertError)
						errorCount++
						continue
					}

					successCount++
				}
			}

			if (errorCount > 0) {
				toast.warning(`Assigned ${successCount} relationships with ${errorCount} errors`)
			} else {
				toast.success(
					`Successfully assigned ${subjectIds.length} subject(s) to all sections of Grade ${grade}`
				)
			}
			return true
		} catch (error) {
			console.error('Error in assignSubjectToGradeSections:', error)
			return false
		}
	}

	// Update the handleSubmit function
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) return

		try {
			if (currentSubject) {
				// Update existing subject
				const { error } = await supabase
					.from('subjects')
					.update({
						subjectname: formData.subjectname,
						code: formData.code,
						description: formData.description,
						status: formData.status,
					})
					.eq('id', currentSubject.id)

				if (error) throw error

				setSubjects(
					subjects.map(subject =>
						subject.id === currentSubject.id ? { ...subject, ...formData } : subject
					)
				)

				toast.success('Subject updated successfully')
			} else {
				// Create new subject
				const { data, error } = await supabase
					.from('subjects')
					.insert([
						{
							subjectname: formData.subjectname,
							code: formData.code,
							description: formData.description,
							status: formData.status,
						},
					])
					.select()
					.single()

				if (error) throw error

				setSubjects([...subjects, data])

				// Extract grade from subject code and auto-assign to grade sections
				const grade = getGradeFromSubjectCode(formData.code)
				if (grade) {
					// Attempt to auto-assign the subject to all sections of this grade
					const assignSuccess = await assignSubjectToGradeSections(grade, [data.id])
					if (assignSuccess) {
						toast.success(`Subject created and assigned to Grade ${grade} sections`)
					} else {
						toast.success('Subject created successfully, but could not assign to grade sections')
					}
				} else {
					toast.success('Subject created successfully')
				}
			}

			setShowAddModal(false)
		} catch (error) {
			console.error('Error saving subject:', error)
			toast.error('Failed to save subject')
		}
	}

	// Handle assigning subject to grade
	const handleAssignSubject = () => {
		setShowAssignModal(true)
	}

	// Handle the actual assignment process
	const handleAssignSubjectToGrade = async (
		grade: string,
		subjectIds: string[]
	): Promise<boolean> => {
		try {
			if (!subjectIds.length) {
				toast.error('No subjects selected for assignment')
				return false
			}

			// Find all class sections for the selected grade
			const { data: sections, error: sectionsError } = await supabase
				.from('classes')
				.select('*')
				.like('classname', `${grade}%`)

			if (sectionsError) throw sectionsError

			if (!sections || sections.length === 0) {
				toast.error(`No class sections found for Grade ${grade}`)
				return false
			}

			let successCount = 0
			let errorCount = 0
			let alreadyAssignedCount = 0

			// Process each subject ID
			for (const subjectId of subjectIds) {
				// For each section, create a relationship in classsubjects table
				const relationships = sections.map(section => ({
					classid: section.id,
					subjectid: subjectId,
				}))

				// Check for existing relationships to avoid duplicates
				for (const rel of relationships) {
					const { data: existingData, error: checkError } = await supabase
						.from('classsubjects')
						.select('*')
						.eq('classid', rel.classid)
						.eq('subjectid', rel.subjectid)

					if (checkError) {
						console.error('Error checking existing relationship:', checkError)
						errorCount++
						continue
					}

					// If there are any existing relationships, skip
					if (existingData && existingData.length > 0) {
						alreadyAssignedCount++
						continue
					}

					// Insert the new relationship
					const { error: insertError } = await supabase.from('classsubjects').insert([rel])

					if (insertError) {
						console.error('Error inserting relationship:', insertError)
						errorCount++
						continue
					}

					successCount++
				}
			}

			const totalAttempted = successCount + errorCount + alreadyAssignedCount

			if (errorCount > 0 && successCount > 0) {
				toast.warning(
					`Assigned ${successCount} new relationships with ${errorCount} errors. ${alreadyAssignedCount} were already assigned.`
				)
				return true
			} else if (errorCount > 0 && successCount === 0) {
				toast.error(`Failed to assign subjects. All ${errorCount} assignments failed.`)
				return false
			} else if (alreadyAssignedCount === totalAttempted) {
				toast.info(`All selected subjects were already assigned to Grade ${grade} sections.`)
				return true
			} else {
				toast.success(
					`Successfully assigned ${subjectIds.length} subject(s) to all sections of Grade ${grade}`
				)
				return true
			}
		} catch (error) {
			console.error('Error assigning subjects to grade:', error)
			toast.error('Failed to assign subjects to grade')
			return false
		}
	}

	const getUserRealRole = () => {
		const userInfo = localStorage.getItem('lms_user')
		if (userInfo) {
			try {
				const parsedInfo = JSON.parse(userInfo)
				if (parsedInfo.role && typeof parsedInfo.role === 'object') {
					return parsedInfo.role.name || 'Student'
				}

				if (parsedInfo.role && typeof parsedInfo.role === 'string') {
					return parsedInfo.role || 'Student'
				}

				return 'Student'
			} catch (error) {
				console.error('Error parsing user info:', error)
				return 'Student'
			}
		}
		return user?.role || 'Student'
	}

	// Check if user is a module leader
	const isModuleLeader = () => {
		const userInfo = localStorage.getItem('lms_user')
		if (userInfo) {
			try {
				const parsedInfo = JSON.parse(userInfo)

				if (parsedInfo.role && typeof parsedInfo.role === 'object') {
					return parsedInfo.role.name === 'ModuleLeader' || false
				}

				if (parsedInfo.role && typeof parsedInfo.role === 'string') {
					return parsedInfo.role === 'ModuleLeader' || false
				}

				if (parsedInfo.isModuleLeader) {
					return parsedInfo.isModuleLeader || false
				}

				return false
			} catch (error) {
				console.error('Error parsing user info:', error)
				return false
			}
		}
		return user?.isModuleLeader || false
	}

	const getUserParentRole = () => {
		const userInfo = localStorage.getItem('lms_user')
		if (userInfo) {
			try {
				const parsedInfo = JSON.parse(userInfo)
				if (parsedInfo.role && typeof parsedInfo.role === 'object' && parsedInfo.role.parent) {
					return parsedInfo.role.parent.name || 'Unknown'
				}
				return 'Unknown'
			} catch (error) {
				console.error('Error parsing user info:', error)
				return 'Unknown'
			}
		}
		return 'Unknown'
	}

	const realRole = getUserRealRole()
	const parentRole = getUserParentRole()

	if (isLoading) {
		return (
			<PageContainer>
				<LoadingMessage>{t('common.loadingSubjects')}</LoadingMessage>
			</PageContainer>
		)
	}

	return (
		<PageContainer
			as={motion.div}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			<PageHeader>
				<div>
					<PageTitle>{t('common.subjectManagement')}</PageTitle>
					<PageDescription>{t('common.manageSubjectsAndViewDetails')}</PageDescription>
				</div>
				{realRole !== 'ModuleLeader' && (
					<ActionButtonsContainer>
						<AssignButton onClick={handleAssignSubject}>
							<FiBook />
							<span>{t('common.assignToGrade')}</span>
						</AssignButton>
						<AddButton onClick={handleAddSubject}>
							<FiPlus />
							<span>{t('common.addSubject')}</span>
						</AddButton>
					</ActionButtonsContainer>
				)}
			</PageHeader>

			<SearchContainer>
				<SearchIconWrapper>
					<FiSearch />
				</SearchIconWrapper>
				<SearchInput
					type='text'
					placeholder={t('common.searchSubjects')}
					value={searchTerm}
					onChange={handleSearchChange}
				/>
			</SearchContainer>

			<SubjectGrid>
				{filteredSubjects.length > 0 ? (
					filteredSubjects.map(subject => (
						<SubjectCard key={subject.id}>
							<SubjectCardHeader>
								<SubjectCode>{subject.code}</SubjectCode>
								<SubjectStatus $isActive={subject.status === 'active'}>
									{subject.status}
								</SubjectStatus>
							</SubjectCardHeader>
							<SubjectName>{subject.subjectname}</SubjectName>
							<SubjectDescription>{subject.description}</SubjectDescription>
							<SubjectActions>
								<ActionButton
									title={t('common.viewLessons')}
									onClick={() => {
										navigate(
											`/${
												parentRole ? parentRole.toLowerCase() : realRole.toLowerCase()
											}/subjects/${subject.id}/lessons`
										)
									}}
								>
									<FiBook />
								</ActionButton>
								<ActionButton title={t('common.editSubject')} onClick={() => handleEditSubject(subject)}>
									<FiEdit2 />
								</ActionButton>
								<ActionButton
									title={t('common.deleteSubject')}
									onClick={() => handleDeleteSubject(subject.id)}
								>
									<FiTrash2 />
								</ActionButton>
							</SubjectActions>
						</SubjectCard>
					))
				) : (
					<EmptyState>
						<EmptyStateText>{t('common.noSubjectsFound')}</EmptyStateText>
					</EmptyState>
				)}
			</SubjectGrid>

			{/* Add/Edit Subject Modal */}
			{showAddModal && (
				<ModalOverlay>
					<ModalContent
						as={motion.div}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
					>
						<ModalHeader>
							<ModalTitle>{currentSubject ? t('common.editSubject') : t('common.addNewSubject')}</ModalTitle>
							<CloseButton onClick={() => setShowAddModal(false)}>
								<FiX />
							</CloseButton>
						</ModalHeader>
						<ModalBody>
							{!currentSubject && (
								<InfoPanel>
									<InfoTitle>{t('common.automaticGradeAssignment')}</InfoTitle>
									<InfoDescription>
										{t('common.automaticGradeAssignmentDescription')}
									</InfoDescription>
								</InfoPanel>
							)}
							<form onSubmit={handleSubmit}>
								<FormGroup>
									<FormLabel htmlFor='subjectname'>{t('common.subjectName')}</FormLabel>
									<FormInput
										id='subjectname'
										name='subjectname'
										value={formData.subjectname}
										onChange={handleInputChange}
										placeholder={t('common.enterSubjectName')}
										required
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='code'>{t('common.subjectCode')}</FormLabel>
									<FormInput
										id='code'
										name='code'
										value={formData.code}
										onChange={handleInputChange}
										placeholder={t('common.enterSubjectCode')}
										required
									/>
									<CodeHelp>
										{t('common.codeHelp')}{' '}
										<Example>MATH10</Example> for Grade 10, <Example>BIO11</Example> for Grade 11.
										{detectedGrade && (
											<div style={{ marginTop: '6px', color: '#059669', fontWeight: '500' }}>
												{t('common.gradeDetected', { grade: detectedGrade })}
											</div>
										)}
									</CodeHelp>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='description'>{t('common.description')}</FormLabel>
									<FormTextarea
										id='description'
										name='description'
										value={formData.description}
										onChange={handleInputChange}
										placeholder={t('common.enterSubjectDescription')}
										rows={3}
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel htmlFor='status'>{t('common.status')}</FormLabel>
									<FormSelect
										id='status'
										name='status'
										value={formData.status}
										onChange={handleInputChange}
									>
										<option value='active'>{t('common.active')}</option>
										<option value='inactive'>{t('common.inactive')}</option>
									</FormSelect>
								</FormGroup>
								<ButtonContainer>
									<CancelButton type='button' onClick={() => setShowAddModal(false)}>
										{t('common.cancel')}
									</CancelButton>
									<SubmitButton type='submit'>
										{currentSubject ? t('common.updateSubject') : t('common.createSubject')}
									</SubmitButton>
								</ButtonContainer>
							</form>
						</ModalBody>
					</ModalContent>
				</ModalOverlay>
			)}

			{/* Assign Subject Modal */}
			<AssignSubjectModal
				isOpen={showAssignModal}
				onClose={() => setShowAssignModal(false)}
				onAssign={handleAssignSubjectToGrade}
			/>
		</PageContainer>
	)
}

// Styled Components
const PageContainer = styled.div`
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
`

const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
	}
`

const PageTitle = styled.h1`
	font-size: 1.75rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0 0 0.5rem;
`

const PageDescription = styled.p`
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
	margin: 0;
`

const ActionButtonsContainer = styled.div`
	display: flex;
	gap: 12px;
`

const AddButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.primary[700]};
	}
`

const SearchContainer = styled.div`
	position: relative;
	margin-bottom: 2rem;
	max-width: 500px;
`

const SearchIconWrapper = styled.div`
	position: absolute;
	left: 1rem;
	top: 50%;
	transform: translateY(-50%);
	color: ${props => props.theme.colors.neutral[400]};
`

const SearchInput = styled.input`
	width: 100%;
	padding: 0.75rem 1rem 0.75rem 2.5rem;
	border: 1px solid ${props => props.theme.colors.neutral[300]};
	border-radius: 0.5rem;
	font-size: 1rem;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[400]};
		box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
	}
`

const SubjectGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 1.5rem;
`

const SubjectCard = styled.div`
	background-color: white;
	border-radius: 0.75rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	padding: 1.5rem;
	transition: all 0.2s ease;

	&:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}
`

const SubjectCardHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.75rem;
`

const SubjectCode = styled.div`
	font-size: 0.9rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.secondary};
	background-color: ${props => props.theme.colors.neutral[100]};
	padding: 0.25rem 0.75rem;
	border-radius: 0.25rem;
`

interface StatusProps {
	$isActive: boolean
}

const SubjectStatus = styled.div<StatusProps>`
	font-size: 0.8rem;
	font-weight: 500;
	color: ${props =>
		props.$isActive ? props.theme.colors.success[700] : props.theme.colors.danger[700]};
	background-color: ${props =>
		props.$isActive ? props.theme.colors.success[50] : props.theme.colors.danger[50]};
	padding: 0.25rem 0.75rem;
	border-radius: 0.25rem;
`

const SubjectName = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0 0 0.75rem;
`

const SubjectDescription = styled.p`
	font-size: 0.9rem;
	color: ${props => props.theme.colors.text.secondary};
	margin: 0 0 1.5rem;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
	text-overflow: ellipsis;
	min-height: 3.6rem;
`

const SubjectActions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
`

const ActionButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 0.5rem;
	border: 1px solid ${props => props.theme.colors.neutral[200]};
	background-color: white;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.neutral[100]};
		color: ${props => props.theme.colors.primary[600]};
	}
`

const EmptyState = styled.div`
	grid-column: 1 / -1;
	padding: 3rem;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: white;
	border-radius: 0.75rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

const EmptyStateText = styled.p`
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
`

const LoadingMessage = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 300px;
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
`

const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
	padding: 1rem;
`

const ModalContent = styled.div`
	background-color: white;
	border-radius: 0.75rem;
	width: 100%;
	max-width: 600px;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem;
	border-bottom: 1px solid ${props => props.theme.colors.neutral[200]};
`

const ModalTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
`

const CloseButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 0.5rem;
	border: none;
	background-color: transparent;
	color: ${props => props.theme.colors.text.secondary};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.neutral[100]};
		color: ${props => props.theme.colors.text.primary};
	}
`

const ModalBody = styled.div`
	padding: 1.5rem;
`

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`

const FormLabel = styled.label`
	display: block;
	font-size: 0.9rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
	margin-bottom: 0.5rem;
`

const FormInput = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid ${props => props.theme.colors.neutral[300]};
	border-radius: 0.5rem;
	font-size: 1rem;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[500]};
		box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
	}
`

const FormTextarea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid ${props => props.theme.colors.neutral[300]};
	border-radius: 0.5rem;
	font-size: 1rem;
	resize: vertical;
	min-height: 100px;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[500]};
		box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
	}
`

const FormSelect = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid ${props => props.theme.colors.neutral[300]};
	border-radius: 0.5rem;
	font-size: 1rem;
	background-color: white;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[500]};
		box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
	}
`

const ButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
	margin-top: 1.5rem;
`

const Button = styled.button`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
`

const CancelButton = styled(Button)`
	background-color: white;
	color: ${props => props.theme.colors.text.primary};
	border: 1px solid ${props => props.theme.colors.neutral[300]};

	&:hover {
		background-color: ${props => props.theme.colors.neutral[100]};
	}
`

const SubmitButton = styled(Button)`
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	border: none;

	&:hover {
		background-color: ${props => props.theme.colors.primary[700]};
	}
`

// New styled component for the assign button
const AssignButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	background-color: #10b981;
	color: white;
	border: none;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background-color: #059669;
	}

	& > svg {
		font-size: 18px;
	}
`

// Add these new styled components after other existing styled components
const InfoPanel = styled.div`
	background-color: #f0f9ff;
	border-radius: 8px;
	padding: 16px;
	margin-bottom: 24px;
	border-left: 4px solid #3b82f6;
`

const InfoTitle = styled.p`
	font-weight: 600;
	margin: 0 0 8px 0;
	color: #1f2937;
`

const InfoDescription = styled.p`
	margin: 0;
	color: #4b5563;
	font-size: 14px;
	line-height: 1.5;
`

const CodeHelp = styled.div`
	font-size: 12px;
	color: #6b7280;
	margin-top: 6px;
`

const Example = styled.span`
	font-family: monospace;
	background-color: #f3f4f6;
	padding: 2px 4px;
	border-radius: 4px;
`

export default SubjectsManagePage
