import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FiBook, FiCheck, FiSave, FiUser, FiUsers, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import styled from 'styled-components'
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

interface Student {
	id: string
	firstName: string
	lastName: string
	email: string
}

const NewClassPage: React.FC = () => {
	const navigate = useNavigate()
	const { user } = useAuth()
	const [subjects, setSubjects] = useState<Subject[]>([])
	const [students, setStudents] = useState<Student[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [formData, setFormData] = useState({
		classname: '',
		description: '',
		selectedSubjects: [] as string[],
		selectedStudents: [] as string[],
	})
	const [isFormSubmitting, setIsFormSubmitting] = useState(false)
	const [formErrors, setFormErrors] = useState({
		classname: '',
		description: '',
		subjects: '',
		students: '',
	})

	// Check if user is a module leader
	useEffect(() => {
		const checkModuleLeader = async () => {
			if (!user) {
				navigate('/login')
				return
			}

			// Check if user is a module leader
			if (!user.isModuleLeader) {
				toast.error('You do not have permission to access this page')
				navigate('/admin/dashboard')
			}
		}

		checkModuleLeader()
	}, [user, navigate])

	// Fetch subjects and students
	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true)
			try {
				// Fetch active subjects
				const { data: subjectsData, error: subjectsError } = await supabase
					.from('subjects')
					.select('*')
					.eq('status', 'active')
					.order('subjectname', { ascending: true })

				if (subjectsError) throw subjectsError

				// Fetch students (users with role Student)
				const { data: studentsData, error: studentsError } = await supabase
					.from('users')
					.select('id, firstName, lastName, email')
					.eq('role', 'Student')
					.order('lastName', { ascending: true })

				if (studentsError) throw studentsError

				setSubjects(subjectsData || [])
				setStudents(studentsData || [])
			} catch (error) {
				console.error('Error fetching data:', error)
				toast.error('Failed to load necessary data')
			} finally {
				setIsLoading(false)
			}
		}

		fetchData()
	}, [])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setFormData({ ...formData, [name]: value })

		// Clear error if user is typing
		if (formErrors[name as keyof typeof formErrors]) {
			setFormErrors({ ...formErrors, [name]: '' })
		}
	}

	const toggleSubject = (subjectId: string) => {
		setFormData(prev => {
			const isSelected = prev.selectedSubjects.includes(subjectId)
			const newSelectedSubjects = isSelected
				? prev.selectedSubjects.filter(id => id !== subjectId)
				: [...prev.selectedSubjects, subjectId]

			// Clear subject error if at least one subject is selected
			let newErrors = { ...formErrors }
			if (newSelectedSubjects.length > 0) {
				newErrors.subjects = ''
			}
			setFormErrors(newErrors)

			return { ...prev, selectedSubjects: newSelectedSubjects }
		})
	}

	const toggleStudent = (studentId: string) => {
		setFormData(prev => {
			const isSelected = prev.selectedStudents.includes(studentId)
			const newSelectedStudents = isSelected
				? prev.selectedStudents.filter(id => id !== studentId)
				: [...prev.selectedStudents, studentId]

			// Clear student error if at least one student is selected
			let newErrors = { ...formErrors }
			if (newSelectedStudents.length > 0) {
				newErrors.students = ''
			}
			setFormErrors(newErrors)

			return { ...prev, selectedStudents: newSelectedStudents }
		})
	}

	const validateForm = (): boolean => {
		const errors = {
			classname: formData.classname.trim() ? '' : 'Class name is required',
			description: formData.description.trim() ? '' : 'Description is required',
			subjects: formData.selectedSubjects.length > 0 ? '' : 'Please select at least one subject',
			students: formData.selectedStudents.length > 0 ? '' : 'Please select at least one student',
		}

		setFormErrors(errors)
		return !Object.values(errors).some(error => error)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) return

		setIsFormSubmitting(true)

		try {
			// 1. Create the class
			const { data: classData, error: classError } = await supabase
				.from('classes')
				.insert([
					{
						classname: formData.classname,
						description: formData.description,
						createdby: user?.id,
						status: 'active',
					},
				])
				.select()
				.single()

			if (classError) throw classError
			if (!classData) throw new Error('Failed to create class')

			const classId = classData.id

			// 2. Create relationships for subjects
			const classSubjectsToInsert = formData.selectedSubjects.map(subjectId => ({
				classid: classId,
				subjectid: subjectId,
			}))

			const { error: classSubjectsError } = await supabase
				.from('classsubjects')
				.insert(classSubjectsToInsert)

			if (classSubjectsError) throw classSubjectsError

			// 3. Create relationships for students
			const classStudentsToInsert = formData.selectedStudents.map(studentId => ({
				classid: classId,
				studentid: studentId,
			}))

			const { error: classStudentsError } = await supabase
				.from('classstudents')
				.insert(classStudentsToInsert)

			if (classStudentsError) throw classStudentsError

			toast.success('Class created successfully!')
			navigate('/admin/classes')
		} catch (error) {
			console.error('Error creating class:', error)
			toast.error('Failed to create class. Please try again.')
		} finally {
			setIsFormSubmitting(false)
		}
	}

	if (isLoading) {
		return (
			<PageContainer>
				<LoadingMessage>Loading...</LoadingMessage>
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
				<PageTitle>Create New Class</PageTitle>
				<PageDescription>Create a new class with subjects and students</PageDescription>
			</PageHeader>

			<FormContainer onSubmit={handleSubmit}>
				<FormSection>
					<SectionTitle>
						<SectionTitleIcon>
							<FiBook />
						</SectionTitleIcon>
						<span>Class Information</span>
					</SectionTitle>

					<FormGroup>
						<FormLabel>Class Name</FormLabel>
						<FormInput
							type='text'
							name='classname'
							value={formData.classname}
							onChange={handleInputChange}
							placeholder='Enter class name'
						/>
						{formErrors.classname && <ErrorMessage>{formErrors.classname}</ErrorMessage>}
					</FormGroup>

					<FormGroup>
						<FormLabel>Description</FormLabel>
						<FormTextarea
							name='description'
							value={formData.description}
							onChange={handleInputChange}
							placeholder='Enter class description'
							rows={3}
						/>
						{formErrors.description && <ErrorMessage>{formErrors.description}</ErrorMessage>}
					</FormGroup>
				</FormSection>

				<FormSection>
					<SectionTitle>
						<SectionTitleIcon>
							<FiBook />
						</SectionTitleIcon>
						<span>Subjects</span>
					</SectionTitle>

					{formErrors.subjects && <ErrorMessage>{formErrors.subjects}</ErrorMessage>}

					<SelectionContainer>
						{subjects.length > 0 ? (
							subjects.map(subject => (
								<SelectionItem
									key={subject.id}
									$isSelected={formData.selectedSubjects.includes(subject.id)}
									onClick={() => toggleSubject(subject.id)}
								>
									<SelectionItemIcon $isSelected={formData.selectedSubjects.includes(subject.id)}>
										{formData.selectedSubjects.includes(subject.id) ? <FiCheck /> : <FiBook />}
									</SelectionItemIcon>
									<SelectionItemContent>
										<SelectionItemTitle>{subject.subjectname}</SelectionItemTitle>
										<SelectionItemSubtitle>{subject.code}</SelectionItemSubtitle>
									</SelectionItemContent>
								</SelectionItem>
							))
						) : (
							<EmptyStateMessage>No subjects available</EmptyStateMessage>
						)}
					</SelectionContainer>
				</FormSection>

				<FormSection>
					<SectionTitle>
						<SectionTitleIcon>
							<FiUsers />
						</SectionTitleIcon>
						<span>Students</span>
					</SectionTitle>

					{formErrors.students && <ErrorMessage>{formErrors.students}</ErrorMessage>}

					<SelectionContainer>
						{students.length > 0 ? (
							students.map(student => (
								<SelectionItem
									key={student.id}
									$isSelected={formData.selectedStudents.includes(student.id)}
									onClick={() => toggleStudent(student.id)}
								>
									<SelectionItemIcon $isSelected={formData.selectedStudents.includes(student.id)}>
										{formData.selectedStudents.includes(student.id) ? <FiCheck /> : <FiUser />}
									</SelectionItemIcon>
									<SelectionItemContent>
										<SelectionItemTitle>
											{student.firstName} {student.lastName}
										</SelectionItemTitle>
										<SelectionItemSubtitle>{student.email}</SelectionItemSubtitle>
									</SelectionItemContent>
								</SelectionItem>
							))
						) : (
							<EmptyStateMessage>No students available</EmptyStateMessage>
						)}
					</SelectionContainer>
				</FormSection>

				<ButtonContainer>
					<CancelButton type='button' onClick={() => navigate('/admin/classes')}>
						<FiX />
						<span>Cancel</span>
					</CancelButton>
					<SubmitButton type='submit' disabled={isFormSubmitting}>
						<FiSave />
						<span>{isFormSubmitting ? 'Creating...' : 'Create Class'}</span>
					</SubmitButton>
				</ButtonContainer>
			</FormContainer>
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
	margin-bottom: 2rem;
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

const FormContainer = styled.form`
	display: flex;
	flex-direction: column;
	gap: 2rem;
`

const FormSection = styled.div`
	background-color: white;
	border-radius: 0.75rem;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

const SectionTitle = styled.h2`
	display: flex;
	align-items: center;
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0 0 1.5rem;
`

const SectionTitleIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border-radius: 0.5rem;
	background-color: ${props => props.theme.colors.primary[100]};
	color: ${props => props.theme.colors.primary[600]};
	margin-right: 0.75rem;
`

const FormGroup = styled.div`
	margin-bottom: 1.5rem;

	&:last-child {
		margin-bottom: 0;
	}
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
	transition: all 0.2s ease;

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
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: ${props => props.theme.colors.primary[500]};
		box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
	}
`

const SelectionContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	gap: 1rem;
	max-height: 400px;
	overflow-y: auto;
	padding-right: 0.5rem;

	/* Scrollbar styling */
	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.05);
		border-radius: 10px;
	}

	&::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 10px;
	}

	&::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.3);
	}
`

interface SelectionItemProps {
	$isSelected: boolean
}

const SelectionItem = styled.div<SelectionItemProps>`
	display: flex;
	align-items: center;
	padding: 1rem;
	border-radius: 0.5rem;
	border: 1px solid
		${props =>
			props.$isSelected ? props.theme.colors.primary[500] : props.theme.colors.neutral[300]};
	background-color: ${props => (props.$isSelected ? props.theme.colors.primary[50] : 'white')};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		border-color: ${props => props.theme.colors.primary[400]};
		background-color: ${props =>
			props.$isSelected ? props.theme.colors.primary[50] : props.theme.colors.neutral[50]};
	}
`

const SelectionItemIcon = styled.div<SelectionItemProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border-radius: 0.5rem;
	background-color: ${props =>
		props.$isSelected ? props.theme.colors.primary[500] : props.theme.colors.neutral[100]};
	color: ${props => (props.$isSelected ? 'white' : props.theme.colors.text.secondary)};
	margin-right: 0.75rem;
`

const SelectionItemContent = styled.div`
	flex: 1;
`

const SelectionItemTitle = styled.div`
	font-size: 0.9rem;
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const SelectionItemSubtitle = styled.div`
	font-size: 0.8rem;
	color: ${props => props.theme.colors.text.secondary};
`

const ButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
	margin-top: 1rem;
`

const Button = styled.button`
	display: flex;
	align-items: center;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	svg {
		margin-right: 0.5rem;
	}
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

	&:disabled {
		background-color: ${props => props.theme.colors.primary[300]};
		cursor: not-allowed;
	}
`

const ErrorMessage = styled.div`
	color: ${props => props.theme.colors.danger[500]};
	font-size: 0.85rem;
	margin-top: 0.5rem;
`

const EmptyStateMessage = styled.div`
	padding: 2rem;
	text-align: center;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.9rem;
	border: 1px dashed ${props => props.theme.colors.neutral[300]};
	border-radius: 0.5rem;
	grid-column: 1 / -1;
`

const LoadingMessage = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 300px;
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
`

export default NewClassPage
