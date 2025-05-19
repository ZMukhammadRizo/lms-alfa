import React from 'react'
import styled, { keyframes } from 'styled-components'

interface LoadingScreenProps {
	message?: string
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
	return (
		<LoadingContainer>
			<SpinnerContainer>
				<Spinner />
			</SpinnerContainer>
			<LoadingMessage>{message}</LoadingMessage>
		</LoadingContainer>
	)
}

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100vh;
	width: 100%;
	background-color: ${props => props.theme.colors.background.primary};
`

const SpinnerContainer = styled.div`
	width: 60px;
	height: 60px;
	margin-bottom: 1.5rem;
`

const rotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const Spinner = styled.div`
	width: 100%;
	height: 100%;
	border: 4px solid ${props => props.theme.colors.border.light};
	border-top: 4px solid ${props => props.theme.colors.primary[500]};
	border-radius: 50%;
	animation: ${rotate} 1.5s linear infinite;
`

const LoadingMessage = styled.p`
	font-size: 1.25rem;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
	padding: 0;
	text-align: center;
`

export default LoadingScreen
