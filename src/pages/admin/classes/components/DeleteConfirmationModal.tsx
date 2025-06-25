import React from 'react'
import { useTranslation } from 'react-i18next'
import { FiAlertTriangle, FiTrash2, FiX } from 'react-icons/fi'
import styled from 'styled-components'

interface DeleteConfirmationModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	itemName: string
	message?: string
	title?: string
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
	max-width: 400px;
	position: relative;
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 1rem;
`

const HeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`

const IconContainer = styled.div`
	background-color: #fef2f2;
	color: #dc2626;
	padding: 0.75rem;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
`

const ModalTitle = styled.h2`
	color: #111827;
	font-size: 1.25rem;
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

const ModalMessage = styled.p`
	color: #6b7280;
	font-size: 0.875rem;
	line-height: 1.5;
	margin: 0 0 1.5rem 0;
`

const ItemName = styled.span`
	font-weight: 600;
	color: #374151;
`

const ButtonGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
`

const Button = styled.button<{ $variant: 'danger' | 'secondary' }>`
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
		props.$variant === 'danger'
			? `
		background-color: #dc2626;
		color: white;
		border-color: #dc2626;

		&:hover {
			background-color: #b91c1c;
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

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	itemName,
	message,
	title,
}) => {
	const { t } = useTranslation()

	const handleConfirm = () => {
		onConfirm()
		onClose()
	}

	if (!isOpen) return null

	return (
		<Modal $isOpen={isOpen} onClick={onClose}>
			<ModalContent onClick={e => e.stopPropagation()}>
				<ModalHeader>
					<HeaderContent>
						<IconContainer>
							<FiAlertTriangle size={20} />
						</IconContainer>
						<ModalTitle>{title || t('common.confirmDelete')}</ModalTitle>
					</HeaderContent>
					<CloseButton onClick={onClose}>
						<FiX size={20} />
					</CloseButton>
				</ModalHeader>

				<ModalMessage>
					{message || (
						<>
							{t('common.deleteConfirmMessage')} <ItemName>"{itemName}"</ItemName>?{' '}
							{t('common.actionCannotBeUndone')}
						</>
					)}
				</ModalMessage>

				<ButtonGroup>
					<Button type='button' $variant='secondary' onClick={onClose}>
						{t('common.cancel')}
					</Button>
					<Button type='button' $variant='danger' onClick={handleConfirm}>
						<FiTrash2 size={16} />
						{t('common.delete')}
					</Button>
				</ButtonGroup>
			</ModalContent>
		</Modal>
	)
}

export default DeleteConfirmationModal
