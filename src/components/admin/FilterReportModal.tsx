import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FiArrowLeft, FiLoader, FiPlus, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import supabase from '../../config/supabaseClient'
import Dropdown from '../ui/Dropdown'

interface Level {
	id: string
	name: string
}

interface Class {
	id: string
	classname: string
}

interface ClassSelection {
	levelId: string
	classId: string
	levelName?: string
	className?: string
}

interface FilterReportModalProps {
	isOpen: boolean
	onClose: () => void
}

const FilterReportModal: React.FC<FilterReportModalProps> = ({ isOpen, onClose }) => {
	const [levels, setLevels] = useState<Level[]>([])
	const [classes, setClasses] = useState<Record<string, Class[]>>({})
	const [selectedClasses, setSelectedClasses] = useState<ClassSelection[]>([
		{ levelId: '', classId: '' },
	])
	const [loadingLevels, setLoadingLevels] = useState(true)
	const [loadingClasses, setLoadingClasses] = useState<Record<string, boolean>>({})
	const [reportType, setReportType] = useState<'monthly' | 'weekly' | null>(null)
	const [step, setStep] = useState(1) // 1 = class selection, 2 = report type selection
	const navigate = useNavigate()

	useEffect(() => {
		if (isOpen) {
			fetchLevels()
		}
	}, [isOpen])

	const fetchLevels = async () => {
		try {
			setLoadingLevels(true)
			const { data, error } = await supabase.from('levels').select('id, name').order('name')

			if (error) throw error
			setLevels(data || [])
		} catch (error) {
			console.error('Error fetching levels:', error)
			toast.error('Failed to load levels')
		} finally {
			setLoadingLevels(false)
		}
	}

	const fetchClasses = async (levelId: string) => {
		try {
			setLoadingClasses(prev => ({ ...prev, [levelId]: true }))
			const { data, error } = await supabase
				.from('classes')
				.select('id, classname')
				.eq('level_id', levelId)
				.order('classname')

			if (error) throw error
			setClasses(prev => ({ ...prev, [levelId]: data || [] }))
		} catch (error) {
			console.error('Error fetching classes:', error)
			toast.error('Failed to load classes')
		} finally {
			setLoadingClasses(prev => ({ ...prev, [levelId]: false }))
		}
	}

	const handleLevelChange = (levelId: string, index: number) => {
		const newSelections = [...selectedClasses]
		newSelections[index] = { levelId, classId: '' }
		setSelectedClasses(newSelections)

		// Fetch classes for this level if not already fetched
		if (!classes[levelId]) {
			fetchClasses(levelId)
		}
	}

	const handleClassChange = (classId: string, index: number) => {
		const newSelections = [...selectedClasses]
		newSelections[index] = {
			...newSelections[index],
			classId,
			className: classes[newSelections[index].levelId]?.find(c => c.id === classId)?.classname,
			levelName: levels.find(l => l.id === newSelections[index].levelId)?.name,
		}
		setSelectedClasses(newSelections)
	}

	const handleAddClass = () => {
		setSelectedClasses([...selectedClasses, { levelId: '', classId: '' }])
	}

	const handleRemoveClass = (index: number) => {
		if (selectedClasses.length > 1) {
			setSelectedClasses(selectedClasses.filter((_, i) => i !== index))
		}
	}

	const handleGenerateReports = () => {
		setStep(2)
	}

	const handleReportTypeSelect = (type: 'monthly' | 'weekly') => {
		setReportType(type)
	}

	const handleProceed = () => {
		// Prepare selected classes data for the reports page
		const selectedClassesData = selectedClasses
			.filter(selection => selection.levelId && selection.classId)
			.map(selection => ({
				levelId: selection.levelId,
				classId: selection.classId,
				levelName: selection.levelName,
				className: selection.className,
			}))

		// Navigate to reports page with selected classes and report type
		navigate('/admin/daily-attendance/reports', {
			state: {
				selectedClasses: selectedClassesData,
				reportType,
			},
		})

		onClose()
	}

	const handleBackToClassSelection = () => {
		setStep(1)
		setReportType(null)
	}

	// Check if any class is selected more than once
	const isDuplicateSelection = () => {
		const selections = selectedClasses.filter(s => s.classId).map(s => s.classId)
		return selections.length !== new Set(selections).size
	}

	// Check if at least one class is selected
	const isAnyClassSelected = selectedClasses.some(s => s.levelId && s.classId)

	// Check if the "Add a class" button should be enabled
	const canAddClass = selectedClasses.length > 0 && selectedClasses[0].classId !== ''

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<Overlay
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
					>
						<ModalContainer
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 20 }}
							onClick={e => e.stopPropagation()}
						>
							<ModalHeader>
								<HeaderTitle>
									{step === 1 ? 'Select multiple classes to report' : 'Select report type'}
								</HeaderTitle>
								<CloseButton onClick={onClose}>
									<FiX size={20} />
								</CloseButton>
							</ModalHeader>

							<ModalBody>
								{step === 1 ? (
									<>
										{selectedClasses.map((selection, index) => (
											<ClassSelectionRow key={index}>
												<SelectionLabel>
													{index === 0
														? 'Select 1st class'
														: `Select ${index + 1}${getSuffix(index + 1)} class`}
												</SelectionLabel>
												<SelectionControls>
													<DropdownWrapper>
														<Dropdown
															placeholder='Select level'
															options={levels.map(level => ({
																value: level.id,
																label: level.name,
															}))}
															value={selection.levelId}
															onChange={value => handleLevelChange(value, index)}
														/>
													</DropdownWrapper>
													<DropdownWrapper>
														<Dropdown
															placeholder='Select class'
															options={(classes[selection.levelId] || []).map(cls => ({
																value: cls.id,
																label: cls.classname,
															}))}
															value={selection.classId}
															onChange={value => handleClassChange(value, index)}
															disabled={!selection.levelId}
														/>
														{loadingClasses[selection.levelId] && (
															<LoadingIndicator>
																<FiLoader className='spin' size={16} />
															</LoadingIndicator>
														)}
													</DropdownWrapper>
													{index > 0 && (
														<RemoveButton onClick={() => handleRemoveClass(index)}>
															<FiX size={16} />
														</RemoveButton>
													)}
												</SelectionControls>
											</ClassSelectionRow>
										))}

										<ButtonsContainer>
											<AddClassButton
												onClick={handleAddClass}
												disabled={!canAddClass || isDuplicateSelection()}
											>
												<FiPlus size={16} />
												Add a class
											</AddClassButton>

											<GenerateButton
												onClick={handleGenerateReports}
												disabled={!isAnyClassSelected || isDuplicateSelection()}
											>
												Generate reports
											</GenerateButton>
										</ButtonsContainer>

										{isDuplicateSelection() && (
											<ErrorMessage>You cannot select the same class multiple times</ErrorMessage>
										)}
									</>
								) : (
									<ReportTypeSelection>
										<ReportTypeTitle>Select report type</ReportTypeTitle>
										<RadioGroup>
											<RadioOption>
												<RadioInput
													type='radio'
													id='monthly'
													name='reportType'
													checked={reportType === 'monthly'}
													onChange={() => handleReportTypeSelect('monthly')}
												/>
												<RadioLabel htmlFor='monthly'>
													<RadioButton />
													Monthly
												</RadioLabel>
											</RadioOption>
											<RadioOption>
												<RadioInput
													type='radio'
													id='weekly'
													name='reportType'
													checked={reportType === 'weekly'}
													onChange={() => handleReportTypeSelect('weekly')}
												/>
												<RadioLabel htmlFor='weekly'>
													<RadioButton />
													Weekly
												</RadioLabel>
											</RadioOption>
										</RadioGroup>

										<ActionButtonsContainer>
											<BackButton onClick={handleBackToClassSelection}>
												<FiArrowLeft size={16} />
												Back
											</BackButton>
											<ProceedButton onClick={handleProceed} disabled={!reportType}>
												Proceed
											</ProceedButton>
										</ActionButtonsContainer>
									</ReportTypeSelection>
								)}
							</ModalBody>
						</ModalContainer>
					</Overlay>
				</>
			)}
		</AnimatePresence>
	)
}

// Helper function to get the suffix for ordinal numbers
const getSuffix = (num: number): string => {
	if (num >= 11 && num <= 13) return 'th'

	switch (num % 10) {
		case 1:
			return 'st'
		case 2:
			return 'nd'
		case 3:
			return 'rd'
		default:
			return 'th'
	}
}

const Overlay = styled(motion.div)`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
	backdrop-filter: blur(2px);
`

const ModalContainer = styled(motion.div)`
	width: 90%;
	max-width: 700px;
	background-color: white;
	border-radius: 12px;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	z-index: 1000;
	overflow: auto;
`

const ModalHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20px 24px;
	border-bottom: 1px solid #e5e7eb;
`

const HeaderTitle = styled.h3`
	margin: 0;
	font-size: 1.3rem;
	font-weight: 600;
	color: #111827;
`

const CloseButton = styled.button`
	background: none;
	border: none;
	color: #6b7280;
	cursor: pointer;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	transition: all 0.2s;

	&:hover {
		background-color: #f3f4f6;
		color: #111827;
	}
`

const ModalBody = styled.div`
	padding: 28px;
	max-height: 70vh;
	overflow-y: auto;
`

const ClassSelectionRow = styled.div`
	margin-bottom: 28px;
`

const SelectionLabel = styled.div`
	font-size: 1rem;
	font-weight: 500;
	color: #4b5563;
	margin-bottom: 12px;
`

const SelectionControls = styled.div`
	display: flex;
	gap: 16px;
	align-items: center;
`

const DropdownWrapper = styled.div`
	flex: 1;
	position: relative;
`

const LoadingIndicator = styled.div`
	position: absolute;
	right: 12px;
	top: 50%;
	transform: translateY(-50%);
	color: #6b7280;

	.spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
`

const RemoveButton = styled.button`
	width: 36px;
	height: 36px;
	border-radius: 50%;
	border: none;
	background-color: #f3f4f6;
	color: #6b7280;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	flex-shrink: 0;

	&:hover {
		background-color: #e5e7eb;
		color: #4b5563;
	}
`

const ButtonsContainer = styled.div`
	display: flex;
	justify-content: space-between;
	margin-top: 16px;
`

const AddClassButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	background: none;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	padding: 8px 16px;
	font-size: 0.9rem;
	color: #4b5563;
	cursor: pointer;
	transition: all 0.2s;

	&:hover:not(:disabled) {
		background-color: #f9fafb;
		border-color: #d1d5db;
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`

const GenerateButton = styled.button`
	background-color: #0ea5e9;
	color: white;
	border: none;
	border-radius: 6px;
	padding: 8px 16px;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover:not(:disabled) {
		background-color: #0284c7;
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`

const ErrorMessage = styled.div`
	color: #ef4444;
	font-size: 0.85rem;
	margin-top: 12px;
	text-align: center;
`

const ReportTypeSelection = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20px 0;
`

const ReportTypeTitle = styled.h4`
	font-size: 1.2rem;
	font-weight: 500;
	margin-bottom: 32px;
	color: #111827;
`

const RadioGroup = styled.div`
	display: flex;
	gap: 40px;
	margin-bottom: 40px;
`

const RadioOption = styled.div`
	display: flex;
	align-items: center;
`

const RadioInput = styled.input`
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
`

const RadioLabel = styled.label`
	display: flex;
	align-items: center;
	font-size: 1.1rem;
	color: #4b5563;
	cursor: pointer;

	${RadioInput}:checked + & {
		color: #111827;
		font-weight: 500;
	}
`

const RadioButton = styled.span`
	position: relative;
	display: inline-block;
	width: 22px;
	height: 22px;
	margin-right: 10px;
	border-radius: 50%;
	border: 2px solid #d1d5db;
	transition: all 0.2s;

	&::after {
		content: '';
		position: absolute;
		display: none;
		top: 4px;
		left: 4px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: #0ea5e9;
		transition: all 0.2s;
	}

	${RadioInput}:checked + ${RadioLabel} & {
		border-color: #0ea5e9;

		&::after {
			display: block;
		}
	}
`

const ActionButtonsContainer = styled.div`
	display: flex;
	gap: 16px;
	justify-content: center;
	width: 100%;
`

const BackButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	background: none;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	padding: 10px 20px;
	font-size: 1rem;
	color: #4b5563;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: #f9fafb;
		border-color: #9ca3af;
		color: #111827;
	}
`

const ProceedButton = styled.button`
	background-color: #0ea5e9;
	color: white;
	border: none;
	border-radius: 6px;
	padding: 10px 24px;
	font-size: 1rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover:not(:disabled) {
		background-color: #0284c7;
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`

export default FilterReportModal
