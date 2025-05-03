import React from 'react'
import 'styled-components'
import styled from 'styled-components'

// Add theme type declaration
declare module 'styled-components' {
	export interface DefaultTheme {
		colors: {
			primary: Record<number, string>
			secondary: Record<number, string>
			danger: Record<number, string>
			success: Record<number, string>
			warning: Record<number, string>
			neutral: Record<number, string>
			background: {
				lighter: string
				light: string
				main: string
				dark: string
				hover: string
				secondary: string
			}
			text: {
				primary: string
				secondary: string
			}
			border: {
				light: string
			}
		}
		zIndices: {
			docked: number
		}
	}
}

interface ErrorMessageProps {
	message: string
	onRetry?: () => void
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
	return (
		<ErrorContainer>
			<ErrorContent>
				<ErrorIcon>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						width='20'
						height='20'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
					>
						<circle cx='12' cy='12' r='10'></circle>
						<line x1='12' y1='8' x2='12' y2='12'></line>
						<line x1='12' y1='16' x2='12.01' y2='16'></line>
					</svg>
				</ErrorIcon>
				<ErrorText>{message}</ErrorText>
			</ErrorContent>

			{onRetry && (
				<RetryButton onClick={onRetry}>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						width='16'
						height='16'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
					>
						<path d='M21 2v6h-6'></path>
						<path d='M3 12a9 9 0 0 1 15-6.7L21 8'></path>
						<path d='M3 22v-6h6'></path>
						<path d='M21 12a9 9 0 0 1-15 6.7L3 16'></path>
					</svg>
					Retry
				</RetryButton>
			)}
		</ErrorContainer>
	)
}

const ErrorContainer = styled.div`
	background-color: ${props => props.theme.colors.danger[50]};
	border: 1px solid ${props => props.theme.colors.danger[200]};
	border-radius: 6px;
	padding: 12px 16px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
`

const ErrorContent = styled.div`
	display: flex;
	align-items: center;
`

const ErrorIcon = styled.div`
	color: ${props => props.theme.colors.danger[500]};
	margin-right: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
`

const ErrorText = styled.div`
	color: ${props => props.theme.colors.danger[700]};
	font-size: 0.9rem;
`

const RetryButton = styled.button`
	display: flex;
	align-items: center;
	gap: 6px;
	background-color: white;
	border: 1px solid ${props => props.theme.colors.danger[200]};
	color: ${props => props.theme.colors.danger[600]};
	padding: 6px 12px;
	border-radius: 4px;
	font-size: 0.8rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.danger[50]};
		border-color: ${props => props.theme.colors.danger[300]};
	}

	svg {
		transition: transform 0.3s ease;
	}

	&:hover svg {
		transform: rotate(180deg);
	}
`

// Export additional styled components for teacher panel
export const ContentCard = styled.div`
	background-color: white;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	padding: 16px;
	margin-bottom: 16px;
`

export const ContentHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
	padding-bottom: 12px;
	border-bottom: 1px solid ${props => props.theme.colors.border.light};
`

export const Title = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
`

export const SearchInput = styled.div`
	display: flex;
	align-items: center;
	background-color: ${props => props.theme.colors.background.lighter};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 6px;
	padding: 6px 12px;
	width: 100%;
	max-width: 300px;

	input {
		border: none;
		background: transparent;
		margin-left: 8px;
		font-size: 0.9rem;
		width: 100%;
		outline: none;
	}

	svg {
		color: ${props => props.theme.colors.text.secondary};
	}
`

export const ActionButton = styled.button`
	display: flex;
	align-items: center;
	gap: 6px;
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	border: none;
	border-radius: 6px;
	padding: 8px 16px;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.primary[600]};
	}

	&:disabled {
		background-color: ${props => props.theme.colors.neutral[300]};
		cursor: not-allowed;
	}
`
