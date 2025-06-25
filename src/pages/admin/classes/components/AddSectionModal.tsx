import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiPlus, FiX } from 'react-icons/fi'
import styled from 'styled-components'

interface AddSectionModalProps {
	isOpen: boolean
	onClose: () => void
	onAddSection: (sectionName: string, room: string) => void
	grade: string
	suggestedName: string
	suggestedRoom: string
}

const Modal = styled.div<{ $isOpen: boolean }>`
	display: ${props => (props.$isOpen ? 'flex' : 'none')};
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	align-items: center;
	justify-content: center;
`

const ModalContent = styled.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	width: 90%;
	max-width: 500px;
	max-height: 90vh;
	overflow-y: auto;
	position: relative;
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
`

const ModalTitle = styled.h2`
	color: #111827;
	font-size: 1.5rem;
	font-weight: 600;
	margin: 0;
`

const CloseButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	color: #6b7280;
	padding: 0.5rem;
	border-radius: 0.375rem;
	transition: all 0.2s;

	&:hover {
		background-color: #f3f4f6;
		color: #374151;
	}
`

const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`

const Label = styled.label`
	font-weight: 500;
	color: #374151;
	font-size: 0.875rem;
`

const Input = styled.input`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 1rem;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`

const ButtonGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
	margin-top: 1.5rem;
`

const Button = styled.button<{ $variant: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.375rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	border: 1px solid;
	display: flex;
	align-items: center;
	gap: 0.5rem;

	${props =>
		props.$variant === 'primary'
			? `
		background-color: #3b82f6;
		color: white;
		border-color: #3b82f6;

		&:hover {
			background-color: #2563eb;
		}

		&:disabled {
			background-color: #9ca3af;
			border-color: #9ca3af;
			cursor: not-allowed;
		}
	`
			: `
		background-color: white;
		color: #374151;
		border-color: #d1d5db;

		&:hover {
			background-color: #f9fafb;
		}
	`}
`

const AddSectionModal: React.FC<AddSectionModalProps> = ({
	isOpen,
	onClose,
	onAddSection,
	grade,
	suggestedName,
	suggestedRoom,
}) => {
	const { t } = useTranslation()
	const [sectionName, setSectionName] = useState(suggestedName)
	const [room, setRoom] = useState(suggestedRoom)

	// Update state when suggested values change
	React.useEffect(() => {
		setSectionName(suggestedName)
		setRoom(suggestedRoom)
	}, [suggestedName, suggestedRoom])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!sectionName.trim()) {
			return
		}
		onAddSection(sectionName.trim(), room.trim())
		setSectionName('')
		setRoom('')
	}

	const handleClose = () => {
		setSectionName('')
		setRoom('')
		onClose()
	}

	if (!isOpen) return null

	return (
		<Modal $isOpen={isOpen} onClick={handleClose}>
			<ModalContent onClick={e => e.stopPropagation()}>
				<ModalHeader>
					<ModalTitle>{t('classes.createNewSection')}</ModalTitle>
					<CloseButton onClick={handleClose}>
						<FiX size={20} />
					</CloseButton>
				</ModalHeader>

				<Form onSubmit={handleSubmit}>
					<FormGroup>
						<Label htmlFor='sectionName'>{t('classes.sectionName')}</Label>
						<Input
							id='sectionName'
							type='text'
							value={sectionName}
							onChange={e => setSectionName(e.target.value)}
							placeholder={`e.g., ${suggestedName}`}
							required
						/>
					</FormGroup>

					<FormGroup>
						<Label htmlFor='room'>{t('classes.room')}</Label>
						<Input
							id='room'
							type='text'
							value={room}
							onChange={e => setRoom(e.target.value)}
							placeholder={`e.g., ${suggestedRoom}`}
						/>
					</FormGroup>

					<ButtonGroup>
						<Button type='button' $variant='secondary' onClick={handleClose}>
							{t('common.cancel')}
						</Button>
						<Button type='submit' $variant='primary' disabled={!sectionName.trim()}>
							<FiPlus size={16} />
							{t('classes.createSection')}
						</Button>
					</ButtonGroup>
				</Form>
			</ModalContent>
		</Modal>
	)
}

export default AddSectionModal
