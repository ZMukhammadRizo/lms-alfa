import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiInfo, FiX } from 'react-icons/fi'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import supabase from '../config/supabaseClient'

// Improve the helper function to extract grade from subject code
const getGradeFromSubjectCode = (code: string): string | null => {
	// Normalize the code to uppercase and remove spaces
	const normalizedCode = code.toUpperCase().replace(/\s+/g, '')

	// Pattern 1: Direct grade at the end (e.g., MATH10, BIO11, CHEM12)
	const directGradeMatch = normalizedCode.match(/(\d{1,2})$/)
	if (directGradeMatch) {
		const grade = parseInt(directGradeMatch[1])
		// Validate it's a reasonable grade (1-12)
		if (grade >= 1 && grade <= 12) {
			return grade.toString()
		}
	}

	// Pattern 2: Grade with a separator at the end or in the middle
	// Examples: MATH-10, PHYS_10, BIO.10, CHEM-10A
	const separatorMatch = normalizedCode.match(/[-_.:](\d{1,2})(?:[A-Z])?$/)
	if (separatorMatch) {
		const grade = parseInt(separatorMatch[1])
		if (grade >= 1 && grade <= 12) {
			return grade.toString()
		}
	}

	// Pattern 3: Grade as a prefix like 10MATH
	const prefixMatch = normalizedCode.match(/^(\d{1,2})[A-Z]/)
	if (prefixMatch) {
		const grade = parseInt(prefixMatch[1])
		if (grade >= 1 && grade <= 12) {
			return grade.toString()
		}
	}

	// Pattern 4: Grade embedded in the code with clear boundaries
	// Be careful with this one to avoid false positives
	const boundaryMatches = [
		// Grade at the end followed by a non-digit (e.g., MATH10A)
		normalizedCode.match(/(\d{1,2})[A-Z]$/),
		// Grade as part of a clear grade identifier (like G10, GR10, GRADE10)
		normalizedCode.match(/G(?:R(?:ADE)?)?(\d{1,2})/i),
	]

	for (const match of boundaryMatches) {
		if (match) {
			const grade = parseInt(match[1])
			if (grade >= 1 && grade <= 12) {
				return grade.toString()
			}
		}
	}

	return null
}

// Modal styles
const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.6);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1050;
`

const ModalContent = styled.div`
	background: white;
	padding: 2rem;
	border-radius: 0.75rem;
	width: 90%;
	max-width: 600px;
	box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid #e5e7eb;
`

const ModalTitle = styled.h2`
	margin: 0;
	font-size: 1.4rem;
	font-weight: 600;
	color: #1f2937;
`

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	cursor: pointer;
	color: #6b7280;
	padding: 0.5rem;
	line-height: 1;

	&:hover {
		color: #1f2937;
	}
`

const InfoPanel = styled.div`
	background-color: #eef2ff;
	border-left: 4px solid #6366f1;
	padding: 1rem;
	border-radius: 0.375rem;
	margin-bottom: 1.5rem;
	display: flex;
	gap: 0.75rem;
`

const InfoIcon = styled.div`
	color: #6366f1;
	font-size: 1.25rem;
	margin-top: 0.1rem;
`

const InfoTextContainer = styled.div``

const InfoTitle = styled.h4`
	margin: 0 0 0.25rem 0;
	font-weight: 600;
	color: #4338ca;
`

const InfoDescription = styled.p`
	margin: 0;
	font-size: 0.875rem;
	color: #4f46e5;
	line-height: 1.5;
`

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`

const Label = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 500;
	color: #374151;
`

const Required = styled.span`
	color: #ef4444;
	margin-left: 4px;
`

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.9rem;
	background-color: white;
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
	}
`

const SubjectList = styled.div`
	max-height: 200px;
	overflow-y: auto;
	border: 1px solid #e5e7eb;
	border-radius: 0.375rem;
	padding: 0.5rem;
	margin-top: 0.5rem;
`

const SubjectItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.6rem;
	border-radius: 0.25rem;
	margin-bottom: 0.25rem;
	cursor: default;

	&:hover {
		background-color: #f9fafb;
	}
`

const LoadingIndicator = styled.div`
	color: #6b7280;
	font-style: italic;
	margin-top: 0.5rem;
`

const Checkbox = styled.input`
	width: 1.25rem;
	height: 1.25rem;
	cursor: pointer;
`

const SubjectLabel = styled.span`
	font-weight: 500;
	color: #374151;
`

const SubjectCode = styled.span`
	font-size: 0.875rem;
	color: #6b7280;
	background-color: #f3f4f6;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
`

const ModalFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
	margin-top: 1.5rem;
	padding-top: 1rem;
	border-top: 1px solid #e5e7eb;
`

const CancelButton = styled.button`
	padding: 0.5rem 1rem;
	border: 1px solid #d1d5db;
	background-color: white;
	color: #374151;
	border-radius: 0.375rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background-color: #f9fafb;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

const AssignButton = styled.button`
	padding: 0.5rem 1rem;
	background-color: #6366f1;
	color: white;
	border: none;
	border-radius: 0.375rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background-color: #5856eb;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background-color: #9ca3af;
	}
`

// Update the interface for multi-select functionality
interface AssignSubjectModalProps {
	isOpen: boolean
	onClose: () => void
	onAssign: (grade: string, subjectIds: string[]) => Promise<boolean>
	newlyCreatedSubjectId?: string | null
}

const generateRandomColor = () => {
	const letters = '0123456789ABCDEF'
	let color = '#'
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)]
	}
	return color
}

interface SubjectType {
	id: string
	name: string
	code: string
	color: string
	isAssigned?: boolean
}

const AssignSubjectModal: React.FC<AssignSubjectModalProps> = ({
	isOpen,
	onClose,
	onAssign,
	newlyCreatedSubjectId,
}) => {
	const { t } = useTranslation()
	const [selectedGrade, setSelectedGrade] = useState<string>('')
	const [allSubjects, setAllSubjects] = useState<SubjectType[]>([])
	const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [availableGrades, setAvailableGrades] = useState<string[]>([])
	const [filteredSubjects, setFilteredSubjects] = useState<SubjectType[]>([])

	// Fetch subjects and available grades on mount
	useEffect(() => {
		if (!isOpen) return // Only fetch when modal opens

		const fetchData = async () => {
			setIsLoading(true)
			setError(null)
			try {
				// Fetch all subjects
				const { data: subjectsData, error: subjectsError } = await supabase
					.from('subjects')
					.select('*')

				if (subjectsError) throw subjectsError
				setAllSubjects(subjectsData || [])

				// If there's a newly created subject, try to find its grade from its code
				if (newlyCreatedSubjectId && subjectsData) {
					const newSubject = subjectsData.find(s => s.id === newlyCreatedSubjectId)
					if (newSubject) {
						const grade = getGradeFromSubjectCode(newSubject.code || '')
						if (grade) {
							setSelectedGrade(grade)
						}
					}
				}

				// Fetch all classes to determine available grades
				const { data: classesData, error: classesError } = await supabase
					.from('classes')
					.select('classname')

				if (classesError) throw classesError

				// Extract unique grade levels from class names
				if (classesData) {
					const gradeLevels = new Set<string>()
					classesData.forEach(c => {
						const match = c.classname?.match(/^(\d+)/) // Match digits at the start
						if (match && match[1]) {
							gradeLevels.add(match[1])
						}
					})
					// Sort grades numerically
					const sortedGrades = Array.from(gradeLevels).sort((a, b) => parseInt(a) - parseInt(b))
					setAvailableGrades(sortedGrades)
				} else {
					setAvailableGrades([])
				}
			} catch (err: any) {
				console.error('Error fetching data for assign modal:', err)
				setError(err.message || 'Failed to load data.')
				setAllSubjects([])
				setAvailableGrades([])
			} finally {
				setIsLoading(false)
			}
		}

		fetchData()
	}, [isOpen, newlyCreatedSubjectId]) // Re-fetch when modal opens or newlyCreatedSubjectId changes

	// Filter subjects whenever the selected grade or the list of all subjects changes
	useEffect(() => {
		if (selectedGrade && allSubjects.length > 0) {
			const subjectsForGrade = allSubjects.filter(subject => {
				const subjectGrade = getGradeFromSubjectCode(subject.code || '')
				return subjectGrade === selectedGrade
			})
			setFilteredSubjects(subjectsForGrade)

			// Preselect the newly created subject if it's in the filtered list
			if (newlyCreatedSubjectId) {
				const newSubjectInFiltered = subjectsForGrade.some(s => s.id === newlyCreatedSubjectId)
				if (newSubjectInFiltered) {
					setSelectedSubjects([newlyCreatedSubjectId])
				} else {
					setSelectedSubjects([])
				}
			} else {
				// If no newly created subject, clear selection
				setSelectedSubjects([])
			}
		} else {
			// If no grade is selected, show no subjects
			setFilteredSubjects([])
			setSelectedSubjects([])
		}
	}, [selectedGrade, allSubjects, newlyCreatedSubjectId])

	const handleSubjectToggle = (subjectId: string) => {
		setSelectedSubjects(prev =>
			prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
		)
	}

	const handleAssignClick = async () => {
		if (!selectedGrade || selectedSubjects.length === 0) {
			toast.warn(t('assignSubjectModal.selectGradeFirst'))
			return
		}

		setIsLoading(true)
		const success = await onAssign(selectedGrade, selectedSubjects)
		setIsLoading(false)

		if (success) {
			setSelectedGrade('')
			setSelectedSubjects([])
			onClose() // Close modal on success
		}
	}

	if (!isOpen) return null

	return (
		<ModalOverlay>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>{t('assignSubjectModal.title')}</ModalTitle>
					<CloseButton onClick={onClose}>
						<FiX />
					</CloseButton>
				</ModalHeader>

				<InfoPanel>
					<InfoIcon>
						<FiInfo />
					</InfoIcon>
					<InfoTextContainer>
						<InfoTitle>{t('assignSubjectModal.whatDoesThis')}</InfoTitle>
						<InfoDescription>{t('assignSubjectModal.description')}</InfoDescription>
					</InfoTextContainer>
				</InfoPanel>

				{error && <div style={{ color: 'red', marginBottom: '1rem' }}>Error: {error}</div>}

				<FormGroup>
					<Label htmlFor='grade'>
						{t('assignSubjectModal.grade')} <span style={{ color: 'red' }}>*</span>
					</Label>
					<Select
						id='grade'
						value={selectedGrade}
						onChange={e => setSelectedGrade(e.target.value)}
						disabled={isLoading}
						required
					>
						<option value='' disabled>
							{t('assignSubjectModal.selectGrade')}
						</option>
						{isLoading && !availableGrades.length ? (
							<option disabled>{t('assignSubjectModal.loadingGrades')}</option>
						) : availableGrades.length > 0 ? (
							availableGrades.map(grade => (
								<option key={grade} value={grade}>
									{t('assignSubjectModal.gradeOption', { grade })}
								</option>
							))
						) : (
							<option disabled>{t('assignSubjectModal.noGradesFound')}</option>
						)}
					</Select>
				</FormGroup>

				<FormGroup>
					<Label>
						{t('assignSubjectModal.subjects')}{' '}
						{selectedGrade
							? t('assignSubjectModal.subjectsForGrade', { grade: selectedGrade })
							: ''}{' '}
						<span style={{ color: 'red' }}>*</span>
					</Label>
					{isLoading && !allSubjects.length ? (
						<LoadingIndicator>{t('assignSubjectModal.loadingSubjects')}</LoadingIndicator>
					) : !selectedGrade ? (
						<div style={{ color: '#6b7280', marginTop: '0.5rem' }}>
							{t('assignSubjectModal.selectGradeFirst')}
						</div>
					) : filteredSubjects.length > 0 ? (
						<SubjectList>
							{filteredSubjects.map(subject => (
								<SubjectItem key={subject.id}>
									<Checkbox
										type='checkbox'
										id={`subject-${subject.id}`}
										checked={selectedSubjects.includes(subject.id)}
										onChange={() => handleSubjectToggle(subject.id)}
										disabled={isLoading}
									/>
									<label
										htmlFor={`subject-${subject.id}`}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											cursor: 'pointer',
										}}
									>
										<SubjectLabel>{subject.name}</SubjectLabel>
										<SubjectCode>{subject.code}</SubjectCode>
									</label>
								</SubjectItem>
							))}
						</SubjectList>
					) : (
						<div style={{ color: '#6b7280', marginTop: '0.5rem' }}>
							{t('assignSubjectModal.noSubjectsFound', { grade: selectedGrade })}
						</div>
					)}
				</FormGroup>

				<ModalFooter>
					<CancelButton onClick={onClose} disabled={isLoading}>
						{t('assignSubjectModal.cancel')}
					</CancelButton>
					<AssignButton
						onClick={handleAssignClick}
						disabled={isLoading || !selectedGrade || selectedSubjects.length === 0}
					>
						{t('assignSubjectModal.assign', { count: selectedSubjects.length })}
					</AssignButton>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	)
}

export default AssignSubjectModal
