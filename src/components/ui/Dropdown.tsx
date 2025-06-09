import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'

interface DropdownOption {
	value: string
	label: string
}

interface DropdownProps {
	label?: string
	placeholder?: string
	options: DropdownOption[] | string[]
	value?: string
	onChange?: (value: string) => void
	error?: string
	disabled?: boolean
}

const Dropdown: React.FC<DropdownProps> = ({
	label,
	placeholder = 'Select an option',
	options,
	value,
	onChange,
	error,
	disabled = false,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)

	// Format options to consistent structure
	const formattedOptions: DropdownOption[] = options.map(option =>
		typeof option === 'string' ? { value: option, label: option } : option
	)

	// Find selected option
	const selectedOption = value ? formattedOptions.find(option => option.value === value) : undefined

	// Toggle dropdown
	const handleToggle = () => {
		if (!disabled) {
			setIsOpen(prev => !prev)
		}
	}

	// Select option
	const handleSelect = (optionValue: string) => {
		if (onChange) {
			onChange(optionValue)
		}
		setIsOpen(false)
	}

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	return (
		<DropdownContainer ref={dropdownRef}>
			{label && <DropdownLabel>{label}</DropdownLabel>}
			<DropdownControl
				$isOpen={isOpen}
				$hasError={!!error}
				$disabled={disabled}
				onClick={handleToggle}
			>
				<SelectedValue $hasValue={!!selectedOption} $disabled={disabled}>
					{selectedOption ? selectedOption.label : placeholder}
				</SelectedValue>
				<ArrowIcon $isOpen={isOpen} $disabled={disabled}>
					<ChevronDown size={18} />
				</ArrowIcon>
			</DropdownControl>

			{isOpen && !disabled && (
				<DropdownMenu>
					{formattedOptions.length > 0 ? (
						formattedOptions.map(option => (
							<DropdownItem
								key={option.value}
								onClick={() => handleSelect(option.value)}
								$isSelected={option.value === value}
							>
								{option.label}
							</DropdownItem>
						))
					) : (
						<EmptyMessage>No options available</EmptyMessage>
					)}
				</DropdownMenu>
			)}

			{error && <ErrorMessage>{error}</ErrorMessage>}
		</DropdownContainer>
	)
}

const DropdownContainer = styled.div`
	position: relative;
	width: 100%;
`

const DropdownLabel = styled.label`
	display: block;
	margin-bottom: 8px;
	font-size: 14px;
	font-weight: 500;
	color: ${({ theme }) => theme.colors.text || '#1f2937'};
`

interface DropdownControlProps {
	$isOpen: boolean
	$hasError: boolean
	$disabled: boolean
}

const DropdownControl = styled.div<DropdownControlProps>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	font-size: 15px;
	background-color: ${({ theme, $disabled }) =>
		$disabled ? theme.colors.neutral[100] || '#f3f4f6' : theme.colors.card || 'white'};
	border: 1px solid
		${({ $hasError, $disabled, theme }) =>
			$hasError
				? theme.colors.danger[500] || '#ef4444'
				: $disabled
				? theme.colors.neutral[300] || '#d1d5db'
				: theme.colors.border || '#e5e7eb'};
	border-radius: 8px;
	cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s ease;
	height: 48px;

	${({ $isOpen, $hasError, $disabled, theme }) =>
		$isOpen &&
		!$disabled &&
		`
    border-color: ${
			$hasError ? theme.colors.danger[500] || '#ef4444' : theme.colors.primary[500] || '#0ea5e9'
		};
    box-shadow: 0 0 0 3px ${
			$hasError
				? theme.colors.danger[100] + '40' || '#fee2e240'
				: theme.colors.primary[100] + '40' || '#e0f2fe40'
		};
  `}

	&:hover {
		border-color: ${({ $hasError, $disabled, theme }) =>
			$hasError
				? theme.colors.danger[500] || '#ef4444'
				: $disabled
				? theme.colors.neutral[300] || '#d1d5db'
				: theme.colors.neutral[400] || '#9ca3af'};
	}
`

interface SelectedValueProps {
	$hasValue: boolean
	$disabled: boolean
}

const SelectedValue = styled.div<SelectedValueProps>`
	color: ${({ $hasValue, $disabled, theme }) =>
		$disabled
			? theme.colors.neutral[500] || '#6b7280'
			: $hasValue
			? theme.colors.text || '#1f2937'
			: theme.colors.neutral[500] || '#6b7280'};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

interface ArrowIconProps {
	$isOpen: boolean
	$disabled: boolean
}

const ArrowIcon = styled.div<ArrowIconProps>`
	color: ${({ $disabled, theme }) =>
		$disabled ? theme.colors.neutral[400] || '#9ca3af' : theme.colors.neutral[500] || '#6b7280'};
	transform: ${({ $isOpen }) => ($isOpen ? 'rotate(180deg)' : 'rotate(0)')};
	transition: transform 0.3s ease;
	display: flex;
	align-items: center;
	justify-content: center;
`

const DropdownMenu = styled.div`
	position: absolute;
	top: calc(100% + 6px);
	left: 0;
	width: 100%;
	background-color: ${({ theme }) => theme.colors.background || 'white'};
	border: 1px solid ${({ theme }) => theme.colors.border || '#e5e7eb'};
	border-radius: 8px;
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	z-index: 20;
	max-height: 250px;
	overflow-y: auto;
	animation: dropdownFadeIn 0.2s ease;

	@keyframes dropdownFadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
`

const DropdownItem = styled.div<{ $isSelected: boolean }>`
	padding: 12px 16px;
	font-size: 15px;
	cursor: pointer;
	transition: all 0.15s ease;

	background-color: ${({ $isSelected, theme }) =>
		$isSelected ? theme.colors.primary[50] || '#e0f2fe' : theme.colors.background || 'white'};
	color: ${({ $isSelected, theme }) =>
		$isSelected ? theme.colors.primary[700] || '#0369a1' : theme.colors.text || '#1f2937'};

	&:hover {
		background-color: ${({ $isSelected, theme }) =>
			$isSelected
				? theme.colors.primary[100] || '#bae6fd'
				: theme.colors.neutral[100] || '#f3f4f6'};
	}

	&:first-child {
		border-top-left-radius: 8px;
		border-top-right-radius: 8px;
	}

	&:last-child {
		border-bottom-left-radius: 8px;
		border-bottom-right-radius: 8px;
	}
`

const EmptyMessage = styled.div`
	padding: 12px 16px;
	font-size: 14px;
	color: ${({ theme }) => theme.colors.neutral[500] || '#6b7280'};
	text-align: center;
	font-style: italic;
`

const ErrorMessage = styled.div`
	margin-top: 6px;
	font-size: 13px;
	color: ${({ theme }) => theme.colors.danger[500] || '#ef4444'};
`

export default Dropdown
